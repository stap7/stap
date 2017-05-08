/*base template for STAP visualization
	
TODO:
	high priority:
		
	bugs:
		account for vertical progress bars for tics, clicks
		cancel one tween when starting a new one
		scroll:0 doesn't work on maindiv
	features:
		x of N number format
		options ., ins, @
		scrollH (including autoscroll)
		path options
		ani options
		esu
		table
	futureproof:
		account for multi-touch, e.g.
			two irrespective mouseups can occur which would mess with select:.5

*/



var OPTIONS=new Set([".","S","T","R","onsubedit"]),
	TYPES=new Set();

var REQUIRED={
	"T":[
		"https://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/TweenLite.min.js",
		// "https://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/plugins/AttrPlugin.min.js",
		// "https://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/plugins/CSSPlugin.min.js",
		"https://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/plugins/ColorPropsPlugin.min.js",
		"https://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/plugins/TextPlugin.min.js",
		"TweenLite.defaultEase = Linear.easeNone;"
	],
	"ease":"https://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/easing/EasePack.min.js",
	"easeout":"https://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/easing/EasePack.min.js",
	"pwd":"https://cdnjs.cloudflare.com/ajax/libs/js-sha256/0.3.2/sha256.min.js",
};

var ANIMATABLE={'x':'left','y':'top','w':'width','h':'height','r':'borderRadius','bg':'backgroundColor','bd':'borderStyle','bdw':'borderWidth','bdc':'borderColor','pad':'padding','col':'color','rot':'rotation'};

var COMPATIBLE=new Proxy({
		path:new Set(['string','object']),
	},
	{get:function(t,key){
		return (key in t)?t[key]:EMPTYSET;
	}});

var COLOROPTIONS=new Set(['bg','col','bdc']);

var EASE={0:'Power0',1:'Power1',2:'Power2',3:'Power3',4:'Power4',back:'Back',elastic:'Elastic',bounce:'Bounce'};



//////////////////////////////////////////////////////////////////////////////
// helper functions
//var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
var EMPTYSET=new Set();
var HEAD = document.getElementsByTagName('head')[0];
var SELECTION = window.getSelection();
var RANGE = document.createRange();
function pass(){}
function self(o){return o;}
function round2(n,r){return (Math.round(n/r)*r);}
function ceil2(n,r){return (Math.ceil(n/r)*r);}
Date.prototype.toString=function(format){
	function twodigit(x){return x<10?'0'+x:x;}
	function threedigit(x){return x<10?'00'+x:(x<100?'0'+x:x);}
	var s="";
	if(format.includes("Y"))s+=this.getUTCFullYear();
	if(format.includes("M"))s+=(s.length?"-":"")+twodigit(this.getUTCMonth()+1);
	if(format.includes("D"))s+=(s.length?"-":"")+twodigit(this.getUTCDate());
	if(format.includes("d"))s+=(s.length?" ":"")+["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][this.getUTCDay()];
	if(format.includes("h"))s+=(s.length?" ":"")+twodigit(this.getUTCHours());
	if(format.includes("m"))s+=(s.length?(format.includes("h")?":":" "):"")+twodigit(this.getUTCMinutes());
	if(format.includes("s"))s+=(s.length?":":"")+twodigit(this.getUTCSeconds());
	if(format.includes("."))s+=(s.length?".":"")+threedigit(this.getUTCMilliseconds());
	return s;
};
if(String.prototype.startsWith===undefined)String.prototype.startsWith=function(prefix){return this.slice(0,prefix.length)===prefix;};
if(String.prototype.endsWith===undefined)String.prototype.endsWith=function(suffix){return this.slice(this.length-suffix.length)===suffix;};
String.prototype.replaceAll=function(search,replacement){return this.split(search).join(replacement);};
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}
function describeArc(x, y, radius, startAngle, endAngle, start){
    var startingPt = polarToCartesian(x, y, radius, endAngle);
    var endingPt = polarToCartesian(x, y, radius, startAngle);
    var arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
    var d = [
        start?"M":"L", startingPt.x, startingPt.y, 
        "A", radius, radius, 0, arcSweep, 0, endingPt.x, endingPt.y
    ].join(" ");
    return d+' ';       
}
function objectify(o){
	var r={};
	for(var key in o)
		if(typeof(o[key])=='object')r[key]=objectify(o[key]);
		else r[key]=o[key];
	return r;
}
function select(e){
	RANGE.selectNodeContents(e);
	SELECTION.removeAllRanges();
	SELECTION.addRange(RANGE);
}
function inHead(type,thing,url){
	var x=document.getElementsByTagName(type);
	for(var i=0;i<x.length;++i){
		if(x[i][thing]==url)return true;
	}
}
function loadURLs(urls, callback, onerror, type){
	var url, onload, fileref;
	if(urls.constructor===Array){url=urls[0];urls=urls.slice(1);}
	else{url=urls;urls=[];}
	if(urls.length)onload=function(){loadURLs(urls,callback,onerror,type);};
	else onload=callback||pass;
	if(url && (url.endsWith(".js")||type==='js') && !inHead('script','src',url)){       //if filename is a external JavaScript file
		fileref=document.createElement('script');
		fileref.setAttribute("type","text/javascript");
		fileref.setAttribute("src", url);
	}else if(url && (url.endsWith(".css")||type==='css') && !inHead('link','href',url)){ //if filename is an external CSS file
		fileref=document.createElement("link");
		fileref.setAttribute("rel", "stylesheet");
		fileref.setAttribute("type", "text/css");
		fileref.setAttribute("href", url);
	}else{
		try{eval(url);}
		catch(e){console.log('not sure how to handle '+url);}
		onload();
		return;
	}
	fileref.onreadystatechange=onload;
	fileref.onload=onload;
	fileref.onerror=onerror||pass;
	HEAD.appendChild(fileref);
}
function isObj(o){return Object.prototype.toString.call(o)==="[object Object]";}
function getElementIndex(c){
	var i = 0;
	while( (c = c.previousSibling) != null ) ++i;
	return i;
}
var HASHTAGS = new RegExp('#([^\\s]*)','g');
var SVGNS="http://www.w3.org/2000/svg";
function keepNumeric(e){
	var numtxt=e.target.innerText.match(/-?\.?\d+.*/)[0];
	e.target.innerText=parseFloat(numtxt)+(numtxt.endsWith('.')?'.':'');
}
//////////////////////////////////////////////////////////////////////////////





