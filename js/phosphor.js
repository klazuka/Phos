// phosphor.js
//
// Copyright (C) 2009 David J. Goehrig
//
//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
////////////////////////////////////////////////////////////////////////////////////////////////////
// Object Extensions
Object.prototype.parameters = function() {
	var m = /function (\([^)]*\))/.exec(this.toString());
	return m ? m[1] : "";
}
String.prototype.deparameterized = function() {
	var m = /(\w+)\(/.exec(this.toString());
	return  m ? m[1] : this;
}
Object.prototype.property = function(c,k,x,y) {
	return [ a(Block).says(this).at(x,y).by(200,20).copy({ childof: c, valueof: k.deparameterized() })];
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// Array Extensions
Array.prototype.collapse = function() { 
	this.every(function(o,i) { 
		if (o.expanded) o.expanded = o.expanded.collapse();
		o.free();
	})
	return false
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global pointer
var here;		// the last mouse position
var that;		// the last thing selected
var editing;		// the block we're editing
var clipboard;		// the last object we cut or copied

////////////////////////////////////////////////////////////////////////////////////////////////////
// Widget extensions

Widget.down = function(e) { 
	if(!e.on(this)) return;
       	that = this; 
	this.moving = e; 
	if (Keyboard.shift) that.init().to(that.w,that.h);
       	if(e.button < 2) return;
	this.contents = this.contents ? this.contents.collapse() : Block.display(this,this.x,this.y+this.h) 
};
Widget.move = function(e) {
	if (!this.moving) return;
	var dx = e.x - this.moving.x;
	var dy = e.y - this.moving.y;
	this.to(dx,dy);
	if (this.parent) this.clamp(this.parent.x,this.parent.y,this.parent.x+this.parent.w,this.parent.y+this.parent.h);
	if (this.contents) this.contents.every(function(v,i) { v.to(dx,dy)});
	if (this.children) this.children.every(function(v,i) { v.to(dx,dy)});
	this.moving = e;
};
Widget.up = function(e) {
	this.moving = false;
	if (!e.on(this)) return;
	var o = this.overlaps([Display,Phosphor,this]);
	if (!o || !o.is('Graphic') || this == o) return; 
	if (o.children.contains(this)) return;
	o.add(this);
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Names Object
An.object().named('Names').from({ of: function(k) { return k.can('name') ? k.name() : undefined }});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Hotkey Object
An.object().named('HotKey').from({ 
	of: function(k) { this[k]() },
	// Block Widget hotkeys
	'x': function() { clipboard = editing.content; editing.free() },
	'c': function() { clipboard = editing.content }, 
	'v': function() { editing.says(editing.content.append(clipboard)) },
	'/': function() { Search.find() },
	's': function() { 
		if (editing.childof == localStorage && !editing.valueof) 
			(localStorage[editing.content]).post('objects/' + Phosphor.abbr + '-' + editing.content,
				function(txt) {if (!txt) alert('Failed to save try again') }) }, 
	// Phosphor Widget hotkeys
	'd': function() { if (editing.content) editing.content.download() },
	'o': function() { Display.at(0,0) },
	'r': function() { _doc.goto(_doc.location) },
	'h': function() { Phosphor.help.show() },
	'i': function() { Phosphor.inventory.show() },
});
 
////////////////////////////////////////////////////////////////////////////////////////////////////
// Block Object
An.object().named('Block').from(Widget,{
	init: function() { return this.clone().copy({ 
		bg: "gray", moving: false, editing: false, expanded: false, content: false }).instance() },
	says: function(t) { this.content = t; return this },
	evaluate: function() {
		if (!this.content) return "";
		if (this.childof == localStorage) return this.content;
		var retval = this.content
		Sound.click.play();
		try { 
			retval = eval('(' + this.content + ')') 
		} catch(e) { 
			try {
 				retval = eval( this.content );
 			} catch(ee) {
 				Sound.error.play();
 				alert(e); 
 			}
		};
		return retval;
	},
	press: function(e) {
		if (!this.editing || Keyboard.cmd || Keyboard.ctrl) return;
		this.content = e.key == Keyboard.enter && this.childof && this.valueof ?  // NB: don't turn
				this.childof[this.valueof] = this.evaluate():		  // to a says call
			e.key == Keyboard.enter ? 					  // as it will break
				this.evaluate():					  // some objects
			e.key == Keyboard.backspace ? 
				this.content.length == 0 || Keyboard.shift ? 
					this.done():
					this.content.substring(0,this.content.length-1):
			this.content.append(e.key);
		if (this.content && Names.of(this.content)) this.content = Names.of(this.content);
		if (this.content == undefined) this.free();
	},
	done: function() {
		Sound.click.play();
		if (this.expanded) this.expanded = this.expanded.collapse();
		this.free();
	},
	display: function(o,x,y) {
		var w = [];
		o.each(function(v,k) {
			if (!k || !typeof(v)) return;
			w.push(a(Block).says(v.parameters ? k + v.parameters() : k).at(x,y).by(200,20).copy({childof: o }));
			y += 28;
		});
		return w;
	},
	expand: function() {
		if (this.valueof) {
			var t  = a(Block).says(this.childof[this.valueof]).at(this.x+this.w+2,this.y).by(200,20);
			t.expanded = t.expand();
			return false;
		}
		return this.childof ?  
			this.childof[this.content.deparameterized()].property(this.childof,this.content,this.x+this.w+2,this.y):
			this.display(this.evaluate(),this.x,this.y+this.h+4);
	},
	draw: function() {
		if (!this.visible) return;
		Screen[this.editing ? 'white' : 'gray']();
		if (!this.editing && this.childof && this.valueof) this.says(this.childof[this.valueof]);
		Screen.at(this.x,this.y+Screen.size).by(this.w-Screen.size,this.h).font('16 Arial').print(this.content);
		this.by(Math.max(this.w,(Screen.x+Display.x)-this.x + Screen.size),(Screen.y+Display.y)-this.y + Screen.size/2);
		Screen.at(this.x-Screen.size/2,this.y).by(this.w,this.h).frame();
	},
	down: function(e) { 
		if (!e.on(this)) return;
		this.moving = e;
		if (!this.content) return;
		if (e.button < 2) return;
		Sound.click.play();
		this.expanded = this.expanded ? this.expanded.collapse(): this.expand();
	},
	up: function(e) { 
		var o = false;
		var $self = this;
		if (this.moving && (o = App.widgets.any(function(v,k) {
			return ![ $self, Display, Phosphor ].contains(v) 
				&& v.can('on') && v.on($self) && v.editing }))) {
			if (o.childof && !o.valueof) {
				o.childof[o.content.deparameterized()] = o.childof == localStorage ? this.content : this.evaluate();
				this.free();
			} 
			if (!o.childof) {
				if (!window.contains(o.content)) window[o.content] = {};
				o.evaluate()[this.content] = true;	
				if (o.expanded) o.expanded.collapse();
				o.expanded = o.expand();
				this.free();
			}
		}
		this.moving = false;
	},
	move: function(e) { 
		this.editing = e.on(this);
		if (this.editing) editing = this;
		if (this.moving) {
			var dx = e.x - this.moving.x;
			var dy = e.y - this.moving.y;
			this.to(e.x - this.moving.x,e.y -this.moving.y );
			if (this.expanded) this.expanded.every(function(o,i) { 
				if (o.expanded) o.expanded.every(function(m,i) { m.to(dx,dy)});
				o.to(dx,dy)});
			this.moving = e;
		}
	},
});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Phosphor Environment
An.object().named('Phosphor').from(Widget,{
	abbr: localStorage['abbr'] || 'yyz',
	init: function() {
		Sound.copy({
			trash: a(Sound,'sounds/trash.aif'),
			error: a(Sound,'sounds/error.wav'),
			click: a(Sound,'sounds/click.wav'),
		});
		return this.copy({
			help: a(Help,'images/help_button.png').at(Display.w-100,10),
			inventory: an(Inventory),
		}).at(0,Display.h-64).by(Display.w,64).instance();
	},
	press: function(e) { if(Keyboard.ctrl || Keyboard.cmd) HotKey.of(e.key); },
	draw: function() {if (!this.visible) return },
	move: function(e) { here = e },
	down: function(e) {
		if (App.widgets.any(function(o) {
			return o.can('on') && o != Phosphor && o != Display && e.on(o);
		})) return;
		if (e.button < 2) return;
		Sound.click.play();
		a(Block).says('').at(e.x,e.y).by(100,24);
	},
});
////////////////////////////////////////////////////////////////////////////////////////////////////
// Help Object
An.object().named('Help').from(Image,{
	down: function(e) {
		if (!e.on(this) || this.blurb) return;
		Sound.click.play();
		this.blurb = an(Image,'images/help.png').at(300,0);
		this.blurb.down = function(e) { 
			if(!e.on(this)) return;
			Sound.click.play();
			Phosphor.help.blurb = false;
			this.free();
		};
	},
	show: function() { this.down(this); },
});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Inventory Object
An.object().named('Inventory').from(Widget,{
	init: function() { 
		Objects.each(function(v,k) { if (v) localStorage[k] = k });
		return this.clone().instance().copy({
			button: an(Image,'images/inventory_button.png').at(0,10).copy({
				down: function(e) { if (e.on(this)) Phosphor.inventory.show() },
				up: function(e) { 
					var o = this.overlaps([Display,this]);
					if (!o || !o.editing) return;
					localStorage[o.content.deparameterized()] = true;
					Phosphor.inventory.show();	
					o.free();
				},
			}),
			trash: an(Image,'images/trash.png').at(Display.w-64,Display.h-64).copy({
				down: false,
				up: function(e) {
					var o = null;
					while(o = this.overlaps([Display,Phosphor,this])) {
						Sound.trash.play();
						o.free();
						if (localStorage.contains(o.content.deparameterized())) delete localStorage[o.content.deparameterized()];
					};
				},
			}),
		}).at(10,50).get('objects/',function(txt) { 
			eval('(' + txt + ')').each(function(v,k) { localStorage[k] = unescape(v) });
		});
	},
	show: function() {  //NB: don't convert to a says as this switch breaks the bool check 
		this.content = this.content ? this.content.collapse() : Block.display(localStorage, this.x,this.y);
	},
});
////////////////////////////////////////////////////////////////////////////////////////////////////
// End
