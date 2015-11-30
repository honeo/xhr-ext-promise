'use strict';

const console = {
	log(){}
}

/*
	delay_method: 同method同士のインターバルms
		interval_post:300 なら2回目のPostは1回目から300ms空ける
	timeout_method: rejectするms、0で無効
*/
const XHP = {
	interval_get: 0,
	interval_post: 0,
	timeout_get: 0,
	timeout_post: 0,
}

/*
	前回の送受信完了時間メモ
		.method: Date.now()返り値; で保存する。
		.set('ｍethod');
*/
const previousTime = {
	// 前回送信時間メモ
	set(method){
		const time = Date.now();
		console.log('previousTime.set', method, time);
		this[method] = time;
	}
}

/*
	前回の送信時間とディレイ設定値を比べて最適な待ち時間を返す
		ログがなければ0(ms)
		あれば前回+intervalと現在を比較
*/
function getSendIntervalTime({method, interval}){
	const now = Date.now();
	const previous = previousTime[method];
	const result = (function(){
		if( previous ){
			const delay = interval || XHP[`delay_${method}`] || 0;
			const line = delay + previous;
			return line < now ?
				0:
				line - now;
		}else{
			return 0;
		}
	}());
	console.log('getSendDelayTime', method, result);
	return result;
}

/*
	XHR.responseType='document'のサポート有無
	[XMLHttpRequest の HTML パース処理 | MDN](https://developer.mozilla.org/ja/docs/HTML_in_XMLHttpRequest)
		の結果をキャッシュするようにしたやつ
*/
const hasResponseTypeDocument = (function(){
	let result;
	return function(){
		if( result===undefined ){
			console.log('hasResponseTypeDocument: init');
			if( !XMLHttpRequest ){
				result = false;
			}else{
				const xhr = new XMLHttpRequest();
				xhr.open('GET', location.href, false);
				try{
					xhr.responseType = 'document';
					result = false;
				}catch(e){
					result = true;
				}
			}
		}else{
			console.log('hasResponseTypeDocument: cache');
		}
		return result;
	}
}());

/*
	responseText => HTMLDocumentElement
		documentを返す系が共通で使う
		DOMParserの実装が古いもの向けに .body, .head, .domain, .URL等をを付与
		urlがパスだけならlocationから拝借する
	example:
		const resultDocument = stringToDocument({
			responseText: xhr.responseText,
			url: 'http://www.example.com/'
		});
*/
function stringToDocument({
	responseText, url
}){
	const parser = new DOMParser();
	const doc_result = parser.parseFromString(responseText, 'text/html');
	if( doc_result.body===undefined ){
		doc_result.body = doc_result.getElementsByTagName('body')[0];
	}
	if( doc_result.head===undefined ){
		doc_result.head = doc_result.getElementsByTagName('head')[0];
	}
	const isURL = /^\w+\:\/\//.test(url);
	const URL = isURL ?
		url:
		location.href;
	const domain = isURL ?
		url.match(/^\w+\:\/\/([^/]+)\//):
		location.hostname;
	if( doc_result.domain===undefined ){
		doc_result.domain = domain;
	}
	if( doc_result.URL===undefined ){
		doc_result.URL = URL;
	}
	console.log('stringToDocument', arguments, doc_result);
	return doc_result;
}

/*
	progressイベント付けるやつ
*/
function setOnProgress({
	xhr, callback
}){
	console.log('setOnProgress', xhr, callback);
	typeof callback==='function' && xhr.addEventListener('progress', (e)=>{
		console.log('onprogress', e);
		e.lengthComputable && callback.call(xhr, {
			target: xhr,
			timestamp: Date.now(),
			status: e.loaded/e.total*100|0
		});
	}, false);
}


/*
	引数.urlのページをdocumentで取得する
*/
XHP.getDocument = function({
	url, onprogress, method='get', user='', password='', send=null, timeout=XHP.timeout_get, interval=XHP.interval_get
}){
	console.log('getDocument', arguments);
	return new Promise( (resolve, reject)=>{
		const xhr = new XMLHttpRequest();
		xhr.timeout = timeout;
		if( hasResponseTypeDocument() ){
			xhr.responseType = 'document';
		}
		xhr.open(method, url, true, user, password);
		xhr.onreadystatechange = ()=>{
			if(xhr.readyState===4 && xhr.status===200){
				previousTime.set(method);
				const doc_result = hasResponseTypeDocument() ?
					xhr.response:
					stringToDocument({
						responseText: xhr.responseText,
						url
					});
				console.log('getDocument', 'resolve', doc_result);
				resolve(doc_result);
			}
		}
		xhr.onerror = (e)=>{
			console.log('getDocument', 'reject', e);
			previousTime.set(method);
			reject(e);
		}
		// progressEvent
		setOnProgress({
			xhr,
			callback: onprogress
		});
		setTimeout( ()=>{
			xhr.send(send);
		}, getSendIntervalTime({method, interval}) );
	});
}

/*
	formからpostして返り値をdocumentとして取得する
	例：
		const promise = formToDocument({form: formElement});
*/
XHP.formToDocument = function({
	form, onprogress, method='post', user='', password='', timeout=XHP.timeout_post, interval=XHP.interval_post
}){
	console.log('formToDocument', arguments);
	return new Promise( (resolve,reject)=>{
		const xhr = new XMLHttpRequest();
		xhr.timeout = timeout;
		if( hasResponseTypeDocument() ){
			xhr.responseType = 'document';
		}
		xhr.open(method, form.action, true, user, password);
		xhr.onreadystatechange = ()=>{
			if(xhr.readyState===4 && xhr.status===200){
				previousTime.set(method);
				const doc_result = hasResponseTypeDocument() ?
					xhr.response:
					stringToDocument({
						responseText: xhr.responseText,
						url: form.action
					});
				console.log('formToDocument', 'resolve', doc_result);
				resolve(doc_result);
			}
		}
		xhr.onerror = (e)=>{
			console.log('formToDocument', 'reject', e);
			previousTime.set(method);
			reject(e);
		}
		// progressEvent
		setOnProgress({
			xhr,
			callback: onprogress
		});
		setTimeout( ()=>{
			xhr.send( new FormData(form) );
		}, getSendIntervalTime({method, interval}) );
	});
}

/*
	postの返り値をdocumentとして取得する
*/
XHP.postToDocument = function({
	action, onprogress, method='post', user='', password='', send=null, timeout=XHP.timeout_post, interval=XHP.interval_post
}){
	console.log('postToDocument', arguments);
	return new Promise( (resolve,reject)=>{
		const xhr = new XMLHttpRequest();
		xhr.timeout = timeout;
		if( hasResponseTypeDocument() ){
			xhr.responseType = 'document';
		}
		xhr.open(method, action, true, user, password);
		xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		xhr.onreadystatechange = ()=>{
			if(xhr.readyState===4 && xhr.status===200){
				previousTime.set(method);
				const doc_result = hasResponseTypeDocument() ?
					xhr.response:
					stringToDocument({
						responseText: xhr.responseText,
						url: action
					});
				console.log('postToDocument', 'resolve', doc_result);
				resolve(doc_result);
			}
		}
		xhr.onerror = (e)=>{
			console.log('postToDocument', 'reject', e);
			previousTime.set(method);
			reject(e);
		}
		// progressEvent
		setOnProgress({
			xhr,
			callback: onprogress
		});
		setTimeout( ()=>{
			xhr.send( send );
		}, getSendIntervalTime({method, interval}) );
	});
}


export default XHP;