var ws,startTime,maindiv,ipAddress,markerdefs,stylesheet,tables=0,focused=false,
	taskOptions={},msgTimeouts={},txtReplace={},
	updateContainers=new Set();


//////////////////////////////////////////////////////////////////////////////
// for client:ip option
function gotip(o){
	ipAddress=o.ip;
	sendAction(null,{client:{ip:ipAddress}});
}

//////////////////////////////////////////////////////////////////////////////
// for replace option
function replaceShorthand(s){
	for(var shorthand in txtReplace){
		s=s.replaceAll(shorthand,txtReplace[shorthand]);
	}
	return s;
}

//////////////////////////////////////////////////////////////////////////////
// for S option
function waitTime(t){return t-ums();}

//////////////////////////////////////////////////////////////////////////////
// for T option
function getEaseSpec(options){
	var easeSpec=Linear.easeNone;
	if(typeof(options)==='object'){
		var ease=Linear;
		if(options.ease)ease=window[EASE[options.ease]];
		if(options.easeout==-1)easeSpec=ease.easeIn;
		else if(options.easeout==0)easeSpec=ease.easeInOut;
		else easeSpec=ease.easeOut;
	}
	return easeSpec;
}

//////////////////////////////////////////////////////////////////////////////
// for arrow option (path elements)
function initMarkers(){	//create marker definitions
	var style = document.createElement("style");
	style.appendChild(document.createTextNode(""));// WebKit hack
	document.head.appendChild(style);
	markerdefs=document.body.appendChild(document.createElementNS(SVGNS,'svg')).appendChild(document.createElementNS(SVGNS,'defs'));
	markerdefs.parentElement.style.height='0px';
}

function getMarker(type,color){
	var id,d;
	if(type==='arrow' || type==='circle' || type==='square'){
		if(!markerdefs)initMarkers();
		id='marker.'+type+'.'+color;
		if(!document.getElementById(id)){
			var m=markerdefs.appendChild(document.createElementNS(SVGNS,'marker'));
			m.id=id;
			m.setAttribute('orient','auto');
			m.setAttribute('markerUnits','strokeWidth');
			m.setAttribute('refX','1');
			if(type==='arrow'){
				m.setAttribute('viewBox','0 0 10 10');
				m.setAttribute('refY','5');
				m.setAttribute('markerWidth','4');
				m.setAttribute('markerHeight','3');
				d=m.appendChild(document.createElementNS(SVGNS,'path'));
				d.setAttribute('d',"M 0 0 L 10 5 L 0 10 z");
			}else{
				m.setAttribute('refY','1');
				m.setAttribute('markerWidth','2');
				m.setAttribute('markerHeight','2');
				if(type==='square'){
					d=m.appendChild(document.createElementNS(SVGNS,'rect'));
					d.setAttribute('x','0');
					d.setAttribute('y','0');
					d.setAttribute('width','2');
					d.setAttribute('height','2');
				}else if(type==='circle'){
					d=m.appendChild(document.createElementNS(SVGNS,'circle'));
					d.setAttribute('cx','1');
					d.setAttribute('cy','1');
					d.setAttribute('r','1');
				}
			}
			d.setAttribute('fill',color);
		}
		id='url(#'+id+')';
	}
	else id='';
	return id;
}

