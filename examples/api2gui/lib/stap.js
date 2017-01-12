/*base template for STAP visualization
	HOST and PORT parameters should indicate location of a STAP websocket service



TODO futureproof:
	account for multi-touch where two irrespective mouseups can occur

*/

var OPTIONS=new Set(["select",">=","<=","rnd","T"]),
	TYPES=new Set(),
	EVENTS=new Set([30,31,32,33,34]);

var REQUIRED={
	"T":[
		"https://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/TweenLite.min.js",
		"https://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/plugins/AttrPlugin.min.js",
		"https://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/plugins/CSSPlugin.min.js",
		"https://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/plugins/ColorPropsPlugin.min.js",
		"https://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/plugins/TextPlugin.min.js"
	],
	"ease":"https://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/easing/EasePack.min.js",
	"easeout":"https://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/easing/EasePack.min.js",
	"pwd":"https://cdnjs.cloudflare.com/ajax/libs/js-sha256/0.3.2/sha256.min.js",
	// "time":"https://cdnjs.cloudflare.com/ajax/libs/datejs/1.0/date.min.js"
};

var INHERITABLE={
	'select':{'_type':'boolean'},
	'>=':{'_type':'number'},
	'<=':{'_type':'number'},
	'rnd':{'_type':'number'},
	'unit':{'_type':'number'},
	'time':{'_type':'number'}
}

var ANIMATABLE={'x':'left','y':'top','w':'width','h':'height','r':'borderRadius','bg':'backgroundColor','bd':'borderStyle','bdw':'borderWidth','bdc':'borderColor','pad':'padding','fnt':'font','col':'color','rot':'rotation'};

var EASE={0:'Power0',1:'Power1',2:'Power2',3:'Power3',4:'Power4',back:'Back',elastic:'Elastic',bounce:'Bounce'};

var CLICK=30,DBLCLICK=31,MOUSEDOWN=32,MOUSEUP=33,MOUSEMOVE=34;


