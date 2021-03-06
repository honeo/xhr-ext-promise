# xhr-ext-promise
[honeo/xhr-ext-promise](https://github.com/honeo/xhr-ext-promise)  
[xhr-ext-promise](https://www.npmjs.com/package/xhr-ext-promise)

## なにこれ
よくあるPromise対応のXHRラッパー。  
ブラウザ用、今んとこGetとPostのみ。

## 使い方
```sh
$ npm i xhr-ext-promise
```
```js
const XEP = require('xhr-ext-promise');
XEP.method({...}).then( (doc)=>{
	console.log(doc); // document
});
```

## Method
全てPromiseインスタンスを返して、取得したdocumentを引数にresolve()する。  
取得したdocumentに　body, head, domain, URL プロパティがない場合は付与する。
```js
XHP.getDocument({url: 'URL or PATH'});
XEP.formToDocument({form: HTMLFormDocument});
XEP.postToDocument({action: 'URL or PATH'});

// option example
XEP.method({
	onprogress(e){
		console.log(e); // Object{...}
	},
	//method: string,
	user: string, 		// default=''
	password: string, 	// default=''
	timeout: 0, 		// default=XEP.timeout_method
	interval: 0, 		// default=XEP.interval_method
	send: 'hoge=fuga&sega=newhard', // default=null
	withCredentials: boolean //default=false
});
```

## Properties
### .interval_get, .interval_post
それぞれ前回get, postから次回までに空けるmsの標準値。
### .timeout_get, timeout_post
それぞれget, postに設定するタイムアウトの標準値。