//////////////////////////////////////////////////////////////////////////////
// for min/max option display (numeric elements)
progressbar={
	percent:function(c,v){
		return (100*(v-c._format.minval)/(c._format.maxval-c._format.minval))+'%';
	},
	init:function(c){
		if(!c._progressbar){	//add progressbar
			//c._content.innerHTML="";
			c._content.classList.add("progress");
			c._progressbar=addDiv(c._content,["progressbar"]);
			// c._progressval=addDiv(c._content,["progressval"]);
			if(parseInt(c._content.offsetWidth)>parseInt(c._content.offsetHeight)){
				c._progressbar.style.height='100%';
				c._format.display=function(){
					c._progressbar.style.width=progressbar.percent(c,c._value);
					c._format.valueSpan.innerHTML=c._format.fmt(c._value);
				}
			}else{
				c._progressbar.style.width='100%';
				c._progressval.style.setProperty('transform','rotate(270deg)');
				//c._progressval.style.setProperty('transform-origin','left top');
				c._format.display=function(){
					c._progressbar.style.height=progressbar.percent(c,c._value);
					c._format.valueSpan.innerHTML=c._format.fmt(c._value);
				}
			}
			if(c._format.eN)setOption.number.eN(c,c._format.eN);
		}
		if(c._format.rndval)progressbar.maketics(c);
	},
	getValue:function(e){
		var rect=this.getBoundingClientRect();
		var c=this.parentElement;
		var v=c._format.minval+(c._format.maxval-c._format.minval)*(e.pageX-rect.left)/rect.width;
		c._setValue(c._format.rndval?ceil2(v,c._format.rndval):v);
		sendAction(c,c._value);
	},
	maketics:function(c){
		//instead of changing bg size, maybe i can change the following:
		//	background: repeating-linear-gradient(to left, gray, gray 1px, white 1px, white 10%);
		// if(isChrome && getComputedStyle(c).getPropertyValue('box-sizing')!=='content-box')
			// c._content.style.backgroundSize="calc("+progressbar.percent(c,c._format.rndval+c._format.minval)+" + 1px) 1px";
		// else
			// c._content.style.backgroundSize=progressbar.percent(c,c._format.rndval+c._format.minval)+" 1px";
		//c._format.rnd=function(){c._value=round2(c._value,v);};
		c._content.style.background="repeating-linear-gradient(to left, gray, gray 1px, white 2px, white "+progressbar.percent(c,c._format.rndval+c._format.minval)+")";
	},
	removetics:function(c){
		c._content.style.backgroundSize="0px 0px";
	},
	destroy:function(c){
		if(c._progressbar){
			progressbar.removetics(c);
			c._progressbar.remove();
			c._content.classList.remove("progress");
			c._format.display=function(){c._format.valueSpan.innerHTML=c._format.fmt(c._value);};
			c._progressbar=null;
		}
	}
}


//////////////////////////////////////////////////////////////////////////////

function ums(){return (new Date()).getTime()-startTime;}

function sendAction(element,val){
	if(!element){
		send(JSON.stringify([ums(),val]));
	}else if(typeof(element)==='object'){
		var elementid=element.id || getElementIndex(element.parentElement),
			parent=element._parentState;
		send(JSON.stringify([ums(),elementid,val]));
		if(element._format.onedit!==undefined){
			let val,opt;
			if(element._format.onedit && element._format.onedit.constructor===Array && element._format.onedit[1].constructor===Object){
				val=element._format.onedit[0];
				opt=element._format.onedit[1];
			}else if(element._format.onedit && element._format.onedit.constructor===Object){
				opt=element._format.onedit;
			}else{
				val=element._format.onedit;
				opt={};
			}
			processElement(parent,elementid,val,opt,{});
		}
		if(parent._format.onsubedit!==undefined){
			let val,opt;
			if(parent._format.onsubedit && parent._format.onsubedit.constructor===Array && parent._format.onsubedit[1].constructor===Object){
				val=parent._format.onsubedit[0];
				opt=parent._format.onsubedit[1];
			}else if(parent._format.onsubedit && parent._format.onsubedit.constructor===Object){
				opt=parent._format.onsubedit;
				
			}else{
				val=parent._format.onsubedit;
				opt={};
			}
			processElement(parent._parentState,parent.id||getElementIndex(parent.parentElement),val,opt,{});
		}
	}else{
		send(JSON.stringify(element?[ums(),element.id || element,val]:[ums(),val]));
	}
}

var sendText={
	all:function(e){sendAction(e.target.parentElement,e.target.innerHTML);},
	pwd:function(e){
		var c=e.target.parentElement;
		sendAction(c,sha256(c._pwd+e.target.innerText));
	},
}

