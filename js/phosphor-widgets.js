////////////////////////////////////////////////////////////////////////////////////////////////////
// phosphor-widgets.js
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Graphic
An.object().named('Graphic').plural('Graphics').from(Widget,{
	r: 255, g: 255, b: 255,
	color: function(r,g,b) {
		this.r = r; this.g = g; this.b = b;
		return this;
	},
});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Rectangle
An.object().named('Rectangle').plural('Rectangles').from(Graphic,{
	init: function() { return this.clone().by(100,100).instance().here() },
	draw: function() { if(this.visible) Screen.color(this.r,this.g,this.b).as(this).fill().white() },
	bar: function() {},
});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Circle
An.object().named('Circle').plural('Circles').from(Graphic,{
	init: function() { return this.clone().radius(20).instance().here() },
	draw: function() { 
		var r = Screen.rad; 
		if(this.visible) Screen.color(this.r,this.g,this.b).radius(this.rad).at(this.x+this.rad,this.y+this.rad).circle().radius(r).white() },
	radius: function(r) {
		this.by(r*2,r*2).rad = r;
		return this;
	},
	circle: function() {},
});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Text
An.object().named('Text').plural('Texts').from(Widget,{
	print: function(p) { Screen.color(this.r,this.g,this.b).at(this.x,this.y).print(p).white() }
});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Drawing
An.object().named('Drawing').plural('Drawings').from(Widget,{

});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Picker
An.object().named('Picker').from(Circle,{
	init: function() { return this.clone().copy({ gamma: 255, cr: 0, cb: 0 }).instance().radius(128) },
	move: function(e) {
		this.cr = Math.min(255,Math.max(0,e.x - this.x))/255;
		this.cb = Math.min(255,Math.max(0,e.y - this.y))/255;
		this.cg = 1 - Math.sqrt(this.cr*this.cb);
		this.gamma = Math.floor(256*Math.sqrt(this.cr*this.cr + this.cb*this.cb));
		this.color(Math.floor(this.gamma*this.cr),
			Math.floor(this.gamma*this.cg),Math.floor(this.gamma*this.cb));
	},
	down: function(e) { if (e.on(this) && that.can('color')) that.color(this.r,this.g,this.b) },
});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Territory
An.object().named('Territory').from(Circle, {
	init: function(x) { 
		var target = typeof(x) == "string" ? x : x.name();
		return this.clone().copy({
			target:  target,
		}).radius(window[target].slots()).instance();
	},
	down: function(e) {
		if (!e.on(this)) return;
		this.moving = e;
		if (e.button > 1) alert('expanding');			
	},
});