//////////////////////////////////////////////////////////////////////////////
// helper functions
function dp(s){console.log(typeof(s)=="string"?s:JSON.stringify(s));};
function pass(){}
function self(o){return o;}
function round2(n,r){return (Math.round(n/r)*r);}
function twodigit(x){return x<10?'0'+x:x;}
function threedigit(x){return x<10?'00'+x:(x<100?'0'+x:x);}
Date.prototype.toString=function(format){
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
function inHead(type,thing,url){
	var x=document.getElementsByTagName(type);
	for(var i=0;i<x.length;++i){
		if(x[i][thing]==url)return true;
	}
}
function loadURLs(urls, callback){
	var url, onload, fileref;
	if(urls.constructor===Array){url=urls[0];urls=urls.slice(1);}
	else{url=urls;urls=[];}
	if(urls.length)onload=function(){loadURLs(urls,callback);};
	else onload=callback||pass;
	if(url && url.endsWith(".js") && !inHead('script','src',url)){       //if filename is a external JavaScript file
		fileref=document.createElement('script');
		fileref.setAttribute("type","text/javascript");
		fileref.setAttribute("src", url);
	}else if(url && url.endsWith(".css") && !inHead('link','href',url)){ //if filename is an external CSS file
		fileref=document.createElement("link");
		fileref.setAttribute("rel", "stylesheet");
		fileref.setAttribute("type", "text/css");
		fileref.setAttribute("href", url);
		//console.log('?',fileref.url);
	}else{
		onload();
		return;
	}
	dp(url);
	fileref.onreadystatechange=onload;
	fileref.onload=onload;
	document.getElementsByTagName('head')[0].appendChild(fileref);
}
function isObj(o){return Object.prototype.toString.call(o)==="[object Object]";}
var HASHTAGS = new RegExp('#([^\\s]*)','g');
var SVGNS="http://www.w3.org/2000/svg";
//////////////////////////////////////////////////////////////////////////////





var ws,startTime,maindiv,markerdefs,stylesheet,tables=0,focused=false,
	elements={}, //??
	taskOptions={},msgTimeouts={},txtReplace={};


//////////////////////////////////////////////////////////////////////////////

function ums(){return (new Date()).getTime()-startTime;}

function waitTime(t){return t-ums();}

function replaceShorthand(s){
	for(var shorthand in txtReplace){
		s=s.replaceAll(shorthand,txtReplace[shorthand]);
	}
	return s;
}

function addDiv(container,classes){
	var c=container.appendChild(document.createElement('div'));
	for(var i=0;i<classes.length;++i)c.classList.add(classes[i].replace(/[^\w-_]/gi, '_'));
	return c;
}

function addDivs(container,type,level,key){
	var c;
	if(type=='_ln_child'){
		c=container.parentElement._svgg.appendChild(document.createElementNS(SVGNS,'path'));
		c._type='_ln_child';
	}else{
		var cf=addDiv(container,[type,'lvl_'+level,'id_'+key,'frame']);
		c=addDiv(cf,[type,'lvl_'+level,'id_'+key,'main']);
		c._frame=cf;
		c._parentState=container.parentElement;
		c._key=addDiv(c,[type,'lvl_'+level,'id_'+key,'key']);
		var cs=addDiv(c,[type,'lvl_'+level,'id_'+key,'sep']);
		c._content=addDiv(c,[type,'lvl_'+level,'id_'+key,'content']);
		c.id=key;
		c._type=type;
		c._level=level;
		c._childmap={};
		c._options={};
		c._setOptions=setOptions[type];
		c._setValue=setValue[type];
		// c._hide=function(){cf.style.visibility='hidden';};
		// c._unhide=function(){cf.style.visibility='visible';};
		c._clear=function(){
			c._content.innerHTML='';
			c._childmap={};
			c._options={};
			c._value=0;
			c._type=undefined;
			c._select=undefined;
			c._selected=undefined;
			c._selectedDiv=undefined;
		};
		c._remove=function(){
			//cf.remove();
			cf.parentElement.removeChild(cf);
			delete container.parentElement._childmap[key];
			c._type=undefined;
		};
		c._changeType=function(cls){
			//TODO: perhaps it'd be cleaner to just drop old and add new when type is changed
			cls=cls.replace(/[^\w-_]/gi, '_');
			c._clear();
			cf.classList.remove(c._type);
			c.classList.remove(c._type);
			c._key.classList.remove(c._type);
			cs.classList.remove(c._type);
			c._content.classList.remove(c._type);
			cf.classList.add(cls);
			c.classList.add(cls);
			c._key.classList.add(cls);
			cs.classList.add(cls);
			c._content.classList.add(cls);
			c._type=cls;
			c._setOptions=setOptions[cls];
			c._setValue=setValue[cls];
		};
		initElement[type](c);
	}
	elements[key]=c;
	return c;
}

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

function setDivOptions(div,options){
	//TODO!!: make sure tweening works (with map)
	//TODO: test all options
	console.log(div,options);
	if(options.has('autoscroll')){
		div.autoscroll=options.autoscroll;
		div.style.overflowY='auto';
		delete options.autoscroll;
	}
	if(options.has('_T')){
		var ani=options._T.s || 1,
			newOptions={ease:getEaseSpec(options._T)};
		if(options._T.tid){
			newOptions.onComplete=sendAction;
			newOptions.onCompleteParams=[options._T.tid,0];
		}
		delete options._T;
		for(var key in options){
			//if(key=='bg')newOptions['colorProps']={'background':options[key]};
			//else
			newOptions[STAP2STYLE[key]]=options[key];
		}
		TweenLite.to(div,ani,newOptions);
	}else{
		if(options.has('w')){
			div.style.width=options.w;
			if(div.parentElement._svg){
				div.parentElement._svg.setAttribute('width',options.get('w'));
			}
		}
		if(options.has('h')){
			div.style.height=options.h;
			if(div.parentElement._svg){
				div.parentElement._svg.setAttribute('height',options.get('h'));
			}
		}
		if(options.has('x'))div.style.left=options.get('x');
		if(options.has('y')){
			div.style.top=options.get('y');
			if(!div.classList.contains('xy')){
				div.classList.add('xy');
				div.parentElement.classList.add('xy');
				div.parentElement.parentElement.classList.add('xy');
			}
		}
		if(options.has('r'))div.style.borderRadius=options.get('r')+'px';
		if(options.has('bg'))div.style.backgroundColor=options.get('bg');
		if(options.has('bd'))div.style.borderStyle=options.get('bd');
		if(options.has('bdw'))div.style.borderWidth=options.get('bdw');
		if(options.has('bdc'))div.style.borderColor=options.get('bdc');
		if(options.has('pad'))div.style.padding=options.get('pad');
		if(options.has('fnt'))div.style.font=options.get('fnt');
		if(options.has('col'))div.style.color=options.get('col');
		if(options.has('rot'))div.style.setProperty('transform','rotate('+options.get('rot')+'deg)');
	}
	// if('MozTransform' in document.body.style)
		// div.style.setProperty('-moz-transform','rotate('+options.rot+'deg)');
	// else if('webkitTransform' in document.body.style)
		// div.style.setProperty('-webkit-transform','rotate('+options.rot+'deg)');
}

function sendAction(element,val){
	send(JSON.stringify(element?[ums(),element.id || element,val]:[ums(),val]));
	//TODO: make sure oninput option gets added
	// if(typeof(element)==="object" && "oninput" in element._options){
		
	// }
}

function sendText(e){
	if('pwd' in e.target.parentElement._specialOptions)
		sendAction(e.target.parentElement,sha256(e.target.parentElement._specialOptions.pwd+e.target.innerText));
	else
		sendAction(e.target.parentElement,e.target.innerHTML);
	e.target._oldInnerHTML=e.target.innerHTML;
}

function optionUpdate(container,options){
	var updatable,updatableOptions={},recursiveUpdate={};
	for(var optKey in options){
		updatable=true;
		if(optKey in INHERITABLE){
			recursiveUpdate[optKey]=options[optKey];
			for(var key in INHERITABLE[optKey]){
				if(container[key]!=INHERITABLE[optKey][key]){
					updatable=false;
					break;
				}
			}
		}
		if(updatable)updatableOptions[optKey]=options[optKey];
	}
	if(Object.keys(updatableOptions).length)
		container._setOptions(updatableOptions);
	if('_childmap' in container && Object.keys(recursiveUpdate).length)
		for(var key in container._childmap){
			updatableOptions={};
			for(var optKey in options) //make sure option not already in child
				if(!(optKey in container._childmap[key]._options))
					updatableOptions[optKey]=recursiveUpdate[optKey];
			if(Object.keys(updatableOptions).length)
				optionUpdate(container._childmap[key],updatableOptions);
		}
}

function processElement(key,val,opt,container,level,parentOptions){
	var child,typeofval,displaykey;
	console.log(key,val,opt);
	child=container._childmap[key];
	if(val===null){if(child)child._remove();}
	else{
		if(TYPES.has(container._type))typeofval=container._type+"_child";
		else typeofval=opt['type'] || val===undefined?undefined:typeof(val);
		if(child===undefined){ //new element
			if(typeofval===undefined){
				val=false;
				typeofval='boolean';
			}
			if(typeof(key)==='string')displaykey=replaceShorthand(key).replace(HASHTAGS,'').trim();
			else{
				key=Object.keys(container._childmap).length;
				displaykey='';
			}
			child=addDivs(container._content,typeofval,level+1,key);
			container._childmap[key]=child;
			child._key.innerHTML=displaykey;
			Object.assign(child._options,opt);
			child._setOptions(Object.assign({},parentOptions,child._options));
		}else{ //edit existing element
			if(typeofval && child._type!==typeofval)child._changeType(typeofval);
			Object.assign(child._options,opt);
			optionUpdate(child,opt);
		}
		// for(var key in opt)
			// if(OPTION_TO_ATTR.has(key))
				// ...
			// else if(key=='w'){ ... }
			// else if(key=='h'){ ... }
			// ...
		//TODO:
		// delay/tween changes, and send receipt
		if(typeofval)
			child._setValue(val,parentOptions);
		//	elementTypes[child._type](val,child,level+1,Object.assign({},parentOptions,child._options));
	}
}

initElement={
	'object':function(e){},
	'number':function(e){
		e._format={
			min:pass,
			max:pass,
			rnd:pass,
			fmt:self
		}

	},
	'string':function(e){},
	'boolean':function(e){e._options.select=-1;}
}

setOptions={
	'object':function(options){},
	'number':function(options){
		var container=this;
		for(var key in options){
			if(key==='rnd'){
				this._format.rndval=options.rnd||undefined;
				this._format.rnd=(options.rnd===null)?pass:function(){
					container._value=round2(container._value,container._format.rndval);
				};
			}else if(key==='>='){
				if(options['>=']===null){
					this._format.minval=undefined;
					this._format.min=pass;
				}else{
					this._format.minval=options['>='];
					this._format.min=function(){
						if(container._value<container._format.minval)container._value=container._format.minval;
					};
				}
			}else if(key==='<='){
				if(options['<=']===null){
					this._format.maxval=undefined;
					this._format.max=pass;
				}else{
					this._format.maxval=options['<='];
					this._format.max=function(){
						if(container._value>container._format.maxval)container._value=container._format.maxval;
					};
				}
			}else if(key==='unit'){
				let unt=options.unit;
				this._format.fmt=(unt===null)?self:function(x){
					return (unt==='$')?'$'+x:x+''+unt;
				}
			}else if(key==='time'){
				let unt=options.time;
				this._format.fmt=(unt===null)?self:function(x){
					return new Date(x*1000).toString(unt);
				}
			}
		}
		if(this._format.minval!==undefined && this._format.maxval!==undefined){
			if(!this._progressbar){
				this._content.innerHTML="";
				this._content.classList.add("progress");
				this._progressbar=addDiv(this._content,["progressbar"]);
				this._progressval=addDiv(this._content,["progressval"]);
				//TODO: tic markers don't get added for vertical bars, nor when rnd option omes in after min/max
				if(this._format.rndval){
					for(var val=this._format.minval+this._format.rndval;val<this._format.maxval;val=val+this._format.rndval){
						var d=addDiv(this._content,['progresstic']);
						d.style.right=(100*(val-this._format.minval)/(this._format.maxval-this._format.minval))+'%';
					}
				}
			}
			// if(this.id in taskOptions){
				// //TODO: this block needs to run when number is added, as well as when _task is processed if number exists
				// if(!this._instructions)this._instructions={};
				// for(var [comp,val,taskThing] of taskOptions[this.id]){
					// this._instructions[taskThing]=addDiv(this._content,[taskThing]);
					// if(comp==='<='){
						// this._instructions[taskThing].style.top='0px';
						// this._instructions[taskThing].style.right=(100-100*(val-numspec['>='])/(numspec['<=']-numspec['>=']))+'%';
						// // console.log(this._content.offsetHeight);
						// // this._instructions[taskThing].style.height=(this._content.offsetHeight-2)+'px';
						// this._instructions[taskThing].style.margin='0px';
						// this._instructions[taskThing].style.padding='0px';
						// // this._instructions[taskThing].style.width='7px';
						// // this._instructions[taskThing].style.borderRadius='7px 0px 0px 7px';
						// this._instructions[taskThing].style.position='absolute';
						// this._instructions[taskThing].innerHTML="&#9668;";//"&#9654;";
						// //this._instructions[taskThing].style.borderRight='solid 1px black';
						// this._instructions[taskThing].style.textAlign='right';
						// this._instructions[taskThing].style.letterSpacing='-3px';
						// if(this._value<=val)this._progressbar.classList.add(taskThing);
						// else this._progressbar.classList.remove(taskThing);
					// }
				// }
			// }
			if(parseInt(this._content.offsetWidth)>parseInt(this._content.offsetHeight)){
				this._progressbar.style.height='100%';
				this._format.display=function(){
					container._progressbar.style.width=(100*(container._value-container._format.minval)/(container._format.maxval-container._format.minval))+'%';
					container._progressval.innerHTML=container._format.fmt(container._value);
				}
			}else{
				this._progressbar.style.width='100%';
				this._progressval.style.setProperty('transform','rotate(270deg)');
				//this._progressval.style.setProperty('transform-origin','left top');
				this._format.display=function(){
					container._progressbar.style.height=(100*(container._value-container._format.minval)/(container._format.maxval-container._format.minval))+'%';
					container._progressval.innerHTML=container._format.fmt(container._value);
				}
			}
		}else if(this._format.maxval!==undefined){
			this._format.display=function(){
				container._content.innerHTML=container._value+" of "+container._format.fmt(container._format.maxval);
			}
		}else{
			this._format.display=function(){
				container._content.innerHTML=container._format.fmt(container._value);
			}
		}
		this._setValue();
	},
	'string':function(options){},
	'boolean':function(options){
		if('select' in options){
			if(options.select==0){
				this.setAttribute('_select','0');
				this.setAttribute('onclick',null);
				this.onmousedown=function(){sendAction(this,true);};
				this.onmouseup=function(){sendAction(this,false);};
			}else if(options.select==1){
				this.setAttribute('_select','1');
				this.setAttribute('onmousedown',null);
				this.setAttribute('onmouseup',null);
				this.onclick=function(){
					if(this.getAttribute("_selected")==1){
						this.setAttribute("_selected",0);
						this._parentState._selectedDiv=undefined;
						sendAction(this,false);
					}else{
						this.setAttribute("_selected",1);
						if(this._parentState._selectedDiv!=undefined)
							this._parentState._selectedDiv.setAttribute("_selected",0);
						this._parentState._selectedDiv=this;
						sendAction(this,true);
					}
				}
			}else if(options.select==2){
				this.setAttribute('_select','2');
				this.setAttribute('onmousedown',null);
				this.setAttribute('onmouseup',null);
				this.onclick=function(){
					if(this.getAttribute("_selected")==1){
						this.setAttribute("_selected",0);
						sendAction(this,false);
					}else{
						this.setAttribute("_selected",1);
						sendAction(this,true);
					}
				}
			}else if(options.select==.5){
				this.setAttribute('_select','0.5');
			}else{
				this.setAttribute('_select','-1');
				this.setAttribute('onmousedown',null);
				this.setAttribute('onmouseup',null);
				this.onclick=function(){sendAction(this,true);};
			}
		}
	},
	'path':function(options){
		if(options.has('w'))this.setAttribute('stroke-width',options.w);
		if(options.has('c')){
			this.setAttribute('stroke',options.c);
			if(!options.has('start') && this.getAttribute('marker-start'))
				this.setAttribute('marker-start',getMarker(this.getAttribute('marker-start').split('.')[1],options.c));
			if(!options.has('end') && this.getAttribute('marker-end'))
				this.setAttribute('marker-end',getMarker(this.getAttribute('marker-end').split('.')[1],options.c));
		}
		if(options.has('f'))this.setAttribute('fill',options.f);
		if(options.has('cap'))this.setAttribute('stroke-linecap',options.cap);
		if(options.has('dash'))this.setAttribute('stroke-dasharray',options.dash);
		if(options.has('start'))this.setAttribute('marker-start',getMarker(options.start,this.getAttribute('stroke')));
		if(options.has('end'))this.setAttribute('marker-end',getMarker(options.end,this.getAttribute('stroke')));
	}
}

setValue={
	'object':function(data,parentOptions){
		var i,key,val,opt,options=Object.assign({},parentOptions,this._options);
		for(i=0;i<data.length;++i){
			if(data[i].constructor==Array){ //get key,val,opt
				key=data[i][0];
				if(data[i].length==1){
					val=undefined;
					opt={};
				}else if(data[i].length==2){
					if(isObj(data[i][1])){
						val=undefined;
						opt=data[i][1];
					}else{
						val=data[i][1];
						opt={};
					}
				}else{
					val=data[i][1];
					opt=data[i][2];
				}
			}else{
				key=undefined;
				val=data[i];
				opt={};
			}
			processElement(key,val,opt,this,this._level,options);
		}
		if(this._content.autoscroll){
			this._content.scrollTop=container._content.scrollHeight;
		}
	},
	'number':function(data){
		if(typeof(data)==='number')this._value=data;
		this._format.min();
		this._format.max();
		this._format.rnd();
		this._format.display();
	},
	'string':function(data){
		this._content.innerHTML=replaceShorthand(data);
	},
	'boolean':function(data){
		if(data==true){
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
	},
	'_ix':function(data,container){
		//TODO: account for multi-line, being able to repeatedly send the same text, etc
		if(typeof(data)==="object"){
			if("#0" in data)container._content.innerHTML=replaceShorthand(data["#0"]);
			//processOptions(data,container);
		}else container._content.innerHTML=replaceShorthand(data);
		if(container._content.getAttribute('contenteditable')===null){
			container._content.setAttribute('autofocus',true);
			container._content.setAttribute('contenteditable',true);
			//container._content.onblur=sendText;
			container._content.onkeypress=function(e){if(e.keyCode==13){sendText(e);return false;}};
		}
		if(!focused){focus=true;container._content.focus();}
	},
	'_i^':function(data,container){
		if(data.constructor==Array)data=set(data);
		if('_i^' in data){
			var i,angle,startAngle,arc,halfArc,svgElement;
			if(container._svg===undefined){
				container._svg=container._content.appendChild(document.createElementNS(SVGNS,'svg'));
				container._svg.cssText="position:absolute;left:0px;top:0px;width:50;height:50";
				container._svg.setAttribute('width',50);
				container._svg.setAttribute('height',50);
				container._svgg=container._svg.appendChild(document.createElementNS(SVGNS,'g'));
				container._svga=container._svg.appendChild(document.createElementNS(SVGNS,'g'));
				container._svga.setAttribute('stroke','none');
				container._svga.setAttribute('fill','black');
			}else{
				while (container._svgg.firstChild)
					container._svgg.removeChild(container._svgg.firstChild);
				while (container._svga.firstChild)
					container._svga.removeChild(container._svga.firstChild);
			}
			arc=360/(data['_i^'].n||4);
			halfArc=arc/2;
			startAngle=data['_i^'].start||0;
			for(i=0;i<(data['_i^'].n||4);++i){
				angle=startAngle+arc*i;
				svgElement=container._svgg.appendChild(document.createElementNS(SVGNS,'path'));
				svgElement.setAttribute('d','M 25 25 '+describeArc(25,25,25,angle-halfArc,angle+halfArc,false)+'Z');
				svgElement._angle=i;
				svgElement.classList.add('_i__child');
				//TODO: account for multi-touch where two irrespective mouseups can occur
				var sendnav=function(buttonState){
					var sendback={};
					sendback[container._mousedown._angle]=buttonState;
					sendAction(container,sendback);
				}
				var mouseupF=function(){
					container._mousedown.setAttribute('_selected',0);
					sendnav(1);
					container._mousedown=undefined;
					document.onmouseup=undefined;
				};
				svgElement.onmouseover=function(e){
					if(container._mousedown!==undefined && container._mousedown!==this._angle){
						container._mousedown.setAttribute('_selected',0);
						this.setAttribute('_selected',1);
						container._mousedown=this;
						sendnav(2);
					}
				};
				svgElement.onmousedown=function(){
					this.setAttribute('_selected',1);
					container._mousedown=this;
					sendnav(2);
					document.onmouseup=mouseupF;
				};
				svgElement=container._svga.appendChild(document.createElementNS(SVGNS,'polygon'));
				svgElement.setAttribute('points','23,5 27,5 25,1');
				svgElement.setAttribute('transform',"rotate("+angle+" 25 25)");
			}
			svgElement=container._svg.appendChild(document.createElementNS(SVGNS,'circle'));
			svgElement.setAttribute('cx',25);
			svgElement.setAttribute('cy',25);
			svgElement.setAttribute('r',5);
			svgElement.setAttribute('fill','white');
		}
	},
	'_ln':function(data,container,level){
		if(container._svg===undefined){
			container._svg=container._content.appendChild(document.createElementNS(SVGNS,'svg'));
			container._svg.cssText="position:absolute;left:0px;top:0px;width:100%;height:100%";
			container._svg.setAttribute('width',container._content.style.width);
			container._svg.setAttribute('height',container._content.style.height);
			container._svgg=container._svg.appendChild(document.createElementNS(SVGNS,'g'));
			container._svgg.setAttribute('stroke-width',1);
			container._svgg.setAttribute('stroke','black');
			container._svgg.setAttribute('fill','none');
		}
		processState(data,container,level);
	},
	'_ln_child':function(data,container){
		if(data.constructor==Array){
			container.setAttribute('d',"M"+data);
			if(container.parentElement.getAttribute('width')==""){
				if(container.parentElement.parentElement.style.width)
					container._svg.setAttribute('width',container.style.width);
				var bbox=container.getBBox();
				container.parentElement.setAttribute('width',bbox.x+bbox.width);
				container.parentElement.setAttribute('height',bbox.y+bbox.height);
			}
		}
	},
	'_tb':function(data,container,level){
		var displaykey;
		if(!container._tb){
			container._tb=container._content.appendChild(document.createElement('table'));
			container._displayablekeys=0;
			container.setAttribute('_keycol',0);
			// container._keycolcss=stylesheet.rules[stylesheet.insertRule('',stylesheet.rules.length)];
		}
		for(var key in data){
			if(!key.startsWith('_')){
				if(data[key]===null && container._childmap[key]){
					if(container._childmap[key]._key.innerHTML)
						if(--container._displayablekeys===0)
							container._tb.setAttribute('_keycol',0);
							container.setAttribute('_keycol',0);
					container._childmap[key].remove();
					delete container._childmap[key];
				}else{
					if(!container._childmap[key]){
						container._childmap[key]=container._tb.appendChild(document.createElement('tr'));
						container._childmap[key]._childmap={};
						container._childmap[key]._parentState=container;
						container._childmap[key]._content=container._childmap[key];
						container._childmap[key]._key=container._childmap[key].appendChild(document.createElement('td'));
						container._childmap[key]._key.setAttribute('_keycol',1);
						displaykey=key.startsWith('#')?'':replaceShorthand(key.trim());
						if(displaykey){
							container._childmap[key]._key.innerHTML=displaykey;
							container._displayablekeys++;
							container._tb.setAttribute('_keycol',1);
							container.setAttribute('_keycol',1);
						}
					}
					processOptions(data[key],container._childmap[key]);
					elementTypes._tb_child(data[key],container._childmap[key],level+1);
				}
			}
		}
		if(typeof(data.get('_tb'))==='object'){
			if(data.get('_tb').get('head') && container._tb.children[0])container._tb.children[0].style.borderBottom='solid 2px gray';
			else container._tb.children[0].style.borderBottom='';
		}
	},
	'_tb_child':function(data,container,level){
		var val={"#":""}
		for(var i=0;i<data.length;++i){
			if(!container._childmap[i]){
				container._childmap[i]=container.appendChild(document.createElement('td'));
				container._childmap[i]._childmap={};
				container._childmap[i]._content=container._childmap[i];
			}
			val['#']=data[i];
			processState(val,container._childmap[i],level+1);
		}
	}
}

function taskInstructions(taskOptions){
	//TODO: clean this up, make it work for stap 5.3
	return;
	//taskOptions=taskOptions;
	//console.log(taskOptions);
	var instructions="";
	function keyFormat(key){return key=="_pp"?"the value in popup":"<b>"+key+"</b>";}
	for(key in taskOptions.win){
		if(!key.startsWith('#'))
			instructions+="<li>When "+keyFormat(key)+" is "+taskOptions.win[key]+", you win.\n";
	}
	for(key in taskOptions.loss){
		if(!key.startsWith('#'))
			instructions+="<li>When "+keyFormat(key)+" is "+taskOptions.loss[key]+", you lose.\n";
	}
	for(key in taskOptions.end){
		if(!key.startsWith('#'))
			instructions+='<li>When '+keyFormat(key)+' is '+taskOptions.end[key]+", the task ends.\n";
	}
	for(key in taskOptions.good){
		if(!key.startsWith('#')){
			if(taskOptions.good[key]=='+'){
				if(key.toLowerCase().trim()!=='score')
					instructions+="<li>The higher "+keyFormat(key)+" is, the better.\n";
			}else if(taskOptions.good[key]=='-'){
				instructions+="<li>The lower "+keyFormat(key)+" is, the better.\n";
			}else if(typeof(taskOptions.good[key])==='string'){
				if(taskOptions.good[key].toLowerCase().trim()!=='correct')
					instructions+="<li>Try to get "+keyFormat(key)+' to be "'+taskOptions.good[key]+'".\n';
			}else
				instructions+="<li>Try to get "+keyFormat(key)+' to be '+taskOptions.good[key]+'.\n';
		}
	}
	for(key in taskOptions.bad){
		if(!key.startsWith('#')){
			if(taskOptions.bad[key]=='+')
				instructions+="<li>Avoid higher "+keyFormat(key)+" values.\n";
			else if(taskOptions.bad[key]=='-')
				instructions+="<li>Avoid lower "+keyFormat(key)+" values.\n";
			else if(typeof(taskOptions.bad[key])==='string'){
				if(taskOptions.bad[key].toLowerCase().trim()!=='incorrect')
					instructions+="<li>Avoid "+keyFormat(key)+' from being "'+taskOptions.bad[key]+'".\n';
			}else
				instructions+="<li>Avoid "+keyFormat(key)+' from being '+taskOptions.bad[key]+'.\n';
		}
	}
	if(instructions){
		var idiv=addDiv(document.body,['_task']);
		idiv.innerHTML+='<span style="font-size:1.1em"><b>Instructions</b> (click to dismiss):</span>\n\n<ul>'+instructions+'</ul>';
		idiv.onclick=function(){
			idiv.remove();
		};
	}
}


function processData(data){
	if(data===null){
		maindiv._clear();
	}else if(data.constructor===Array){
		maindiv._setValue(data);
	}else if(typeof(data)==="object"){
		// process special root directives
		if('error' in data){console.log('ERROR: '+data.error);}
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
					//errors=data.require.options.filter(function(x){return !OPTIONS.has(x)});
					if(errors.length){
						sendAction(null,{error:'Sorry, I cannot handle the required directive(s): '+errors});
						document.write('ERROR: Cannot handle required task directive(s): '+errors+'\n\n');
						quit=true;
					}
				}else if(key=='events'){
					errors=data.require.events.filter(function(x){return !EVENTS.has(x)});
					if(errors.length){
						sendAction(null,{error:'Sorry, I cannot handle the required event(s): '+errors});
						document.write('ERROR: Cannot handle required task event(s): '+errors+'\n\n');
						quit=true;
					}
				}else if(key=='types'){
					errors=data.require.types.filter(function(x){return !TYPES.has(x)});
					if(errors.length){
						sendAction(null,{error:'Sorry, I cannot handle the required type(s): '+errors});
						document.write('ERROR: Cannot handle required task type(s): '+errors+'\n\n');
						quit=true;
					}
				}else{
					sendAction(null,{error:'Sorry, I cannot handle "require" directive: '+key+':'+data.require[key]});
					document.write('ERROR: Cannot handle "require" directive: '+key+':'+data.require[key]+'\n\n');
					quit=true;
				}
			}
			if(quit)ws.close();
		}
		if('client' in data){
			var reply={};
			for(var i=0;i<data.client.length;++i){
				if(data.client[i]=='url'){
					reply['url']=objectify(location);
				}else if(data.client[i]=='screen'){
					reply['screen']=objectify(screen);
				}else if(data.client[i]=='ip'){
					reply['ip']=''; //TODO: fix this
				}else if(data.client[i]=='userAgent'){
					reply['userAgent']=clientInformation.userAgent;
				}
			}
			sendAction(null,{client:reply});
		}
		if('template' in data){
			var url=data.template;
			delete data.template;
			loadURLs(url,function(){processData(data);refreshNumerics(maindiv);});
			return;
		}
		if('replace' in data){
			Object.assign(txtReplace,data.replace);
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
		}
		// process other optional element directives
		Object.assign(maindiv._options,data);
		optionUpdate(maindiv,data);
	}
	if(maindiv._content.autoscroll)window.scrollTo(0,document.body.scrollHeight);
}

function init(){
	//check if basic stap.css template is loaded
	var x=document.getElementsByTagName('link');
	for(var i=0;i<x.length;++i){if(x[i]['href'].endsWith('stap.css'))break;}
	if(i==x.length){loadURLs("lib/stap.css",init);return;}
	//create foundational element
	maindiv=addDivs(document.body,'object',0,"__main__");
	//connect to task
	connect();
}

onload=init;