var sendEvent={
	e:function(c,v){return function(){sendAction(c,[v]);};},
	exy:function(c,v){return function(e){
		var rect=c._content.getBoundingClientRect();
		sendAction(c,[v,e.clientX-rect.left,e.clientY-rect.top]);
	};},
	ek:function(c,v){return function(e){sendAction(c,[v,e.keyCode]);};},
};

var EVENTS={
	30:['keypress',sendEvent.ek],
	31:['keydown',sendEvent.ek],
	32:['keyup',sendEvent.ek],
	40:['click',sendEvent.exy],
	41:['dblclick',sendEvent.exy],
	42:['mousedown',sendEvent.exy],
	43:['mouseup',sendEvent.exy],
	44:['mousemove',sendEvent.exy],
	45:['mouseenter',sendEvent.exy],
	46:['mouseleave',sendEvent.exy],
	47:['mouseover',sendEvent.exy],
	48:['mouseout',sendEvent.exy]
};

//////////////////////////////////////////////////////////////////////////////

function addDiv(container,classes){
	var c=container.appendChild(document.createElement('div'));
	for(var i=0;i<classes.length;++i)c.classList.add(classes[i].replace(/[^\w-_]/gi, '_'));
	return c;
}

function addElement(container,type,level,key){
	var c,cf,cs;
	cf=addDiv(container,[type,'lvl_'+level,'id_'+key,'frame']);
	c=addDiv(cf,[type,'lvl_'+level,'id_'+key,'main']);
	c._frame=cf;
	c._parentState=container.parentElement;
	c._realkey=key;
	if(key.constructor===String){
		c.id=key;
		c._parentState._childmap[key]=c;
	}
	c._key=addDiv(c,[type,'lvl_'+level,'id_'+key,'key']);
	cs=addDiv(c,[type,'lvl_'+level,'id_'+key,'sep']);
	c._content=addDiv(c,[type,'lvl_'+level,'id_'+key,'content']);
	c._type=type;
	c._level=level;
	c._childmap={};
	c._options={};
	c._format={};
	c._setValue=setValue[type];
	// c._hide=function(){cf.style.visibility='hidden';};
	// c._unhide=function(){cf.style.visibility='visible';};
	c._clear=function(){
		c._content.innerHTML='';
		c._childmap={};
		// c._type=undefined;
		// c._options={};
		c._value=0;
		c._select=undefined;
		c._selected=undefined;
		c._selectedDiv=undefined;
	};
	c._remove=function(){
		cf.parentElement.removeChild(cf);
		if(key in container.parentElement._childmap)delete container.parentElement._childmap[key];
		c._type=undefined;
	};
	c._changeType=function(type){
		c._clear();
		cf.classList.remove(c._type);
		c.classList.remove(c._type);
		c._key.classList.remove(c._type);
		cs.classList.remove(c._type);
		c._content.classList.remove(c._type);
		cf.classList.add(type);
		c.classList.add(type);
		c._key.classList.add(type);
		cs.classList.add(type);
		c._content.classList.add(type);
		c._type=type;
		c._setValue=setValue[type];
		initElement[type](c);
	};
	initElement[type](c);
	return c;
}

function processElement(parent,key,val,options){
	// console.log(parent,key,val,options);
	if(options.R&1)sendAction(key,{R:1});
	if(options.S){		//optional delay
		var delay=waitTime(options.S);
		delete options.S;
		setTimeout(function(){processElement(parent,key,val,options);},delay);
		return;
	}
	var child,typeofval,displaykey,optKey;
	if(typeof(key)==='number'){
		child=parent._content.children[key];	//find frame by numeric key
		if(child)child=child.children[0];		//get main div of child
	}else
		child=parent._childmap[key];
	if(val===null){							//remove element
		if(child)child._remove();
	}else{
		if(child===undefined){				//new element
			typeofval=options['type'];
			if(!typeofval){
				if(val===undefined){val=false;typeofval='boolean';}
				else typeofval=typeof(val);
			}
			if(key && typeof(key)==='string')
				displaykey=replaceShorthand(key).replace(HASHTAGS,'').trim();
			else{
				key=Object.keys(parent._childmap).length;
				displaykey='';
			}
			child=addElement(parent._content,typeofval,parent._level+1,key);
			child._key.innerHTML=displaykey;
			for(optKey in parent._format)
				if(!(optKey in options))
					updateOption(child,optKey,parent._format[optKey]);
		}else{								//edit element
			typeofval=options['type'] || typeof(val);
			if(typeofval!=='undefined' && child._type!==typeofval && !COMPATIBLE[child._type].has(typeofval)){
				child._changeType(typeofval);
				var allOptions=Object.assign({},parent._format,child._options);
				for(optKey in allOptions)
					if(!(optKey in options))
						updateOption(child,optKey,allOptions[optKey]);
			}
		}
		if(options.R&2)sendAction(key,{R:2});
		if(options.T){						//animation
			var animate=options.T,aniopt={},curopt={};
			delete options.T;
			//check which options an be animated
			for(optKey in options){
				if(optKey in ANIMATABLE){
					curopt[optKey]=child._options[optKey]||(COLOROPTIONS.has(optKey)?'rgba(0,0,0,0)':0);
					aniopt[optKey]=options[optKey];
					delete options[optKey];
				}
			}
			//animate options
			if(Object.keys(aniopt).length){
				aniopt.onUpdate=function(options){
					for(let optKey in options){
						child._options[optKey]=options[optKey];
						updateOption(child,optKey,options[optKey]);
					}
				};
				aniopt.onUpdateParams=[curopt];
				if(options.R&4){
					aniopt.onComplete=function(){sendAction(child,{R:4});};
					delete options.R;
				}
				TweenLite.to(curopt,animate,aniopt);
			}
			//animate value
			if(typeof(val)==='number'){
				let curopt={v:child._value};
				let aniopt={v:val,onUpdate:function(o){
						child._setValue(o.v);
					},onUpdateParams:[curopt]};
				val=undefined;
				if(options.R&4)aniopt.onComplete=function(){sendAction(child,{R:4});};
				TweenLite.to(curopt,animate,aniopt);
			}
		}
		Object.assign(child._options,options);
		for(optKey in options)
			updateOption(child,optKey,options[optKey]);
		if(val!==undefined)
			child._setValue(val);
		if(child._options.scroll&2)
			child._content.scrollTop=child._content.scrollHeight;
	}
}

function updateOption(child,option,value){
	(setOption.all[option]||setOption[child._type][option]||pass)(child,value);
}

initElement={
	object:pass,
	number:function(c){
		c._value=0;
		if(!c._format.prefixSpan)c._format.prefixSpan=c._content.appendChild(document.createElement('span'));
		if(!c._format.valueSpan)c._format.valueSpan=c._content.appendChild(document.createElement('span'));
		if(!c._format.suffixSpan)c._format.suffixSpan=c._content.appendChild(document.createElement('span'));
		if(!c._format.min)c._format.min=pass;
		if(!c._format.max)c._format.max=pass;
		if(!c._format.rnd)c._format.rnd=pass;
		if(!c._format.fmt)c._format.fmt=self;
		if(!c._format.display)c._format.display=function(){c._format.valueSpan.innerHTML=c._format.fmt(c._value);};
	},
	string:function(c){c._sendText=function(e){sendAction(e.target.parentElement,e.target.innerHTML);}},
	boolean:pass,
	path:function(c){
		c._svg=c._content.appendChild(document.createElementNS(SVGNS,'svg'));
		c._path=c._svg.appendChild(document.createElementNS(SVGNS,'path'));
		c._path.setAttribute('stroke-width',1);
		c._path.setAttribute('stroke','black');
		c._path.setAttribute('fill','none');
	}
}

setOption={
	all:{
		e:function(c,v){
			if(v.constructor!==Array)v=[v];
			if(c._clearEvents)c._clearEvents();
			var functions=[];
			for(var i=0;i<v.length;++i){
				functions[i]=EVENTS[v[i]][1](c,v[i]);
				c._content.addEventListener(EVENTS[v[i]][0],functions[i]);
			}
			c._clearEvents=function(){
				for(var i=0;i<v.length;++i){
					c._content.removeEventListener(EVENTS[v[i]][0],functions[i]);
				}
			}
		},
		scroll:function(c,v){c._content.style.overflowY=v&1?'auto':null;},
		bg:function(c,v){c._content.style.backgroundColor=v;},
		col:function(c,v){c._content.style.color=v;},
		fnt:function(c,v){c._content.style.font=v;},
		bd:function(c,v){c._content.style.borderStyle=v;},
		bdc:function(c,v){c._content.style.borderColor=v;},
		bdw:function(c,v){c._content.style.borderWidth=v;},
		pad:function(c,v){c._content.style.padding=v;},
		r:function(c,v){c._content.style.borderRadius=v+'px';},
		x:function(c,v){c._frame.style.left=v;},
		y:function(c,v){
			c._frame.style.top=v;
			if(v===null){
				c._frame.classList.remove('xy');
				c.classList.remove('xy');
			}else{
				c._frame.classList.add('xy');
				c.classList.add('xy');
			}
		},
		z:function(c,v){c._frame.style.zIndex=v;},
		w:function(c,v){c._content.style.width=v;},
		h:function(c,v){c._content.style.height=v;},
		rot:function(c,v){c._content.style.setProperty('transform','rotate('+v+'deg)');}
	},
	object:new Proxy({},{get:function(t,optKey){
		return function(c,v){
			c._format[optKey]=v;
			var key,child;
			for(key in c._childmap){
				child=c._childmap[key];
				if(child._options[optKey]===undefined)
					(setOption[child._type][optKey]||pass)(child,v);
			}
		};
	}}),
	number:{
		rnd:function(c,v){
			if(c._format.rndval!==v){
				c._format.rndval=v;
				if(v){
					c._format.rnd=function(){c._value=round2(c._value,v);};
					if(c._progressbar)progressbar.maketics(c);
					updateContainers.add(c);
				}else{
					c._format.rnd=pass;
					if(c._progressbar)progressbar.removetics(c);
				}
			}
		},
		'>=':function(c,v){
			if(c._format.minval!==v){
				c._format.minval=v;
				if(v!==null){
					c._format.min=function(){if(c._value<v)c._value=v;};
					if(c._format.max!==pass)
						progressbar.init(c);
					// else
						// c._format.display=function(){c._content.innerHTML=c._format.fmt(c._value);};
					updateContainers.add(c);
				}else{
					c._format.min=pass;
					progressbar.destroy(c);
					// c._format.display=function(){c._content.innerHTML=c._format.fmt(c._value);};
					updateContainers.add(c);
				}
			}
		},
		'<=':function(c,v){
			if(c._format.maxval!==v){
				c._format.maxval=v;
				if(v!==null){
					c._format.max=function(){if(c._value>v)c._value=v;};
					if(c._format.min!==pass)
						progressbar.init(c);
					// else
						// //c._format.
						// c._format.display=function(){c._content.innerHTML=c._value+" of "+c._format.fmt(c._format.maxval);};
					//TODO: add n of X display to suffix -- maybe use fmt() to change suffix
					updateContainers.add(c);
				}else{
					c._format.max=pass;
					progressbar.destroy(c);
					// c._format.display=function(){c._content.innerHTML=c._format.fmt(c._value);};
					updateContainers.add(c);
				}
			}
		},
		unit:function(c,v){
			var dollarsign=v.indexOf('$');
			if(dollarsign>-1){
				v=v.replace('$',' ').trim();
				c._format.prefixSpan.innerHTML='$';
			}
			c._format.suffixSpan.innerHTML=v;
		},
		time:function(c,v){
			if(v){
				c._format.prefixSpan.innerHTML='';
				c._format.suffixSpan.innerHTML='';
				c._format.fmt=function(x){
					return new Date(x*1000).toString(v);
				};
			}else{
				c._format.fmt=self;
			}
			updateContainers.add(c);
		},
		eN:function(c,v){
			//TODO: account for progressbar and x of n
			//	may be nice to have a sep div for value, and a sep div for styling (e.g. styling can be the progressbar or the "of N")
			//
			c._format.eN=v;
			if(v&1 || v&2 || v&4){
				if(c._progressbar){
					c._format.valueSpan.setAttribute('contenteditable',false);
					c._format.valueSpan.removeEventListener("keyup", keepNumeric);
					c._format.valueSpan.onkeypress=null;
					c._format.valueSpan.onblur=null;
					c._format.valueSpan.oninput=null;
					c._content.addEventListener('click',progressbar.getValue,false);
				}else{
					c._content.removeEventListener('click',progressbar.getValue,false);
					c._format.valueSpan.setAttribute('contenteditable',true);
					if(!document.activeElement.getAttribute('contenteditable')){
						c._format.valueSpan.focus();
						setTimeout(()=>{select(c._format.valueSpan)},1);
					}
					c._format.valueSpan.addEventListener("keyup", keepNumeric, false);
					if(v&1)c._format.valueSpan.onkeypress=function(e){if(e.keyCode==13){sendAction(c,parseFloat(c._content.innerText));return false;}};
					else c._format.valueSpan.onkeypress=null;
					if(v&2)c._format.valueSpan.onblur=function(){sendAction(c,parseFloat(c._content.innerText));};
					else c._format.valueSpan.onblur=null;
					if(v&4)c._format.valueSpan.oninput=function(){sendAction(c,parseFloat(c._content.innerText));};
					else c._format.valueSpan.oninput=null;
				}
			}else{
				c._content.setAttribute('contenteditable',false);
				c._content.removeEventListener("keyup", keepNumeric);
			}
		},
		onedit:function(c,v){c._format.onedit=v;}
	},
	string:{
		eT:function(c,v){
			if(v&1 || v&2 || v&4){
				c._content.setAttribute('contenteditable',true);
				if(!document.activeElement.getAttribute('contenteditable'))c._content.focus()
				if(v&1){ //on enter
					c._content.onkeypress=function(e){if(e.keyCode==13){c._sendText(e);return false;}};
				}
				if(v&2){ //on blur
					c._content.onblur=this._sendText;
				}
				if(v&4){ //on any change
					//TODO: this will conflict with v&1, specifically in that enter key will be allowed
					c._content.oninput=this._sendText;
				}
			}else{
				c._content.setAttribute('contenteditable',false);
			}
		},
		pwd:function(c,v){
			if(v){
				this._sendText=function(e){
					sendAction(e.target.parentElement,sha256(v+e.target.innerText));
				}
			}else
				this._sendText=function(e){
					sendAction(e.target.parentElement,e.target.innerHTML);
				}
		},
		onedit:function(c,v){c._format.onedit=v;}
	},
	boolean:{
		select:function(c,v){
			c._content.innerHTML=c._key.innerHTML;
			if(v==0){
				c.setAttribute('_select','0');
				c.setAttribute('onclick',null);
				c.onmousedown=function(){sendAction(c,true);};
				c.onmouseup=function(){sendAction(c,false);};
			}else if(v==1){
				c.setAttribute('_select','1');
				c.setAttribute('onmousedown',null);
				c.setAttribute('onmouseup',null);
				c.onclick=function(){
					if(c.getAttribute("_selected")==1){
						c.setAttribute("_selected",0);
						c._parentState._selectedDiv=undefined;
						sendAction(c,false);
					}else{
						c.setAttribute("_selected",1);
						if(c._parentState._selectedDiv!=undefined)
							c._parentState._selectedDiv.setAttribute("_selected",0);
						c._parentState._selectedDiv=c;
						sendAction(c,true);
					}
				}
			}else if(v==2){
				c.setAttribute('_select','2');
				c.setAttribute('onmousedown',null);
				c.setAttribute('onmouseup',null);
				c.onclick=function(){
					if(c.getAttribute("_selected")==1){
						c.setAttribute("_selected",0);
						sendAction(c,false);
					}else{
						c.setAttribute("_selected",1);
						sendAction(c,true);
					}
				}
			}else if(v==.5){
				c.setAttribute('_select','0.5');
			}else{
				c.setAttribute('_select','-1');
				c.setAttribute('onmousedown',null);
				c.setAttribute('onmouseup',null);
				c.onclick=function(){sendAction(c,true);};
			}
		},
		eB:function(c,v){
			if(v)c.classList.remove('disabled');
			else c.classList.add('disabled');
		},
		onedit:function(c,v){c._format.onedit=v;}
	},
	path:{
	}
}

setValue={
	object:function(data){
		var i,key,val,options;
		for(i=0;i<data.length;++i){
			if(data[i].constructor==Array){	//get key,val,opt
				key=data[i][0];
				if(data[i].length==1){
					val=undefined;
					options={};
				}else if(data[i].length==2){
					if(isObj(data[i][1])){
						val=undefined;
						options=data[i][1];
					}else{
						val=data[i][1];
						options={};
					}
				}else{
					val=data[i][1];
					options=data[i][2];
				}
			}else{
				key=undefined;
				val=data[i];
				options={};
			}
			if(key===true){
				for(key=this._content.childElementCount-1;key>=0;--key){
					processElement(this,key,val,options);
				}
			}else 
				processElement(this,key,val,options);
		}
		updateContainers.delete(this);
	},
	number:function(data){
		if(typeof(data)==='number')this._value=data;
		this._format.min();
		this._format.max();
		this._format.rnd();
		this._format.display();
		updateContainers.delete(this);
	},
	string:function(data){
		this._content.innerHTML=replaceShorthand(data);
		updateContainers.delete(this);
	},
	boolean:function(data){
		if(data===true){
			this.setAttribute("_selected",1);
			if(this.getAttribute('_select')=='-1'){
				var container=this;
				setTimeout(function(){container.setAttribute("_selected",0)},250);
			}else if(this.getAttribute('_select')=='1'){
				if(this._parentState._selectedDiv!=undefined)
					this._parentState._selectedDiv.setAttribute("_selected",0);
				this._parentState._selectedDiv=this;
			}
		}else{
			this.setAttribute("_selected",0);
			if(this._parentState._selectedDiv==this)
				this._parentState._selectedDiv=undefined;
		}
		updateContainers.delete(this);
	},
	path:function(data){
		if(data.constructor==Array){
			var d=this._path.getAttribute('d');
			if(d)this._path.setAttribute('d',d+" "+data.join(' '));
			else if(data[0].constructor===Number)this._path.setAttribute('d',"M"+data.join(' '));
			else this._path.setAttribute('d',data.join(' '));
		}else if(data.constructor==String)
			this._path.setAttribute('d',data);
	}
}

//////////////////////////////////////////////////////////////////////////////

function processData(data){
	if(data===null){
		maindiv._content.innerHTML='';
		maindiv._childmap={};
	}else if(data.constructor===Array){
		maindiv._setValue(data);
	}else if(typeof(data)==="object"){
		if(data.R&1)sendAction(null,{R:1});
		if(data.S){		//optional delay
			var delay=waitTime(data.S);
			delete data.S;
			setTimeout(function(){processData(data);},delay);
			return;
		}
		if(data.R&2)sendAction(null,{R:2});
		// process special root directives
		if('error' in data){console.log('ERROR: '+data.error);delete data.error;}
		if('require' in data){
			var errors,quit=false;
			for(var key in data.require){
				if(key=='options'){
					errors=[];
					for(var i=0;i<data.require.options.length;++i){
						if(!OPTIONS.has(data.require.options[i]))
							errors.push(data.require.options[i]);
						else if(data.require.options[i] in REQUIRED)
							loadURLs(REQUIRED[data.require.options[i]]);
						// else if(!markerdefs && data.require.options[i].startsWith('arrow'))
							// initMarkers();
					}
					if(errors.length){
						sendAction(null,{error:'Sorry, I cannot handle the required directive(s): '+errors});
						document.write('ERROR: Cannot handle required task directive(s): '+errors+'<br><br>');
						quit=true;
					}
				}else if(key=='events'){
					errors=data.require.events.filter(function(x){return !(x in EVENTS)});
					if(errors.length){
						sendAction(null,{error:'Sorry, I cannot handle the required event(s): '+errors});
						document.write('ERROR: Cannot handle required task event(s): '+errors+'<br><br>');
						quit=true;
					}
				}else if(key=='types'){
					errors=data.require.types.filter(function(x){return !TYPES.has(x)});
					if(errors.length){
						sendAction(null,{error:'Sorry, I cannot handle the required type(s): '+errors});
						document.write('ERROR: Cannot handle required task type(s): '+errors+'<br><br>');
						quit=true;
					}
				}else{
					sendAction(null,{error:'Sorry, I cannot handle "require" directive: '+key+':'+data.require[key]});
					document.write('ERROR: Cannot handle "require" directive: '+key+':'+data.require[key]+'<br><br>');
					quit=true;
				}
			}
			if(quit)ws.close();
			delete data.require;
		}
		if('client' in data){
			var reply={};
			for(var i=0;i<data.client.length;++i){
				if(data.client[i]=='url'){
					reply['url']=objectify(location);
				}else if(data.client[i]=='screen'){
					reply['screen']=objectify(screen);
				}else if(data.client[i]=='ip'){
					if(ipAddress)reply['ip']=ipAddress;
					else
						loadURLs('https://api.ipify.org/?format=jsonp&callback=gotip',
							null,
							function(){
								if(!ipAddress)
									sendAction(null,{error:"could not get IP address"});
							},
							'js');
				}else if(data.client[i]=='userAgent'){
					reply['userAgent']=clientInformation.userAgent;
				}
			}
			if(Object.keys(reply).length)
				sendAction(null,{client:reply});
			delete data.client;
		}
		if('template' in data){
			var url=data.template;
			delete data.template;
			loadURLs(url,function(){processData(data);refreshNumerics(maindiv);});
			return;
		}
		if('replace' in data){
			Object.assign(txtReplace,data.replace);
			delete data.replace;
		}
		if('task' in data){
			for(var taskThing in data.task){
				for(var cond of data.task[taskThing]){
					if(!(cond[0] in taskOptions))taskOptions[cond[0]]=[];
					//if(!(taskThing in taskOptions[cond[0]]))taskOptions[cond[0]][taskThing]=[];
					taskOptions[cond[0]].push(cond.length==2?['==',cond[1],taskThing]:[cond[1],cond[2],taskThing]);
				}
			}
			//taskInstructions(data.task);
			delete data.task;
		}
		if('.' in data && data['.'].constructor===Array && data['.'].length>1){
			let key=data['.'][0],e=document.getElementById(key);
			if(e){
				let val,options;
				if(data['.'].length==2){
					if(isObj(data['.'][1])){
						options=data['.'][1];
					}else{
						val=data['.'][1];
						options={};
					}
				}else{
					val=data['.'][1];
					options=data['.'][2];
				}
				processElement(e._parentState,key,val,options);
			}
		}
		// process other optional element directives
		Object.assign(maindiv._options,data);
		for(var optKey in data){
			updateOption(maindiv,optKey,data[optKey]);
		}
	}
	for(var element of updateContainers)element._setValue();
	if(maindiv._options.scroll&2)window.scrollTo(0,document.body.scrollHeight);
}

function init(){
	//check if basic stap.css template is loaded
	var x=document.getElementsByTagName('link');
	for(var i=0;i<x.length;++i){if(x[i]['href'].endsWith('stap.css'))break;}
	if(i==x.length){loadURLs("lib/stap.css",init);return;}
	//create foundational element
	document.body.parentElement._childmap={};
	maindiv=addElement(document.body,'object',0,"__main__");
	maindiv._format.select=-1;
	//collect all options
	for(var key in setOption){
		TYPES.add(key);
		for(var optKey in setOption[key])
			OPTIONS.add(optKey);
		TYPES.delete('all');
	}
	//connect to task
	connect();
}

function onTaskConnect(){
	processData(null);
	startTime=(new Date()).getTime();
	sendAction(null,[0]);
	window.addEventListener('unload',function(){sendAction(null,[1]);},false);
}

onload=init;

