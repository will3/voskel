(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global) {

function CBuffer() {
	// handle cases where "new" keyword wasn't used
	if (!(this instanceof CBuffer)) {
		// multiple conditions need to be checked to properly emulate Array
		if (arguments.length > 1 || typeof arguments[0] !== 'number') {
			return CBuffer.apply(new CBuffer(arguments.length), arguments);
		} else {
			return new CBuffer(arguments[0]);
		}
	}
	// if no arguments, then nothing needs to be set
	if (arguments.length === 0)
	throw new Error('Missing Argument: You must pass a valid buffer length');
	// this is the same in either scenario
	this.size = this.start = 0;
	// set to callback fn if data is about to be overwritten
	this.overflow = null;
	// emulate Array based on passed arguments
	if (arguments.length > 1 || typeof arguments[0] !== 'number') {
		this.data = new Array(arguments.length);
		this.end = (this.length = arguments.length) - 1;
		this.push.apply(this, arguments);
	} else {
		this.data = new Array(arguments[0]);
		this.end = (this.length = arguments[0]) - 1;
	}
	// need to `return this` so `return CBuffer.apply` works
	return this;
}

function defaultComparitor(a, b) {
	return a == b ? 0 : a > b ? 1 : -1;
}

CBuffer.prototype = {
	// properly set constructor
	constructor : CBuffer,

	/* mutator methods */
	// pop last item
	pop : function () {
		var item;
		if (this.size === 0) return;
		item = this.data[this.end];
		// remove the reference to the object so it can be garbage collected
		delete this.data[this.end];
		this.end = (this.end - 1 + this.length) % this.length;
		this.size--;
		return item;
	},
	// push item to the end
	push : function () {
		var i = 0;
		// check if overflow is set, and if data is about to be overwritten
		if (this.overflow && this.size + arguments.length > this.length) {
			// call overflow function and send data that's about to be overwritten
			for (; i < this.size + arguments.length - this.length; i++) {
				this.overflow(this.data[(this.end + i + 1) % this.length], this);
			}
		}
		// push items to the end, wrapping and erasing existing items
		// using arguments variable directly to reduce gc footprint
		for (i = 0; i < arguments.length; i++) {
			this.data[(this.end + i + 1) % this.length] = arguments[i];
		}
		// recalculate size
		if (this.size < this.length) {
			if (this.size + i > this.length) this.size = this.length;
			else this.size += i;
		}
		// recalculate end
		this.end = (this.end + i) % this.length;
		// recalculate start
		this.start = (this.length + this.end - this.size + 1) % this.length;
		// return number current number of items in CBuffer
		return this.size;
	},
	// reverse order of the buffer
	reverse : function () {
		var i = 0,
			tmp;
		for (; i < ~~(this.size / 2); i++) {
			tmp = this.data[(this.start + i) % this.length];
			this.data[(this.start + i) % this.length] = this.data[(this.start + (this.size - i - 1)) % this.length];
			this.data[(this.start + (this.size - i - 1)) % this.length] = tmp;
		}
		return this;
	},
	// rotate buffer to the left by cntr, or by 1
	rotateLeft : function (cntr) {
		if (typeof cntr === 'undefined') cntr = 1;
		if (typeof cntr !== 'number') throw new Error("Argument must be a number");
		while (--cntr >= 0) {
			this.push(this.shift());
		}
		return this;
	},
	// rotate buffer to the right by cntr, or by 1
	rotateRight : function (cntr) {
		if (typeof cntr === 'undefined') cntr = 1;
		if (typeof cntr !== 'number') throw new Error("Argument must be a number");
		while (--cntr >= 0) {
			this.unshift(this.pop());
		}
		return this;
	},
	// remove and return first item
	shift : function () {
		var item;
		// check if there are any items in CBuff
		if (this.size === 0) return;
		// store first item for return
		item = this.data[this.start];
		// recalculate start of CBuffer
		this.start = (this.start + 1) % this.length;
		// decrement size
		this.size--;
		return item;
	},
	// sort items
	sort : function (fn) {
		this.data.sort(fn || defaultComparitor);
		this.start = 0;
		this.end = this.size - 1;
		return this;
	},
	// add item to beginning of buffer
	unshift : function () {
		var i = 0;
		// check if overflow is set, and if data is about to be overwritten
		if (this.overflow && this.size + arguments.length > this.length) {
			// call overflow function and send data that's about to be overwritten
			for (; i < this.size + arguments.length - this.length; i++) {
				this.overflow(this.data[this.end - (i % this.length)], this);
			}
		}
		for (i = 0; i < arguments.length; i++) {
			this.data[(this.length + this.start - (i % this.length) - 1) % this.length] = arguments[i];
		}
		if (this.length - this.size - i < 0) {
			this.end += this.length - this.size - i;
			if (this.end < 0) this.end = this.length + (this.end % this.length);
		}
		if (this.size < this.length) {
			if (this.size + i > this.length) this.size = this.length;
			else this.size += i;
		}
		this.start -= arguments.length;
		if (this.start < 0) this.start = this.length + (this.start % this.length);
		return this.size;
	},

	/* accessor methods */
	// return index of first matched element
	indexOf : function (arg, idx) {
		if (!idx) idx = 0;
		for (; idx < this.size; idx++) {
			if (this.data[(this.start + idx) % this.length] === arg) return idx;
		}
		return -1;
	},
	// return last index of the first match
	lastIndexOf : function (arg, idx) {
		if (!idx) idx = this.size - 1;
		for (; idx >= 0; idx--) {
			if (this.data[(this.start + idx) % this.length] === arg) return idx;
		}
		return -1;
	},

	// return the index an item would be inserted to if this
	// is a sorted circular buffer
	sortedIndex : function(value, comparitor, context) {
		comparitor = comparitor || defaultComparitor;
		var low = this.start,
			high = this.size - 1;

		// Tricky part is finding if its before or after the pivot
		// we can get this info by checking if the target is less than
		// the last item. After that it's just a typical binary search.
		if (low && comparitor.call(context, value, this.data[high]) > 0) {
			low = 0, high = this.end;
		}

		while (low < high) {
		  var mid = (low + high) >>> 1;
		  if (comparitor.call(context, value, this.data[mid]) > 0) low = mid + 1;
		  else high = mid;
		}
		// http://stackoverflow.com/a/18618273/1517919
		return (((low - this.start) % this.size) + this.size) % this.size;
	},

	/* iteration methods */
	// check every item in the array against a test
	every : function (callback, context) {
		var i = 0;
		for (; i < this.size; i++) {
			if (!callback.call(context, this.data[(this.start + i) % this.length], i, this))
				return false;
		}
		return true;
	},
	// loop through each item in buffer
	// TODO: figure out how to emulate Array use better
	forEach : function (callback, context) {
		var i = 0;
		for (; i < this.size; i++) {
			callback.call(context, this.data[(this.start + i) % this.length], i, this);
		}
	},
	// check items agains test until one returns true
	// TODO: figure out how to emuldate Array use better
	some : function (callback, context) {
		var i = 0;
		for (; i < this.size; i++) {
			if (callback.call(context, this.data[(this.start + i) % this.length], i, this))
				return true;
		}
		return false;
	},
	// calculate the average value of a circular buffer
	avg : function () {
		return this.size == 0 ? 0 : (this.sum() / this.size);
	},
	// loop through each item in buffer and calculate sum
	sum : function () {
		var index = this.size;
		var s = 0;
		while (index--) s += this.data[index];
		return s;
	},
	// loop through each item in buffer and calculate median
	median : function () {
		if (this.size === 0)
			return 0;
		var values = this.slice().sort(defaultComparitor);
		var half = Math.floor(values.length / 2);
		if(values.length % 2)
			return values[half];
		else
			return (values[half-1] + values[half]) / 2.0;
	},
	/* utility methods */
	// reset pointers to buffer with zero items
	// note: this will not remove values in cbuffer, so if for security values
	//       need to be overwritten, run `.fill(null).empty()`
	empty : function () {
		var i = 0;
		this.size = this.start = 0;
		this.end = this.length - 1;
		return this;
	},
	// fill all places with passed value or function
	fill : function (arg) {
		var i = 0;
		if (typeof arg === 'function') {
			while(this.data[i] = arg(), ++i < this.length);
		} else {
			while(this.data[i] = arg, ++i < this.length);
		}
		// reposition start/end
		this.start = 0;
		this.end = this.length - 1;
		this.size = this.length;
		return this;
	},
	// return first item in buffer
	first : function () {
		return this.data[this.start];
	},
	// return last item in buffer
	last : function () {
		return this.data[this.end];
	},
	// return specific index in buffer
	get : function (arg) {
		return this.data[(this.start + arg) % this.length];
	},
	isFull : function (arg) {
		return this.length === this.size;
	},
	// set value at specified index
	set : function (idx, arg) {
		return this.data[(this.start + idx) % this.length] = arg;
	},
	// return clean array of values
	toArray : function () {
		return this.slice();
	},
	// slice the buffer to an arraay
	slice : function (start, end) {
		var length = this.size;

		start = +start || 0;

		if (start < 0) {
			if (start >= end)
				return [];
			start = (-start > length) ? 0 : length + start;
		}

		if (end == null || end > length)
			end = length;
		else if (end < 0)
			end += length;
		else
			end = +end || 0;

		length = start < end ? end - start : 0;

		var result = Array(length);
		for (var index = 0; index < length; index++) {
			result[index] = this.data[(this.start + start + index) % this.length];
		}
		return result;
	}
};

if (typeof module === 'object' && module.exports) module.exports = CBuffer;
else global.CBuffer = CBuffer;

}(this));

},{}],2:[function(require,module,exports){
"use strict"

var pool = require("typedarray-pool")
var uniq = require("uniq")
var iota = require("iota-array")

function generateMesher(order, skip, merge, append, num_options, options, useGetter) {
  var code = []
  var d = order.length
  var i, j, k
  
  //Build arguments for append macro
  var append_args = new Array(2*d+1+num_options)
  for(i=0; i<d; ++i) {
    append_args[i] = "i"+i
  }
  for(i=0; i<d; ++i) {
    append_args[i+d] = "j"+i
  }
  append_args[2*d] = "oval"
  
  var opt_args = new Array(num_options)
  for(i=0; i<num_options; ++i) {
    opt_args[i] = "opt"+i
    append_args[2*d+1+i] = "opt"+i
  }

  //Unpack stride and shape arrays into variables
  code.push("var data=array.data,offset=array.offset,shape=array.shape,stride=array.stride")
  for(var i=0; i<d; ++i) {
    code.push(["var stride",i,"=stride[",order[i],"]|0,shape",i,"=shape[",order[i],"]|0"].join(""))
    if(i > 0) {
      code.push(["var astep",i,"=(stride",i,"-stride",i-1,"*shape",i-1,")|0"].join(""))
    } else {
      code.push(["var astep",i,"=stride",i,"|0"].join(""))
    }
    if(i > 0) {
      code.push(["var vstep",i,"=(vstep",i-1,"*shape",i-1,")|0"].join(""))
    } else {
      code.push(["var vstep",i,"=1"].join(""))
    }
    code.push(["var i",i,"=0,j",i,"=0,k",i,"=0,ustep",i,"=vstep",i,"|0,bstep",i,"=astep",i,"|0"].join(""))
  }
  
  //Initialize pointers
  code.push("var a_ptr=offset>>>0,b_ptr=0,u_ptr=0,v_ptr=0,i=0,d=0,val=0,oval=0")
  
  //Initialize count
  code.push("var count=" + iota(d).map(function(i) { return "shape"+i}).join("*"))
  code.push("var visited=mallocUint8(count)")
  
  //Zero out visited map
  code.push("for(;i<count;++i){visited[i]=0}")
  
  //Begin traversal
  for(i=d-1; i>=0; --i) {
    code.push(["for(i",i,"=0;i",i,"<shape",i,";++i",i,"){"].join(""))
  }
  code.push("if(!visited[v_ptr]){")
  
    if(useGetter) {
      code.push("val=data.get(a_ptr)")
    } else {
      code.push("val=data[a_ptr]")
    }
  
    if(skip) {
      code.push("if(!skip(val)){")
    } else {
      code.push("if(val!==0){")
    }
  
      //Save val to oval
      code.push("oval = val")
  
      //Generate merging code
      for(i=0; i<d; ++i) {
        code.push("u_ptr=v_ptr+vstep"+i)
        code.push("b_ptr=a_ptr+stride"+i)
        code.push(["j",i,"_loop: for(j",i,"=1+i",i,";j",i,"<shape",i,";++j",i,"){"].join(""))
        for(j=i-1; j>=0; --j) {
          code.push(["for(k",j,"=i",j,";k",j,"<j",j,";++k",j,"){"].join(""))
        }
        
          //Check if we can merge this voxel
          code.push("if(visited[u_ptr]) { break j"+i+"_loop; }")
        
          if(useGetter) {
            code.push("val=data.get(b_ptr)")
          } else {
            code.push("val=data[b_ptr]")
          }
        
          if(skip && merge) {
            code.push("if(skip(val) || !merge(oval,val)){ break j"+i+"_loop; }")
          } else if(skip) {
            code.push("if(skip(val) || val !== oval){ break j"+i+"_loop; }")
          } else if(merge) {
            code.push("if(val === 0 || !merge(oval,val)){ break j"+i+"_loop; }")
          } else {
            code.push("if(val === 0 || val !== oval){ break j"+i+"_loop; }")
          }
          
          //Close off loop bodies
          code.push("++u_ptr")
          code.push("b_ptr+=stride0")
        code.push("}")
        
        for(j=1; j<=i; ++j) {
          code.push("u_ptr+=ustep"+j)
          code.push("b_ptr+=bstep"+j)
          code.push("}")
        }
        if(i < d-1) {
          code.push("d=j"+i+"-i"+i)
          code.push(["ustep",i+1,"=(vstep",i+1,"-vstep",i,"*d)|0"].join(""))
          code.push(["bstep",i+1,"=(stride",i+1,"-stride",i,"*d)|0"].join(""))
        }
      }
  
      //Mark off visited table
      code.push("u_ptr=v_ptr")
      for(i=d-1; i>=0; --i) {
        code.push(["for(k",i,"=i",i,";k",i,"<j",i,";++k",i,"){"].join(""))
      }
      code.push("visited[u_ptr++]=1")
      code.push("}")
      for(i=1; i<d; ++i) {
        code.push("u_ptr+=ustep"+i)
        code.push("}")
      }
  
      //Append chunk to mesh
      code.push("append("+ append_args.join(",")+ ")")
    
    code.push("}")
  code.push("}")
  code.push("++v_ptr")
  for(var i=0; i<d; ++i) {
    code.push("a_ptr+=astep"+i)
    code.push("}")
  }
  
  code.push("freeUint8(visited)")
  
  if(options.debug) {
    console.log("GENERATING MESHER:")
    console.log(code.join("\n"))
  }
  
  //Compile procedure
  var args = ["append", "mallocUint8", "freeUint8"]
  if(merge) {
    args.unshift("merge")
  }
  if(skip) {
    args.unshift("skip")
  }
  
  //Build wrapper
  var local_args = ["array"].concat(opt_args)
  var funcName = ["greedyMesher", d, "d_ord", order.join("s") , (skip ? "skip" : "") , (merge ? "merge" : "")].join("")
  var gen_body = ["'use strict';function ", funcName, "(", local_args.join(","), "){", code.join("\n"), "};return ", funcName].join("")
  args.push(gen_body)
  var proc = Function.apply(undefined, args)
  
  if(skip && merge) {
    return proc(skip, merge, append, pool.mallocUint8, pool.freeUint8)
  } else if(skip) {
    return proc(skip, append, pool.mallocUint8, pool.freeUint8)
  } else if(merge) {
    return proc(merge, append, pool.mallocUint8, pool.freeUint8)
  } else {
    return proc(append, pool.mallocUint8, pool.freeUint8)
  }
}

//The actual mesh compiler
function compileMesher(options) {
  options = options || {}
  if(!options.order) {
    throw new Error("greedy-mesher: Missing order field")
  }
  if(!options.append) {
    throw new Error("greedy-mesher: Missing append field")
  }
  return generateMesher(
    options.order,
    options.skip,
    options.merge,
    options.append,
    options.extraArgs|0,
    options,
    !!options.useGetter
  )
}
module.exports = compileMesher

},{"iota-array":3,"typedarray-pool":6,"uniq":7}],3:[function(require,module,exports){
"use strict"

function iota(n) {
  var result = new Array(n)
  for(var i=0; i<n; ++i) {
    result[i] = i
  }
  return result
}

module.exports = iota
},{}],4:[function(require,module,exports){
/**
 * Bit twiddling hacks for JavaScript.
 *
 * Author: Mikola Lysenko
 *
 * Ported from Stanford bit twiddling hack library:
 *    http://graphics.stanford.edu/~seander/bithacks.html
 */

"use strict"; "use restrict";

//Number of bits in an integer
var INT_BITS = 32;

//Constants
exports.INT_BITS  = INT_BITS;
exports.INT_MAX   =  0x7fffffff;
exports.INT_MIN   = -1<<(INT_BITS-1);

//Returns -1, 0, +1 depending on sign of x
exports.sign = function(v) {
  return (v > 0) - (v < 0);
}

//Computes absolute value of integer
exports.abs = function(v) {
  var mask = v >> (INT_BITS-1);
  return (v ^ mask) - mask;
}

//Computes minimum of integers x and y
exports.min = function(x, y) {
  return y ^ ((x ^ y) & -(x < y));
}

//Computes maximum of integers x and y
exports.max = function(x, y) {
  return x ^ ((x ^ y) & -(x < y));
}

//Checks if a number is a power of two
exports.isPow2 = function(v) {
  return !(v & (v-1)) && (!!v);
}

//Computes log base 2 of v
exports.log2 = function(v) {
  var r, shift;
  r =     (v > 0xFFFF) << 4; v >>>= r;
  shift = (v > 0xFF  ) << 3; v >>>= shift; r |= shift;
  shift = (v > 0xF   ) << 2; v >>>= shift; r |= shift;
  shift = (v > 0x3   ) << 1; v >>>= shift; r |= shift;
  return r | (v >> 1);
}

//Computes log base 10 of v
exports.log10 = function(v) {
  return  (v >= 1000000000) ? 9 : (v >= 100000000) ? 8 : (v >= 10000000) ? 7 :
          (v >= 1000000) ? 6 : (v >= 100000) ? 5 : (v >= 10000) ? 4 :
          (v >= 1000) ? 3 : (v >= 100) ? 2 : (v >= 10) ? 1 : 0;
}

//Counts number of bits
exports.popCount = function(v) {
  v = v - ((v >>> 1) & 0x55555555);
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return ((v + (v >>> 4) & 0xF0F0F0F) * 0x1010101) >>> 24;
}

//Counts number of trailing zeros
function countTrailingZeros(v) {
  var c = 32;
  v &= -v;
  if (v) c--;
  if (v & 0x0000FFFF) c -= 16;
  if (v & 0x00FF00FF) c -= 8;
  if (v & 0x0F0F0F0F) c -= 4;
  if (v & 0x33333333) c -= 2;
  if (v & 0x55555555) c -= 1;
  return c;
}
exports.countTrailingZeros = countTrailingZeros;

//Rounds to next power of 2
exports.nextPow2 = function(v) {
  v += v === 0;
  --v;
  v |= v >>> 1;
  v |= v >>> 2;
  v |= v >>> 4;
  v |= v >>> 8;
  v |= v >>> 16;
  return v + 1;
}

//Rounds down to previous power of 2
exports.prevPow2 = function(v) {
  v |= v >>> 1;
  v |= v >>> 2;
  v |= v >>> 4;
  v |= v >>> 8;
  v |= v >>> 16;
  return v - (v>>>1);
}

//Computes parity of word
exports.parity = function(v) {
  v ^= v >>> 16;
  v ^= v >>> 8;
  v ^= v >>> 4;
  v &= 0xf;
  return (0x6996 >>> v) & 1;
}

var REVERSE_TABLE = new Array(256);

(function(tab) {
  for(var i=0; i<256; ++i) {
    var v = i, r = i, s = 7;
    for (v >>>= 1; v; v >>>= 1) {
      r <<= 1;
      r |= v & 1;
      --s;
    }
    tab[i] = (r << s) & 0xff;
  }
})(REVERSE_TABLE);

//Reverse bits in a 32 bit word
exports.reverse = function(v) {
  return  (REVERSE_TABLE[ v         & 0xff] << 24) |
          (REVERSE_TABLE[(v >>> 8)  & 0xff] << 16) |
          (REVERSE_TABLE[(v >>> 16) & 0xff] << 8)  |
           REVERSE_TABLE[(v >>> 24) & 0xff];
}

//Interleave bits of 2 coordinates with 16 bits.  Useful for fast quadtree codes
exports.interleave2 = function(x, y) {
  x &= 0xFFFF;
  x = (x | (x << 8)) & 0x00FF00FF;
  x = (x | (x << 4)) & 0x0F0F0F0F;
  x = (x | (x << 2)) & 0x33333333;
  x = (x | (x << 1)) & 0x55555555;

  y &= 0xFFFF;
  y = (y | (y << 8)) & 0x00FF00FF;
  y = (y | (y << 4)) & 0x0F0F0F0F;
  y = (y | (y << 2)) & 0x33333333;
  y = (y | (y << 1)) & 0x55555555;

  return x | (y << 1);
}

//Extracts the nth interleaved component
exports.deinterleave2 = function(v, n) {
  v = (v >>> n) & 0x55555555;
  v = (v | (v >>> 1))  & 0x33333333;
  v = (v | (v >>> 2))  & 0x0F0F0F0F;
  v = (v | (v >>> 4))  & 0x00FF00FF;
  v = (v | (v >>> 16)) & 0x000FFFF;
  return (v << 16) >> 16;
}


//Interleave bits of 3 coordinates, each with 10 bits.  Useful for fast octree codes
exports.interleave3 = function(x, y, z) {
  x &= 0x3FF;
  x  = (x | (x<<16)) & 4278190335;
  x  = (x | (x<<8))  & 251719695;
  x  = (x | (x<<4))  & 3272356035;
  x  = (x | (x<<2))  & 1227133513;

  y &= 0x3FF;
  y  = (y | (y<<16)) & 4278190335;
  y  = (y | (y<<8))  & 251719695;
  y  = (y | (y<<4))  & 3272356035;
  y  = (y | (y<<2))  & 1227133513;
  x |= (y << 1);
  
  z &= 0x3FF;
  z  = (z | (z<<16)) & 4278190335;
  z  = (z | (z<<8))  & 251719695;
  z  = (z | (z<<4))  & 3272356035;
  z  = (z | (z<<2))  & 1227133513;
  
  return x | (z << 2);
}

//Extracts nth interleaved component of a 3-tuple
exports.deinterleave3 = function(v, n) {
  v = (v >>> n)       & 1227133513;
  v = (v | (v>>>2))   & 3272356035;
  v = (v | (v>>>4))   & 251719695;
  v = (v | (v>>>8))   & 4278190335;
  v = (v | (v>>>16))  & 0x3FF;
  return (v<<22)>>22;
}

//Computes next combination in colexicographic order (this is mistakenly called nextPermutation on the bit twiddling hacks page)
exports.nextCombination = function(v) {
  var t = v | (v - 1);
  return (t + 1) | (((~t & -~t) - 1) >>> (countTrailingZeros(v) + 1));
}


},{}],5:[function(require,module,exports){
"use strict"

function dupe_array(count, value, i) {
  var c = count[i]|0
  if(c <= 0) {
    return []
  }
  var result = new Array(c), j
  if(i === count.length-1) {
    for(j=0; j<c; ++j) {
      result[j] = value
    }
  } else {
    for(j=0; j<c; ++j) {
      result[j] = dupe_array(count, value, i+1)
    }
  }
  return result
}

function dupe_number(count, value) {
  var result, i
  result = new Array(count)
  for(i=0; i<count; ++i) {
    result[i] = value
  }
  return result
}

function dupe(count, value) {
  if(typeof value === "undefined") {
    value = 0
  }
  switch(typeof count) {
    case "number":
      if(count > 0) {
        return dupe_number(count|0, value)
      }
    break
    case "object":
      if(typeof (count.length) === "number") {
        return dupe_array(count, value, 0)
      }
    break
  }
  return []
}

module.exports = dupe
},{}],6:[function(require,module,exports){
(function (global,Buffer){
'use strict'

var bits = require('bit-twiddle')
var dup = require('dup')

//Legacy pool support
if(!global.__TYPEDARRAY_POOL) {
  global.__TYPEDARRAY_POOL = {
      UINT8   : dup([32, 0])
    , UINT16  : dup([32, 0])
    , UINT32  : dup([32, 0])
    , INT8    : dup([32, 0])
    , INT16   : dup([32, 0])
    , INT32   : dup([32, 0])
    , FLOAT   : dup([32, 0])
    , DOUBLE  : dup([32, 0])
    , DATA    : dup([32, 0])
    , UINT8C  : dup([32, 0])
    , BUFFER  : dup([32, 0])
  }
}

var hasUint8C = (typeof Uint8ClampedArray) !== 'undefined'
var POOL = global.__TYPEDARRAY_POOL

//Upgrade pool
if(!POOL.UINT8C) {
  POOL.UINT8C = dup([32, 0])
}
if(!POOL.BUFFER) {
  POOL.BUFFER = dup([32, 0])
}

//New technique: Only allocate from ArrayBufferView and Buffer
var DATA    = POOL.DATA
  , BUFFER  = POOL.BUFFER

exports.free = function free(array) {
  if(Buffer.isBuffer(array)) {
    BUFFER[bits.log2(array.length)].push(array)
  } else {
    if(Object.prototype.toString.call(array) !== '[object ArrayBuffer]') {
      array = array.buffer
    }
    if(!array) {
      return
    }
    var n = array.length || array.byteLength
    var log_n = bits.log2(n)|0
    DATA[log_n].push(array)
  }
}

function freeArrayBuffer(buffer) {
  if(!buffer) {
    return
  }
  var n = buffer.length || buffer.byteLength
  var log_n = bits.log2(n)
  DATA[log_n].push(buffer)
}

function freeTypedArray(array) {
  freeArrayBuffer(array.buffer)
}

exports.freeUint8 =
exports.freeUint16 =
exports.freeUint32 =
exports.freeInt8 =
exports.freeInt16 =
exports.freeInt32 =
exports.freeFloat32 = 
exports.freeFloat =
exports.freeFloat64 = 
exports.freeDouble = 
exports.freeUint8Clamped = 
exports.freeDataView = freeTypedArray

exports.freeArrayBuffer = freeArrayBuffer

exports.freeBuffer = function freeBuffer(array) {
  BUFFER[bits.log2(array.length)].push(array)
}

exports.malloc = function malloc(n, dtype) {
  if(dtype === undefined || dtype === 'arraybuffer') {
    return mallocArrayBuffer(n)
  } else {
    switch(dtype) {
      case 'uint8':
        return mallocUint8(n)
      case 'uint16':
        return mallocUint16(n)
      case 'uint32':
        return mallocUint32(n)
      case 'int8':
        return mallocInt8(n)
      case 'int16':
        return mallocInt16(n)
      case 'int32':
        return mallocInt32(n)
      case 'float':
      case 'float32':
        return mallocFloat(n)
      case 'double':
      case 'float64':
        return mallocDouble(n)
      case 'uint8_clamped':
        return mallocUint8Clamped(n)
      case 'buffer':
        return mallocBuffer(n)
      case 'data':
      case 'dataview':
        return mallocDataView(n)

      default:
        return null
    }
  }
  return null
}

function mallocArrayBuffer(n) {
  var n = bits.nextPow2(n)
  var log_n = bits.log2(n)
  var d = DATA[log_n]
  if(d.length > 0) {
    return d.pop()
  }
  return new ArrayBuffer(n)
}
exports.mallocArrayBuffer = mallocArrayBuffer

function mallocUint8(n) {
  return new Uint8Array(mallocArrayBuffer(n), 0, n)
}
exports.mallocUint8 = mallocUint8

function mallocUint16(n) {
  return new Uint16Array(mallocArrayBuffer(2*n), 0, n)
}
exports.mallocUint16 = mallocUint16

function mallocUint32(n) {
  return new Uint32Array(mallocArrayBuffer(4*n), 0, n)
}
exports.mallocUint32 = mallocUint32

function mallocInt8(n) {
  return new Int8Array(mallocArrayBuffer(n), 0, n)
}
exports.mallocInt8 = mallocInt8

function mallocInt16(n) {
  return new Int16Array(mallocArrayBuffer(2*n), 0, n)
}
exports.mallocInt16 = mallocInt16

function mallocInt32(n) {
  return new Int32Array(mallocArrayBuffer(4*n), 0, n)
}
exports.mallocInt32 = mallocInt32

function mallocFloat(n) {
  return new Float32Array(mallocArrayBuffer(4*n), 0, n)
}
exports.mallocFloat32 = exports.mallocFloat = mallocFloat

function mallocDouble(n) {
  return new Float64Array(mallocArrayBuffer(8*n), 0, n)
}
exports.mallocFloat64 = exports.mallocDouble = mallocDouble

function mallocUint8Clamped(n) {
  if(hasUint8C) {
    return new Uint8ClampedArray(mallocArrayBuffer(n), 0, n)
  } else {
    return mallocUint8(n)
  }
}
exports.mallocUint8Clamped = mallocUint8Clamped

function mallocDataView(n) {
  return new DataView(mallocArrayBuffer(n), 0, n)
}
exports.mallocDataView = mallocDataView

function mallocBuffer(n) {
  n = bits.nextPow2(n)
  var log_n = bits.log2(n)
  var cache = BUFFER[log_n]
  if(cache.length > 0) {
    return cache.pop()
  }
  return new Buffer(n)
}
exports.mallocBuffer = mallocBuffer

exports.clearCache = function clearCache() {
  for(var i=0; i<32; ++i) {
    POOL.UINT8[i].length = 0
    POOL.UINT16[i].length = 0
    POOL.UINT32[i].length = 0
    POOL.INT8[i].length = 0
    POOL.INT16[i].length = 0
    POOL.INT32[i].length = 0
    POOL.FLOAT[i].length = 0
    POOL.DOUBLE[i].length = 0
    POOL.UINT8C[i].length = 0
    DATA[i].length = 0
    BUFFER[i].length = 0
  }
}
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)

},{"bit-twiddle":4,"buffer":62,"dup":5}],7:[function(require,module,exports){
"use strict"

function unique_pred(list, compare) {
  var ptr = 1
    , len = list.length
    , a=list[0], b=list[0]
  for(var i=1; i<len; ++i) {
    b = a
    a = list[i]
    if(compare(a, b)) {
      if(i === ptr) {
        ptr++
        continue
      }
      list[ptr++] = a
    }
  }
  list.length = ptr
  return list
}

function unique_eq(list) {
  var ptr = 1
    , len = list.length
    , a=list[0], b = list[0]
  for(var i=1; i<len; ++i, b=a) {
    b = a
    a = list[i]
    if(a !== b) {
      if(i === ptr) {
        ptr++
        continue
      }
      list[ptr++] = a
    }
  }
  list.length = ptr
  return list
}

function unique(list, compare, sorted) {
  if(list.length === 0) {
    return list
  }
  if(compare) {
    if(!sorted) {
      list.sort(compare)
    }
    return unique_pred(list, compare)
  }
  if(!sorted) {
    list.sort()
  }
  return unique_eq(list)
}

module.exports = unique

},{}],8:[function(require,module,exports){
// Source: http://jsfiddle.net/vWx8V/
// http://stackoverflow.com/questions/5603195/full-list-of-javascript-keycodes



/**
 * Conenience method returns corresponding value for given keyName or keyCode.
 *
 * @param {Mixed} keyCode {Number} or keyName {String}
 * @return {Mixed}
 * @api public
 */

exports = module.exports = function(searchInput) {
  // Keyboard Events
  if (searchInput && 'object' === typeof searchInput) {
    var hasKeyCode = searchInput.which || searchInput.keyCode || searchInput.charCode
    if (hasKeyCode) searchInput = hasKeyCode
  }

  // Numbers
  if ('number' === typeof searchInput) return names[searchInput]

  // Everything else (cast to string)
  var search = String(searchInput)

  // check codes
  var foundNamedKey = codes[search.toLowerCase()]
  if (foundNamedKey) return foundNamedKey

  // check aliases
  var foundNamedKey = aliases[search.toLowerCase()]
  if (foundNamedKey) return foundNamedKey

  // weird character?
  if (search.length === 1) return search.charCodeAt(0)

  return undefined
}

/**
 * Get by name
 *
 *   exports.code['enter'] // => 13
 */

var codes = exports.code = exports.codes = {
  'backspace': 8,
  'tab': 9,
  'enter': 13,
  'shift': 16,
  'ctrl': 17,
  'alt': 18,
  'pause/break': 19,
  'caps lock': 20,
  'esc': 27,
  'space': 32,
  'page up': 33,
  'page down': 34,
  'end': 35,
  'home': 36,
  'left': 37,
  'up': 38,
  'right': 39,
  'down': 40,
  'insert': 45,
  'delete': 46,
  'command': 91,
  'right click': 93,
  'numpad *': 106,
  'numpad +': 107,
  'numpad -': 109,
  'numpad .': 110,
  'numpad /': 111,
  'num lock': 144,
  'scroll lock': 145,
  'my computer': 182,
  'my calculator': 183,
  ';': 186,
  '=': 187,
  ',': 188,
  '-': 189,
  '.': 190,
  '/': 191,
  '`': 192,
  '[': 219,
  '\\': 220,
  ']': 221,
  "'": 222,
}

// Helper aliases

var aliases = exports.aliases = {
  'windows': 91,
  '⇧': 16,
  '⌥': 18,
  '⌃': 17,
  '⌘': 91,
  'ctl': 17,
  'control': 17,
  'option': 18,
  'pause': 19,
  'break': 19,
  'caps': 20,
  'return': 13,
  'escape': 27,
  'spc': 32,
  'pgup': 33,
  'pgdn': 33,
  'ins': 45,
  'del': 46,
  'cmd': 91
}


/*!
 * Programatically add the following
 */

// lower case chars
for (i = 97; i < 123; i++) codes[String.fromCharCode(i)] = i - 32

// numbers
for (var i = 48; i < 58; i++) codes[i - 48] = i

// function keys
for (i = 1; i < 13; i++) codes['f'+i] = i + 111

// numpad keys
for (i = 0; i < 10; i++) codes['numpad '+i] = i + 96

/**
 * Get by code
 *
 *   exports.name[13] // => 'Enter'
 */

var names = exports.names = exports.title = {} // title for backward compat

// Create reverse mapping
for (i in codes) names[codes[i]] = i

// Add aliases
for (var alias in aliases) {
  codes[alias] = aliases[alias]
}

},{}],9:[function(require,module,exports){
module.exports = function (args, opts) {
    if (!opts) opts = {};
    
    var flags = { bools : {}, strings : {}, unknownFn: null };

    if (typeof opts['unknown'] === 'function') {
        flags.unknownFn = opts['unknown'];
    }

    if (typeof opts['boolean'] === 'boolean' && opts['boolean']) {
      flags.allBools = true;
    } else {
      [].concat(opts['boolean']).filter(Boolean).forEach(function (key) {
          flags.bools[key] = true;
      });
    }
    
    var aliases = {};
    Object.keys(opts.alias || {}).forEach(function (key) {
        aliases[key] = [].concat(opts.alias[key]);
        aliases[key].forEach(function (x) {
            aliases[x] = [key].concat(aliases[key].filter(function (y) {
                return x !== y;
            }));
        });
    });

    [].concat(opts.string).filter(Boolean).forEach(function (key) {
        flags.strings[key] = true;
        if (aliases[key]) {
            flags.strings[aliases[key]] = true;
        }
     });

    var defaults = opts['default'] || {};
    
    var argv = { _ : [] };
    Object.keys(flags.bools).forEach(function (key) {
        setArg(key, defaults[key] === undefined ? false : defaults[key]);
    });
    
    var notFlags = [];

    if (args.indexOf('--') !== -1) {
        notFlags = args.slice(args.indexOf('--')+1);
        args = args.slice(0, args.indexOf('--'));
    }

    function argDefined(key, arg) {
        return (flags.allBools && /^--[^=]+$/.test(arg)) ||
            flags.strings[key] || flags.bools[key] || aliases[key];
    }

    function setArg (key, val, arg) {
        if (arg && flags.unknownFn && !argDefined(key, arg)) {
            if (flags.unknownFn(arg) === false) return;
        }

        var value = !flags.strings[key] && isNumber(val)
            ? Number(val) : val
        ;
        setKey(argv, key.split('.'), value);
        
        (aliases[key] || []).forEach(function (x) {
            setKey(argv, x.split('.'), value);
        });
    }

    function setKey (obj, keys, value) {
        var o = obj;
        keys.slice(0,-1).forEach(function (key) {
            if (o[key] === undefined) o[key] = {};
            o = o[key];
        });

        var key = keys[keys.length - 1];
        if (o[key] === undefined || flags.bools[key] || typeof o[key] === 'boolean') {
            o[key] = value;
        }
        else if (Array.isArray(o[key])) {
            o[key].push(value);
        }
        else {
            o[key] = [ o[key], value ];
        }
    }
    
    function aliasIsBoolean(key) {
      return aliases[key].some(function (x) {
          return flags.bools[x];
      });
    }

    for (var i = 0; i < args.length; i++) {
        var arg = args[i];
        
        if (/^--.+=/.test(arg)) {
            // Using [\s\S] instead of . because js doesn't support the
            // 'dotall' regex modifier. See:
            // http://stackoverflow.com/a/1068308/13216
            var m = arg.match(/^--([^=]+)=([\s\S]*)$/);
            var key = m[1];
            var value = m[2];
            if (flags.bools[key]) {
                value = value !== 'false';
            }
            setArg(key, value, arg);
        }
        else if (/^--no-.+/.test(arg)) {
            var key = arg.match(/^--no-(.+)/)[1];
            setArg(key, false, arg);
        }
        else if (/^--.+/.test(arg)) {
            var key = arg.match(/^--(.+)/)[1];
            var next = args[i + 1];
            if (next !== undefined && !/^-/.test(next)
            && !flags.bools[key]
            && !flags.allBools
            && (aliases[key] ? !aliasIsBoolean(key) : true)) {
                setArg(key, next, arg);
                i++;
            }
            else if (/^(true|false)$/.test(next)) {
                setArg(key, next === 'true', arg);
                i++;
            }
            else {
                setArg(key, flags.strings[key] ? '' : true, arg);
            }
        }
        else if (/^-[^-]+/.test(arg)) {
            var letters = arg.slice(1,-1).split('');
            
            var broken = false;
            for (var j = 0; j < letters.length; j++) {
                var next = arg.slice(j+2);
                
                if (next === '-') {
                    setArg(letters[j], next, arg)
                    continue;
                }
                
                if (/[A-Za-z]/.test(letters[j]) && /=/.test(next)) {
                    setArg(letters[j], next.split('=')[1], arg);
                    broken = true;
                    break;
                }
                
                if (/[A-Za-z]/.test(letters[j])
                && /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)) {
                    setArg(letters[j], next, arg);
                    broken = true;
                    break;
                }
                
                if (letters[j+1] && letters[j+1].match(/\W/)) {
                    setArg(letters[j], arg.slice(j+2), arg);
                    broken = true;
                    break;
                }
                else {
                    setArg(letters[j], flags.strings[letters[j]] ? '' : true, arg);
                }
            }
            
            var key = arg.slice(-1)[0];
            if (!broken && key !== '-') {
                if (args[i+1] && !/^(-|--)[^-]/.test(args[i+1])
                && !flags.bools[key]
                && (aliases[key] ? !aliasIsBoolean(key) : true)) {
                    setArg(key, args[i+1], arg);
                    i++;
                }
                else if (args[i+1] && /true|false/.test(args[i+1])) {
                    setArg(key, args[i+1] === 'true', arg);
                    i++;
                }
                else {
                    setArg(key, flags.strings[key] ? '' : true, arg);
                }
            }
        }
        else {
            if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
                argv._.push(
                    flags.strings['_'] || !isNumber(arg) ? arg : Number(arg)
                );
            }
            if (opts.stopEarly) {
                argv._.push.apply(argv._, args.slice(i + 1));
                break;
            }
        }
    }
    
    Object.keys(defaults).forEach(function (key) {
        if (!hasKey(argv, key.split('.'))) {
            setKey(argv, key.split('.'), defaults[key]);
            
            (aliases[key] || []).forEach(function (x) {
                setKey(argv, x.split('.'), defaults[key]);
            });
        }
    });
    
    if (opts['--']) {
        argv['--'] = new Array();
        notFlags.forEach(function(key) {
            argv['--'].push(key);
        });
    }
    else {
        notFlags.forEach(function(key) {
            argv._.push(key);
        });
    }

    return argv;
};

function hasKey (obj, keys) {
    var o = obj;
    keys.slice(0,-1).forEach(function (key) {
        o = (o[key] || {});
    });

    var key = keys[keys.length - 1];
    return key in o;
}

function isNumber (x) {
    if (typeof x === 'number') return true;
    if (/^0x[0-9a-f]+$/i.test(x)) return true;
    return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
}


},{}],10:[function(require,module,exports){
var iota = require("iota-array")
var isBuffer = require("is-buffer")

var hasTypedArrays  = ((typeof Float64Array) !== "undefined")

function compare1st(a, b) {
  return a[0] - b[0]
}

function order() {
  var stride = this.stride
  var terms = new Array(stride.length)
  var i
  for(i=0; i<terms.length; ++i) {
    terms[i] = [Math.abs(stride[i]), i]
  }
  terms.sort(compare1st)
  var result = new Array(terms.length)
  for(i=0; i<result.length; ++i) {
    result[i] = terms[i][1]
  }
  return result
}

function compileConstructor(dtype, dimension) {
  var className = ["View", dimension, "d", dtype].join("")
  if(dimension < 0) {
    className = "View_Nil" + dtype
  }
  var useGetters = (dtype === "generic")

  if(dimension === -1) {
    //Special case for trivial arrays
    var code =
      "function "+className+"(a){this.data=a;};\
var proto="+className+".prototype;\
proto.dtype='"+dtype+"';\
proto.index=function(){return -1};\
proto.size=0;\
proto.dimension=-1;\
proto.shape=proto.stride=proto.order=[];\
proto.lo=proto.hi=proto.transpose=proto.step=\
function(){return new "+className+"(this.data);};\
proto.get=proto.set=function(){};\
proto.pick=function(){return null};\
return function construct_"+className+"(a){return new "+className+"(a);}"
    var procedure = new Function(code)
    return procedure()
  } else if(dimension === 0) {
    //Special case for 0d arrays
    var code =
      "function "+className+"(a,d) {\
this.data = a;\
this.offset = d\
};\
var proto="+className+".prototype;\
proto.dtype='"+dtype+"';\
proto.index=function(){return this.offset};\
proto.dimension=0;\
proto.size=1;\
proto.shape=\
proto.stride=\
proto.order=[];\
proto.lo=\
proto.hi=\
proto.transpose=\
proto.step=function "+className+"_copy() {\
return new "+className+"(this.data,this.offset)\
};\
proto.pick=function "+className+"_pick(){\
return TrivialArray(this.data);\
};\
proto.valueOf=proto.get=function "+className+"_get(){\
return "+(useGetters ? "this.data.get(this.offset)" : "this.data[this.offset]")+
"};\
proto.set=function "+className+"_set(v){\
return "+(useGetters ? "this.data.set(this.offset,v)" : "this.data[this.offset]=v")+"\
};\
return function construct_"+className+"(a,b,c,d){return new "+className+"(a,d)}"
    var procedure = new Function("TrivialArray", code)
    return procedure(CACHED_CONSTRUCTORS[dtype][0])
  }

  var code = ["'use strict'"]

  //Create constructor for view
  var indices = iota(dimension)
  var args = indices.map(function(i) { return "i"+i })
  var index_str = "this.offset+" + indices.map(function(i) {
        return "this.stride[" + i + "]*i" + i
      }).join("+")
  var shapeArg = indices.map(function(i) {
      return "b"+i
    }).join(",")
  var strideArg = indices.map(function(i) {
      return "c"+i
    }).join(",")
  code.push(
    "function "+className+"(a," + shapeArg + "," + strideArg + ",d){this.data=a",
      "this.shape=[" + shapeArg + "]",
      "this.stride=[" + strideArg + "]",
      "this.offset=d|0}",
    "var proto="+className+".prototype",
    "proto.dtype='"+dtype+"'",
    "proto.dimension="+dimension)

  //view.size:
  code.push("Object.defineProperty(proto,'size',{get:function "+className+"_size(){\
return "+indices.map(function(i) { return "this.shape["+i+"]" }).join("*"),
"}})")

  //view.order:
  if(dimension === 1) {
    code.push("proto.order=[0]")
  } else {
    code.push("Object.defineProperty(proto,'order',{get:")
    if(dimension < 4) {
      code.push("function "+className+"_order(){")
      if(dimension === 2) {
        code.push("return (Math.abs(this.stride[0])>Math.abs(this.stride[1]))?[1,0]:[0,1]}})")
      } else if(dimension === 3) {
        code.push(
"var s0=Math.abs(this.stride[0]),s1=Math.abs(this.stride[1]),s2=Math.abs(this.stride[2]);\
if(s0>s1){\
if(s1>s2){\
return [2,1,0];\
}else if(s0>s2){\
return [1,2,0];\
}else{\
return [1,0,2];\
}\
}else if(s0>s2){\
return [2,0,1];\
}else if(s2>s1){\
return [0,1,2];\
}else{\
return [0,2,1];\
}}})")
      }
    } else {
      code.push("ORDER})")
    }
  }

  //view.set(i0, ..., v):
  code.push(
"proto.set=function "+className+"_set("+args.join(",")+",v){")
  if(useGetters) {
    code.push("return this.data.set("+index_str+",v)}")
  } else {
    code.push("return this.data["+index_str+"]=v}")
  }

  //view.get(i0, ...):
  code.push("proto.get=function "+className+"_get("+args.join(",")+"){")
  if(useGetters) {
    code.push("return this.data.get("+index_str+")}")
  } else {
    code.push("return this.data["+index_str+"]}")
  }

  //view.index:
  code.push(
    "proto.index=function "+className+"_index(", args.join(), "){return "+index_str+"}")

  //view.hi():
  code.push("proto.hi=function "+className+"_hi("+args.join(",")+"){return new "+className+"(this.data,"+
    indices.map(function(i) {
      return ["(typeof i",i,"!=='number'||i",i,"<0)?this.shape[", i, "]:i", i,"|0"].join("")
    }).join(",")+","+
    indices.map(function(i) {
      return "this.stride["+i + "]"
    }).join(",")+",this.offset)}")

  //view.lo():
  var a_vars = indices.map(function(i) { return "a"+i+"=this.shape["+i+"]" })
  var c_vars = indices.map(function(i) { return "c"+i+"=this.stride["+i+"]" })
  code.push("proto.lo=function "+className+"_lo("+args.join(",")+"){var b=this.offset,d=0,"+a_vars.join(",")+","+c_vars.join(","))
  for(var i=0; i<dimension; ++i) {
    code.push(
"if(typeof i"+i+"==='number'&&i"+i+">=0){\
d=i"+i+"|0;\
b+=c"+i+"*d;\
a"+i+"-=d}")
  }
  code.push("return new "+className+"(this.data,"+
    indices.map(function(i) {
      return "a"+i
    }).join(",")+","+
    indices.map(function(i) {
      return "c"+i
    }).join(",")+",b)}")

  //view.step():
  code.push("proto.step=function "+className+"_step("+args.join(",")+"){var "+
    indices.map(function(i) {
      return "a"+i+"=this.shape["+i+"]"
    }).join(",")+","+
    indices.map(function(i) {
      return "b"+i+"=this.stride["+i+"]"
    }).join(",")+",c=this.offset,d=0,ceil=Math.ceil")
  for(var i=0; i<dimension; ++i) {
    code.push(
"if(typeof i"+i+"==='number'){\
d=i"+i+"|0;\
if(d<0){\
c+=b"+i+"*(a"+i+"-1);\
a"+i+"=ceil(-a"+i+"/d)\
}else{\
a"+i+"=ceil(a"+i+"/d)\
}\
b"+i+"*=d\
}")
  }
  code.push("return new "+className+"(this.data,"+
    indices.map(function(i) {
      return "a" + i
    }).join(",")+","+
    indices.map(function(i) {
      return "b" + i
    }).join(",")+",c)}")

  //view.transpose():
  var tShape = new Array(dimension)
  var tStride = new Array(dimension)
  for(var i=0; i<dimension; ++i) {
    tShape[i] = "a[i"+i+"]"
    tStride[i] = "b[i"+i+"]"
  }
  code.push("proto.transpose=function "+className+"_transpose("+args+"){"+
    args.map(function(n,idx) { return n + "=(" + n + "===undefined?" + idx + ":" + n + "|0)"}).join(";"),
    "var a=this.shape,b=this.stride;return new "+className+"(this.data,"+tShape.join(",")+","+tStride.join(",")+",this.offset)}")

  //view.pick():
  code.push("proto.pick=function "+className+"_pick("+args+"){var a=[],b=[],c=this.offset")
  for(var i=0; i<dimension; ++i) {
    code.push("if(typeof i"+i+"==='number'&&i"+i+">=0){c=(c+this.stride["+i+"]*i"+i+")|0}else{a.push(this.shape["+i+"]);b.push(this.stride["+i+"])}")
  }
  code.push("var ctor=CTOR_LIST[a.length+1];return ctor(this.data,a,b,c)}")

  //Add return statement
  code.push("return function construct_"+className+"(data,shape,stride,offset){return new "+className+"(data,"+
    indices.map(function(i) {
      return "shape["+i+"]"
    }).join(",")+","+
    indices.map(function(i) {
      return "stride["+i+"]"
    }).join(",")+",offset)}")

  //Compile procedure
  var procedure = new Function("CTOR_LIST", "ORDER", code.join("\n"))
  return procedure(CACHED_CONSTRUCTORS[dtype], order)
}

function arrayDType(data) {
  if(isBuffer(data)) {
    return "buffer"
  }
  if(hasTypedArrays) {
    switch(Object.prototype.toString.call(data)) {
      case "[object Float64Array]":
        return "float64"
      case "[object Float32Array]":
        return "float32"
      case "[object Int8Array]":
        return "int8"
      case "[object Int16Array]":
        return "int16"
      case "[object Int32Array]":
        return "int32"
      case "[object Uint8Array]":
        return "uint8"
      case "[object Uint16Array]":
        return "uint16"
      case "[object Uint32Array]":
        return "uint32"
      case "[object Uint8ClampedArray]":
        return "uint8_clamped"
    }
  }
  if(Array.isArray(data)) {
    return "array"
  }
  return "generic"
}

var CACHED_CONSTRUCTORS = {
  "float32":[],
  "float64":[],
  "int8":[],
  "int16":[],
  "int32":[],
  "uint8":[],
  "uint16":[],
  "uint32":[],
  "array":[],
  "uint8_clamped":[],
  "buffer":[],
  "generic":[]
}

;(function() {
  for(var id in CACHED_CONSTRUCTORS) {
    CACHED_CONSTRUCTORS[id].push(compileConstructor(id, -1))
  }
});

function wrappedNDArrayCtor(data, shape, stride, offset) {
  if(data === undefined) {
    var ctor = CACHED_CONSTRUCTORS.array[0]
    return ctor([])
  } else if(typeof data === "number") {
    data = [data]
  }
  if(shape === undefined) {
    shape = [ data.length ]
  }
  var d = shape.length
  if(stride === undefined) {
    stride = new Array(d)
    for(var i=d-1, sz=1; i>=0; --i) {
      stride[i] = sz
      sz *= shape[i]
    }
  }
  if(offset === undefined) {
    offset = 0
    for(var i=0; i<d; ++i) {
      if(stride[i] < 0) {
        offset -= (shape[i]-1)*stride[i]
      }
    }
  }
  var dtype = arrayDType(data)
  var ctor_list = CACHED_CONSTRUCTORS[dtype]
  while(ctor_list.length <= d+1) {
    ctor_list.push(compileConstructor(dtype, ctor_list.length-1))
  }
  var ctor = ctor_list[d+1]
  return ctor(data, shape, stride, offset)
}

module.exports = wrappedNDArrayCtor

},{"iota-array":11,"is-buffer":12}],11:[function(require,module,exports){
arguments[4][3][0].apply(exports,arguments)
},{"dup":3}],12:[function(require,module,exports){
/**
 * Determine if an object is Buffer
 *
 * Author:   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * License:  MIT
 *
 * `npm install is-buffer`
 */

module.exports = function (obj) {
  return !!(obj != null &&
    (obj._isBuffer || // For Safari 5-7 (missing Object.prototype.constructor)
      (obj.constructor &&
      typeof obj.constructor.isBuffer === 'function' &&
      obj.constructor.isBuffer(obj))
    ))
}

},{}],13:[function(require,module,exports){
module.exports = function (point, vs) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    
    var x = point[0], y = point[1];
    
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];
        
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
};

},{}],14:[function(require,module,exports){
/**
 * @author mrdoob / http://mrdoob.com/
 */

var Stats = function () {

	var startTime = Date.now(), prevTime = startTime;
	var ms = 0, msMin = Infinity, msMax = 0;
	var fps = 0, fpsMin = Infinity, fpsMax = 0;
	var frames = 0, mode = 0;

	var container = document.createElement( 'div' );
	container.id = 'stats';
	container.addEventListener( 'mousedown', function ( event ) { event.preventDefault(); setMode( ++ mode % 2 ) }, false );
	container.style.cssText = 'width:80px;opacity:0.9;cursor:pointer';

	var fpsDiv = document.createElement( 'div' );
	fpsDiv.id = 'fps';
	fpsDiv.style.cssText = 'padding:0 0 3px 3px;text-align:left;background-color:#002';
	container.appendChild( fpsDiv );

	var fpsText = document.createElement( 'div' );
	fpsText.id = 'fpsText';
	fpsText.style.cssText = 'color:#0ff;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px';
	fpsText.innerHTML = 'FPS';
	fpsDiv.appendChild( fpsText );

	var fpsGraph = document.createElement( 'div' );
	fpsGraph.id = 'fpsGraph';
	fpsGraph.style.cssText = 'position:relative;width:74px;height:30px;background-color:#0ff';
	fpsDiv.appendChild( fpsGraph );

	while ( fpsGraph.children.length < 74 ) {

		var bar = document.createElement( 'span' );
		bar.style.cssText = 'width:1px;height:30px;float:left;background-color:#113';
		fpsGraph.appendChild( bar );

	}

	var msDiv = document.createElement( 'div' );
	msDiv.id = 'ms';
	msDiv.style.cssText = 'padding:0 0 3px 3px;text-align:left;background-color:#020;display:none';
	container.appendChild( msDiv );

	var msText = document.createElement( 'div' );
	msText.id = 'msText';
	msText.style.cssText = 'color:#0f0;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px';
	msText.innerHTML = 'MS';
	msDiv.appendChild( msText );

	var msGraph = document.createElement( 'div' );
	msGraph.id = 'msGraph';
	msGraph.style.cssText = 'position:relative;width:74px;height:30px;background-color:#0f0';
	msDiv.appendChild( msGraph );

	while ( msGraph.children.length < 74 ) {

		var bar = document.createElement( 'span' );
		bar.style.cssText = 'width:1px;height:30px;float:left;background-color:#131';
		msGraph.appendChild( bar );

	}

	var setMode = function ( value ) {

		mode = value;

		switch ( mode ) {

			case 0:
				fpsDiv.style.display = 'block';
				msDiv.style.display = 'none';
				break;
			case 1:
				fpsDiv.style.display = 'none';
				msDiv.style.display = 'block';
				break;
		}

	};

	var updateGraph = function ( dom, value ) {

		var child = dom.appendChild( dom.firstChild );
		child.style.height = value + 'px';

	};

	return {

		REVISION: 12,

		domElement: container,

		setMode: setMode,

		begin: function () {

			startTime = Date.now();

		},

		end: function () {

			var time = Date.now();

			ms = time - startTime;
			msMin = Math.min( msMin, ms );
			msMax = Math.max( msMax, ms );

			msText.textContent = ms + ' MS (' + msMin + '-' + msMax + ')';
			updateGraph( msGraph, Math.min( 30, 30 - ( ms / 200 ) * 30 ) );

			frames ++;

			if ( time > prevTime + 1000 ) {

				fps = Math.round( ( frames * 1000 ) / ( time - prevTime ) );
				fpsMin = Math.min( fpsMin, fps );
				fpsMax = Math.max( fpsMax, fps );

				fpsText.textContent = fps + ' FPS (' + fpsMin + '-' + fpsMax + ')';
				updateGraph( fpsGraph, Math.min( 30, 30 - ( fps / 100 ) * 30 ) );

				prevTime = time;
				frames = 0;

			}

			return time;

		},

		update: function () {

			startTime = this.end();

		}

	}

};

if ( typeof module === 'object' ) {

	module.exports = Stats;

}
},{}],15:[function(require,module,exports){
(function (global){
var THREE = (typeof window !== "undefined" ? window['THREE'] : typeof global !== "undefined" ? global['THREE'] : null);

module.exports = function(app) {
  var scene = app.get('scene');

  var object = new THREE.Object3D();

  var editor = app.attach(object, require('../editor/editor'));

  scene.add(object);

  return object;
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../editor/editor":33}],16:[function(require,module,exports){
(function (global){
var ndarray = require('ndarray');
var THREE = (typeof window !== "undefined" ? window['THREE'] : typeof global !== "undefined" ? global['THREE'] : null);

module.exports = function(app) {
  var scene = app.get('scene');
  var camera = app.get('camera');

  var object = new THREE.Object3D();
  var blocks = app.attach(object, require('../components/blocks'));

  var dim = [32, 32, 32];

  for (var i = 0; i < dim[0]; i++) {
    for (var j = 0; j < dim[1]; j++) {
      for (var k = 0; k < dim[2]; k++) {
        blocks.set(i, j, k, 1);
      }
    }
  }

  blocks.offset.set(-16, -16, -16);
  blocks.updateMesh();

  var rigidBody = app.attach(object, require('../components/rigidbody'));
  rigidBody.collisionObject = blocks.object;
  rigidBody.isFixture = true;
  
  scene.add(object);
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../components/blocks":18,"../components/rigidbody":22,"ndarray":10}],17:[function(require,module,exports){
(function (global){
var THREE = (typeof window !== "undefined" ? window['THREE'] : typeof global !== "undefined" ? global['THREE'] : null);

module.exports = function(app) {
  var scene = app.get('scene');

  var object = new THREE.Object3D();
  var character = app.attach(object, require('../components/character'));
  var rigidBody = app.attach(object, require('../components/rigidbody'));
  rigidBody.mass = 1;
  var playerControl = app.attach(object, require('../components/playercontrol'));

  character.rigidBody = rigidBody;
  playerControl.character = character;
  playerControl.rigidBody = rigidBody;

  scene.add(object);

  object.position.set(0, 40, 0);

  return object;
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../components/character":19,"../components/playercontrol":21,"../components/rigidbody":22}],18:[function(require,module,exports){
var ndarray = require('ndarray');
var mesher = require('../voxel/mesher');
var arrayUtils = require('../utils/arrayutils');

var Blocks = function(object) {
  this.object = object;
  this.type = 'blocks';

  this.dim = [16, 16, 16];
  this.chunk = ndarray([], this.dim);

  this.mesh = null;
  this.obj = new THREE.Object3D();
  this.material = new THREE.MultiMaterial();

  this.dirty = false;
  this.dimNeedsUpdate = false;

  this.object.add(this.obj);

  this.palette = [null];

  this.userData = {};
};

Blocks.prototype.set = function(x, y, z, b) {
  this.chunk.set(x, y, z, b);
  this.dirty = true;
};

Blocks.prototype.setAtCoord = function(coord, b) {
  this.set(coord.x, coord.y, coord.z, b);
};

Blocks.prototype.get = function(x, y, z) {
  return this.chunk.get(x, y, z);
};

Blocks.prototype.getAtCoord = function(coord) {
  return this.get(coord.x, coord.y, coord.z);
};

Blocks.prototype.pointToCoord = function(point) {
  return new THREE.Vector3(point.x - 0.5, point.y - 0.5, point.z - 0.5);
};

Blocks.prototype.coordToPoint = function(coord) {
  return new THREE.Vector3(coord.x, coord.y, coord.z);
};

Blocks.prototype.tick = function() {
  if (this.dimNeedsUpdate) {
    this._updateDim();
    this.dimNeedsUpdate = false;
  }

  this.updateMesh();
};

Blocks.prototype.clear = function() {
  this.chunk = ndarray([], this.dim);
  this.obj.remove(this.mesh);
};

Blocks.prototype.setDim = function(value) {
  this.dim = value;
  this.dimNeedsUpdate = true;
  this.dirty = true;
};

Blocks.prototype.visit = function(callback) {
  var shape = this.chunk.shape;
  var data = this.chunk.data;
  for (var i = 0; i < shape[0]; i++) {
    for (var j = 0; j < shape[1]; j++) {
      for (var k = 0; k < shape[2]; k++) {
        var b = this.chunk.get(i, j, k);
        if (!!b) {
          callback(i, j, k, b);
        }
      }
    }
  }
};

Blocks.prototype.getAllCoords = function() {
  var coords = [];
  this.visit(function(i, j, k) {
    coords.push(new THREE.Vector3(i, j, k));
  });
  return coords;
};

Blocks.prototype.print = function() {
  this.visit(function(i, j, k, b) {
    console.log([i, j, k].join(','), b);
  });
};

Blocks.prototype.serialize = function() {
  return {
    dim: this.dim,
    chunkData: arrayUtils.clone(this.chunk.data),
    palette: this.palette,
    userData: this.userData
  };
};

Blocks.prototype.deserialize = function(json) {
  this.dim = json.dim;
  this.chunk = ndarray([], this.dim);
  for (var i = 0; i < json.chunkData.length; i++) {
    this.chunk.data[i] = json.chunkData[i];
  }

  this.palette = json.palette;

  this.updateMaterial();

  this.dimNeedsUpdate = true;
  this.dirty = true;

  this.userData = json.userData;
};

Blocks.prototype.updateMesh = function() {
  if (this.dirty) {
    this._updateMesh();
    this.dirty = false;
  }
};

Blocks.prototype._updateMesh = function() {
  if (this.mesh != null) {
    this.obj.remove(this.mesh);
  }

  var self = this;
  var dim = this.dim;

  var result = mesher(function(i, j, k) {
    return self.get(i, j, k);
  }, dim);

  var geometry = new THREE.Geometry();

  result.vertices.forEach(function(v) {
    var vertice = new THREE.Vector3(
      v[0], v[1], v[2]
    );
    geometry.vertices.push(vertice);
  });

  result.surfaces.forEach(function(surface) {
    var f = surface.face;
    var uv = surface.uv;
    var c = f[4];

    var face = new THREE.Face3(f[0], f[1], f[2]);
    geometry.faces.push(face);
    geometry.faceVertexUvs[0].push([uv[0], uv[1], uv[2]]);
    face.materialIndex = c - 1;

    face = new THREE.Face3(f[2], f[3], f[0]);
    geometry.faces.push(face);
    geometry.faceVertexUvs[0].push([uv[2], uv[3], uv[0]]);
    face.materialIndex = c - 1;
  });

  geometry.computeFaceNormals();

  this.mesh = new THREE.Mesh(geometry, this.material);
  this.obj.add(this.mesh);
};

Blocks.prototype._updateDim = function() {
  var newChunk = ndarray([], this.dim);
  var shape = this.chunk.shape;

  for (var i = 0; i < shape[0]; i++) {
    for (var j = 0; j < shape[1]; j++) {
      for (var k = 0; k < shape[2]; k++) {
        var b = this.chunk.get(i, j, k);
        if (!!b) {
          newChunk.set(i, j, k, b);
        }
      }
    }
  }

  this.chunk = newChunk;
};

Blocks.prototype.getOrAddColorIndex = function(color) {
  // null, 0, false, undefined
  if (!color) {
    return 0;
  }

  var index = arrayUtils.indexOf(this.palette, color);
  if (index == -1) {
    this.palette.push(color);
    index = this.palette.length - 1;
    var material = new THREE.MeshLambertMaterial({
      color: new THREE.Color(this.palette[index])
    });
    this.material.materials.push(material);
    return this.palette.length - 1;
  } else {
    return index;
  }
};

Blocks.prototype.updateMaterial = function() {
  this.material = new THREE.MultiMaterial();
  for (var i = 1; i < this.palette.length; i++) {
    var material = new THREE.MeshLambertMaterial({
      color: new THREE.Color(this.palette[i])
    });
    this.material.materials.push(material);
  }
};

module.exports = Blocks;
},{"../utils/arrayutils":57,"../voxel/mesher":60,"ndarray":10}],19:[function(require,module,exports){
(function (global){
var THREE = (typeof window !== "undefined" ? window['THREE'] : typeof global !== "undefined" ? global['THREE'] : null);

var Character = function(object) {
  this.object = object;

  this.geometry = new THREE.BoxGeometry(1, 1, 1);
  this.material = new THREE.MeshBasicMaterial({
    color: 0xff0000
  });

  this.mesh = new THREE.Mesh(this.geometry, this.material);
  this.object.add(this.mesh);

  this.moveSpeed = 0.5;
  this.jumpSpeed = 0.8;
  this.jumping = false;
};

Character.prototype.tick = function() {
  this.gravity = this.rigidBody.gravity;
  if (this.jumping && this.rigidBody.grounded) {
    this.jumping = false;
  }
};

Character.prototype.move = function(forward, amount) {
  var gravity = this.rigidBody.gravity;
  if (gravity == null) {
    return;
  }
  if (this.rigidBody.grounded || this.jumping) {
    var verticalSpeed = this.rigidBody.velocity.clone().projectOnVector(gravity.dir);
    var forwardSpeed = forward.clone().setLength(amount * this.moveSpeed);
    this.rigidBody.velocity.copy(verticalSpeed.add(forwardSpeed));
  }
};

Character.prototype.jump = function(amount) {
  var gravity = this.rigidBody.gravity;
  if (gravity == null) {
    return;
  }
  if (this.rigidBody.grounded) {
    this.jumping = true;
    this.rigidBody.velocity.copy(gravity.dir.clone().multiplyScalar(-this.jumpSpeed));
  }
};

module.exports = Character;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],20:[function(require,module,exports){
var PlayerCamera = function(camera, app) {
  this.camera = camera;
  this.app = app;

  this.cameraTilt = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(-Math.PI / 4, Math.PI / 4, 0, 'YXZ'));

  this.cameraQuat = new THREE.Quaternion();
  this.cameraQuatFinal = new THREE.Quaternion();

  this.distance = 100;
  this.target = new THREE.Vector3();
  this.quaternion = new THREE.Quaternion();
};

PlayerCamera.$inject = ['app'];

PlayerCamera.prototype.tick = function() {
  var player = app.get('player');
  if (player == null) {
    return;
  }

  var rigidBody = app.getComponent(player, 'rigidBody');

  var gravityDir;
  if (rigidBody.grounded) {
    gravityDir = rigidBody.gravity.dir.clone();
  } else {
    gravityDir = rigidBody.gravity.forceDir.clone();
  }

  if (gravityDir.length() == 0) {
    return;
  }

  var a = gravityDir.clone().multiplyScalar(-1);

  var diff = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0).applyQuaternion(this.cameraQuat),
    a
  );

  this.cameraQuat.multiplyQuaternions(diff, this.cameraQuat);
  this.cameraQuatFinal = new THREE.Quaternion().multiplyQuaternions(
    this.cameraQuat,
    this.cameraTilt);

  this.quaternion.slerp(this.cameraQuatFinal, 0.1);

  lastGravity = gravityDir;

  this.updateCamera();
};

PlayerCamera.prototype.updateCamera = function() {
  var diff = new THREE.Vector3(0, 0, 1)
    .applyQuaternion(this.quaternion)
    .setLength(this.distance);
  var pos = this.target.clone()
    .add(diff);
  camera.position.copy(pos);

  var up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.quaternion);
  camera.up.copy(up);
  camera.lookAt(this.target);
};

module.exports = PlayerCamera;
},{}],21:[function(require,module,exports){
var PlayerControl = function(object, app, input, camera) {
  this.object = object;
  this.input = input;
  this.camera = camera;

  this.character = null;
  this.rigidBody = null;
};

PlayerControl.$inject = ['input', 'camera'];

PlayerControl.prototype.tick = function() {
  var forwardAmount = 0;
  if (this.input.keyHold('w')) forwardAmount += 1;
  if (this.input.keyHold('s')) forwardAmount -= 1;

  var rightAmount = 0;
  if (this.input.keyHold('d')) rightAmount += 1;
  if (this.input.keyHold('a')) rightAmount -= 1;

  var gravity = this.rigidBody.gravity;

  if (gravity != null) {
    var normal = gravity.dir.clone().multiplyScalar(-1);

    var up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
    var right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);

    var move = up.multiplyScalar(forwardAmount).add(right.multiplyScalar(rightAmount));
    move.projectOnPlane(normal);
    move.setLength(1);

    this.character.move(move, 1);

    if (this.input.keyDown('space')) {
      this.character.jump();
    }
  }
};

module.exports = PlayerControl;
},{}],22:[function(require,module,exports){
(function (global){
var THREE = (typeof window !== "undefined" ? window['THREE'] : typeof global !== "undefined" ? global['THREE'] : null);

var RigidBody = function(object) {
  this.object = object;
  
  this.velocity = new THREE.Vector3();
  
  this.acceleration = new THREE.Vector3();
  
  this.type = 'rigidBody';
  
  this.friction = 0.98;

  // 0 mass means immovable
  this.mass = 0;
  
  this.gravity = null;

  this.collisionObject = null;
};

RigidBody.prototype.applyForce = function(force) {
  this.acceleration.add(force.clone().multiplyScalar(1 / this.mass));
};

module.exports = RigidBody;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],23:[function(require,module,exports){
var events = require('./events');

var idCount = 0;

function getNextId() {
  return idCount++;
}

var Engine = function() {
  this.entityMap = {};
  this.lookup = {};
  this.frameRate = 60.0;
  this.systems = [];
  this.bindings = {};
};

Engine.prototype.attach = function(object, factory) {
  var args = [object];
  var component;
  var self = this;

  if (typeof factory === 'function') {
    if (factory.$inject != null) {
      factory.$inject.forEach(function(dep) {
        args.push(self.resolve(dep));
      });
    }
    component = new(Function.prototype.bind.apply(factory, [null].concat(args)));
  } else {
    component = factory;
  }

  if (component != null) {
    component.object = object;

    if (object._id == null) {
      object._id = getNextId();
      this.lookup[object._id] = object;
    }

    if (component._id == null) {
      component._id = getNextId();
      this.lookup[component._id] = component;
    }

    var components = this.entityMap[object._id];
    if (components == null) components = this.entityMap[object._id] = {};
    components[component._id] = component;

    for (var i = 0; i < this.systems.length; i++) {
      var system = this.systems[i];
      if (system.onAttach != null) system.onAttach(object, component);
    }
  }

  return component;
};

Engine.prototype.use = function(type, system) {
  var hasType = typeof type === 'string';
  if (!hasType) {
    system = type;
  }

  if (system != null) {
    this.systems.push(system);
    if (hasType) {
      this.value(type, system);
    }
  }

  return system;
};

Engine.prototype.tick = function() {
  this.emit('beforeTick');

  for (var i = 0; i < this.systems.length; i++) {
    var system = this.systems[i];
    if (system.tick != null) system.tick();
  }

  for (var i in this.entityMap) {
    var components = this.entityMap[i];
    for (var j in components) {
      var component = components[j];
      if (component.tick != null) component.tick();
    }
  }

  for (var i = 0; i < this.systems.length; i++) {
    var system = this.systems[i];
    if (system.lateTick != null) system.lateTick();
  }

  this.emit('afterTick');
};

Engine.prototype.start = function() {
  var self = this;
  var interval = function() {
    self.tick();
    setTimeout(interval, 1000 / this.frameRate);
  }
  interval();
};

Engine.prototype.value = function(type, object) {
  this.bindings[type] = {
    value: object
  };
};

Engine.prototype.resolve = function(type, context) {
  var binding = this.bindings[type];
  if (binding == null) {
    throw new Error('binding for type ' + type + ' not found');
  }

  if (binding.factory != null) {
    return binding.factory(context);
  }

  if (binding.value != null) {
    return binding.value;
  }

  return undefined;
};

Engine.prototype.get = function(type, context) {
  return this.resolve(type, context);
};

Engine.prototype.getComponent = function(object, type) {
  var components = this.entityMap[object._id];
  for (var id in components) {
    if (components[id].type === type) {
      return components[id];
    }
  }
};

Engine.prototype.loadAssembly = function(assembly) {
  return assembly(this);
};

events.prototype.apply(Engine.prototype);

module.exports = function() {
  return new Engine();
};
},{"./events":24}],24:[function(require,module,exports){
var Events = function() {
  this._listeners = {};
};

Events.prototype.emit = function(event, object) {
  var callbacks = this._listeners[event];
  if (callbacks == null) {
    return;
  }
  for (var i = 0; i < callbacks.length; i++) {
    var callback = callbacks[i];
    callback(object);
  }
};

Events.prototype.on = function(event, callback) {
  var callbacks = this._listeners[event];
  if (callbacks == null) {
    callbacks = this._listeners[event] = [];
  }
  callbacks.push(callback);
};

Events.prototype.off = function(event, callback) {
  var callbacks = this._listeners[event];
  if (callbacks == null) {
    return;
  }
  arrayUtils.remove(callbacks, callback);
};

Events.prototype.apply = function(obj) {
  obj.emit = this.emit;
  obj.on = this.on;
  obj.off = this.off;
  obj._listeners = {};
};

module.exports = Events;
},{}],25:[function(require,module,exports){
module.exports = function(opts) {
  opts = opts || {};
  var dataToLoad = opts.data || [];
  var onPick = opts.onPick || function() {};
  var onHover = opts.onHover || function() {};
  var onLeave = opts.onLeave || function() {};
  var customPlacement = opts.customPlacement || false;
  var hideHighlight = opts.hideHighlight || false;
  var showTooltip = opts.showTooltip || false;

  var blockWidth = opts.blockWidth || 20;
  var blockHeight = opts.blockHeight || 20;
  var columns = opts.columns || 14;
  var disableHighlight = opts.disableHighlight || false;

  var container = document.createElement('div');

  if (showTooltip) {
    var tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.visibility = 'hidden';
    tooltip.style.width = '200px';
    tooltip.style.backgroundColor = '#666666';
    tooltip.style.color = '#f6f6f6';
    tooltip.style.padding = '5px';
    container.appendChild(tooltip);
  }

  if (!customPlacement) {
    container.style.position = 'absolute';
    container.style.left = '20px';
    container.style.bottom = '20px';
    document.body.appendChild(container);
  }

  container.onfocus = function() {
    container.style['outline'] = 'none';
  };

  var blocks = [];
  var data = [];

  for (var i = 0; i < dataToLoad.length; i++) {
    add(dataToLoad[i]);
  }

  updateContainer();

  function getRow(index) {
    return Math.floor(index / columns);
  };

  function getColumn(index) {
    return index % columns;
  };

  function getRows() {
    return Math.ceil(data.length / columns);
  };

  function getIndex(row, column) {
    return row * columns + column;
  };

  function remove(index) {
    container.removeChild(blocks[index]);
    blocks[index] = undefined;
    data[index] = undefined;
  };

  function set(index, obj) {
    if (data[index] != null) {
      remove(index);
    };

    var row = getRow(index);
    var column = getColumn(index);

    var element;
    if (obj.imgData != null) {
      element = document.createElement('img');
      element.src = obj.imgData;
    } else if (obj.src != null) {
      element = document.createElement('img');
      element.src = obj.src;
    } else {
      var color = obj;
      element = document.createElement('div');
      element.style.backgroundColor = color;
    }

    container.appendChild(element);
    position(element, row, column);

    blocks[index] = element;
    data[index] = obj;

    updateContainer();

    if (selectedIndex == -1) {
      highlight(0);
    }
  };

  function add(obj) {
    var index = blocks.length;
    set(index, obj);
  };

  function position(element, row, column) {
    element.style.position = 'absolute';
    element.style.left = column * blockWidth + 'px';
    element.style.top = row * blockHeight + 'px';
    element.style.width = blockWidth + 'px';
    element.style.height = blockHeight + 'px';
    element.style.display = 'inline-block';
  };

  function updateContainer() {
    var numberOfColumns = data.length > columns ? columns : data.length;
    container.style.width = numberOfColumns * blockWidth + 'px';
    container.style.height = getRows() * blockHeight + 'px';
  };

  var highlightDiv = null;
  var selectedIndex = -1;

  function highlight(index) {
    if (disableHighlight) {
      return;
    }

    selectedIndex = index;
    var row = getRow(index);
    var column = getColumn(index);

    if (!hideHighlight) {
      if (highlightDiv == null) {
        highlightDiv = document.createElement('div');
        highlightDiv.style.position = 'absolute';
        highlightDiv.style.width = blockWidth + 'px';
        highlightDiv.style.height = blockHeight + 'px';
        highlightDiv.style.display = 'inline-block';
        highlightDiv.style.border = '1px solid #FFFFFF';
        container.appendChild(highlightDiv);
      }

      highlightDiv.style.left = column * blockWidth - 1 + 'px';
      highlightDiv.style.top = row * blockHeight - 1 + 'px';
    }
  };

  function clear() {
    for (var i = 0; i < data.length; i++) {
      remove(i);
    }

    data = [];
  };

  function isDescendant(parent, child) {
    if (child == null) {
      return false;
    }

    var node = child.parentNode;
    while (node != null) {
      if (node == parent) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }

  container.addEventListener('mousedown', function(e) {
    var mouseX = e.pageX - container.offsetLeft;
    var mouseY = e.pageY - container.offsetTop;
    var row = Math.floor(mouseY / blockHeight);
    var column = Math.floor(mouseX / blockWidth);
    var index = getIndex(row, column);

    if (data[index] == null) {
      return;
    }

    var obj = data[index];
    highlight(index);
    onPick(obj, index);
  });

  var mouse = null;
  container.addEventListener('mousemove', function(e) {
    mouse = e;
    var mouseX = e.pageX - container.offsetLeft;
    var mouseY = e.pageY - container.offsetTop;
    var row = Math.floor(mouseY / blockHeight);
    var column = Math.floor(mouseX / blockWidth);
    var index = getIndex(row, column);

    if (data[index] == null) {
      return;
    }

    var obj = data[index];
    onHover(obj, index);

    if (showTooltip && obj.tooltip != null) {
      tooltip.style.visibility = 'visible';
      tooltip.style.left = mouseX + 'px';
      tooltip.style.top = mouseY + 'px';
      if (tooltip.innerHTML !== obj.tooltip) {
        tooltip.innerHTML = obj.tooltip;
      }
    }
  });

  container.addEventListener('mouseleave', function(e) {
    if (!isDescendant(container, e.toElement)) {
      onLeave(e);

      if (showTooltip) {
        tooltip.style.visibility = 'hidden';
      }
    }
  });

  if (data.length > 0) {
    highlight(0);
  }

  return {
    highlight: highlight,
    add: add,
    set: set,
    clear: clear,
    data: data,
    domElement: container,
    get selectedIndex() {
      return selectedIndex;
    },
    get mouse() {
      return mouse;
    },
    get tooltip() {
      return tooltip;
    }
  }
};
},{}],26:[function(require,module,exports){
module.exports={
}
},{}],27:[function(require,module,exports){
module.exports=[
  "#7C7C7C",
  "#0000FC",
  "#0000BC",
  "#4428BC",
  "#940084",
  "#A80020",
  "#A81000",
  "#881400",
  "#503000",
  "#007800",
  "#006800",
  "#005800",
  "#004058",
  "#000000",

  "#BCBCBC",
  "#0078F8",
  "#0058F8",
  "#6844FC",
  "#D800CC",
  "#E40058",
  "#F83800",
  "#E45C10",
  "#AC7C00",
  "#00B800",
  "#00A800",
  "#00A844",
  "#008888", {
    "src": "/images/clear.png",
    "isClearColor": true
  },

  "#F8F8F8",
  "#3CBCFC",
  "#6888FC",
  "#9878F8",
  "#F878F8",
  "#F85898",
  "#F87858",
  "#FCA044",
  "#F8B800",
  "#B8F818",
  "#58D854",
  "#58F898",
  "#00E8D8",
  "#787878",

  "#FCFCFC",
  "#A4E4FC",
  "#B8B8F8",
  "#D8B8F8",
  "#F8B8F8",
  "#F8A4C0",
  "#F0D0B0",
  "#FCE0A8",
  "#F8D878",
  "#D8F878",
  "#B8F8B8",
  "#B8F8D8",
  "#00FCFC",
  "#F8D8F8",
]
},{}],28:[function(require,module,exports){
var BlockCommand = function(blocks) {
  this.blocks = blocks;

  this.subCommands = [];

  this.deltas = [];
};

BlockCommand.prototype.set = function(coord, value) {
  this.subCommands.push({
    coord: coord,
    value: value
  });
};

BlockCommand.prototype.setAtCoords = function(coords, value) {
  this.subCommands.push({
    coords: coords,
    value: value
  });
};

BlockCommand.prototype.run = function() {
  for (var i = 0; i < this.subCommands.length; i++) {
    var subCommand = this.subCommands[i];
    var value = subCommand.value;
    var coords = subCommand.coords || [subCommand.coord];

    for (var j = 0; j < coords.length; j++) {
      var coord = coords[j];
      var previousValue = this.blocks.getAtCoord(coord);
      this.deltas.push({
        coord: coord,
        previousValue: previousValue
      });

      this.blocks.setAtCoord(coord, value);
    }
  }
};

BlockCommand.prototype.undo = function() {
  for (var i = this.deltas.length - 1; i >= 0; i--) {
    var delta = this.deltas[i];
    this.blocks.setAtCoord(delta.coord, delta.previousValue);
  }
};

module.exports = BlockCommand;
},{}],29:[function(require,module,exports){
var BlockCommand = require('./blockcommand');
var arrayUtils = require('../../utils/arrayutils');

module.exports = function(editor, blocks, coords, offset) {
  var command = new BlockCommand(editor.blocks);

  var toAdd = [];

  for (var i = 0; i < coords.length; i++) {
    var coord = coords[i];
    var value = blocks.getAtCoord(coord);

    // Remove
    command.set(coords[i], undefined);

    toAdd.push({
      coord: normalizeCoord(new THREE.Vector3().addVectors(coord, offset), blocks.dim),
      value: value
    });
  }

  for (var i = 0; i < toAdd.length; i++) {
    var add = toAdd[i];

    // Add
    command.set(add.coord, add.value);
  }

  function normalizeCoord(coord, dim) {
    return new THREE.Vector3(
      (coord.x + dim[0]) % dim[0],
      (coord.y + dim[1]) % dim[1],
      (coord.z + dim[2]) % dim[2]
    );
  };

  return {
    selectionCopy: null,
    run: function() {
      command.run();
      this.selectionCopy = arrayUtils.clone(editor.selections);

      if (editor.selections.length > 0) {
        // Offset selection
        for (var i = 0; i < editor.selections.length; i++) {
          var normalized = normalizeCoord(new THREE.Vector3().addVectors(editor.selections[i], offset), blocks.dim);
          editor.selections[i] = normalized;
        }
      }
    },
    undo: function() {
      command.undo();

      if (editor.selections.length > 0) {
        // Offset selection
        for (var i = 0; i < editor.selections.length; i++) {
          var normalized = normalizeCoord(new THREE.Vector3().subVectors(editor.selections[i], offset), blocks.dim);
          editor.selections[i] = normalized;
        }
      }
    }
  }
};
},{"../../utils/arrayutils":57,"./blockcommand":28}],30:[function(require,module,exports){
var arrayUtils = require('../../utils/arrayutils');

module.exports = function(editor, selections) {
  var originalSelections = null;
  return {
    run: function() {
      originalSelections = arrayUtils.clone(editor.selections);
      editor.selections = selections;
    },

    undo: function() {
      editor.selections = originalSelections;
    }
  };
};
},{"../../utils/arrayutils":57}],31:[function(require,module,exports){
var BlockCommand = require('./blockcommand');

module.exports = function(blocks, coords, value) {
  var command = new BlockCommand(blocks);
  command.setAtCoords(coords, value);

  return command;
};
},{"./blockcommand":28}],32:[function(require,module,exports){
(function (global){
var THREE = (typeof window !== "undefined" ? window['THREE'] : typeof global !== "undefined" ? global['THREE'] : null);

var DragCamera = function(camera, input) {
  this.camera = camera;
  this.input = input;

  this.rotation = new THREE.Euler(-Math.PI / 4, Math.PI / 4, 0, 'YXZ');
  this.lastMouse = new THREE.Vector2();
  this.mouseSpeedX = 0.01;
  this.mouseSpeedY = 0.01;
  this.mouseKeySpeedX = 0.03;
  this.mouseKeySpeedY = 0.03;
  this.unitVector = new THREE.Vector3(0, 0, 1);
  this.distance = 50;
  this.target = new THREE.Vector3(0, 0, 0);
  this.maxPitch = Math.PI / 2 - 0.01;
  this.minPitch = -Math.PI / 2 + 0.01;
  this.zoomRate = 1.1;

  this.updateCamera();

  this.lock = false;
};

DragCamera.$inject = ['input'];

DragCamera.prototype.tick = function() {
  this.processInput();

  this.updateCamera();
};

DragCamera.prototype.processInput = function() {
  if (this.input.mouseHold()) {
    if (!this.lock) {
      var diff = new THREE.Vector2().subVectors(this.input.mouse, this.lastMouse);
      this.rotation.y += diff.x * this.mouseSpeedY;
      this.rotation.x += diff.y * this.mouseSpeedX;

      if (this.rotation.x < this.minPitch) this.rotation.x = this.minPitch;
      if (this.rotation.x > this.maxPitch) this.rotation.x = this.maxPitch;
    }
  }

  var rotateRight = 0;
  var rotateUp = 0;
  if (this.input.keyHold('right')) {
    rotateRight++;
  }
  if (this.input.keyHold('left')) {
    rotateRight--;
  }
  if (this.input.keyHold('up')) {
    rotateUp++;
  }
  if (this.input.keyHold('down')) {
    rotateUp--;
  }

  this.rotation.x += rotateUp * this.mouseKeySpeedX;
  this.rotation.y -= rotateRight * this.mouseKeySpeedY;

  this.lastMouse.copy(this.input.mouse);

  if (this.input.keyUp('=')) {
    this.distance /= this.zoomRate;
  } else if (this.input.keyUp('-')) {
    this.distance *= this.zoomRate;
  }
};

DragCamera.prototype.updateCamera = function() {
  var position = this.unitVector.clone().applyEuler(this.rotation).setLength(this.distance).add(this.target);
  this.camera.position.copy(position);
  this.camera.lookAt(this.target);
};

module.exports = DragCamera;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],33:[function(require,module,exports){
(function (global){
var THREE = (typeof window !== "undefined" ? window['THREE'] : typeof global !== "undefined" ? global['THREE'] : null);
var cpr = require('../cpr/cpr');
var CBuffer = require('cbuffer');
var blocksComponent = require('../components/blocks');
var dragCameraComponent = require('./dragcamera');
var editorConsole = require('./editorconsole');
var EditorTools = require('./editortools');
var OffsetCommand = require('./commands/offsetcommand');
var Blocks = require('../components/blocks');
var arrayUtils = require('../utils/arrayutils');

var toolBar = require('./gui/toolbar');
var arrowBar = require('./gui/arrowbar');
var fileBar = require('./gui/filebar');
var prefabsBar = require('./gui/prefabsbar');
var prefabsToolBar = require('./gui/prefabstoolbar');
var colorBar = require('./gui/colorbar');
var propertyPanel = require('./gui/propertypanel');

var PenTool = require('./tools/pentool');
var SampleTool = require('./tools/sampletool');
var SelectTool = require('./tools/selecttool');
var CameraTool = require('./tools/cameratool');
var FillTool = require('./tools/filltool');

var Editor = function(object, app, input, camera, devConsole, config, palette, canvas, prefabService) {

  this.object = object;

  this.app = app;

  this.input = input;

  this.camera = camera;

  this.devConsole = devConsole;

  this.config = config;

  this.palette = palette;

  this.canvas = canvas;

  this.prefabService = prefabService;

  this.context = this.canvas.getContext('2d');

  this.blocks = null;

  this.dragCamera = null;

  this.objGround = null;

  this.objBoundingBox = null;

  this._started = false;

  this.materials = [];

  this.selectedColor = null;

  this.undos = CBuffer(200);

  this.redos = CBuffer(200);

  this.colorBar = null;

  this.prefabsBar = null;

  this.prefabToolbar = null;

  this.toolBar = null;

  this.arrowBar = null;

  this.fileBar = null;

  this.toolNames = [EditorTools.Pen, EditorTools.Sample, EditorTools.Select, EditorTools.Camera, EditorTools.Fill];

  this.toolName = EditorTools.Pen;

  this.tool = null;

  this.selections = [];

  this.reflectX = false;

  this.reflectY = false;

  this.reflectZ = false;

  // loaded saves
  this.prefabs = [];

  this.screenshotRenderer = null;

  // Copy of block object
  this.lastBlocks = null;

  this.objHighlight = null;

  this.sn = 0.0001;

  this.highlightCoord = null;

  this.downloadElement = null;

  this.editLock = false;

  this.cameraLock = false;

  this.propertyPanel = null;

  this.prefabIndex = 0;
};

Editor.$inject = ['app', 'input', 'camera', 'devConsole', 'config', 'palette', 'canvas', 'prefabService'];

Editor.prototype.start = function() {
  editorConsole(this, this.devConsole);

  this.prefabs = this.prefabService.load();

  this.blocks = this.app.attach(this.object, blocksComponent);

  this.dragCamera = this.app.attach(this.camera, dragCameraComponent);

  this.updateTool();

  this.updateMaterial(this.blocks);

  this.selectedColor = this.palette[0];

  // Set up GUI
  this.toolBar = toolBar(this);
  this.arrowBar = arrowBar(this);
  this.fileBar = fileBar(this);
  this.colorBar = colorBar(this);
  this.prefabsBar = prefabsBar(this);
  this.prefabsToolbar = prefabsToolBar(this);
  this.propertyPanel = propertyPanel(this);

  if (this.prefabs.length === 0) {
    this.prefabs.push(this.blocks.serialize());
  }

  this.load(this.prefabs[0]);
  this.updateScreenshots();
};

Editor.prototype.setTool = function(name) {
  var index = arrayUtils.indexOf(this.toolNames, name);
  if (index === -1) {
    return;
  }

  this.toolBar.highlight(index);
  this.toolName = name;
  this.updateTool();
};

Editor.prototype.tick = function() {
  if (!this._started) {
    this.start();
    this._started = true;
  }

  this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

  var hasIntersect = this.getCoordAbove() != null;

  if (!hasIntersect && this.input.mouseDown()) {
    this.editLock = true;
  }

  if (hasIntersect && this.input.mouseDown()) {
    this.cameraLock = true;
  }

  if (this.input.mouseUp()) {
    this.editLock = false;
    this.cameraLock = false;
  }

  if (this.toolName === EditorTools.Select || this.toolName === EditorTools.Sample) {
    this.cameraLock = true;
  } else if (this.toolName === EditorTools.Camera) {
    this.cameraLock = false;
  }

  this.dragCamera.lock = this.cameraLock;

  this.tool.tick();

  this.updateHighlight(this.highlightCoord);

  this.drawSelection();

  var offsetCoord = null;
  if (this.input.keyDown('f')) {
    offsetCoord = new THREE.Vector3(0, -1, 0);
  }
  if (this.input.keyDown('r')) {
    offsetCoord = new THREE.Vector3(0, 1, 0);
  }
  if (this.input.keyDown('a')) {
    offsetCoord = new THREE.Vector3(-1, 0, 0);
  }
  if (this.input.keyDown('d')) {
    offsetCoord = new THREE.Vector3(1, 0, 0);
  }
  if (this.input.keyDown('w')) {
    offsetCoord = new THREE.Vector3(0, 0, -1);
  }
  if (this.input.keyDown('s')) {
    offsetCoord = new THREE.Vector3(0, 0, 1);
  }

  if (offsetCoord != null) {
    this.applyOffset(offsetCoord);
  }

  if (this.input.keyHold('command') && this.input.keyHold('shift')) {
    if (this.input.keyDown('z')) {
      this.redo();
    }
  } else if (this.input.keyHold('command')) {
    if (this.input.keyDown('z')) {
      this.undo();
    }
  }

  if (this.input.keyDown('1')) {
    this.setTool(this.toolNames[0]);
  } else if (this.input.keyDown('2')) {
    this.setTool(this.toolNames[1]);
  } else if (this.input.keyDown('3')) {
    this.setTool(this.toolNames[2]);
  } else if (this.input.keyDown('4')) {
    this.setTool(this.toolNames[3]);
  }
};

Editor.prototype.undo = function() {
  var command = this.undos.last();
  if (command == null) {
    return;
  }
  command.undo();
  this.undos.pop();
  this.redos.push(command);
  this.updateCurrentScreenshot();
};

Editor.prototype.redo = function() {
  var command = this.redos.last();
  if (command == null) {
    return;
  }
  command.run();
  this.redos.pop();
  this.undos.push(command);
  this.updateCurrentScreenshot();
};

Editor.prototype.runCommand = function(command) {
  command.run();
  this.undos.push(command);
  this.redos = CBuffer(200);
  this.updateCurrentScreenshot();
};

Editor.prototype.updateCurrentScreenshot = function() {
  var index = this.prefabIndex;
  this.prefabs[index] = this.blocks.serialize();
  this.updateScreenshotAtIndex(index);
};

Editor.prototype.updateScreenshots = function() {
  this.prefabsBar.clear();

  for (var i = 0; i < this.prefabs.length; i++) {
    this.updateScreenshotAtIndex(i);
  }
};

Editor.prototype.updateScreenshotAtIndex = function(index) {
  var prefab = this.prefabs[index];
  var imgData = this.screenshot(prefab);

  this.prefabsBar.set(index, {
    imgData: imgData,
    index: index
  });
};

Editor.prototype.updateMaterial = function(blocks) {
  var materials = blocks.material.materials;
  for (var i = 0; i < this.materials.length; i++) {
    materials[i] = this.materials[i];
  }
};

Editor.prototype.updateSize = function(size) {
  this.blocks.setDim([size[0], size[1], size[2]]);
  this.blocks.obj.position.set(-size[0] / 2, -size[1] / 2, -size[2] / 2);
  this.updateGround(size);
  this.updateBoundingBox(size);

  // Max from 3 numbers
  var maxSize = Math.max(size[0], size[1], size[2]);
  this.dragCamera.distance = 2 * (maxSize);
  this.updateCurrentPrefab();
};

Editor.prototype.updateGround = function(size) {
  if (this.objGround != null) {
    this.object.remove(this.objGround);
  }

  var geometry = new THREE.Geometry();
  geometry.vertices.push(
    new THREE.Vector3(-size[0] / 2, -size[1] / 2, -size[2] / 2),
    new THREE.Vector3(size[0] / 2, -size[1] / 2, -size[2] / 2),
    new THREE.Vector3(size[0] / 2, -size[1] / 2, size[2] / 2),
    new THREE.Vector3(-size[0] / 2, -size[1] / 2, size[2] / 2)
  );
  geometry.faces.push(
    new THREE.Face3(2, 1, 0),
    new THREE.Face3(0, 3, 2)
  );
  geometry.faceVertexUvs[0].push(
    [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(size[2] / 2, 0),
      new THREE.Vector2(size[2] / 2, size[0] / 2)
    ], [
      new THREE.Vector2(size[2] / 2, size[0] / 2),
      new THREE.Vector2(0, size[0] / 2),
      new THREE.Vector2(0, 0)
    ]
  );
  var material = materials['placeholder'];
  this.objGround = new THREE.Mesh(geometry, material);
  this.object.add(this.objGround);
};

Editor.prototype.updateBoundingBox = function(size) {
  if (this.objBoundingBox != null) {
    this.object.remove(this.objBoundingBox);
  }

  var geometry = new THREE.Geometry();

  var a = new THREE.Vector3(-size[0] / 2, -size[1] / 2, -size[2] / 2);
  var b = new THREE.Vector3(size[0] / 2, -size[1] / 2, -size[2] / 2);
  var c = new THREE.Vector3(size[0] / 2, -size[1] / 2, size[2] / 2);
  var d = new THREE.Vector3(-size[0] / 2, -size[1] / 2, size[2] / 2);

  var e = new THREE.Vector3(-size[0] / 2, size[1] / 2, -size[2] / 2);
  var f = new THREE.Vector3(size[0] / 2, size[1] / 2, -size[2] / 2);
  var g = new THREE.Vector3(size[0] / 2, size[1] / 2, size[2] / 2);
  var h = new THREE.Vector3(-size[0] / 2, size[1] / 2, size[2] / 2);

  geometry.vertices.push(a, e, b, f, c, g, d, h, e, f, f, g, g, h, h, e);

  var material = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5
  });
  this.objBoundingBox = new THREE.LineSegments(geometry, material);
  this.object.add(this.objBoundingBox);
};

Editor.prototype.updateTool = function() {
  if (this.tool != null) {
    if (this.tool.dispose != null) {
      this.tool.dispose();
    }
  }

  if (this.toolName === EditorTools.Pen) {
    this.tool = new PenTool(this);
  } else if (this.toolName === EditorTools.Sample) {
    this.tool = new SampleTool(this);
  } else if (this.toolName === EditorTools.Select) {
    this.tool = new SelectTool(this);
  } else if (this.toolName === EditorTools.Camera) {
    this.tool = new CameraTool(this);
  } else if (this.toolName === EditorTools.Fill) {
    this.tool = new FillTool(this);
  } else {
    throw new Error('cannot make tool named: ' + this.toolName);
  }
};

Editor.prototype.drawSelection = function() {
  var blocks = this.blocks;
  for (var i = 0; i < this.selections.length; i++) {
    var coord = this.selections[i];
    coord = coord.clone().add(new THREE.Vector3(0.5, 0.5, 0.5));
    var localPoint = blocks.coordToPoint(coord);
    var worldPoint = blocks.obj.localToWorld(localPoint);
    var vector = worldPoint.project(this.camera);
    vector.x = Math.round((vector.x + 1) * canvas.width / 2);
    vector.y = Math.round((-vector.y + 1) * canvas.height / 2);

    this.context.fillStyle = '#ffffff';
    this.context.fillRect(vector.x, vector.y, 1, 1);
  }
};

Editor.prototype.createNew = function() {
  this.blocks.clear();
  var prefab = this.blocks.serialize();
  this.prefabs.push(prefab);
  this.updateScreenshotAtIndex(this.prefabs.length - 1);
  this.prefabIndex = this.prefabs.length - 1;
  this.prefabsBar.highlight(this.prefabs.length - 1);
  this.updatePropertyPanel();
};

Editor.prototype.removeSelected = function() {
  this.prefabs.splice(this.prefabIndex, 1);

  this.updateScreenshots();

  if (this.prefabIndex > this.prefabs.length - 1) {
    this.prefabIndex = this.prefabs.length - 1;
    this.prefabsBar.highlight(this.prefabIndex);
    this.updatePropertyPanel();
  }

  if (this.prefabIndex >= 0) {
    this.blocks.deserialize(this.prefabs[this.prefabIndex]);
  } else {
    this.blocks.clear();
  }
};

Editor.prototype.createClone = function() {
  var prefab = this.blocks.serialize();
  this.prefabs.push(prefab);
  this.updateScreenshotAtIndex(this.prefabs.length - 1);
  this.prefabsBar.highlight(this.prefabs.length - 1);
};

Editor.prototype.screenshot = function(data) {
  if (this.screenshotRenderer == null) {
    this.screenshotRenderer = new THREE.WebGLRenderer({
      alpha: true
    });
    this.screenshotRenderer.setClearColor(0xffffff, 0.0);
  }

  var renderer = this.screenshotRenderer;

  var width = 100;
  var height = 100;
  renderer.setSize(width, height);

  var object = new THREE.Object3D();
  var blocks = new Blocks(object);
  blocks.deserialize(data);
  blocks.tick();

  var dim = blocks.dim;

  blocks.obj.position.set(-dim[0] / 2, -dim[1] / 2, -dim[2] / 2);

  var objectClone = object.clone();
  var scene = new THREE.Scene();
  scene.add(objectClone);

  var ambient = new THREE.AmbientLight(new THREE.Color("rgb(60%, 60%, 60%)"));
  var light = new THREE.DirectionalLight(0xffffff, 0.6);
  light.position.set(0.8, 1, 0.5);
  scene.add(light);
  scene.add(ambient);

  var maxSize = Math.max(dim[0], dim[1], dim[2]) * 2;

  var camera = new THREE.OrthographicCamera(maxSize / -2, maxSize / 2, maxSize / 2, maxSize / -2, 0.1, 1000);
  camera.position.set(0, 0, 10);

  var cameraPosition = new THREE.Vector3(0, 0, maxSize)
    .applyEuler(new THREE.Euler(-Math.PI / 4, 0, 0, 'YXZ'))
  camera.position.copy(cameraPosition);
  camera.lookAt(new THREE.Vector3());

  renderer.render(scene, camera);
  imgData = renderer.domElement.toDataURL();

  renderer.dispose();

  return imgData;
};

Editor.prototype.load = function(data) {
  this.blocks.deserialize(data);

  this.updateSize(this.blocks.dim);

  this.updateLastBlocks();

  this.updatePropertyPanel();
};

Editor.prototype.updatePropertyPanel = function() {
  var prefab = this.getSelectedPrefab();

  this.propertyPanel.controllers['name'].setValue(prefab.userData.name || 'unnamed');

  var dim = prefab.dim;
  var formattedSize = dim.join(' ');
  this.propertyPanel.controllers['size'].setValue(formattedSize);
};

Editor.prototype.reset = function() {
  this.prefabService.reset();
};

Editor.prototype.save = function() {
  this.prefabService.save(this.prefabs);
};

Editor.prototype.updateLastBlocks = function() {
  this.blocks.updateMesh();
  this.lastBlocks = this.blocks.obj.clone();
  this.lastBlocks.updateMatrixWorld();
};

Editor.prototype.getCoordAbove = function(point) {
  point = point || this.input.mouse;
  var objects = [];
  if (this.lastBlocks != null) objects.push(this.lastBlocks);
  if (this.objGround != null) objects.push(this.objGround);
  return this.getCoord(objects, point, -this.sn);
};

Editor.prototype.getCoordBelow = function(point) {
  point = point || this.input.mouse;
  var objects = [];
  if (this.lastBlocks != null) objects.push(this.lastBlocks);
  var coord = this.getCoord(objects, point, this.sn);

  if (coord == null && this.objGround != null) {
    return this.getCoord([this.objGround], point, -this.sn);
  }

  return coord;
};

Editor.prototype.getCoord = function(objects, atPoint, delta) {
  var viewport = this.input.screenToViewport(atPoint);
  var raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(viewport, this.camera);
  var intersects = raycaster.intersectObjects(objects, true);

  if (intersects.length === 0) {
    return undefined;
  }

  var intersect = intersects[0];

  var point = intersect.point;
  var diff = point.clone().sub(this.camera.position);
  diff = diff.setLength(diff.length() + (delta || 0));
  point = this.camera.position.clone().add(diff);

  var localPoint = this.blocks.obj.worldToLocal(point);
  var coord = this.blocks.pointToCoord(localPoint);
  coord = new THREE.Vector3(
    Math.round(coord.x),
    Math.round(coord.y),
    Math.round(coord.z)
  );

  return coord;
};

Editor.prototype.updateHighlight = function(coord) {
  if (this.objHighlight == null) {
    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshBasicMaterial();
    var mesh = new THREE.Mesh(geometry, material);
    var wireframe = new THREE.EdgesHelper(mesh, 0xffffff);
    this.objHighlight = new THREE.Object3D();
    this.objHighlight.add(wireframe);
    this.object.add(this.objHighlight);
  }

  if (coord == null) {
    this.objHighlight.visible = false;
    return;
  }

  coord = coord.clone().add(new THREE.Vector3(0.5, 0.5, 0.5));
  this.objHighlight.visible = true;
  var localPoint = this.blocks.coordToPoint(coord);
  var worldPoint = this.blocks.obj.localToWorld(localPoint);
  this.objHighlight.position.copy(worldPoint);
};

Editor.prototype.setSelectedColor = function(color) {
  var index = arrayUtils.indexOf(this.palette, function(c) {
    return color === c || (color == null && c.isClearColor);
  });

  if (index == -1) {
    return;
  }

  this.selectedColor = color;
  this.colorBar.highlight(index);
};

Editor.prototype.applyOffset = function(offset) {
  var selectedCoords;
  if (this.selections.length > 0) {
    selectedCoords = this.selections;
  } else {
    selectedCoords = this.blocks.getAllCoords();
  }

  this.runCommand(new OffsetCommand(this, this.blocks, selectedCoords, offset));
};

Editor.prototype.downloadJSON = function(json, name) {
  name = name || 'blocks';
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json));
  if (this.downloadElement == null) {
    this.downloadElement = document.createElement('a');
    this.downloadElement.style.visibility = 'hidden';
    document.body.appendChild(this.downloadElement);
  }
  this.downloadElement.setAttribute("href", dataStr);
  this.downloadElement.setAttribute("download", name + '.json');
  this.downloadElement.click();
};

Editor.prototype.serialize = function() {
  return this.blocks.serialize();
};

Editor.prototype.getSelectedPrefab = function() {
  return this.prefabs[this.prefabIndex];
};

Editor.prototype.updateCurrentPrefab = function() {
  this.prefabs[this.prefabIndex] = this.blocks.serialize();
};

module.exports = Editor;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../components/blocks":18,"../cpr/cpr":25,"../utils/arrayutils":57,"./commands/offsetcommand":29,"./dragcamera":32,"./editorconsole":34,"./editortools":35,"./gui/arrowbar":36,"./gui/colorbar":37,"./gui/filebar":38,"./gui/prefabsbar":40,"./gui/prefabstoolbar":41,"./gui/propertypanel":42,"./gui/toolbar":43,"./tools/cameratool":45,"./tools/filltool":46,"./tools/pentool":47,"./tools/sampletool":48,"./tools/selecttool":49,"cbuffer":1}],34:[function(require,module,exports){
var Editor = require('./editor');

module.exports = function(editor, devConsole) {

  devConsole.commands['size'] = function(args) {
    var defaultSize = editor.config['editor_default_size'];
    var x = args._[0] || defaultSize[0];
    var y = args._[1] || args._[0] || defaultSize[1];
    var z = args._[2] || args._[0] || defaultSize[2];

    editor.updateSize([x, y, z]);
  };

  devConsole.commands['offset'] = function(args) {
    var x = args._[0] || 0;
    var y = args._[1] || 0;
    var z = args._[2] || 0;

    editor.blocks.setOffset(new THREE.Vector3(x, y, z));
  };

  devConsole.commands['new'] = function(args) {
    editor.createNew();
  };

  devConsole.commands['mirror'] = function(args) {
    if (args._.length === 0) {
      throw new Error('please specify x y z or none');
    }

    if (args._.length === 1) {
      if (args._[0] === 'none') {
        editor.reflectX = editor.reflectY = editor.reflectZ = false;
      }
    }

    editor.reflectX = editor.reflectY = editor.reflectZ = false;
    for (var i = 0; i < args._.length; i++) {
      var arg = args._[i];
      if (arg === 'x') {
        editor.reflectX = true;
      } else if (arg === 'y') {
        editor.reflectY = true;
      } else if (arg === 'z') {
        editor.reflectZ = true;
      } else {
        throw new Error('unknown option: ' + arg);
      }
    }
  };

  devConsole.commands['reset'] = function() {
    editor.reset();
  };

  devConsole.commands['save'] = function() {
    editor.save();
  };
}
},{"./editor":33}],35:[function(require,module,exports){
var EditorTools = {
  Pen: 'Pen',
  Select: 'Select',
  Sample: 'Sample',
  Camera: 'Camera',
  Fill: 'Fill'
};

module.exports = EditorTools;
},{}],36:[function(require,module,exports){
var cpr = require('../../cpr/cpr');

module.exports = function(editor) {
  var container = document.getElementById('container');

  var data = [{
    src: '/images/arrow1.png',
    index: 0,
    tooltip: 'move right (D)'
  }, {
    src: '/images/arrow2.png',
    index: 1,
    tooltip: 'move left (A)'
  }, {
    src: '/images/arrow3.png',
    index: 2,
    tooltip: 'move front (W)'
  }, {
    src: '/images/arrow4.png',
    index: 3,
    tooltip: 'move back (S)'
  }, {
    src: '/images/arrow5.png',
    index: 4,
    tooltip: 'move up (R)'
  }, {
    src: '/images/arrow6.png',
    index: 5,
    tooltip: 'move down (F)'
  }];

  var bar = cpr({
    data: data,
    blockWidth: 32,
    blockHeight: 32,
    hideHighlight: true,
    customPlacement: true,
    showTooltip: true,
    onPick: function(obj) {
      var index = obj.index;

      var offset = null;
      if (index === 0) {
        offset = new THREE.Vector3(1, 0, 0);
      } else if (index === 1) {
        offset = new THREE.Vector3(-1, 0, 0);
      } else if (index === 2) {
        offset = new THREE.Vector3(0, 0, -1);
      } else if (index === 3) {
        offset = new THREE.Vector3(0, 0, 1);
      } else if (index === 4) {
        offset = new THREE.Vector3(0, 1, 0);
      } else if (index === 5) {
        offset = new THREE.Vector3(0, -1, 0);
      }

      editor.applyOffset(offset);
    }
  });

  container.appendChild(bar.domElement);
  bar.domElement.style.position = 'absolute';
  bar.domElement.style.top = '80px';
  bar.domElement.style.left = '20px';
};
},{"../../cpr/cpr":25}],37:[function(require,module,exports){
var cpr = require('../../cpr/cpr');

module.exports = function(editor) {
  var bar = cpr({
    data: editor.palette,
    onPick: function(color) {
      editor.selectedColor = color.isClearColor ? null : color;
    }
  });

  return bar;
};
},{"../../cpr/cpr":25}],38:[function(require,module,exports){
var cpr = require('../../cpr/cpr');
var popup = require('./popup');

module.exports = function(editor) {
  // download.png
  var data = [{
    src: '/images/download.png',
    button: 'download'
  }];

  var bar = cpr({
    data: data,
    customPlacement: true,
    blockWidth: 32,
    blockHeight: 32,
    hideHighlight: true,
    onPick: function(obj) {
      var button = obj.button;

      if (button === 'download') {
        editor.downloadJSON(editor.serialize(), 'blocks');
      }
    }
  });

  var container = document.getElementById('container');
  container.appendChild(bar.domElement);

  bar.domElement.style.position = 'absolute';
  bar.domElement.style.left = 20 + 'px';
  bar.domElement.style.top = 140 + 'px';
};
},{"../../cpr/cpr":25,"./popup":39}],39:[function(require,module,exports){
module.exports = {
  prompt: function(text, buttons, callback) {
    var background = document.createElement('div');
    background.style.backgroundColor = 'rgba(0,0,0,0.8)'
    background.style.position = 'absolute';
    background.style.width = '100%';
    background.style.height = '100%';
    document.body.appendChild(background);

    var containerWidth = 200;
    var containerHeight = 200;
    var container = document.createElement('div');
    container.className = 'prompt';
    container.style.position = 'absolute';
    container.style.width = containerWidth + 'px';
    container.style.height = containerHeight + 'px';

    background.appendChild(container);

    updateLayout();

    function onWindowResize() {
      updateLayout();
    };

    window.addEventListener('resize', onWindowResize);

    var question = document.createElement('h2');
    question.innerHTML = text;
    question.style.fontFamily = ''
    container.appendChild(question);

    var input = document.createElement('input');
    input.type = 'text';
    container.appendChild(input);

    container.appendChild(document.createElement('br'));

    function onClick(index) {
      return function() {
        var valid = callback(input.value, index);
        if (valid === undefined) {
          valid = true;
        }

        if (valid) {
          dismiss();
        }
      }
    };

    for (var i = 0; i < buttons.length; i++) {
      var buttonText = buttons[i];
      var button = document.createElement('button');
      button.innerHTML = buttonText;
      button.onclick = onClick(i);
      container.appendChild(button);
    }

    function updateLayout() {
      container.style.left = (window.innerWidth - containerWidth) / 2 + 'px';
      container.style.top = (window.innerHeight - containerHeight) / 2 + 'px';
    };

    function dismiss() {
      document.body.removeChild(background);
      window.removeEventListener('resize', onWindowResize);
    }

    input.focus();

    var prompt = {
      dismiss: dismiss
    };

    return prompt;
  }
}
},{}],40:[function(require,module,exports){
var cpr = require('../../cpr/cpr');

module.exports = function(editor) {
  var bar = cpr({
    onPick: function(obj, index) {
      editor.prefabIndex = index;
      editor.load(editor.prefabs[index]);
    },
    blockWidth: 48,
    blockHeight: 48
  });

  bar.domElement.style.bottom = '120px';

  return bar;
};
},{"../../cpr/cpr":25}],41:[function(require,module,exports){
var cpr = require('../../cpr/cpr');

module.exports = function(editor) {
  var data = [{
    button: 'plus',
    src: '/images/plus.png'
  }, {
    button: 'minus',
    src: '/images/minus.png'
  }, {
    button: 'clone',
    src: '/images/clone.png'
  }];

  var bar = cpr({
    data: data,
    blockWidth: 32,
    blockHeight: 32,
    disableHighlight: true,
    onPick: function(obj) {
      var button = obj.button;

      if (button === 'plus') {
        editor.createNew();
      } else if (button === 'minus') {
        editor.removeSelected();
      } else if (button === 'clone') {
        editor.createClone();
      }
    }
  });

  bar.domElement.style.bottom = '180px';
};
},{"../../cpr/cpr":25}],42:[function(require,module,exports){
var panel = require('../panel/panel');

module.exports = function(editor) {
  var data = [{
    title: 'name',
    value: '',
    onChange: function(value) {
      editor.getSelectedPrefab().userData.name = value;
    }
  }, {
    title: 'size',
    value: '',
    onFinishEditing: function(value, input) {
      var reg = /^(\d{1,2}) (\d{1,2}) (\d{1,2})$/g
      var matches = reg.exec(value);

      if (matches == null) {
        editor.updatePropertyPanel();
        return;
      }

      editor.updateSize([parseInt(matches[1]), parseInt(matches[2]), parseInt(matches[3])]);
    }
  }, {
    title: 'mirror',
    type: 'checkList',
    options: ['x', 'y', 'z'],
    onChange: function(options) {
      editor.reflectX = editor.reflectY = editor.reflectZ = false;
      for (var i = 0; i < options.length; i++) {
        if (options[i] === 'x') {
          editor.reflectX = true;
        } else if (options[i] === 'y') {
          editor.reflectY = true;
        } else if (options[i] === 'z') {
          editor.reflectZ = true;
        }
      }
    }
  }];

  return panel(data);
};
},{"../panel/panel":44}],43:[function(require,module,exports){
var cpr = require('../../cpr/cpr');
var EditorTools = require('../editortools');

module.exports = function(editor) {
  var bar = cpr({
    data: [{
      src: '/images/plus.png',
      toolname: EditorTools.Pen,
      tooltip: 'pen tool (1)'
    }, {
      src: '/images/sampler.png',
      toolname: EditorTools.Sample,
      tooltip: 'sample tool (2)'
    }, {
      src: '/images/lasso.png',
      toolname: EditorTools.Select,
      tooltip: 'lasso tool (3)'
    }, {
      src: '/images/camera.png',
      toolname: EditorTools.Camera,
      tooltip: 'camera tool (4 or drag empty space)'
    }, {
      src: '/images/fill.png',
      toolname: EditorTools.Fill
    }],
    blockWidth: 32,
    blockHeight: 32,
    onPick: function(obj) {
      editor.toolName = obj.toolname;
      editor.updateTool();
    },
    customPlacement: true,
    showTooltip: true
  });

  var container = document.getElementById('container');
  container.appendChild(bar.domElement);

  bar.domElement.style.position = 'absolute';
  bar.domElement.style.top = 20 + 'px';
  bar.domElement.style.left = 20 + 'px';

  return bar;
};
},{"../../cpr/cpr":25,"../editortools":35}],44:[function(require,module,exports){
module.exports = function(data) {
  var container = document.createElement('div');

  container.className = 'panel';

  container.style.position = 'absolute';
  container.style.right = 20 + 'px';
  container.style.top = 20 + 'px';
  container.style.width = 200 + 'px';

  var panel = {};
  panel.controllers = {};

  var controllers = {
    'checkList': checkListController
  };

  for (var i = 0; i < data.length; i++) {
    var item = data[i];

    var factory = controllers[item.type] || valueController;
    var controller = factory(item);
    panel.controllers[item.title] = controller;

    container.appendChild(controller.element);
  }

  document.body.appendChild(container);

  return panel;
};

var valueController = function(item) {

  var onChange = item.onChange || function() {};
  var onFinishEditing = item.onFinishEditing || function() {};

  var section = document.createElement('section');
  section.className = 'section';

  var title = document.createElement('div');
  title.innerHTML = item.title;
  title.className = 'title';
  section.appendChild(title);

  var input = document.createElement('input');
  input.type = 'text';
  input.value = item.value;
  input.className = 'value';

  section.appendChild(input);

  var inputListener = function() {
    onChange(input.value);
  };

  var keydownListener = function(e) {
    if (e.keyCode === 13) {
      input.blur();
    }
  };

  input.addEventListener('input', inputListener);
  input.addEventListener('keydown', keydownListener);

  function setValue(value) {
    input.value = value;
  };

  function dispose() {
    input.removeEventListener('input', inputListener);
    input.removeEventListener('keydown', keydownListener);
  };

  input.onblur = function() {
    onFinishEditing(input.value, input);
  };

  return {
    element: section,
    setValue: setValue,
    set onChange(value) {
      onChange = value;
    },
    dispose: dispose
  }
};

var checkListController = function(item) {
  var onChange = item.onChange || function() {};

  var section = document.createElement('section');
  section.className = 'section';

  var title = document.createElement('div');
  title.innerHTML = item.title;
  title.className = 'title';
  section.appendChild(title);

  var options = item.options;

  var buttons = [];

  var onClick = function(index) {
    return function() {
      var button = buttons[index];
      if (button.className === 'selected') {
        button.className = '';
      } else {
        button.className = 'selected';
      }

      onChange(getSelectedOptions());
    };
  };

  function getSelectedOptions() {
    var selection = [];
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].className === 'selected') {
        selection.push(options[i]);
      }
    }

    return selection;
  };

  for (var i = 0; i < options.length; i++) {
    var option = options[i];
    var button = document.createElement('button');
    button.innerHTML = option;
    section.appendChild(button);

    if (i === options.length - 1) {
      button.style['border-right-style'] = '2px solid #000';
    }

    button.onclick = onClick(i);

    buttons.push(button);
  }

  return {
    element: section
  }
};
},{}],45:[function(require,module,exports){
var CameraTool = function() {

};

CameraTool.prototype.tick = function() {
	
};

module.exports = CameraTool;
},{}],46:[function(require,module,exports){
var FillTool = function() {

};

FillTool.prototype.tick = function() {

};

module.exports = FillTool;
},{}],47:[function(require,module,exports){
var SetCommand = require('../commands/setcommand');

var PenTool = function(editor) {

  this.editor = editor;

  this.camera = this.editor.camera;

  this.input = this.editor.input;

  this.blocks = this.editor.blocks;

  this.object = this.editor.object;

  this.lastMouse = new THREE.Vector2();

  this.mouseSampleInterval = 4;
};

PenTool.prototype.tick = function() {
  if (this.editor.editLock) {
    return;
  }
  
  var isClearColor = this.editor.selectedColor == null;

  this.editor.highlightCoord = isClearColor ?
    this.editor.getCoordBelow() :
    this.editor.getCoordAbove();

  if (this.input.mouseDown() || this.input.mouseUp()) {
    this.editor.updateLastBlocks();
  }

  if (this.input.mouseDown(0)) {
    this.onClick(isClearColor);
  } else if (this.input.mouseDown(2)) {
    this.onClick(true);
  }

  if (this.input.mouseHold(0) && this.input.mouseMove()) {
    this.onDrag(isClearColor);
  } else if (this.input.mouseHold(2) && this.input.mouseMove()) {
    this.onDrag(true);
  }

  this.lastMouse = this.input.mouse.clone();
};

PenTool.prototype.onClick = function(isClear) {
  var color = isClear ? null : this.editor.selectedColor;
  var selectedIndex = this.blocks.getOrAddColorIndex(color);

  var coord = isClear ?
    this.editor.getCoordBelow() :
    this.editor.getCoordAbove();

  if (!!coord) {
    if (this.blocks.getAtCoord(coord) !== selectedIndex) {
      this.editor.runCommand(new SetCommand(this.blocks, this.reflectCoords([coord]), selectedIndex));
      this.editor.updateLastBlocks();
    }
  }
};

PenTool.prototype.onDrag = function(isClear) {
  var color = isClear ? null : this.editor.selectedColor;
  var selectedIndex = this.blocks.getOrAddColorIndex(color);

  var points = this.getMousePoints(this.lastMouse, this.input.mouse, this.mouseSampleInterval);
  var coords = [];
  for (var i = 0; i < points.length; i++) {
    var coord = isClear ?
      this.editor.getCoordBelow(points[i]) :
      this.editor.getCoordAbove(points[i]);

    if (!!coord) {
      if (this.blocks.getAtCoord(coord) !== selectedIndex) {
        coords.push(coord);
      }
    }
  }

  coords = uniqueCoords(coords);
  if (coords.length > 0) {
    this.editor.runCommand(new SetCommand(this.blocks, this.reflectCoords(coords), selectedIndex));
  }
};

// Reflect coords with editor settings
PenTool.prototype.reflectCoords = function(coords) {
  if (!this.editor.reflectX && !this.editor.reflectY && !this.editor.reflectZ) {
    return coords;
  }

  var dim = this.blocks.dim;
  var pivot = [
    Math.round((dim[0] - 1) / 2),
    Math.round((dim[1] - 1) / 2),
    Math.round((dim[2] - 1) / 2)
  ];

  if (this.editor.reflectX) {
    var reflected = [];
    for (var i = 0; i < coords.length; i++) {
      var r = coords[i].clone();
      r.x = pivot[0] + pivot[0] - r.x;
      reflected.push(r);
    }
    coords = coords.concat(reflected);
  }

  if (this.editor.reflectY) {
    var reflected = [];
    for (var i = 0; i < coords.length; i++) {
      var r = coords[i].clone();
      r.y = pivot[1] + pivot[1] - r.y;
      reflected.push(r);
    }
    coords = coords.concat(reflected);
  }

  if (this.editor.reflectZ) {
    var reflected = [];
    for (var i = 0; i < coords.length; i++) {
      var r = coords[i].clone();
      r.z = pivot[2] + pivot[2] - r.z;
      reflected.push(r);
    }
    coords = coords.concat(reflected);
  }

  return coords;
};

PenTool.prototype.getMousePoints = function(from, to, maxDis) {
  var distance = new THREE.Vector2().subVectors(to, from).length();

  var interval = Math.ceil(distance / maxDis);
  var step = new THREE.Vector2().subVectors(to, from).setLength(distance / interval);

  var list = [];
  var start = from.clone();
  list.push(start);
  for (var i = 0; i < interval; i++) {
    start.add(step);
    list.push(start.clone());
  }
  return list;
};

function uniqueCoords(coords) {
  var map = {};
  for (var i = 0; i < coords.length; i++) {
    map[coords[i].toArray().join(',')] = coords[i];
  }
  var list = [];
  for (var id in map) {
    list.push(map[id]);
  }
  return list;
};

module.exports = PenTool;
},{"../commands/setcommand":31}],48:[function(require,module,exports){
var EditorTools = require('../editortools');

var SampleTool = function(editor) {
  this.editor = editor;
  this.input = this.editor.input;
  this.blocks = this.editor.blocks;
};

SampleTool.prototype.tick = function() {
  this.editor.highlightCoord = this.editor.getCoordBelow();

  if (this.input.mouseDown()) {
    var coord = this.editor.getCoordBelow();

    var color = null;
    if (coord != null) {
      var index = this.blocks.getAtCoord(coord);
      var color = this.blocks.palette[index];
      this.editor.setSelectedColor(color);

    } else {
      this.editor.setSelectedColor(null);
    }

    // this.editor.setTool(EditorTools.Pen);
  }
};

module.exports = SampleTool;
},{"../editortools":35}],49:[function(require,module,exports){
var inside = require('point-in-polygon');
var SelectCommand = require('../commands/selectcommand');

var SelectTool = function(editor) {
  this.editor = editor;
  this.input = this.editor.input;
  this.blocks = this.editor.blocks;
  this.camera = this.editor.camera;

  this.divSelectionBox = null;

  this.canvas = editor.canvas;
  this.context = this.canvas.getContext('2d');

  this.points = [];
  this.minDistance = 2;
};

SelectTool.prototype.tick = function() {

  if (this.input.mouseHold(0)) {
    var mouse = this.input.mouse.clone();
    if (this.points.length === 0) {
      this.points.push(mouse.toArray());
    } else {
      var lastMouse = new THREE.Vector2().fromArray(this.points[this.points.length - 1]);
      var distance = lastMouse.distanceTo(mouse);
      if (distance > this.minDistance) {
        this.points.push(mouse.toArray());
      }
    }
  } else {
    if (this.points.length > 0) {
      this.updateSelection();
    }
    this.points = [];
  }

  this.drawLasso();
};

SelectTool.prototype.drawLasso = function() {
  if (this.points.length < 2) {
    return;
  }

  this.context.lineWidth = '1';
  this.context.setLineDash([3]);
  this.context.strokeStyle = '#ffffff';
  this.context.beginPath();
  for (var i = 0; i < this.points.length; i++) {
    var point = this.points[i];
    if (i === 0) {
      this.context.moveTo(point[0], point[1]);
    } else {
      this.context.lineTo(point[0], point[1]);
    }
  }
  this.context.stroke();
};

SelectTool.prototype.updateSelection = function() {
  var blocks = this.blocks;
  var camera = this.camera;
  var canvas = this.canvas;
  var self = this;

  var screenPoints = [];
  this.blocks.visit(function(i, j, k, b) {
    var coord = new THREE.Vector3(i + 0.5, j + 0.5, k + 0.5);
    var localPoint = blocks.coordToPoint(coord);
    var worldPoint = blocks.obj.localToWorld(localPoint);
    var vector = worldPoint.project(camera);
    vector.x = Math.round((vector.x + 1) * canvas.width / 2);
    vector.y = Math.round((-vector.y + 1) * canvas.height / 2);

    screenPoints.push({
      screen: [vector.x, vector.y],
      coord: new THREE.Vector3(i, j, k)
    });
  });

  var selections = [];
  for (var i = 0; i < screenPoints.length; i++) {
    var screen = screenPoints[i].screen;
    // Test point in polygon
    if (inside(screen, this.points)) {
      selections.push(screenPoints[i].coord);
    }
  }

  this.editor.runCommand(new SelectCommand(this.editor, selections));
};

module.exports = SelectTool;
},{"../commands/selectcommand":30,"point-in-polygon":13}],50:[function(require,module,exports){
(function (global){
var THREE = (typeof window !== "undefined" ? window['THREE'] : typeof global !== "undefined" ? global['THREE'] : null);
var b = require('./core/b');
var stats = require('./services/stats');

var app = b('main');

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

// Regsiter values
app.value('app', app);
app.value('scene', scene);
app.value('camera', camera);
app.value('config', require('./data/config.json'));
app.value('palette', require('./data/palette.json'));
app.value('materials', require('./services/materials'));
app.value('canvas', document.getElementById('canvas'));

var container = document.getElementById('container');
app.use(require('./systems/renderer')(scene, camera, container));
app.use('input', require('./systems/input')(container));
app.use(require('./voxel/voxel')());

var devConsole = require('./services/devconsole')({
  onblur: function() {
    container.focus();
  }
});
app.value('devConsole', devConsole);

var prefabService = require('./services/prefabservice')();
app.value('prefabService', prefabService);

stats(app);

// Attach camera control
function loadGame() {
  app.attach(camera, require('./components/playerCamera'));

  app.loadAssembly(require('./assemblies/aground'));

  var player = app.loadAssembly(require('./assemblies/aplayer'));
  app.value('player', player);
};

function loadEditor() {
  app.loadAssembly(require('./assemblies/aeditor'));
}

loadEditor();

app.start();

var canvas = document.getElementById('canvas');
app.on('beforeTick', function() {
  if (canvas.width !== window.innerWidth) {
    canvas.width = window.innerWidth;
  }
  if (canvas.height !== window.innerHeight) {
    canvas.height = window.innerHeight;
  }
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./assemblies/aeditor":15,"./assemblies/aground":16,"./assemblies/aplayer":17,"./components/playerCamera":20,"./core/b":23,"./data/config.json":26,"./data/palette.json":27,"./services/devconsole":51,"./services/materials":52,"./services/prefabservice":53,"./services/stats":54,"./systems/input":55,"./systems/renderer":56,"./voxel/voxel":61}],51:[function(require,module,exports){
var parseArgs = require('minimist');
var keycode = require('keycode');

module.exports = function(opts) {
  opts = opts || {};
  var onfocus = opts.onfocus || null;
  var onblur = opts.onblur || null;
  var commands = opts.commands || {};

  var div = document.createElement('div');
  document.body.appendChild(div);
  div.style.position = 'absolute';
  div.style.left = '0px';
  div.style.top = '0px';
  div.style.width = '100%';
  div.style.height = '120px';
  div.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

  var input = document.createElement('input');
  input.type = 'text';
  input.className = 'console-input';
  input.style.position = 'absolute';
  input.style.left = '0px';
  input.style.top = '0px';
  input.style.width = '100%';
  input.style.height = '20px';
  input.style['background-color'] = 'transparent';
  input.style['border'] = '0px solid';
  input.spellcheck = false;
  input.style.color = '#FFFFFF';
  input.style.fontSize = '16px';
  input.style.padding = '2px 2px 0px 2px';
  input.value = '> ';

  div.appendChild(input);

  var textSpan = document.createElement('span');
  textSpan.className = 'console-span';
  textSpan.style.position = 'absolute';
  textSpan.style.left = '0px';
  textSpan.style.top = '20px';
  textSpan.style.width = '100%';
  textSpan.style.height = '100px';
  textSpan.style.color = '#FFFFFF';
  textSpan.style.fontSize = '16px';
  textSpan.style.padding = '0px 2px 2px 2px';

  div.appendChild(textSpan);

  // Remove outline on focus
  input.onfocus = function() {
    input.style['outline'] = 'none';
  };

  input.onkeypress = function(e) {
    if (e.keyCode === 13) {
      onEnterPressed();
    }
    onInputChanged(e);
  };

  input.onkeyup = function(e) {
    onInputChanged(e);
  };

  function onInputChanged(e) {
    if (input.value.length < 2) {
      input.value = '> ';
    }
  };

  var lines = [];
  var historyLength = 100;
  var numberOfLines = 5;

  function onEnterPressed() {
    var line = input.value;
    addLog(line);
    line = line.substring(2);
    line = line.trim();
    var index = line.indexOf(' ');
    var commandName = index === -1 ? line : line.substring(0, index);
    var args = index === -1 ? '' : line.substring(index + 1);

    var command = commands[commandName];
    if (command == null) {
      addError(commandName + ': command not found');
    } else {
      try {
        var result = command(parseArgs(args.split(' ')));
        if (typeof result === 'string') {
          addLog(result);
        }

        hide();
      } catch (err) {
        addError(err);
        console.error(err.stack);
      }
    }

    input.value = '';
  };

  function addLog(line) {
    addLine(line);
  };

  function addError(line) {
    addLine(line);
  };

  function addLine(line) {
    lines.push(line);
    if (lines.length > historyLength) {
      lines.pop();
    }
    updateLines();
  };

  function updateLines() {
    var text = '';
    for (var i = 0; i < numberOfLines; i++) {
      var line = lines[lines.length - 1 - i];
      line = line || '';
      text += line;
      text += "<br />";
    }

    textSpan.innerHTML = text;
  };

  function hide() {
    div.hidden = true;
    input.blur();
    if (onblur != null) {
      onblur();
    }
  };

  function show() {
    div.hidden = false;
    input.value = input.value.split('`').join('');
    input.focus();
    if (onfocus != null) {
      onfocus();
    }
  };

  window.addEventListener('keyup', function(e) {
    var key = keycode(e);
    if (key === '`') {
      if (div.hidden) {
        show();
      } else {
        hide();
      }
    }
  });

  // Hidden by default
  div.hidden = true;

  function loadCommands(value) {
    for (var i in value) {
      commands[i] = value[i];
    }
  };

  return {
    commands: commands,
    loadCommands: loadCommands
  };
};
},{"keycode":8,"minimist":9}],52:[function(require,module,exports){
(function (global){
var THREE = (typeof window !== "undefined" ? window['THREE'] : typeof global !== "undefined" ? global['THREE'] : null);

var textureLoader = new THREE.TextureLoader();

function loadLambertMaterial(source) {
  var texture = textureLoader.load(source);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  return new THREE.MeshLambertMaterial({
    map: texture
  });
};

function loadBasicMaterial(source) {
  var texture = textureLoader.load(source);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  texture.magFilter = THREE.NearestFilter;
  
  return new THREE.MeshBasicMaterial({
    map: texture
  });
};

materials = {
  '1': loadLambertMaterial('images/1.png'),
  'placeholder': loadBasicMaterial('images/placeholder.png')
}

module.exports = materials;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],53:[function(require,module,exports){
var PrefabService = function() {};

PrefabService.prototype.load = function() {
  try {
    var saves = JSON.parse(window.localStorage.getItem('b_saves') || []);
    return saves;
  } catch (err) {
    return [];
  }
};

PrefabService.prototype.save = function(data) {
  window.localStorage.setItem('b_saves', JSON.stringify(data));
};

PrefabService.prototype.reset = function() {
  window.localStorage.setItem('b_saves', '');
};

module.exports = function() {
  return new PrefabService();
};
},{}],54:[function(require,module,exports){
var Stats = require('stats.js');

module.exports = function(app) {
  app.on('beforeTick', function() {
    stats.begin();
  });

  app.on('afterTick', function() {
    stats.end();
  });

  var stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.right = '0px';
  stats.domElement.style.bottom = '50px';
  document.body.appendChild(stats.domElement);

  return stats.domElement;
};
},{"stats.js":14}],55:[function(require,module,exports){
var arrayUtils = require('../utils/arrayutils');
var keycode = require('keycode');

module.exports = function(element) {
  "use strict";

  var mouse = new THREE.Vector2();
  var mousedowns = [];
  var mouseups = [];
  var mousemove = false;
  var mouseholds = [];
  var keydowns = [];
  var keyups = [];
  var keyholds = [];
  var mousedownTimes = {};
  var clickTime = 150;
  var mouseclicks = [];

  element.focus();

  function onMouseMove(e) {
    mousemove = true;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  };

  function onMouseDown(e) {
    mousedowns.push(e.button);
    mousedownTimes[e.button] = new Date().getTime();
    if (!arrayUtils.includes(mouseholds, e.button)) {
      mouseholds.push(e.button);
    }
  };

  function onMouseUp(e) {
    if (!!mousedownTimes[e.button]) {
      var diff = new Date().getTime() - mousedownTimes[e.button];
      if (diff < clickTime) {
        mouseclicks.push(e.button);
      }
    }
    mouseups.push(e.button);
    arrayUtils.remove(mouseholds, e.button);
  };

  function onKeyDown(e) {
    var key = keycode(e);
    keydowns.push(key);
    if (!arrayUtils.includes(keyholds, key)) {
      keyholds.push(key);
    }
  };

  function onKeyUp(e) {
    var key = keycode(e);
    keyups.push(key);
    arrayUtils.remove(keyholds, key);
  };

  function clear() {
    mousedowns = [];
    mouseups = [];
    mousemove = false;
    keydowns = [];
    keyups = [];
    mouseclicks = [];
  }

  element.addEventListener('mousedown', onMouseDown);
  element.addEventListener('mousemove', onMouseMove);
  element.addEventListener('mouseup', onMouseUp);
  element.addEventListener('keydown', onKeyDown);
  element.addEventListener('keyup', onKeyUp);

  return {
    mouse: mouse,

    mouseDown: function(button) {
      if (button === undefined) {
        return mousedowns.length > 0;
      }
      return arrayUtils.includes(mousedowns, button);
    },

    mouseUp: function(button) {
      if (button === undefined) {
        return mouseups.length > 0;
      }
      return arrayUtils.includes(mouseups, button);
    },

    mouseHold: function(button) {
      if (button === undefined) {
        return mouseholds.length > 0;
      }
      return arrayUtils.includes(mouseholds, button);
    },

    mouseClick: function(button) {
      if (button === undefined) {
        return mouseclicks.length > 0;
      }
      return arrayUtils.includes(mouseclicks, button);
    },

    keyDown: function(key) {
      if (key === undefined) {
        return keydowns.length > 0;
      }
      return arrayUtils.includes(keydowns, key);
    },

    keyUp: function(key) {
      if (key === undefined) {
        return keyups.length > 0;
      }
      return arrayUtils.includes(keyups, key);
    },

    keyHold: function(key) {
      if (key === undefined) {
        return keyholds.length > 0;
      }
      return arrayUtils.includes(keyholds, key);
    },

    mouseMove: function() {
      return mousemove;
    },

    lateTick: function() {
      clear();
    },

    screenToViewport: function(screen) {
      var viewport = new THREE.Vector2();
      viewport.x = (screen.x / window.innerWidth) * 2 - 1;
      viewport.y = -(screen.y / window.innerHeight) * 2 + 1;
      return viewport;
    }
  };
};
},{"../utils/arrayutils":57,"keycode":8}],56:[function(require,module,exports){
var Stats = require('stats.js');

module.exports = function(scene, camera, container) {
  var renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0x333333);
  renderer.setSize(window.innerWidth, window.innerHeight);

  container = container || document.body;
  container.appendChild(renderer.domElement);

  var renderer, camera;
  var ssaoPass, effectComposer;

  var system = {};
  system.renderer = renderer;

  var stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.right = '0px';
  stats.domElement.style.bottom = '0px';

  document.body.appendChild(stats.domElement);

  var ssao = true;

  var ambient = new THREE.AmbientLight(new THREE.Color("rgb(60%, 60%, 60%)"));
  var light = new THREE.DirectionalLight(0xffffff, 0.6);
  light.position.set(0.8, 1, 0.5);
  scene.add(light);
  scene.add(ambient);

  function render() {
    requestAnimationFrame(render);

    stats.begin();

    if (ssao) {
      // Render depth into depthRenderTarget
      scene.overrideMaterial = depthMaterial;
      renderer.render(scene, camera, depthRenderTarget, true);

      // Render renderPass and SSAO shaderPass
      scene.overrideMaterial = null;
      effectComposer.render();
    } else {
      renderer.render(scene, camera);
    }


    stats.end();
  };

  function onWindowResize() {
    var width = window.innerWidth;
    var height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    // Resize renderTargets
    ssaoPass.uniforms['size'].value.set(width, height);

    var pixelRatio = renderer.getPixelRatio();
    var newWidth = Math.floor(width / pixelRatio) || 1;
    var newHeight = Math.floor(height / pixelRatio) || 1;
    depthRenderTarget.setSize(newWidth, newHeight);
    effectComposer.setSize(newWidth, newHeight);
  }

  function initPostprocessing() {

    // Setup render pass
    var renderPass = new THREE.RenderPass(scene, camera);

    // Setup depth pass
    var depthShader = THREE.ShaderLib["depthRGBA"];
    var depthUniforms = THREE.UniformsUtils.clone(depthShader.uniforms);

    depthMaterial = new THREE.ShaderMaterial({
      fragmentShader: depthShader.fragmentShader,
      vertexShader: depthShader.vertexShader,
      uniforms: depthUniforms,
      blending: THREE.NoBlending
    });

    var pars = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter
    };
    depthRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, pars);

    // Setup SSAO pass
    ssaoPass = new THREE.ShaderPass(THREE.SSAOShader);
    ssaoPass.renderToScreen = true;
    //ssaoPass.uniforms[ "tDiffuse" ].value will be set by ShaderPass
    ssaoPass.uniforms["tDepth"].value = depthRenderTarget;
    ssaoPass.uniforms['size'].value.set(window.innerWidth, window.innerHeight);
    ssaoPass.uniforms['cameraNear'].value = camera.near;
    ssaoPass.uniforms['cameraFar'].value = camera.far;
    ssaoPass.uniforms['onlyAO'].value = false;
    ssaoPass.uniforms['aoClamp'].value = 1;
    ssaoPass.uniforms['lumInfluence'].value = 0.5;

    // Add pass to effect composer
    effectComposer = new THREE.EffectComposer(renderer);
    effectComposer.addPass(renderPass);
    effectComposer.addPass(ssaoPass);
  }

  // Set up render loop
  initPostprocessing();
  render();

  window.addEventListener('resize', onWindowResize, false);

  return system;
};
},{"stats.js":14}],57:[function(require,module,exports){
var array = {
  indexOf: function(array, element) {
    var predicate = typeof element === 'function' ? element : function(v) {
      return v === element;
    };

    for (var i = 0; i < array.length; i++) {
      if (predicate(array[i])) {
        return i;
      }
    }
    return -1;
  },

  includes: function(array, element) {
    return this.indexOf(array, element) !== -1;
  },

  remove: function(array, element) {
    var index = this.indexOf(array, element);
    if (index !== -1) {
      array.splice(index, 1);
    }
  },

  clone: function(array) {
    var copy = [];
    for (var i = 0; i < array.length; i++) {
      copy[i] = array[i];
    }
    return copy;
  }
};

module.exports = array;
},{}],58:[function(require,module,exports){
var Gravity = function(dir, axis, positive) {
  this.dir = dir || new THREE.Vector3();
  this.axis = axis || '';
  this.positive = positive || '';

  this.clone = function() {
    return new Gravity(this.dir, this.axis, this.positive);
  };

  this.equals = function(gravity) {
    return this.dir.equals(gravity.dir);
  };

  this.isNone = function() {
    return this.dir.length() === 0;
  };
};

module.exports = Gravity;
},{}],59:[function(require,module,exports){
var Gravity = require('./gravity');

var gravities = {
  none: new Gravity(),
  right: new Gravity(new THREE.Vector3(1, 0, 0).normalize(), 'x', true),
  left: new Gravity(new THREE.Vector3(-1, 0, 0).normalize(), 'x', false),
  top: new Gravity(new THREE.Vector3(0, 1, 0).normalize(), 'y', true),
  bottom: new Gravity(new THREE.Vector3(0, -1, 0).normalize(), 'y', false),
  front: new Gravity(new THREE.Vector3(0, 0, 1).normalize(), 'z', true),
  back: new Gravity(new THREE.Vector3(0, 0, -1).normalize(), 'z', false)
};

module.exports = {
  getGravity: function(position) {
    var min = 1;
    var closest = null;
    var force = new THREE.Vector3();
    for (var id in gravities) {
      var gravity = gravities[id];
      var dot = gravity.dir.clone().dot(position.clone().normalize());
      if (dot < min) {
        min = dot;
        closest = gravity;
      }

      if(dot < - 0.5) {
        var ratio = -0.5 - dot;
        force.add(gravity.dir.clone().multiplyScalar(ratio));
      }
    }

    var gravity = closest.clone();
    gravity.forceDir = force.normalize();
    return gravity;
  }
};
},{"./gravity":58}],60:[function(require,module,exports){
var compileMesher = require('greedy-mesher');
var ndarray = require('ndarray');

var mesher = compileMesher({
  extraArgs: 1,
  order: [0, 1],
  append: function(lo_x, lo_y, hi_x, hi_y, val, result) {
    result.push([
      [lo_x, lo_y],
      [hi_x, hi_y]
    ])
  }
});

module.exports = function(data, dim, voxelSideTextureIds) {
  voxelSideTextureIds = voxelSideTextureIds || {};

  var vertices = [];
  var surfaces = [];

  var u, v, dimsD, dimsU, dimsV, td0, td1, dv, flip;

  // Interate through dimensions
  for (var d = 0; d < 3; d++) {
    u = (d + 1) % 3;
    v = (d + 2) % 3;
    dimsD = dim[d];
    dimsU = dim[u];
    dimsV = dim[v];
    td0 = d * 2;
    td1 = d * 2 + 1;

    // Interate through Slices
    flip = false;
    for (var i = 0; i < dimsD; i++) {
      processSlice(i);
    }


    // Interate through Slices from other dir
    flip = true;
    for (var i = dimsD - 1; i >= 0; i--) {
      processSlice(i);
    }
  };

  function processSlice(i) {
    var slice = ndarray([], [dimsU, dimsV]);

    var s0 = 0;
    dv = flip ? i : i + 1;

    //Interate through uv
    for (var j = 0; j < dimsU; j++) {
      var s1 = 0;
      for (var k = 0; k < dimsV; k++) {
        var b = getVoxel(i, j, k, d);
        if (!b) {
          slice.set(j, k, 0);
          continue;
        }
        var b1;
        if (flip) {
          b1 = i === 0 ? 0 : getVoxel(i - 1, j, k, d);
        } else {
          b1 = i === dimsD - 1 ? 0 : getVoxel(i + 1, j, k, d);
        }
        if (!!b1) {
          slice.set(j, k, 0);
          continue;
        }
        var t = getTextureId(b, flip ? td0 : td1);
        slice.set(j, k, t);
        s1++;
      }
      s0++;
    }

    var result = [];
    mesher(slice, result);

    if (result.length === 0) {
      return;
    }

    for (var l = 0; l < result.length; l++) {
      var f = result[l];
      var lo = f[0];
      var hi = f[1];
      var sizeu = hi[0] - lo[0];
      var sizev = hi[1] - lo[1];

      var fuvs = [
        [0, 0],
        [sizeu, 0],
        [sizeu, sizev],
        [0, sizev]
      ];

      var c = slice.get(lo[0], lo[1]);

      var v0 = [];
      var v1 = [];
      var v2 = [];
      var v3 = [];

      v0[d] = dv;
      v0[u] = lo[0];
      v0[v] = lo[1];

      v1[d] = dv;
      v1[u] = hi[0];
      v1[v] = lo[1];

      v2[d] = dv;
      v2[u] = hi[0];
      v2[v] = hi[1];

      v3[d] = dv;
      v3[u] = lo[0];
      v3[v] = hi[1];

      var vindex = vertices.length;
      vertices.push(v0, v1, v2, v3);
      if (flip) {
        surfaces.push({
          face: [vindex + 3, vindex + 2, vindex + 1, vindex, c],
          uv: [fuvs[3], fuvs[2], fuvs[1], fuvs[0]]
        });
      } else {
        surfaces.push({
          face: [vindex, vindex + 1, vindex + 2, vindex + 3, c],
          uv: [fuvs[0], fuvs[1], fuvs[2], fuvs[3]]
        });
      }
    }
  }

  function getVoxel(i, j, k, d) {
    if (d === 0) {
      return data(i, j, k);
      // return data[k + (j + i * dim[0]) * dim[1]];
    } else if (d === 1) {
      return data(k, i, j);
      // return data[j + (i + k * dim[0]) * dim[1]];
    } else if (d === 2) {
      return data(j, k, i);
      // return data[i + (k + j * dim[0]) * dim[1]];
    }
  };

  function getTextureId(b, side) {
    if (!b) {
      return 0;
    }

    var map = voxelSideTextureIds[b];
    if (map == null) {
      return b;
    }

    console.log(side);
    // console.log(map[side] || b);
    return map[side] || b;
  };

  return {
    vertices: vertices,
    surfaces: surfaces
  }
};
},{"greedy-mesher":2,"ndarray":10}],61:[function(require,module,exports){
(function (global){
var THREE = (typeof window !== "undefined" ? window['THREE'] : typeof global !== "undefined" ? global['THREE'] : null);
var gravityUtils = require('./gravityutils');

module.exports = function() {
  "use strict";

  var map = {};
  var cog = new THREE.Vector3();
  var gravityAmount = 0.05;

  function onAttach(object, component) {
    if(component.type === 'rigidBody') {
      map[component._id] = component;
    }
  };

  function onDettach(object, component) {
    if(component.type === 'rigidBody') {
      delete map[component._id];
    }
  };

  function tick() {
    var bodies = [];
    var fixtures = [];
    for (var id in map) {
      var body = map[id];
      if (body.isFixture) {
        fixtures.push(body);
      } else {
        bodies.push(body);
      }
    }

    for (var i = 0; i < bodies.length; i++) {
      var rigidBody = bodies[i];

      // Apply gravity
      var gravity = gravityUtils.getGravity(rigidBody.object.position);
      rigidBody.gravity = gravity;

      if (rigidBody.grounded) {
        var gravityForce = gravity.dir.clone().setLength(gravityAmount);
        rigidBody.applyForce(gravityForce);
      } else {
        var gravityForce = gravity.forceDir.clone().setLength(gravityAmount);
        rigidBody.applyForce(gravityForce);
      }


      // Apply acceleration to velocity
      rigidBody.velocity.add(rigidBody.acceleration);
      rigidBody.velocity.multiplyScalar(rigidBody.friction);

      rigidBody.grounded = false;

      for (var j = 0; j < fixtures.length; j++) {
        var fixture = fixtures[j];

        var velocities = {
          'x': new THREE.Vector3(rigidBody.velocity.x, 0, 0),
          'y': new THREE.Vector3(0, rigidBody.velocity.y, 0),
          'z': new THREE.Vector3(0, 0, rigidBody.velocity.z)
        }

        var position = rigidBody.object.position.clone();
        for (var axis in velocities) {
          var v = velocities[axis];
          var raycaster = new THREE.Raycaster(
            position,
            v.clone().normalize(),
            0,
            v.length() + 0.5
          );

          var intersects = raycaster.intersectObject(fixture.object, true);
          if (intersects.length > 0) {
            var intersect = intersects[0];
            var mag = intersect.distance - 0.5;
            rigidBody.velocity[axis] = rigidBody.velocity[axis] > 0 ? mag : -mag;
            if (axis === gravity.axis) {
              rigidBody.grounded = true;
            }
          }

          position.add(v);
        }
      }

      // Apply velocity
      rigidBody.object.position.add(rigidBody.velocity);

      // Clear acceleration
      rigidBody.acceleration.set(0, 0, 0);
    }
  };

  var physics = {
    onAttach: onAttach,
    onDettach: onDettach,
    tick: tick,
    app: null
  };

  return physics;
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./gravityutils":59}],62:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
 *     on objects.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = (function () {
  function Bar () {}
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    arr.constructor = Bar
    return arr.foo() === 42 && // typed array instances can be augmented
        arr.constructor === Bar && // constructor can be set
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  this.length = 0
  this.parent = undefined

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (object.buffer instanceof ArrayBuffer) {
      return fromTypedArray(that, object)
    }
    if (object instanceof ArrayBuffer) {
      return fromArrayBuffer(that, object)
    }
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    array.byteLength
    that = Buffer._augment(new Uint8Array(array))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromTypedArray(that, new Uint8Array(array))
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` is deprecated
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` is deprecated
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = value
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = value
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = value
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

},{"base64-js":63,"ieee754":64,"is-array":65}],63:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],64:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],65:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}]},{},[50])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY2J1ZmZlci9jYnVmZmVyLmpzIiwibm9kZV9tb2R1bGVzL2dyZWVkeS1tZXNoZXIvZ3JlZWR5LmpzIiwibm9kZV9tb2R1bGVzL2dyZWVkeS1tZXNoZXIvbm9kZV9tb2R1bGVzL2lvdGEtYXJyYXkvaW90YS5qcyIsIm5vZGVfbW9kdWxlcy9ncmVlZHktbWVzaGVyL25vZGVfbW9kdWxlcy90eXBlZGFycmF5LXBvb2wvbm9kZV9tb2R1bGVzL2JpdC10d2lkZGxlL3R3aWRkbGUuanMiLCJub2RlX21vZHVsZXMvZ3JlZWR5LW1lc2hlci9ub2RlX21vZHVsZXMvdHlwZWRhcnJheS1wb29sL25vZGVfbW9kdWxlcy9kdXAvZHVwLmpzIiwibm9kZV9tb2R1bGVzL2dyZWVkeS1tZXNoZXIvbm9kZV9tb2R1bGVzL3R5cGVkYXJyYXktcG9vbC9wb29sLmpzIiwibm9kZV9tb2R1bGVzL2dyZWVkeS1tZXNoZXIvbm9kZV9tb2R1bGVzL3VuaXEvdW5pcS5qcyIsIm5vZGVfbW9kdWxlcy9rZXljb2RlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL21pbmltaXN0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL25kYXJyYXkvbmRhcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9uZGFycmF5L25vZGVfbW9kdWxlcy9pcy1idWZmZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcG9pbnQtaW4tcG9seWdvbi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zdGF0cy5qcy9zcmMvU3RhdHMuanMiLCJzcmMvYXNzZW1ibGllcy9hZWRpdG9yLmpzIiwic3JjL2Fzc2VtYmxpZXMvYWdyb3VuZC5qcyIsInNyYy9hc3NlbWJsaWVzL2FwbGF5ZXIuanMiLCJzcmMvY29tcG9uZW50cy9ibG9ja3MuanMiLCJzcmMvY29tcG9uZW50cy9jaGFyYWN0ZXIuanMiLCJzcmMvY29tcG9uZW50cy9wbGF5ZXJDYW1lcmEuanMiLCJzcmMvY29tcG9uZW50cy9wbGF5ZXJjb250cm9sLmpzIiwic3JjL2NvbXBvbmVudHMvcmlnaWRib2R5LmpzIiwic3JjL2NvcmUvYi5qcyIsInNyYy9jb3JlL2V2ZW50cy5qcyIsInNyYy9jcHIvY3ByLmpzIiwic3JjL2RhdGEvY29uZmlnLmpzb24iLCJzcmMvZGF0YS9wYWxldHRlLmpzb24iLCJzcmMvZWRpdG9yL2NvbW1hbmRzL2Jsb2NrY29tbWFuZC5qcyIsInNyYy9lZGl0b3IvY29tbWFuZHMvb2Zmc2V0Y29tbWFuZC5qcyIsInNyYy9lZGl0b3IvY29tbWFuZHMvc2VsZWN0Y29tbWFuZC5qcyIsInNyYy9lZGl0b3IvY29tbWFuZHMvc2V0Y29tbWFuZC5qcyIsInNyYy9lZGl0b3IvZHJhZ2NhbWVyYS5qcyIsInNyYy9lZGl0b3IvZWRpdG9yLmpzIiwic3JjL2VkaXRvci9lZGl0b3Jjb25zb2xlLmpzIiwic3JjL2VkaXRvci9lZGl0b3J0b29scy5qcyIsInNyYy9lZGl0b3IvZ3VpL2Fycm93YmFyLmpzIiwic3JjL2VkaXRvci9ndWkvY29sb3JiYXIuanMiLCJzcmMvZWRpdG9yL2d1aS9maWxlYmFyLmpzIiwic3JjL2VkaXRvci9ndWkvcG9wdXAuanMiLCJzcmMvZWRpdG9yL2d1aS9wcmVmYWJzYmFyLmpzIiwic3JjL2VkaXRvci9ndWkvcHJlZmFic3Rvb2xiYXIuanMiLCJzcmMvZWRpdG9yL2d1aS9wcm9wZXJ0eXBhbmVsLmpzIiwic3JjL2VkaXRvci9ndWkvdG9vbGJhci5qcyIsInNyYy9lZGl0b3IvcGFuZWwvcGFuZWwuanMiLCJzcmMvZWRpdG9yL3Rvb2xzL2NhbWVyYXRvb2wuanMiLCJzcmMvZWRpdG9yL3Rvb2xzL2ZpbGx0b29sLmpzIiwic3JjL2VkaXRvci90b29scy9wZW50b29sLmpzIiwic3JjL2VkaXRvci90b29scy9zYW1wbGV0b29sLmpzIiwic3JjL2VkaXRvci90b29scy9zZWxlY3R0b29sLmpzIiwic3JjL21haW4uanMiLCJzcmMvc2VydmljZXMvZGV2Y29uc29sZS5qcyIsInNyYy9zZXJ2aWNlcy9tYXRlcmlhbHMuanMiLCJzcmMvc2VydmljZXMvcHJlZmFic2VydmljZS5qcyIsInNyYy9zZXJ2aWNlcy9zdGF0cy5qcyIsInNyYy9zeXN0ZW1zL2lucHV0LmpzIiwic3JjL3N5c3RlbXMvcmVuZGVyZXIuanMiLCJzcmMvdXRpbHMvYXJyYXl1dGlscy5qcyIsInNyYy92b3hlbC9ncmF2aXR5LmpzIiwic3JjL3ZveGVsL2dyYXZpdHl1dGlscy5qcyIsInNyYy92b3hlbC9tZXNoZXIuanMiLCJzcmMvdm94ZWwvdm94ZWwuanMiLCIuLi8uLi8uLi8uLi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwiLi4vLi4vLi4vLi4vdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCIuLi8uLi8uLi8uLi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwiLi4vLi4vLi4vLi4vdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaXMtYXJyYXkvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDck1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNyTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN2VkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDcEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMvTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4UEE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDOW9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDN0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDMUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzcvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKSB7XG5cbmZ1bmN0aW9uIENCdWZmZXIoKSB7XG5cdC8vIGhhbmRsZSBjYXNlcyB3aGVyZSBcIm5ld1wiIGtleXdvcmQgd2Fzbid0IHVzZWRcblx0aWYgKCEodGhpcyBpbnN0YW5jZW9mIENCdWZmZXIpKSB7XG5cdFx0Ly8gbXVsdGlwbGUgY29uZGl0aW9ucyBuZWVkIHRvIGJlIGNoZWNrZWQgdG8gcHJvcGVybHkgZW11bGF0ZSBBcnJheVxuXHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSB8fCB0eXBlb2YgYXJndW1lbnRzWzBdICE9PSAnbnVtYmVyJykge1xuXHRcdFx0cmV0dXJuIENCdWZmZXIuYXBwbHkobmV3IENCdWZmZXIoYXJndW1lbnRzLmxlbmd0aCksIGFyZ3VtZW50cyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBuZXcgQ0J1ZmZlcihhcmd1bWVudHNbMF0pO1xuXHRcdH1cblx0fVxuXHQvLyBpZiBubyBhcmd1bWVudHMsIHRoZW4gbm90aGluZyBuZWVkcyB0byBiZSBzZXRcblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG5cdHRocm93IG5ldyBFcnJvcignTWlzc2luZyBBcmd1bWVudDogWW91IG11c3QgcGFzcyBhIHZhbGlkIGJ1ZmZlciBsZW5ndGgnKTtcblx0Ly8gdGhpcyBpcyB0aGUgc2FtZSBpbiBlaXRoZXIgc2NlbmFyaW9cblx0dGhpcy5zaXplID0gdGhpcy5zdGFydCA9IDA7XG5cdC8vIHNldCB0byBjYWxsYmFjayBmbiBpZiBkYXRhIGlzIGFib3V0IHRvIGJlIG92ZXJ3cml0dGVuXG5cdHRoaXMub3ZlcmZsb3cgPSBudWxsO1xuXHQvLyBlbXVsYXRlIEFycmF5IGJhc2VkIG9uIHBhc3NlZCBhcmd1bWVudHNcblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxIHx8IHR5cGVvZiBhcmd1bWVudHNbMF0gIT09ICdudW1iZXInKSB7XG5cdFx0dGhpcy5kYXRhID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGgpO1xuXHRcdHRoaXMuZW5kID0gKHRoaXMubGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aCkgLSAxO1xuXHRcdHRoaXMucHVzaC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHR9IGVsc2Uge1xuXHRcdHRoaXMuZGF0YSA9IG5ldyBBcnJheShhcmd1bWVudHNbMF0pO1xuXHRcdHRoaXMuZW5kID0gKHRoaXMubGVuZ3RoID0gYXJndW1lbnRzWzBdKSAtIDE7XG5cdH1cblx0Ly8gbmVlZCB0byBgcmV0dXJuIHRoaXNgIHNvIGByZXR1cm4gQ0J1ZmZlci5hcHBseWAgd29ya3Ncblx0cmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRDb21wYXJpdG9yKGEsIGIpIHtcblx0cmV0dXJuIGEgPT0gYiA/IDAgOiBhID4gYiA/IDEgOiAtMTtcbn1cblxuQ0J1ZmZlci5wcm90b3R5cGUgPSB7XG5cdC8vIHByb3Blcmx5IHNldCBjb25zdHJ1Y3RvclxuXHRjb25zdHJ1Y3RvciA6IENCdWZmZXIsXG5cblx0LyogbXV0YXRvciBtZXRob2RzICovXG5cdC8vIHBvcCBsYXN0IGl0ZW1cblx0cG9wIDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpdGVtO1xuXHRcdGlmICh0aGlzLnNpemUgPT09IDApIHJldHVybjtcblx0XHRpdGVtID0gdGhpcy5kYXRhW3RoaXMuZW5kXTtcblx0XHQvLyByZW1vdmUgdGhlIHJlZmVyZW5jZSB0byB0aGUgb2JqZWN0IHNvIGl0IGNhbiBiZSBnYXJiYWdlIGNvbGxlY3RlZFxuXHRcdGRlbGV0ZSB0aGlzLmRhdGFbdGhpcy5lbmRdO1xuXHRcdHRoaXMuZW5kID0gKHRoaXMuZW5kIC0gMSArIHRoaXMubGVuZ3RoKSAlIHRoaXMubGVuZ3RoO1xuXHRcdHRoaXMuc2l6ZS0tO1xuXHRcdHJldHVybiBpdGVtO1xuXHR9LFxuXHQvLyBwdXNoIGl0ZW0gdG8gdGhlIGVuZFxuXHRwdXNoIDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpID0gMDtcblx0XHQvLyBjaGVjayBpZiBvdmVyZmxvdyBpcyBzZXQsIGFuZCBpZiBkYXRhIGlzIGFib3V0IHRvIGJlIG92ZXJ3cml0dGVuXG5cdFx0aWYgKHRoaXMub3ZlcmZsb3cgJiYgdGhpcy5zaXplICsgYXJndW1lbnRzLmxlbmd0aCA+IHRoaXMubGVuZ3RoKSB7XG5cdFx0XHQvLyBjYWxsIG92ZXJmbG93IGZ1bmN0aW9uIGFuZCBzZW5kIGRhdGEgdGhhdCdzIGFib3V0IHRvIGJlIG92ZXJ3cml0dGVuXG5cdFx0XHRmb3IgKDsgaSA8IHRoaXMuc2l6ZSArIGFyZ3VtZW50cy5sZW5ndGggLSB0aGlzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHRoaXMub3ZlcmZsb3codGhpcy5kYXRhWyh0aGlzLmVuZCArIGkgKyAxKSAlIHRoaXMubGVuZ3RoXSwgdGhpcyk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vIHB1c2ggaXRlbXMgdG8gdGhlIGVuZCwgd3JhcHBpbmcgYW5kIGVyYXNpbmcgZXhpc3RpbmcgaXRlbXNcblx0XHQvLyB1c2luZyBhcmd1bWVudHMgdmFyaWFibGUgZGlyZWN0bHkgdG8gcmVkdWNlIGdjIGZvb3RwcmludFxuXHRcdGZvciAoaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHRoaXMuZGF0YVsodGhpcy5lbmQgKyBpICsgMSkgJSB0aGlzLmxlbmd0aF0gPSBhcmd1bWVudHNbaV07XG5cdFx0fVxuXHRcdC8vIHJlY2FsY3VsYXRlIHNpemVcblx0XHRpZiAodGhpcy5zaXplIDwgdGhpcy5sZW5ndGgpIHtcblx0XHRcdGlmICh0aGlzLnNpemUgKyBpID4gdGhpcy5sZW5ndGgpIHRoaXMuc2l6ZSA9IHRoaXMubGVuZ3RoO1xuXHRcdFx0ZWxzZSB0aGlzLnNpemUgKz0gaTtcblx0XHR9XG5cdFx0Ly8gcmVjYWxjdWxhdGUgZW5kXG5cdFx0dGhpcy5lbmQgPSAodGhpcy5lbmQgKyBpKSAlIHRoaXMubGVuZ3RoO1xuXHRcdC8vIHJlY2FsY3VsYXRlIHN0YXJ0XG5cdFx0dGhpcy5zdGFydCA9ICh0aGlzLmxlbmd0aCArIHRoaXMuZW5kIC0gdGhpcy5zaXplICsgMSkgJSB0aGlzLmxlbmd0aDtcblx0XHQvLyByZXR1cm4gbnVtYmVyIGN1cnJlbnQgbnVtYmVyIG9mIGl0ZW1zIGluIENCdWZmZXJcblx0XHRyZXR1cm4gdGhpcy5zaXplO1xuXHR9LFxuXHQvLyByZXZlcnNlIG9yZGVyIG9mIHRoZSBidWZmZXJcblx0cmV2ZXJzZSA6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgaSA9IDAsXG5cdFx0XHR0bXA7XG5cdFx0Zm9yICg7IGkgPCB+fih0aGlzLnNpemUgLyAyKTsgaSsrKSB7XG5cdFx0XHR0bXAgPSB0aGlzLmRhdGFbKHRoaXMuc3RhcnQgKyBpKSAlIHRoaXMubGVuZ3RoXTtcblx0XHRcdHRoaXMuZGF0YVsodGhpcy5zdGFydCArIGkpICUgdGhpcy5sZW5ndGhdID0gdGhpcy5kYXRhWyh0aGlzLnN0YXJ0ICsgKHRoaXMuc2l6ZSAtIGkgLSAxKSkgJSB0aGlzLmxlbmd0aF07XG5cdFx0XHR0aGlzLmRhdGFbKHRoaXMuc3RhcnQgKyAodGhpcy5zaXplIC0gaSAtIDEpKSAlIHRoaXMubGVuZ3RoXSA9IHRtcDtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdC8vIHJvdGF0ZSBidWZmZXIgdG8gdGhlIGxlZnQgYnkgY250ciwgb3IgYnkgMVxuXHRyb3RhdGVMZWZ0IDogZnVuY3Rpb24gKGNudHIpIHtcblx0XHRpZiAodHlwZW9mIGNudHIgPT09ICd1bmRlZmluZWQnKSBjbnRyID0gMTtcblx0XHRpZiAodHlwZW9mIGNudHIgIT09ICdudW1iZXInKSB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCBtdXN0IGJlIGEgbnVtYmVyXCIpO1xuXHRcdHdoaWxlICgtLWNudHIgPj0gMCkge1xuXHRcdFx0dGhpcy5wdXNoKHRoaXMuc2hpZnQoKSk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHQvLyByb3RhdGUgYnVmZmVyIHRvIHRoZSByaWdodCBieSBjbnRyLCBvciBieSAxXG5cdHJvdGF0ZVJpZ2h0IDogZnVuY3Rpb24gKGNudHIpIHtcblx0XHRpZiAodHlwZW9mIGNudHIgPT09ICd1bmRlZmluZWQnKSBjbnRyID0gMTtcblx0XHRpZiAodHlwZW9mIGNudHIgIT09ICdudW1iZXInKSB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCBtdXN0IGJlIGEgbnVtYmVyXCIpO1xuXHRcdHdoaWxlICgtLWNudHIgPj0gMCkge1xuXHRcdFx0dGhpcy51bnNoaWZ0KHRoaXMucG9wKCkpO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0Ly8gcmVtb3ZlIGFuZCByZXR1cm4gZmlyc3QgaXRlbVxuXHRzaGlmdCA6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgaXRlbTtcblx0XHQvLyBjaGVjayBpZiB0aGVyZSBhcmUgYW55IGl0ZW1zIGluIENCdWZmXG5cdFx0aWYgKHRoaXMuc2l6ZSA9PT0gMCkgcmV0dXJuO1xuXHRcdC8vIHN0b3JlIGZpcnN0IGl0ZW0gZm9yIHJldHVyblxuXHRcdGl0ZW0gPSB0aGlzLmRhdGFbdGhpcy5zdGFydF07XG5cdFx0Ly8gcmVjYWxjdWxhdGUgc3RhcnQgb2YgQ0J1ZmZlclxuXHRcdHRoaXMuc3RhcnQgPSAodGhpcy5zdGFydCArIDEpICUgdGhpcy5sZW5ndGg7XG5cdFx0Ly8gZGVjcmVtZW50IHNpemVcblx0XHR0aGlzLnNpemUtLTtcblx0XHRyZXR1cm4gaXRlbTtcblx0fSxcblx0Ly8gc29ydCBpdGVtc1xuXHRzb3J0IDogZnVuY3Rpb24gKGZuKSB7XG5cdFx0dGhpcy5kYXRhLnNvcnQoZm4gfHwgZGVmYXVsdENvbXBhcml0b3IpO1xuXHRcdHRoaXMuc3RhcnQgPSAwO1xuXHRcdHRoaXMuZW5kID0gdGhpcy5zaXplIC0gMTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0Ly8gYWRkIGl0ZW0gdG8gYmVnaW5uaW5nIG9mIGJ1ZmZlclxuXHR1bnNoaWZ0IDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpID0gMDtcblx0XHQvLyBjaGVjayBpZiBvdmVyZmxvdyBpcyBzZXQsIGFuZCBpZiBkYXRhIGlzIGFib3V0IHRvIGJlIG92ZXJ3cml0dGVuXG5cdFx0aWYgKHRoaXMub3ZlcmZsb3cgJiYgdGhpcy5zaXplICsgYXJndW1lbnRzLmxlbmd0aCA+IHRoaXMubGVuZ3RoKSB7XG5cdFx0XHQvLyBjYWxsIG92ZXJmbG93IGZ1bmN0aW9uIGFuZCBzZW5kIGRhdGEgdGhhdCdzIGFib3V0IHRvIGJlIG92ZXJ3cml0dGVuXG5cdFx0XHRmb3IgKDsgaSA8IHRoaXMuc2l6ZSArIGFyZ3VtZW50cy5sZW5ndGggLSB0aGlzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHRoaXMub3ZlcmZsb3codGhpcy5kYXRhW3RoaXMuZW5kIC0gKGkgJSB0aGlzLmxlbmd0aCldLCB0aGlzKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0Zm9yIChpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dGhpcy5kYXRhWyh0aGlzLmxlbmd0aCArIHRoaXMuc3RhcnQgLSAoaSAlIHRoaXMubGVuZ3RoKSAtIDEpICUgdGhpcy5sZW5ndGhdID0gYXJndW1lbnRzW2ldO1xuXHRcdH1cblx0XHRpZiAodGhpcy5sZW5ndGggLSB0aGlzLnNpemUgLSBpIDwgMCkge1xuXHRcdFx0dGhpcy5lbmQgKz0gdGhpcy5sZW5ndGggLSB0aGlzLnNpemUgLSBpO1xuXHRcdFx0aWYgKHRoaXMuZW5kIDwgMCkgdGhpcy5lbmQgPSB0aGlzLmxlbmd0aCArICh0aGlzLmVuZCAlIHRoaXMubGVuZ3RoKTtcblx0XHR9XG5cdFx0aWYgKHRoaXMuc2l6ZSA8IHRoaXMubGVuZ3RoKSB7XG5cdFx0XHRpZiAodGhpcy5zaXplICsgaSA+IHRoaXMubGVuZ3RoKSB0aGlzLnNpemUgPSB0aGlzLmxlbmd0aDtcblx0XHRcdGVsc2UgdGhpcy5zaXplICs9IGk7XG5cdFx0fVxuXHRcdHRoaXMuc3RhcnQgLT0gYXJndW1lbnRzLmxlbmd0aDtcblx0XHRpZiAodGhpcy5zdGFydCA8IDApIHRoaXMuc3RhcnQgPSB0aGlzLmxlbmd0aCArICh0aGlzLnN0YXJ0ICUgdGhpcy5sZW5ndGgpO1xuXHRcdHJldHVybiB0aGlzLnNpemU7XG5cdH0sXG5cblx0LyogYWNjZXNzb3IgbWV0aG9kcyAqL1xuXHQvLyByZXR1cm4gaW5kZXggb2YgZmlyc3QgbWF0Y2hlZCBlbGVtZW50XG5cdGluZGV4T2YgOiBmdW5jdGlvbiAoYXJnLCBpZHgpIHtcblx0XHRpZiAoIWlkeCkgaWR4ID0gMDtcblx0XHRmb3IgKDsgaWR4IDwgdGhpcy5zaXplOyBpZHgrKykge1xuXHRcdFx0aWYgKHRoaXMuZGF0YVsodGhpcy5zdGFydCArIGlkeCkgJSB0aGlzLmxlbmd0aF0gPT09IGFyZykgcmV0dXJuIGlkeDtcblx0XHR9XG5cdFx0cmV0dXJuIC0xO1xuXHR9LFxuXHQvLyByZXR1cm4gbGFzdCBpbmRleCBvZiB0aGUgZmlyc3QgbWF0Y2hcblx0bGFzdEluZGV4T2YgOiBmdW5jdGlvbiAoYXJnLCBpZHgpIHtcblx0XHRpZiAoIWlkeCkgaWR4ID0gdGhpcy5zaXplIC0gMTtcblx0XHRmb3IgKDsgaWR4ID49IDA7IGlkeC0tKSB7XG5cdFx0XHRpZiAodGhpcy5kYXRhWyh0aGlzLnN0YXJ0ICsgaWR4KSAlIHRoaXMubGVuZ3RoXSA9PT0gYXJnKSByZXR1cm4gaWR4O1xuXHRcdH1cblx0XHRyZXR1cm4gLTE7XG5cdH0sXG5cblx0Ly8gcmV0dXJuIHRoZSBpbmRleCBhbiBpdGVtIHdvdWxkIGJlIGluc2VydGVkIHRvIGlmIHRoaXNcblx0Ly8gaXMgYSBzb3J0ZWQgY2lyY3VsYXIgYnVmZmVyXG5cdHNvcnRlZEluZGV4IDogZnVuY3Rpb24odmFsdWUsIGNvbXBhcml0b3IsIGNvbnRleHQpIHtcblx0XHRjb21wYXJpdG9yID0gY29tcGFyaXRvciB8fCBkZWZhdWx0Q29tcGFyaXRvcjtcblx0XHR2YXIgbG93ID0gdGhpcy5zdGFydCxcblx0XHRcdGhpZ2ggPSB0aGlzLnNpemUgLSAxO1xuXG5cdFx0Ly8gVHJpY2t5IHBhcnQgaXMgZmluZGluZyBpZiBpdHMgYmVmb3JlIG9yIGFmdGVyIHRoZSBwaXZvdFxuXHRcdC8vIHdlIGNhbiBnZXQgdGhpcyBpbmZvIGJ5IGNoZWNraW5nIGlmIHRoZSB0YXJnZXQgaXMgbGVzcyB0aGFuXG5cdFx0Ly8gdGhlIGxhc3QgaXRlbS4gQWZ0ZXIgdGhhdCBpdCdzIGp1c3QgYSB0eXBpY2FsIGJpbmFyeSBzZWFyY2guXG5cdFx0aWYgKGxvdyAmJiBjb21wYXJpdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIHRoaXMuZGF0YVtoaWdoXSkgPiAwKSB7XG5cdFx0XHRsb3cgPSAwLCBoaWdoID0gdGhpcy5lbmQ7XG5cdFx0fVxuXG5cdFx0d2hpbGUgKGxvdyA8IGhpZ2gpIHtcblx0XHQgIHZhciBtaWQgPSAobG93ICsgaGlnaCkgPj4+IDE7XG5cdFx0ICBpZiAoY29tcGFyaXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCB0aGlzLmRhdGFbbWlkXSkgPiAwKSBsb3cgPSBtaWQgKyAxO1xuXHRcdCAgZWxzZSBoaWdoID0gbWlkO1xuXHRcdH1cblx0XHQvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xODYxODI3My8xNTE3OTE5XG5cdFx0cmV0dXJuICgoKGxvdyAtIHRoaXMuc3RhcnQpICUgdGhpcy5zaXplKSArIHRoaXMuc2l6ZSkgJSB0aGlzLnNpemU7XG5cdH0sXG5cblx0LyogaXRlcmF0aW9uIG1ldGhvZHMgKi9cblx0Ly8gY2hlY2sgZXZlcnkgaXRlbSBpbiB0aGUgYXJyYXkgYWdhaW5zdCBhIHRlc3Rcblx0ZXZlcnkgOiBmdW5jdGlvbiAoY2FsbGJhY2ssIGNvbnRleHQpIHtcblx0XHR2YXIgaSA9IDA7XG5cdFx0Zm9yICg7IGkgPCB0aGlzLnNpemU7IGkrKykge1xuXHRcdFx0aWYgKCFjYWxsYmFjay5jYWxsKGNvbnRleHQsIHRoaXMuZGF0YVsodGhpcy5zdGFydCArIGkpICUgdGhpcy5sZW5ndGhdLCBpLCB0aGlzKSlcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSxcblx0Ly8gbG9vcCB0aHJvdWdoIGVhY2ggaXRlbSBpbiBidWZmZXJcblx0Ly8gVE9ETzogZmlndXJlIG91dCBob3cgdG8gZW11bGF0ZSBBcnJheSB1c2UgYmV0dGVyXG5cdGZvckVhY2ggOiBmdW5jdGlvbiAoY2FsbGJhY2ssIGNvbnRleHQpIHtcblx0XHR2YXIgaSA9IDA7XG5cdFx0Zm9yICg7IGkgPCB0aGlzLnNpemU7IGkrKykge1xuXHRcdFx0Y2FsbGJhY2suY2FsbChjb250ZXh0LCB0aGlzLmRhdGFbKHRoaXMuc3RhcnQgKyBpKSAlIHRoaXMubGVuZ3RoXSwgaSwgdGhpcyk7XG5cdFx0fVxuXHR9LFxuXHQvLyBjaGVjayBpdGVtcyBhZ2FpbnMgdGVzdCB1bnRpbCBvbmUgcmV0dXJucyB0cnVlXG5cdC8vIFRPRE86IGZpZ3VyZSBvdXQgaG93IHRvIGVtdWxkYXRlIEFycmF5IHVzZSBiZXR0ZXJcblx0c29tZSA6IGZ1bmN0aW9uIChjYWxsYmFjaywgY29udGV4dCkge1xuXHRcdHZhciBpID0gMDtcblx0XHRmb3IgKDsgaSA8IHRoaXMuc2l6ZTsgaSsrKSB7XG5cdFx0XHRpZiAoY2FsbGJhY2suY2FsbChjb250ZXh0LCB0aGlzLmRhdGFbKHRoaXMuc3RhcnQgKyBpKSAlIHRoaXMubGVuZ3RoXSwgaSwgdGhpcykpXG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0sXG5cdC8vIGNhbGN1bGF0ZSB0aGUgYXZlcmFnZSB2YWx1ZSBvZiBhIGNpcmN1bGFyIGJ1ZmZlclxuXHRhdmcgOiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuc2l6ZSA9PSAwID8gMCA6ICh0aGlzLnN1bSgpIC8gdGhpcy5zaXplKTtcblx0fSxcblx0Ly8gbG9vcCB0aHJvdWdoIGVhY2ggaXRlbSBpbiBidWZmZXIgYW5kIGNhbGN1bGF0ZSBzdW1cblx0c3VtIDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpbmRleCA9IHRoaXMuc2l6ZTtcblx0XHR2YXIgcyA9IDA7XG5cdFx0d2hpbGUgKGluZGV4LS0pIHMgKz0gdGhpcy5kYXRhW2luZGV4XTtcblx0XHRyZXR1cm4gcztcblx0fSxcblx0Ly8gbG9vcCB0aHJvdWdoIGVhY2ggaXRlbSBpbiBidWZmZXIgYW5kIGNhbGN1bGF0ZSBtZWRpYW5cblx0bWVkaWFuIDogZnVuY3Rpb24gKCkge1xuXHRcdGlmICh0aGlzLnNpemUgPT09IDApXG5cdFx0XHRyZXR1cm4gMDtcblx0XHR2YXIgdmFsdWVzID0gdGhpcy5zbGljZSgpLnNvcnQoZGVmYXVsdENvbXBhcml0b3IpO1xuXHRcdHZhciBoYWxmID0gTWF0aC5mbG9vcih2YWx1ZXMubGVuZ3RoIC8gMik7XG5cdFx0aWYodmFsdWVzLmxlbmd0aCAlIDIpXG5cdFx0XHRyZXR1cm4gdmFsdWVzW2hhbGZdO1xuXHRcdGVsc2Vcblx0XHRcdHJldHVybiAodmFsdWVzW2hhbGYtMV0gKyB2YWx1ZXNbaGFsZl0pIC8gMi4wO1xuXHR9LFxuXHQvKiB1dGlsaXR5IG1ldGhvZHMgKi9cblx0Ly8gcmVzZXQgcG9pbnRlcnMgdG8gYnVmZmVyIHdpdGggemVybyBpdGVtc1xuXHQvLyBub3RlOiB0aGlzIHdpbGwgbm90IHJlbW92ZSB2YWx1ZXMgaW4gY2J1ZmZlciwgc28gaWYgZm9yIHNlY3VyaXR5IHZhbHVlc1xuXHQvLyAgICAgICBuZWVkIHRvIGJlIG92ZXJ3cml0dGVuLCBydW4gYC5maWxsKG51bGwpLmVtcHR5KClgXG5cdGVtcHR5IDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpID0gMDtcblx0XHR0aGlzLnNpemUgPSB0aGlzLnN0YXJ0ID0gMDtcblx0XHR0aGlzLmVuZCA9IHRoaXMubGVuZ3RoIC0gMTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0Ly8gZmlsbCBhbGwgcGxhY2VzIHdpdGggcGFzc2VkIHZhbHVlIG9yIGZ1bmN0aW9uXG5cdGZpbGwgOiBmdW5jdGlvbiAoYXJnKSB7XG5cdFx0dmFyIGkgPSAwO1xuXHRcdGlmICh0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHR3aGlsZSh0aGlzLmRhdGFbaV0gPSBhcmcoKSwgKytpIDwgdGhpcy5sZW5ndGgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR3aGlsZSh0aGlzLmRhdGFbaV0gPSBhcmcsICsraSA8IHRoaXMubGVuZ3RoKTtcblx0XHR9XG5cdFx0Ly8gcmVwb3NpdGlvbiBzdGFydC9lbmRcblx0XHR0aGlzLnN0YXJ0ID0gMDtcblx0XHR0aGlzLmVuZCA9IHRoaXMubGVuZ3RoIC0gMTtcblx0XHR0aGlzLnNpemUgPSB0aGlzLmxlbmd0aDtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0Ly8gcmV0dXJuIGZpcnN0IGl0ZW0gaW4gYnVmZmVyXG5cdGZpcnN0IDogZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLmRhdGFbdGhpcy5zdGFydF07XG5cdH0sXG5cdC8vIHJldHVybiBsYXN0IGl0ZW0gaW4gYnVmZmVyXG5cdGxhc3QgOiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuZGF0YVt0aGlzLmVuZF07XG5cdH0sXG5cdC8vIHJldHVybiBzcGVjaWZpYyBpbmRleCBpbiBidWZmZXJcblx0Z2V0IDogZnVuY3Rpb24gKGFyZykge1xuXHRcdHJldHVybiB0aGlzLmRhdGFbKHRoaXMuc3RhcnQgKyBhcmcpICUgdGhpcy5sZW5ndGhdO1xuXHR9LFxuXHRpc0Z1bGwgOiBmdW5jdGlvbiAoYXJnKSB7XG5cdFx0cmV0dXJuIHRoaXMubGVuZ3RoID09PSB0aGlzLnNpemU7XG5cdH0sXG5cdC8vIHNldCB2YWx1ZSBhdCBzcGVjaWZpZWQgaW5kZXhcblx0c2V0IDogZnVuY3Rpb24gKGlkeCwgYXJnKSB7XG5cdFx0cmV0dXJuIHRoaXMuZGF0YVsodGhpcy5zdGFydCArIGlkeCkgJSB0aGlzLmxlbmd0aF0gPSBhcmc7XG5cdH0sXG5cdC8vIHJldHVybiBjbGVhbiBhcnJheSBvZiB2YWx1ZXNcblx0dG9BcnJheSA6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpcy5zbGljZSgpO1xuXHR9LFxuXHQvLyBzbGljZSB0aGUgYnVmZmVyIHRvIGFuIGFycmFheVxuXHRzbGljZSA6IGZ1bmN0aW9uIChzdGFydCwgZW5kKSB7XG5cdFx0dmFyIGxlbmd0aCA9IHRoaXMuc2l6ZTtcblxuXHRcdHN0YXJ0ID0gK3N0YXJ0IHx8IDA7XG5cblx0XHRpZiAoc3RhcnQgPCAwKSB7XG5cdFx0XHRpZiAoc3RhcnQgPj0gZW5kKVxuXHRcdFx0XHRyZXR1cm4gW107XG5cdFx0XHRzdGFydCA9ICgtc3RhcnQgPiBsZW5ndGgpID8gMCA6IGxlbmd0aCArIHN0YXJ0O1xuXHRcdH1cblxuXHRcdGlmIChlbmQgPT0gbnVsbCB8fCBlbmQgPiBsZW5ndGgpXG5cdFx0XHRlbmQgPSBsZW5ndGg7XG5cdFx0ZWxzZSBpZiAoZW5kIDwgMClcblx0XHRcdGVuZCArPSBsZW5ndGg7XG5cdFx0ZWxzZVxuXHRcdFx0ZW5kID0gK2VuZCB8fCAwO1xuXG5cdFx0bGVuZ3RoID0gc3RhcnQgPCBlbmQgPyBlbmQgLSBzdGFydCA6IDA7XG5cblx0XHR2YXIgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKTtcblx0XHRmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG5cdFx0XHRyZXN1bHRbaW5kZXhdID0gdGhpcy5kYXRhWyh0aGlzLnN0YXJ0ICsgc3RhcnQgKyBpbmRleCkgJSB0aGlzLmxlbmd0aF07XG5cdFx0fVxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH1cbn07XG5cbmlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykgbW9kdWxlLmV4cG9ydHMgPSBDQnVmZmVyO1xuZWxzZSBnbG9iYWwuQ0J1ZmZlciA9IENCdWZmZXI7XG5cbn0odGhpcykpO1xuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIHBvb2wgPSByZXF1aXJlKFwidHlwZWRhcnJheS1wb29sXCIpXG52YXIgdW5pcSA9IHJlcXVpcmUoXCJ1bmlxXCIpXG52YXIgaW90YSA9IHJlcXVpcmUoXCJpb3RhLWFycmF5XCIpXG5cbmZ1bmN0aW9uIGdlbmVyYXRlTWVzaGVyKG9yZGVyLCBza2lwLCBtZXJnZSwgYXBwZW5kLCBudW1fb3B0aW9ucywgb3B0aW9ucywgdXNlR2V0dGVyKSB7XG4gIHZhciBjb2RlID0gW11cbiAgdmFyIGQgPSBvcmRlci5sZW5ndGhcbiAgdmFyIGksIGosIGtcbiAgXG4gIC8vQnVpbGQgYXJndW1lbnRzIGZvciBhcHBlbmQgbWFjcm9cbiAgdmFyIGFwcGVuZF9hcmdzID0gbmV3IEFycmF5KDIqZCsxK251bV9vcHRpb25zKVxuICBmb3IoaT0wOyBpPGQ7ICsraSkge1xuICAgIGFwcGVuZF9hcmdzW2ldID0gXCJpXCIraVxuICB9XG4gIGZvcihpPTA7IGk8ZDsgKytpKSB7XG4gICAgYXBwZW5kX2FyZ3NbaStkXSA9IFwialwiK2lcbiAgfVxuICBhcHBlbmRfYXJnc1syKmRdID0gXCJvdmFsXCJcbiAgXG4gIHZhciBvcHRfYXJncyA9IG5ldyBBcnJheShudW1fb3B0aW9ucylcbiAgZm9yKGk9MDsgaTxudW1fb3B0aW9uczsgKytpKSB7XG4gICAgb3B0X2FyZ3NbaV0gPSBcIm9wdFwiK2lcbiAgICBhcHBlbmRfYXJnc1syKmQrMStpXSA9IFwib3B0XCIraVxuICB9XG5cbiAgLy9VbnBhY2sgc3RyaWRlIGFuZCBzaGFwZSBhcnJheXMgaW50byB2YXJpYWJsZXNcbiAgY29kZS5wdXNoKFwidmFyIGRhdGE9YXJyYXkuZGF0YSxvZmZzZXQ9YXJyYXkub2Zmc2V0LHNoYXBlPWFycmF5LnNoYXBlLHN0cmlkZT1hcnJheS5zdHJpZGVcIilcbiAgZm9yKHZhciBpPTA7IGk8ZDsgKytpKSB7XG4gICAgY29kZS5wdXNoKFtcInZhciBzdHJpZGVcIixpLFwiPXN0cmlkZVtcIixvcmRlcltpXSxcIl18MCxzaGFwZVwiLGksXCI9c2hhcGVbXCIsb3JkZXJbaV0sXCJdfDBcIl0uam9pbihcIlwiKSlcbiAgICBpZihpID4gMCkge1xuICAgICAgY29kZS5wdXNoKFtcInZhciBhc3RlcFwiLGksXCI9KHN0cmlkZVwiLGksXCItc3RyaWRlXCIsaS0xLFwiKnNoYXBlXCIsaS0xLFwiKXwwXCJdLmpvaW4oXCJcIikpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZGUucHVzaChbXCJ2YXIgYXN0ZXBcIixpLFwiPXN0cmlkZVwiLGksXCJ8MFwiXS5qb2luKFwiXCIpKVxuICAgIH1cbiAgICBpZihpID4gMCkge1xuICAgICAgY29kZS5wdXNoKFtcInZhciB2c3RlcFwiLGksXCI9KHZzdGVwXCIsaS0xLFwiKnNoYXBlXCIsaS0xLFwiKXwwXCJdLmpvaW4oXCJcIikpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZGUucHVzaChbXCJ2YXIgdnN0ZXBcIixpLFwiPTFcIl0uam9pbihcIlwiKSlcbiAgICB9XG4gICAgY29kZS5wdXNoKFtcInZhciBpXCIsaSxcIj0wLGpcIixpLFwiPTAsa1wiLGksXCI9MCx1c3RlcFwiLGksXCI9dnN0ZXBcIixpLFwifDAsYnN0ZXBcIixpLFwiPWFzdGVwXCIsaSxcInwwXCJdLmpvaW4oXCJcIikpXG4gIH1cbiAgXG4gIC8vSW5pdGlhbGl6ZSBwb2ludGVyc1xuICBjb2RlLnB1c2goXCJ2YXIgYV9wdHI9b2Zmc2V0Pj4+MCxiX3B0cj0wLHVfcHRyPTAsdl9wdHI9MCxpPTAsZD0wLHZhbD0wLG92YWw9MFwiKVxuICBcbiAgLy9Jbml0aWFsaXplIGNvdW50XG4gIGNvZGUucHVzaChcInZhciBjb3VudD1cIiArIGlvdGEoZCkubWFwKGZ1bmN0aW9uKGkpIHsgcmV0dXJuIFwic2hhcGVcIitpfSkuam9pbihcIipcIikpXG4gIGNvZGUucHVzaChcInZhciB2aXNpdGVkPW1hbGxvY1VpbnQ4KGNvdW50KVwiKVxuICBcbiAgLy9aZXJvIG91dCB2aXNpdGVkIG1hcFxuICBjb2RlLnB1c2goXCJmb3IoO2k8Y291bnQ7KytpKXt2aXNpdGVkW2ldPTB9XCIpXG4gIFxuICAvL0JlZ2luIHRyYXZlcnNhbFxuICBmb3IoaT1kLTE7IGk+PTA7IC0taSkge1xuICAgIGNvZGUucHVzaChbXCJmb3IoaVwiLGksXCI9MDtpXCIsaSxcIjxzaGFwZVwiLGksXCI7KytpXCIsaSxcIil7XCJdLmpvaW4oXCJcIikpXG4gIH1cbiAgY29kZS5wdXNoKFwiaWYoIXZpc2l0ZWRbdl9wdHJdKXtcIilcbiAgXG4gICAgaWYodXNlR2V0dGVyKSB7XG4gICAgICBjb2RlLnB1c2goXCJ2YWw9ZGF0YS5nZXQoYV9wdHIpXCIpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZGUucHVzaChcInZhbD1kYXRhW2FfcHRyXVwiKVxuICAgIH1cbiAgXG4gICAgaWYoc2tpcCkge1xuICAgICAgY29kZS5wdXNoKFwiaWYoIXNraXAodmFsKSl7XCIpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZGUucHVzaChcImlmKHZhbCE9PTApe1wiKVxuICAgIH1cbiAgXG4gICAgICAvL1NhdmUgdmFsIHRvIG92YWxcbiAgICAgIGNvZGUucHVzaChcIm92YWwgPSB2YWxcIilcbiAgXG4gICAgICAvL0dlbmVyYXRlIG1lcmdpbmcgY29kZVxuICAgICAgZm9yKGk9MDsgaTxkOyArK2kpIHtcbiAgICAgICAgY29kZS5wdXNoKFwidV9wdHI9dl9wdHIrdnN0ZXBcIitpKVxuICAgICAgICBjb2RlLnB1c2goXCJiX3B0cj1hX3B0citzdHJpZGVcIitpKVxuICAgICAgICBjb2RlLnB1c2goW1wialwiLGksXCJfbG9vcDogZm9yKGpcIixpLFwiPTEraVwiLGksXCI7alwiLGksXCI8c2hhcGVcIixpLFwiOysralwiLGksXCIpe1wiXS5qb2luKFwiXCIpKVxuICAgICAgICBmb3Ioaj1pLTE7IGo+PTA7IC0taikge1xuICAgICAgICAgIGNvZGUucHVzaChbXCJmb3Ioa1wiLGosXCI9aVwiLGosXCI7a1wiLGosXCI8alwiLGosXCI7KytrXCIsaixcIil7XCJdLmpvaW4oXCJcIikpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgICAgLy9DaGVjayBpZiB3ZSBjYW4gbWVyZ2UgdGhpcyB2b3hlbFxuICAgICAgICAgIGNvZGUucHVzaChcImlmKHZpc2l0ZWRbdV9wdHJdKSB7IGJyZWFrIGpcIitpK1wiX2xvb3A7IH1cIilcbiAgICAgICAgXG4gICAgICAgICAgaWYodXNlR2V0dGVyKSB7XG4gICAgICAgICAgICBjb2RlLnB1c2goXCJ2YWw9ZGF0YS5nZXQoYl9wdHIpXCIpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvZGUucHVzaChcInZhbD1kYXRhW2JfcHRyXVwiKVxuICAgICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgICAgaWYoc2tpcCAmJiBtZXJnZSkge1xuICAgICAgICAgICAgY29kZS5wdXNoKFwiaWYoc2tpcCh2YWwpIHx8ICFtZXJnZShvdmFsLHZhbCkpeyBicmVhayBqXCIraStcIl9sb29wOyB9XCIpXG4gICAgICAgICAgfSBlbHNlIGlmKHNraXApIHtcbiAgICAgICAgICAgIGNvZGUucHVzaChcImlmKHNraXAodmFsKSB8fCB2YWwgIT09IG92YWwpeyBicmVhayBqXCIraStcIl9sb29wOyB9XCIpXG4gICAgICAgICAgfSBlbHNlIGlmKG1lcmdlKSB7XG4gICAgICAgICAgICBjb2RlLnB1c2goXCJpZih2YWwgPT09IDAgfHwgIW1lcmdlKG92YWwsdmFsKSl7IGJyZWFrIGpcIitpK1wiX2xvb3A7IH1cIilcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29kZS5wdXNoKFwiaWYodmFsID09PSAwIHx8IHZhbCAhPT0gb3ZhbCl7IGJyZWFrIGpcIitpK1wiX2xvb3A7IH1cIilcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy9DbG9zZSBvZmYgbG9vcCBib2RpZXNcbiAgICAgICAgICBjb2RlLnB1c2goXCIrK3VfcHRyXCIpXG4gICAgICAgICAgY29kZS5wdXNoKFwiYl9wdHIrPXN0cmlkZTBcIilcbiAgICAgICAgY29kZS5wdXNoKFwifVwiKVxuICAgICAgICBcbiAgICAgICAgZm9yKGo9MTsgajw9aTsgKytqKSB7XG4gICAgICAgICAgY29kZS5wdXNoKFwidV9wdHIrPXVzdGVwXCIrailcbiAgICAgICAgICBjb2RlLnB1c2goXCJiX3B0cis9YnN0ZXBcIitqKVxuICAgICAgICAgIGNvZGUucHVzaChcIn1cIilcbiAgICAgICAgfVxuICAgICAgICBpZihpIDwgZC0xKSB7XG4gICAgICAgICAgY29kZS5wdXNoKFwiZD1qXCIraStcIi1pXCIraSlcbiAgICAgICAgICBjb2RlLnB1c2goW1widXN0ZXBcIixpKzEsXCI9KHZzdGVwXCIsaSsxLFwiLXZzdGVwXCIsaSxcIipkKXwwXCJdLmpvaW4oXCJcIikpXG4gICAgICAgICAgY29kZS5wdXNoKFtcImJzdGVwXCIsaSsxLFwiPShzdHJpZGVcIixpKzEsXCItc3RyaWRlXCIsaSxcIipkKXwwXCJdLmpvaW4oXCJcIikpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgXG4gICAgICAvL01hcmsgb2ZmIHZpc2l0ZWQgdGFibGVcbiAgICAgIGNvZGUucHVzaChcInVfcHRyPXZfcHRyXCIpXG4gICAgICBmb3IoaT1kLTE7IGk+PTA7IC0taSkge1xuICAgICAgICBjb2RlLnB1c2goW1wiZm9yKGtcIixpLFwiPWlcIixpLFwiO2tcIixpLFwiPGpcIixpLFwiOysra1wiLGksXCIpe1wiXS5qb2luKFwiXCIpKVxuICAgICAgfVxuICAgICAgY29kZS5wdXNoKFwidmlzaXRlZFt1X3B0cisrXT0xXCIpXG4gICAgICBjb2RlLnB1c2goXCJ9XCIpXG4gICAgICBmb3IoaT0xOyBpPGQ7ICsraSkge1xuICAgICAgICBjb2RlLnB1c2goXCJ1X3B0cis9dXN0ZXBcIitpKVxuICAgICAgICBjb2RlLnB1c2goXCJ9XCIpXG4gICAgICB9XG4gIFxuICAgICAgLy9BcHBlbmQgY2h1bmsgdG8gbWVzaFxuICAgICAgY29kZS5wdXNoKFwiYXBwZW5kKFwiKyBhcHBlbmRfYXJncy5qb2luKFwiLFwiKSsgXCIpXCIpXG4gICAgXG4gICAgY29kZS5wdXNoKFwifVwiKVxuICBjb2RlLnB1c2goXCJ9XCIpXG4gIGNvZGUucHVzaChcIisrdl9wdHJcIilcbiAgZm9yKHZhciBpPTA7IGk8ZDsgKytpKSB7XG4gICAgY29kZS5wdXNoKFwiYV9wdHIrPWFzdGVwXCIraSlcbiAgICBjb2RlLnB1c2goXCJ9XCIpXG4gIH1cbiAgXG4gIGNvZGUucHVzaChcImZyZWVVaW50OCh2aXNpdGVkKVwiKVxuICBcbiAgaWYob3B0aW9ucy5kZWJ1Zykge1xuICAgIGNvbnNvbGUubG9nKFwiR0VORVJBVElORyBNRVNIRVI6XCIpXG4gICAgY29uc29sZS5sb2coY29kZS5qb2luKFwiXFxuXCIpKVxuICB9XG4gIFxuICAvL0NvbXBpbGUgcHJvY2VkdXJlXG4gIHZhciBhcmdzID0gW1wiYXBwZW5kXCIsIFwibWFsbG9jVWludDhcIiwgXCJmcmVlVWludDhcIl1cbiAgaWYobWVyZ2UpIHtcbiAgICBhcmdzLnVuc2hpZnQoXCJtZXJnZVwiKVxuICB9XG4gIGlmKHNraXApIHtcbiAgICBhcmdzLnVuc2hpZnQoXCJza2lwXCIpXG4gIH1cbiAgXG4gIC8vQnVpbGQgd3JhcHBlclxuICB2YXIgbG9jYWxfYXJncyA9IFtcImFycmF5XCJdLmNvbmNhdChvcHRfYXJncylcbiAgdmFyIGZ1bmNOYW1lID0gW1wiZ3JlZWR5TWVzaGVyXCIsIGQsIFwiZF9vcmRcIiwgb3JkZXIuam9pbihcInNcIikgLCAoc2tpcCA/IFwic2tpcFwiIDogXCJcIikgLCAobWVyZ2UgPyBcIm1lcmdlXCIgOiBcIlwiKV0uam9pbihcIlwiKVxuICB2YXIgZ2VuX2JvZHkgPSBbXCIndXNlIHN0cmljdCc7ZnVuY3Rpb24gXCIsIGZ1bmNOYW1lLCBcIihcIiwgbG9jYWxfYXJncy5qb2luKFwiLFwiKSwgXCIpe1wiLCBjb2RlLmpvaW4oXCJcXG5cIiksIFwifTtyZXR1cm4gXCIsIGZ1bmNOYW1lXS5qb2luKFwiXCIpXG4gIGFyZ3MucHVzaChnZW5fYm9keSlcbiAgdmFyIHByb2MgPSBGdW5jdGlvbi5hcHBseSh1bmRlZmluZWQsIGFyZ3MpXG4gIFxuICBpZihza2lwICYmIG1lcmdlKSB7XG4gICAgcmV0dXJuIHByb2Moc2tpcCwgbWVyZ2UsIGFwcGVuZCwgcG9vbC5tYWxsb2NVaW50OCwgcG9vbC5mcmVlVWludDgpXG4gIH0gZWxzZSBpZihza2lwKSB7XG4gICAgcmV0dXJuIHByb2Moc2tpcCwgYXBwZW5kLCBwb29sLm1hbGxvY1VpbnQ4LCBwb29sLmZyZWVVaW50OClcbiAgfSBlbHNlIGlmKG1lcmdlKSB7XG4gICAgcmV0dXJuIHByb2MobWVyZ2UsIGFwcGVuZCwgcG9vbC5tYWxsb2NVaW50OCwgcG9vbC5mcmVlVWludDgpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHByb2MoYXBwZW5kLCBwb29sLm1hbGxvY1VpbnQ4LCBwb29sLmZyZWVVaW50OClcbiAgfVxufVxuXG4vL1RoZSBhY3R1YWwgbWVzaCBjb21waWxlclxuZnVuY3Rpb24gY29tcGlsZU1lc2hlcihvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gIGlmKCFvcHRpb25zLm9yZGVyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiZ3JlZWR5LW1lc2hlcjogTWlzc2luZyBvcmRlciBmaWVsZFwiKVxuICB9XG4gIGlmKCFvcHRpb25zLmFwcGVuZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcImdyZWVkeS1tZXNoZXI6IE1pc3NpbmcgYXBwZW5kIGZpZWxkXCIpXG4gIH1cbiAgcmV0dXJuIGdlbmVyYXRlTWVzaGVyKFxuICAgIG9wdGlvbnMub3JkZXIsXG4gICAgb3B0aW9ucy5za2lwLFxuICAgIG9wdGlvbnMubWVyZ2UsXG4gICAgb3B0aW9ucy5hcHBlbmQsXG4gICAgb3B0aW9ucy5leHRyYUFyZ3N8MCxcbiAgICBvcHRpb25zLFxuICAgICEhb3B0aW9ucy51c2VHZXR0ZXJcbiAgKVxufVxubW9kdWxlLmV4cG9ydHMgPSBjb21waWxlTWVzaGVyXG4iLCJcInVzZSBzdHJpY3RcIlxuXG5mdW5jdGlvbiBpb3RhKG4pIHtcbiAgdmFyIHJlc3VsdCA9IG5ldyBBcnJheShuKVxuICBmb3IodmFyIGk9MDsgaTxuOyArK2kpIHtcbiAgICByZXN1bHRbaV0gPSBpXG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlvdGEiLCIvKipcbiAqIEJpdCB0d2lkZGxpbmcgaGFja3MgZm9yIEphdmFTY3JpcHQuXG4gKlxuICogQXV0aG9yOiBNaWtvbGEgTHlzZW5rb1xuICpcbiAqIFBvcnRlZCBmcm9tIFN0YW5mb3JkIGJpdCB0d2lkZGxpbmcgaGFjayBsaWJyYXJ5OlxuICogICAgaHR0cDovL2dyYXBoaWNzLnN0YW5mb3JkLmVkdS9+c2VhbmRlci9iaXRoYWNrcy5odG1sXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7IFwidXNlIHJlc3RyaWN0XCI7XG5cbi8vTnVtYmVyIG9mIGJpdHMgaW4gYW4gaW50ZWdlclxudmFyIElOVF9CSVRTID0gMzI7XG5cbi8vQ29uc3RhbnRzXG5leHBvcnRzLklOVF9CSVRTICA9IElOVF9CSVRTO1xuZXhwb3J0cy5JTlRfTUFYICAgPSAgMHg3ZmZmZmZmZjtcbmV4cG9ydHMuSU5UX01JTiAgID0gLTE8PChJTlRfQklUUy0xKTtcblxuLy9SZXR1cm5zIC0xLCAwLCArMSBkZXBlbmRpbmcgb24gc2lnbiBvZiB4XG5leHBvcnRzLnNpZ24gPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiAodiA+IDApIC0gKHYgPCAwKTtcbn1cblxuLy9Db21wdXRlcyBhYnNvbHV0ZSB2YWx1ZSBvZiBpbnRlZ2VyXG5leHBvcnRzLmFicyA9IGZ1bmN0aW9uKHYpIHtcbiAgdmFyIG1hc2sgPSB2ID4+IChJTlRfQklUUy0xKTtcbiAgcmV0dXJuICh2IF4gbWFzaykgLSBtYXNrO1xufVxuXG4vL0NvbXB1dGVzIG1pbmltdW0gb2YgaW50ZWdlcnMgeCBhbmQgeVxuZXhwb3J0cy5taW4gPSBmdW5jdGlvbih4LCB5KSB7XG4gIHJldHVybiB5IF4gKCh4IF4geSkgJiAtKHggPCB5KSk7XG59XG5cbi8vQ29tcHV0ZXMgbWF4aW11bSBvZiBpbnRlZ2VycyB4IGFuZCB5XG5leHBvcnRzLm1heCA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgcmV0dXJuIHggXiAoKHggXiB5KSAmIC0oeCA8IHkpKTtcbn1cblxuLy9DaGVja3MgaWYgYSBudW1iZXIgaXMgYSBwb3dlciBvZiB0d29cbmV4cG9ydHMuaXNQb3cyID0gZnVuY3Rpb24odikge1xuICByZXR1cm4gISh2ICYgKHYtMSkpICYmICghIXYpO1xufVxuXG4vL0NvbXB1dGVzIGxvZyBiYXNlIDIgb2YgdlxuZXhwb3J0cy5sb2cyID0gZnVuY3Rpb24odikge1xuICB2YXIgciwgc2hpZnQ7XG4gIHIgPSAgICAgKHYgPiAweEZGRkYpIDw8IDQ7IHYgPj4+PSByO1xuICBzaGlmdCA9ICh2ID4gMHhGRiAgKSA8PCAzOyB2ID4+Pj0gc2hpZnQ7IHIgfD0gc2hpZnQ7XG4gIHNoaWZ0ID0gKHYgPiAweEYgICApIDw8IDI7IHYgPj4+PSBzaGlmdDsgciB8PSBzaGlmdDtcbiAgc2hpZnQgPSAodiA+IDB4MyAgICkgPDwgMTsgdiA+Pj49IHNoaWZ0OyByIHw9IHNoaWZ0O1xuICByZXR1cm4gciB8ICh2ID4+IDEpO1xufVxuXG4vL0NvbXB1dGVzIGxvZyBiYXNlIDEwIG9mIHZcbmV4cG9ydHMubG9nMTAgPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiAgKHYgPj0gMTAwMDAwMDAwMCkgPyA5IDogKHYgPj0gMTAwMDAwMDAwKSA/IDggOiAodiA+PSAxMDAwMDAwMCkgPyA3IDpcbiAgICAgICAgICAodiA+PSAxMDAwMDAwKSA/IDYgOiAodiA+PSAxMDAwMDApID8gNSA6ICh2ID49IDEwMDAwKSA/IDQgOlxuICAgICAgICAgICh2ID49IDEwMDApID8gMyA6ICh2ID49IDEwMCkgPyAyIDogKHYgPj0gMTApID8gMSA6IDA7XG59XG5cbi8vQ291bnRzIG51bWJlciBvZiBiaXRzXG5leHBvcnRzLnBvcENvdW50ID0gZnVuY3Rpb24odikge1xuICB2ID0gdiAtICgodiA+Pj4gMSkgJiAweDU1NTU1NTU1KTtcbiAgdiA9ICh2ICYgMHgzMzMzMzMzMykgKyAoKHYgPj4+IDIpICYgMHgzMzMzMzMzMyk7XG4gIHJldHVybiAoKHYgKyAodiA+Pj4gNCkgJiAweEYwRjBGMEYpICogMHgxMDEwMTAxKSA+Pj4gMjQ7XG59XG5cbi8vQ291bnRzIG51bWJlciBvZiB0cmFpbGluZyB6ZXJvc1xuZnVuY3Rpb24gY291bnRUcmFpbGluZ1plcm9zKHYpIHtcbiAgdmFyIGMgPSAzMjtcbiAgdiAmPSAtdjtcbiAgaWYgKHYpIGMtLTtcbiAgaWYgKHYgJiAweDAwMDBGRkZGKSBjIC09IDE2O1xuICBpZiAodiAmIDB4MDBGRjAwRkYpIGMgLT0gODtcbiAgaWYgKHYgJiAweDBGMEYwRjBGKSBjIC09IDQ7XG4gIGlmICh2ICYgMHgzMzMzMzMzMykgYyAtPSAyO1xuICBpZiAodiAmIDB4NTU1NTU1NTUpIGMgLT0gMTtcbiAgcmV0dXJuIGM7XG59XG5leHBvcnRzLmNvdW50VHJhaWxpbmdaZXJvcyA9IGNvdW50VHJhaWxpbmdaZXJvcztcblxuLy9Sb3VuZHMgdG8gbmV4dCBwb3dlciBvZiAyXG5leHBvcnRzLm5leHRQb3cyID0gZnVuY3Rpb24odikge1xuICB2ICs9IHYgPT09IDA7XG4gIC0tdjtcbiAgdiB8PSB2ID4+PiAxO1xuICB2IHw9IHYgPj4+IDI7XG4gIHYgfD0gdiA+Pj4gNDtcbiAgdiB8PSB2ID4+PiA4O1xuICB2IHw9IHYgPj4+IDE2O1xuICByZXR1cm4gdiArIDE7XG59XG5cbi8vUm91bmRzIGRvd24gdG8gcHJldmlvdXMgcG93ZXIgb2YgMlxuZXhwb3J0cy5wcmV2UG93MiA9IGZ1bmN0aW9uKHYpIHtcbiAgdiB8PSB2ID4+PiAxO1xuICB2IHw9IHYgPj4+IDI7XG4gIHYgfD0gdiA+Pj4gNDtcbiAgdiB8PSB2ID4+PiA4O1xuICB2IHw9IHYgPj4+IDE2O1xuICByZXR1cm4gdiAtICh2Pj4+MSk7XG59XG5cbi8vQ29tcHV0ZXMgcGFyaXR5IG9mIHdvcmRcbmV4cG9ydHMucGFyaXR5ID0gZnVuY3Rpb24odikge1xuICB2IF49IHYgPj4+IDE2O1xuICB2IF49IHYgPj4+IDg7XG4gIHYgXj0gdiA+Pj4gNDtcbiAgdiAmPSAweGY7XG4gIHJldHVybiAoMHg2OTk2ID4+PiB2KSAmIDE7XG59XG5cbnZhciBSRVZFUlNFX1RBQkxFID0gbmV3IEFycmF5KDI1Nik7XG5cbihmdW5jdGlvbih0YWIpIHtcbiAgZm9yKHZhciBpPTA7IGk8MjU2OyArK2kpIHtcbiAgICB2YXIgdiA9IGksIHIgPSBpLCBzID0gNztcbiAgICBmb3IgKHYgPj4+PSAxOyB2OyB2ID4+Pj0gMSkge1xuICAgICAgciA8PD0gMTtcbiAgICAgIHIgfD0gdiAmIDE7XG4gICAgICAtLXM7XG4gICAgfVxuICAgIHRhYltpXSA9IChyIDw8IHMpICYgMHhmZjtcbiAgfVxufSkoUkVWRVJTRV9UQUJMRSk7XG5cbi8vUmV2ZXJzZSBiaXRzIGluIGEgMzIgYml0IHdvcmRcbmV4cG9ydHMucmV2ZXJzZSA9IGZ1bmN0aW9uKHYpIHtcbiAgcmV0dXJuICAoUkVWRVJTRV9UQUJMRVsgdiAgICAgICAgICYgMHhmZl0gPDwgMjQpIHxcbiAgICAgICAgICAoUkVWRVJTRV9UQUJMRVsodiA+Pj4gOCkgICYgMHhmZl0gPDwgMTYpIHxcbiAgICAgICAgICAoUkVWRVJTRV9UQUJMRVsodiA+Pj4gMTYpICYgMHhmZl0gPDwgOCkgIHxcbiAgICAgICAgICAgUkVWRVJTRV9UQUJMRVsodiA+Pj4gMjQpICYgMHhmZl07XG59XG5cbi8vSW50ZXJsZWF2ZSBiaXRzIG9mIDIgY29vcmRpbmF0ZXMgd2l0aCAxNiBiaXRzLiAgVXNlZnVsIGZvciBmYXN0IHF1YWR0cmVlIGNvZGVzXG5leHBvcnRzLmludGVybGVhdmUyID0gZnVuY3Rpb24oeCwgeSkge1xuICB4ICY9IDB4RkZGRjtcbiAgeCA9ICh4IHwgKHggPDwgOCkpICYgMHgwMEZGMDBGRjtcbiAgeCA9ICh4IHwgKHggPDwgNCkpICYgMHgwRjBGMEYwRjtcbiAgeCA9ICh4IHwgKHggPDwgMikpICYgMHgzMzMzMzMzMztcbiAgeCA9ICh4IHwgKHggPDwgMSkpICYgMHg1NTU1NTU1NTtcblxuICB5ICY9IDB4RkZGRjtcbiAgeSA9ICh5IHwgKHkgPDwgOCkpICYgMHgwMEZGMDBGRjtcbiAgeSA9ICh5IHwgKHkgPDwgNCkpICYgMHgwRjBGMEYwRjtcbiAgeSA9ICh5IHwgKHkgPDwgMikpICYgMHgzMzMzMzMzMztcbiAgeSA9ICh5IHwgKHkgPDwgMSkpICYgMHg1NTU1NTU1NTtcblxuICByZXR1cm4geCB8ICh5IDw8IDEpO1xufVxuXG4vL0V4dHJhY3RzIHRoZSBudGggaW50ZXJsZWF2ZWQgY29tcG9uZW50XG5leHBvcnRzLmRlaW50ZXJsZWF2ZTIgPSBmdW5jdGlvbih2LCBuKSB7XG4gIHYgPSAodiA+Pj4gbikgJiAweDU1NTU1NTU1O1xuICB2ID0gKHYgfCAodiA+Pj4gMSkpICAmIDB4MzMzMzMzMzM7XG4gIHYgPSAodiB8ICh2ID4+PiAyKSkgICYgMHgwRjBGMEYwRjtcbiAgdiA9ICh2IHwgKHYgPj4+IDQpKSAgJiAweDAwRkYwMEZGO1xuICB2ID0gKHYgfCAodiA+Pj4gMTYpKSAmIDB4MDAwRkZGRjtcbiAgcmV0dXJuICh2IDw8IDE2KSA+PiAxNjtcbn1cblxuXG4vL0ludGVybGVhdmUgYml0cyBvZiAzIGNvb3JkaW5hdGVzLCBlYWNoIHdpdGggMTAgYml0cy4gIFVzZWZ1bCBmb3IgZmFzdCBvY3RyZWUgY29kZXNcbmV4cG9ydHMuaW50ZXJsZWF2ZTMgPSBmdW5jdGlvbih4LCB5LCB6KSB7XG4gIHggJj0gMHgzRkY7XG4gIHggID0gKHggfCAoeDw8MTYpKSAmIDQyNzgxOTAzMzU7XG4gIHggID0gKHggfCAoeDw8OCkpICAmIDI1MTcxOTY5NTtcbiAgeCAgPSAoeCB8ICh4PDw0KSkgICYgMzI3MjM1NjAzNTtcbiAgeCAgPSAoeCB8ICh4PDwyKSkgICYgMTIyNzEzMzUxMztcblxuICB5ICY9IDB4M0ZGO1xuICB5ICA9ICh5IHwgKHk8PDE2KSkgJiA0Mjc4MTkwMzM1O1xuICB5ICA9ICh5IHwgKHk8PDgpKSAgJiAyNTE3MTk2OTU7XG4gIHkgID0gKHkgfCAoeTw8NCkpICAmIDMyNzIzNTYwMzU7XG4gIHkgID0gKHkgfCAoeTw8MikpICAmIDEyMjcxMzM1MTM7XG4gIHggfD0gKHkgPDwgMSk7XG4gIFxuICB6ICY9IDB4M0ZGO1xuICB6ICA9ICh6IHwgKHo8PDE2KSkgJiA0Mjc4MTkwMzM1O1xuICB6ICA9ICh6IHwgKHo8PDgpKSAgJiAyNTE3MTk2OTU7XG4gIHogID0gKHogfCAoejw8NCkpICAmIDMyNzIzNTYwMzU7XG4gIHogID0gKHogfCAoejw8MikpICAmIDEyMjcxMzM1MTM7XG4gIFxuICByZXR1cm4geCB8ICh6IDw8IDIpO1xufVxuXG4vL0V4dHJhY3RzIG50aCBpbnRlcmxlYXZlZCBjb21wb25lbnQgb2YgYSAzLXR1cGxlXG5leHBvcnRzLmRlaW50ZXJsZWF2ZTMgPSBmdW5jdGlvbih2LCBuKSB7XG4gIHYgPSAodiA+Pj4gbikgICAgICAgJiAxMjI3MTMzNTEzO1xuICB2ID0gKHYgfCAodj4+PjIpKSAgICYgMzI3MjM1NjAzNTtcbiAgdiA9ICh2IHwgKHY+Pj40KSkgICAmIDI1MTcxOTY5NTtcbiAgdiA9ICh2IHwgKHY+Pj44KSkgICAmIDQyNzgxOTAzMzU7XG4gIHYgPSAodiB8ICh2Pj4+MTYpKSAgJiAweDNGRjtcbiAgcmV0dXJuICh2PDwyMik+PjIyO1xufVxuXG4vL0NvbXB1dGVzIG5leHQgY29tYmluYXRpb24gaW4gY29sZXhpY29ncmFwaGljIG9yZGVyICh0aGlzIGlzIG1pc3Rha2VubHkgY2FsbGVkIG5leHRQZXJtdXRhdGlvbiBvbiB0aGUgYml0IHR3aWRkbGluZyBoYWNrcyBwYWdlKVxuZXhwb3J0cy5uZXh0Q29tYmluYXRpb24gPSBmdW5jdGlvbih2KSB7XG4gIHZhciB0ID0gdiB8ICh2IC0gMSk7XG4gIHJldHVybiAodCArIDEpIHwgKCgofnQgJiAtfnQpIC0gMSkgPj4+IChjb3VudFRyYWlsaW5nWmVyb3ModikgKyAxKSk7XG59XG5cbiIsIlwidXNlIHN0cmljdFwiXG5cbmZ1bmN0aW9uIGR1cGVfYXJyYXkoY291bnQsIHZhbHVlLCBpKSB7XG4gIHZhciBjID0gY291bnRbaV18MFxuICBpZihjIDw9IDApIHtcbiAgICByZXR1cm4gW11cbiAgfVxuICB2YXIgcmVzdWx0ID0gbmV3IEFycmF5KGMpLCBqXG4gIGlmKGkgPT09IGNvdW50Lmxlbmd0aC0xKSB7XG4gICAgZm9yKGo9MDsgajxjOyArK2opIHtcbiAgICAgIHJlc3VsdFtqXSA9IHZhbHVlXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGZvcihqPTA7IGo8YzsgKytqKSB7XG4gICAgICByZXN1bHRbal0gPSBkdXBlX2FycmF5KGNvdW50LCB2YWx1ZSwgaSsxKVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIGR1cGVfbnVtYmVyKGNvdW50LCB2YWx1ZSkge1xuICB2YXIgcmVzdWx0LCBpXG4gIHJlc3VsdCA9IG5ldyBBcnJheShjb3VudClcbiAgZm9yKGk9MDsgaTxjb3VudDsgKytpKSB7XG4gICAgcmVzdWx0W2ldID0gdmFsdWVcbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIGR1cGUoY291bnQsIHZhbHVlKSB7XG4gIGlmKHR5cGVvZiB2YWx1ZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHZhbHVlID0gMFxuICB9XG4gIHN3aXRjaCh0eXBlb2YgY291bnQpIHtcbiAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgICBpZihjb3VudCA+IDApIHtcbiAgICAgICAgcmV0dXJuIGR1cGVfbnVtYmVyKGNvdW50fDAsIHZhbHVlKVxuICAgICAgfVxuICAgIGJyZWFrXG4gICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgaWYodHlwZW9mIChjb3VudC5sZW5ndGgpID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHJldHVybiBkdXBlX2FycmF5KGNvdW50LCB2YWx1ZSwgMClcbiAgICAgIH1cbiAgICBicmVha1xuICB9XG4gIHJldHVybiBbXVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGR1cGUiLCIndXNlIHN0cmljdCdcblxudmFyIGJpdHMgPSByZXF1aXJlKCdiaXQtdHdpZGRsZScpXG52YXIgZHVwID0gcmVxdWlyZSgnZHVwJylcblxuLy9MZWdhY3kgcG9vbCBzdXBwb3J0XG5pZighZ2xvYmFsLl9fVFlQRURBUlJBWV9QT09MKSB7XG4gIGdsb2JhbC5fX1RZUEVEQVJSQVlfUE9PTCA9IHtcbiAgICAgIFVJTlQ4ICAgOiBkdXAoWzMyLCAwXSlcbiAgICAsIFVJTlQxNiAgOiBkdXAoWzMyLCAwXSlcbiAgICAsIFVJTlQzMiAgOiBkdXAoWzMyLCAwXSlcbiAgICAsIElOVDggICAgOiBkdXAoWzMyLCAwXSlcbiAgICAsIElOVDE2ICAgOiBkdXAoWzMyLCAwXSlcbiAgICAsIElOVDMyICAgOiBkdXAoWzMyLCAwXSlcbiAgICAsIEZMT0FUICAgOiBkdXAoWzMyLCAwXSlcbiAgICAsIERPVUJMRSAgOiBkdXAoWzMyLCAwXSlcbiAgICAsIERBVEEgICAgOiBkdXAoWzMyLCAwXSlcbiAgICAsIFVJTlQ4QyAgOiBkdXAoWzMyLCAwXSlcbiAgICAsIEJVRkZFUiAgOiBkdXAoWzMyLCAwXSlcbiAgfVxufVxuXG52YXIgaGFzVWludDhDID0gKHR5cGVvZiBVaW50OENsYW1wZWRBcnJheSkgIT09ICd1bmRlZmluZWQnXG52YXIgUE9PTCA9IGdsb2JhbC5fX1RZUEVEQVJSQVlfUE9PTFxuXG4vL1VwZ3JhZGUgcG9vbFxuaWYoIVBPT0wuVUlOVDhDKSB7XG4gIFBPT0wuVUlOVDhDID0gZHVwKFszMiwgMF0pXG59XG5pZighUE9PTC5CVUZGRVIpIHtcbiAgUE9PTC5CVUZGRVIgPSBkdXAoWzMyLCAwXSlcbn1cblxuLy9OZXcgdGVjaG5pcXVlOiBPbmx5IGFsbG9jYXRlIGZyb20gQXJyYXlCdWZmZXJWaWV3IGFuZCBCdWZmZXJcbnZhciBEQVRBICAgID0gUE9PTC5EQVRBXG4gICwgQlVGRkVSICA9IFBPT0wuQlVGRkVSXG5cbmV4cG9ydHMuZnJlZSA9IGZ1bmN0aW9uIGZyZWUoYXJyYXkpIHtcbiAgaWYoQnVmZmVyLmlzQnVmZmVyKGFycmF5KSkge1xuICAgIEJVRkZFUltiaXRzLmxvZzIoYXJyYXkubGVuZ3RoKV0ucHVzaChhcnJheSlcbiAgfSBlbHNlIHtcbiAgICBpZihPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJyYXkpICE9PSAnW29iamVjdCBBcnJheUJ1ZmZlcl0nKSB7XG4gICAgICBhcnJheSA9IGFycmF5LmJ1ZmZlclxuICAgIH1cbiAgICBpZighYXJyYXkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB2YXIgbiA9IGFycmF5Lmxlbmd0aCB8fCBhcnJheS5ieXRlTGVuZ3RoXG4gICAgdmFyIGxvZ19uID0gYml0cy5sb2cyKG4pfDBcbiAgICBEQVRBW2xvZ19uXS5wdXNoKGFycmF5KVxuICB9XG59XG5cbmZ1bmN0aW9uIGZyZWVBcnJheUJ1ZmZlcihidWZmZXIpIHtcbiAgaWYoIWJ1ZmZlcikge1xuICAgIHJldHVyblxuICB9XG4gIHZhciBuID0gYnVmZmVyLmxlbmd0aCB8fCBidWZmZXIuYnl0ZUxlbmd0aFxuICB2YXIgbG9nX24gPSBiaXRzLmxvZzIobilcbiAgREFUQVtsb2dfbl0ucHVzaChidWZmZXIpXG59XG5cbmZ1bmN0aW9uIGZyZWVUeXBlZEFycmF5KGFycmF5KSB7XG4gIGZyZWVBcnJheUJ1ZmZlcihhcnJheS5idWZmZXIpXG59XG5cbmV4cG9ydHMuZnJlZVVpbnQ4ID1cbmV4cG9ydHMuZnJlZVVpbnQxNiA9XG5leHBvcnRzLmZyZWVVaW50MzIgPVxuZXhwb3J0cy5mcmVlSW50OCA9XG5leHBvcnRzLmZyZWVJbnQxNiA9XG5leHBvcnRzLmZyZWVJbnQzMiA9XG5leHBvcnRzLmZyZWVGbG9hdDMyID0gXG5leHBvcnRzLmZyZWVGbG9hdCA9XG5leHBvcnRzLmZyZWVGbG9hdDY0ID0gXG5leHBvcnRzLmZyZWVEb3VibGUgPSBcbmV4cG9ydHMuZnJlZVVpbnQ4Q2xhbXBlZCA9IFxuZXhwb3J0cy5mcmVlRGF0YVZpZXcgPSBmcmVlVHlwZWRBcnJheVxuXG5leHBvcnRzLmZyZWVBcnJheUJ1ZmZlciA9IGZyZWVBcnJheUJ1ZmZlclxuXG5leHBvcnRzLmZyZWVCdWZmZXIgPSBmdW5jdGlvbiBmcmVlQnVmZmVyKGFycmF5KSB7XG4gIEJVRkZFUltiaXRzLmxvZzIoYXJyYXkubGVuZ3RoKV0ucHVzaChhcnJheSlcbn1cblxuZXhwb3J0cy5tYWxsb2MgPSBmdW5jdGlvbiBtYWxsb2MobiwgZHR5cGUpIHtcbiAgaWYoZHR5cGUgPT09IHVuZGVmaW5lZCB8fCBkdHlwZSA9PT0gJ2FycmF5YnVmZmVyJykge1xuICAgIHJldHVybiBtYWxsb2NBcnJheUJ1ZmZlcihuKVxuICB9IGVsc2Uge1xuICAgIHN3aXRjaChkdHlwZSkge1xuICAgICAgY2FzZSAndWludDgnOlxuICAgICAgICByZXR1cm4gbWFsbG9jVWludDgobilcbiAgICAgIGNhc2UgJ3VpbnQxNic6XG4gICAgICAgIHJldHVybiBtYWxsb2NVaW50MTYobilcbiAgICAgIGNhc2UgJ3VpbnQzMic6XG4gICAgICAgIHJldHVybiBtYWxsb2NVaW50MzIobilcbiAgICAgIGNhc2UgJ2ludDgnOlxuICAgICAgICByZXR1cm4gbWFsbG9jSW50OChuKVxuICAgICAgY2FzZSAnaW50MTYnOlxuICAgICAgICByZXR1cm4gbWFsbG9jSW50MTYobilcbiAgICAgIGNhc2UgJ2ludDMyJzpcbiAgICAgICAgcmV0dXJuIG1hbGxvY0ludDMyKG4pXG4gICAgICBjYXNlICdmbG9hdCc6XG4gICAgICBjYXNlICdmbG9hdDMyJzpcbiAgICAgICAgcmV0dXJuIG1hbGxvY0Zsb2F0KG4pXG4gICAgICBjYXNlICdkb3VibGUnOlxuICAgICAgY2FzZSAnZmxvYXQ2NCc6XG4gICAgICAgIHJldHVybiBtYWxsb2NEb3VibGUobilcbiAgICAgIGNhc2UgJ3VpbnQ4X2NsYW1wZWQnOlxuICAgICAgICByZXR1cm4gbWFsbG9jVWludDhDbGFtcGVkKG4pXG4gICAgICBjYXNlICdidWZmZXInOlxuICAgICAgICByZXR1cm4gbWFsbG9jQnVmZmVyKG4pXG4gICAgICBjYXNlICdkYXRhJzpcbiAgICAgIGNhc2UgJ2RhdGF2aWV3JzpcbiAgICAgICAgcmV0dXJuIG1hbGxvY0RhdGFWaWV3KG4pXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBudWxsXG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsXG59XG5cbmZ1bmN0aW9uIG1hbGxvY0FycmF5QnVmZmVyKG4pIHtcbiAgdmFyIG4gPSBiaXRzLm5leHRQb3cyKG4pXG4gIHZhciBsb2dfbiA9IGJpdHMubG9nMihuKVxuICB2YXIgZCA9IERBVEFbbG9nX25dXG4gIGlmKGQubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBkLnBvcCgpXG4gIH1cbiAgcmV0dXJuIG5ldyBBcnJheUJ1ZmZlcihuKVxufVxuZXhwb3J0cy5tYWxsb2NBcnJheUJ1ZmZlciA9IG1hbGxvY0FycmF5QnVmZmVyXG5cbmZ1bmN0aW9uIG1hbGxvY1VpbnQ4KG4pIHtcbiAgcmV0dXJuIG5ldyBVaW50OEFycmF5KG1hbGxvY0FycmF5QnVmZmVyKG4pLCAwLCBuKVxufVxuZXhwb3J0cy5tYWxsb2NVaW50OCA9IG1hbGxvY1VpbnQ4XG5cbmZ1bmN0aW9uIG1hbGxvY1VpbnQxNihuKSB7XG4gIHJldHVybiBuZXcgVWludDE2QXJyYXkobWFsbG9jQXJyYXlCdWZmZXIoMipuKSwgMCwgbilcbn1cbmV4cG9ydHMubWFsbG9jVWludDE2ID0gbWFsbG9jVWludDE2XG5cbmZ1bmN0aW9uIG1hbGxvY1VpbnQzMihuKSB7XG4gIHJldHVybiBuZXcgVWludDMyQXJyYXkobWFsbG9jQXJyYXlCdWZmZXIoNCpuKSwgMCwgbilcbn1cbmV4cG9ydHMubWFsbG9jVWludDMyID0gbWFsbG9jVWludDMyXG5cbmZ1bmN0aW9uIG1hbGxvY0ludDgobikge1xuICByZXR1cm4gbmV3IEludDhBcnJheShtYWxsb2NBcnJheUJ1ZmZlcihuKSwgMCwgbilcbn1cbmV4cG9ydHMubWFsbG9jSW50OCA9IG1hbGxvY0ludDhcblxuZnVuY3Rpb24gbWFsbG9jSW50MTYobikge1xuICByZXR1cm4gbmV3IEludDE2QXJyYXkobWFsbG9jQXJyYXlCdWZmZXIoMipuKSwgMCwgbilcbn1cbmV4cG9ydHMubWFsbG9jSW50MTYgPSBtYWxsb2NJbnQxNlxuXG5mdW5jdGlvbiBtYWxsb2NJbnQzMihuKSB7XG4gIHJldHVybiBuZXcgSW50MzJBcnJheShtYWxsb2NBcnJheUJ1ZmZlcig0Km4pLCAwLCBuKVxufVxuZXhwb3J0cy5tYWxsb2NJbnQzMiA9IG1hbGxvY0ludDMyXG5cbmZ1bmN0aW9uIG1hbGxvY0Zsb2F0KG4pIHtcbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkobWFsbG9jQXJyYXlCdWZmZXIoNCpuKSwgMCwgbilcbn1cbmV4cG9ydHMubWFsbG9jRmxvYXQzMiA9IGV4cG9ydHMubWFsbG9jRmxvYXQgPSBtYWxsb2NGbG9hdFxuXG5mdW5jdGlvbiBtYWxsb2NEb3VibGUobikge1xuICByZXR1cm4gbmV3IEZsb2F0NjRBcnJheShtYWxsb2NBcnJheUJ1ZmZlcig4Km4pLCAwLCBuKVxufVxuZXhwb3J0cy5tYWxsb2NGbG9hdDY0ID0gZXhwb3J0cy5tYWxsb2NEb3VibGUgPSBtYWxsb2NEb3VibGVcblxuZnVuY3Rpb24gbWFsbG9jVWludDhDbGFtcGVkKG4pIHtcbiAgaWYoaGFzVWludDhDKSB7XG4gICAgcmV0dXJuIG5ldyBVaW50OENsYW1wZWRBcnJheShtYWxsb2NBcnJheUJ1ZmZlcihuKSwgMCwgbilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbWFsbG9jVWludDgobilcbiAgfVxufVxuZXhwb3J0cy5tYWxsb2NVaW50OENsYW1wZWQgPSBtYWxsb2NVaW50OENsYW1wZWRcblxuZnVuY3Rpb24gbWFsbG9jRGF0YVZpZXcobikge1xuICByZXR1cm4gbmV3IERhdGFWaWV3KG1hbGxvY0FycmF5QnVmZmVyKG4pLCAwLCBuKVxufVxuZXhwb3J0cy5tYWxsb2NEYXRhVmlldyA9IG1hbGxvY0RhdGFWaWV3XG5cbmZ1bmN0aW9uIG1hbGxvY0J1ZmZlcihuKSB7XG4gIG4gPSBiaXRzLm5leHRQb3cyKG4pXG4gIHZhciBsb2dfbiA9IGJpdHMubG9nMihuKVxuICB2YXIgY2FjaGUgPSBCVUZGRVJbbG9nX25dXG4gIGlmKGNhY2hlLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gY2FjaGUucG9wKClcbiAgfVxuICByZXR1cm4gbmV3IEJ1ZmZlcihuKVxufVxuZXhwb3J0cy5tYWxsb2NCdWZmZXIgPSBtYWxsb2NCdWZmZXJcblxuZXhwb3J0cy5jbGVhckNhY2hlID0gZnVuY3Rpb24gY2xlYXJDYWNoZSgpIHtcbiAgZm9yKHZhciBpPTA7IGk8MzI7ICsraSkge1xuICAgIFBPT0wuVUlOVDhbaV0ubGVuZ3RoID0gMFxuICAgIFBPT0wuVUlOVDE2W2ldLmxlbmd0aCA9IDBcbiAgICBQT09MLlVJTlQzMltpXS5sZW5ndGggPSAwXG4gICAgUE9PTC5JTlQ4W2ldLmxlbmd0aCA9IDBcbiAgICBQT09MLklOVDE2W2ldLmxlbmd0aCA9IDBcbiAgICBQT09MLklOVDMyW2ldLmxlbmd0aCA9IDBcbiAgICBQT09MLkZMT0FUW2ldLmxlbmd0aCA9IDBcbiAgICBQT09MLkRPVUJMRVtpXS5sZW5ndGggPSAwXG4gICAgUE9PTC5VSU5UOENbaV0ubGVuZ3RoID0gMFxuICAgIERBVEFbaV0ubGVuZ3RoID0gMFxuICAgIEJVRkZFUltpXS5sZW5ndGggPSAwXG4gIH1cbn0iLCJcInVzZSBzdHJpY3RcIlxuXG5mdW5jdGlvbiB1bmlxdWVfcHJlZChsaXN0LCBjb21wYXJlKSB7XG4gIHZhciBwdHIgPSAxXG4gICAgLCBsZW4gPSBsaXN0Lmxlbmd0aFxuICAgICwgYT1saXN0WzBdLCBiPWxpc3RbMF1cbiAgZm9yKHZhciBpPTE7IGk8bGVuOyArK2kpIHtcbiAgICBiID0gYVxuICAgIGEgPSBsaXN0W2ldXG4gICAgaWYoY29tcGFyZShhLCBiKSkge1xuICAgICAgaWYoaSA9PT0gcHRyKSB7XG4gICAgICAgIHB0cisrXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgICBsaXN0W3B0cisrXSA9IGFcbiAgICB9XG4gIH1cbiAgbGlzdC5sZW5ndGggPSBwdHJcbiAgcmV0dXJuIGxpc3Rcbn1cblxuZnVuY3Rpb24gdW5pcXVlX2VxKGxpc3QpIHtcbiAgdmFyIHB0ciA9IDFcbiAgICAsIGxlbiA9IGxpc3QubGVuZ3RoXG4gICAgLCBhPWxpc3RbMF0sIGIgPSBsaXN0WzBdXG4gIGZvcih2YXIgaT0xOyBpPGxlbjsgKytpLCBiPWEpIHtcbiAgICBiID0gYVxuICAgIGEgPSBsaXN0W2ldXG4gICAgaWYoYSAhPT0gYikge1xuICAgICAgaWYoaSA9PT0gcHRyKSB7XG4gICAgICAgIHB0cisrXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgICBsaXN0W3B0cisrXSA9IGFcbiAgICB9XG4gIH1cbiAgbGlzdC5sZW5ndGggPSBwdHJcbiAgcmV0dXJuIGxpc3Rcbn1cblxuZnVuY3Rpb24gdW5pcXVlKGxpc3QsIGNvbXBhcmUsIHNvcnRlZCkge1xuICBpZihsaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBsaXN0XG4gIH1cbiAgaWYoY29tcGFyZSkge1xuICAgIGlmKCFzb3J0ZWQpIHtcbiAgICAgIGxpc3Quc29ydChjb21wYXJlKVxuICAgIH1cbiAgICByZXR1cm4gdW5pcXVlX3ByZWQobGlzdCwgY29tcGFyZSlcbiAgfVxuICBpZighc29ydGVkKSB7XG4gICAgbGlzdC5zb3J0KClcbiAgfVxuICByZXR1cm4gdW5pcXVlX2VxKGxpc3QpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gdW5pcXVlXG4iLCIvLyBTb3VyY2U6IGh0dHA6Ly9qc2ZpZGRsZS5uZXQvdld4OFYvXG4vLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzU2MDMxOTUvZnVsbC1saXN0LW9mLWphdmFzY3JpcHQta2V5Y29kZXNcblxuXG5cbi8qKlxuICogQ29uZW5pZW5jZSBtZXRob2QgcmV0dXJucyBjb3JyZXNwb25kaW5nIHZhbHVlIGZvciBnaXZlbiBrZXlOYW1lIG9yIGtleUNvZGUuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0ga2V5Q29kZSB7TnVtYmVyfSBvciBrZXlOYW1lIHtTdHJpbmd9XG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VhcmNoSW5wdXQpIHtcbiAgLy8gS2V5Ym9hcmQgRXZlbnRzXG4gIGlmIChzZWFyY2hJbnB1dCAmJiAnb2JqZWN0JyA9PT0gdHlwZW9mIHNlYXJjaElucHV0KSB7XG4gICAgdmFyIGhhc0tleUNvZGUgPSBzZWFyY2hJbnB1dC53aGljaCB8fCBzZWFyY2hJbnB1dC5rZXlDb2RlIHx8IHNlYXJjaElucHV0LmNoYXJDb2RlXG4gICAgaWYgKGhhc0tleUNvZGUpIHNlYXJjaElucHV0ID0gaGFzS2V5Q29kZVxuICB9XG5cbiAgLy8gTnVtYmVyc1xuICBpZiAoJ251bWJlcicgPT09IHR5cGVvZiBzZWFyY2hJbnB1dCkgcmV0dXJuIG5hbWVzW3NlYXJjaElucHV0XVxuXG4gIC8vIEV2ZXJ5dGhpbmcgZWxzZSAoY2FzdCB0byBzdHJpbmcpXG4gIHZhciBzZWFyY2ggPSBTdHJpbmcoc2VhcmNoSW5wdXQpXG5cbiAgLy8gY2hlY2sgY29kZXNcbiAgdmFyIGZvdW5kTmFtZWRLZXkgPSBjb2Rlc1tzZWFyY2gudG9Mb3dlckNhc2UoKV1cbiAgaWYgKGZvdW5kTmFtZWRLZXkpIHJldHVybiBmb3VuZE5hbWVkS2V5XG5cbiAgLy8gY2hlY2sgYWxpYXNlc1xuICB2YXIgZm91bmROYW1lZEtleSA9IGFsaWFzZXNbc2VhcmNoLnRvTG93ZXJDYXNlKCldXG4gIGlmIChmb3VuZE5hbWVkS2V5KSByZXR1cm4gZm91bmROYW1lZEtleVxuXG4gIC8vIHdlaXJkIGNoYXJhY3Rlcj9cbiAgaWYgKHNlYXJjaC5sZW5ndGggPT09IDEpIHJldHVybiBzZWFyY2guY2hhckNvZGVBdCgwKVxuXG4gIHJldHVybiB1bmRlZmluZWRcbn1cblxuLyoqXG4gKiBHZXQgYnkgbmFtZVxuICpcbiAqICAgZXhwb3J0cy5jb2RlWydlbnRlciddIC8vID0+IDEzXG4gKi9cblxudmFyIGNvZGVzID0gZXhwb3J0cy5jb2RlID0gZXhwb3J0cy5jb2RlcyA9IHtcbiAgJ2JhY2tzcGFjZSc6IDgsXG4gICd0YWInOiA5LFxuICAnZW50ZXInOiAxMyxcbiAgJ3NoaWZ0JzogMTYsXG4gICdjdHJsJzogMTcsXG4gICdhbHQnOiAxOCxcbiAgJ3BhdXNlL2JyZWFrJzogMTksXG4gICdjYXBzIGxvY2snOiAyMCxcbiAgJ2VzYyc6IDI3LFxuICAnc3BhY2UnOiAzMixcbiAgJ3BhZ2UgdXAnOiAzMyxcbiAgJ3BhZ2UgZG93bic6IDM0LFxuICAnZW5kJzogMzUsXG4gICdob21lJzogMzYsXG4gICdsZWZ0JzogMzcsXG4gICd1cCc6IDM4LFxuICAncmlnaHQnOiAzOSxcbiAgJ2Rvd24nOiA0MCxcbiAgJ2luc2VydCc6IDQ1LFxuICAnZGVsZXRlJzogNDYsXG4gICdjb21tYW5kJzogOTEsXG4gICdyaWdodCBjbGljayc6IDkzLFxuICAnbnVtcGFkIConOiAxMDYsXG4gICdudW1wYWQgKyc6IDEwNyxcbiAgJ251bXBhZCAtJzogMTA5LFxuICAnbnVtcGFkIC4nOiAxMTAsXG4gICdudW1wYWQgLyc6IDExMSxcbiAgJ251bSBsb2NrJzogMTQ0LFxuICAnc2Nyb2xsIGxvY2snOiAxNDUsXG4gICdteSBjb21wdXRlcic6IDE4MixcbiAgJ215IGNhbGN1bGF0b3InOiAxODMsXG4gICc7JzogMTg2LFxuICAnPSc6IDE4NyxcbiAgJywnOiAxODgsXG4gICctJzogMTg5LFxuICAnLic6IDE5MCxcbiAgJy8nOiAxOTEsXG4gICdgJzogMTkyLFxuICAnWyc6IDIxOSxcbiAgJ1xcXFwnOiAyMjAsXG4gICddJzogMjIxLFxuICBcIidcIjogMjIyLFxufVxuXG4vLyBIZWxwZXIgYWxpYXNlc1xuXG52YXIgYWxpYXNlcyA9IGV4cG9ydHMuYWxpYXNlcyA9IHtcbiAgJ3dpbmRvd3MnOiA5MSxcbiAgJ+KHpyc6IDE2LFxuICAn4oylJzogMTgsXG4gICfijIMnOiAxNyxcbiAgJ+KMmCc6IDkxLFxuICAnY3RsJzogMTcsXG4gICdjb250cm9sJzogMTcsXG4gICdvcHRpb24nOiAxOCxcbiAgJ3BhdXNlJzogMTksXG4gICdicmVhayc6IDE5LFxuICAnY2Fwcyc6IDIwLFxuICAncmV0dXJuJzogMTMsXG4gICdlc2NhcGUnOiAyNyxcbiAgJ3NwYyc6IDMyLFxuICAncGd1cCc6IDMzLFxuICAncGdkbic6IDMzLFxuICAnaW5zJzogNDUsXG4gICdkZWwnOiA0NixcbiAgJ2NtZCc6IDkxXG59XG5cblxuLyohXG4gKiBQcm9ncmFtYXRpY2FsbHkgYWRkIHRoZSBmb2xsb3dpbmdcbiAqL1xuXG4vLyBsb3dlciBjYXNlIGNoYXJzXG5mb3IgKGkgPSA5NzsgaSA8IDEyMzsgaSsrKSBjb2Rlc1tTdHJpbmcuZnJvbUNoYXJDb2RlKGkpXSA9IGkgLSAzMlxuXG4vLyBudW1iZXJzXG5mb3IgKHZhciBpID0gNDg7IGkgPCA1ODsgaSsrKSBjb2Rlc1tpIC0gNDhdID0gaVxuXG4vLyBmdW5jdGlvbiBrZXlzXG5mb3IgKGkgPSAxOyBpIDwgMTM7IGkrKykgY29kZXNbJ2YnK2ldID0gaSArIDExMVxuXG4vLyBudW1wYWQga2V5c1xuZm9yIChpID0gMDsgaSA8IDEwOyBpKyspIGNvZGVzWydudW1wYWQgJytpXSA9IGkgKyA5NlxuXG4vKipcbiAqIEdldCBieSBjb2RlXG4gKlxuICogICBleHBvcnRzLm5hbWVbMTNdIC8vID0+ICdFbnRlcidcbiAqL1xuXG52YXIgbmFtZXMgPSBleHBvcnRzLm5hbWVzID0gZXhwb3J0cy50aXRsZSA9IHt9IC8vIHRpdGxlIGZvciBiYWNrd2FyZCBjb21wYXRcblxuLy8gQ3JlYXRlIHJldmVyc2UgbWFwcGluZ1xuZm9yIChpIGluIGNvZGVzKSBuYW1lc1tjb2Rlc1tpXV0gPSBpXG5cbi8vIEFkZCBhbGlhc2VzXG5mb3IgKHZhciBhbGlhcyBpbiBhbGlhc2VzKSB7XG4gIGNvZGVzW2FsaWFzXSA9IGFsaWFzZXNbYWxpYXNdXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhcmdzLCBvcHRzKSB7XG4gICAgaWYgKCFvcHRzKSBvcHRzID0ge307XG4gICAgXG4gICAgdmFyIGZsYWdzID0geyBib29scyA6IHt9LCBzdHJpbmdzIDoge30sIHVua25vd25GbjogbnVsbCB9O1xuXG4gICAgaWYgKHR5cGVvZiBvcHRzWyd1bmtub3duJ10gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZmxhZ3MudW5rbm93bkZuID0gb3B0c1sndW5rbm93biddO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0c1snYm9vbGVhbiddID09PSAnYm9vbGVhbicgJiYgb3B0c1snYm9vbGVhbiddKSB7XG4gICAgICBmbGFncy5hbGxCb29scyA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIFtdLmNvbmNhdChvcHRzWydib29sZWFuJ10pLmZpbHRlcihCb29sZWFuKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICBmbGFncy5ib29sc1trZXldID0gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICB2YXIgYWxpYXNlcyA9IHt9O1xuICAgIE9iamVjdC5rZXlzKG9wdHMuYWxpYXMgfHwge30pLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBhbGlhc2VzW2tleV0gPSBbXS5jb25jYXQob3B0cy5hbGlhc1trZXldKTtcbiAgICAgICAgYWxpYXNlc1trZXldLmZvckVhY2goZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIGFsaWFzZXNbeF0gPSBba2V5XS5jb25jYXQoYWxpYXNlc1trZXldLmZpbHRlcihmdW5jdGlvbiAoeSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4ICE9PSB5O1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIFtdLmNvbmNhdChvcHRzLnN0cmluZykuZmlsdGVyKEJvb2xlYW4pLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBmbGFncy5zdHJpbmdzW2tleV0gPSB0cnVlO1xuICAgICAgICBpZiAoYWxpYXNlc1trZXldKSB7XG4gICAgICAgICAgICBmbGFncy5zdHJpbmdzW2FsaWFzZXNba2V5XV0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgIH0pO1xuXG4gICAgdmFyIGRlZmF1bHRzID0gb3B0c1snZGVmYXVsdCddIHx8IHt9O1xuICAgIFxuICAgIHZhciBhcmd2ID0geyBfIDogW10gfTtcbiAgICBPYmplY3Qua2V5cyhmbGFncy5ib29scykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHNldEFyZyhrZXksIGRlZmF1bHRzW2tleV0gPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogZGVmYXVsdHNba2V5XSk7XG4gICAgfSk7XG4gICAgXG4gICAgdmFyIG5vdEZsYWdzID0gW107XG5cbiAgICBpZiAoYXJncy5pbmRleE9mKCctLScpICE9PSAtMSkge1xuICAgICAgICBub3RGbGFncyA9IGFyZ3Muc2xpY2UoYXJncy5pbmRleE9mKCctLScpKzEpO1xuICAgICAgICBhcmdzID0gYXJncy5zbGljZSgwLCBhcmdzLmluZGV4T2YoJy0tJykpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFyZ0RlZmluZWQoa2V5LCBhcmcpIHtcbiAgICAgICAgcmV0dXJuIChmbGFncy5hbGxCb29scyAmJiAvXi0tW149XSskLy50ZXN0KGFyZykpIHx8XG4gICAgICAgICAgICBmbGFncy5zdHJpbmdzW2tleV0gfHwgZmxhZ3MuYm9vbHNba2V5XSB8fCBhbGlhc2VzW2tleV07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0QXJnIChrZXksIHZhbCwgYXJnKSB7XG4gICAgICAgIGlmIChhcmcgJiYgZmxhZ3MudW5rbm93bkZuICYmICFhcmdEZWZpbmVkKGtleSwgYXJnKSkge1xuICAgICAgICAgICAgaWYgKGZsYWdzLnVua25vd25GbihhcmcpID09PSBmYWxzZSkgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHZhbHVlID0gIWZsYWdzLnN0cmluZ3Nba2V5XSAmJiBpc051bWJlcih2YWwpXG4gICAgICAgICAgICA/IE51bWJlcih2YWwpIDogdmFsXG4gICAgICAgIDtcbiAgICAgICAgc2V0S2V5KGFyZ3YsIGtleS5zcGxpdCgnLicpLCB2YWx1ZSk7XG4gICAgICAgIFxuICAgICAgICAoYWxpYXNlc1trZXldIHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICBzZXRLZXkoYXJndiwgeC5zcGxpdCgnLicpLCB2YWx1ZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldEtleSAob2JqLCBrZXlzLCB2YWx1ZSkge1xuICAgICAgICB2YXIgbyA9IG9iajtcbiAgICAgICAga2V5cy5zbGljZSgwLC0xKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIGlmIChvW2tleV0gPT09IHVuZGVmaW5lZCkgb1trZXldID0ge307XG4gICAgICAgICAgICBvID0gb1trZXldO1xuICAgICAgICB9KTtcblxuICAgICAgICB2YXIga2V5ID0ga2V5c1trZXlzLmxlbmd0aCAtIDFdO1xuICAgICAgICBpZiAob1trZXldID09PSB1bmRlZmluZWQgfHwgZmxhZ3MuYm9vbHNba2V5XSB8fCB0eXBlb2Ygb1trZXldID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIG9ba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob1trZXldKSkge1xuICAgICAgICAgICAgb1trZXldLnB1c2godmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgb1trZXldID0gWyBvW2tleV0sIHZhbHVlIF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgZnVuY3Rpb24gYWxpYXNJc0Jvb2xlYW4oa2V5KSB7XG4gICAgICByZXR1cm4gYWxpYXNlc1trZXldLnNvbWUoZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICByZXR1cm4gZmxhZ3MuYm9vbHNbeF07XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGFyZyA9IGFyZ3NbaV07XG4gICAgICAgIFxuICAgICAgICBpZiAoL14tLS4rPS8udGVzdChhcmcpKSB7XG4gICAgICAgICAgICAvLyBVc2luZyBbXFxzXFxTXSBpbnN0ZWFkIG9mIC4gYmVjYXVzZSBqcyBkb2Vzbid0IHN1cHBvcnQgdGhlXG4gICAgICAgICAgICAvLyAnZG90YWxsJyByZWdleCBtb2RpZmllci4gU2VlOlxuICAgICAgICAgICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTA2ODMwOC8xMzIxNlxuICAgICAgICAgICAgdmFyIG0gPSBhcmcubWF0Y2goL14tLShbXj1dKyk9KFtcXHNcXFNdKikkLyk7XG4gICAgICAgICAgICB2YXIga2V5ID0gbVsxXTtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IG1bMl07XG4gICAgICAgICAgICBpZiAoZmxhZ3MuYm9vbHNba2V5XSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgIT09ICdmYWxzZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZXRBcmcoa2V5LCB2YWx1ZSwgYXJnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICgvXi0tbm8tLisvLnRlc3QoYXJnKSkge1xuICAgICAgICAgICAgdmFyIGtleSA9IGFyZy5tYXRjaCgvXi0tbm8tKC4rKS8pWzFdO1xuICAgICAgICAgICAgc2V0QXJnKGtleSwgZmFsc2UsIGFyZyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoL14tLS4rLy50ZXN0KGFyZykpIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBhcmcubWF0Y2goL14tLSguKykvKVsxXTtcbiAgICAgICAgICAgIHZhciBuZXh0ID0gYXJnc1tpICsgMV07XG4gICAgICAgICAgICBpZiAobmV4dCAhPT0gdW5kZWZpbmVkICYmICEvXi0vLnRlc3QobmV4dClcbiAgICAgICAgICAgICYmICFmbGFncy5ib29sc1trZXldXG4gICAgICAgICAgICAmJiAhZmxhZ3MuYWxsQm9vbHNcbiAgICAgICAgICAgICYmIChhbGlhc2VzW2tleV0gPyAhYWxpYXNJc0Jvb2xlYW4oa2V5KSA6IHRydWUpKSB7XG4gICAgICAgICAgICAgICAgc2V0QXJnKGtleSwgbmV4dCwgYXJnKTtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICgvXih0cnVlfGZhbHNlKSQvLnRlc3QobmV4dCkpIHtcbiAgICAgICAgICAgICAgICBzZXRBcmcoa2V5LCBuZXh0ID09PSAndHJ1ZScsIGFyZyk7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2V0QXJnKGtleSwgZmxhZ3Muc3RyaW5nc1trZXldID8gJycgOiB0cnVlLCBhcmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKC9eLVteLV0rLy50ZXN0KGFyZykpIHtcbiAgICAgICAgICAgIHZhciBsZXR0ZXJzID0gYXJnLnNsaWNlKDEsLTEpLnNwbGl0KCcnKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGJyb2tlbiA9IGZhbHNlO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBsZXR0ZXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHQgPSBhcmcuc2xpY2UoaisyKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAobmV4dCA9PT0gJy0nKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldEFyZyhsZXR0ZXJzW2pdLCBuZXh0LCBhcmcpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoL1tBLVphLXpdLy50ZXN0KGxldHRlcnNbal0pICYmIC89Ly50ZXN0KG5leHQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldEFyZyhsZXR0ZXJzW2pdLCBuZXh0LnNwbGl0KCc9JylbMV0sIGFyZyk7XG4gICAgICAgICAgICAgICAgICAgIGJyb2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoL1tBLVphLXpdLy50ZXN0KGxldHRlcnNbal0pXG4gICAgICAgICAgICAgICAgJiYgLy0/XFxkKyhcXC5cXGQqKT8oZS0/XFxkKyk/JC8udGVzdChuZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICBzZXRBcmcobGV0dGVyc1tqXSwgbmV4dCwgYXJnKTtcbiAgICAgICAgICAgICAgICAgICAgYnJva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChsZXR0ZXJzW2orMV0gJiYgbGV0dGVyc1tqKzFdLm1hdGNoKC9cXFcvKSkge1xuICAgICAgICAgICAgICAgICAgICBzZXRBcmcobGV0dGVyc1tqXSwgYXJnLnNsaWNlKGorMiksIGFyZyk7XG4gICAgICAgICAgICAgICAgICAgIGJyb2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0QXJnKGxldHRlcnNbal0sIGZsYWdzLnN0cmluZ3NbbGV0dGVyc1tqXV0gPyAnJyA6IHRydWUsIGFyZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIga2V5ID0gYXJnLnNsaWNlKC0xKVswXTtcbiAgICAgICAgICAgIGlmICghYnJva2VuICYmIGtleSAhPT0gJy0nKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3NbaSsxXSAmJiAhL14oLXwtLSlbXi1dLy50ZXN0KGFyZ3NbaSsxXSlcbiAgICAgICAgICAgICAgICAmJiAhZmxhZ3MuYm9vbHNba2V5XVxuICAgICAgICAgICAgICAgICYmIChhbGlhc2VzW2tleV0gPyAhYWxpYXNJc0Jvb2xlYW4oa2V5KSA6IHRydWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldEFyZyhrZXksIGFyZ3NbaSsxXSwgYXJnKTtcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChhcmdzW2krMV0gJiYgL3RydWV8ZmFsc2UvLnRlc3QoYXJnc1tpKzFdKSkge1xuICAgICAgICAgICAgICAgICAgICBzZXRBcmcoa2V5LCBhcmdzW2krMV0gPT09ICd0cnVlJywgYXJnKTtcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0QXJnKGtleSwgZmxhZ3Muc3RyaW5nc1trZXldID8gJycgOiB0cnVlLCBhcmcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICghZmxhZ3MudW5rbm93bkZuIHx8IGZsYWdzLnVua25vd25GbihhcmcpICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGFyZ3YuXy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICBmbGFncy5zdHJpbmdzWydfJ10gfHwgIWlzTnVtYmVyKGFyZykgPyBhcmcgOiBOdW1iZXIoYXJnKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob3B0cy5zdG9wRWFybHkpIHtcbiAgICAgICAgICAgICAgICBhcmd2Ll8ucHVzaC5hcHBseShhcmd2Ll8sIGFyZ3Muc2xpY2UoaSArIDEpKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBPYmplY3Qua2V5cyhkZWZhdWx0cykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGlmICghaGFzS2V5KGFyZ3YsIGtleS5zcGxpdCgnLicpKSkge1xuICAgICAgICAgICAgc2V0S2V5KGFyZ3YsIGtleS5zcGxpdCgnLicpLCBkZWZhdWx0c1trZXldKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgKGFsaWFzZXNba2V5XSB8fCBbXSkuZm9yRWFjaChmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgICAgIHNldEtleShhcmd2LCB4LnNwbGl0KCcuJyksIGRlZmF1bHRzW2tleV0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBcbiAgICBpZiAob3B0c1snLS0nXSkge1xuICAgICAgICBhcmd2WyctLSddID0gbmV3IEFycmF5KCk7XG4gICAgICAgIG5vdEZsYWdzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICBhcmd2WyctLSddLnB1c2goa2V5KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBub3RGbGFncy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgYXJndi5fLnB1c2goa2V5KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFyZ3Y7XG59O1xuXG5mdW5jdGlvbiBoYXNLZXkgKG9iaiwga2V5cykge1xuICAgIHZhciBvID0gb2JqO1xuICAgIGtleXMuc2xpY2UoMCwtMSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIG8gPSAob1trZXldIHx8IHt9KTtcbiAgICB9KTtcblxuICAgIHZhciBrZXkgPSBrZXlzW2tleXMubGVuZ3RoIC0gMV07XG4gICAgcmV0dXJuIGtleSBpbiBvO1xufVxuXG5mdW5jdGlvbiBpc051bWJlciAoeCkge1xuICAgIGlmICh0eXBlb2YgeCA9PT0gJ251bWJlcicpIHJldHVybiB0cnVlO1xuICAgIGlmICgvXjB4WzAtOWEtZl0rJC9pLnRlc3QoeCkpIHJldHVybiB0cnVlO1xuICAgIHJldHVybiAvXlstK10/KD86XFxkKyg/OlxcLlxcZCopP3xcXC5cXGQrKShlWy0rXT9cXGQrKT8kLy50ZXN0KHgpO1xufVxuXG4iLCJ2YXIgaW90YSA9IHJlcXVpcmUoXCJpb3RhLWFycmF5XCIpXG52YXIgaXNCdWZmZXIgPSByZXF1aXJlKFwiaXMtYnVmZmVyXCIpXG5cbnZhciBoYXNUeXBlZEFycmF5cyAgPSAoKHR5cGVvZiBGbG9hdDY0QXJyYXkpICE9PSBcInVuZGVmaW5lZFwiKVxuXG5mdW5jdGlvbiBjb21wYXJlMXN0KGEsIGIpIHtcbiAgcmV0dXJuIGFbMF0gLSBiWzBdXG59XG5cbmZ1bmN0aW9uIG9yZGVyKCkge1xuICB2YXIgc3RyaWRlID0gdGhpcy5zdHJpZGVcbiAgdmFyIHRlcm1zID0gbmV3IEFycmF5KHN0cmlkZS5sZW5ndGgpXG4gIHZhciBpXG4gIGZvcihpPTA7IGk8dGVybXMubGVuZ3RoOyArK2kpIHtcbiAgICB0ZXJtc1tpXSA9IFtNYXRoLmFicyhzdHJpZGVbaV0pLCBpXVxuICB9XG4gIHRlcm1zLnNvcnQoY29tcGFyZTFzdClcbiAgdmFyIHJlc3VsdCA9IG5ldyBBcnJheSh0ZXJtcy5sZW5ndGgpXG4gIGZvcihpPTA7IGk8cmVzdWx0Lmxlbmd0aDsgKytpKSB7XG4gICAgcmVzdWx0W2ldID0gdGVybXNbaV1bMV1cbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIGNvbXBpbGVDb25zdHJ1Y3RvcihkdHlwZSwgZGltZW5zaW9uKSB7XG4gIHZhciBjbGFzc05hbWUgPSBbXCJWaWV3XCIsIGRpbWVuc2lvbiwgXCJkXCIsIGR0eXBlXS5qb2luKFwiXCIpXG4gIGlmKGRpbWVuc2lvbiA8IDApIHtcbiAgICBjbGFzc05hbWUgPSBcIlZpZXdfTmlsXCIgKyBkdHlwZVxuICB9XG4gIHZhciB1c2VHZXR0ZXJzID0gKGR0eXBlID09PSBcImdlbmVyaWNcIilcblxuICBpZihkaW1lbnNpb24gPT09IC0xKSB7XG4gICAgLy9TcGVjaWFsIGNhc2UgZm9yIHRyaXZpYWwgYXJyYXlzXG4gICAgdmFyIGNvZGUgPVxuICAgICAgXCJmdW5jdGlvbiBcIitjbGFzc05hbWUrXCIoYSl7dGhpcy5kYXRhPWE7fTtcXFxudmFyIHByb3RvPVwiK2NsYXNzTmFtZStcIi5wcm90b3R5cGU7XFxcbnByb3RvLmR0eXBlPSdcIitkdHlwZStcIic7XFxcbnByb3RvLmluZGV4PWZ1bmN0aW9uKCl7cmV0dXJuIC0xfTtcXFxucHJvdG8uc2l6ZT0wO1xcXG5wcm90by5kaW1lbnNpb249LTE7XFxcbnByb3RvLnNoYXBlPXByb3RvLnN0cmlkZT1wcm90by5vcmRlcj1bXTtcXFxucHJvdG8ubG89cHJvdG8uaGk9cHJvdG8udHJhbnNwb3NlPXByb3RvLnN0ZXA9XFxcbmZ1bmN0aW9uKCl7cmV0dXJuIG5ldyBcIitjbGFzc05hbWUrXCIodGhpcy5kYXRhKTt9O1xcXG5wcm90by5nZXQ9cHJvdG8uc2V0PWZ1bmN0aW9uKCl7fTtcXFxucHJvdG8ucGljaz1mdW5jdGlvbigpe3JldHVybiBudWxsfTtcXFxucmV0dXJuIGZ1bmN0aW9uIGNvbnN0cnVjdF9cIitjbGFzc05hbWUrXCIoYSl7cmV0dXJuIG5ldyBcIitjbGFzc05hbWUrXCIoYSk7fVwiXG4gICAgdmFyIHByb2NlZHVyZSA9IG5ldyBGdW5jdGlvbihjb2RlKVxuICAgIHJldHVybiBwcm9jZWR1cmUoKVxuICB9IGVsc2UgaWYoZGltZW5zaW9uID09PSAwKSB7XG4gICAgLy9TcGVjaWFsIGNhc2UgZm9yIDBkIGFycmF5c1xuICAgIHZhciBjb2RlID1cbiAgICAgIFwiZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiKGEsZCkge1xcXG50aGlzLmRhdGEgPSBhO1xcXG50aGlzLm9mZnNldCA9IGRcXFxufTtcXFxudmFyIHByb3RvPVwiK2NsYXNzTmFtZStcIi5wcm90b3R5cGU7XFxcbnByb3RvLmR0eXBlPSdcIitkdHlwZStcIic7XFxcbnByb3RvLmluZGV4PWZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMub2Zmc2V0fTtcXFxucHJvdG8uZGltZW5zaW9uPTA7XFxcbnByb3RvLnNpemU9MTtcXFxucHJvdG8uc2hhcGU9XFxcbnByb3RvLnN0cmlkZT1cXFxucHJvdG8ub3JkZXI9W107XFxcbnByb3RvLmxvPVxcXG5wcm90by5oaT1cXFxucHJvdG8udHJhbnNwb3NlPVxcXG5wcm90by5zdGVwPWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9jb3B5KCkge1xcXG5yZXR1cm4gbmV3IFwiK2NsYXNzTmFtZStcIih0aGlzLmRhdGEsdGhpcy5vZmZzZXQpXFxcbn07XFxcbnByb3RvLnBpY2s9ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX3BpY2soKXtcXFxucmV0dXJuIFRyaXZpYWxBcnJheSh0aGlzLmRhdGEpO1xcXG59O1xcXG5wcm90by52YWx1ZU9mPXByb3RvLmdldD1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfZ2V0KCl7XFxcbnJldHVybiBcIisodXNlR2V0dGVycyA/IFwidGhpcy5kYXRhLmdldCh0aGlzLm9mZnNldClcIiA6IFwidGhpcy5kYXRhW3RoaXMub2Zmc2V0XVwiKStcblwifTtcXFxucHJvdG8uc2V0PWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9zZXQodil7XFxcbnJldHVybiBcIisodXNlR2V0dGVycyA/IFwidGhpcy5kYXRhLnNldCh0aGlzLm9mZnNldCx2KVwiIDogXCJ0aGlzLmRhdGFbdGhpcy5vZmZzZXRdPXZcIikrXCJcXFxufTtcXFxucmV0dXJuIGZ1bmN0aW9uIGNvbnN0cnVjdF9cIitjbGFzc05hbWUrXCIoYSxiLGMsZCl7cmV0dXJuIG5ldyBcIitjbGFzc05hbWUrXCIoYSxkKX1cIlxuICAgIHZhciBwcm9jZWR1cmUgPSBuZXcgRnVuY3Rpb24oXCJUcml2aWFsQXJyYXlcIiwgY29kZSlcbiAgICByZXR1cm4gcHJvY2VkdXJlKENBQ0hFRF9DT05TVFJVQ1RPUlNbZHR5cGVdWzBdKVxuICB9XG5cbiAgdmFyIGNvZGUgPSBbXCIndXNlIHN0cmljdCdcIl1cblxuICAvL0NyZWF0ZSBjb25zdHJ1Y3RvciBmb3Igdmlld1xuICB2YXIgaW5kaWNlcyA9IGlvdGEoZGltZW5zaW9uKVxuICB2YXIgYXJncyA9IGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHsgcmV0dXJuIFwiaVwiK2kgfSlcbiAgdmFyIGluZGV4X3N0ciA9IFwidGhpcy5vZmZzZXQrXCIgKyBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICAgIHJldHVybiBcInRoaXMuc3RyaWRlW1wiICsgaSArIFwiXSppXCIgKyBpXG4gICAgICB9KS5qb2luKFwiK1wiKVxuICB2YXIgc2hhcGVBcmcgPSBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gXCJiXCIraVxuICAgIH0pLmpvaW4oXCIsXCIpXG4gIHZhciBzdHJpZGVBcmcgPSBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gXCJjXCIraVxuICAgIH0pLmpvaW4oXCIsXCIpXG4gIGNvZGUucHVzaChcbiAgICBcImZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIihhLFwiICsgc2hhcGVBcmcgKyBcIixcIiArIHN0cmlkZUFyZyArIFwiLGQpe3RoaXMuZGF0YT1hXCIsXG4gICAgICBcInRoaXMuc2hhcGU9W1wiICsgc2hhcGVBcmcgKyBcIl1cIixcbiAgICAgIFwidGhpcy5zdHJpZGU9W1wiICsgc3RyaWRlQXJnICsgXCJdXCIsXG4gICAgICBcInRoaXMub2Zmc2V0PWR8MH1cIixcbiAgICBcInZhciBwcm90bz1cIitjbGFzc05hbWUrXCIucHJvdG90eXBlXCIsXG4gICAgXCJwcm90by5kdHlwZT0nXCIrZHR5cGUrXCInXCIsXG4gICAgXCJwcm90by5kaW1lbnNpb249XCIrZGltZW5zaW9uKVxuXG4gIC8vdmlldy5zaXplOlxuICBjb2RlLnB1c2goXCJPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sJ3NpemUnLHtnZXQ6ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX3NpemUoKXtcXFxucmV0dXJuIFwiK2luZGljZXMubWFwKGZ1bmN0aW9uKGkpIHsgcmV0dXJuIFwidGhpcy5zaGFwZVtcIitpK1wiXVwiIH0pLmpvaW4oXCIqXCIpLFxuXCJ9fSlcIilcblxuICAvL3ZpZXcub3JkZXI6XG4gIGlmKGRpbWVuc2lvbiA9PT0gMSkge1xuICAgIGNvZGUucHVzaChcInByb3RvLm9yZGVyPVswXVwiKVxuICB9IGVsc2Uge1xuICAgIGNvZGUucHVzaChcIk9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywnb3JkZXInLHtnZXQ6XCIpXG4gICAgaWYoZGltZW5zaW9uIDwgNCkge1xuICAgICAgY29kZS5wdXNoKFwiZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX29yZGVyKCl7XCIpXG4gICAgICBpZihkaW1lbnNpb24gPT09IDIpIHtcbiAgICAgICAgY29kZS5wdXNoKFwicmV0dXJuIChNYXRoLmFicyh0aGlzLnN0cmlkZVswXSk+TWF0aC5hYnModGhpcy5zdHJpZGVbMV0pKT9bMSwwXTpbMCwxXX19KVwiKVxuICAgICAgfSBlbHNlIGlmKGRpbWVuc2lvbiA9PT0gMykge1xuICAgICAgICBjb2RlLnB1c2goXG5cInZhciBzMD1NYXRoLmFicyh0aGlzLnN0cmlkZVswXSksczE9TWF0aC5hYnModGhpcy5zdHJpZGVbMV0pLHMyPU1hdGguYWJzKHRoaXMuc3RyaWRlWzJdKTtcXFxuaWYoczA+czEpe1xcXG5pZihzMT5zMil7XFxcbnJldHVybiBbMiwxLDBdO1xcXG59ZWxzZSBpZihzMD5zMil7XFxcbnJldHVybiBbMSwyLDBdO1xcXG59ZWxzZXtcXFxucmV0dXJuIFsxLDAsMl07XFxcbn1cXFxufWVsc2UgaWYoczA+czIpe1xcXG5yZXR1cm4gWzIsMCwxXTtcXFxufWVsc2UgaWYoczI+czEpe1xcXG5yZXR1cm4gWzAsMSwyXTtcXFxufWVsc2V7XFxcbnJldHVybiBbMCwyLDFdO1xcXG59fX0pXCIpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZGUucHVzaChcIk9SREVSfSlcIilcbiAgICB9XG4gIH1cblxuICAvL3ZpZXcuc2V0KGkwLCAuLi4sIHYpOlxuICBjb2RlLnB1c2goXG5cInByb3RvLnNldD1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfc2V0KFwiK2FyZ3Muam9pbihcIixcIikrXCIsdil7XCIpXG4gIGlmKHVzZUdldHRlcnMpIHtcbiAgICBjb2RlLnB1c2goXCJyZXR1cm4gdGhpcy5kYXRhLnNldChcIitpbmRleF9zdHIrXCIsdil9XCIpXG4gIH0gZWxzZSB7XG4gICAgY29kZS5wdXNoKFwicmV0dXJuIHRoaXMuZGF0YVtcIitpbmRleF9zdHIrXCJdPXZ9XCIpXG4gIH1cblxuICAvL3ZpZXcuZ2V0KGkwLCAuLi4pOlxuICBjb2RlLnB1c2goXCJwcm90by5nZXQ9ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX2dldChcIithcmdzLmpvaW4oXCIsXCIpK1wiKXtcIilcbiAgaWYodXNlR2V0dGVycykge1xuICAgIGNvZGUucHVzaChcInJldHVybiB0aGlzLmRhdGEuZ2V0KFwiK2luZGV4X3N0citcIil9XCIpXG4gIH0gZWxzZSB7XG4gICAgY29kZS5wdXNoKFwicmV0dXJuIHRoaXMuZGF0YVtcIitpbmRleF9zdHIrXCJdfVwiKVxuICB9XG5cbiAgLy92aWV3LmluZGV4OlxuICBjb2RlLnB1c2goXG4gICAgXCJwcm90by5pbmRleD1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfaW5kZXgoXCIsIGFyZ3Muam9pbigpLCBcIil7cmV0dXJuIFwiK2luZGV4X3N0citcIn1cIilcblxuICAvL3ZpZXcuaGkoKTpcbiAgY29kZS5wdXNoKFwicHJvdG8uaGk9ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX2hpKFwiK2FyZ3Muam9pbihcIixcIikrXCIpe3JldHVybiBuZXcgXCIrY2xhc3NOYW1lK1wiKHRoaXMuZGF0YSxcIitcbiAgICBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gW1wiKHR5cGVvZiBpXCIsaSxcIiE9PSdudW1iZXInfHxpXCIsaSxcIjwwKT90aGlzLnNoYXBlW1wiLCBpLCBcIl06aVwiLCBpLFwifDBcIl0uam9pbihcIlwiKVxuICAgIH0pLmpvaW4oXCIsXCIpK1wiLFwiK1xuICAgIGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBcInRoaXMuc3RyaWRlW1wiK2kgKyBcIl1cIlxuICAgIH0pLmpvaW4oXCIsXCIpK1wiLHRoaXMub2Zmc2V0KX1cIilcblxuICAvL3ZpZXcubG8oKTpcbiAgdmFyIGFfdmFycyA9IGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHsgcmV0dXJuIFwiYVwiK2krXCI9dGhpcy5zaGFwZVtcIitpK1wiXVwiIH0pXG4gIHZhciBjX3ZhcnMgPSBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7IHJldHVybiBcImNcIitpK1wiPXRoaXMuc3RyaWRlW1wiK2krXCJdXCIgfSlcbiAgY29kZS5wdXNoKFwicHJvdG8ubG89ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX2xvKFwiK2FyZ3Muam9pbihcIixcIikrXCIpe3ZhciBiPXRoaXMub2Zmc2V0LGQ9MCxcIithX3ZhcnMuam9pbihcIixcIikrXCIsXCIrY192YXJzLmpvaW4oXCIsXCIpKVxuICBmb3IodmFyIGk9MDsgaTxkaW1lbnNpb247ICsraSkge1xuICAgIGNvZGUucHVzaChcblwiaWYodHlwZW9mIGlcIitpK1wiPT09J251bWJlcicmJmlcIitpK1wiPj0wKXtcXFxuZD1pXCIraStcInwwO1xcXG5iKz1jXCIraStcIipkO1xcXG5hXCIraStcIi09ZH1cIilcbiAgfVxuICBjb2RlLnB1c2goXCJyZXR1cm4gbmV3IFwiK2NsYXNzTmFtZStcIih0aGlzLmRhdGEsXCIrXG4gICAgaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFwiYVwiK2lcbiAgICB9KS5qb2luKFwiLFwiKStcIixcIitcbiAgICBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gXCJjXCIraVxuICAgIH0pLmpvaW4oXCIsXCIpK1wiLGIpfVwiKVxuXG4gIC8vdmlldy5zdGVwKCk6XG4gIGNvZGUucHVzaChcInByb3RvLnN0ZXA9ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX3N0ZXAoXCIrYXJncy5qb2luKFwiLFwiKStcIil7dmFyIFwiK1xuICAgIGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBcImFcIitpK1wiPXRoaXMuc2hhcGVbXCIraStcIl1cIlxuICAgIH0pLmpvaW4oXCIsXCIpK1wiLFwiK1xuICAgIGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBcImJcIitpK1wiPXRoaXMuc3RyaWRlW1wiK2krXCJdXCJcbiAgICB9KS5qb2luKFwiLFwiKStcIixjPXRoaXMub2Zmc2V0LGQ9MCxjZWlsPU1hdGguY2VpbFwiKVxuICBmb3IodmFyIGk9MDsgaTxkaW1lbnNpb247ICsraSkge1xuICAgIGNvZGUucHVzaChcblwiaWYodHlwZW9mIGlcIitpK1wiPT09J251bWJlcicpe1xcXG5kPWlcIitpK1wifDA7XFxcbmlmKGQ8MCl7XFxcbmMrPWJcIitpK1wiKihhXCIraStcIi0xKTtcXFxuYVwiK2krXCI9Y2VpbCgtYVwiK2krXCIvZClcXFxufWVsc2V7XFxcbmFcIitpK1wiPWNlaWwoYVwiK2krXCIvZClcXFxufVxcXG5iXCIraStcIio9ZFxcXG59XCIpXG4gIH1cbiAgY29kZS5wdXNoKFwicmV0dXJuIG5ldyBcIitjbGFzc05hbWUrXCIodGhpcy5kYXRhLFwiK1xuICAgIGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBcImFcIiArIGlcbiAgICB9KS5qb2luKFwiLFwiKStcIixcIitcbiAgICBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gXCJiXCIgKyBpXG4gICAgfSkuam9pbihcIixcIikrXCIsYyl9XCIpXG5cbiAgLy92aWV3LnRyYW5zcG9zZSgpOlxuICB2YXIgdFNoYXBlID0gbmV3IEFycmF5KGRpbWVuc2lvbilcbiAgdmFyIHRTdHJpZGUgPSBuZXcgQXJyYXkoZGltZW5zaW9uKVxuICBmb3IodmFyIGk9MDsgaTxkaW1lbnNpb247ICsraSkge1xuICAgIHRTaGFwZVtpXSA9IFwiYVtpXCIraStcIl1cIlxuICAgIHRTdHJpZGVbaV0gPSBcImJbaVwiK2krXCJdXCJcbiAgfVxuICBjb2RlLnB1c2goXCJwcm90by50cmFuc3Bvc2U9ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX3RyYW5zcG9zZShcIithcmdzK1wiKXtcIitcbiAgICBhcmdzLm1hcChmdW5jdGlvbihuLGlkeCkgeyByZXR1cm4gbiArIFwiPShcIiArIG4gKyBcIj09PXVuZGVmaW5lZD9cIiArIGlkeCArIFwiOlwiICsgbiArIFwifDApXCJ9KS5qb2luKFwiO1wiKSxcbiAgICBcInZhciBhPXRoaXMuc2hhcGUsYj10aGlzLnN0cmlkZTtyZXR1cm4gbmV3IFwiK2NsYXNzTmFtZStcIih0aGlzLmRhdGEsXCIrdFNoYXBlLmpvaW4oXCIsXCIpK1wiLFwiK3RTdHJpZGUuam9pbihcIixcIikrXCIsdGhpcy5vZmZzZXQpfVwiKVxuXG4gIC8vdmlldy5waWNrKCk6XG4gIGNvZGUucHVzaChcInByb3RvLnBpY2s9ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX3BpY2soXCIrYXJncytcIil7dmFyIGE9W10sYj1bXSxjPXRoaXMub2Zmc2V0XCIpXG4gIGZvcih2YXIgaT0wOyBpPGRpbWVuc2lvbjsgKytpKSB7XG4gICAgY29kZS5wdXNoKFwiaWYodHlwZW9mIGlcIitpK1wiPT09J251bWJlcicmJmlcIitpK1wiPj0wKXtjPShjK3RoaXMuc3RyaWRlW1wiK2krXCJdKmlcIitpK1wiKXwwfWVsc2V7YS5wdXNoKHRoaXMuc2hhcGVbXCIraStcIl0pO2IucHVzaCh0aGlzLnN0cmlkZVtcIitpK1wiXSl9XCIpXG4gIH1cbiAgY29kZS5wdXNoKFwidmFyIGN0b3I9Q1RPUl9MSVNUW2EubGVuZ3RoKzFdO3JldHVybiBjdG9yKHRoaXMuZGF0YSxhLGIsYyl9XCIpXG5cbiAgLy9BZGQgcmV0dXJuIHN0YXRlbWVudFxuICBjb2RlLnB1c2goXCJyZXR1cm4gZnVuY3Rpb24gY29uc3RydWN0X1wiK2NsYXNzTmFtZStcIihkYXRhLHNoYXBlLHN0cmlkZSxvZmZzZXQpe3JldHVybiBuZXcgXCIrY2xhc3NOYW1lK1wiKGRhdGEsXCIrXG4gICAgaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFwic2hhcGVbXCIraStcIl1cIlxuICAgIH0pLmpvaW4oXCIsXCIpK1wiLFwiK1xuICAgIGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBcInN0cmlkZVtcIitpK1wiXVwiXG4gICAgfSkuam9pbihcIixcIikrXCIsb2Zmc2V0KX1cIilcblxuICAvL0NvbXBpbGUgcHJvY2VkdXJlXG4gIHZhciBwcm9jZWR1cmUgPSBuZXcgRnVuY3Rpb24oXCJDVE9SX0xJU1RcIiwgXCJPUkRFUlwiLCBjb2RlLmpvaW4oXCJcXG5cIikpXG4gIHJldHVybiBwcm9jZWR1cmUoQ0FDSEVEX0NPTlNUUlVDVE9SU1tkdHlwZV0sIG9yZGVyKVxufVxuXG5mdW5jdGlvbiBhcnJheURUeXBlKGRhdGEpIHtcbiAgaWYoaXNCdWZmZXIoZGF0YSkpIHtcbiAgICByZXR1cm4gXCJidWZmZXJcIlxuICB9XG4gIGlmKGhhc1R5cGVkQXJyYXlzKSB7XG4gICAgc3dpdGNoKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChkYXRhKSkge1xuICAgICAgY2FzZSBcIltvYmplY3QgRmxvYXQ2NEFycmF5XVwiOlxuICAgICAgICByZXR1cm4gXCJmbG9hdDY0XCJcbiAgICAgIGNhc2UgXCJbb2JqZWN0IEZsb2F0MzJBcnJheV1cIjpcbiAgICAgICAgcmV0dXJuIFwiZmxvYXQzMlwiXG4gICAgICBjYXNlIFwiW29iamVjdCBJbnQ4QXJyYXldXCI6XG4gICAgICAgIHJldHVybiBcImludDhcIlxuICAgICAgY2FzZSBcIltvYmplY3QgSW50MTZBcnJheV1cIjpcbiAgICAgICAgcmV0dXJuIFwiaW50MTZcIlxuICAgICAgY2FzZSBcIltvYmplY3QgSW50MzJBcnJheV1cIjpcbiAgICAgICAgcmV0dXJuIFwiaW50MzJcIlxuICAgICAgY2FzZSBcIltvYmplY3QgVWludDhBcnJheV1cIjpcbiAgICAgICAgcmV0dXJuIFwidWludDhcIlxuICAgICAgY2FzZSBcIltvYmplY3QgVWludDE2QXJyYXldXCI6XG4gICAgICAgIHJldHVybiBcInVpbnQxNlwiXG4gICAgICBjYXNlIFwiW29iamVjdCBVaW50MzJBcnJheV1cIjpcbiAgICAgICAgcmV0dXJuIFwidWludDMyXCJcbiAgICAgIGNhc2UgXCJbb2JqZWN0IFVpbnQ4Q2xhbXBlZEFycmF5XVwiOlxuICAgICAgICByZXR1cm4gXCJ1aW50OF9jbGFtcGVkXCJcbiAgICB9XG4gIH1cbiAgaWYoQXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgIHJldHVybiBcImFycmF5XCJcbiAgfVxuICByZXR1cm4gXCJnZW5lcmljXCJcbn1cblxudmFyIENBQ0hFRF9DT05TVFJVQ1RPUlMgPSB7XG4gIFwiZmxvYXQzMlwiOltdLFxuICBcImZsb2F0NjRcIjpbXSxcbiAgXCJpbnQ4XCI6W10sXG4gIFwiaW50MTZcIjpbXSxcbiAgXCJpbnQzMlwiOltdLFxuICBcInVpbnQ4XCI6W10sXG4gIFwidWludDE2XCI6W10sXG4gIFwidWludDMyXCI6W10sXG4gIFwiYXJyYXlcIjpbXSxcbiAgXCJ1aW50OF9jbGFtcGVkXCI6W10sXG4gIFwiYnVmZmVyXCI6W10sXG4gIFwiZ2VuZXJpY1wiOltdXG59XG5cbjsoZnVuY3Rpb24oKSB7XG4gIGZvcih2YXIgaWQgaW4gQ0FDSEVEX0NPTlNUUlVDVE9SUykge1xuICAgIENBQ0hFRF9DT05TVFJVQ1RPUlNbaWRdLnB1c2goY29tcGlsZUNvbnN0cnVjdG9yKGlkLCAtMSkpXG4gIH1cbn0pO1xuXG5mdW5jdGlvbiB3cmFwcGVkTkRBcnJheUN0b3IoZGF0YSwgc2hhcGUsIHN0cmlkZSwgb2Zmc2V0KSB7XG4gIGlmKGRhdGEgPT09IHVuZGVmaW5lZCkge1xuICAgIHZhciBjdG9yID0gQ0FDSEVEX0NPTlNUUlVDVE9SUy5hcnJheVswXVxuICAgIHJldHVybiBjdG9yKFtdKVxuICB9IGVsc2UgaWYodHlwZW9mIGRhdGEgPT09IFwibnVtYmVyXCIpIHtcbiAgICBkYXRhID0gW2RhdGFdXG4gIH1cbiAgaWYoc2hhcGUgPT09IHVuZGVmaW5lZCkge1xuICAgIHNoYXBlID0gWyBkYXRhLmxlbmd0aCBdXG4gIH1cbiAgdmFyIGQgPSBzaGFwZS5sZW5ndGhcbiAgaWYoc3RyaWRlID09PSB1bmRlZmluZWQpIHtcbiAgICBzdHJpZGUgPSBuZXcgQXJyYXkoZClcbiAgICBmb3IodmFyIGk9ZC0xLCBzej0xOyBpPj0wOyAtLWkpIHtcbiAgICAgIHN0cmlkZVtpXSA9IHN6XG4gICAgICBzeiAqPSBzaGFwZVtpXVxuICAgIH1cbiAgfVxuICBpZihvZmZzZXQgPT09IHVuZGVmaW5lZCkge1xuICAgIG9mZnNldCA9IDBcbiAgICBmb3IodmFyIGk9MDsgaTxkOyArK2kpIHtcbiAgICAgIGlmKHN0cmlkZVtpXSA8IDApIHtcbiAgICAgICAgb2Zmc2V0IC09IChzaGFwZVtpXS0xKSpzdHJpZGVbaV1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgdmFyIGR0eXBlID0gYXJyYXlEVHlwZShkYXRhKVxuICB2YXIgY3Rvcl9saXN0ID0gQ0FDSEVEX0NPTlNUUlVDVE9SU1tkdHlwZV1cbiAgd2hpbGUoY3Rvcl9saXN0Lmxlbmd0aCA8PSBkKzEpIHtcbiAgICBjdG9yX2xpc3QucHVzaChjb21waWxlQ29uc3RydWN0b3IoZHR5cGUsIGN0b3JfbGlzdC5sZW5ndGgtMSkpXG4gIH1cbiAgdmFyIGN0b3IgPSBjdG9yX2xpc3RbZCsxXVxuICByZXR1cm4gY3RvcihkYXRhLCBzaGFwZSwgc3RyaWRlLCBvZmZzZXQpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gd3JhcHBlZE5EQXJyYXlDdG9yXG4iLCIvKipcbiAqIERldGVybWluZSBpZiBhbiBvYmplY3QgaXMgQnVmZmVyXG4gKlxuICogQXV0aG9yOiAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBMaWNlbnNlOiAgTUlUXG4gKlxuICogYG5wbSBpbnN0YWxsIGlzLWJ1ZmZlcmBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuICEhKG9iaiAhPSBudWxsICYmXG4gICAgKG9iai5faXNCdWZmZXIgfHwgLy8gRm9yIFNhZmFyaSA1LTcgKG1pc3NpbmcgT2JqZWN0LnByb3RvdHlwZS5jb25zdHJ1Y3RvcilcbiAgICAgIChvYmouY29uc3RydWN0b3IgJiZcbiAgICAgIHR5cGVvZiBvYmouY29uc3RydWN0b3IuaXNCdWZmZXIgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgIG9iai5jb25zdHJ1Y3Rvci5pc0J1ZmZlcihvYmopKVxuICAgICkpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwb2ludCwgdnMpIHtcbiAgICAvLyByYXktY2FzdGluZyBhbGdvcml0aG0gYmFzZWQgb25cbiAgICAvLyBodHRwOi8vd3d3LmVjc2UucnBpLmVkdS9Ib21lcGFnZXMvd3JmL1Jlc2VhcmNoL1Nob3J0X05vdGVzL3BucG9seS5odG1sXG4gICAgXG4gICAgdmFyIHggPSBwb2ludFswXSwgeSA9IHBvaW50WzFdO1xuICAgIFxuICAgIHZhciBpbnNpZGUgPSBmYWxzZTtcbiAgICBmb3IgKHZhciBpID0gMCwgaiA9IHZzLmxlbmd0aCAtIDE7IGkgPCB2cy5sZW5ndGg7IGogPSBpKyspIHtcbiAgICAgICAgdmFyIHhpID0gdnNbaV1bMF0sIHlpID0gdnNbaV1bMV07XG4gICAgICAgIHZhciB4aiA9IHZzW2pdWzBdLCB5aiA9IHZzW2pdWzFdO1xuICAgICAgICBcbiAgICAgICAgdmFyIGludGVyc2VjdCA9ICgoeWkgPiB5KSAhPSAoeWogPiB5KSlcbiAgICAgICAgICAgICYmICh4IDwgKHhqIC0geGkpICogKHkgLSB5aSkgLyAoeWogLSB5aSkgKyB4aSk7XG4gICAgICAgIGlmIChpbnRlcnNlY3QpIGluc2lkZSA9ICFpbnNpZGU7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBpbnNpZGU7XG59O1xuIiwiLyoqXG4gKiBAYXV0aG9yIG1yZG9vYiAvIGh0dHA6Ly9tcmRvb2IuY29tL1xuICovXG5cbnZhciBTdGF0cyA9IGZ1bmN0aW9uICgpIHtcblxuXHR2YXIgc3RhcnRUaW1lID0gRGF0ZS5ub3coKSwgcHJldlRpbWUgPSBzdGFydFRpbWU7XG5cdHZhciBtcyA9IDAsIG1zTWluID0gSW5maW5pdHksIG1zTWF4ID0gMDtcblx0dmFyIGZwcyA9IDAsIGZwc01pbiA9IEluZmluaXR5LCBmcHNNYXggPSAwO1xuXHR2YXIgZnJhbWVzID0gMCwgbW9kZSA9IDA7XG5cblx0dmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG5cdGNvbnRhaW5lci5pZCA9ICdzdGF0cyc7XG5cdGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCAnbW91c2Vkb3duJywgZnVuY3Rpb24gKCBldmVudCApIHsgZXZlbnQucHJldmVudERlZmF1bHQoKTsgc2V0TW9kZSggKysgbW9kZSAlIDIgKSB9LCBmYWxzZSApO1xuXHRjb250YWluZXIuc3R5bGUuY3NzVGV4dCA9ICd3aWR0aDo4MHB4O29wYWNpdHk6MC45O2N1cnNvcjpwb2ludGVyJztcblxuXHR2YXIgZnBzRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0ZnBzRGl2LmlkID0gJ2Zwcyc7XG5cdGZwc0Rpdi5zdHlsZS5jc3NUZXh0ID0gJ3BhZGRpbmc6MCAwIDNweCAzcHg7dGV4dC1hbGlnbjpsZWZ0O2JhY2tncm91bmQtY29sb3I6IzAwMic7XG5cdGNvbnRhaW5lci5hcHBlbmRDaGlsZCggZnBzRGl2ICk7XG5cblx0dmFyIGZwc1RleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuXHRmcHNUZXh0LmlkID0gJ2Zwc1RleHQnO1xuXHRmcHNUZXh0LnN0eWxlLmNzc1RleHQgPSAnY29sb3I6IzBmZjtmb250LWZhbWlseTpIZWx2ZXRpY2EsQXJpYWwsc2Fucy1zZXJpZjtmb250LXNpemU6OXB4O2ZvbnQtd2VpZ2h0OmJvbGQ7bGluZS1oZWlnaHQ6MTVweCc7XG5cdGZwc1RleHQuaW5uZXJIVE1MID0gJ0ZQUyc7XG5cdGZwc0Rpdi5hcHBlbmRDaGlsZCggZnBzVGV4dCApO1xuXG5cdHZhciBmcHNHcmFwaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG5cdGZwc0dyYXBoLmlkID0gJ2Zwc0dyYXBoJztcblx0ZnBzR3JhcGguc3R5bGUuY3NzVGV4dCA9ICdwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDo3NHB4O2hlaWdodDozMHB4O2JhY2tncm91bmQtY29sb3I6IzBmZic7XG5cdGZwc0Rpdi5hcHBlbmRDaGlsZCggZnBzR3JhcGggKTtcblxuXHR3aGlsZSAoIGZwc0dyYXBoLmNoaWxkcmVuLmxlbmd0aCA8IDc0ICkge1xuXG5cdFx0dmFyIGJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdzcGFuJyApO1xuXHRcdGJhci5zdHlsZS5jc3NUZXh0ID0gJ3dpZHRoOjFweDtoZWlnaHQ6MzBweDtmbG9hdDpsZWZ0O2JhY2tncm91bmQtY29sb3I6IzExMyc7XG5cdFx0ZnBzR3JhcGguYXBwZW5kQ2hpbGQoIGJhciApO1xuXG5cdH1cblxuXHR2YXIgbXNEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuXHRtc0Rpdi5pZCA9ICdtcyc7XG5cdG1zRGl2LnN0eWxlLmNzc1RleHQgPSAncGFkZGluZzowIDAgM3B4IDNweDt0ZXh0LWFsaWduOmxlZnQ7YmFja2dyb3VuZC1jb2xvcjojMDIwO2Rpc3BsYXk6bm9uZSc7XG5cdGNvbnRhaW5lci5hcHBlbmRDaGlsZCggbXNEaXYgKTtcblxuXHR2YXIgbXNUZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0bXNUZXh0LmlkID0gJ21zVGV4dCc7XG5cdG1zVGV4dC5zdHlsZS5jc3NUZXh0ID0gJ2NvbG9yOiMwZjA7Zm9udC1mYW1pbHk6SGVsdmV0aWNhLEFyaWFsLHNhbnMtc2VyaWY7Zm9udC1zaXplOjlweDtmb250LXdlaWdodDpib2xkO2xpbmUtaGVpZ2h0OjE1cHgnO1xuXHRtc1RleHQuaW5uZXJIVE1MID0gJ01TJztcblx0bXNEaXYuYXBwZW5kQ2hpbGQoIG1zVGV4dCApO1xuXG5cdHZhciBtc0dyYXBoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0bXNHcmFwaC5pZCA9ICdtc0dyYXBoJztcblx0bXNHcmFwaC5zdHlsZS5jc3NUZXh0ID0gJ3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjc0cHg7aGVpZ2h0OjMwcHg7YmFja2dyb3VuZC1jb2xvcjojMGYwJztcblx0bXNEaXYuYXBwZW5kQ2hpbGQoIG1zR3JhcGggKTtcblxuXHR3aGlsZSAoIG1zR3JhcGguY2hpbGRyZW4ubGVuZ3RoIDwgNzQgKSB7XG5cblx0XHR2YXIgYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ3NwYW4nICk7XG5cdFx0YmFyLnN0eWxlLmNzc1RleHQgPSAnd2lkdGg6MXB4O2hlaWdodDozMHB4O2Zsb2F0OmxlZnQ7YmFja2dyb3VuZC1jb2xvcjojMTMxJztcblx0XHRtc0dyYXBoLmFwcGVuZENoaWxkKCBiYXIgKTtcblxuXHR9XG5cblx0dmFyIHNldE1vZGUgPSBmdW5jdGlvbiAoIHZhbHVlICkge1xuXG5cdFx0bW9kZSA9IHZhbHVlO1xuXG5cdFx0c3dpdGNoICggbW9kZSApIHtcblxuXHRcdFx0Y2FzZSAwOlxuXHRcdFx0XHRmcHNEaXYuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cdFx0XHRcdG1zRGl2LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHRmcHNEaXYuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0XHRcdFx0bXNEaXYuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdH1cblxuXHR9O1xuXG5cdHZhciB1cGRhdGVHcmFwaCA9IGZ1bmN0aW9uICggZG9tLCB2YWx1ZSApIHtcblxuXHRcdHZhciBjaGlsZCA9IGRvbS5hcHBlbmRDaGlsZCggZG9tLmZpcnN0Q2hpbGQgKTtcblx0XHRjaGlsZC5zdHlsZS5oZWlnaHQgPSB2YWx1ZSArICdweCc7XG5cblx0fTtcblxuXHRyZXR1cm4ge1xuXG5cdFx0UkVWSVNJT046IDEyLFxuXG5cdFx0ZG9tRWxlbWVudDogY29udGFpbmVyLFxuXG5cdFx0c2V0TW9kZTogc2V0TW9kZSxcblxuXHRcdGJlZ2luOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRcdHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cblx0XHR9LFxuXG5cdFx0ZW5kOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRcdHZhciB0aW1lID0gRGF0ZS5ub3coKTtcblxuXHRcdFx0bXMgPSB0aW1lIC0gc3RhcnRUaW1lO1xuXHRcdFx0bXNNaW4gPSBNYXRoLm1pbiggbXNNaW4sIG1zICk7XG5cdFx0XHRtc01heCA9IE1hdGgubWF4KCBtc01heCwgbXMgKTtcblxuXHRcdFx0bXNUZXh0LnRleHRDb250ZW50ID0gbXMgKyAnIE1TICgnICsgbXNNaW4gKyAnLScgKyBtc01heCArICcpJztcblx0XHRcdHVwZGF0ZUdyYXBoKCBtc0dyYXBoLCBNYXRoLm1pbiggMzAsIDMwIC0gKCBtcyAvIDIwMCApICogMzAgKSApO1xuXG5cdFx0XHRmcmFtZXMgKys7XG5cblx0XHRcdGlmICggdGltZSA+IHByZXZUaW1lICsgMTAwMCApIHtcblxuXHRcdFx0XHRmcHMgPSBNYXRoLnJvdW5kKCAoIGZyYW1lcyAqIDEwMDAgKSAvICggdGltZSAtIHByZXZUaW1lICkgKTtcblx0XHRcdFx0ZnBzTWluID0gTWF0aC5taW4oIGZwc01pbiwgZnBzICk7XG5cdFx0XHRcdGZwc01heCA9IE1hdGgubWF4KCBmcHNNYXgsIGZwcyApO1xuXG5cdFx0XHRcdGZwc1RleHQudGV4dENvbnRlbnQgPSBmcHMgKyAnIEZQUyAoJyArIGZwc01pbiArICctJyArIGZwc01heCArICcpJztcblx0XHRcdFx0dXBkYXRlR3JhcGgoIGZwc0dyYXBoLCBNYXRoLm1pbiggMzAsIDMwIC0gKCBmcHMgLyAxMDAgKSAqIDMwICkgKTtcblxuXHRcdFx0XHRwcmV2VGltZSA9IHRpbWU7XG5cdFx0XHRcdGZyYW1lcyA9IDA7XG5cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRpbWU7XG5cblx0XHR9LFxuXG5cdFx0dXBkYXRlOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRcdHN0YXJ0VGltZSA9IHRoaXMuZW5kKCk7XG5cblx0XHR9XG5cblx0fVxuXG59O1xuXG5pZiAoIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICkge1xuXG5cdG1vZHVsZS5leHBvcnRzID0gU3RhdHM7XG5cbn0iLCJ2YXIgVEhSRUUgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snVEhSRUUnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ1RIUkVFJ10gOiBudWxsKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcHApIHtcbiAgdmFyIHNjZW5lID0gYXBwLmdldCgnc2NlbmUnKTtcblxuICB2YXIgb2JqZWN0ID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG5cbiAgdmFyIGVkaXRvciA9IGFwcC5hdHRhY2gob2JqZWN0LCByZXF1aXJlKCcuLi9lZGl0b3IvZWRpdG9yJykpO1xuXG4gIHNjZW5lLmFkZChvYmplY3QpO1xuXG4gIHJldHVybiBvYmplY3Q7XG59OyIsInZhciBuZGFycmF5ID0gcmVxdWlyZSgnbmRhcnJheScpO1xudmFyIFRIUkVFID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ1RIUkVFJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydUSFJFRSddIDogbnVsbCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXBwKSB7XG4gIHZhciBzY2VuZSA9IGFwcC5nZXQoJ3NjZW5lJyk7XG4gIHZhciBjYW1lcmEgPSBhcHAuZ2V0KCdjYW1lcmEnKTtcblxuICB2YXIgb2JqZWN0ID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gIHZhciBibG9ja3MgPSBhcHAuYXR0YWNoKG9iamVjdCwgcmVxdWlyZSgnLi4vY29tcG9uZW50cy9ibG9ja3MnKSk7XG5cbiAgdmFyIGRpbSA9IFszMiwgMzIsIDMyXTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGRpbVswXTsgaSsrKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBkaW1bMV07IGorKykge1xuICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBkaW1bMl07IGsrKykge1xuICAgICAgICBibG9ja3Muc2V0KGksIGosIGssIDEpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGJsb2Nrcy5vZmZzZXQuc2V0KC0xNiwgLTE2LCAtMTYpO1xuICBibG9ja3MudXBkYXRlTWVzaCgpO1xuXG4gIHZhciByaWdpZEJvZHkgPSBhcHAuYXR0YWNoKG9iamVjdCwgcmVxdWlyZSgnLi4vY29tcG9uZW50cy9yaWdpZGJvZHknKSk7XG4gIHJpZ2lkQm9keS5jb2xsaXNpb25PYmplY3QgPSBibG9ja3Mub2JqZWN0O1xuICByaWdpZEJvZHkuaXNGaXh0dXJlID0gdHJ1ZTtcbiAgXG4gIHNjZW5lLmFkZChvYmplY3QpO1xufTsiLCJ2YXIgVEhSRUUgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snVEhSRUUnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ1RIUkVFJ10gOiBudWxsKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcHApIHtcbiAgdmFyIHNjZW5lID0gYXBwLmdldCgnc2NlbmUnKTtcblxuICB2YXIgb2JqZWN0ID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gIHZhciBjaGFyYWN0ZXIgPSBhcHAuYXR0YWNoKG9iamVjdCwgcmVxdWlyZSgnLi4vY29tcG9uZW50cy9jaGFyYWN0ZXInKSk7XG4gIHZhciByaWdpZEJvZHkgPSBhcHAuYXR0YWNoKG9iamVjdCwgcmVxdWlyZSgnLi4vY29tcG9uZW50cy9yaWdpZGJvZHknKSk7XG4gIHJpZ2lkQm9keS5tYXNzID0gMTtcbiAgdmFyIHBsYXllckNvbnRyb2wgPSBhcHAuYXR0YWNoKG9iamVjdCwgcmVxdWlyZSgnLi4vY29tcG9uZW50cy9wbGF5ZXJjb250cm9sJykpO1xuXG4gIGNoYXJhY3Rlci5yaWdpZEJvZHkgPSByaWdpZEJvZHk7XG4gIHBsYXllckNvbnRyb2wuY2hhcmFjdGVyID0gY2hhcmFjdGVyO1xuICBwbGF5ZXJDb250cm9sLnJpZ2lkQm9keSA9IHJpZ2lkQm9keTtcblxuICBzY2VuZS5hZGQob2JqZWN0KTtcblxuICBvYmplY3QucG9zaXRpb24uc2V0KDAsIDQwLCAwKTtcblxuICByZXR1cm4gb2JqZWN0O1xufTsiLCJ2YXIgbmRhcnJheSA9IHJlcXVpcmUoJ25kYXJyYXknKTtcbnZhciBtZXNoZXIgPSByZXF1aXJlKCcuLi92b3hlbC9tZXNoZXInKTtcbnZhciBhcnJheVV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMvYXJyYXl1dGlscycpO1xuXG52YXIgQmxvY2tzID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gIHRoaXMub2JqZWN0ID0gb2JqZWN0O1xuICB0aGlzLnR5cGUgPSAnYmxvY2tzJztcblxuICB0aGlzLmRpbSA9IFsxNiwgMTYsIDE2XTtcbiAgdGhpcy5jaHVuayA9IG5kYXJyYXkoW10sIHRoaXMuZGltKTtcblxuICB0aGlzLm1lc2ggPSBudWxsO1xuICB0aGlzLm9iaiA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICB0aGlzLm1hdGVyaWFsID0gbmV3IFRIUkVFLk11bHRpTWF0ZXJpYWwoKTtcblxuICB0aGlzLmRpcnR5ID0gZmFsc2U7XG4gIHRoaXMuZGltTmVlZHNVcGRhdGUgPSBmYWxzZTtcblxuICB0aGlzLm9iamVjdC5hZGQodGhpcy5vYmopO1xuXG4gIHRoaXMucGFsZXR0ZSA9IFtudWxsXTtcblxuICB0aGlzLnVzZXJEYXRhID0ge307XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKHgsIHksIHosIGIpIHtcbiAgdGhpcy5jaHVuay5zZXQoeCwgeSwgeiwgYik7XG4gIHRoaXMuZGlydHkgPSB0cnVlO1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS5zZXRBdENvb3JkID0gZnVuY3Rpb24oY29vcmQsIGIpIHtcbiAgdGhpcy5zZXQoY29vcmQueCwgY29vcmQueSwgY29vcmQueiwgYik7XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKHgsIHksIHopIHtcbiAgcmV0dXJuIHRoaXMuY2h1bmsuZ2V0KHgsIHksIHopO1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS5nZXRBdENvb3JkID0gZnVuY3Rpb24oY29vcmQpIHtcbiAgcmV0dXJuIHRoaXMuZ2V0KGNvb3JkLngsIGNvb3JkLnksIGNvb3JkLnopO1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS5wb2ludFRvQ29vcmQgPSBmdW5jdGlvbihwb2ludCkge1xuICByZXR1cm4gbmV3IFRIUkVFLlZlY3RvcjMocG9pbnQueCAtIDAuNSwgcG9pbnQueSAtIDAuNSwgcG9pbnQueiAtIDAuNSk7XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLmNvb3JkVG9Qb2ludCA9IGZ1bmN0aW9uKGNvb3JkKSB7XG4gIHJldHVybiBuZXcgVEhSRUUuVmVjdG9yMyhjb29yZC54LCBjb29yZC55LCBjb29yZC56KTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5kaW1OZWVkc1VwZGF0ZSkge1xuICAgIHRoaXMuX3VwZGF0ZURpbSgpO1xuICAgIHRoaXMuZGltTmVlZHNVcGRhdGUgPSBmYWxzZTtcbiAgfVxuXG4gIHRoaXMudXBkYXRlTWVzaCgpO1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmNodW5rID0gbmRhcnJheShbXSwgdGhpcy5kaW0pO1xuICB0aGlzLm9iai5yZW1vdmUodGhpcy5tZXNoKTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuc2V0RGltID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgdGhpcy5kaW0gPSB2YWx1ZTtcbiAgdGhpcy5kaW1OZWVkc1VwZGF0ZSA9IHRydWU7XG4gIHRoaXMuZGlydHkgPSB0cnVlO1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS52aXNpdCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIHZhciBzaGFwZSA9IHRoaXMuY2h1bmsuc2hhcGU7XG4gIHZhciBkYXRhID0gdGhpcy5jaHVuay5kYXRhO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHNoYXBlWzBdOyBpKyspIHtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IHNoYXBlWzFdOyBqKyspIHtcbiAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgc2hhcGVbMl07IGsrKykge1xuICAgICAgICB2YXIgYiA9IHRoaXMuY2h1bmsuZ2V0KGksIGosIGspO1xuICAgICAgICBpZiAoISFiKSB7XG4gICAgICAgICAgY2FsbGJhY2soaSwgaiwgaywgYik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuZ2V0QWxsQ29vcmRzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjb29yZHMgPSBbXTtcbiAgdGhpcy52aXNpdChmdW5jdGlvbihpLCBqLCBrKSB7XG4gICAgY29vcmRzLnB1c2gobmV3IFRIUkVFLlZlY3RvcjMoaSwgaiwgaykpO1xuICB9KTtcbiAgcmV0dXJuIGNvb3Jkcztcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUucHJpbnQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy52aXNpdChmdW5jdGlvbihpLCBqLCBrLCBiKSB7XG4gICAgY29uc29sZS5sb2coW2ksIGosIGtdLmpvaW4oJywnKSwgYik7XG4gIH0pO1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS5zZXJpYWxpemUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICBkaW06IHRoaXMuZGltLFxuICAgIGNodW5rRGF0YTogYXJyYXlVdGlscy5jbG9uZSh0aGlzLmNodW5rLmRhdGEpLFxuICAgIHBhbGV0dGU6IHRoaXMucGFsZXR0ZSxcbiAgICB1c2VyRGF0YTogdGhpcy51c2VyRGF0YVxuICB9O1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS5kZXNlcmlhbGl6ZSA9IGZ1bmN0aW9uKGpzb24pIHtcbiAgdGhpcy5kaW0gPSBqc29uLmRpbTtcbiAgdGhpcy5jaHVuayA9IG5kYXJyYXkoW10sIHRoaXMuZGltKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBqc29uLmNodW5rRGF0YS5sZW5ndGg7IGkrKykge1xuICAgIHRoaXMuY2h1bmsuZGF0YVtpXSA9IGpzb24uY2h1bmtEYXRhW2ldO1xuICB9XG5cbiAgdGhpcy5wYWxldHRlID0ganNvbi5wYWxldHRlO1xuXG4gIHRoaXMudXBkYXRlTWF0ZXJpYWwoKTtcblxuICB0aGlzLmRpbU5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgdGhpcy5kaXJ0eSA9IHRydWU7XG5cbiAgdGhpcy51c2VyRGF0YSA9IGpzb24udXNlckRhdGE7XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLnVwZGF0ZU1lc2ggPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuZGlydHkpIHtcbiAgICB0aGlzLl91cGRhdGVNZXNoKCk7XG4gICAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xuICB9XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLl91cGRhdGVNZXNoID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLm1lc2ggIT0gbnVsbCkge1xuICAgIHRoaXMub2JqLnJlbW92ZSh0aGlzLm1lc2gpO1xuICB9XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB2YXIgZGltID0gdGhpcy5kaW07XG5cbiAgdmFyIHJlc3VsdCA9IG1lc2hlcihmdW5jdGlvbihpLCBqLCBrKSB7XG4gICAgcmV0dXJuIHNlbGYuZ2V0KGksIGosIGspO1xuICB9LCBkaW0pO1xuXG4gIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5HZW9tZXRyeSgpO1xuXG4gIHJlc3VsdC52ZXJ0aWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHYpIHtcbiAgICB2YXIgdmVydGljZSA9IG5ldyBUSFJFRS5WZWN0b3IzKFxuICAgICAgdlswXSwgdlsxXSwgdlsyXVxuICAgICk7XG4gICAgZ2VvbWV0cnkudmVydGljZXMucHVzaCh2ZXJ0aWNlKTtcbiAgfSk7XG5cbiAgcmVzdWx0LnN1cmZhY2VzLmZvckVhY2goZnVuY3Rpb24oc3VyZmFjZSkge1xuICAgIHZhciBmID0gc3VyZmFjZS5mYWNlO1xuICAgIHZhciB1diA9IHN1cmZhY2UudXY7XG4gICAgdmFyIGMgPSBmWzRdO1xuXG4gICAgdmFyIGZhY2UgPSBuZXcgVEhSRUUuRmFjZTMoZlswXSwgZlsxXSwgZlsyXSk7XG4gICAgZ2VvbWV0cnkuZmFjZXMucHVzaChmYWNlKTtcbiAgICBnZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdLnB1c2goW3V2WzBdLCB1dlsxXSwgdXZbMl1dKTtcbiAgICBmYWNlLm1hdGVyaWFsSW5kZXggPSBjIC0gMTtcblxuICAgIGZhY2UgPSBuZXcgVEhSRUUuRmFjZTMoZlsyXSwgZlszXSwgZlswXSk7XG4gICAgZ2VvbWV0cnkuZmFjZXMucHVzaChmYWNlKTtcbiAgICBnZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdLnB1c2goW3V2WzJdLCB1dlszXSwgdXZbMF1dKTtcbiAgICBmYWNlLm1hdGVyaWFsSW5kZXggPSBjIC0gMTtcbiAgfSk7XG5cbiAgZ2VvbWV0cnkuY29tcHV0ZUZhY2VOb3JtYWxzKCk7XG5cbiAgdGhpcy5tZXNoID0gbmV3IFRIUkVFLk1lc2goZ2VvbWV0cnksIHRoaXMubWF0ZXJpYWwpO1xuICB0aGlzLm9iai5hZGQodGhpcy5tZXNoKTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuX3VwZGF0ZURpbSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbmV3Q2h1bmsgPSBuZGFycmF5KFtdLCB0aGlzLmRpbSk7XG4gIHZhciBzaGFwZSA9IHRoaXMuY2h1bmsuc2hhcGU7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaGFwZVswXTsgaSsrKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBzaGFwZVsxXTsgaisrKSB7XG4gICAgICBmb3IgKHZhciBrID0gMDsgayA8IHNoYXBlWzJdOyBrKyspIHtcbiAgICAgICAgdmFyIGIgPSB0aGlzLmNodW5rLmdldChpLCBqLCBrKTtcbiAgICAgICAgaWYgKCEhYikge1xuICAgICAgICAgIG5ld0NodW5rLnNldChpLCBqLCBrLCBiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHRoaXMuY2h1bmsgPSBuZXdDaHVuaztcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuZ2V0T3JBZGRDb2xvckluZGV4ID0gZnVuY3Rpb24oY29sb3IpIHtcbiAgLy8gbnVsbCwgMCwgZmFsc2UsIHVuZGVmaW5lZFxuICBpZiAoIWNvbG9yKSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICB2YXIgaW5kZXggPSBhcnJheVV0aWxzLmluZGV4T2YodGhpcy5wYWxldHRlLCBjb2xvcik7XG4gIGlmIChpbmRleCA9PSAtMSkge1xuICAgIHRoaXMucGFsZXR0ZS5wdXNoKGNvbG9yKTtcbiAgICBpbmRleCA9IHRoaXMucGFsZXR0ZS5sZW5ndGggLSAxO1xuICAgIHZhciBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsKHtcbiAgICAgIGNvbG9yOiBuZXcgVEhSRUUuQ29sb3IodGhpcy5wYWxldHRlW2luZGV4XSlcbiAgICB9KTtcbiAgICB0aGlzLm1hdGVyaWFsLm1hdGVyaWFscy5wdXNoKG1hdGVyaWFsKTtcbiAgICByZXR1cm4gdGhpcy5wYWxldHRlLmxlbmd0aCAtIDE7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGluZGV4O1xuICB9XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLnVwZGF0ZU1hdGVyaWFsID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMubWF0ZXJpYWwgPSBuZXcgVEhSRUUuTXVsdGlNYXRlcmlhbCgpO1xuICBmb3IgKHZhciBpID0gMTsgaSA8IHRoaXMucGFsZXR0ZS5sZW5ndGg7IGkrKykge1xuICAgIHZhciBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsKHtcbiAgICAgIGNvbG9yOiBuZXcgVEhSRUUuQ29sb3IodGhpcy5wYWxldHRlW2ldKVxuICAgIH0pO1xuICAgIHRoaXMubWF0ZXJpYWwubWF0ZXJpYWxzLnB1c2gobWF0ZXJpYWwpO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJsb2NrczsiLCJ2YXIgVEhSRUUgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snVEhSRUUnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ1RIUkVFJ10gOiBudWxsKTtcblxudmFyIENoYXJhY3RlciA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICB0aGlzLm9iamVjdCA9IG9iamVjdDtcblxuICB0aGlzLmdlb21ldHJ5ID0gbmV3IFRIUkVFLkJveEdlb21ldHJ5KDEsIDEsIDEpO1xuICB0aGlzLm1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICBjb2xvcjogMHhmZjAwMDBcbiAgfSk7XG5cbiAgdGhpcy5tZXNoID0gbmV3IFRIUkVFLk1lc2godGhpcy5nZW9tZXRyeSwgdGhpcy5tYXRlcmlhbCk7XG4gIHRoaXMub2JqZWN0LmFkZCh0aGlzLm1lc2gpO1xuXG4gIHRoaXMubW92ZVNwZWVkID0gMC41O1xuICB0aGlzLmp1bXBTcGVlZCA9IDAuODtcbiAgdGhpcy5qdW1waW5nID0gZmFsc2U7XG59O1xuXG5DaGFyYWN0ZXIucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5ncmF2aXR5ID0gdGhpcy5yaWdpZEJvZHkuZ3Jhdml0eTtcbiAgaWYgKHRoaXMuanVtcGluZyAmJiB0aGlzLnJpZ2lkQm9keS5ncm91bmRlZCkge1xuICAgIHRoaXMuanVtcGluZyA9IGZhbHNlO1xuICB9XG59O1xuXG5DaGFyYWN0ZXIucHJvdG90eXBlLm1vdmUgPSBmdW5jdGlvbihmb3J3YXJkLCBhbW91bnQpIHtcbiAgdmFyIGdyYXZpdHkgPSB0aGlzLnJpZ2lkQm9keS5ncmF2aXR5O1xuICBpZiAoZ3Jhdml0eSA9PSBudWxsKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICh0aGlzLnJpZ2lkQm9keS5ncm91bmRlZCB8fCB0aGlzLmp1bXBpbmcpIHtcbiAgICB2YXIgdmVydGljYWxTcGVlZCA9IHRoaXMucmlnaWRCb2R5LnZlbG9jaXR5LmNsb25lKCkucHJvamVjdE9uVmVjdG9yKGdyYXZpdHkuZGlyKTtcbiAgICB2YXIgZm9yd2FyZFNwZWVkID0gZm9yd2FyZC5jbG9uZSgpLnNldExlbmd0aChhbW91bnQgKiB0aGlzLm1vdmVTcGVlZCk7XG4gICAgdGhpcy5yaWdpZEJvZHkudmVsb2NpdHkuY29weSh2ZXJ0aWNhbFNwZWVkLmFkZChmb3J3YXJkU3BlZWQpKTtcbiAgfVxufTtcblxuQ2hhcmFjdGVyLnByb3RvdHlwZS5qdW1wID0gZnVuY3Rpb24oYW1vdW50KSB7XG4gIHZhciBncmF2aXR5ID0gdGhpcy5yaWdpZEJvZHkuZ3Jhdml0eTtcbiAgaWYgKGdyYXZpdHkgPT0gbnVsbCkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAodGhpcy5yaWdpZEJvZHkuZ3JvdW5kZWQpIHtcbiAgICB0aGlzLmp1bXBpbmcgPSB0cnVlO1xuICAgIHRoaXMucmlnaWRCb2R5LnZlbG9jaXR5LmNvcHkoZ3Jhdml0eS5kaXIuY2xvbmUoKS5tdWx0aXBseVNjYWxhcigtdGhpcy5qdW1wU3BlZWQpKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDaGFyYWN0ZXI7IiwidmFyIFBsYXllckNhbWVyYSA9IGZ1bmN0aW9uKGNhbWVyYSwgYXBwKSB7XG4gIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuICB0aGlzLmFwcCA9IGFwcDtcblxuICB0aGlzLmNhbWVyYVRpbHQgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21FdWxlcihcbiAgICBuZXcgVEhSRUUuRXVsZXIoLU1hdGguUEkgLyA0LCBNYXRoLlBJIC8gNCwgMCwgJ1lYWicpKTtcblxuICB0aGlzLmNhbWVyYVF1YXQgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICB0aGlzLmNhbWVyYVF1YXRGaW5hbCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbiAgdGhpcy5kaXN0YW5jZSA9IDEwMDtcbiAgdGhpcy50YXJnZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICB0aGlzLnF1YXRlcm5pb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xufTtcblxuUGxheWVyQ2FtZXJhLiRpbmplY3QgPSBbJ2FwcCddO1xuXG5QbGF5ZXJDYW1lcmEucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBsYXllciA9IGFwcC5nZXQoJ3BsYXllcicpO1xuICBpZiAocGxheWVyID09IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgcmlnaWRCb2R5ID0gYXBwLmdldENvbXBvbmVudChwbGF5ZXIsICdyaWdpZEJvZHknKTtcblxuICB2YXIgZ3Jhdml0eURpcjtcbiAgaWYgKHJpZ2lkQm9keS5ncm91bmRlZCkge1xuICAgIGdyYXZpdHlEaXIgPSByaWdpZEJvZHkuZ3Jhdml0eS5kaXIuY2xvbmUoKTtcbiAgfSBlbHNlIHtcbiAgICBncmF2aXR5RGlyID0gcmlnaWRCb2R5LmdyYXZpdHkuZm9yY2VEaXIuY2xvbmUoKTtcbiAgfVxuXG4gIGlmIChncmF2aXR5RGlyLmxlbmd0aCgpID09IDApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgYSA9IGdyYXZpdHlEaXIuY2xvbmUoKS5tdWx0aXBseVNjYWxhcigtMSk7XG5cbiAgdmFyIGRpZmYgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21Vbml0VmVjdG9ycyhcbiAgICBuZXcgVEhSRUUuVmVjdG9yMygwLCAxLCAwKS5hcHBseVF1YXRlcm5pb24odGhpcy5jYW1lcmFRdWF0KSxcbiAgICBhXG4gICk7XG5cbiAgdGhpcy5jYW1lcmFRdWF0Lm11bHRpcGx5UXVhdGVybmlvbnMoZGlmZiwgdGhpcy5jYW1lcmFRdWF0KTtcbiAgdGhpcy5jYW1lcmFRdWF0RmluYWwgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLm11bHRpcGx5UXVhdGVybmlvbnMoXG4gICAgdGhpcy5jYW1lcmFRdWF0LFxuICAgIHRoaXMuY2FtZXJhVGlsdCk7XG5cbiAgdGhpcy5xdWF0ZXJuaW9uLnNsZXJwKHRoaXMuY2FtZXJhUXVhdEZpbmFsLCAwLjEpO1xuXG4gIGxhc3RHcmF2aXR5ID0gZ3Jhdml0eURpcjtcblxuICB0aGlzLnVwZGF0ZUNhbWVyYSgpO1xufTtcblxuUGxheWVyQ2FtZXJhLnByb3RvdHlwZS51cGRhdGVDYW1lcmEgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGRpZmYgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAxKVxuICAgIC5hcHBseVF1YXRlcm5pb24odGhpcy5xdWF0ZXJuaW9uKVxuICAgIC5zZXRMZW5ndGgodGhpcy5kaXN0YW5jZSk7XG4gIHZhciBwb3MgPSB0aGlzLnRhcmdldC5jbG9uZSgpXG4gICAgLmFkZChkaWZmKTtcbiAgY2FtZXJhLnBvc2l0aW9uLmNvcHkocG9zKTtcblxuICB2YXIgdXAgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAxLCAwKS5hcHBseVF1YXRlcm5pb24odGhpcy5xdWF0ZXJuaW9uKTtcbiAgY2FtZXJhLnVwLmNvcHkodXApO1xuICBjYW1lcmEubG9va0F0KHRoaXMudGFyZ2V0KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUGxheWVyQ2FtZXJhOyIsInZhciBQbGF5ZXJDb250cm9sID0gZnVuY3Rpb24ob2JqZWN0LCBhcHAsIGlucHV0LCBjYW1lcmEpIHtcbiAgdGhpcy5vYmplY3QgPSBvYmplY3Q7XG4gIHRoaXMuaW5wdXQgPSBpbnB1dDtcbiAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XG5cbiAgdGhpcy5jaGFyYWN0ZXIgPSBudWxsO1xuICB0aGlzLnJpZ2lkQm9keSA9IG51bGw7XG59O1xuXG5QbGF5ZXJDb250cm9sLiRpbmplY3QgPSBbJ2lucHV0JywgJ2NhbWVyYSddO1xuXG5QbGF5ZXJDb250cm9sLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oKSB7XG4gIHZhciBmb3J3YXJkQW1vdW50ID0gMDtcbiAgaWYgKHRoaXMuaW5wdXQua2V5SG9sZCgndycpKSBmb3J3YXJkQW1vdW50ICs9IDE7XG4gIGlmICh0aGlzLmlucHV0LmtleUhvbGQoJ3MnKSkgZm9yd2FyZEFtb3VudCAtPSAxO1xuXG4gIHZhciByaWdodEFtb3VudCA9IDA7XG4gIGlmICh0aGlzLmlucHV0LmtleUhvbGQoJ2QnKSkgcmlnaHRBbW91bnQgKz0gMTtcbiAgaWYgKHRoaXMuaW5wdXQua2V5SG9sZCgnYScpKSByaWdodEFtb3VudCAtPSAxO1xuXG4gIHZhciBncmF2aXR5ID0gdGhpcy5yaWdpZEJvZHkuZ3Jhdml0eTtcblxuICBpZiAoZ3Jhdml0eSAhPSBudWxsKSB7XG4gICAgdmFyIG5vcm1hbCA9IGdyYXZpdHkuZGlyLmNsb25lKCkubXVsdGlwbHlTY2FsYXIoLTEpO1xuXG4gICAgdmFyIHVwID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMSwgMCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMuY2FtZXJhLnF1YXRlcm5pb24pO1xuICAgIHZhciByaWdodCA9IG5ldyBUSFJFRS5WZWN0b3IzKDEsIDAsIDApLmFwcGx5UXVhdGVybmlvbih0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uKTtcblxuICAgIHZhciBtb3ZlID0gdXAubXVsdGlwbHlTY2FsYXIoZm9yd2FyZEFtb3VudCkuYWRkKHJpZ2h0Lm11bHRpcGx5U2NhbGFyKHJpZ2h0QW1vdW50KSk7XG4gICAgbW92ZS5wcm9qZWN0T25QbGFuZShub3JtYWwpO1xuICAgIG1vdmUuc2V0TGVuZ3RoKDEpO1xuXG4gICAgdGhpcy5jaGFyYWN0ZXIubW92ZShtb3ZlLCAxKTtcblxuICAgIGlmICh0aGlzLmlucHV0LmtleURvd24oJ3NwYWNlJykpIHtcbiAgICAgIHRoaXMuY2hhcmFjdGVyLmp1bXAoKTtcbiAgICB9XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUGxheWVyQ29udHJvbDsiLCJ2YXIgVEhSRUUgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snVEhSRUUnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ1RIUkVFJ10gOiBudWxsKTtcblxudmFyIFJpZ2lkQm9keSA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICB0aGlzLm9iamVjdCA9IG9iamVjdDtcbiAgXG4gIHRoaXMudmVsb2NpdHkgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICBcbiAgdGhpcy5hY2NlbGVyYXRpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICBcbiAgdGhpcy50eXBlID0gJ3JpZ2lkQm9keSc7XG4gIFxuICB0aGlzLmZyaWN0aW9uID0gMC45ODtcblxuICAvLyAwIG1hc3MgbWVhbnMgaW1tb3ZhYmxlXG4gIHRoaXMubWFzcyA9IDA7XG4gIFxuICB0aGlzLmdyYXZpdHkgPSBudWxsO1xuXG4gIHRoaXMuY29sbGlzaW9uT2JqZWN0ID0gbnVsbDtcbn07XG5cblJpZ2lkQm9keS5wcm90b3R5cGUuYXBwbHlGb3JjZSA9IGZ1bmN0aW9uKGZvcmNlKSB7XG4gIHRoaXMuYWNjZWxlcmF0aW9uLmFkZChmb3JjZS5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKDEgLyB0aGlzLm1hc3MpKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmlnaWRCb2R5OyIsInZhciBldmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xuXG52YXIgaWRDb3VudCA9IDA7XG5cbmZ1bmN0aW9uIGdldE5leHRJZCgpIHtcbiAgcmV0dXJuIGlkQ291bnQrKztcbn1cblxudmFyIEVuZ2luZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmVudGl0eU1hcCA9IHt9O1xuICB0aGlzLmxvb2t1cCA9IHt9O1xuICB0aGlzLmZyYW1lUmF0ZSA9IDYwLjA7XG4gIHRoaXMuc3lzdGVtcyA9IFtdO1xuICB0aGlzLmJpbmRpbmdzID0ge307XG59O1xuXG5FbmdpbmUucHJvdG90eXBlLmF0dGFjaCA9IGZ1bmN0aW9uKG9iamVjdCwgZmFjdG9yeSkge1xuICB2YXIgYXJncyA9IFtvYmplY3RdO1xuICB2YXIgY29tcG9uZW50O1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgaWYgKHR5cGVvZiBmYWN0b3J5ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaWYgKGZhY3RvcnkuJGluamVjdCAhPSBudWxsKSB7XG4gICAgICBmYWN0b3J5LiRpbmplY3QuZm9yRWFjaChmdW5jdGlvbihkZXApIHtcbiAgICAgICAgYXJncy5wdXNoKHNlbGYucmVzb2x2ZShkZXApKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBjb21wb25lbnQgPSBuZXcoRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQuYXBwbHkoZmFjdG9yeSwgW251bGxdLmNvbmNhdChhcmdzKSkpO1xuICB9IGVsc2Uge1xuICAgIGNvbXBvbmVudCA9IGZhY3Rvcnk7XG4gIH1cblxuICBpZiAoY29tcG9uZW50ICE9IG51bGwpIHtcbiAgICBjb21wb25lbnQub2JqZWN0ID0gb2JqZWN0O1xuXG4gICAgaWYgKG9iamVjdC5faWQgPT0gbnVsbCkge1xuICAgICAgb2JqZWN0Ll9pZCA9IGdldE5leHRJZCgpO1xuICAgICAgdGhpcy5sb29rdXBbb2JqZWN0Ll9pZF0gPSBvYmplY3Q7XG4gICAgfVxuXG4gICAgaWYgKGNvbXBvbmVudC5faWQgPT0gbnVsbCkge1xuICAgICAgY29tcG9uZW50Ll9pZCA9IGdldE5leHRJZCgpO1xuICAgICAgdGhpcy5sb29rdXBbY29tcG9uZW50Ll9pZF0gPSBjb21wb25lbnQ7XG4gICAgfVxuXG4gICAgdmFyIGNvbXBvbmVudHMgPSB0aGlzLmVudGl0eU1hcFtvYmplY3QuX2lkXTtcbiAgICBpZiAoY29tcG9uZW50cyA9PSBudWxsKSBjb21wb25lbnRzID0gdGhpcy5lbnRpdHlNYXBbb2JqZWN0Ll9pZF0gPSB7fTtcbiAgICBjb21wb25lbnRzW2NvbXBvbmVudC5faWRdID0gY29tcG9uZW50O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN5c3RlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBzeXN0ZW0gPSB0aGlzLnN5c3RlbXNbaV07XG4gICAgICBpZiAoc3lzdGVtLm9uQXR0YWNoICE9IG51bGwpIHN5c3RlbS5vbkF0dGFjaChvYmplY3QsIGNvbXBvbmVudCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvbXBvbmVudDtcbn07XG5cbkVuZ2luZS5wcm90b3R5cGUudXNlID0gZnVuY3Rpb24odHlwZSwgc3lzdGVtKSB7XG4gIHZhciBoYXNUeXBlID0gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnO1xuICBpZiAoIWhhc1R5cGUpIHtcbiAgICBzeXN0ZW0gPSB0eXBlO1xuICB9XG5cbiAgaWYgKHN5c3RlbSAhPSBudWxsKSB7XG4gICAgdGhpcy5zeXN0ZW1zLnB1c2goc3lzdGVtKTtcbiAgICBpZiAoaGFzVHlwZSkge1xuICAgICAgdGhpcy52YWx1ZSh0eXBlLCBzeXN0ZW0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzeXN0ZW07XG59O1xuXG5FbmdpbmUucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5lbWl0KCdiZWZvcmVUaWNrJyk7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN5c3RlbXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgc3lzdGVtID0gdGhpcy5zeXN0ZW1zW2ldO1xuICAgIGlmIChzeXN0ZW0udGljayAhPSBudWxsKSBzeXN0ZW0udGljaygpO1xuICB9XG5cbiAgZm9yICh2YXIgaSBpbiB0aGlzLmVudGl0eU1hcCkge1xuICAgIHZhciBjb21wb25lbnRzID0gdGhpcy5lbnRpdHlNYXBbaV07XG4gICAgZm9yICh2YXIgaiBpbiBjb21wb25lbnRzKSB7XG4gICAgICB2YXIgY29tcG9uZW50ID0gY29tcG9uZW50c1tqXTtcbiAgICAgIGlmIChjb21wb25lbnQudGljayAhPSBudWxsKSBjb21wb25lbnQudGljaygpO1xuICAgIH1cbiAgfVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zeXN0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHN5c3RlbSA9IHRoaXMuc3lzdGVtc1tpXTtcbiAgICBpZiAoc3lzdGVtLmxhdGVUaWNrICE9IG51bGwpIHN5c3RlbS5sYXRlVGljaygpO1xuICB9XG5cbiAgdGhpcy5lbWl0KCdhZnRlclRpY2snKTtcbn07XG5cbkVuZ2luZS5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB2YXIgaW50ZXJ2YWwgPSBmdW5jdGlvbigpIHtcbiAgICBzZWxmLnRpY2soKTtcbiAgICBzZXRUaW1lb3V0KGludGVydmFsLCAxMDAwIC8gdGhpcy5mcmFtZVJhdGUpO1xuICB9XG4gIGludGVydmFsKCk7XG59O1xuXG5FbmdpbmUucHJvdG90eXBlLnZhbHVlID0gZnVuY3Rpb24odHlwZSwgb2JqZWN0KSB7XG4gIHRoaXMuYmluZGluZ3NbdHlwZV0gPSB7XG4gICAgdmFsdWU6IG9iamVjdFxuICB9O1xufTtcblxuRW5naW5lLnByb3RvdHlwZS5yZXNvbHZlID0gZnVuY3Rpb24odHlwZSwgY29udGV4dCkge1xuICB2YXIgYmluZGluZyA9IHRoaXMuYmluZGluZ3NbdHlwZV07XG4gIGlmIChiaW5kaW5nID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2JpbmRpbmcgZm9yIHR5cGUgJyArIHR5cGUgKyAnIG5vdCBmb3VuZCcpO1xuICB9XG5cbiAgaWYgKGJpbmRpbmcuZmFjdG9yeSAhPSBudWxsKSB7XG4gICAgcmV0dXJuIGJpbmRpbmcuZmFjdG9yeShjb250ZXh0KTtcbiAgfVxuXG4gIGlmIChiaW5kaW5nLnZhbHVlICE9IG51bGwpIHtcbiAgICByZXR1cm4gYmluZGluZy52YWx1ZTtcbiAgfVxuXG4gIHJldHVybiB1bmRlZmluZWQ7XG59O1xuXG5FbmdpbmUucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKHR5cGUsIGNvbnRleHQpIHtcbiAgcmV0dXJuIHRoaXMucmVzb2x2ZSh0eXBlLCBjb250ZXh0KTtcbn07XG5cbkVuZ2luZS5wcm90b3R5cGUuZ2V0Q29tcG9uZW50ID0gZnVuY3Rpb24ob2JqZWN0LCB0eXBlKSB7XG4gIHZhciBjb21wb25lbnRzID0gdGhpcy5lbnRpdHlNYXBbb2JqZWN0Ll9pZF07XG4gIGZvciAodmFyIGlkIGluIGNvbXBvbmVudHMpIHtcbiAgICBpZiAoY29tcG9uZW50c1tpZF0udHlwZSA9PT0gdHlwZSkge1xuICAgICAgcmV0dXJuIGNvbXBvbmVudHNbaWRdO1xuICAgIH1cbiAgfVxufTtcblxuRW5naW5lLnByb3RvdHlwZS5sb2FkQXNzZW1ibHkgPSBmdW5jdGlvbihhc3NlbWJseSkge1xuICByZXR1cm4gYXNzZW1ibHkodGhpcyk7XG59O1xuXG5ldmVudHMucHJvdG90eXBlLmFwcGx5KEVuZ2luZS5wcm90b3R5cGUpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IEVuZ2luZSgpO1xufTsiLCJ2YXIgRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2xpc3RlbmVycyA9IHt9O1xufTtcblxuRXZlbnRzLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24oZXZlbnQsIG9iamVjdCkge1xuICB2YXIgY2FsbGJhY2tzID0gdGhpcy5fbGlzdGVuZXJzW2V2ZW50XTtcbiAgaWYgKGNhbGxiYWNrcyA9PSBudWxsKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGNhbGxiYWNrID0gY2FsbGJhY2tzW2ldO1xuICAgIGNhbGxiYWNrKG9iamVjdCk7XG4gIH1cbn07XG5cbkV2ZW50cy5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldmVudCwgY2FsbGJhY2spIHtcbiAgdmFyIGNhbGxiYWNrcyA9IHRoaXMuX2xpc3RlbmVyc1tldmVudF07XG4gIGlmIChjYWxsYmFja3MgPT0gbnVsbCkge1xuICAgIGNhbGxiYWNrcyA9IHRoaXMuX2xpc3RlbmVyc1tldmVudF0gPSBbXTtcbiAgfVxuICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG59O1xuXG5FdmVudHMucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKGV2ZW50LCBjYWxsYmFjaykge1xuICB2YXIgY2FsbGJhY2tzID0gdGhpcy5fbGlzdGVuZXJzW2V2ZW50XTtcbiAgaWYgKGNhbGxiYWNrcyA9PSBudWxsKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGFycmF5VXRpbHMucmVtb3ZlKGNhbGxiYWNrcywgY2FsbGJhY2spO1xufTtcblxuRXZlbnRzLnByb3RvdHlwZS5hcHBseSA9IGZ1bmN0aW9uKG9iaikge1xuICBvYmouZW1pdCA9IHRoaXMuZW1pdDtcbiAgb2JqLm9uID0gdGhpcy5vbjtcbiAgb2JqLm9mZiA9IHRoaXMub2ZmO1xuICBvYmouX2xpc3RlbmVycyA9IHt9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudHM7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRzKSB7XG4gIG9wdHMgPSBvcHRzIHx8IHt9O1xuICB2YXIgZGF0YVRvTG9hZCA9IG9wdHMuZGF0YSB8fCBbXTtcbiAgdmFyIG9uUGljayA9IG9wdHMub25QaWNrIHx8IGZ1bmN0aW9uKCkge307XG4gIHZhciBvbkhvdmVyID0gb3B0cy5vbkhvdmVyIHx8IGZ1bmN0aW9uKCkge307XG4gIHZhciBvbkxlYXZlID0gb3B0cy5vbkxlYXZlIHx8IGZ1bmN0aW9uKCkge307XG4gIHZhciBjdXN0b21QbGFjZW1lbnQgPSBvcHRzLmN1c3RvbVBsYWNlbWVudCB8fCBmYWxzZTtcbiAgdmFyIGhpZGVIaWdobGlnaHQgPSBvcHRzLmhpZGVIaWdobGlnaHQgfHwgZmFsc2U7XG4gIHZhciBzaG93VG9vbHRpcCA9IG9wdHMuc2hvd1Rvb2x0aXAgfHwgZmFsc2U7XG5cbiAgdmFyIGJsb2NrV2lkdGggPSBvcHRzLmJsb2NrV2lkdGggfHwgMjA7XG4gIHZhciBibG9ja0hlaWdodCA9IG9wdHMuYmxvY2tIZWlnaHQgfHwgMjA7XG4gIHZhciBjb2x1bW5zID0gb3B0cy5jb2x1bW5zIHx8IDE0O1xuICB2YXIgZGlzYWJsZUhpZ2hsaWdodCA9IG9wdHMuZGlzYWJsZUhpZ2hsaWdodCB8fCBmYWxzZTtcblxuICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgaWYgKHNob3dUb29sdGlwKSB7XG4gICAgdmFyIHRvb2x0aXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0b29sdGlwLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICB0b29sdGlwLnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICB0b29sdGlwLnN0eWxlLndpZHRoID0gJzIwMHB4JztcbiAgICB0b29sdGlwLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcjNjY2NjY2JztcbiAgICB0b29sdGlwLnN0eWxlLmNvbG9yID0gJyNmNmY2ZjYnO1xuICAgIHRvb2x0aXAuc3R5bGUucGFkZGluZyA9ICc1cHgnO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0b29sdGlwKTtcbiAgfVxuXG4gIGlmICghY3VzdG9tUGxhY2VtZW50KSB7XG4gICAgY29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBjb250YWluZXIuc3R5bGUubGVmdCA9ICcyMHB4JztcbiAgICBjb250YWluZXIuc3R5bGUuYm90dG9tID0gJzIwcHgnO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgfVxuXG4gIGNvbnRhaW5lci5vbmZvY3VzID0gZnVuY3Rpb24oKSB7XG4gICAgY29udGFpbmVyLnN0eWxlWydvdXRsaW5lJ10gPSAnbm9uZSc7XG4gIH07XG5cbiAgdmFyIGJsb2NrcyA9IFtdO1xuICB2YXIgZGF0YSA9IFtdO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YVRvTG9hZC5sZW5ndGg7IGkrKykge1xuICAgIGFkZChkYXRhVG9Mb2FkW2ldKTtcbiAgfVxuXG4gIHVwZGF0ZUNvbnRhaW5lcigpO1xuXG4gIGZ1bmN0aW9uIGdldFJvdyhpbmRleCkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKGluZGV4IC8gY29sdW1ucyk7XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0Q29sdW1uKGluZGV4KSB7XG4gICAgcmV0dXJuIGluZGV4ICUgY29sdW1ucztcbiAgfTtcblxuICBmdW5jdGlvbiBnZXRSb3dzKCkge1xuICAgIHJldHVybiBNYXRoLmNlaWwoZGF0YS5sZW5ndGggLyBjb2x1bW5zKTtcbiAgfTtcblxuICBmdW5jdGlvbiBnZXRJbmRleChyb3csIGNvbHVtbikge1xuICAgIHJldHVybiByb3cgKiBjb2x1bW5zICsgY29sdW1uO1xuICB9O1xuXG4gIGZ1bmN0aW9uIHJlbW92ZShpbmRleCkge1xuICAgIGNvbnRhaW5lci5yZW1vdmVDaGlsZChibG9ja3NbaW5kZXhdKTtcbiAgICBibG9ja3NbaW5kZXhdID0gdW5kZWZpbmVkO1xuICAgIGRhdGFbaW5kZXhdID0gdW5kZWZpbmVkO1xuICB9O1xuXG4gIGZ1bmN0aW9uIHNldChpbmRleCwgb2JqKSB7XG4gICAgaWYgKGRhdGFbaW5kZXhdICE9IG51bGwpIHtcbiAgICAgIHJlbW92ZShpbmRleCk7XG4gICAgfTtcblxuICAgIHZhciByb3cgPSBnZXRSb3coaW5kZXgpO1xuICAgIHZhciBjb2x1bW4gPSBnZXRDb2x1bW4oaW5kZXgpO1xuXG4gICAgdmFyIGVsZW1lbnQ7XG4gICAgaWYgKG9iai5pbWdEYXRhICE9IG51bGwpIHtcbiAgICAgIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcbiAgICAgIGVsZW1lbnQuc3JjID0gb2JqLmltZ0RhdGE7XG4gICAgfSBlbHNlIGlmIChvYmouc3JjICE9IG51bGwpIHtcbiAgICAgIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcbiAgICAgIGVsZW1lbnQuc3JjID0gb2JqLnNyYztcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGNvbG9yID0gb2JqO1xuICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgZWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvcjtcbiAgICB9XG5cbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgcG9zaXRpb24oZWxlbWVudCwgcm93LCBjb2x1bW4pO1xuXG4gICAgYmxvY2tzW2luZGV4XSA9IGVsZW1lbnQ7XG4gICAgZGF0YVtpbmRleF0gPSBvYmo7XG5cbiAgICB1cGRhdGVDb250YWluZXIoKTtcblxuICAgIGlmIChzZWxlY3RlZEluZGV4ID09IC0xKSB7XG4gICAgICBoaWdobGlnaHQoMCk7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIGFkZChvYmopIHtcbiAgICB2YXIgaW5kZXggPSBibG9ja3MubGVuZ3RoO1xuICAgIHNldChpbmRleCwgb2JqKTtcbiAgfTtcblxuICBmdW5jdGlvbiBwb3NpdGlvbihlbGVtZW50LCByb3csIGNvbHVtbikge1xuICAgIGVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIGVsZW1lbnQuc3R5bGUubGVmdCA9IGNvbHVtbiAqIGJsb2NrV2lkdGggKyAncHgnO1xuICAgIGVsZW1lbnQuc3R5bGUudG9wID0gcm93ICogYmxvY2tIZWlnaHQgKyAncHgnO1xuICAgIGVsZW1lbnQuc3R5bGUud2lkdGggPSBibG9ja1dpZHRoICsgJ3B4JztcbiAgICBlbGVtZW50LnN0eWxlLmhlaWdodCA9IGJsb2NrSGVpZ2h0ICsgJ3B4JztcbiAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lLWJsb2NrJztcbiAgfTtcblxuICBmdW5jdGlvbiB1cGRhdGVDb250YWluZXIoKSB7XG4gICAgdmFyIG51bWJlck9mQ29sdW1ucyA9IGRhdGEubGVuZ3RoID4gY29sdW1ucyA/IGNvbHVtbnMgOiBkYXRhLmxlbmd0aDtcbiAgICBjb250YWluZXIuc3R5bGUud2lkdGggPSBudW1iZXJPZkNvbHVtbnMgKiBibG9ja1dpZHRoICsgJ3B4JztcbiAgICBjb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gZ2V0Um93cygpICogYmxvY2tIZWlnaHQgKyAncHgnO1xuICB9O1xuXG4gIHZhciBoaWdobGlnaHREaXYgPSBudWxsO1xuICB2YXIgc2VsZWN0ZWRJbmRleCA9IC0xO1xuXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodChpbmRleCkge1xuICAgIGlmIChkaXNhYmxlSGlnaGxpZ2h0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2VsZWN0ZWRJbmRleCA9IGluZGV4O1xuICAgIHZhciByb3cgPSBnZXRSb3coaW5kZXgpO1xuICAgIHZhciBjb2x1bW4gPSBnZXRDb2x1bW4oaW5kZXgpO1xuXG4gICAgaWYgKCFoaWRlSGlnaGxpZ2h0KSB7XG4gICAgICBpZiAoaGlnaGxpZ2h0RGl2ID09IG51bGwpIHtcbiAgICAgICAgaGlnaGxpZ2h0RGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGhpZ2hsaWdodERpdi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIGhpZ2hsaWdodERpdi5zdHlsZS53aWR0aCA9IGJsb2NrV2lkdGggKyAncHgnO1xuICAgICAgICBoaWdobGlnaHREaXYuc3R5bGUuaGVpZ2h0ID0gYmxvY2tIZWlnaHQgKyAncHgnO1xuICAgICAgICBoaWdobGlnaHREaXYuc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUtYmxvY2snO1xuICAgICAgICBoaWdobGlnaHREaXYuc3R5bGUuYm9yZGVyID0gJzFweCBzb2xpZCAjRkZGRkZGJztcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGhpZ2hsaWdodERpdik7XG4gICAgICB9XG5cbiAgICAgIGhpZ2hsaWdodERpdi5zdHlsZS5sZWZ0ID0gY29sdW1uICogYmxvY2tXaWR0aCAtIDEgKyAncHgnO1xuICAgICAgaGlnaGxpZ2h0RGl2LnN0eWxlLnRvcCA9IHJvdyAqIGJsb2NrSGVpZ2h0IC0gMSArICdweCc7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgcmVtb3ZlKGkpO1xuICAgIH1cblxuICAgIGRhdGEgPSBbXTtcbiAgfTtcblxuICBmdW5jdGlvbiBpc0Rlc2NlbmRhbnQocGFyZW50LCBjaGlsZCkge1xuICAgIGlmIChjaGlsZCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIG5vZGUgPSBjaGlsZC5wYXJlbnROb2RlO1xuICAgIHdoaWxlIChub2RlICE9IG51bGwpIHtcbiAgICAgIGlmIChub2RlID09IHBhcmVudCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbihlKSB7XG4gICAgdmFyIG1vdXNlWCA9IGUucGFnZVggLSBjb250YWluZXIub2Zmc2V0TGVmdDtcbiAgICB2YXIgbW91c2VZID0gZS5wYWdlWSAtIGNvbnRhaW5lci5vZmZzZXRUb3A7XG4gICAgdmFyIHJvdyA9IE1hdGguZmxvb3IobW91c2VZIC8gYmxvY2tIZWlnaHQpO1xuICAgIHZhciBjb2x1bW4gPSBNYXRoLmZsb29yKG1vdXNlWCAvIGJsb2NrV2lkdGgpO1xuICAgIHZhciBpbmRleCA9IGdldEluZGV4KHJvdywgY29sdW1uKTtcblxuICAgIGlmIChkYXRhW2luZGV4XSA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIG9iaiA9IGRhdGFbaW5kZXhdO1xuICAgIGhpZ2hsaWdodChpbmRleCk7XG4gICAgb25QaWNrKG9iaiwgaW5kZXgpO1xuICB9KTtcblxuICB2YXIgbW91c2UgPSBudWxsO1xuICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZnVuY3Rpb24oZSkge1xuICAgIG1vdXNlID0gZTtcbiAgICB2YXIgbW91c2VYID0gZS5wYWdlWCAtIGNvbnRhaW5lci5vZmZzZXRMZWZ0O1xuICAgIHZhciBtb3VzZVkgPSBlLnBhZ2VZIC0gY29udGFpbmVyLm9mZnNldFRvcDtcbiAgICB2YXIgcm93ID0gTWF0aC5mbG9vcihtb3VzZVkgLyBibG9ja0hlaWdodCk7XG4gICAgdmFyIGNvbHVtbiA9IE1hdGguZmxvb3IobW91c2VYIC8gYmxvY2tXaWR0aCk7XG4gICAgdmFyIGluZGV4ID0gZ2V0SW5kZXgocm93LCBjb2x1bW4pO1xuXG4gICAgaWYgKGRhdGFbaW5kZXhdID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgb2JqID0gZGF0YVtpbmRleF07XG4gICAgb25Ib3ZlcihvYmosIGluZGV4KTtcblxuICAgIGlmIChzaG93VG9vbHRpcCAmJiBvYmoudG9vbHRpcCAhPSBudWxsKSB7XG4gICAgICB0b29sdGlwLnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG4gICAgICB0b29sdGlwLnN0eWxlLmxlZnQgPSBtb3VzZVggKyAncHgnO1xuICAgICAgdG9vbHRpcC5zdHlsZS50b3AgPSBtb3VzZVkgKyAncHgnO1xuICAgICAgaWYgKHRvb2x0aXAuaW5uZXJIVE1MICE9PSBvYmoudG9vbHRpcCkge1xuICAgICAgICB0b29sdGlwLmlubmVySFRNTCA9IG9iai50b29sdGlwO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCBmdW5jdGlvbihlKSB7XG4gICAgaWYgKCFpc0Rlc2NlbmRhbnQoY29udGFpbmVyLCBlLnRvRWxlbWVudCkpIHtcbiAgICAgIG9uTGVhdmUoZSk7XG5cbiAgICAgIGlmIChzaG93VG9vbHRpcCkge1xuICAgICAgICB0b29sdGlwLnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIGlmIChkYXRhLmxlbmd0aCA+IDApIHtcbiAgICBoaWdobGlnaHQoMCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGhpZ2hsaWdodDogaGlnaGxpZ2h0LFxuICAgIGFkZDogYWRkLFxuICAgIHNldDogc2V0LFxuICAgIGNsZWFyOiBjbGVhcixcbiAgICBkYXRhOiBkYXRhLFxuICAgIGRvbUVsZW1lbnQ6IGNvbnRhaW5lcixcbiAgICBnZXQgc2VsZWN0ZWRJbmRleCgpIHtcbiAgICAgIHJldHVybiBzZWxlY3RlZEluZGV4O1xuICAgIH0sXG4gICAgZ2V0IG1vdXNlKCkge1xuICAgICAgcmV0dXJuIG1vdXNlO1xuICAgIH0sXG4gICAgZ2V0IHRvb2x0aXAoKSB7XG4gICAgICByZXR1cm4gdG9vbHRpcDtcbiAgICB9XG4gIH1cbn07IiwibW9kdWxlLmV4cG9ydHM9e1xufSIsIm1vZHVsZS5leHBvcnRzPVtcbiAgXCIjN0M3QzdDXCIsXG4gIFwiIzAwMDBGQ1wiLFxuICBcIiMwMDAwQkNcIixcbiAgXCIjNDQyOEJDXCIsXG4gIFwiIzk0MDA4NFwiLFxuICBcIiNBODAwMjBcIixcbiAgXCIjQTgxMDAwXCIsXG4gIFwiIzg4MTQwMFwiLFxuICBcIiM1MDMwMDBcIixcbiAgXCIjMDA3ODAwXCIsXG4gIFwiIzAwNjgwMFwiLFxuICBcIiMwMDU4MDBcIixcbiAgXCIjMDA0MDU4XCIsXG4gIFwiIzAwMDAwMFwiLFxuXG4gIFwiI0JDQkNCQ1wiLFxuICBcIiMwMDc4RjhcIixcbiAgXCIjMDA1OEY4XCIsXG4gIFwiIzY4NDRGQ1wiLFxuICBcIiNEODAwQ0NcIixcbiAgXCIjRTQwMDU4XCIsXG4gIFwiI0Y4MzgwMFwiLFxuICBcIiNFNDVDMTBcIixcbiAgXCIjQUM3QzAwXCIsXG4gIFwiIzAwQjgwMFwiLFxuICBcIiMwMEE4MDBcIixcbiAgXCIjMDBBODQ0XCIsXG4gIFwiIzAwODg4OFwiLCB7XG4gICAgXCJzcmNcIjogXCIvaW1hZ2VzL2NsZWFyLnBuZ1wiLFxuICAgIFwiaXNDbGVhckNvbG9yXCI6IHRydWVcbiAgfSxcblxuICBcIiNGOEY4RjhcIixcbiAgXCIjM0NCQ0ZDXCIsXG4gIFwiIzY4ODhGQ1wiLFxuICBcIiM5ODc4RjhcIixcbiAgXCIjRjg3OEY4XCIsXG4gIFwiI0Y4NTg5OFwiLFxuICBcIiNGODc4NThcIixcbiAgXCIjRkNBMDQ0XCIsXG4gIFwiI0Y4QjgwMFwiLFxuICBcIiNCOEY4MThcIixcbiAgXCIjNThEODU0XCIsXG4gIFwiIzU4Rjg5OFwiLFxuICBcIiMwMEU4RDhcIixcbiAgXCIjNzg3ODc4XCIsXG5cbiAgXCIjRkNGQ0ZDXCIsXG4gIFwiI0E0RTRGQ1wiLFxuICBcIiNCOEI4RjhcIixcbiAgXCIjRDhCOEY4XCIsXG4gIFwiI0Y4QjhGOFwiLFxuICBcIiNGOEE0QzBcIixcbiAgXCIjRjBEMEIwXCIsXG4gIFwiI0ZDRTBBOFwiLFxuICBcIiNGOEQ4NzhcIixcbiAgXCIjRDhGODc4XCIsXG4gIFwiI0I4RjhCOFwiLFxuICBcIiNCOEY4RDhcIixcbiAgXCIjMDBGQ0ZDXCIsXG4gIFwiI0Y4RDhGOFwiLFxuXSIsInZhciBCbG9ja0NvbW1hbmQgPSBmdW5jdGlvbihibG9ja3MpIHtcbiAgdGhpcy5ibG9ja3MgPSBibG9ja3M7XG5cbiAgdGhpcy5zdWJDb21tYW5kcyA9IFtdO1xuXG4gIHRoaXMuZGVsdGFzID0gW107XG59O1xuXG5CbG9ja0NvbW1hbmQucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKGNvb3JkLCB2YWx1ZSkge1xuICB0aGlzLnN1YkNvbW1hbmRzLnB1c2goe1xuICAgIGNvb3JkOiBjb29yZCxcbiAgICB2YWx1ZTogdmFsdWVcbiAgfSk7XG59O1xuXG5CbG9ja0NvbW1hbmQucHJvdG90eXBlLnNldEF0Q29vcmRzID0gZnVuY3Rpb24oY29vcmRzLCB2YWx1ZSkge1xuICB0aGlzLnN1YkNvbW1hbmRzLnB1c2goe1xuICAgIGNvb3JkczogY29vcmRzLFxuICAgIHZhbHVlOiB2YWx1ZVxuICB9KTtcbn07XG5cbkJsb2NrQ29tbWFuZC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24oKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdWJDb21tYW5kcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBzdWJDb21tYW5kID0gdGhpcy5zdWJDb21tYW5kc1tpXTtcbiAgICB2YXIgdmFsdWUgPSBzdWJDb21tYW5kLnZhbHVlO1xuICAgIHZhciBjb29yZHMgPSBzdWJDb21tYW5kLmNvb3JkcyB8fCBbc3ViQ29tbWFuZC5jb29yZF07XG5cbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNvb3Jkcy5sZW5ndGg7IGorKykge1xuICAgICAgdmFyIGNvb3JkID0gY29vcmRzW2pdO1xuICAgICAgdmFyIHByZXZpb3VzVmFsdWUgPSB0aGlzLmJsb2Nrcy5nZXRBdENvb3JkKGNvb3JkKTtcbiAgICAgIHRoaXMuZGVsdGFzLnB1c2goe1xuICAgICAgICBjb29yZDogY29vcmQsXG4gICAgICAgIHByZXZpb3VzVmFsdWU6IHByZXZpb3VzVmFsdWVcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLmJsb2Nrcy5zZXRBdENvb3JkKGNvb3JkLCB2YWx1ZSk7XG4gICAgfVxuICB9XG59O1xuXG5CbG9ja0NvbW1hbmQucHJvdG90eXBlLnVuZG8gPSBmdW5jdGlvbigpIHtcbiAgZm9yICh2YXIgaSA9IHRoaXMuZGVsdGFzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIGRlbHRhID0gdGhpcy5kZWx0YXNbaV07XG4gICAgdGhpcy5ibG9ja3Muc2V0QXRDb29yZChkZWx0YS5jb29yZCwgZGVsdGEucHJldmlvdXNWYWx1ZSk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQmxvY2tDb21tYW5kOyIsInZhciBCbG9ja0NvbW1hbmQgPSByZXF1aXJlKCcuL2Jsb2NrY29tbWFuZCcpO1xudmFyIGFycmF5VXRpbHMgPSByZXF1aXJlKCcuLi8uLi91dGlscy9hcnJheXV0aWxzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWRpdG9yLCBibG9ja3MsIGNvb3Jkcywgb2Zmc2V0KSB7XG4gIHZhciBjb21tYW5kID0gbmV3IEJsb2NrQ29tbWFuZChlZGl0b3IuYmxvY2tzKTtcblxuICB2YXIgdG9BZGQgPSBbXTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGNvb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBjb29yZCA9IGNvb3Jkc1tpXTtcbiAgICB2YXIgdmFsdWUgPSBibG9ja3MuZ2V0QXRDb29yZChjb29yZCk7XG5cbiAgICAvLyBSZW1vdmVcbiAgICBjb21tYW5kLnNldChjb29yZHNbaV0sIHVuZGVmaW5lZCk7XG5cbiAgICB0b0FkZC5wdXNoKHtcbiAgICAgIGNvb3JkOiBub3JtYWxpemVDb29yZChuZXcgVEhSRUUuVmVjdG9yMygpLmFkZFZlY3RvcnMoY29vcmQsIG9mZnNldCksIGJsb2Nrcy5kaW0pLFxuICAgICAgdmFsdWU6IHZhbHVlXG4gICAgfSk7XG4gIH1cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRvQWRkLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGFkZCA9IHRvQWRkW2ldO1xuXG4gICAgLy8gQWRkXG4gICAgY29tbWFuZC5zZXQoYWRkLmNvb3JkLCBhZGQudmFsdWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplQ29vcmQoY29vcmQsIGRpbSkge1xuICAgIHJldHVybiBuZXcgVEhSRUUuVmVjdG9yMyhcbiAgICAgIChjb29yZC54ICsgZGltWzBdKSAlIGRpbVswXSxcbiAgICAgIChjb29yZC55ICsgZGltWzFdKSAlIGRpbVsxXSxcbiAgICAgIChjb29yZC56ICsgZGltWzJdKSAlIGRpbVsyXVxuICAgICk7XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBzZWxlY3Rpb25Db3B5OiBudWxsLFxuICAgIHJ1bjogZnVuY3Rpb24oKSB7XG4gICAgICBjb21tYW5kLnJ1bigpO1xuICAgICAgdGhpcy5zZWxlY3Rpb25Db3B5ID0gYXJyYXlVdGlscy5jbG9uZShlZGl0b3Iuc2VsZWN0aW9ucyk7XG5cbiAgICAgIGlmIChlZGl0b3Iuc2VsZWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vIE9mZnNldCBzZWxlY3Rpb25cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlZGl0b3Iuc2VsZWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciBub3JtYWxpemVkID0gbm9ybWFsaXplQ29vcmQobmV3IFRIUkVFLlZlY3RvcjMoKS5hZGRWZWN0b3JzKGVkaXRvci5zZWxlY3Rpb25zW2ldLCBvZmZzZXQpLCBibG9ja3MuZGltKTtcbiAgICAgICAgICBlZGl0b3Iuc2VsZWN0aW9uc1tpXSA9IG5vcm1hbGl6ZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIHVuZG86IGZ1bmN0aW9uKCkge1xuICAgICAgY29tbWFuZC51bmRvKCk7XG5cbiAgICAgIGlmIChlZGl0b3Iuc2VsZWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vIE9mZnNldCBzZWxlY3Rpb25cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlZGl0b3Iuc2VsZWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciBub3JtYWxpemVkID0gbm9ybWFsaXplQ29vcmQobmV3IFRIUkVFLlZlY3RvcjMoKS5zdWJWZWN0b3JzKGVkaXRvci5zZWxlY3Rpb25zW2ldLCBvZmZzZXQpLCBibG9ja3MuZGltKTtcbiAgICAgICAgICBlZGl0b3Iuc2VsZWN0aW9uc1tpXSA9IG5vcm1hbGl6ZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn07IiwidmFyIGFycmF5VXRpbHMgPSByZXF1aXJlKCcuLi8uLi91dGlscy9hcnJheXV0aWxzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWRpdG9yLCBzZWxlY3Rpb25zKSB7XG4gIHZhciBvcmlnaW5hbFNlbGVjdGlvbnMgPSBudWxsO1xuICByZXR1cm4ge1xuICAgIHJ1bjogZnVuY3Rpb24oKSB7XG4gICAgICBvcmlnaW5hbFNlbGVjdGlvbnMgPSBhcnJheVV0aWxzLmNsb25lKGVkaXRvci5zZWxlY3Rpb25zKTtcbiAgICAgIGVkaXRvci5zZWxlY3Rpb25zID0gc2VsZWN0aW9ucztcbiAgICB9LFxuXG4gICAgdW5kbzogZnVuY3Rpb24oKSB7XG4gICAgICBlZGl0b3Iuc2VsZWN0aW9ucyA9IG9yaWdpbmFsU2VsZWN0aW9ucztcbiAgICB9XG4gIH07XG59OyIsInZhciBCbG9ja0NvbW1hbmQgPSByZXF1aXJlKCcuL2Jsb2NrY29tbWFuZCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGJsb2NrcywgY29vcmRzLCB2YWx1ZSkge1xuICB2YXIgY29tbWFuZCA9IG5ldyBCbG9ja0NvbW1hbmQoYmxvY2tzKTtcbiAgY29tbWFuZC5zZXRBdENvb3Jkcyhjb29yZHMsIHZhbHVlKTtcblxuICByZXR1cm4gY29tbWFuZDtcbn07IiwidmFyIFRIUkVFID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ1RIUkVFJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydUSFJFRSddIDogbnVsbCk7XG5cbnZhciBEcmFnQ2FtZXJhID0gZnVuY3Rpb24oY2FtZXJhLCBpbnB1dCkge1xuICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcbiAgdGhpcy5pbnB1dCA9IGlucHV0O1xuXG4gIHRoaXMucm90YXRpb24gPSBuZXcgVEhSRUUuRXVsZXIoLU1hdGguUEkgLyA0LCBNYXRoLlBJIC8gNCwgMCwgJ1lYWicpO1xuICB0aGlzLmxhc3RNb3VzZSA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gIHRoaXMubW91c2VTcGVlZFggPSAwLjAxO1xuICB0aGlzLm1vdXNlU3BlZWRZID0gMC4wMTtcbiAgdGhpcy5tb3VzZUtleVNwZWVkWCA9IDAuMDM7XG4gIHRoaXMubW91c2VLZXlTcGVlZFkgPSAwLjAzO1xuICB0aGlzLnVuaXRWZWN0b3IgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAxKTtcbiAgdGhpcy5kaXN0YW5jZSA9IDUwO1xuICB0aGlzLnRhcmdldCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDApO1xuICB0aGlzLm1heFBpdGNoID0gTWF0aC5QSSAvIDIgLSAwLjAxO1xuICB0aGlzLm1pblBpdGNoID0gLU1hdGguUEkgLyAyICsgMC4wMTtcbiAgdGhpcy56b29tUmF0ZSA9IDEuMTtcblxuICB0aGlzLnVwZGF0ZUNhbWVyYSgpO1xuXG4gIHRoaXMubG9jayA9IGZhbHNlO1xufTtcblxuRHJhZ0NhbWVyYS4kaW5qZWN0ID0gWydpbnB1dCddO1xuXG5EcmFnQ2FtZXJhLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucHJvY2Vzc0lucHV0KCk7XG5cbiAgdGhpcy51cGRhdGVDYW1lcmEoKTtcbn07XG5cbkRyYWdDYW1lcmEucHJvdG90eXBlLnByb2Nlc3NJbnB1dCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5pbnB1dC5tb3VzZUhvbGQoKSkge1xuICAgIGlmICghdGhpcy5sb2NrKSB7XG4gICAgICB2YXIgZGlmZiA9IG5ldyBUSFJFRS5WZWN0b3IyKCkuc3ViVmVjdG9ycyh0aGlzLmlucHV0Lm1vdXNlLCB0aGlzLmxhc3RNb3VzZSk7XG4gICAgICB0aGlzLnJvdGF0aW9uLnkgKz0gZGlmZi54ICogdGhpcy5tb3VzZVNwZWVkWTtcbiAgICAgIHRoaXMucm90YXRpb24ueCArPSBkaWZmLnkgKiB0aGlzLm1vdXNlU3BlZWRYO1xuXG4gICAgICBpZiAodGhpcy5yb3RhdGlvbi54IDwgdGhpcy5taW5QaXRjaCkgdGhpcy5yb3RhdGlvbi54ID0gdGhpcy5taW5QaXRjaDtcbiAgICAgIGlmICh0aGlzLnJvdGF0aW9uLnggPiB0aGlzLm1heFBpdGNoKSB0aGlzLnJvdGF0aW9uLnggPSB0aGlzLm1heFBpdGNoO1xuICAgIH1cbiAgfVxuXG4gIHZhciByb3RhdGVSaWdodCA9IDA7XG4gIHZhciByb3RhdGVVcCA9IDA7XG4gIGlmICh0aGlzLmlucHV0LmtleUhvbGQoJ3JpZ2h0JykpIHtcbiAgICByb3RhdGVSaWdodCsrO1xuICB9XG4gIGlmICh0aGlzLmlucHV0LmtleUhvbGQoJ2xlZnQnKSkge1xuICAgIHJvdGF0ZVJpZ2h0LS07XG4gIH1cbiAgaWYgKHRoaXMuaW5wdXQua2V5SG9sZCgndXAnKSkge1xuICAgIHJvdGF0ZVVwKys7XG4gIH1cbiAgaWYgKHRoaXMuaW5wdXQua2V5SG9sZCgnZG93bicpKSB7XG4gICAgcm90YXRlVXAtLTtcbiAgfVxuXG4gIHRoaXMucm90YXRpb24ueCArPSByb3RhdGVVcCAqIHRoaXMubW91c2VLZXlTcGVlZFg7XG4gIHRoaXMucm90YXRpb24ueSAtPSByb3RhdGVSaWdodCAqIHRoaXMubW91c2VLZXlTcGVlZFk7XG5cbiAgdGhpcy5sYXN0TW91c2UuY29weSh0aGlzLmlucHV0Lm1vdXNlKTtcblxuICBpZiAodGhpcy5pbnB1dC5rZXlVcCgnPScpKSB7XG4gICAgdGhpcy5kaXN0YW5jZSAvPSB0aGlzLnpvb21SYXRlO1xuICB9IGVsc2UgaWYgKHRoaXMuaW5wdXQua2V5VXAoJy0nKSkge1xuICAgIHRoaXMuZGlzdGFuY2UgKj0gdGhpcy56b29tUmF0ZTtcbiAgfVxufTtcblxuRHJhZ0NhbWVyYS5wcm90b3R5cGUudXBkYXRlQ2FtZXJhID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwb3NpdGlvbiA9IHRoaXMudW5pdFZlY3Rvci5jbG9uZSgpLmFwcGx5RXVsZXIodGhpcy5yb3RhdGlvbikuc2V0TGVuZ3RoKHRoaXMuZGlzdGFuY2UpLmFkZCh0aGlzLnRhcmdldCk7XG4gIHRoaXMuY2FtZXJhLnBvc2l0aW9uLmNvcHkocG9zaXRpb24pO1xuICB0aGlzLmNhbWVyYS5sb29rQXQodGhpcy50YXJnZXQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcmFnQ2FtZXJhOyIsInZhciBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydUSFJFRSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnVEhSRUUnXSA6IG51bGwpO1xudmFyIGNwciA9IHJlcXVpcmUoJy4uL2Nwci9jcHInKTtcbnZhciBDQnVmZmVyID0gcmVxdWlyZSgnY2J1ZmZlcicpO1xudmFyIGJsb2Nrc0NvbXBvbmVudCA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvYmxvY2tzJyk7XG52YXIgZHJhZ0NhbWVyYUNvbXBvbmVudCA9IHJlcXVpcmUoJy4vZHJhZ2NhbWVyYScpO1xudmFyIGVkaXRvckNvbnNvbGUgPSByZXF1aXJlKCcuL2VkaXRvcmNvbnNvbGUnKTtcbnZhciBFZGl0b3JUb29scyA9IHJlcXVpcmUoJy4vZWRpdG9ydG9vbHMnKTtcbnZhciBPZmZzZXRDb21tYW5kID0gcmVxdWlyZSgnLi9jb21tYW5kcy9vZmZzZXRjb21tYW5kJyk7XG52YXIgQmxvY2tzID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9ibG9ja3MnKTtcbnZhciBhcnJheVV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMvYXJyYXl1dGlscycpO1xuXG52YXIgdG9vbEJhciA9IHJlcXVpcmUoJy4vZ3VpL3Rvb2xiYXInKTtcbnZhciBhcnJvd0JhciA9IHJlcXVpcmUoJy4vZ3VpL2Fycm93YmFyJyk7XG52YXIgZmlsZUJhciA9IHJlcXVpcmUoJy4vZ3VpL2ZpbGViYXInKTtcbnZhciBwcmVmYWJzQmFyID0gcmVxdWlyZSgnLi9ndWkvcHJlZmFic2JhcicpO1xudmFyIHByZWZhYnNUb29sQmFyID0gcmVxdWlyZSgnLi9ndWkvcHJlZmFic3Rvb2xiYXInKTtcbnZhciBjb2xvckJhciA9IHJlcXVpcmUoJy4vZ3VpL2NvbG9yYmFyJyk7XG52YXIgcHJvcGVydHlQYW5lbCA9IHJlcXVpcmUoJy4vZ3VpL3Byb3BlcnR5cGFuZWwnKTtcblxudmFyIFBlblRvb2wgPSByZXF1aXJlKCcuL3Rvb2xzL3BlbnRvb2wnKTtcbnZhciBTYW1wbGVUb29sID0gcmVxdWlyZSgnLi90b29scy9zYW1wbGV0b29sJyk7XG52YXIgU2VsZWN0VG9vbCA9IHJlcXVpcmUoJy4vdG9vbHMvc2VsZWN0dG9vbCcpO1xudmFyIENhbWVyYVRvb2wgPSByZXF1aXJlKCcuL3Rvb2xzL2NhbWVyYXRvb2wnKTtcbnZhciBGaWxsVG9vbCA9IHJlcXVpcmUoJy4vdG9vbHMvZmlsbHRvb2wnKTtcblxudmFyIEVkaXRvciA9IGZ1bmN0aW9uKG9iamVjdCwgYXBwLCBpbnB1dCwgY2FtZXJhLCBkZXZDb25zb2xlLCBjb25maWcsIHBhbGV0dGUsIGNhbnZhcywgcHJlZmFiU2VydmljZSkge1xuXG4gIHRoaXMub2JqZWN0ID0gb2JqZWN0O1xuXG4gIHRoaXMuYXBwID0gYXBwO1xuXG4gIHRoaXMuaW5wdXQgPSBpbnB1dDtcblxuICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcblxuICB0aGlzLmRldkNvbnNvbGUgPSBkZXZDb25zb2xlO1xuXG4gIHRoaXMuY29uZmlnID0gY29uZmlnO1xuXG4gIHRoaXMucGFsZXR0ZSA9IHBhbGV0dGU7XG5cbiAgdGhpcy5jYW52YXMgPSBjYW52YXM7XG5cbiAgdGhpcy5wcmVmYWJTZXJ2aWNlID0gcHJlZmFiU2VydmljZTtcblxuICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gIHRoaXMuYmxvY2tzID0gbnVsbDtcblxuICB0aGlzLmRyYWdDYW1lcmEgPSBudWxsO1xuXG4gIHRoaXMub2JqR3JvdW5kID0gbnVsbDtcblxuICB0aGlzLm9iakJvdW5kaW5nQm94ID0gbnVsbDtcblxuICB0aGlzLl9zdGFydGVkID0gZmFsc2U7XG5cbiAgdGhpcy5tYXRlcmlhbHMgPSBbXTtcblxuICB0aGlzLnNlbGVjdGVkQ29sb3IgPSBudWxsO1xuXG4gIHRoaXMudW5kb3MgPSBDQnVmZmVyKDIwMCk7XG5cbiAgdGhpcy5yZWRvcyA9IENCdWZmZXIoMjAwKTtcblxuICB0aGlzLmNvbG9yQmFyID0gbnVsbDtcblxuICB0aGlzLnByZWZhYnNCYXIgPSBudWxsO1xuXG4gIHRoaXMucHJlZmFiVG9vbGJhciA9IG51bGw7XG5cbiAgdGhpcy50b29sQmFyID0gbnVsbDtcblxuICB0aGlzLmFycm93QmFyID0gbnVsbDtcblxuICB0aGlzLmZpbGVCYXIgPSBudWxsO1xuXG4gIHRoaXMudG9vbE5hbWVzID0gW0VkaXRvclRvb2xzLlBlbiwgRWRpdG9yVG9vbHMuU2FtcGxlLCBFZGl0b3JUb29scy5TZWxlY3QsIEVkaXRvclRvb2xzLkNhbWVyYSwgRWRpdG9yVG9vbHMuRmlsbF07XG5cbiAgdGhpcy50b29sTmFtZSA9IEVkaXRvclRvb2xzLlBlbjtcblxuICB0aGlzLnRvb2wgPSBudWxsO1xuXG4gIHRoaXMuc2VsZWN0aW9ucyA9IFtdO1xuXG4gIHRoaXMucmVmbGVjdFggPSBmYWxzZTtcblxuICB0aGlzLnJlZmxlY3RZID0gZmFsc2U7XG5cbiAgdGhpcy5yZWZsZWN0WiA9IGZhbHNlO1xuXG4gIC8vIGxvYWRlZCBzYXZlc1xuICB0aGlzLnByZWZhYnMgPSBbXTtcblxuICB0aGlzLnNjcmVlbnNob3RSZW5kZXJlciA9IG51bGw7XG5cbiAgLy8gQ29weSBvZiBibG9jayBvYmplY3RcbiAgdGhpcy5sYXN0QmxvY2tzID0gbnVsbDtcblxuICB0aGlzLm9iakhpZ2hsaWdodCA9IG51bGw7XG5cbiAgdGhpcy5zbiA9IDAuMDAwMTtcblxuICB0aGlzLmhpZ2hsaWdodENvb3JkID0gbnVsbDtcblxuICB0aGlzLmRvd25sb2FkRWxlbWVudCA9IG51bGw7XG5cbiAgdGhpcy5lZGl0TG9jayA9IGZhbHNlO1xuXG4gIHRoaXMuY2FtZXJhTG9jayA9IGZhbHNlO1xuXG4gIHRoaXMucHJvcGVydHlQYW5lbCA9IG51bGw7XG5cbiAgdGhpcy5wcmVmYWJJbmRleCA9IDA7XG59O1xuXG5FZGl0b3IuJGluamVjdCA9IFsnYXBwJywgJ2lucHV0JywgJ2NhbWVyYScsICdkZXZDb25zb2xlJywgJ2NvbmZpZycsICdwYWxldHRlJywgJ2NhbnZhcycsICdwcmVmYWJTZXJ2aWNlJ107XG5cbkVkaXRvci5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgZWRpdG9yQ29uc29sZSh0aGlzLCB0aGlzLmRldkNvbnNvbGUpO1xuXG4gIHRoaXMucHJlZmFicyA9IHRoaXMucHJlZmFiU2VydmljZS5sb2FkKCk7XG5cbiAgdGhpcy5ibG9ja3MgPSB0aGlzLmFwcC5hdHRhY2godGhpcy5vYmplY3QsIGJsb2Nrc0NvbXBvbmVudCk7XG5cbiAgdGhpcy5kcmFnQ2FtZXJhID0gdGhpcy5hcHAuYXR0YWNoKHRoaXMuY2FtZXJhLCBkcmFnQ2FtZXJhQ29tcG9uZW50KTtcblxuICB0aGlzLnVwZGF0ZVRvb2woKTtcblxuICB0aGlzLnVwZGF0ZU1hdGVyaWFsKHRoaXMuYmxvY2tzKTtcblxuICB0aGlzLnNlbGVjdGVkQ29sb3IgPSB0aGlzLnBhbGV0dGVbMF07XG5cbiAgLy8gU2V0IHVwIEdVSVxuICB0aGlzLnRvb2xCYXIgPSB0b29sQmFyKHRoaXMpO1xuICB0aGlzLmFycm93QmFyID0gYXJyb3dCYXIodGhpcyk7XG4gIHRoaXMuZmlsZUJhciA9IGZpbGVCYXIodGhpcyk7XG4gIHRoaXMuY29sb3JCYXIgPSBjb2xvckJhcih0aGlzKTtcbiAgdGhpcy5wcmVmYWJzQmFyID0gcHJlZmFic0Jhcih0aGlzKTtcbiAgdGhpcy5wcmVmYWJzVG9vbGJhciA9IHByZWZhYnNUb29sQmFyKHRoaXMpO1xuICB0aGlzLnByb3BlcnR5UGFuZWwgPSBwcm9wZXJ0eVBhbmVsKHRoaXMpO1xuXG4gIGlmICh0aGlzLnByZWZhYnMubGVuZ3RoID09PSAwKSB7XG4gICAgdGhpcy5wcmVmYWJzLnB1c2godGhpcy5ibG9ja3Muc2VyaWFsaXplKCkpO1xuICB9XG5cbiAgdGhpcy5sb2FkKHRoaXMucHJlZmFic1swXSk7XG4gIHRoaXMudXBkYXRlU2NyZWVuc2hvdHMoKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUuc2V0VG9vbCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgdmFyIGluZGV4ID0gYXJyYXlVdGlscy5pbmRleE9mKHRoaXMudG9vbE5hbWVzLCBuYW1lKTtcbiAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMudG9vbEJhci5oaWdobGlnaHQoaW5kZXgpO1xuICB0aGlzLnRvb2xOYW1lID0gbmFtZTtcbiAgdGhpcy51cGRhdGVUb29sKCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCF0aGlzLl9zdGFydGVkKSB7XG4gICAgdGhpcy5zdGFydCgpO1xuICAgIHRoaXMuX3N0YXJ0ZWQgPSB0cnVlO1xuICB9XG5cbiAgdGhpcy5jb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcblxuICB2YXIgaGFzSW50ZXJzZWN0ID0gdGhpcy5nZXRDb29yZEFib3ZlKCkgIT0gbnVsbDtcblxuICBpZiAoIWhhc0ludGVyc2VjdCAmJiB0aGlzLmlucHV0Lm1vdXNlRG93bigpKSB7XG4gICAgdGhpcy5lZGl0TG9jayA9IHRydWU7XG4gIH1cblxuICBpZiAoaGFzSW50ZXJzZWN0ICYmIHRoaXMuaW5wdXQubW91c2VEb3duKCkpIHtcbiAgICB0aGlzLmNhbWVyYUxvY2sgPSB0cnVlO1xuICB9XG5cbiAgaWYgKHRoaXMuaW5wdXQubW91c2VVcCgpKSB7XG4gICAgdGhpcy5lZGl0TG9jayA9IGZhbHNlO1xuICAgIHRoaXMuY2FtZXJhTG9jayA9IGZhbHNlO1xuICB9XG5cbiAgaWYgKHRoaXMudG9vbE5hbWUgPT09IEVkaXRvclRvb2xzLlNlbGVjdCB8fCB0aGlzLnRvb2xOYW1lID09PSBFZGl0b3JUb29scy5TYW1wbGUpIHtcbiAgICB0aGlzLmNhbWVyYUxvY2sgPSB0cnVlO1xuICB9IGVsc2UgaWYgKHRoaXMudG9vbE5hbWUgPT09IEVkaXRvclRvb2xzLkNhbWVyYSkge1xuICAgIHRoaXMuY2FtZXJhTG9jayA9IGZhbHNlO1xuICB9XG5cbiAgdGhpcy5kcmFnQ2FtZXJhLmxvY2sgPSB0aGlzLmNhbWVyYUxvY2s7XG5cbiAgdGhpcy50b29sLnRpY2soKTtcblxuICB0aGlzLnVwZGF0ZUhpZ2hsaWdodCh0aGlzLmhpZ2hsaWdodENvb3JkKTtcblxuICB0aGlzLmRyYXdTZWxlY3Rpb24oKTtcblxuICB2YXIgb2Zmc2V0Q29vcmQgPSBudWxsO1xuICBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCdmJykpIHtcbiAgICBvZmZzZXRDb29yZCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIC0xLCAwKTtcbiAgfVxuICBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCdyJykpIHtcbiAgICBvZmZzZXRDb29yZCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDEsIDApO1xuICB9XG4gIGlmICh0aGlzLmlucHV0LmtleURvd24oJ2EnKSkge1xuICAgIG9mZnNldENvb3JkID0gbmV3IFRIUkVFLlZlY3RvcjMoLTEsIDAsIDApO1xuICB9XG4gIGlmICh0aGlzLmlucHV0LmtleURvd24oJ2QnKSkge1xuICAgIG9mZnNldENvb3JkID0gbmV3IFRIUkVFLlZlY3RvcjMoMSwgMCwgMCk7XG4gIH1cbiAgaWYgKHRoaXMuaW5wdXQua2V5RG93bigndycpKSB7XG4gICAgb2Zmc2V0Q29vcmQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSk7XG4gIH1cbiAgaWYgKHRoaXMuaW5wdXQua2V5RG93bigncycpKSB7XG4gICAgb2Zmc2V0Q29vcmQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAxKTtcbiAgfVxuXG4gIGlmIChvZmZzZXRDb29yZCAhPSBudWxsKSB7XG4gICAgdGhpcy5hcHBseU9mZnNldChvZmZzZXRDb29yZCk7XG4gIH1cblxuICBpZiAodGhpcy5pbnB1dC5rZXlIb2xkKCdjb21tYW5kJykgJiYgdGhpcy5pbnB1dC5rZXlIb2xkKCdzaGlmdCcpKSB7XG4gICAgaWYgKHRoaXMuaW5wdXQua2V5RG93bigneicpKSB7XG4gICAgICB0aGlzLnJlZG8oKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodGhpcy5pbnB1dC5rZXlIb2xkKCdjb21tYW5kJykpIHtcbiAgICBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCd6JykpIHtcbiAgICAgIHRoaXMudW5kbygpO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0aGlzLmlucHV0LmtleURvd24oJzEnKSkge1xuICAgIHRoaXMuc2V0VG9vbCh0aGlzLnRvb2xOYW1lc1swXSk7XG4gIH0gZWxzZSBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCcyJykpIHtcbiAgICB0aGlzLnNldFRvb2wodGhpcy50b29sTmFtZXNbMV0pO1xuICB9IGVsc2UgaWYgKHRoaXMuaW5wdXQua2V5RG93bignMycpKSB7XG4gICAgdGhpcy5zZXRUb29sKHRoaXMudG9vbE5hbWVzWzJdKTtcbiAgfSBlbHNlIGlmICh0aGlzLmlucHV0LmtleURvd24oJzQnKSkge1xuICAgIHRoaXMuc2V0VG9vbCh0aGlzLnRvb2xOYW1lc1szXSk7XG4gIH1cbn07XG5cbkVkaXRvci5wcm90b3R5cGUudW5kbyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY29tbWFuZCA9IHRoaXMudW5kb3MubGFzdCgpO1xuICBpZiAoY29tbWFuZCA9PSBudWxsKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbW1hbmQudW5kbygpO1xuICB0aGlzLnVuZG9zLnBvcCgpO1xuICB0aGlzLnJlZG9zLnB1c2goY29tbWFuZCk7XG4gIHRoaXMudXBkYXRlQ3VycmVudFNjcmVlbnNob3QoKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUucmVkbyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY29tbWFuZCA9IHRoaXMucmVkb3MubGFzdCgpO1xuICBpZiAoY29tbWFuZCA9PSBudWxsKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbW1hbmQucnVuKCk7XG4gIHRoaXMucmVkb3MucG9wKCk7XG4gIHRoaXMudW5kb3MucHVzaChjb21tYW5kKTtcbiAgdGhpcy51cGRhdGVDdXJyZW50U2NyZWVuc2hvdCgpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5ydW5Db21tYW5kID0gZnVuY3Rpb24oY29tbWFuZCkge1xuICBjb21tYW5kLnJ1bigpO1xuICB0aGlzLnVuZG9zLnB1c2goY29tbWFuZCk7XG4gIHRoaXMucmVkb3MgPSBDQnVmZmVyKDIwMCk7XG4gIHRoaXMudXBkYXRlQ3VycmVudFNjcmVlbnNob3QoKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUudXBkYXRlQ3VycmVudFNjcmVlbnNob3QgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGluZGV4ID0gdGhpcy5wcmVmYWJJbmRleDtcbiAgdGhpcy5wcmVmYWJzW2luZGV4XSA9IHRoaXMuYmxvY2tzLnNlcmlhbGl6ZSgpO1xuICB0aGlzLnVwZGF0ZVNjcmVlbnNob3RBdEluZGV4KGluZGV4KTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUudXBkYXRlU2NyZWVuc2hvdHMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wcmVmYWJzQmFyLmNsZWFyKCk7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnByZWZhYnMubGVuZ3RoOyBpKyspIHtcbiAgICB0aGlzLnVwZGF0ZVNjcmVlbnNob3RBdEluZGV4KGkpO1xuICB9XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnVwZGF0ZVNjcmVlbnNob3RBdEluZGV4ID0gZnVuY3Rpb24oaW5kZXgpIHtcbiAgdmFyIHByZWZhYiA9IHRoaXMucHJlZmFic1tpbmRleF07XG4gIHZhciBpbWdEYXRhID0gdGhpcy5zY3JlZW5zaG90KHByZWZhYik7XG5cbiAgdGhpcy5wcmVmYWJzQmFyLnNldChpbmRleCwge1xuICAgIGltZ0RhdGE6IGltZ0RhdGEsXG4gICAgaW5kZXg6IGluZGV4XG4gIH0pO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS51cGRhdGVNYXRlcmlhbCA9IGZ1bmN0aW9uKGJsb2Nrcykge1xuICB2YXIgbWF0ZXJpYWxzID0gYmxvY2tzLm1hdGVyaWFsLm1hdGVyaWFscztcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1hdGVyaWFscy5sZW5ndGg7IGkrKykge1xuICAgIG1hdGVyaWFsc1tpXSA9IHRoaXMubWF0ZXJpYWxzW2ldO1xuICB9XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnVwZGF0ZVNpemUgPSBmdW5jdGlvbihzaXplKSB7XG4gIHRoaXMuYmxvY2tzLnNldERpbShbc2l6ZVswXSwgc2l6ZVsxXSwgc2l6ZVsyXV0pO1xuICB0aGlzLmJsb2Nrcy5vYmoucG9zaXRpb24uc2V0KC1zaXplWzBdIC8gMiwgLXNpemVbMV0gLyAyLCAtc2l6ZVsyXSAvIDIpO1xuICB0aGlzLnVwZGF0ZUdyb3VuZChzaXplKTtcbiAgdGhpcy51cGRhdGVCb3VuZGluZ0JveChzaXplKTtcblxuICAvLyBNYXggZnJvbSAzIG51bWJlcnNcbiAgdmFyIG1heFNpemUgPSBNYXRoLm1heChzaXplWzBdLCBzaXplWzFdLCBzaXplWzJdKTtcbiAgdGhpcy5kcmFnQ2FtZXJhLmRpc3RhbmNlID0gMiAqIChtYXhTaXplKTtcbiAgdGhpcy51cGRhdGVDdXJyZW50UHJlZmFiKCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnVwZGF0ZUdyb3VuZCA9IGZ1bmN0aW9uKHNpemUpIHtcbiAgaWYgKHRoaXMub2JqR3JvdW5kICE9IG51bGwpIHtcbiAgICB0aGlzLm9iamVjdC5yZW1vdmUodGhpcy5vYmpHcm91bmQpO1xuICB9XG5cbiAgdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkdlb21ldHJ5KCk7XG4gIGdlb21ldHJ5LnZlcnRpY2VzLnB1c2goXG4gICAgbmV3IFRIUkVFLlZlY3RvcjMoLXNpemVbMF0gLyAyLCAtc2l6ZVsxXSAvIDIsIC1zaXplWzJdIC8gMiksXG4gICAgbmV3IFRIUkVFLlZlY3RvcjMoc2l6ZVswXSAvIDIsIC1zaXplWzFdIC8gMiwgLXNpemVbMl0gLyAyKSxcbiAgICBuZXcgVEhSRUUuVmVjdG9yMyhzaXplWzBdIC8gMiwgLXNpemVbMV0gLyAyLCBzaXplWzJdIC8gMiksXG4gICAgbmV3IFRIUkVFLlZlY3RvcjMoLXNpemVbMF0gLyAyLCAtc2l6ZVsxXSAvIDIsIHNpemVbMl0gLyAyKVxuICApO1xuICBnZW9tZXRyeS5mYWNlcy5wdXNoKFxuICAgIG5ldyBUSFJFRS5GYWNlMygyLCAxLCAwKSxcbiAgICBuZXcgVEhSRUUuRmFjZTMoMCwgMywgMilcbiAgKTtcbiAgZ2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXS5wdXNoKFxuICAgIFtcbiAgICAgIG5ldyBUSFJFRS5WZWN0b3IyKDAsIDApLFxuICAgICAgbmV3IFRIUkVFLlZlY3RvcjIoc2l6ZVsyXSAvIDIsIDApLFxuICAgICAgbmV3IFRIUkVFLlZlY3RvcjIoc2l6ZVsyXSAvIDIsIHNpemVbMF0gLyAyKVxuICAgIF0sIFtcbiAgICAgIG5ldyBUSFJFRS5WZWN0b3IyKHNpemVbMl0gLyAyLCBzaXplWzBdIC8gMiksXG4gICAgICBuZXcgVEhSRUUuVmVjdG9yMigwLCBzaXplWzBdIC8gMiksXG4gICAgICBuZXcgVEhSRUUuVmVjdG9yMigwLCAwKVxuICAgIF1cbiAgKTtcbiAgdmFyIG1hdGVyaWFsID0gbWF0ZXJpYWxzWydwbGFjZWhvbGRlciddO1xuICB0aGlzLm9iakdyb3VuZCA9IG5ldyBUSFJFRS5NZXNoKGdlb21ldHJ5LCBtYXRlcmlhbCk7XG4gIHRoaXMub2JqZWN0LmFkZCh0aGlzLm9iakdyb3VuZCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnVwZGF0ZUJvdW5kaW5nQm94ID0gZnVuY3Rpb24oc2l6ZSkge1xuICBpZiAodGhpcy5vYmpCb3VuZGluZ0JveCAhPSBudWxsKSB7XG4gICAgdGhpcy5vYmplY3QucmVtb3ZlKHRoaXMub2JqQm91bmRpbmdCb3gpO1xuICB9XG5cbiAgdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkdlb21ldHJ5KCk7XG5cbiAgdmFyIGEgPSBuZXcgVEhSRUUuVmVjdG9yMygtc2l6ZVswXSAvIDIsIC1zaXplWzFdIC8gMiwgLXNpemVbMl0gLyAyKTtcbiAgdmFyIGIgPSBuZXcgVEhSRUUuVmVjdG9yMyhzaXplWzBdIC8gMiwgLXNpemVbMV0gLyAyLCAtc2l6ZVsyXSAvIDIpO1xuICB2YXIgYyA9IG5ldyBUSFJFRS5WZWN0b3IzKHNpemVbMF0gLyAyLCAtc2l6ZVsxXSAvIDIsIHNpemVbMl0gLyAyKTtcbiAgdmFyIGQgPSBuZXcgVEhSRUUuVmVjdG9yMygtc2l6ZVswXSAvIDIsIC1zaXplWzFdIC8gMiwgc2l6ZVsyXSAvIDIpO1xuXG4gIHZhciBlID0gbmV3IFRIUkVFLlZlY3RvcjMoLXNpemVbMF0gLyAyLCBzaXplWzFdIC8gMiwgLXNpemVbMl0gLyAyKTtcbiAgdmFyIGYgPSBuZXcgVEhSRUUuVmVjdG9yMyhzaXplWzBdIC8gMiwgc2l6ZVsxXSAvIDIsIC1zaXplWzJdIC8gMik7XG4gIHZhciBnID0gbmV3IFRIUkVFLlZlY3RvcjMoc2l6ZVswXSAvIDIsIHNpemVbMV0gLyAyLCBzaXplWzJdIC8gMik7XG4gIHZhciBoID0gbmV3IFRIUkVFLlZlY3RvcjMoLXNpemVbMF0gLyAyLCBzaXplWzFdIC8gMiwgc2l6ZVsyXSAvIDIpO1xuXG4gIGdlb21ldHJ5LnZlcnRpY2VzLnB1c2goYSwgZSwgYiwgZiwgYywgZywgZCwgaCwgZSwgZiwgZiwgZywgZywgaCwgaCwgZSk7XG5cbiAgdmFyIG1hdGVyaWFsID0gbmV3IFRIUkVFLkxpbmVCYXNpY01hdGVyaWFsKHtcbiAgICBjb2xvcjogMHhmZmZmZmYsXG4gICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgb3BhY2l0eTogMC41XG4gIH0pO1xuICB0aGlzLm9iakJvdW5kaW5nQm94ID0gbmV3IFRIUkVFLkxpbmVTZWdtZW50cyhnZW9tZXRyeSwgbWF0ZXJpYWwpO1xuICB0aGlzLm9iamVjdC5hZGQodGhpcy5vYmpCb3VuZGluZ0JveCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnVwZGF0ZVRvb2wgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMudG9vbCAhPSBudWxsKSB7XG4gICAgaWYgKHRoaXMudG9vbC5kaXNwb3NlICE9IG51bGwpIHtcbiAgICAgIHRoaXMudG9vbC5kaXNwb3NlKCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHRoaXMudG9vbE5hbWUgPT09IEVkaXRvclRvb2xzLlBlbikge1xuICAgIHRoaXMudG9vbCA9IG5ldyBQZW5Ub29sKHRoaXMpO1xuICB9IGVsc2UgaWYgKHRoaXMudG9vbE5hbWUgPT09IEVkaXRvclRvb2xzLlNhbXBsZSkge1xuICAgIHRoaXMudG9vbCA9IG5ldyBTYW1wbGVUb29sKHRoaXMpO1xuICB9IGVsc2UgaWYgKHRoaXMudG9vbE5hbWUgPT09IEVkaXRvclRvb2xzLlNlbGVjdCkge1xuICAgIHRoaXMudG9vbCA9IG5ldyBTZWxlY3RUb29sKHRoaXMpO1xuICB9IGVsc2UgaWYgKHRoaXMudG9vbE5hbWUgPT09IEVkaXRvclRvb2xzLkNhbWVyYSkge1xuICAgIHRoaXMudG9vbCA9IG5ldyBDYW1lcmFUb29sKHRoaXMpO1xuICB9IGVsc2UgaWYgKHRoaXMudG9vbE5hbWUgPT09IEVkaXRvclRvb2xzLkZpbGwpIHtcbiAgICB0aGlzLnRvb2wgPSBuZXcgRmlsbFRvb2wodGhpcyk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgbWFrZSB0b29sIG5hbWVkOiAnICsgdGhpcy50b29sTmFtZSk7XG4gIH1cbn07XG5cbkVkaXRvci5wcm90b3R5cGUuZHJhd1NlbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYmxvY2tzID0gdGhpcy5ibG9ja3M7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zZWxlY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGNvb3JkID0gdGhpcy5zZWxlY3Rpb25zW2ldO1xuICAgIGNvb3JkID0gY29vcmQuY2xvbmUoKS5hZGQobmV3IFRIUkVFLlZlY3RvcjMoMC41LCAwLjUsIDAuNSkpO1xuICAgIHZhciBsb2NhbFBvaW50ID0gYmxvY2tzLmNvb3JkVG9Qb2ludChjb29yZCk7XG4gICAgdmFyIHdvcmxkUG9pbnQgPSBibG9ja3Mub2JqLmxvY2FsVG9Xb3JsZChsb2NhbFBvaW50KTtcbiAgICB2YXIgdmVjdG9yID0gd29ybGRQb2ludC5wcm9qZWN0KHRoaXMuY2FtZXJhKTtcbiAgICB2ZWN0b3IueCA9IE1hdGgucm91bmQoKHZlY3Rvci54ICsgMSkgKiBjYW52YXMud2lkdGggLyAyKTtcbiAgICB2ZWN0b3IueSA9IE1hdGgucm91bmQoKC12ZWN0b3IueSArIDEpICogY2FudmFzLmhlaWdodCAvIDIpO1xuXG4gICAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9ICcjZmZmZmZmJztcbiAgICB0aGlzLmNvbnRleHQuZmlsbFJlY3QodmVjdG9yLngsIHZlY3Rvci55LCAxLCAxKTtcbiAgfVxufTtcblxuRWRpdG9yLnByb3RvdHlwZS5jcmVhdGVOZXcgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5ibG9ja3MuY2xlYXIoKTtcbiAgdmFyIHByZWZhYiA9IHRoaXMuYmxvY2tzLnNlcmlhbGl6ZSgpO1xuICB0aGlzLnByZWZhYnMucHVzaChwcmVmYWIpO1xuICB0aGlzLnVwZGF0ZVNjcmVlbnNob3RBdEluZGV4KHRoaXMucHJlZmFicy5sZW5ndGggLSAxKTtcbiAgdGhpcy5wcmVmYWJJbmRleCA9IHRoaXMucHJlZmFicy5sZW5ndGggLSAxO1xuICB0aGlzLnByZWZhYnNCYXIuaGlnaGxpZ2h0KHRoaXMucHJlZmFicy5sZW5ndGggLSAxKTtcbiAgdGhpcy51cGRhdGVQcm9wZXJ0eVBhbmVsKCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnJlbW92ZVNlbGVjdGVkID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucHJlZmFicy5zcGxpY2UodGhpcy5wcmVmYWJJbmRleCwgMSk7XG5cbiAgdGhpcy51cGRhdGVTY3JlZW5zaG90cygpO1xuXG4gIGlmICh0aGlzLnByZWZhYkluZGV4ID4gdGhpcy5wcmVmYWJzLmxlbmd0aCAtIDEpIHtcbiAgICB0aGlzLnByZWZhYkluZGV4ID0gdGhpcy5wcmVmYWJzLmxlbmd0aCAtIDE7XG4gICAgdGhpcy5wcmVmYWJzQmFyLmhpZ2hsaWdodCh0aGlzLnByZWZhYkluZGV4KTtcbiAgICB0aGlzLnVwZGF0ZVByb3BlcnR5UGFuZWwoKTtcbiAgfVxuXG4gIGlmICh0aGlzLnByZWZhYkluZGV4ID49IDApIHtcbiAgICB0aGlzLmJsb2Nrcy5kZXNlcmlhbGl6ZSh0aGlzLnByZWZhYnNbdGhpcy5wcmVmYWJJbmRleF0pO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuYmxvY2tzLmNsZWFyKCk7XG4gIH1cbn07XG5cbkVkaXRvci5wcm90b3R5cGUuY3JlYXRlQ2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHByZWZhYiA9IHRoaXMuYmxvY2tzLnNlcmlhbGl6ZSgpO1xuICB0aGlzLnByZWZhYnMucHVzaChwcmVmYWIpO1xuICB0aGlzLnVwZGF0ZVNjcmVlbnNob3RBdEluZGV4KHRoaXMucHJlZmFicy5sZW5ndGggLSAxKTtcbiAgdGhpcy5wcmVmYWJzQmFyLmhpZ2hsaWdodCh0aGlzLnByZWZhYnMubGVuZ3RoIC0gMSk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnNjcmVlbnNob3QgPSBmdW5jdGlvbihkYXRhKSB7XG4gIGlmICh0aGlzLnNjcmVlbnNob3RSZW5kZXJlciA9PSBudWxsKSB7XG4gICAgdGhpcy5zY3JlZW5zaG90UmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlcih7XG4gICAgICBhbHBoYTogdHJ1ZVxuICAgIH0pO1xuICAgIHRoaXMuc2NyZWVuc2hvdFJlbmRlcmVyLnNldENsZWFyQ29sb3IoMHhmZmZmZmYsIDAuMCk7XG4gIH1cblxuICB2YXIgcmVuZGVyZXIgPSB0aGlzLnNjcmVlbnNob3RSZW5kZXJlcjtcblxuICB2YXIgd2lkdGggPSAxMDA7XG4gIHZhciBoZWlnaHQgPSAxMDA7XG4gIHJlbmRlcmVyLnNldFNpemUod2lkdGgsIGhlaWdodCk7XG5cbiAgdmFyIG9iamVjdCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICB2YXIgYmxvY2tzID0gbmV3IEJsb2NrcyhvYmplY3QpO1xuICBibG9ja3MuZGVzZXJpYWxpemUoZGF0YSk7XG4gIGJsb2Nrcy50aWNrKCk7XG5cbiAgdmFyIGRpbSA9IGJsb2Nrcy5kaW07XG5cbiAgYmxvY2tzLm9iai5wb3NpdGlvbi5zZXQoLWRpbVswXSAvIDIsIC1kaW1bMV0gLyAyLCAtZGltWzJdIC8gMik7XG5cbiAgdmFyIG9iamVjdENsb25lID0gb2JqZWN0LmNsb25lKCk7XG4gIHZhciBzY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xuICBzY2VuZS5hZGQob2JqZWN0Q2xvbmUpO1xuXG4gIHZhciBhbWJpZW50ID0gbmV3IFRIUkVFLkFtYmllbnRMaWdodChuZXcgVEhSRUUuQ29sb3IoXCJyZ2IoNjAlLCA2MCUsIDYwJSlcIikpO1xuICB2YXIgbGlnaHQgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCgweGZmZmZmZiwgMC42KTtcbiAgbGlnaHQucG9zaXRpb24uc2V0KDAuOCwgMSwgMC41KTtcbiAgc2NlbmUuYWRkKGxpZ2h0KTtcbiAgc2NlbmUuYWRkKGFtYmllbnQpO1xuXG4gIHZhciBtYXhTaXplID0gTWF0aC5tYXgoZGltWzBdLCBkaW1bMV0sIGRpbVsyXSkgKiAyO1xuXG4gIHZhciBjYW1lcmEgPSBuZXcgVEhSRUUuT3J0aG9ncmFwaGljQ2FtZXJhKG1heFNpemUgLyAtMiwgbWF4U2l6ZSAvIDIsIG1heFNpemUgLyAyLCBtYXhTaXplIC8gLTIsIDAuMSwgMTAwMCk7XG4gIGNhbWVyYS5wb3NpdGlvbi5zZXQoMCwgMCwgMTApO1xuXG4gIHZhciBjYW1lcmFQb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIG1heFNpemUpXG4gICAgLmFwcGx5RXVsZXIobmV3IFRIUkVFLkV1bGVyKC1NYXRoLlBJIC8gNCwgMCwgMCwgJ1lYWicpKVxuICBjYW1lcmEucG9zaXRpb24uY29weShjYW1lcmFQb3NpdGlvbik7XG4gIGNhbWVyYS5sb29rQXQobmV3IFRIUkVFLlZlY3RvcjMoKSk7XG5cbiAgcmVuZGVyZXIucmVuZGVyKHNjZW5lLCBjYW1lcmEpO1xuICBpbWdEYXRhID0gcmVuZGVyZXIuZG9tRWxlbWVudC50b0RhdGFVUkwoKTtcblxuICByZW5kZXJlci5kaXNwb3NlKCk7XG5cbiAgcmV0dXJuIGltZ0RhdGE7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbihkYXRhKSB7XG4gIHRoaXMuYmxvY2tzLmRlc2VyaWFsaXplKGRhdGEpO1xuXG4gIHRoaXMudXBkYXRlU2l6ZSh0aGlzLmJsb2Nrcy5kaW0pO1xuXG4gIHRoaXMudXBkYXRlTGFzdEJsb2NrcygpO1xuXG4gIHRoaXMudXBkYXRlUHJvcGVydHlQYW5lbCgpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS51cGRhdGVQcm9wZXJ0eVBhbmVsID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwcmVmYWIgPSB0aGlzLmdldFNlbGVjdGVkUHJlZmFiKCk7XG5cbiAgdGhpcy5wcm9wZXJ0eVBhbmVsLmNvbnRyb2xsZXJzWyduYW1lJ10uc2V0VmFsdWUocHJlZmFiLnVzZXJEYXRhLm5hbWUgfHwgJ3VubmFtZWQnKTtcblxuICB2YXIgZGltID0gcHJlZmFiLmRpbTtcbiAgdmFyIGZvcm1hdHRlZFNpemUgPSBkaW0uam9pbignICcpO1xuICB0aGlzLnByb3BlcnR5UGFuZWwuY29udHJvbGxlcnNbJ3NpemUnXS5zZXRWYWx1ZShmb3JtYXR0ZWRTaXplKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wcmVmYWJTZXJ2aWNlLnJlc2V0KCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnNhdmUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wcmVmYWJTZXJ2aWNlLnNhdmUodGhpcy5wcmVmYWJzKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUudXBkYXRlTGFzdEJsb2NrcyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmJsb2Nrcy51cGRhdGVNZXNoKCk7XG4gIHRoaXMubGFzdEJsb2NrcyA9IHRoaXMuYmxvY2tzLm9iai5jbG9uZSgpO1xuICB0aGlzLmxhc3RCbG9ja3MudXBkYXRlTWF0cml4V29ybGQoKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUuZ2V0Q29vcmRBYm92ZSA9IGZ1bmN0aW9uKHBvaW50KSB7XG4gIHBvaW50ID0gcG9pbnQgfHwgdGhpcy5pbnB1dC5tb3VzZTtcbiAgdmFyIG9iamVjdHMgPSBbXTtcbiAgaWYgKHRoaXMubGFzdEJsb2NrcyAhPSBudWxsKSBvYmplY3RzLnB1c2godGhpcy5sYXN0QmxvY2tzKTtcbiAgaWYgKHRoaXMub2JqR3JvdW5kICE9IG51bGwpIG9iamVjdHMucHVzaCh0aGlzLm9iakdyb3VuZCk7XG4gIHJldHVybiB0aGlzLmdldENvb3JkKG9iamVjdHMsIHBvaW50LCAtdGhpcy5zbik7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLmdldENvb3JkQmVsb3cgPSBmdW5jdGlvbihwb2ludCkge1xuICBwb2ludCA9IHBvaW50IHx8IHRoaXMuaW5wdXQubW91c2U7XG4gIHZhciBvYmplY3RzID0gW107XG4gIGlmICh0aGlzLmxhc3RCbG9ja3MgIT0gbnVsbCkgb2JqZWN0cy5wdXNoKHRoaXMubGFzdEJsb2Nrcyk7XG4gIHZhciBjb29yZCA9IHRoaXMuZ2V0Q29vcmQob2JqZWN0cywgcG9pbnQsIHRoaXMuc24pO1xuXG4gIGlmIChjb29yZCA9PSBudWxsICYmIHRoaXMub2JqR3JvdW5kICE9IG51bGwpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRDb29yZChbdGhpcy5vYmpHcm91bmRdLCBwb2ludCwgLXRoaXMuc24pO1xuICB9XG5cbiAgcmV0dXJuIGNvb3JkO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5nZXRDb29yZCA9IGZ1bmN0aW9uKG9iamVjdHMsIGF0UG9pbnQsIGRlbHRhKSB7XG4gIHZhciB2aWV3cG9ydCA9IHRoaXMuaW5wdXQuc2NyZWVuVG9WaWV3cG9ydChhdFBvaW50KTtcbiAgdmFyIHJheWNhc3RlciA9IG5ldyBUSFJFRS5SYXljYXN0ZXIoKTtcbiAgcmF5Y2FzdGVyLnNldEZyb21DYW1lcmEodmlld3BvcnQsIHRoaXMuY2FtZXJhKTtcbiAgdmFyIGludGVyc2VjdHMgPSByYXljYXN0ZXIuaW50ZXJzZWN0T2JqZWN0cyhvYmplY3RzLCB0cnVlKTtcblxuICBpZiAoaW50ZXJzZWN0cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgdmFyIGludGVyc2VjdCA9IGludGVyc2VjdHNbMF07XG5cbiAgdmFyIHBvaW50ID0gaW50ZXJzZWN0LnBvaW50O1xuICB2YXIgZGlmZiA9IHBvaW50LmNsb25lKCkuc3ViKHRoaXMuY2FtZXJhLnBvc2l0aW9uKTtcbiAgZGlmZiA9IGRpZmYuc2V0TGVuZ3RoKGRpZmYubGVuZ3RoKCkgKyAoZGVsdGEgfHwgMCkpO1xuICBwb2ludCA9IHRoaXMuY2FtZXJhLnBvc2l0aW9uLmNsb25lKCkuYWRkKGRpZmYpO1xuXG4gIHZhciBsb2NhbFBvaW50ID0gdGhpcy5ibG9ja3Mub2JqLndvcmxkVG9Mb2NhbChwb2ludCk7XG4gIHZhciBjb29yZCA9IHRoaXMuYmxvY2tzLnBvaW50VG9Db29yZChsb2NhbFBvaW50KTtcbiAgY29vcmQgPSBuZXcgVEhSRUUuVmVjdG9yMyhcbiAgICBNYXRoLnJvdW5kKGNvb3JkLngpLFxuICAgIE1hdGgucm91bmQoY29vcmQueSksXG4gICAgTWF0aC5yb3VuZChjb29yZC56KVxuICApO1xuXG4gIHJldHVybiBjb29yZDtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUudXBkYXRlSGlnaGxpZ2h0ID0gZnVuY3Rpb24oY29vcmQpIHtcbiAgaWYgKHRoaXMub2JqSGlnaGxpZ2h0ID09IG51bGwpIHtcbiAgICB2YXIgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuQm94R2VvbWV0cnkoMSwgMSwgMSk7XG4gICAgdmFyIG1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKCk7XG4gICAgdmFyIG1lc2ggPSBuZXcgVEhSRUUuTWVzaChnZW9tZXRyeSwgbWF0ZXJpYWwpO1xuICAgIHZhciB3aXJlZnJhbWUgPSBuZXcgVEhSRUUuRWRnZXNIZWxwZXIobWVzaCwgMHhmZmZmZmYpO1xuICAgIHRoaXMub2JqSGlnaGxpZ2h0ID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gICAgdGhpcy5vYmpIaWdobGlnaHQuYWRkKHdpcmVmcmFtZSk7XG4gICAgdGhpcy5vYmplY3QuYWRkKHRoaXMub2JqSGlnaGxpZ2h0KTtcbiAgfVxuXG4gIGlmIChjb29yZCA9PSBudWxsKSB7XG4gICAgdGhpcy5vYmpIaWdobGlnaHQudmlzaWJsZSA9IGZhbHNlO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvb3JkID0gY29vcmQuY2xvbmUoKS5hZGQobmV3IFRIUkVFLlZlY3RvcjMoMC41LCAwLjUsIDAuNSkpO1xuICB0aGlzLm9iakhpZ2hsaWdodC52aXNpYmxlID0gdHJ1ZTtcbiAgdmFyIGxvY2FsUG9pbnQgPSB0aGlzLmJsb2Nrcy5jb29yZFRvUG9pbnQoY29vcmQpO1xuICB2YXIgd29ybGRQb2ludCA9IHRoaXMuYmxvY2tzLm9iai5sb2NhbFRvV29ybGQobG9jYWxQb2ludCk7XG4gIHRoaXMub2JqSGlnaGxpZ2h0LnBvc2l0aW9uLmNvcHkod29ybGRQb2ludCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnNldFNlbGVjdGVkQ29sb3IgPSBmdW5jdGlvbihjb2xvcikge1xuICB2YXIgaW5kZXggPSBhcnJheVV0aWxzLmluZGV4T2YodGhpcy5wYWxldHRlLCBmdW5jdGlvbihjKSB7XG4gICAgcmV0dXJuIGNvbG9yID09PSBjIHx8IChjb2xvciA9PSBudWxsICYmIGMuaXNDbGVhckNvbG9yKTtcbiAgfSk7XG5cbiAgaWYgKGluZGV4ID09IC0xKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhpcy5zZWxlY3RlZENvbG9yID0gY29sb3I7XG4gIHRoaXMuY29sb3JCYXIuaGlnaGxpZ2h0KGluZGV4KTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUuYXBwbHlPZmZzZXQgPSBmdW5jdGlvbihvZmZzZXQpIHtcbiAgdmFyIHNlbGVjdGVkQ29vcmRzO1xuICBpZiAodGhpcy5zZWxlY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICBzZWxlY3RlZENvb3JkcyA9IHRoaXMuc2VsZWN0aW9ucztcbiAgfSBlbHNlIHtcbiAgICBzZWxlY3RlZENvb3JkcyA9IHRoaXMuYmxvY2tzLmdldEFsbENvb3JkcygpO1xuICB9XG5cbiAgdGhpcy5ydW5Db21tYW5kKG5ldyBPZmZzZXRDb21tYW5kKHRoaXMsIHRoaXMuYmxvY2tzLCBzZWxlY3RlZENvb3Jkcywgb2Zmc2V0KSk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLmRvd25sb2FkSlNPTiA9IGZ1bmN0aW9uKGpzb24sIG5hbWUpIHtcbiAgbmFtZSA9IG5hbWUgfHwgJ2Jsb2Nrcyc7XG4gIHZhciBkYXRhU3RyID0gXCJkYXRhOnRleHQvanNvbjtjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KGpzb24pKTtcbiAgaWYgKHRoaXMuZG93bmxvYWRFbGVtZW50ID09IG51bGwpIHtcbiAgICB0aGlzLmRvd25sb2FkRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICB0aGlzLmRvd25sb2FkRWxlbWVudC5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmRvd25sb2FkRWxlbWVudCk7XG4gIH1cbiAgdGhpcy5kb3dubG9hZEVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBkYXRhU3RyKTtcbiAgdGhpcy5kb3dubG9hZEVsZW1lbnQuc2V0QXR0cmlidXRlKFwiZG93bmxvYWRcIiwgbmFtZSArICcuanNvbicpO1xuICB0aGlzLmRvd25sb2FkRWxlbWVudC5jbGljaygpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5zZXJpYWxpemUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuYmxvY2tzLnNlcmlhbGl6ZSgpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5nZXRTZWxlY3RlZFByZWZhYiA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5wcmVmYWJzW3RoaXMucHJlZmFiSW5kZXhdO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS51cGRhdGVDdXJyZW50UHJlZmFiID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucHJlZmFic1t0aGlzLnByZWZhYkluZGV4XSA9IHRoaXMuYmxvY2tzLnNlcmlhbGl6ZSgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3I7IiwidmFyIEVkaXRvciA9IHJlcXVpcmUoJy4vZWRpdG9yJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWRpdG9yLCBkZXZDb25zb2xlKSB7XG5cbiAgZGV2Q29uc29sZS5jb21tYW5kc1snc2l6ZSddID0gZnVuY3Rpb24oYXJncykge1xuICAgIHZhciBkZWZhdWx0U2l6ZSA9IGVkaXRvci5jb25maWdbJ2VkaXRvcl9kZWZhdWx0X3NpemUnXTtcbiAgICB2YXIgeCA9IGFyZ3MuX1swXSB8fCBkZWZhdWx0U2l6ZVswXTtcbiAgICB2YXIgeSA9IGFyZ3MuX1sxXSB8fCBhcmdzLl9bMF0gfHwgZGVmYXVsdFNpemVbMV07XG4gICAgdmFyIHogPSBhcmdzLl9bMl0gfHwgYXJncy5fWzBdIHx8IGRlZmF1bHRTaXplWzJdO1xuXG4gICAgZWRpdG9yLnVwZGF0ZVNpemUoW3gsIHksIHpdKTtcbiAgfTtcblxuICBkZXZDb25zb2xlLmNvbW1hbmRzWydvZmZzZXQnXSA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICB2YXIgeCA9IGFyZ3MuX1swXSB8fCAwO1xuICAgIHZhciB5ID0gYXJncy5fWzFdIHx8IDA7XG4gICAgdmFyIHogPSBhcmdzLl9bMl0gfHwgMDtcblxuICAgIGVkaXRvci5ibG9ja3Muc2V0T2Zmc2V0KG5ldyBUSFJFRS5WZWN0b3IzKHgsIHksIHopKTtcbiAgfTtcblxuICBkZXZDb25zb2xlLmNvbW1hbmRzWyduZXcnXSA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICBlZGl0b3IuY3JlYXRlTmV3KCk7XG4gIH07XG5cbiAgZGV2Q29uc29sZS5jb21tYW5kc1snbWlycm9yJ10gPSBmdW5jdGlvbihhcmdzKSB7XG4gICAgaWYgKGFyZ3MuXy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigncGxlYXNlIHNwZWNpZnkgeCB5IHogb3Igbm9uZScpO1xuICAgIH1cblxuICAgIGlmIChhcmdzLl8ubGVuZ3RoID09PSAxKSB7XG4gICAgICBpZiAoYXJncy5fWzBdID09PSAnbm9uZScpIHtcbiAgICAgICAgZWRpdG9yLnJlZmxlY3RYID0gZWRpdG9yLnJlZmxlY3RZID0gZWRpdG9yLnJlZmxlY3RaID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZWRpdG9yLnJlZmxlY3RYID0gZWRpdG9yLnJlZmxlY3RZID0gZWRpdG9yLnJlZmxlY3RaID0gZmFsc2U7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLl8ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBhcmcgPSBhcmdzLl9baV07XG4gICAgICBpZiAoYXJnID09PSAneCcpIHtcbiAgICAgICAgZWRpdG9yLnJlZmxlY3RYID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoYXJnID09PSAneScpIHtcbiAgICAgICAgZWRpdG9yLnJlZmxlY3RZID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoYXJnID09PSAneicpIHtcbiAgICAgICAgZWRpdG9yLnJlZmxlY3RaID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcigndW5rbm93biBvcHRpb246ICcgKyBhcmcpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBkZXZDb25zb2xlLmNvbW1hbmRzWydyZXNldCddID0gZnVuY3Rpb24oKSB7XG4gICAgZWRpdG9yLnJlc2V0KCk7XG4gIH07XG5cbiAgZGV2Q29uc29sZS5jb21tYW5kc1snc2F2ZSddID0gZnVuY3Rpb24oKSB7XG4gICAgZWRpdG9yLnNhdmUoKTtcbiAgfTtcbn0iLCJ2YXIgRWRpdG9yVG9vbHMgPSB7XG4gIFBlbjogJ1BlbicsXG4gIFNlbGVjdDogJ1NlbGVjdCcsXG4gIFNhbXBsZTogJ1NhbXBsZScsXG4gIENhbWVyYTogJ0NhbWVyYScsXG4gIEZpbGw6ICdGaWxsJ1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3JUb29sczsiLCJ2YXIgY3ByID0gcmVxdWlyZSgnLi4vLi4vY3ByL2NwcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVkaXRvcikge1xuICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbnRhaW5lcicpO1xuXG4gIHZhciBkYXRhID0gW3tcbiAgICBzcmM6ICcvaW1hZ2VzL2Fycm93MS5wbmcnLFxuICAgIGluZGV4OiAwLFxuICAgIHRvb2x0aXA6ICdtb3ZlIHJpZ2h0IChEKSdcbiAgfSwge1xuICAgIHNyYzogJy9pbWFnZXMvYXJyb3cyLnBuZycsXG4gICAgaW5kZXg6IDEsXG4gICAgdG9vbHRpcDogJ21vdmUgbGVmdCAoQSknXG4gIH0sIHtcbiAgICBzcmM6ICcvaW1hZ2VzL2Fycm93My5wbmcnLFxuICAgIGluZGV4OiAyLFxuICAgIHRvb2x0aXA6ICdtb3ZlIGZyb250IChXKSdcbiAgfSwge1xuICAgIHNyYzogJy9pbWFnZXMvYXJyb3c0LnBuZycsXG4gICAgaW5kZXg6IDMsXG4gICAgdG9vbHRpcDogJ21vdmUgYmFjayAoUyknXG4gIH0sIHtcbiAgICBzcmM6ICcvaW1hZ2VzL2Fycm93NS5wbmcnLFxuICAgIGluZGV4OiA0LFxuICAgIHRvb2x0aXA6ICdtb3ZlIHVwIChSKSdcbiAgfSwge1xuICAgIHNyYzogJy9pbWFnZXMvYXJyb3c2LnBuZycsXG4gICAgaW5kZXg6IDUsXG4gICAgdG9vbHRpcDogJ21vdmUgZG93biAoRiknXG4gIH1dO1xuXG4gIHZhciBiYXIgPSBjcHIoe1xuICAgIGRhdGE6IGRhdGEsXG4gICAgYmxvY2tXaWR0aDogMzIsXG4gICAgYmxvY2tIZWlnaHQ6IDMyLFxuICAgIGhpZGVIaWdobGlnaHQ6IHRydWUsXG4gICAgY3VzdG9tUGxhY2VtZW50OiB0cnVlLFxuICAgIHNob3dUb29sdGlwOiB0cnVlLFxuICAgIG9uUGljazogZnVuY3Rpb24ob2JqKSB7XG4gICAgICB2YXIgaW5kZXggPSBvYmouaW5kZXg7XG5cbiAgICAgIHZhciBvZmZzZXQgPSBudWxsO1xuICAgICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICAgIG9mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKDEsIDAsIDApO1xuICAgICAgfSBlbHNlIGlmIChpbmRleCA9PT0gMSkge1xuICAgICAgICBvZmZzZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygtMSwgMCwgMCk7XG4gICAgICB9IGVsc2UgaWYgKGluZGV4ID09PSAyKSB7XG4gICAgICAgIG9mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKTtcbiAgICAgIH0gZWxzZSBpZiAoaW5kZXggPT09IDMpIHtcbiAgICAgICAgb2Zmc2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMSk7XG4gICAgICB9IGVsc2UgaWYgKGluZGV4ID09PSA0KSB7XG4gICAgICAgIG9mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDEsIDApO1xuICAgICAgfSBlbHNlIGlmIChpbmRleCA9PT0gNSkge1xuICAgICAgICBvZmZzZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAtMSwgMCk7XG4gICAgICB9XG5cbiAgICAgIGVkaXRvci5hcHBseU9mZnNldChvZmZzZXQpO1xuICAgIH1cbiAgfSk7XG5cbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKGJhci5kb21FbGVtZW50KTtcbiAgYmFyLmRvbUVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICBiYXIuZG9tRWxlbWVudC5zdHlsZS50b3AgPSAnODBweCc7XG4gIGJhci5kb21FbGVtZW50LnN0eWxlLmxlZnQgPSAnMjBweCc7XG59OyIsInZhciBjcHIgPSByZXF1aXJlKCcuLi8uLi9jcHIvY3ByJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWRpdG9yKSB7XG4gIHZhciBiYXIgPSBjcHIoe1xuICAgIGRhdGE6IGVkaXRvci5wYWxldHRlLFxuICAgIG9uUGljazogZnVuY3Rpb24oY29sb3IpIHtcbiAgICAgIGVkaXRvci5zZWxlY3RlZENvbG9yID0gY29sb3IuaXNDbGVhckNvbG9yID8gbnVsbCA6IGNvbG9yO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGJhcjtcbn07IiwidmFyIGNwciA9IHJlcXVpcmUoJy4uLy4uL2Nwci9jcHInKTtcbnZhciBwb3B1cCA9IHJlcXVpcmUoJy4vcG9wdXAnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlZGl0b3IpIHtcbiAgLy8gZG93bmxvYWQucG5nXG4gIHZhciBkYXRhID0gW3tcbiAgICBzcmM6ICcvaW1hZ2VzL2Rvd25sb2FkLnBuZycsXG4gICAgYnV0dG9uOiAnZG93bmxvYWQnXG4gIH1dO1xuXG4gIHZhciBiYXIgPSBjcHIoe1xuICAgIGRhdGE6IGRhdGEsXG4gICAgY3VzdG9tUGxhY2VtZW50OiB0cnVlLFxuICAgIGJsb2NrV2lkdGg6IDMyLFxuICAgIGJsb2NrSGVpZ2h0OiAzMixcbiAgICBoaWRlSGlnaGxpZ2h0OiB0cnVlLFxuICAgIG9uUGljazogZnVuY3Rpb24ob2JqKSB7XG4gICAgICB2YXIgYnV0dG9uID0gb2JqLmJ1dHRvbjtcblxuICAgICAgaWYgKGJ1dHRvbiA9PT0gJ2Rvd25sb2FkJykge1xuICAgICAgICBlZGl0b3IuZG93bmxvYWRKU09OKGVkaXRvci5zZXJpYWxpemUoKSwgJ2Jsb2NrcycpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb250YWluZXInKTtcbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKGJhci5kb21FbGVtZW50KTtcblxuICBiYXIuZG9tRWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIGJhci5kb21FbGVtZW50LnN0eWxlLmxlZnQgPSAyMCArICdweCc7XG4gIGJhci5kb21FbGVtZW50LnN0eWxlLnRvcCA9IDE0MCArICdweCc7XG59OyIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBwcm9tcHQ6IGZ1bmN0aW9uKHRleHQsIGJ1dHRvbnMsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGJhY2tncm91bmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBiYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICdyZ2JhKDAsMCwwLDAuOCknXG4gICAgYmFja2dyb3VuZC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgYmFja2dyb3VuZC5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgICBiYWNrZ3JvdW5kLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGJhY2tncm91bmQpO1xuXG4gICAgdmFyIGNvbnRhaW5lcldpZHRoID0gMjAwO1xuICAgIHZhciBjb250YWluZXJIZWlnaHQgPSAyMDA7XG4gICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGNvbnRhaW5lci5jbGFzc05hbWUgPSAncHJvbXB0JztcbiAgICBjb250YWluZXIuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIGNvbnRhaW5lci5zdHlsZS53aWR0aCA9IGNvbnRhaW5lcldpZHRoICsgJ3B4JztcbiAgICBjb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gY29udGFpbmVySGVpZ2h0ICsgJ3B4JztcblxuICAgIGJhY2tncm91bmQuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcblxuICAgIHVwZGF0ZUxheW91dCgpO1xuXG4gICAgZnVuY3Rpb24gb25XaW5kb3dSZXNpemUoKSB7XG4gICAgICB1cGRhdGVMYXlvdXQoKTtcbiAgICB9O1xuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIG9uV2luZG93UmVzaXplKTtcblxuICAgIHZhciBxdWVzdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gyJyk7XG4gICAgcXVlc3Rpb24uaW5uZXJIVE1MID0gdGV4dDtcbiAgICBxdWVzdGlvbi5zdHlsZS5mb250RmFtaWx5ID0gJydcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQocXVlc3Rpb24pO1xuXG4gICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICBpbnB1dC50eXBlID0gJ3RleHQnO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChpbnB1dCk7XG5cbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnInKSk7XG5cbiAgICBmdW5jdGlvbiBvbkNsaWNrKGluZGV4KSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB2YWxpZCA9IGNhbGxiYWNrKGlucHV0LnZhbHVlLCBpbmRleCk7XG4gICAgICAgIGlmICh2YWxpZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdmFsaWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbGlkKSB7XG4gICAgICAgICAgZGlzbWlzcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYnV0dG9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGJ1dHRvblRleHQgPSBidXR0b25zW2ldO1xuICAgICAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgYnV0dG9uLmlubmVySFRNTCA9IGJ1dHRvblRleHQ7XG4gICAgICBidXR0b24ub25jbGljayA9IG9uQ2xpY2soaSk7XG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoYnV0dG9uKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1cGRhdGVMYXlvdXQoKSB7XG4gICAgICBjb250YWluZXIuc3R5bGUubGVmdCA9ICh3aW5kb3cuaW5uZXJXaWR0aCAtIGNvbnRhaW5lcldpZHRoKSAvIDIgKyAncHgnO1xuICAgICAgY29udGFpbmVyLnN0eWxlLnRvcCA9ICh3aW5kb3cuaW5uZXJIZWlnaHQgLSBjb250YWluZXJIZWlnaHQpIC8gMiArICdweCc7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGRpc21pc3MoKSB7XG4gICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGJhY2tncm91bmQpO1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIG9uV2luZG93UmVzaXplKTtcbiAgICB9XG5cbiAgICBpbnB1dC5mb2N1cygpO1xuXG4gICAgdmFyIHByb21wdCA9IHtcbiAgICAgIGRpc21pc3M6IGRpc21pc3NcbiAgICB9O1xuXG4gICAgcmV0dXJuIHByb21wdDtcbiAgfVxufSIsInZhciBjcHIgPSByZXF1aXJlKCcuLi8uLi9jcHIvY3ByJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWRpdG9yKSB7XG4gIHZhciBiYXIgPSBjcHIoe1xuICAgIG9uUGljazogZnVuY3Rpb24ob2JqLCBpbmRleCkge1xuICAgICAgZWRpdG9yLnByZWZhYkluZGV4ID0gaW5kZXg7XG4gICAgICBlZGl0b3IubG9hZChlZGl0b3IucHJlZmFic1tpbmRleF0pO1xuICAgIH0sXG4gICAgYmxvY2tXaWR0aDogNDgsXG4gICAgYmxvY2tIZWlnaHQ6IDQ4XG4gIH0pO1xuXG4gIGJhci5kb21FbGVtZW50LnN0eWxlLmJvdHRvbSA9ICcxMjBweCc7XG5cbiAgcmV0dXJuIGJhcjtcbn07IiwidmFyIGNwciA9IHJlcXVpcmUoJy4uLy4uL2Nwci9jcHInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlZGl0b3IpIHtcbiAgdmFyIGRhdGEgPSBbe1xuICAgIGJ1dHRvbjogJ3BsdXMnLFxuICAgIHNyYzogJy9pbWFnZXMvcGx1cy5wbmcnXG4gIH0sIHtcbiAgICBidXR0b246ICdtaW51cycsXG4gICAgc3JjOiAnL2ltYWdlcy9taW51cy5wbmcnXG4gIH0sIHtcbiAgICBidXR0b246ICdjbG9uZScsXG4gICAgc3JjOiAnL2ltYWdlcy9jbG9uZS5wbmcnXG4gIH1dO1xuXG4gIHZhciBiYXIgPSBjcHIoe1xuICAgIGRhdGE6IGRhdGEsXG4gICAgYmxvY2tXaWR0aDogMzIsXG4gICAgYmxvY2tIZWlnaHQ6IDMyLFxuICAgIGRpc2FibGVIaWdobGlnaHQ6IHRydWUsXG4gICAgb25QaWNrOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHZhciBidXR0b24gPSBvYmouYnV0dG9uO1xuXG4gICAgICBpZiAoYnV0dG9uID09PSAncGx1cycpIHtcbiAgICAgICAgZWRpdG9yLmNyZWF0ZU5ldygpO1xuICAgICAgfSBlbHNlIGlmIChidXR0b24gPT09ICdtaW51cycpIHtcbiAgICAgICAgZWRpdG9yLnJlbW92ZVNlbGVjdGVkKCk7XG4gICAgICB9IGVsc2UgaWYgKGJ1dHRvbiA9PT0gJ2Nsb25lJykge1xuICAgICAgICBlZGl0b3IuY3JlYXRlQ2xvbmUoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIGJhci5kb21FbGVtZW50LnN0eWxlLmJvdHRvbSA9ICcxODBweCc7XG59OyIsInZhciBwYW5lbCA9IHJlcXVpcmUoJy4uL3BhbmVsL3BhbmVsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWRpdG9yKSB7XG4gIHZhciBkYXRhID0gW3tcbiAgICB0aXRsZTogJ25hbWUnLFxuICAgIHZhbHVlOiAnJyxcbiAgICBvbkNoYW5nZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGVkaXRvci5nZXRTZWxlY3RlZFByZWZhYigpLnVzZXJEYXRhLm5hbWUgPSB2YWx1ZTtcbiAgICB9XG4gIH0sIHtcbiAgICB0aXRsZTogJ3NpemUnLFxuICAgIHZhbHVlOiAnJyxcbiAgICBvbkZpbmlzaEVkaXRpbmc6IGZ1bmN0aW9uKHZhbHVlLCBpbnB1dCkge1xuICAgICAgdmFyIHJlZyA9IC9eKFxcZHsxLDJ9KSAoXFxkezEsMn0pIChcXGR7MSwyfSkkL2dcbiAgICAgIHZhciBtYXRjaGVzID0gcmVnLmV4ZWModmFsdWUpO1xuXG4gICAgICBpZiAobWF0Y2hlcyA9PSBudWxsKSB7XG4gICAgICAgIGVkaXRvci51cGRhdGVQcm9wZXJ0eVBhbmVsKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgZWRpdG9yLnVwZGF0ZVNpemUoW3BhcnNlSW50KG1hdGNoZXNbMV0pLCBwYXJzZUludChtYXRjaGVzWzJdKSwgcGFyc2VJbnQobWF0Y2hlc1szXSldKTtcbiAgICB9XG4gIH0sIHtcbiAgICB0aXRsZTogJ21pcnJvcicsXG4gICAgdHlwZTogJ2NoZWNrTGlzdCcsXG4gICAgb3B0aW9uczogWyd4JywgJ3knLCAneiddLFxuICAgIG9uQ2hhbmdlOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICBlZGl0b3IucmVmbGVjdFggPSBlZGl0b3IucmVmbGVjdFkgPSBlZGl0b3IucmVmbGVjdFogPSBmYWxzZTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAob3B0aW9uc1tpXSA9PT0gJ3gnKSB7XG4gICAgICAgICAgZWRpdG9yLnJlZmxlY3RYID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zW2ldID09PSAneScpIHtcbiAgICAgICAgICBlZGl0b3IucmVmbGVjdFkgPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnNbaV0gPT09ICd6Jykge1xuICAgICAgICAgIGVkaXRvci5yZWZsZWN0WiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1dO1xuXG4gIHJldHVybiBwYW5lbChkYXRhKTtcbn07IiwidmFyIGNwciA9IHJlcXVpcmUoJy4uLy4uL2Nwci9jcHInKTtcbnZhciBFZGl0b3JUb29scyA9IHJlcXVpcmUoJy4uL2VkaXRvcnRvb2xzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWRpdG9yKSB7XG4gIHZhciBiYXIgPSBjcHIoe1xuICAgIGRhdGE6IFt7XG4gICAgICBzcmM6ICcvaW1hZ2VzL3BsdXMucG5nJyxcbiAgICAgIHRvb2xuYW1lOiBFZGl0b3JUb29scy5QZW4sXG4gICAgICB0b29sdGlwOiAncGVuIHRvb2wgKDEpJ1xuICAgIH0sIHtcbiAgICAgIHNyYzogJy9pbWFnZXMvc2FtcGxlci5wbmcnLFxuICAgICAgdG9vbG5hbWU6IEVkaXRvclRvb2xzLlNhbXBsZSxcbiAgICAgIHRvb2x0aXA6ICdzYW1wbGUgdG9vbCAoMiknXG4gICAgfSwge1xuICAgICAgc3JjOiAnL2ltYWdlcy9sYXNzby5wbmcnLFxuICAgICAgdG9vbG5hbWU6IEVkaXRvclRvb2xzLlNlbGVjdCxcbiAgICAgIHRvb2x0aXA6ICdsYXNzbyB0b29sICgzKSdcbiAgICB9LCB7XG4gICAgICBzcmM6ICcvaW1hZ2VzL2NhbWVyYS5wbmcnLFxuICAgICAgdG9vbG5hbWU6IEVkaXRvclRvb2xzLkNhbWVyYSxcbiAgICAgIHRvb2x0aXA6ICdjYW1lcmEgdG9vbCAoNCBvciBkcmFnIGVtcHR5IHNwYWNlKSdcbiAgICB9LCB7XG4gICAgICBzcmM6ICcvaW1hZ2VzL2ZpbGwucG5nJyxcbiAgICAgIHRvb2xuYW1lOiBFZGl0b3JUb29scy5GaWxsXG4gICAgfV0sXG4gICAgYmxvY2tXaWR0aDogMzIsXG4gICAgYmxvY2tIZWlnaHQ6IDMyLFxuICAgIG9uUGljazogZnVuY3Rpb24ob2JqKSB7XG4gICAgICBlZGl0b3IudG9vbE5hbWUgPSBvYmoudG9vbG5hbWU7XG4gICAgICBlZGl0b3IudXBkYXRlVG9vbCgpO1xuICAgIH0sXG4gICAgY3VzdG9tUGxhY2VtZW50OiB0cnVlLFxuICAgIHNob3dUb29sdGlwOiB0cnVlXG4gIH0pO1xuXG4gIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29udGFpbmVyJyk7XG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChiYXIuZG9tRWxlbWVudCk7XG5cbiAgYmFyLmRvbUVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICBiYXIuZG9tRWxlbWVudC5zdHlsZS50b3AgPSAyMCArICdweCc7XG4gIGJhci5kb21FbGVtZW50LnN0eWxlLmxlZnQgPSAyMCArICdweCc7XG5cbiAgcmV0dXJuIGJhcjtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkYXRhKSB7XG4gIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICBjb250YWluZXIuY2xhc3NOYW1lID0gJ3BhbmVsJztcblxuICBjb250YWluZXIuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICBjb250YWluZXIuc3R5bGUucmlnaHQgPSAyMCArICdweCc7XG4gIGNvbnRhaW5lci5zdHlsZS50b3AgPSAyMCArICdweCc7XG4gIGNvbnRhaW5lci5zdHlsZS53aWR0aCA9IDIwMCArICdweCc7XG5cbiAgdmFyIHBhbmVsID0ge307XG4gIHBhbmVsLmNvbnRyb2xsZXJzID0ge307XG5cbiAgdmFyIGNvbnRyb2xsZXJzID0ge1xuICAgICdjaGVja0xpc3QnOiBjaGVja0xpc3RDb250cm9sbGVyXG4gIH07XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBkYXRhW2ldO1xuXG4gICAgdmFyIGZhY3RvcnkgPSBjb250cm9sbGVyc1tpdGVtLnR5cGVdIHx8IHZhbHVlQ29udHJvbGxlcjtcbiAgICB2YXIgY29udHJvbGxlciA9IGZhY3RvcnkoaXRlbSk7XG4gICAgcGFuZWwuY29udHJvbGxlcnNbaXRlbS50aXRsZV0gPSBjb250cm9sbGVyO1xuXG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNvbnRyb2xsZXIuZWxlbWVudCk7XG4gIH1cblxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XG5cbiAgcmV0dXJuIHBhbmVsO1xufTtcblxudmFyIHZhbHVlQ29udHJvbGxlciA9IGZ1bmN0aW9uKGl0ZW0pIHtcblxuICB2YXIgb25DaGFuZ2UgPSBpdGVtLm9uQ2hhbmdlIHx8IGZ1bmN0aW9uKCkge307XG4gIHZhciBvbkZpbmlzaEVkaXRpbmcgPSBpdGVtLm9uRmluaXNoRWRpdGluZyB8fCBmdW5jdGlvbigpIHt9O1xuXG4gIHZhciBzZWN0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VjdGlvbicpO1xuICBzZWN0aW9uLmNsYXNzTmFtZSA9ICdzZWN0aW9uJztcblxuICB2YXIgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGl0bGUuaW5uZXJIVE1MID0gaXRlbS50aXRsZTtcbiAgdGl0bGUuY2xhc3NOYW1lID0gJ3RpdGxlJztcbiAgc2VjdGlvbi5hcHBlbmRDaGlsZCh0aXRsZSk7XG5cbiAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgaW5wdXQudHlwZSA9ICd0ZXh0JztcbiAgaW5wdXQudmFsdWUgPSBpdGVtLnZhbHVlO1xuICBpbnB1dC5jbGFzc05hbWUgPSAndmFsdWUnO1xuXG4gIHNlY3Rpb24uYXBwZW5kQ2hpbGQoaW5wdXQpO1xuXG4gIHZhciBpbnB1dExpc3RlbmVyID0gZnVuY3Rpb24oKSB7XG4gICAgb25DaGFuZ2UoaW5wdXQudmFsdWUpO1xuICB9O1xuXG4gIHZhciBrZXlkb3duTGlzdGVuZXIgPSBmdW5jdGlvbihlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgIGlucHV0LmJsdXIoKTtcbiAgICB9XG4gIH07XG5cbiAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBpbnB1dExpc3RlbmVyKTtcbiAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGtleWRvd25MaXN0ZW5lcik7XG5cbiAgZnVuY3Rpb24gc2V0VmFsdWUodmFsdWUpIHtcbiAgICBpbnB1dC52YWx1ZSA9IHZhbHVlO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGRpc3Bvc2UoKSB7XG4gICAgaW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBpbnB1dExpc3RlbmVyKTtcbiAgICBpbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywga2V5ZG93bkxpc3RlbmVyKTtcbiAgfTtcblxuICBpbnB1dC5vbmJsdXIgPSBmdW5jdGlvbigpIHtcbiAgICBvbkZpbmlzaEVkaXRpbmcoaW5wdXQudmFsdWUsIGlucHV0KTtcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIGVsZW1lbnQ6IHNlY3Rpb24sXG4gICAgc2V0VmFsdWU6IHNldFZhbHVlLFxuICAgIHNldCBvbkNoYW5nZSh2YWx1ZSkge1xuICAgICAgb25DaGFuZ2UgPSB2YWx1ZTtcbiAgICB9LFxuICAgIGRpc3Bvc2U6IGRpc3Bvc2VcbiAgfVxufTtcblxudmFyIGNoZWNrTGlzdENvbnRyb2xsZXIgPSBmdW5jdGlvbihpdGVtKSB7XG4gIHZhciBvbkNoYW5nZSA9IGl0ZW0ub25DaGFuZ2UgfHwgZnVuY3Rpb24oKSB7fTtcblxuICB2YXIgc2VjdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlY3Rpb24nKTtcbiAgc2VjdGlvbi5jbGFzc05hbWUgPSAnc2VjdGlvbic7XG5cbiAgdmFyIHRpdGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHRpdGxlLmlubmVySFRNTCA9IGl0ZW0udGl0bGU7XG4gIHRpdGxlLmNsYXNzTmFtZSA9ICd0aXRsZSc7XG4gIHNlY3Rpb24uYXBwZW5kQ2hpbGQodGl0bGUpO1xuXG4gIHZhciBvcHRpb25zID0gaXRlbS5vcHRpb25zO1xuXG4gIHZhciBidXR0b25zID0gW107XG5cbiAgdmFyIG9uQ2xpY2sgPSBmdW5jdGlvbihpbmRleCkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBidXR0b24gPSBidXR0b25zW2luZGV4XTtcbiAgICAgIGlmIChidXR0b24uY2xhc3NOYW1lID09PSAnc2VsZWN0ZWQnKSB7XG4gICAgICAgIGJ1dHRvbi5jbGFzc05hbWUgPSAnJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJ1dHRvbi5jbGFzc05hbWUgPSAnc2VsZWN0ZWQnO1xuICAgICAgfVxuXG4gICAgICBvbkNoYW5nZShnZXRTZWxlY3RlZE9wdGlvbnMoKSk7XG4gICAgfTtcbiAgfTtcblxuICBmdW5jdGlvbiBnZXRTZWxlY3RlZE9wdGlvbnMoKSB7XG4gICAgdmFyIHNlbGVjdGlvbiA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYnV0dG9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGJ1dHRvbnNbaV0uY2xhc3NOYW1lID09PSAnc2VsZWN0ZWQnKSB7XG4gICAgICAgIHNlbGVjdGlvbi5wdXNoKG9wdGlvbnNbaV0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzZWxlY3Rpb247XG4gIH07XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIG9wdGlvbiA9IG9wdGlvbnNbaV07XG4gICAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGJ1dHRvbi5pbm5lckhUTUwgPSBvcHRpb247XG4gICAgc2VjdGlvbi5hcHBlbmRDaGlsZChidXR0b24pO1xuXG4gICAgaWYgKGkgPT09IG9wdGlvbnMubGVuZ3RoIC0gMSkge1xuICAgICAgYnV0dG9uLnN0eWxlWydib3JkZXItcmlnaHQtc3R5bGUnXSA9ICcycHggc29saWQgIzAwMCc7XG4gICAgfVxuXG4gICAgYnV0dG9uLm9uY2xpY2sgPSBvbkNsaWNrKGkpO1xuXG4gICAgYnV0dG9ucy5wdXNoKGJ1dHRvbik7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGVsZW1lbnQ6IHNlY3Rpb25cbiAgfVxufTsiLCJ2YXIgQ2FtZXJhVG9vbCA9IGZ1bmN0aW9uKCkge1xuXG59O1xuXG5DYW1lcmFUb29sLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oKSB7XG5cdFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYW1lcmFUb29sOyIsInZhciBGaWxsVG9vbCA9IGZ1bmN0aW9uKCkge1xuXG59O1xuXG5GaWxsVG9vbC5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCkge1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGxUb29sOyIsInZhciBTZXRDb21tYW5kID0gcmVxdWlyZSgnLi4vY29tbWFuZHMvc2V0Y29tbWFuZCcpO1xuXG52YXIgUGVuVG9vbCA9IGZ1bmN0aW9uKGVkaXRvcikge1xuXG4gIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xuXG4gIHRoaXMuY2FtZXJhID0gdGhpcy5lZGl0b3IuY2FtZXJhO1xuXG4gIHRoaXMuaW5wdXQgPSB0aGlzLmVkaXRvci5pbnB1dDtcblxuICB0aGlzLmJsb2NrcyA9IHRoaXMuZWRpdG9yLmJsb2NrcztcblxuICB0aGlzLm9iamVjdCA9IHRoaXMuZWRpdG9yLm9iamVjdDtcblxuICB0aGlzLmxhc3RNb3VzZSA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG5cbiAgdGhpcy5tb3VzZVNhbXBsZUludGVydmFsID0gNDtcbn07XG5cblBlblRvb2wucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuZWRpdG9yLmVkaXRMb2NrKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIFxuICB2YXIgaXNDbGVhckNvbG9yID0gdGhpcy5lZGl0b3Iuc2VsZWN0ZWRDb2xvciA9PSBudWxsO1xuXG4gIHRoaXMuZWRpdG9yLmhpZ2hsaWdodENvb3JkID0gaXNDbGVhckNvbG9yID9cbiAgICB0aGlzLmVkaXRvci5nZXRDb29yZEJlbG93KCkgOlxuICAgIHRoaXMuZWRpdG9yLmdldENvb3JkQWJvdmUoKTtcblxuICBpZiAodGhpcy5pbnB1dC5tb3VzZURvd24oKSB8fCB0aGlzLmlucHV0Lm1vdXNlVXAoKSkge1xuICAgIHRoaXMuZWRpdG9yLnVwZGF0ZUxhc3RCbG9ja3MoKTtcbiAgfVxuXG4gIGlmICh0aGlzLmlucHV0Lm1vdXNlRG93bigwKSkge1xuICAgIHRoaXMub25DbGljayhpc0NsZWFyQ29sb3IpO1xuICB9IGVsc2UgaWYgKHRoaXMuaW5wdXQubW91c2VEb3duKDIpKSB7XG4gICAgdGhpcy5vbkNsaWNrKHRydWUpO1xuICB9XG5cbiAgaWYgKHRoaXMuaW5wdXQubW91c2VIb2xkKDApICYmIHRoaXMuaW5wdXQubW91c2VNb3ZlKCkpIHtcbiAgICB0aGlzLm9uRHJhZyhpc0NsZWFyQ29sb3IpO1xuICB9IGVsc2UgaWYgKHRoaXMuaW5wdXQubW91c2VIb2xkKDIpICYmIHRoaXMuaW5wdXQubW91c2VNb3ZlKCkpIHtcbiAgICB0aGlzLm9uRHJhZyh0cnVlKTtcbiAgfVxuXG4gIHRoaXMubGFzdE1vdXNlID0gdGhpcy5pbnB1dC5tb3VzZS5jbG9uZSgpO1xufTtcblxuUGVuVG9vbC5wcm90b3R5cGUub25DbGljayA9IGZ1bmN0aW9uKGlzQ2xlYXIpIHtcbiAgdmFyIGNvbG9yID0gaXNDbGVhciA/IG51bGwgOiB0aGlzLmVkaXRvci5zZWxlY3RlZENvbG9yO1xuICB2YXIgc2VsZWN0ZWRJbmRleCA9IHRoaXMuYmxvY2tzLmdldE9yQWRkQ29sb3JJbmRleChjb2xvcik7XG5cbiAgdmFyIGNvb3JkID0gaXNDbGVhciA/XG4gICAgdGhpcy5lZGl0b3IuZ2V0Q29vcmRCZWxvdygpIDpcbiAgICB0aGlzLmVkaXRvci5nZXRDb29yZEFib3ZlKCk7XG5cbiAgaWYgKCEhY29vcmQpIHtcbiAgICBpZiAodGhpcy5ibG9ja3MuZ2V0QXRDb29yZChjb29yZCkgIT09IHNlbGVjdGVkSW5kZXgpIHtcbiAgICAgIHRoaXMuZWRpdG9yLnJ1bkNvbW1hbmQobmV3IFNldENvbW1hbmQodGhpcy5ibG9ja3MsIHRoaXMucmVmbGVjdENvb3JkcyhbY29vcmRdKSwgc2VsZWN0ZWRJbmRleCkpO1xuICAgICAgdGhpcy5lZGl0b3IudXBkYXRlTGFzdEJsb2NrcygpO1xuICAgIH1cbiAgfVxufTtcblxuUGVuVG9vbC5wcm90b3R5cGUub25EcmFnID0gZnVuY3Rpb24oaXNDbGVhcikge1xuICB2YXIgY29sb3IgPSBpc0NsZWFyID8gbnVsbCA6IHRoaXMuZWRpdG9yLnNlbGVjdGVkQ29sb3I7XG4gIHZhciBzZWxlY3RlZEluZGV4ID0gdGhpcy5ibG9ja3MuZ2V0T3JBZGRDb2xvckluZGV4KGNvbG9yKTtcblxuICB2YXIgcG9pbnRzID0gdGhpcy5nZXRNb3VzZVBvaW50cyh0aGlzLmxhc3RNb3VzZSwgdGhpcy5pbnB1dC5tb3VzZSwgdGhpcy5tb3VzZVNhbXBsZUludGVydmFsKTtcbiAgdmFyIGNvb3JkcyA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBjb29yZCA9IGlzQ2xlYXIgP1xuICAgICAgdGhpcy5lZGl0b3IuZ2V0Q29vcmRCZWxvdyhwb2ludHNbaV0pIDpcbiAgICAgIHRoaXMuZWRpdG9yLmdldENvb3JkQWJvdmUocG9pbnRzW2ldKTtcblxuICAgIGlmICghIWNvb3JkKSB7XG4gICAgICBpZiAodGhpcy5ibG9ja3MuZ2V0QXRDb29yZChjb29yZCkgIT09IHNlbGVjdGVkSW5kZXgpIHtcbiAgICAgICAgY29vcmRzLnB1c2goY29vcmQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvb3JkcyA9IHVuaXF1ZUNvb3Jkcyhjb29yZHMpO1xuICBpZiAoY29vcmRzLmxlbmd0aCA+IDApIHtcbiAgICB0aGlzLmVkaXRvci5ydW5Db21tYW5kKG5ldyBTZXRDb21tYW5kKHRoaXMuYmxvY2tzLCB0aGlzLnJlZmxlY3RDb29yZHMoY29vcmRzKSwgc2VsZWN0ZWRJbmRleCkpO1xuICB9XG59O1xuXG4vLyBSZWZsZWN0IGNvb3JkcyB3aXRoIGVkaXRvciBzZXR0aW5nc1xuUGVuVG9vbC5wcm90b3R5cGUucmVmbGVjdENvb3JkcyA9IGZ1bmN0aW9uKGNvb3Jkcykge1xuICBpZiAoIXRoaXMuZWRpdG9yLnJlZmxlY3RYICYmICF0aGlzLmVkaXRvci5yZWZsZWN0WSAmJiAhdGhpcy5lZGl0b3IucmVmbGVjdFopIHtcbiAgICByZXR1cm4gY29vcmRzO1xuICB9XG5cbiAgdmFyIGRpbSA9IHRoaXMuYmxvY2tzLmRpbTtcbiAgdmFyIHBpdm90ID0gW1xuICAgIE1hdGgucm91bmQoKGRpbVswXSAtIDEpIC8gMiksXG4gICAgTWF0aC5yb3VuZCgoZGltWzFdIC0gMSkgLyAyKSxcbiAgICBNYXRoLnJvdW5kKChkaW1bMl0gLSAxKSAvIDIpXG4gIF07XG5cbiAgaWYgKHRoaXMuZWRpdG9yLnJlZmxlY3RYKSB7XG4gICAgdmFyIHJlZmxlY3RlZCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29vcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgciA9IGNvb3Jkc1tpXS5jbG9uZSgpO1xuICAgICAgci54ID0gcGl2b3RbMF0gKyBwaXZvdFswXSAtIHIueDtcbiAgICAgIHJlZmxlY3RlZC5wdXNoKHIpO1xuICAgIH1cbiAgICBjb29yZHMgPSBjb29yZHMuY29uY2F0KHJlZmxlY3RlZCk7XG4gIH1cblxuICBpZiAodGhpcy5lZGl0b3IucmVmbGVjdFkpIHtcbiAgICB2YXIgcmVmbGVjdGVkID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciByID0gY29vcmRzW2ldLmNsb25lKCk7XG4gICAgICByLnkgPSBwaXZvdFsxXSArIHBpdm90WzFdIC0gci55O1xuICAgICAgcmVmbGVjdGVkLnB1c2gocik7XG4gICAgfVxuICAgIGNvb3JkcyA9IGNvb3Jkcy5jb25jYXQocmVmbGVjdGVkKTtcbiAgfVxuXG4gIGlmICh0aGlzLmVkaXRvci5yZWZsZWN0Wikge1xuICAgIHZhciByZWZsZWN0ZWQgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHIgPSBjb29yZHNbaV0uY2xvbmUoKTtcbiAgICAgIHIueiA9IHBpdm90WzJdICsgcGl2b3RbMl0gLSByLno7XG4gICAgICByZWZsZWN0ZWQucHVzaChyKTtcbiAgICB9XG4gICAgY29vcmRzID0gY29vcmRzLmNvbmNhdChyZWZsZWN0ZWQpO1xuICB9XG5cbiAgcmV0dXJuIGNvb3Jkcztcbn07XG5cblBlblRvb2wucHJvdG90eXBlLmdldE1vdXNlUG9pbnRzID0gZnVuY3Rpb24oZnJvbSwgdG8sIG1heERpcykge1xuICB2YXIgZGlzdGFuY2UgPSBuZXcgVEhSRUUuVmVjdG9yMigpLnN1YlZlY3RvcnModG8sIGZyb20pLmxlbmd0aCgpO1xuXG4gIHZhciBpbnRlcnZhbCA9IE1hdGguY2VpbChkaXN0YW5jZSAvIG1heERpcyk7XG4gIHZhciBzdGVwID0gbmV3IFRIUkVFLlZlY3RvcjIoKS5zdWJWZWN0b3JzKHRvLCBmcm9tKS5zZXRMZW5ndGgoZGlzdGFuY2UgLyBpbnRlcnZhbCk7XG5cbiAgdmFyIGxpc3QgPSBbXTtcbiAgdmFyIHN0YXJ0ID0gZnJvbS5jbG9uZSgpO1xuICBsaXN0LnB1c2goc3RhcnQpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGludGVydmFsOyBpKyspIHtcbiAgICBzdGFydC5hZGQoc3RlcCk7XG4gICAgbGlzdC5wdXNoKHN0YXJ0LmNsb25lKCkpO1xuICB9XG4gIHJldHVybiBsaXN0O1xufTtcblxuZnVuY3Rpb24gdW5pcXVlQ29vcmRzKGNvb3Jkcykge1xuICB2YXIgbWFwID0ge307XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY29vcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgbWFwW2Nvb3Jkc1tpXS50b0FycmF5KCkuam9pbignLCcpXSA9IGNvb3Jkc1tpXTtcbiAgfVxuICB2YXIgbGlzdCA9IFtdO1xuICBmb3IgKHZhciBpZCBpbiBtYXApIHtcbiAgICBsaXN0LnB1c2gobWFwW2lkXSk7XG4gIH1cbiAgcmV0dXJuIGxpc3Q7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBlblRvb2w7IiwidmFyIEVkaXRvclRvb2xzID0gcmVxdWlyZSgnLi4vZWRpdG9ydG9vbHMnKTtcblxudmFyIFNhbXBsZVRvb2wgPSBmdW5jdGlvbihlZGl0b3IpIHtcbiAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XG4gIHRoaXMuaW5wdXQgPSB0aGlzLmVkaXRvci5pbnB1dDtcbiAgdGhpcy5ibG9ja3MgPSB0aGlzLmVkaXRvci5ibG9ja3M7XG59O1xuXG5TYW1wbGVUb29sLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuZWRpdG9yLmhpZ2hsaWdodENvb3JkID0gdGhpcy5lZGl0b3IuZ2V0Q29vcmRCZWxvdygpO1xuXG4gIGlmICh0aGlzLmlucHV0Lm1vdXNlRG93bigpKSB7XG4gICAgdmFyIGNvb3JkID0gdGhpcy5lZGl0b3IuZ2V0Q29vcmRCZWxvdygpO1xuXG4gICAgdmFyIGNvbG9yID0gbnVsbDtcbiAgICBpZiAoY29vcmQgIT0gbnVsbCkge1xuICAgICAgdmFyIGluZGV4ID0gdGhpcy5ibG9ja3MuZ2V0QXRDb29yZChjb29yZCk7XG4gICAgICB2YXIgY29sb3IgPSB0aGlzLmJsb2Nrcy5wYWxldHRlW2luZGV4XTtcbiAgICAgIHRoaXMuZWRpdG9yLnNldFNlbGVjdGVkQ29sb3IoY29sb3IpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWRpdG9yLnNldFNlbGVjdGVkQ29sb3IobnVsbCk7XG4gICAgfVxuXG4gICAgLy8gdGhpcy5lZGl0b3Iuc2V0VG9vbChFZGl0b3JUb29scy5QZW4pO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNhbXBsZVRvb2w7IiwidmFyIGluc2lkZSA9IHJlcXVpcmUoJ3BvaW50LWluLXBvbHlnb24nKTtcbnZhciBTZWxlY3RDb21tYW5kID0gcmVxdWlyZSgnLi4vY29tbWFuZHMvc2VsZWN0Y29tbWFuZCcpO1xuXG52YXIgU2VsZWN0VG9vbCA9IGZ1bmN0aW9uKGVkaXRvcikge1xuICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcbiAgdGhpcy5pbnB1dCA9IHRoaXMuZWRpdG9yLmlucHV0O1xuICB0aGlzLmJsb2NrcyA9IHRoaXMuZWRpdG9yLmJsb2NrcztcbiAgdGhpcy5jYW1lcmEgPSB0aGlzLmVkaXRvci5jYW1lcmE7XG5cbiAgdGhpcy5kaXZTZWxlY3Rpb25Cb3ggPSBudWxsO1xuXG4gIHRoaXMuY2FudmFzID0gZWRpdG9yLmNhbnZhcztcbiAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICB0aGlzLnBvaW50cyA9IFtdO1xuICB0aGlzLm1pbkRpc3RhbmNlID0gMjtcbn07XG5cblNlbGVjdFRvb2wucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcblxuICBpZiAodGhpcy5pbnB1dC5tb3VzZUhvbGQoMCkpIHtcbiAgICB2YXIgbW91c2UgPSB0aGlzLmlucHV0Lm1vdXNlLmNsb25lKCk7XG4gICAgaWYgKHRoaXMucG9pbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5wb2ludHMucHVzaChtb3VzZS50b0FycmF5KCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbGFzdE1vdXNlID0gbmV3IFRIUkVFLlZlY3RvcjIoKS5mcm9tQXJyYXkodGhpcy5wb2ludHNbdGhpcy5wb2ludHMubGVuZ3RoIC0gMV0pO1xuICAgICAgdmFyIGRpc3RhbmNlID0gbGFzdE1vdXNlLmRpc3RhbmNlVG8obW91c2UpO1xuICAgICAgaWYgKGRpc3RhbmNlID4gdGhpcy5taW5EaXN0YW5jZSkge1xuICAgICAgICB0aGlzLnBvaW50cy5wdXNoKG1vdXNlLnRvQXJyYXkoKSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICh0aGlzLnBvaW50cy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLnVwZGF0ZVNlbGVjdGlvbigpO1xuICAgIH1cbiAgICB0aGlzLnBvaW50cyA9IFtdO1xuICB9XG5cbiAgdGhpcy5kcmF3TGFzc28oKTtcbn07XG5cblNlbGVjdFRvb2wucHJvdG90eXBlLmRyYXdMYXNzbyA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5wb2ludHMubGVuZ3RoIDwgMikge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMuY29udGV4dC5saW5lV2lkdGggPSAnMSc7XG4gIHRoaXMuY29udGV4dC5zZXRMaW5lRGFzaChbM10pO1xuICB0aGlzLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSAnI2ZmZmZmZic7XG4gIHRoaXMuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBwb2ludCA9IHRoaXMucG9pbnRzW2ldO1xuICAgIGlmIChpID09PSAwKSB7XG4gICAgICB0aGlzLmNvbnRleHQubW92ZVRvKHBvaW50WzBdLCBwb2ludFsxXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY29udGV4dC5saW5lVG8ocG9pbnRbMF0sIHBvaW50WzFdKTtcbiAgICB9XG4gIH1cbiAgdGhpcy5jb250ZXh0LnN0cm9rZSgpO1xufTtcblxuU2VsZWN0VG9vbC5wcm90b3R5cGUudXBkYXRlU2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gIHZhciBibG9ja3MgPSB0aGlzLmJsb2NrcztcbiAgdmFyIGNhbWVyYSA9IHRoaXMuY2FtZXJhO1xuICB2YXIgY2FudmFzID0gdGhpcy5jYW52YXM7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB2YXIgc2NyZWVuUG9pbnRzID0gW107XG4gIHRoaXMuYmxvY2tzLnZpc2l0KGZ1bmN0aW9uKGksIGosIGssIGIpIHtcbiAgICB2YXIgY29vcmQgPSBuZXcgVEhSRUUuVmVjdG9yMyhpICsgMC41LCBqICsgMC41LCBrICsgMC41KTtcbiAgICB2YXIgbG9jYWxQb2ludCA9IGJsb2Nrcy5jb29yZFRvUG9pbnQoY29vcmQpO1xuICAgIHZhciB3b3JsZFBvaW50ID0gYmxvY2tzLm9iai5sb2NhbFRvV29ybGQobG9jYWxQb2ludCk7XG4gICAgdmFyIHZlY3RvciA9IHdvcmxkUG9pbnQucHJvamVjdChjYW1lcmEpO1xuICAgIHZlY3Rvci54ID0gTWF0aC5yb3VuZCgodmVjdG9yLnggKyAxKSAqIGNhbnZhcy53aWR0aCAvIDIpO1xuICAgIHZlY3Rvci55ID0gTWF0aC5yb3VuZCgoLXZlY3Rvci55ICsgMSkgKiBjYW52YXMuaGVpZ2h0IC8gMik7XG5cbiAgICBzY3JlZW5Qb2ludHMucHVzaCh7XG4gICAgICBzY3JlZW46IFt2ZWN0b3IueCwgdmVjdG9yLnldLFxuICAgICAgY29vcmQ6IG5ldyBUSFJFRS5WZWN0b3IzKGksIGosIGspXG4gICAgfSk7XG4gIH0pO1xuXG4gIHZhciBzZWxlY3Rpb25zID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc2NyZWVuUG9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHNjcmVlbiA9IHNjcmVlblBvaW50c1tpXS5zY3JlZW47XG4gICAgLy8gVGVzdCBwb2ludCBpbiBwb2x5Z29uXG4gICAgaWYgKGluc2lkZShzY3JlZW4sIHRoaXMucG9pbnRzKSkge1xuICAgICAgc2VsZWN0aW9ucy5wdXNoKHNjcmVlblBvaW50c1tpXS5jb29yZCk7XG4gICAgfVxuICB9XG5cbiAgdGhpcy5lZGl0b3IucnVuQ29tbWFuZChuZXcgU2VsZWN0Q29tbWFuZCh0aGlzLmVkaXRvciwgc2VsZWN0aW9ucykpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZWxlY3RUb29sOyIsInZhciBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydUSFJFRSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnVEhSRUUnXSA6IG51bGwpO1xudmFyIGIgPSByZXF1aXJlKCcuL2NvcmUvYicpO1xudmFyIHN0YXRzID0gcmVxdWlyZSgnLi9zZXJ2aWNlcy9zdGF0cycpO1xuXG52YXIgYXBwID0gYignbWFpbicpO1xuXG52YXIgc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKTtcbnZhciBjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoNjAsIHdpbmRvdy5pbm5lcldpZHRoIC8gd2luZG93LmlubmVySGVpZ2h0LCAwLjEsIDEwMDApO1xuXG4vLyBSZWdzaXRlciB2YWx1ZXNcbmFwcC52YWx1ZSgnYXBwJywgYXBwKTtcbmFwcC52YWx1ZSgnc2NlbmUnLCBzY2VuZSk7XG5hcHAudmFsdWUoJ2NhbWVyYScsIGNhbWVyYSk7XG5hcHAudmFsdWUoJ2NvbmZpZycsIHJlcXVpcmUoJy4vZGF0YS9jb25maWcuanNvbicpKTtcbmFwcC52YWx1ZSgncGFsZXR0ZScsIHJlcXVpcmUoJy4vZGF0YS9wYWxldHRlLmpzb24nKSk7XG5hcHAudmFsdWUoJ21hdGVyaWFscycsIHJlcXVpcmUoJy4vc2VydmljZXMvbWF0ZXJpYWxzJykpO1xuYXBwLnZhbHVlKCdjYW52YXMnLCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FudmFzJykpO1xuXG52YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbnRhaW5lcicpO1xuYXBwLnVzZShyZXF1aXJlKCcuL3N5c3RlbXMvcmVuZGVyZXInKShzY2VuZSwgY2FtZXJhLCBjb250YWluZXIpKTtcbmFwcC51c2UoJ2lucHV0JywgcmVxdWlyZSgnLi9zeXN0ZW1zL2lucHV0JykoY29udGFpbmVyKSk7XG5hcHAudXNlKHJlcXVpcmUoJy4vdm94ZWwvdm94ZWwnKSgpKTtcblxudmFyIGRldkNvbnNvbGUgPSByZXF1aXJlKCcuL3NlcnZpY2VzL2RldmNvbnNvbGUnKSh7XG4gIG9uYmx1cjogZnVuY3Rpb24oKSB7XG4gICAgY29udGFpbmVyLmZvY3VzKCk7XG4gIH1cbn0pO1xuYXBwLnZhbHVlKCdkZXZDb25zb2xlJywgZGV2Q29uc29sZSk7XG5cbnZhciBwcmVmYWJTZXJ2aWNlID0gcmVxdWlyZSgnLi9zZXJ2aWNlcy9wcmVmYWJzZXJ2aWNlJykoKTtcbmFwcC52YWx1ZSgncHJlZmFiU2VydmljZScsIHByZWZhYlNlcnZpY2UpO1xuXG5zdGF0cyhhcHApO1xuXG4vLyBBdHRhY2ggY2FtZXJhIGNvbnRyb2xcbmZ1bmN0aW9uIGxvYWRHYW1lKCkge1xuICBhcHAuYXR0YWNoKGNhbWVyYSwgcmVxdWlyZSgnLi9jb21wb25lbnRzL3BsYXllckNhbWVyYScpKTtcblxuICBhcHAubG9hZEFzc2VtYmx5KHJlcXVpcmUoJy4vYXNzZW1ibGllcy9hZ3JvdW5kJykpO1xuXG4gIHZhciBwbGF5ZXIgPSBhcHAubG9hZEFzc2VtYmx5KHJlcXVpcmUoJy4vYXNzZW1ibGllcy9hcGxheWVyJykpO1xuICBhcHAudmFsdWUoJ3BsYXllcicsIHBsYXllcik7XG59O1xuXG5mdW5jdGlvbiBsb2FkRWRpdG9yKCkge1xuICBhcHAubG9hZEFzc2VtYmx5KHJlcXVpcmUoJy4vYXNzZW1ibGllcy9hZWRpdG9yJykpO1xufVxuXG5sb2FkRWRpdG9yKCk7XG5cbmFwcC5zdGFydCgpO1xuXG52YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbnZhcycpO1xuYXBwLm9uKCdiZWZvcmVUaWNrJywgZnVuY3Rpb24oKSB7XG4gIGlmIChjYW52YXMud2lkdGggIT09IHdpbmRvdy5pbm5lcldpZHRoKSB7XG4gICAgY2FudmFzLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gIH1cbiAgaWYgKGNhbnZhcy5oZWlnaHQgIT09IHdpbmRvdy5pbm5lckhlaWdodCkge1xuICAgIGNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gIH1cbn0pOyIsInZhciBwYXJzZUFyZ3MgPSByZXF1aXJlKCdtaW5pbWlzdCcpO1xudmFyIGtleWNvZGUgPSByZXF1aXJlKCdrZXljb2RlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0cykge1xuICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgdmFyIG9uZm9jdXMgPSBvcHRzLm9uZm9jdXMgfHwgbnVsbDtcbiAgdmFyIG9uYmx1ciA9IG9wdHMub25ibHVyIHx8IG51bGw7XG4gIHZhciBjb21tYW5kcyA9IG9wdHMuY29tbWFuZHMgfHwge307XG5cbiAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGRpdik7XG4gIGRpdi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIGRpdi5zdHlsZS5sZWZ0ID0gJzBweCc7XG4gIGRpdi5zdHlsZS50b3AgPSAnMHB4JztcbiAgZGl2LnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICBkaXYuc3R5bGUuaGVpZ2h0ID0gJzEyMHB4JztcbiAgZGl2LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICdyZ2JhKDAsIDAsIDAsIDAuNSknO1xuXG4gIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIGlucHV0LnR5cGUgPSAndGV4dCc7XG4gIGlucHV0LmNsYXNzTmFtZSA9ICdjb25zb2xlLWlucHV0JztcbiAgaW5wdXQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICBpbnB1dC5zdHlsZS5sZWZ0ID0gJzBweCc7XG4gIGlucHV0LnN0eWxlLnRvcCA9ICcwcHgnO1xuICBpbnB1dC5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgaW5wdXQuc3R5bGUuaGVpZ2h0ID0gJzIwcHgnO1xuICBpbnB1dC5zdHlsZVsnYmFja2dyb3VuZC1jb2xvciddID0gJ3RyYW5zcGFyZW50JztcbiAgaW5wdXQuc3R5bGVbJ2JvcmRlciddID0gJzBweCBzb2xpZCc7XG4gIGlucHV0LnNwZWxsY2hlY2sgPSBmYWxzZTtcbiAgaW5wdXQuc3R5bGUuY29sb3IgPSAnI0ZGRkZGRic7XG4gIGlucHV0LnN0eWxlLmZvbnRTaXplID0gJzE2cHgnO1xuICBpbnB1dC5zdHlsZS5wYWRkaW5nID0gJzJweCAycHggMHB4IDJweCc7XG4gIGlucHV0LnZhbHVlID0gJz4gJztcblxuICBkaXYuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuXG4gIHZhciB0ZXh0U3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgdGV4dFNwYW4uY2xhc3NOYW1lID0gJ2NvbnNvbGUtc3Bhbic7XG4gIHRleHRTcGFuLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgdGV4dFNwYW4uc3R5bGUubGVmdCA9ICcwcHgnO1xuICB0ZXh0U3Bhbi5zdHlsZS50b3AgPSAnMjBweCc7XG4gIHRleHRTcGFuLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICB0ZXh0U3Bhbi5zdHlsZS5oZWlnaHQgPSAnMTAwcHgnO1xuICB0ZXh0U3Bhbi5zdHlsZS5jb2xvciA9ICcjRkZGRkZGJztcbiAgdGV4dFNwYW4uc3R5bGUuZm9udFNpemUgPSAnMTZweCc7XG4gIHRleHRTcGFuLnN0eWxlLnBhZGRpbmcgPSAnMHB4IDJweCAycHggMnB4JztcblxuICBkaXYuYXBwZW5kQ2hpbGQodGV4dFNwYW4pO1xuXG4gIC8vIFJlbW92ZSBvdXRsaW5lIG9uIGZvY3VzXG4gIGlucHV0Lm9uZm9jdXMgPSBmdW5jdGlvbigpIHtcbiAgICBpbnB1dC5zdHlsZVsnb3V0bGluZSddID0gJ25vbmUnO1xuICB9O1xuXG4gIGlucHV0Lm9ua2V5cHJlc3MgPSBmdW5jdGlvbihlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgIG9uRW50ZXJQcmVzc2VkKCk7XG4gICAgfVxuICAgIG9uSW5wdXRDaGFuZ2VkKGUpO1xuICB9O1xuXG4gIGlucHV0Lm9ua2V5dXAgPSBmdW5jdGlvbihlKSB7XG4gICAgb25JbnB1dENoYW5nZWQoZSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gb25JbnB1dENoYW5nZWQoZSkge1xuICAgIGlmIChpbnB1dC52YWx1ZS5sZW5ndGggPCAyKSB7XG4gICAgICBpbnB1dC52YWx1ZSA9ICc+ICc7XG4gICAgfVxuICB9O1xuXG4gIHZhciBsaW5lcyA9IFtdO1xuICB2YXIgaGlzdG9yeUxlbmd0aCA9IDEwMDtcbiAgdmFyIG51bWJlck9mTGluZXMgPSA1O1xuXG4gIGZ1bmN0aW9uIG9uRW50ZXJQcmVzc2VkKCkge1xuICAgIHZhciBsaW5lID0gaW5wdXQudmFsdWU7XG4gICAgYWRkTG9nKGxpbmUpO1xuICAgIGxpbmUgPSBsaW5lLnN1YnN0cmluZygyKTtcbiAgICBsaW5lID0gbGluZS50cmltKCk7XG4gICAgdmFyIGluZGV4ID0gbGluZS5pbmRleE9mKCcgJyk7XG4gICAgdmFyIGNvbW1hbmROYW1lID0gaW5kZXggPT09IC0xID8gbGluZSA6IGxpbmUuc3Vic3RyaW5nKDAsIGluZGV4KTtcbiAgICB2YXIgYXJncyA9IGluZGV4ID09PSAtMSA/ICcnIDogbGluZS5zdWJzdHJpbmcoaW5kZXggKyAxKTtcblxuICAgIHZhciBjb21tYW5kID0gY29tbWFuZHNbY29tbWFuZE5hbWVdO1xuICAgIGlmIChjb21tYW5kID09IG51bGwpIHtcbiAgICAgIGFkZEVycm9yKGNvbW1hbmROYW1lICsgJzogY29tbWFuZCBub3QgZm91bmQnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IGNvbW1hbmQocGFyc2VBcmdzKGFyZ3Muc3BsaXQoJyAnKSkpO1xuICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBhZGRMb2cocmVzdWx0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhpZGUoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBhZGRFcnJvcihlcnIpO1xuICAgICAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaW5wdXQudmFsdWUgPSAnJztcbiAgfTtcblxuICBmdW5jdGlvbiBhZGRMb2cobGluZSkge1xuICAgIGFkZExpbmUobGluZSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gYWRkRXJyb3IobGluZSkge1xuICAgIGFkZExpbmUobGluZSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gYWRkTGluZShsaW5lKSB7XG4gICAgbGluZXMucHVzaChsaW5lKTtcbiAgICBpZiAobGluZXMubGVuZ3RoID4gaGlzdG9yeUxlbmd0aCkge1xuICAgICAgbGluZXMucG9wKCk7XG4gICAgfVxuICAgIHVwZGF0ZUxpbmVzKCk7XG4gIH07XG5cbiAgZnVuY3Rpb24gdXBkYXRlTGluZXMoKSB7XG4gICAgdmFyIHRleHQgPSAnJztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bWJlck9mTGluZXM7IGkrKykge1xuICAgICAgdmFyIGxpbmUgPSBsaW5lc1tsaW5lcy5sZW5ndGggLSAxIC0gaV07XG4gICAgICBsaW5lID0gbGluZSB8fCAnJztcbiAgICAgIHRleHQgKz0gbGluZTtcbiAgICAgIHRleHQgKz0gXCI8YnIgLz5cIjtcbiAgICB9XG5cbiAgICB0ZXh0U3Bhbi5pbm5lckhUTUwgPSB0ZXh0O1xuICB9O1xuXG4gIGZ1bmN0aW9uIGhpZGUoKSB7XG4gICAgZGl2LmhpZGRlbiA9IHRydWU7XG4gICAgaW5wdXQuYmx1cigpO1xuICAgIGlmIChvbmJsdXIgIT0gbnVsbCkge1xuICAgICAgb25ibHVyKCk7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIHNob3coKSB7XG4gICAgZGl2LmhpZGRlbiA9IGZhbHNlO1xuICAgIGlucHV0LnZhbHVlID0gaW5wdXQudmFsdWUuc3BsaXQoJ2AnKS5qb2luKCcnKTtcbiAgICBpbnB1dC5mb2N1cygpO1xuICAgIGlmIChvbmZvY3VzICE9IG51bGwpIHtcbiAgICAgIG9uZm9jdXMoKTtcbiAgICB9XG4gIH07XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZnVuY3Rpb24oZSkge1xuICAgIHZhciBrZXkgPSBrZXljb2RlKGUpO1xuICAgIGlmIChrZXkgPT09ICdgJykge1xuICAgICAgaWYgKGRpdi5oaWRkZW4pIHtcbiAgICAgICAgc2hvdygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaGlkZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgLy8gSGlkZGVuIGJ5IGRlZmF1bHRcbiAgZGl2LmhpZGRlbiA9IHRydWU7XG5cbiAgZnVuY3Rpb24gbG9hZENvbW1hbmRzKHZhbHVlKSB7XG4gICAgZm9yICh2YXIgaSBpbiB2YWx1ZSkge1xuICAgICAgY29tbWFuZHNbaV0gPSB2YWx1ZVtpXTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBjb21tYW5kczogY29tbWFuZHMsXG4gICAgbG9hZENvbW1hbmRzOiBsb2FkQ29tbWFuZHNcbiAgfTtcbn07IiwidmFyIFRIUkVFID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ1RIUkVFJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydUSFJFRSddIDogbnVsbCk7XG5cbnZhciB0ZXh0dXJlTG9hZGVyID0gbmV3IFRIUkVFLlRleHR1cmVMb2FkZXIoKTtcblxuZnVuY3Rpb24gbG9hZExhbWJlcnRNYXRlcmlhbChzb3VyY2UpIHtcbiAgdmFyIHRleHR1cmUgPSB0ZXh0dXJlTG9hZGVyLmxvYWQoc291cmNlKTtcbiAgdGV4dHVyZS53cmFwUyA9IFRIUkVFLlJlcGVhdFdyYXBwaW5nO1xuICB0ZXh0dXJlLndyYXBUID0gVEhSRUUuUmVwZWF0V3JhcHBpbmc7XG5cbiAgcmV0dXJuIG5ldyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsKHtcbiAgICBtYXA6IHRleHR1cmVcbiAgfSk7XG59O1xuXG5mdW5jdGlvbiBsb2FkQmFzaWNNYXRlcmlhbChzb3VyY2UpIHtcbiAgdmFyIHRleHR1cmUgPSB0ZXh0dXJlTG9hZGVyLmxvYWQoc291cmNlKTtcbiAgdGV4dHVyZS53cmFwUyA9IFRIUkVFLlJlcGVhdFdyYXBwaW5nO1xuICB0ZXh0dXJlLndyYXBUID0gVEhSRUUuUmVwZWF0V3JhcHBpbmc7XG5cbiAgdGV4dHVyZS5tYWdGaWx0ZXIgPSBUSFJFRS5OZWFyZXN0RmlsdGVyO1xuICBcbiAgcmV0dXJuIG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgbWFwOiB0ZXh0dXJlXG4gIH0pO1xufTtcblxubWF0ZXJpYWxzID0ge1xuICAnMSc6IGxvYWRMYW1iZXJ0TWF0ZXJpYWwoJ2ltYWdlcy8xLnBuZycpLFxuICAncGxhY2Vob2xkZXInOiBsb2FkQmFzaWNNYXRlcmlhbCgnaW1hZ2VzL3BsYWNlaG9sZGVyLnBuZycpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gbWF0ZXJpYWxzOyIsInZhciBQcmVmYWJTZXJ2aWNlID0gZnVuY3Rpb24oKSB7fTtcblxuUHJlZmFiU2VydmljZS5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uKCkge1xuICB0cnkge1xuICAgIHZhciBzYXZlcyA9IEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKCdiX3NhdmVzJykgfHwgW10pO1xuICAgIHJldHVybiBzYXZlcztcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG59O1xuXG5QcmVmYWJTZXJ2aWNlLnByb3RvdHlwZS5zYXZlID0gZnVuY3Rpb24oZGF0YSkge1xuICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2Jfc2F2ZXMnLCBKU09OLnN0cmluZ2lmeShkYXRhKSk7XG59O1xuXG5QcmVmYWJTZXJ2aWNlLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uKCkge1xuICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2Jfc2F2ZXMnLCAnJyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFByZWZhYlNlcnZpY2UoKTtcbn07IiwidmFyIFN0YXRzID0gcmVxdWlyZSgnc3RhdHMuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcHApIHtcbiAgYXBwLm9uKCdiZWZvcmVUaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgc3RhdHMuYmVnaW4oKTtcbiAgfSk7XG5cbiAgYXBwLm9uKCdhZnRlclRpY2snLCBmdW5jdGlvbigpIHtcbiAgICBzdGF0cy5lbmQoKTtcbiAgfSk7XG5cbiAgdmFyIHN0YXRzID0gbmV3IFN0YXRzKCk7XG4gIHN0YXRzLmRvbUVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICBzdGF0cy5kb21FbGVtZW50LnN0eWxlLnJpZ2h0ID0gJzBweCc7XG4gIHN0YXRzLmRvbUVsZW1lbnQuc3R5bGUuYm90dG9tID0gJzUwcHgnO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHN0YXRzLmRvbUVsZW1lbnQpO1xuXG4gIHJldHVybiBzdGF0cy5kb21FbGVtZW50O1xufTsiLCJ2YXIgYXJyYXlVdGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzL2FycmF5dXRpbHMnKTtcbnZhciBrZXljb2RlID0gcmVxdWlyZSgna2V5Y29kZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgdmFyIG1vdXNlID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcbiAgdmFyIG1vdXNlZG93bnMgPSBbXTtcbiAgdmFyIG1vdXNldXBzID0gW107XG4gIHZhciBtb3VzZW1vdmUgPSBmYWxzZTtcbiAgdmFyIG1vdXNlaG9sZHMgPSBbXTtcbiAgdmFyIGtleWRvd25zID0gW107XG4gIHZhciBrZXl1cHMgPSBbXTtcbiAgdmFyIGtleWhvbGRzID0gW107XG4gIHZhciBtb3VzZWRvd25UaW1lcyA9IHt9O1xuICB2YXIgY2xpY2tUaW1lID0gMTUwO1xuICB2YXIgbW91c2VjbGlja3MgPSBbXTtcblxuICBlbGVtZW50LmZvY3VzKCk7XG5cbiAgZnVuY3Rpb24gb25Nb3VzZU1vdmUoZSkge1xuICAgIG1vdXNlbW92ZSA9IHRydWU7XG4gICAgbW91c2UueCA9IGUuY2xpZW50WDtcbiAgICBtb3VzZS55ID0gZS5jbGllbnRZO1xuICB9O1xuXG4gIGZ1bmN0aW9uIG9uTW91c2VEb3duKGUpIHtcbiAgICBtb3VzZWRvd25zLnB1c2goZS5idXR0b24pO1xuICAgIG1vdXNlZG93blRpbWVzW2UuYnV0dG9uXSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIGlmICghYXJyYXlVdGlscy5pbmNsdWRlcyhtb3VzZWhvbGRzLCBlLmJ1dHRvbikpIHtcbiAgICAgIG1vdXNlaG9sZHMucHVzaChlLmJ1dHRvbik7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIG9uTW91c2VVcChlKSB7XG4gICAgaWYgKCEhbW91c2Vkb3duVGltZXNbZS5idXR0b25dKSB7XG4gICAgICB2YXIgZGlmZiA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gbW91c2Vkb3duVGltZXNbZS5idXR0b25dO1xuICAgICAgaWYgKGRpZmYgPCBjbGlja1RpbWUpIHtcbiAgICAgICAgbW91c2VjbGlja3MucHVzaChlLmJ1dHRvbik7XG4gICAgICB9XG4gICAgfVxuICAgIG1vdXNldXBzLnB1c2goZS5idXR0b24pO1xuICAgIGFycmF5VXRpbHMucmVtb3ZlKG1vdXNlaG9sZHMsIGUuYnV0dG9uKTtcbiAgfTtcblxuICBmdW5jdGlvbiBvbktleURvd24oZSkge1xuICAgIHZhciBrZXkgPSBrZXljb2RlKGUpO1xuICAgIGtleWRvd25zLnB1c2goa2V5KTtcbiAgICBpZiAoIWFycmF5VXRpbHMuaW5jbHVkZXMoa2V5aG9sZHMsIGtleSkpIHtcbiAgICAgIGtleWhvbGRzLnB1c2goa2V5KTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gb25LZXlVcChlKSB7XG4gICAgdmFyIGtleSA9IGtleWNvZGUoZSk7XG4gICAga2V5dXBzLnB1c2goa2V5KTtcbiAgICBhcnJheVV0aWxzLnJlbW92ZShrZXlob2xkcywga2V5KTtcbiAgfTtcblxuICBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICBtb3VzZWRvd25zID0gW107XG4gICAgbW91c2V1cHMgPSBbXTtcbiAgICBtb3VzZW1vdmUgPSBmYWxzZTtcbiAgICBrZXlkb3ducyA9IFtdO1xuICAgIGtleXVwcyA9IFtdO1xuICAgIG1vdXNlY2xpY2tzID0gW107XG4gIH1cblxuICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIG9uTW91c2VEb3duKTtcbiAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSk7XG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIG9uTW91c2VVcCk7XG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9uS2V5RG93bik7XG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBvbktleVVwKTtcblxuICByZXR1cm4ge1xuICAgIG1vdXNlOiBtb3VzZSxcblxuICAgIG1vdXNlRG93bjogZnVuY3Rpb24oYnV0dG9uKSB7XG4gICAgICBpZiAoYnV0dG9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIG1vdXNlZG93bnMubGVuZ3RoID4gMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcnJheVV0aWxzLmluY2x1ZGVzKG1vdXNlZG93bnMsIGJ1dHRvbik7XG4gICAgfSxcblxuICAgIG1vdXNlVXA6IGZ1bmN0aW9uKGJ1dHRvbikge1xuICAgICAgaWYgKGJ1dHRvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBtb3VzZXVwcy5sZW5ndGggPiAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFycmF5VXRpbHMuaW5jbHVkZXMobW91c2V1cHMsIGJ1dHRvbik7XG4gICAgfSxcblxuICAgIG1vdXNlSG9sZDogZnVuY3Rpb24oYnV0dG9uKSB7XG4gICAgICBpZiAoYnV0dG9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIG1vdXNlaG9sZHMubGVuZ3RoID4gMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcnJheVV0aWxzLmluY2x1ZGVzKG1vdXNlaG9sZHMsIGJ1dHRvbik7XG4gICAgfSxcblxuICAgIG1vdXNlQ2xpY2s6IGZ1bmN0aW9uKGJ1dHRvbikge1xuICAgICAgaWYgKGJ1dHRvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBtb3VzZWNsaWNrcy5sZW5ndGggPiAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFycmF5VXRpbHMuaW5jbHVkZXMobW91c2VjbGlja3MsIGJ1dHRvbik7XG4gICAgfSxcblxuICAgIGtleURvd246IGZ1bmN0aW9uKGtleSkge1xuICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBrZXlkb3ducy5sZW5ndGggPiAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFycmF5VXRpbHMuaW5jbHVkZXMoa2V5ZG93bnMsIGtleSk7XG4gICAgfSxcblxuICAgIGtleVVwOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4ga2V5dXBzLmxlbmd0aCA+IDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gYXJyYXlVdGlscy5pbmNsdWRlcyhrZXl1cHMsIGtleSk7XG4gICAgfSxcblxuICAgIGtleUhvbGQ6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBrZXlob2xkcy5sZW5ndGggPiAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFycmF5VXRpbHMuaW5jbHVkZXMoa2V5aG9sZHMsIGtleSk7XG4gICAgfSxcblxuICAgIG1vdXNlTW92ZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbW91c2Vtb3ZlO1xuICAgIH0sXG5cbiAgICBsYXRlVGljazogZnVuY3Rpb24oKSB7XG4gICAgICBjbGVhcigpO1xuICAgIH0sXG5cbiAgICBzY3JlZW5Ub1ZpZXdwb3J0OiBmdW5jdGlvbihzY3JlZW4pIHtcbiAgICAgIHZhciB2aWV3cG9ydCA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gICAgICB2aWV3cG9ydC54ID0gKHNjcmVlbi54IC8gd2luZG93LmlubmVyV2lkdGgpICogMiAtIDE7XG4gICAgICB2aWV3cG9ydC55ID0gLShzY3JlZW4ueSAvIHdpbmRvdy5pbm5lckhlaWdodCkgKiAyICsgMTtcbiAgICAgIHJldHVybiB2aWV3cG9ydDtcbiAgICB9XG4gIH07XG59OyIsInZhciBTdGF0cyA9IHJlcXVpcmUoJ3N0YXRzLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2NlbmUsIGNhbWVyYSwgY29udGFpbmVyKSB7XG4gIHZhciByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKCk7XG4gIHJlbmRlcmVyLnNldENsZWFyQ29sb3IoMHgzMzMzMzMpO1xuICByZW5kZXJlci5zZXRTaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpO1xuXG4gIGNvbnRhaW5lciA9IGNvbnRhaW5lciB8fCBkb2N1bWVudC5ib2R5O1xuICBjb250YWluZXIuYXBwZW5kQ2hpbGQocmVuZGVyZXIuZG9tRWxlbWVudCk7XG5cbiAgdmFyIHJlbmRlcmVyLCBjYW1lcmE7XG4gIHZhciBzc2FvUGFzcywgZWZmZWN0Q29tcG9zZXI7XG5cbiAgdmFyIHN5c3RlbSA9IHt9O1xuICBzeXN0ZW0ucmVuZGVyZXIgPSByZW5kZXJlcjtcblxuICB2YXIgc3RhdHMgPSBuZXcgU3RhdHMoKTtcbiAgc3RhdHMuZG9tRWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIHN0YXRzLmRvbUVsZW1lbnQuc3R5bGUucmlnaHQgPSAnMHB4JztcbiAgc3RhdHMuZG9tRWxlbWVudC5zdHlsZS5ib3R0b20gPSAnMHB4JztcblxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHN0YXRzLmRvbUVsZW1lbnQpO1xuXG4gIHZhciBzc2FvID0gdHJ1ZTtcblxuICB2YXIgYW1iaWVudCA9IG5ldyBUSFJFRS5BbWJpZW50TGlnaHQobmV3IFRIUkVFLkNvbG9yKFwicmdiKDYwJSwgNjAlLCA2MCUpXCIpKTtcbiAgdmFyIGxpZ2h0ID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoMHhmZmZmZmYsIDAuNik7XG4gIGxpZ2h0LnBvc2l0aW9uLnNldCgwLjgsIDEsIDAuNSk7XG4gIHNjZW5lLmFkZChsaWdodCk7XG4gIHNjZW5lLmFkZChhbWJpZW50KTtcblxuICBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlbmRlcik7XG5cbiAgICBzdGF0cy5iZWdpbigpO1xuXG4gICAgaWYgKHNzYW8pIHtcbiAgICAgIC8vIFJlbmRlciBkZXB0aCBpbnRvIGRlcHRoUmVuZGVyVGFyZ2V0XG4gICAgICBzY2VuZS5vdmVycmlkZU1hdGVyaWFsID0gZGVwdGhNYXRlcmlhbDtcbiAgICAgIHJlbmRlcmVyLnJlbmRlcihzY2VuZSwgY2FtZXJhLCBkZXB0aFJlbmRlclRhcmdldCwgdHJ1ZSk7XG5cbiAgICAgIC8vIFJlbmRlciByZW5kZXJQYXNzIGFuZCBTU0FPIHNoYWRlclBhc3NcbiAgICAgIHNjZW5lLm92ZXJyaWRlTWF0ZXJpYWwgPSBudWxsO1xuICAgICAgZWZmZWN0Q29tcG9zZXIucmVuZGVyKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbmRlcmVyLnJlbmRlcihzY2VuZSwgY2FtZXJhKTtcbiAgICB9XG5cblxuICAgIHN0YXRzLmVuZCgpO1xuICB9O1xuXG4gIGZ1bmN0aW9uIG9uV2luZG93UmVzaXplKCkge1xuICAgIHZhciB3aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIHZhciBoZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG5cbiAgICBjYW1lcmEuYXNwZWN0ID0gd2lkdGggLyBoZWlnaHQ7XG4gICAgY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcbiAgICByZW5kZXJlci5zZXRTaXplKHdpZHRoLCBoZWlnaHQpO1xuXG4gICAgLy8gUmVzaXplIHJlbmRlclRhcmdldHNcbiAgICBzc2FvUGFzcy51bmlmb3Jtc1snc2l6ZSddLnZhbHVlLnNldCh3aWR0aCwgaGVpZ2h0KTtcblxuICAgIHZhciBwaXhlbFJhdGlvID0gcmVuZGVyZXIuZ2V0UGl4ZWxSYXRpbygpO1xuICAgIHZhciBuZXdXaWR0aCA9IE1hdGguZmxvb3Iod2lkdGggLyBwaXhlbFJhdGlvKSB8fCAxO1xuICAgIHZhciBuZXdIZWlnaHQgPSBNYXRoLmZsb29yKGhlaWdodCAvIHBpeGVsUmF0aW8pIHx8IDE7XG4gICAgZGVwdGhSZW5kZXJUYXJnZXQuc2V0U2l6ZShuZXdXaWR0aCwgbmV3SGVpZ2h0KTtcbiAgICBlZmZlY3RDb21wb3Nlci5zZXRTaXplKG5ld1dpZHRoLCBuZXdIZWlnaHQpO1xuICB9XG5cbiAgZnVuY3Rpb24gaW5pdFBvc3Rwcm9jZXNzaW5nKCkge1xuXG4gICAgLy8gU2V0dXAgcmVuZGVyIHBhc3NcbiAgICB2YXIgcmVuZGVyUGFzcyA9IG5ldyBUSFJFRS5SZW5kZXJQYXNzKHNjZW5lLCBjYW1lcmEpO1xuXG4gICAgLy8gU2V0dXAgZGVwdGggcGFzc1xuICAgIHZhciBkZXB0aFNoYWRlciA9IFRIUkVFLlNoYWRlckxpYltcImRlcHRoUkdCQVwiXTtcbiAgICB2YXIgZGVwdGhVbmlmb3JtcyA9IFRIUkVFLlVuaWZvcm1zVXRpbHMuY2xvbmUoZGVwdGhTaGFkZXIudW5pZm9ybXMpO1xuXG4gICAgZGVwdGhNYXRlcmlhbCA9IG5ldyBUSFJFRS5TaGFkZXJNYXRlcmlhbCh7XG4gICAgICBmcmFnbWVudFNoYWRlcjogZGVwdGhTaGFkZXIuZnJhZ21lbnRTaGFkZXIsXG4gICAgICB2ZXJ0ZXhTaGFkZXI6IGRlcHRoU2hhZGVyLnZlcnRleFNoYWRlcixcbiAgICAgIHVuaWZvcm1zOiBkZXB0aFVuaWZvcm1zLFxuICAgICAgYmxlbmRpbmc6IFRIUkVFLk5vQmxlbmRpbmdcbiAgICB9KTtcblxuICAgIHZhciBwYXJzID0ge1xuICAgICAgbWluRmlsdGVyOiBUSFJFRS5MaW5lYXJGaWx0ZXIsXG4gICAgICBtYWdGaWx0ZXI6IFRIUkVFLkxpbmVhckZpbHRlclxuICAgIH07XG4gICAgZGVwdGhSZW5kZXJUYXJnZXQgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJUYXJnZXQod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCwgcGFycyk7XG5cbiAgICAvLyBTZXR1cCBTU0FPIHBhc3NcbiAgICBzc2FvUGFzcyA9IG5ldyBUSFJFRS5TaGFkZXJQYXNzKFRIUkVFLlNTQU9TaGFkZXIpO1xuICAgIHNzYW9QYXNzLnJlbmRlclRvU2NyZWVuID0gdHJ1ZTtcbiAgICAvL3NzYW9QYXNzLnVuaWZvcm1zWyBcInREaWZmdXNlXCIgXS52YWx1ZSB3aWxsIGJlIHNldCBieSBTaGFkZXJQYXNzXG4gICAgc3Nhb1Bhc3MudW5pZm9ybXNbXCJ0RGVwdGhcIl0udmFsdWUgPSBkZXB0aFJlbmRlclRhcmdldDtcbiAgICBzc2FvUGFzcy51bmlmb3Jtc1snc2l6ZSddLnZhbHVlLnNldCh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgICBzc2FvUGFzcy51bmlmb3Jtc1snY2FtZXJhTmVhciddLnZhbHVlID0gY2FtZXJhLm5lYXI7XG4gICAgc3Nhb1Bhc3MudW5pZm9ybXNbJ2NhbWVyYUZhciddLnZhbHVlID0gY2FtZXJhLmZhcjtcbiAgICBzc2FvUGFzcy51bmlmb3Jtc1snb25seUFPJ10udmFsdWUgPSBmYWxzZTtcbiAgICBzc2FvUGFzcy51bmlmb3Jtc1snYW9DbGFtcCddLnZhbHVlID0gMTtcbiAgICBzc2FvUGFzcy51bmlmb3Jtc1snbHVtSW5mbHVlbmNlJ10udmFsdWUgPSAwLjU7XG5cbiAgICAvLyBBZGQgcGFzcyB0byBlZmZlY3QgY29tcG9zZXJcbiAgICBlZmZlY3RDb21wb3NlciA9IG5ldyBUSFJFRS5FZmZlY3RDb21wb3NlcihyZW5kZXJlcik7XG4gICAgZWZmZWN0Q29tcG9zZXIuYWRkUGFzcyhyZW5kZXJQYXNzKTtcbiAgICBlZmZlY3RDb21wb3Nlci5hZGRQYXNzKHNzYW9QYXNzKTtcbiAgfVxuXG4gIC8vIFNldCB1cCByZW5kZXIgbG9vcFxuICBpbml0UG9zdHByb2Nlc3NpbmcoKTtcbiAgcmVuZGVyKCk7XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIG9uV2luZG93UmVzaXplLCBmYWxzZSk7XG5cbiAgcmV0dXJuIHN5c3RlbTtcbn07IiwidmFyIGFycmF5ID0ge1xuICBpbmRleE9mOiBmdW5jdGlvbihhcnJheSwgZWxlbWVudCkge1xuICAgIHZhciBwcmVkaWNhdGUgPSB0eXBlb2YgZWxlbWVudCA9PT0gJ2Z1bmN0aW9uJyA/IGVsZW1lbnQgOiBmdW5jdGlvbih2KSB7XG4gICAgICByZXR1cm4gdiA9PT0gZWxlbWVudDtcbiAgICB9O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHByZWRpY2F0ZShhcnJheVtpXSkpIHtcbiAgICAgICAgcmV0dXJuIGk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAtMTtcbiAgfSxcblxuICBpbmNsdWRlczogZnVuY3Rpb24oYXJyYXksIGVsZW1lbnQpIHtcbiAgICByZXR1cm4gdGhpcy5pbmRleE9mKGFycmF5LCBlbGVtZW50KSAhPT0gLTE7XG4gIH0sXG5cbiAgcmVtb3ZlOiBmdW5jdGlvbihhcnJheSwgZWxlbWVudCkge1xuICAgIHZhciBpbmRleCA9IHRoaXMuaW5kZXhPZihhcnJheSwgZWxlbWVudCk7XG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgYXJyYXkuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gIH0sXG5cbiAgY2xvbmU6IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIGNvcHkgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb3B5W2ldID0gYXJyYXlbaV07XG4gICAgfVxuICAgIHJldHVybiBjb3B5O1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFycmF5OyIsInZhciBHcmF2aXR5ID0gZnVuY3Rpb24oZGlyLCBheGlzLCBwb3NpdGl2ZSkge1xuICB0aGlzLmRpciA9IGRpciB8fCBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICB0aGlzLmF4aXMgPSBheGlzIHx8ICcnO1xuICB0aGlzLnBvc2l0aXZlID0gcG9zaXRpdmUgfHwgJyc7XG5cbiAgdGhpcy5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgR3Jhdml0eSh0aGlzLmRpciwgdGhpcy5heGlzLCB0aGlzLnBvc2l0aXZlKTtcbiAgfTtcblxuICB0aGlzLmVxdWFscyA9IGZ1bmN0aW9uKGdyYXZpdHkpIHtcbiAgICByZXR1cm4gdGhpcy5kaXIuZXF1YWxzKGdyYXZpdHkuZGlyKTtcbiAgfTtcblxuICB0aGlzLmlzTm9uZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmRpci5sZW5ndGgoKSA9PT0gMDtcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR3Jhdml0eTsiLCJ2YXIgR3Jhdml0eSA9IHJlcXVpcmUoJy4vZ3Jhdml0eScpO1xuXG52YXIgZ3Jhdml0aWVzID0ge1xuICBub25lOiBuZXcgR3Jhdml0eSgpLFxuICByaWdodDogbmV3IEdyYXZpdHkobmV3IFRIUkVFLlZlY3RvcjMoMSwgMCwgMCkubm9ybWFsaXplKCksICd4JywgdHJ1ZSksXG4gIGxlZnQ6IG5ldyBHcmF2aXR5KG5ldyBUSFJFRS5WZWN0b3IzKC0xLCAwLCAwKS5ub3JtYWxpemUoKSwgJ3gnLCBmYWxzZSksXG4gIHRvcDogbmV3IEdyYXZpdHkobmV3IFRIUkVFLlZlY3RvcjMoMCwgMSwgMCkubm9ybWFsaXplKCksICd5JywgdHJ1ZSksXG4gIGJvdHRvbTogbmV3IEdyYXZpdHkobmV3IFRIUkVFLlZlY3RvcjMoMCwgLTEsIDApLm5vcm1hbGl6ZSgpLCAneScsIGZhbHNlKSxcbiAgZnJvbnQ6IG5ldyBHcmF2aXR5KG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDEpLm5vcm1hbGl6ZSgpLCAneicsIHRydWUpLFxuICBiYWNrOiBuZXcgR3Jhdml0eShuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSkubm9ybWFsaXplKCksICd6JywgZmFsc2UpXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0R3Jhdml0eTogZnVuY3Rpb24ocG9zaXRpb24pIHtcbiAgICB2YXIgbWluID0gMTtcbiAgICB2YXIgY2xvc2VzdCA9IG51bGw7XG4gICAgdmFyIGZvcmNlID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBmb3IgKHZhciBpZCBpbiBncmF2aXRpZXMpIHtcbiAgICAgIHZhciBncmF2aXR5ID0gZ3Jhdml0aWVzW2lkXTtcbiAgICAgIHZhciBkb3QgPSBncmF2aXR5LmRpci5jbG9uZSgpLmRvdChwb3NpdGlvbi5jbG9uZSgpLm5vcm1hbGl6ZSgpKTtcbiAgICAgIGlmIChkb3QgPCBtaW4pIHtcbiAgICAgICAgbWluID0gZG90O1xuICAgICAgICBjbG9zZXN0ID0gZ3Jhdml0eTtcbiAgICAgIH1cblxuICAgICAgaWYoZG90IDwgLSAwLjUpIHtcbiAgICAgICAgdmFyIHJhdGlvID0gLTAuNSAtIGRvdDtcbiAgICAgICAgZm9yY2UuYWRkKGdyYXZpdHkuZGlyLmNsb25lKCkubXVsdGlwbHlTY2FsYXIocmF0aW8pKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgZ3Jhdml0eSA9IGNsb3Nlc3QuY2xvbmUoKTtcbiAgICBncmF2aXR5LmZvcmNlRGlyID0gZm9yY2Uubm9ybWFsaXplKCk7XG4gICAgcmV0dXJuIGdyYXZpdHk7XG4gIH1cbn07IiwidmFyIGNvbXBpbGVNZXNoZXIgPSByZXF1aXJlKCdncmVlZHktbWVzaGVyJyk7XG52YXIgbmRhcnJheSA9IHJlcXVpcmUoJ25kYXJyYXknKTtcblxudmFyIG1lc2hlciA9IGNvbXBpbGVNZXNoZXIoe1xuICBleHRyYUFyZ3M6IDEsXG4gIG9yZGVyOiBbMCwgMV0sXG4gIGFwcGVuZDogZnVuY3Rpb24obG9feCwgbG9feSwgaGlfeCwgaGlfeSwgdmFsLCByZXN1bHQpIHtcbiAgICByZXN1bHQucHVzaChbXG4gICAgICBbbG9feCwgbG9feV0sXG4gICAgICBbaGlfeCwgaGlfeV1cbiAgICBdKVxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkYXRhLCBkaW0sIHZveGVsU2lkZVRleHR1cmVJZHMpIHtcbiAgdm94ZWxTaWRlVGV4dHVyZUlkcyA9IHZveGVsU2lkZVRleHR1cmVJZHMgfHwge307XG5cbiAgdmFyIHZlcnRpY2VzID0gW107XG4gIHZhciBzdXJmYWNlcyA9IFtdO1xuXG4gIHZhciB1LCB2LCBkaW1zRCwgZGltc1UsIGRpbXNWLCB0ZDAsIHRkMSwgZHYsIGZsaXA7XG5cbiAgLy8gSW50ZXJhdGUgdGhyb3VnaCBkaW1lbnNpb25zXG4gIGZvciAodmFyIGQgPSAwOyBkIDwgMzsgZCsrKSB7XG4gICAgdSA9IChkICsgMSkgJSAzO1xuICAgIHYgPSAoZCArIDIpICUgMztcbiAgICBkaW1zRCA9IGRpbVtkXTtcbiAgICBkaW1zVSA9IGRpbVt1XTtcbiAgICBkaW1zViA9IGRpbVt2XTtcbiAgICB0ZDAgPSBkICogMjtcbiAgICB0ZDEgPSBkICogMiArIDE7XG5cbiAgICAvLyBJbnRlcmF0ZSB0aHJvdWdoIFNsaWNlc1xuICAgIGZsaXAgPSBmYWxzZTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRpbXNEOyBpKyspIHtcbiAgICAgIHByb2Nlc3NTbGljZShpKTtcbiAgICB9XG5cblxuICAgIC8vIEludGVyYXRlIHRocm91Z2ggU2xpY2VzIGZyb20gb3RoZXIgZGlyXG4gICAgZmxpcCA9IHRydWU7XG4gICAgZm9yICh2YXIgaSA9IGRpbXNEIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHByb2Nlc3NTbGljZShpKTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gcHJvY2Vzc1NsaWNlKGkpIHtcbiAgICB2YXIgc2xpY2UgPSBuZGFycmF5KFtdLCBbZGltc1UsIGRpbXNWXSk7XG5cbiAgICB2YXIgczAgPSAwO1xuICAgIGR2ID0gZmxpcCA/IGkgOiBpICsgMTtcblxuICAgIC8vSW50ZXJhdGUgdGhyb3VnaCB1dlxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGltc1U7IGorKykge1xuICAgICAgdmFyIHMxID0gMDtcbiAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgZGltc1Y7IGsrKykge1xuICAgICAgICB2YXIgYiA9IGdldFZveGVsKGksIGosIGssIGQpO1xuICAgICAgICBpZiAoIWIpIHtcbiAgICAgICAgICBzbGljZS5zZXQoaiwgaywgMCk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGIxO1xuICAgICAgICBpZiAoZmxpcCkge1xuICAgICAgICAgIGIxID0gaSA9PT0gMCA/IDAgOiBnZXRWb3hlbChpIC0gMSwgaiwgaywgZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYjEgPSBpID09PSBkaW1zRCAtIDEgPyAwIDogZ2V0Vm94ZWwoaSArIDEsIGosIGssIGQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghIWIxKSB7XG4gICAgICAgICAgc2xpY2Uuc2V0KGosIGssIDApO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0ID0gZ2V0VGV4dHVyZUlkKGIsIGZsaXAgPyB0ZDAgOiB0ZDEpO1xuICAgICAgICBzbGljZS5zZXQoaiwgaywgdCk7XG4gICAgICAgIHMxKys7XG4gICAgICB9XG4gICAgICBzMCsrO1xuICAgIH1cblxuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICBtZXNoZXIoc2xpY2UsIHJlc3VsdCk7XG5cbiAgICBpZiAocmVzdWx0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAodmFyIGwgPSAwOyBsIDwgcmVzdWx0Lmxlbmd0aDsgbCsrKSB7XG4gICAgICB2YXIgZiA9IHJlc3VsdFtsXTtcbiAgICAgIHZhciBsbyA9IGZbMF07XG4gICAgICB2YXIgaGkgPSBmWzFdO1xuICAgICAgdmFyIHNpemV1ID0gaGlbMF0gLSBsb1swXTtcbiAgICAgIHZhciBzaXpldiA9IGhpWzFdIC0gbG9bMV07XG5cbiAgICAgIHZhciBmdXZzID0gW1xuICAgICAgICBbMCwgMF0sXG4gICAgICAgIFtzaXpldSwgMF0sXG4gICAgICAgIFtzaXpldSwgc2l6ZXZdLFxuICAgICAgICBbMCwgc2l6ZXZdXG4gICAgICBdO1xuXG4gICAgICB2YXIgYyA9IHNsaWNlLmdldChsb1swXSwgbG9bMV0pO1xuXG4gICAgICB2YXIgdjAgPSBbXTtcbiAgICAgIHZhciB2MSA9IFtdO1xuICAgICAgdmFyIHYyID0gW107XG4gICAgICB2YXIgdjMgPSBbXTtcblxuICAgICAgdjBbZF0gPSBkdjtcbiAgICAgIHYwW3VdID0gbG9bMF07XG4gICAgICB2MFt2XSA9IGxvWzFdO1xuXG4gICAgICB2MVtkXSA9IGR2O1xuICAgICAgdjFbdV0gPSBoaVswXTtcbiAgICAgIHYxW3ZdID0gbG9bMV07XG5cbiAgICAgIHYyW2RdID0gZHY7XG4gICAgICB2Mlt1XSA9IGhpWzBdO1xuICAgICAgdjJbdl0gPSBoaVsxXTtcblxuICAgICAgdjNbZF0gPSBkdjtcbiAgICAgIHYzW3VdID0gbG9bMF07XG4gICAgICB2M1t2XSA9IGhpWzFdO1xuXG4gICAgICB2YXIgdmluZGV4ID0gdmVydGljZXMubGVuZ3RoO1xuICAgICAgdmVydGljZXMucHVzaCh2MCwgdjEsIHYyLCB2Myk7XG4gICAgICBpZiAoZmxpcCkge1xuICAgICAgICBzdXJmYWNlcy5wdXNoKHtcbiAgICAgICAgICBmYWNlOiBbdmluZGV4ICsgMywgdmluZGV4ICsgMiwgdmluZGV4ICsgMSwgdmluZGV4LCBjXSxcbiAgICAgICAgICB1djogW2Z1dnNbM10sIGZ1dnNbMl0sIGZ1dnNbMV0sIGZ1dnNbMF1dXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3VyZmFjZXMucHVzaCh7XG4gICAgICAgICAgZmFjZTogW3ZpbmRleCwgdmluZGV4ICsgMSwgdmluZGV4ICsgMiwgdmluZGV4ICsgMywgY10sXG4gICAgICAgICAgdXY6IFtmdXZzWzBdLCBmdXZzWzFdLCBmdXZzWzJdLCBmdXZzWzNdXVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRWb3hlbChpLCBqLCBrLCBkKSB7XG4gICAgaWYgKGQgPT09IDApIHtcbiAgICAgIHJldHVybiBkYXRhKGksIGosIGspO1xuICAgICAgLy8gcmV0dXJuIGRhdGFbayArIChqICsgaSAqIGRpbVswXSkgKiBkaW1bMV1dO1xuICAgIH0gZWxzZSBpZiAoZCA9PT0gMSkge1xuICAgICAgcmV0dXJuIGRhdGEoaywgaSwgaik7XG4gICAgICAvLyByZXR1cm4gZGF0YVtqICsgKGkgKyBrICogZGltWzBdKSAqIGRpbVsxXV07XG4gICAgfSBlbHNlIGlmIChkID09PSAyKSB7XG4gICAgICByZXR1cm4gZGF0YShqLCBrLCBpKTtcbiAgICAgIC8vIHJldHVybiBkYXRhW2kgKyAoayArIGogKiBkaW1bMF0pICogZGltWzFdXTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0VGV4dHVyZUlkKGIsIHNpZGUpIHtcbiAgICBpZiAoIWIpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIHZhciBtYXAgPSB2b3hlbFNpZGVUZXh0dXJlSWRzW2JdO1xuICAgIGlmIChtYXAgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGI7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coc2lkZSk7XG4gICAgLy8gY29uc29sZS5sb2cobWFwW3NpZGVdIHx8IGIpO1xuICAgIHJldHVybiBtYXBbc2lkZV0gfHwgYjtcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIHZlcnRpY2VzOiB2ZXJ0aWNlcyxcbiAgICBzdXJmYWNlczogc3VyZmFjZXNcbiAgfVxufTsiLCJ2YXIgVEhSRUUgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snVEhSRUUnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ1RIUkVFJ10gOiBudWxsKTtcbnZhciBncmF2aXR5VXRpbHMgPSByZXF1aXJlKCcuL2dyYXZpdHl1dGlscycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICB2YXIgbWFwID0ge307XG4gIHZhciBjb2cgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICB2YXIgZ3Jhdml0eUFtb3VudCA9IDAuMDU7XG5cbiAgZnVuY3Rpb24gb25BdHRhY2gob2JqZWN0LCBjb21wb25lbnQpIHtcbiAgICBpZihjb21wb25lbnQudHlwZSA9PT0gJ3JpZ2lkQm9keScpIHtcbiAgICAgIG1hcFtjb21wb25lbnQuX2lkXSA9IGNvbXBvbmVudDtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gb25EZXR0YWNoKG9iamVjdCwgY29tcG9uZW50KSB7XG4gICAgaWYoY29tcG9uZW50LnR5cGUgPT09ICdyaWdpZEJvZHknKSB7XG4gICAgICBkZWxldGUgbWFwW2NvbXBvbmVudC5faWRdO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiB0aWNrKCkge1xuICAgIHZhciBib2RpZXMgPSBbXTtcbiAgICB2YXIgZml4dHVyZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpZCBpbiBtYXApIHtcbiAgICAgIHZhciBib2R5ID0gbWFwW2lkXTtcbiAgICAgIGlmIChib2R5LmlzRml4dHVyZSkge1xuICAgICAgICBmaXh0dXJlcy5wdXNoKGJvZHkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYm9kaWVzLnB1c2goYm9keSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBib2RpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciByaWdpZEJvZHkgPSBib2RpZXNbaV07XG5cbiAgICAgIC8vIEFwcGx5IGdyYXZpdHlcbiAgICAgIHZhciBncmF2aXR5ID0gZ3Jhdml0eVV0aWxzLmdldEdyYXZpdHkocmlnaWRCb2R5Lm9iamVjdC5wb3NpdGlvbik7XG4gICAgICByaWdpZEJvZHkuZ3Jhdml0eSA9IGdyYXZpdHk7XG5cbiAgICAgIGlmIChyaWdpZEJvZHkuZ3JvdW5kZWQpIHtcbiAgICAgICAgdmFyIGdyYXZpdHlGb3JjZSA9IGdyYXZpdHkuZGlyLmNsb25lKCkuc2V0TGVuZ3RoKGdyYXZpdHlBbW91bnQpO1xuICAgICAgICByaWdpZEJvZHkuYXBwbHlGb3JjZShncmF2aXR5Rm9yY2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGdyYXZpdHlGb3JjZSA9IGdyYXZpdHkuZm9yY2VEaXIuY2xvbmUoKS5zZXRMZW5ndGgoZ3Jhdml0eUFtb3VudCk7XG4gICAgICAgIHJpZ2lkQm9keS5hcHBseUZvcmNlKGdyYXZpdHlGb3JjZSk7XG4gICAgICB9XG5cblxuICAgICAgLy8gQXBwbHkgYWNjZWxlcmF0aW9uIHRvIHZlbG9jaXR5XG4gICAgICByaWdpZEJvZHkudmVsb2NpdHkuYWRkKHJpZ2lkQm9keS5hY2NlbGVyYXRpb24pO1xuICAgICAgcmlnaWRCb2R5LnZlbG9jaXR5Lm11bHRpcGx5U2NhbGFyKHJpZ2lkQm9keS5mcmljdGlvbik7XG5cbiAgICAgIHJpZ2lkQm9keS5ncm91bmRlZCA9IGZhbHNlO1xuXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGZpeHR1cmVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIHZhciBmaXh0dXJlID0gZml4dHVyZXNbal07XG5cbiAgICAgICAgdmFyIHZlbG9jaXRpZXMgPSB7XG4gICAgICAgICAgJ3gnOiBuZXcgVEhSRUUuVmVjdG9yMyhyaWdpZEJvZHkudmVsb2NpdHkueCwgMCwgMCksXG4gICAgICAgICAgJ3knOiBuZXcgVEhSRUUuVmVjdG9yMygwLCByaWdpZEJvZHkudmVsb2NpdHkueSwgMCksXG4gICAgICAgICAgJ3onOiBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCByaWdpZEJvZHkudmVsb2NpdHkueilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwb3NpdGlvbiA9IHJpZ2lkQm9keS5vYmplY3QucG9zaXRpb24uY2xvbmUoKTtcbiAgICAgICAgZm9yICh2YXIgYXhpcyBpbiB2ZWxvY2l0aWVzKSB7XG4gICAgICAgICAgdmFyIHYgPSB2ZWxvY2l0aWVzW2F4aXNdO1xuICAgICAgICAgIHZhciByYXljYXN0ZXIgPSBuZXcgVEhSRUUuUmF5Y2FzdGVyKFxuICAgICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgICB2LmNsb25lKCkubm9ybWFsaXplKCksXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgdi5sZW5ndGgoKSArIDAuNVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICB2YXIgaW50ZXJzZWN0cyA9IHJheWNhc3Rlci5pbnRlcnNlY3RPYmplY3QoZml4dHVyZS5vYmplY3QsIHRydWUpO1xuICAgICAgICAgIGlmIChpbnRlcnNlY3RzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHZhciBpbnRlcnNlY3QgPSBpbnRlcnNlY3RzWzBdO1xuICAgICAgICAgICAgdmFyIG1hZyA9IGludGVyc2VjdC5kaXN0YW5jZSAtIDAuNTtcbiAgICAgICAgICAgIHJpZ2lkQm9keS52ZWxvY2l0eVtheGlzXSA9IHJpZ2lkQm9keS52ZWxvY2l0eVtheGlzXSA+IDAgPyBtYWcgOiAtbWFnO1xuICAgICAgICAgICAgaWYgKGF4aXMgPT09IGdyYXZpdHkuYXhpcykge1xuICAgICAgICAgICAgICByaWdpZEJvZHkuZ3JvdW5kZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHBvc2l0aW9uLmFkZCh2KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBBcHBseSB2ZWxvY2l0eVxuICAgICAgcmlnaWRCb2R5Lm9iamVjdC5wb3NpdGlvbi5hZGQocmlnaWRCb2R5LnZlbG9jaXR5KTtcblxuICAgICAgLy8gQ2xlYXIgYWNjZWxlcmF0aW9uXG4gICAgICByaWdpZEJvZHkuYWNjZWxlcmF0aW9uLnNldCgwLCAwLCAwKTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIHBoeXNpY3MgPSB7XG4gICAgb25BdHRhY2g6IG9uQXR0YWNoLFxuICAgIG9uRGV0dGFjaDogb25EZXR0YWNoLFxuICAgIHRpY2s6IHRpY2ssXG4gICAgYXBwOiBudWxsXG4gIH07XG5cbiAgcmV0dXJuIHBoeXNpY3M7XG59OyIsIi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxudmFyIGlzQXJyYXkgPSByZXF1aXJlKCdpcy1hcnJheScpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTIgLy8gbm90IHVzZWQgYnkgdGhpcyBpbXBsZW1lbnRhdGlvblxuXG52YXIgcm9vdFBhcmVudCA9IHt9XG5cbi8qKlxuICogSWYgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYDpcbiAqICAgPT09IHRydWUgICAgVXNlIFVpbnQ4QXJyYXkgaW1wbGVtZW50YXRpb24gKGZhc3Rlc3QpXG4gKiAgID09PSBmYWxzZSAgIFVzZSBPYmplY3QgaW1wbGVtZW50YXRpb24gKG1vc3QgY29tcGF0aWJsZSwgZXZlbiBJRTYpXG4gKlxuICogQnJvd3NlcnMgdGhhdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBhcmUgSUUgMTArLCBGaXJlZm94IDQrLCBDaHJvbWUgNyssIFNhZmFyaSA1LjErLFxuICogT3BlcmEgMTEuNissIGlPUyA0LjIrLlxuICpcbiAqIER1ZSB0byB2YXJpb3VzIGJyb3dzZXIgYnVncywgc29tZXRpbWVzIHRoZSBPYmplY3QgaW1wbGVtZW50YXRpb24gd2lsbCBiZSB1c2VkIGV2ZW5cbiAqIHdoZW4gdGhlIGJyb3dzZXIgc3VwcG9ydHMgdHlwZWQgYXJyYXlzLlxuICpcbiAqIE5vdGU6XG4gKlxuICogICAtIEZpcmVmb3ggNC0yOSBsYWNrcyBzdXBwb3J0IGZvciBhZGRpbmcgbmV3IHByb3BlcnRpZXMgdG8gYFVpbnQ4QXJyYXlgIGluc3RhbmNlcyxcbiAqICAgICBTZWU6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NTQzOC5cbiAqXG4gKiAgIC0gU2FmYXJpIDUtNyBsYWNrcyBzdXBwb3J0IGZvciBjaGFuZ2luZyB0aGUgYE9iamVjdC5wcm90b3R5cGUuY29uc3RydWN0b3JgIHByb3BlcnR5XG4gKiAgICAgb24gb2JqZWN0cy5cbiAqXG4gKiAgIC0gQ2hyb21lIDktMTAgaXMgbWlzc2luZyB0aGUgYFR5cGVkQXJyYXkucHJvdG90eXBlLnN1YmFycmF5YCBmdW5jdGlvbi5cbiAqXG4gKiAgIC0gSUUxMCBoYXMgYSBicm9rZW4gYFR5cGVkQXJyYXkucHJvdG90eXBlLnN1YmFycmF5YCBmdW5jdGlvbiB3aGljaCByZXR1cm5zIGFycmF5cyBvZlxuICogICAgIGluY29ycmVjdCBsZW5ndGggaW4gc29tZSBzaXR1YXRpb25zLlxuXG4gKiBXZSBkZXRlY3QgdGhlc2UgYnVnZ3kgYnJvd3NlcnMgYW5kIHNldCBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgIHRvIGBmYWxzZWAgc28gdGhleVxuICogZ2V0IHRoZSBPYmplY3QgaW1wbGVtZW50YXRpb24sIHdoaWNoIGlzIHNsb3dlciBidXQgYmVoYXZlcyBjb3JyZWN0bHkuXG4gKi9cbkJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUID0gKGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gQmFyICgpIHt9XG4gIHRyeSB7XG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KDEpXG4gICAgYXJyLmZvbyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH1cbiAgICBhcnIuY29uc3RydWN0b3IgPSBCYXJcbiAgICByZXR1cm4gYXJyLmZvbygpID09PSA0MiAmJiAvLyB0eXBlZCBhcnJheSBpbnN0YW5jZXMgY2FuIGJlIGF1Z21lbnRlZFxuICAgICAgICBhcnIuY29uc3RydWN0b3IgPT09IEJhciAmJiAvLyBjb25zdHJ1Y3RvciBjYW4gYmUgc2V0XG4gICAgICAgIHR5cGVvZiBhcnIuc3ViYXJyYXkgPT09ICdmdW5jdGlvbicgJiYgLy8gY2hyb21lIDktMTAgbGFjayBgc3ViYXJyYXlgXG4gICAgICAgIGFyci5zdWJhcnJheSgxLCAxKS5ieXRlTGVuZ3RoID09PSAwIC8vIGllMTAgaGFzIGJyb2tlbiBgc3ViYXJyYXlgXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufSkoKVxuXG5mdW5jdGlvbiBrTWF4TGVuZ3RoICgpIHtcbiAgcmV0dXJuIEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUXG4gICAgPyAweDdmZmZmZmZmXG4gICAgOiAweDNmZmZmZmZmXG59XG5cbi8qKlxuICogQ2xhc3M6IEJ1ZmZlclxuICogPT09PT09PT09PT09PVxuICpcbiAqIFRoZSBCdWZmZXIgY29uc3RydWN0b3IgcmV0dXJucyBpbnN0YW5jZXMgb2YgYFVpbnQ4QXJyYXlgIHRoYXQgYXJlIGF1Z21lbnRlZFxuICogd2l0aCBmdW5jdGlvbiBwcm9wZXJ0aWVzIGZvciBhbGwgdGhlIG5vZGUgYEJ1ZmZlcmAgQVBJIGZ1bmN0aW9ucy4gV2UgdXNlXG4gKiBgVWludDhBcnJheWAgc28gdGhhdCBzcXVhcmUgYnJhY2tldCBub3RhdGlvbiB3b3JrcyBhcyBleHBlY3RlZCAtLSBpdCByZXR1cm5zXG4gKiBhIHNpbmdsZSBvY3RldC5cbiAqXG4gKiBCeSBhdWdtZW50aW5nIHRoZSBpbnN0YW5jZXMsIHdlIGNhbiBhdm9pZCBtb2RpZnlpbmcgdGhlIGBVaW50OEFycmF5YFxuICogcHJvdG90eXBlLlxuICovXG5mdW5jdGlvbiBCdWZmZXIgKGFyZykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQnVmZmVyKSkge1xuICAgIC8vIEF2b2lkIGdvaW5nIHRocm91Z2ggYW4gQXJndW1lbnRzQWRhcHRvclRyYW1wb2xpbmUgaW4gdGhlIGNvbW1vbiBjYXNlLlxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkgcmV0dXJuIG5ldyBCdWZmZXIoYXJnLCBhcmd1bWVudHNbMV0pXG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoYXJnKVxuICB9XG5cbiAgdGhpcy5sZW5ndGggPSAwXG4gIHRoaXMucGFyZW50ID0gdW5kZWZpbmVkXG5cbiAgLy8gQ29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykge1xuICAgIHJldHVybiBmcm9tTnVtYmVyKHRoaXMsIGFyZylcbiAgfVxuXG4gIC8vIFNsaWdodGx5IGxlc3MgY29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBmcm9tU3RyaW5nKHRoaXMsIGFyZywgYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiAndXRmOCcpXG4gIH1cblxuICAvLyBVbnVzdWFsLlxuICByZXR1cm4gZnJvbU9iamVjdCh0aGlzLCBhcmcpXG59XG5cbmZ1bmN0aW9uIGZyb21OdW1iZXIgKHRoYXQsIGxlbmd0aCkge1xuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoIDwgMCA/IDAgOiBjaGVja2VkKGxlbmd0aCkgfCAwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdGhhdFtpXSA9IDBcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbVN0cmluZyAodGhhdCwgc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJyB8fCBlbmNvZGluZyA9PT0gJycpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgLy8gQXNzdW1wdGlvbjogYnl0ZUxlbmd0aCgpIHJldHVybiB2YWx1ZSBpcyBhbHdheXMgPCBrTWF4TGVuZ3RoLlxuICB2YXIgbGVuZ3RoID0gYnl0ZUxlbmd0aChzdHJpbmcsIGVuY29kaW5nKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcblxuICB0aGF0LndyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21PYmplY3QgKHRoYXQsIG9iamVjdCkge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKG9iamVjdCkpIHJldHVybiBmcm9tQnVmZmVyKHRoYXQsIG9iamVjdClcblxuICBpZiAoaXNBcnJheShvYmplY3QpKSByZXR1cm4gZnJvbUFycmF5KHRoYXQsIG9iamVjdClcblxuICBpZiAob2JqZWN0ID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdtdXN0IHN0YXJ0IHdpdGggbnVtYmVyLCBidWZmZXIsIGFycmF5IG9yIHN0cmluZycpXG4gIH1cblxuICBpZiAodHlwZW9mIEFycmF5QnVmZmVyICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmIChvYmplY3QuYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgIHJldHVybiBmcm9tVHlwZWRBcnJheSh0aGF0LCBvYmplY3QpXG4gICAgfVxuICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgcmV0dXJuIGZyb21BcnJheUJ1ZmZlcih0aGF0LCBvYmplY3QpXG4gICAgfVxuICB9XG5cbiAgaWYgKG9iamVjdC5sZW5ndGgpIHJldHVybiBmcm9tQXJyYXlMaWtlKHRoYXQsIG9iamVjdClcblxuICByZXR1cm4gZnJvbUpzb25PYmplY3QodGhhdCwgb2JqZWN0KVxufVxuXG5mdW5jdGlvbiBmcm9tQnVmZmVyICh0aGF0LCBidWZmZXIpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYnVmZmVyLmxlbmd0aCkgfCAwXG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG4gIGJ1ZmZlci5jb3B5KHRoYXQsIDAsIDAsIGxlbmd0aClcbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5ICh0aGF0LCBhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuLy8gRHVwbGljYXRlIG9mIGZyb21BcnJheSgpIHRvIGtlZXAgZnJvbUFycmF5KCkgbW9ub21vcnBoaWMuXG5mdW5jdGlvbiBmcm9tVHlwZWRBcnJheSAodGhhdCwgYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcbiAgLy8gVHJ1bmNhdGluZyB0aGUgZWxlbWVudHMgaXMgcHJvYmFibHkgbm90IHdoYXQgcGVvcGxlIGV4cGVjdCBmcm9tIHR5cGVkXG4gIC8vIGFycmF5cyB3aXRoIEJZVEVTX1BFUl9FTEVNRU5UID4gMSBidXQgaXQncyBjb21wYXRpYmxlIHdpdGggdGhlIGJlaGF2aW9yXG4gIC8vIG9mIHRoZSBvbGQgQnVmZmVyIGNvbnN0cnVjdG9yLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5QnVmZmVyICh0aGF0LCBhcnJheSkge1xuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSwgZm9yIGJlc3QgcGVyZm9ybWFuY2VcbiAgICBhcnJheS5ieXRlTGVuZ3RoXG4gICAgdGhhdCA9IEJ1ZmZlci5fYXVnbWVudChuZXcgVWludDhBcnJheShhcnJheSkpXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBhbiBvYmplY3QgaW5zdGFuY2Ugb2YgdGhlIEJ1ZmZlciBjbGFzc1xuICAgIHRoYXQgPSBmcm9tVHlwZWRBcnJheSh0aGF0LCBuZXcgVWludDhBcnJheShhcnJheSkpXG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5TGlrZSAodGhhdCwgYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIHRoYXRbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbi8vIERlc2VyaWFsaXplIHsgdHlwZTogJ0J1ZmZlcicsIGRhdGE6IFsxLDIsMywuLi5dIH0gaW50byBhIEJ1ZmZlciBvYmplY3QuXG4vLyBSZXR1cm5zIGEgemVyby1sZW5ndGggYnVmZmVyIGZvciBpbnB1dHMgdGhhdCBkb24ndCBjb25mb3JtIHRvIHRoZSBzcGVjLlxuZnVuY3Rpb24gZnJvbUpzb25PYmplY3QgKHRoYXQsIG9iamVjdCkge1xuICB2YXIgYXJyYXlcbiAgdmFyIGxlbmd0aCA9IDBcblxuICBpZiAob2JqZWN0LnR5cGUgPT09ICdCdWZmZXInICYmIGlzQXJyYXkob2JqZWN0LmRhdGEpKSB7XG4gICAgYXJyYXkgPSBvYmplY3QuZGF0YVxuICAgIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgfVxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICB0aGF0W2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBhbGxvY2F0ZSAodGhhdCwgbGVuZ3RoKSB7XG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlLCBmb3IgYmVzdCBwZXJmb3JtYW5jZVxuICAgIHRoYXQgPSBCdWZmZXIuX2F1Z21lbnQobmV3IFVpbnQ4QXJyYXkobGVuZ3RoKSlcbiAgfSBlbHNlIHtcbiAgICAvLyBGYWxsYmFjazogUmV0dXJuIGFuIG9iamVjdCBpbnN0YW5jZSBvZiB0aGUgQnVmZmVyIGNsYXNzXG4gICAgdGhhdC5sZW5ndGggPSBsZW5ndGhcbiAgICB0aGF0Ll9pc0J1ZmZlciA9IHRydWVcbiAgfVxuXG4gIHZhciBmcm9tUG9vbCA9IGxlbmd0aCAhPT0gMCAmJiBsZW5ndGggPD0gQnVmZmVyLnBvb2xTaXplID4+PiAxXG4gIGlmIChmcm9tUG9vbCkgdGhhdC5wYXJlbnQgPSByb290UGFyZW50XG5cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gY2hlY2tlZCAobGVuZ3RoKSB7XG4gIC8vIE5vdGU6IGNhbm5vdCB1c2UgYGxlbmd0aCA8IGtNYXhMZW5ndGhgIGhlcmUgYmVjYXVzZSB0aGF0IGZhaWxzIHdoZW5cbiAgLy8gbGVuZ3RoIGlzIE5hTiAod2hpY2ggaXMgb3RoZXJ3aXNlIGNvZXJjZWQgdG8gemVyby4pXG4gIGlmIChsZW5ndGggPj0ga01heExlbmd0aCgpKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gYWxsb2NhdGUgQnVmZmVyIGxhcmdlciB0aGFuIG1heGltdW0gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ3NpemU6IDB4JyArIGtNYXhMZW5ndGgoKS50b1N0cmluZygxNikgKyAnIGJ5dGVzJylcbiAgfVxuICByZXR1cm4gbGVuZ3RoIHwgMFxufVxuXG5mdW5jdGlvbiBTbG93QnVmZmVyIChzdWJqZWN0LCBlbmNvZGluZykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgU2xvd0J1ZmZlcikpIHJldHVybiBuZXcgU2xvd0J1ZmZlcihzdWJqZWN0LCBlbmNvZGluZylcblxuICB2YXIgYnVmID0gbmV3IEJ1ZmZlcihzdWJqZWN0LCBlbmNvZGluZylcbiAgZGVsZXRlIGJ1Zi5wYXJlbnRcbiAgcmV0dXJuIGJ1ZlxufVxuXG5CdWZmZXIuaXNCdWZmZXIgPSBmdW5jdGlvbiBpc0J1ZmZlciAoYikge1xuICByZXR1cm4gISEoYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyKVxufVxuXG5CdWZmZXIuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKGEsIGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYSkgfHwgIUJ1ZmZlci5pc0J1ZmZlcihiKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyBtdXN0IGJlIEJ1ZmZlcnMnKVxuICB9XG5cbiAgaWYgKGEgPT09IGIpIHJldHVybiAwXG5cbiAgdmFyIHggPSBhLmxlbmd0aFxuICB2YXIgeSA9IGIubGVuZ3RoXG5cbiAgdmFyIGkgPSAwXG4gIHZhciBsZW4gPSBNYXRoLm1pbih4LCB5KVxuICB3aGlsZSAoaSA8IGxlbikge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSBicmVha1xuXG4gICAgKytpXG4gIH1cblxuICBpZiAoaSAhPT0gbGVuKSB7XG4gICAgeCA9IGFbaV1cbiAgICB5ID0gYltpXVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG5CdWZmZXIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIGlzRW5jb2RpbmcgKGVuY29kaW5nKSB7XG4gIHN3aXRjaCAoU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICBjYXNlICdyYXcnOlxuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5CdWZmZXIuY29uY2F0ID0gZnVuY3Rpb24gY29uY2F0IChsaXN0LCBsZW5ndGgpIHtcbiAgaWYgKCFpc0FycmF5KGxpc3QpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdsaXN0IGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXkgb2YgQnVmZmVycy4nKVxuXG4gIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBuZXcgQnVmZmVyKDApXG4gIH1cblxuICB2YXIgaVxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBsZW5ndGggPSAwXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxlbmd0aCArPSBsaXN0W2ldLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIHZhciBidWYgPSBuZXcgQnVmZmVyKGxlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaXRlbSA9IGxpc3RbaV1cbiAgICBpdGVtLmNvcHkoYnVmLCBwb3MpXG4gICAgcG9zICs9IGl0ZW0ubGVuZ3RoXG4gIH1cbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2Ygc3RyaW5nICE9PSAnc3RyaW5nJykgc3RyaW5nID0gJycgKyBzdHJpbmdcblxuICB2YXIgbGVuID0gc3RyaW5nLmxlbmd0aFxuICBpZiAobGVuID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIFVzZSBhIGZvciBsb29wIHRvIGF2b2lkIHJlY3Vyc2lvblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgIC8vIERlcHJlY2F0ZWRcbiAgICAgIGNhc2UgJ3Jhdyc6XG4gICAgICBjYXNlICdyYXdzJzpcbiAgICAgICAgcmV0dXJuIGxlblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIGxlbiAqIDJcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBsZW4gPj4+IDFcbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHJldHVybiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aCAvLyBhc3N1bWUgdXRmOFxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuQnVmZmVyLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5cbi8vIHByZS1zZXQgZm9yIHZhbHVlcyB0aGF0IG1heSBleGlzdCBpbiB0aGUgZnV0dXJlXG5CdWZmZXIucHJvdG90eXBlLmxlbmd0aCA9IHVuZGVmaW5lZFxuQnVmZmVyLnByb3RvdHlwZS5wYXJlbnQgPSB1bmRlZmluZWRcblxuZnVuY3Rpb24gc2xvd1RvU3RyaW5nIChlbmNvZGluZywgc3RhcnQsIGVuZCkge1xuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuXG4gIHN0YXJ0ID0gc3RhcnQgfCAwXG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkIHx8IGVuZCA9PT0gSW5maW5pdHkgPyB0aGlzLmxlbmd0aCA6IGVuZCB8IDBcblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAoZW5kIDw9IHN0YXJ0KSByZXR1cm4gJydcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBiaW5hcnlTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHV0ZjE2bGVTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoZW5jb2RpbmcgKyAnJykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoIHwgMFxuICBpZiAobGVuZ3RoID09PSAwKSByZXR1cm4gJydcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiB1dGY4U2xpY2UodGhpcywgMCwgbGVuZ3RoKVxuICByZXR1cm4gc2xvd1RvU3RyaW5nLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiBlcXVhbHMgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIHRydWVcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpID09PSAwXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uIGluc3BlY3QgKCkge1xuICB2YXIgc3RyID0gJydcbiAgdmFyIG1heCA9IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVNcbiAgaWYgKHRoaXMubGVuZ3RoID4gMCkge1xuICAgIHN0ciA9IHRoaXMudG9TdHJpbmcoJ2hleCcsIDAsIG1heCkubWF0Y2goLy57Mn0vZykuam9pbignICcpXG4gICAgaWYgKHRoaXMubGVuZ3RoID4gbWF4KSBzdHIgKz0gJyAuLi4gJ1xuICB9XG4gIHJldHVybiAnPEJ1ZmZlciAnICsgc3RyICsgJz4nXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIDBcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIGluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCkge1xuICBpZiAoYnl0ZU9mZnNldCA+IDB4N2ZmZmZmZmYpIGJ5dGVPZmZzZXQgPSAweDdmZmZmZmZmXG4gIGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAtMHg4MDAwMDAwMCkgYnl0ZU9mZnNldCA9IC0weDgwMDAwMDAwXG4gIGJ5dGVPZmZzZXQgPj49IDBcblxuICBpZiAodGhpcy5sZW5ndGggPT09IDApIHJldHVybiAtMVxuICBpZiAoYnl0ZU9mZnNldCA+PSB0aGlzLmxlbmd0aCkgcmV0dXJuIC0xXG5cbiAgLy8gTmVnYXRpdmUgb2Zmc2V0cyBzdGFydCBmcm9tIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlclxuICBpZiAoYnl0ZU9mZnNldCA8IDApIGJ5dGVPZmZzZXQgPSBNYXRoLm1heCh0aGlzLmxlbmd0aCArIGJ5dGVPZmZzZXQsIDApXG5cbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgaWYgKHZhbC5sZW5ndGggPT09IDApIHJldHVybiAtMSAvLyBzcGVjaWFsIGNhc2U6IGxvb2tpbmcgZm9yIGVtcHR5IHN0cmluZyBhbHdheXMgZmFpbHNcbiAgICByZXR1cm4gU3RyaW5nLnByb3RvdHlwZS5pbmRleE9mLmNhbGwodGhpcywgdmFsLCBieXRlT2Zmc2V0KVxuICB9XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsKSkge1xuICAgIHJldHVybiBhcnJheUluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0KVxuICB9XG4gIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCAmJiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKHRoaXMsIHZhbCwgYnl0ZU9mZnNldClcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZih0aGlzLCBbIHZhbCBdLCBieXRlT2Zmc2V0KVxuICB9XG5cbiAgZnVuY3Rpb24gYXJyYXlJbmRleE9mIChhcnIsIHZhbCwgYnl0ZU9mZnNldCkge1xuICAgIHZhciBmb3VuZEluZGV4ID0gLTFcbiAgICBmb3IgKHZhciBpID0gMDsgYnl0ZU9mZnNldCArIGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhcnJbYnl0ZU9mZnNldCArIGldID09PSB2YWxbZm91bmRJbmRleCA9PT0gLTEgPyAwIDogaSAtIGZvdW5kSW5kZXhdKSB7XG4gICAgICAgIGlmIChmb3VuZEluZGV4ID09PSAtMSkgZm91bmRJbmRleCA9IGlcbiAgICAgICAgaWYgKGkgLSBmb3VuZEluZGV4ICsgMSA9PT0gdmFsLmxlbmd0aCkgcmV0dXJuIGJ5dGVPZmZzZXQgKyBmb3VuZEluZGV4XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3VuZEluZGV4ID0gLTFcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xXG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKCd2YWwgbXVzdCBiZSBzdHJpbmcsIG51bWJlciBvciBCdWZmZXInKVxufVxuXG4vLyBgZ2V0YCBpcyBkZXByZWNhdGVkXG5CdWZmZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCAob2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuZ2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy5yZWFkVUludDgob2Zmc2V0KVxufVxuXG4vLyBgc2V0YCBpcyBkZXByZWNhdGVkXG5CdWZmZXIucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldCAodiwgb2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuc2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy53cml0ZVVJbnQ4KHYsIG9mZnNldClcbn1cblxuZnVuY3Rpb24gaGV4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSBidWYubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cblxuICAvLyBtdXN0IGJlIGFuIGV2ZW4gbnVtYmVyIG9mIGRpZ2l0c1xuICB2YXIgc3RyTGVuID0gc3RyaW5nLmxlbmd0aFxuICBpZiAoc3RyTGVuICUgMiAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGhleCBzdHJpbmcnKVxuXG4gIGlmIChsZW5ndGggPiBzdHJMZW4gLyAyKSB7XG4gICAgbGVuZ3RoID0gc3RyTGVuIC8gMlxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgcGFyc2VkID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGlmIChpc05hTihwYXJzZWQpKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaGV4IHN0cmluZycpXG4gICAgYnVmW29mZnNldCArIGldID0gcGFyc2VkXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gdXRmOFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiaW5hcnlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBhc2NpaVdyaXRlKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIHVjczJXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjE2bGVUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiB3cml0ZSAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZylcbiAgaWYgKG9mZnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBvZmZzZXRbLCBsZW5ndGhdWywgZW5jb2RpbmddKVxuICB9IGVsc2UgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gICAgaWYgKGlzRmluaXRlKGxlbmd0aCkpIHtcbiAgICAgIGxlbmd0aCA9IGxlbmd0aCB8IDBcbiAgICAgIGlmIChlbmNvZGluZyA9PT0gdW5kZWZpbmVkKSBlbmNvZGluZyA9ICd1dGY4J1xuICAgIH0gZWxzZSB7XG4gICAgICBlbmNvZGluZyA9IGxlbmd0aFxuICAgICAgbGVuZ3RoID0gdW5kZWZpbmVkXG4gICAgfVxuICAvLyBsZWdhY3kgd3JpdGUoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0LCBsZW5ndGgpIC0gcmVtb3ZlIGluIHYwLjEzXG4gIH0gZWxzZSB7XG4gICAgdmFyIHN3YXAgPSBlbmNvZGluZ1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgb2Zmc2V0ID0gbGVuZ3RoIHwgMFxuICAgIGxlbmd0aCA9IHN3YXBcbiAgfVxuXG4gIHZhciByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldFxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbGVuZ3RoID4gcmVtYWluaW5nKSBsZW5ndGggPSByZW1haW5pbmdcblxuICBpZiAoKHN0cmluZy5sZW5ndGggPiAwICYmIChsZW5ndGggPCAwIHx8IG9mZnNldCA8IDApKSB8fCBvZmZzZXQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdhdHRlbXB0IHRvIHdyaXRlIG91dHNpZGUgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gYmluYXJ5V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgLy8gV2FybmluZzogbWF4TGVuZ3RoIG5vdCB0YWtlbiBpbnRvIGFjY291bnQgaW4gYmFzZTY0V3JpdGVcbiAgICAgICAgcmV0dXJuIGJhc2U2NFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1Y3MyV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gdG9KU09OICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG5mdW5jdGlvbiBiYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gdXRmOFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuICB2YXIgcmVzID0gW11cblxuICB2YXIgaSA9IHN0YXJ0XG4gIHdoaWxlIChpIDwgZW5kKSB7XG4gICAgdmFyIGZpcnN0Qnl0ZSA9IGJ1ZltpXVxuICAgIHZhciBjb2RlUG9pbnQgPSBudWxsXG4gICAgdmFyIGJ5dGVzUGVyU2VxdWVuY2UgPSAoZmlyc3RCeXRlID4gMHhFRikgPyA0XG4gICAgICA6IChmaXJzdEJ5dGUgPiAweERGKSA/IDNcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4QkYpID8gMlxuICAgICAgOiAxXG5cbiAgICBpZiAoaSArIGJ5dGVzUGVyU2VxdWVuY2UgPD0gZW5kKSB7XG4gICAgICB2YXIgc2Vjb25kQnl0ZSwgdGhpcmRCeXRlLCBmb3VydGhCeXRlLCB0ZW1wQ29kZVBvaW50XG5cbiAgICAgIHN3aXRjaCAoYnl0ZXNQZXJTZXF1ZW5jZSkge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgaWYgKGZpcnN0Qnl0ZSA8IDB4ODApIHtcbiAgICAgICAgICAgIGNvZGVQb2ludCA9IGZpcnN0Qnl0ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweDFGKSA8PCAweDYgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0YpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHhDIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAodGhpcmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3RkYgJiYgKHRlbXBDb2RlUG9pbnQgPCAweEQ4MDAgfHwgdGVtcENvZGVQb2ludCA+IDB4REZGRikpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgZm91cnRoQnl0ZSA9IGJ1ZltpICsgM11cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKGZvdXJ0aEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4MTIgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4QyB8ICh0aGlyZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAoZm91cnRoQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4RkZGRiAmJiB0ZW1wQ29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29kZVBvaW50ID09PSBudWxsKSB7XG4gICAgICAvLyB3ZSBkaWQgbm90IGdlbmVyYXRlIGEgdmFsaWQgY29kZVBvaW50IHNvIGluc2VydCBhXG4gICAgICAvLyByZXBsYWNlbWVudCBjaGFyIChVK0ZGRkQpIGFuZCBhZHZhbmNlIG9ubHkgMSBieXRlXG4gICAgICBjb2RlUG9pbnQgPSAweEZGRkRcbiAgICAgIGJ5dGVzUGVyU2VxdWVuY2UgPSAxXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPiAweEZGRkYpIHtcbiAgICAgIC8vIGVuY29kZSB0byB1dGYxNiAoc3Vycm9nYXRlIHBhaXIgZGFuY2UpXG4gICAgICBjb2RlUG9pbnQgLT0gMHgxMDAwMFxuICAgICAgcmVzLnB1c2goY29kZVBvaW50ID4+PiAxMCAmIDB4M0ZGIHwgMHhEODAwKVxuICAgICAgY29kZVBvaW50ID0gMHhEQzAwIHwgY29kZVBvaW50ICYgMHgzRkZcbiAgICB9XG5cbiAgICByZXMucHVzaChjb2RlUG9pbnQpXG4gICAgaSArPSBieXRlc1BlclNlcXVlbmNlXG4gIH1cblxuICByZXR1cm4gZGVjb2RlQ29kZVBvaW50c0FycmF5KHJlcylcbn1cblxuLy8gQmFzZWQgb24gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjI3NDcyNzIvNjgwNzQyLCB0aGUgYnJvd3NlciB3aXRoXG4vLyB0aGUgbG93ZXN0IGxpbWl0IGlzIENocm9tZSwgd2l0aCAweDEwMDAwIGFyZ3MuXG4vLyBXZSBnbyAxIG1hZ25pdHVkZSBsZXNzLCBmb3Igc2FmZXR5XG52YXIgTUFYX0FSR1VNRU5UU19MRU5HVEggPSAweDEwMDBcblxuZnVuY3Rpb24gZGVjb2RlQ29kZVBvaW50c0FycmF5IChjb2RlUG9pbnRzKSB7XG4gIHZhciBsZW4gPSBjb2RlUG9pbnRzLmxlbmd0aFxuICBpZiAobGVuIDw9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjb2RlUG9pbnRzKSAvLyBhdm9pZCBleHRyYSBzbGljZSgpXG4gIH1cblxuICAvLyBEZWNvZGUgaW4gY2h1bmtzIHRvIGF2b2lkIFwiY2FsbCBzdGFjayBzaXplIGV4Y2VlZGVkXCIuXG4gIHZhciByZXMgPSAnJ1xuICB2YXIgaSA9IDBcbiAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShcbiAgICAgIFN0cmluZyxcbiAgICAgIGNvZGVQb2ludHMuc2xpY2UoaSwgaSArPSBNQVhfQVJHVU1FTlRTX0xFTkdUSClcbiAgICApXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSAmIDB4N0YpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBiaW5hcnlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBoZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBieXRlcyA9IGJ1Zi5zbGljZShzdGFydCwgZW5kKVxuICB2YXIgcmVzID0gJydcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgYnl0ZXNbaSArIDFdICogMjU2KVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uIHNsaWNlIChzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBzdGFydCA9IH5+c3RhcnRcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyBsZW4gOiB+fmVuZFxuXG4gIGlmIChzdGFydCA8IDApIHtcbiAgICBzdGFydCArPSBsZW5cbiAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgfSBlbHNlIGlmIChzdGFydCA+IGxlbikge1xuICAgIHN0YXJ0ID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgMCkge1xuICAgIGVuZCArPSBsZW5cbiAgICBpZiAoZW5kIDwgMCkgZW5kID0gMFxuICB9IGVsc2UgaWYgKGVuZCA+IGxlbikge1xuICAgIGVuZCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIHZhciBuZXdCdWZcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgbmV3QnVmID0gQnVmZmVyLl9hdWdtZW50KHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZCkpXG4gIH0gZWxzZSB7XG4gICAgdmFyIHNsaWNlTGVuID0gZW5kIC0gc3RhcnRcbiAgICBuZXdCdWYgPSBuZXcgQnVmZmVyKHNsaWNlTGVuLCB1bmRlZmluZWQpXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzbGljZUxlbjsgaSsrKSB7XG4gICAgICBuZXdCdWZbaV0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH1cblxuICBpZiAobmV3QnVmLmxlbmd0aCkgbmV3QnVmLnBhcmVudCA9IHRoaXMucGFyZW50IHx8IHRoaXNcblxuICByZXR1cm4gbmV3QnVmXG59XG5cbi8qXG4gKiBOZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IGJ1ZmZlciBpc24ndCB0cnlpbmcgdG8gd3JpdGUgb3V0IG9mIGJvdW5kcy5cbiAqL1xuZnVuY3Rpb24gY2hlY2tPZmZzZXQgKG9mZnNldCwgZXh0LCBsZW5ndGgpIHtcbiAgaWYgKChvZmZzZXQgJSAxKSAhPT0gMCB8fCBvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb2Zmc2V0IGlzIG5vdCB1aW50JylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RyeWluZyB0byBhY2Nlc3MgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50TEUgPSBmdW5jdGlvbiByZWFkVUludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50QkUgPSBmdW5jdGlvbiByZWFkVUludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuICB9XG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXVxuICB2YXIgbXVsID0gMVxuICB3aGlsZSAoYnl0ZUxlbmd0aCA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQ4ID0gZnVuY3Rpb24gcmVhZFVJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbiByZWFkVUludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkJFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDgpIHwgdGhpc1tvZmZzZXQgKyAxXVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAoKHRoaXNbb2Zmc2V0XSkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpKSArXG4gICAgICAodGhpc1tvZmZzZXQgKyAzXSAqIDB4MTAwMDAwMClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyQkUgPSBmdW5jdGlvbiByZWFkVUludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSAqIDB4MTAwMDAwMCkgK1xuICAgICgodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICB0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRMRSA9IGZ1bmN0aW9uIHJlYWRJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRCRSA9IGZ1bmN0aW9uIHJlYWRJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aFxuICB2YXIgbXVsID0gMVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWldXG4gIHdoaWxlIChpID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0taV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQ4ID0gZnVuY3Rpb24gcmVhZEludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgaWYgKCEodGhpc1tvZmZzZXRdICYgMHg4MCkpIHJldHVybiAodGhpc1tvZmZzZXRdKVxuICByZXR1cm4gKCgweGZmIC0gdGhpc1tvZmZzZXRdICsgMSkgKiAtMSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiByZWFkSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAxXSB8ICh0aGlzW29mZnNldF0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gcmVhZEludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDNdIDw8IDI0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkJFID0gZnVuY3Rpb24gcmVhZEludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCAyNCkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gcmVhZEZsb2F0TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gcmVhZEZsb2F0QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlTEUgPSBmdW5jdGlvbiByZWFkRG91YmxlTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDUyLCA4KVxufVxuXG5mdW5jdGlvbiBjaGVja0ludCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2J1ZmZlciBtdXN0IGJlIGEgQnVmZmVyIGluc3RhbmNlJylcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndmFsdWUgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlVUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCksIDApXG5cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlVUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCksIDApXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVVSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweGZmLCAwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB2YWx1ZSA9IE1hdGguZmxvb3IodmFsdWUpXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbmZ1bmN0aW9uIG9iamVjdFdyaXRlVUludDE2IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbikge1xuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZiArIHZhbHVlICsgMVxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGJ1Zi5sZW5ndGggLSBvZmZzZXQsIDIpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID0gKHZhbHVlICYgKDB4ZmYgPDwgKDggKiAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSkpKSA+Pj5cbiAgICAgIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpICogOFxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSB2YWx1ZVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbmZ1bmN0aW9uIG9iamVjdFdyaXRlVUludDMyIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbikge1xuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihidWYubGVuZ3RoIC0gb2Zmc2V0LCA0KTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9ICh2YWx1ZSA+Pj4gKGxpdHRsZUVuZGlhbiA/IGkgOiAzIC0gaSkgKiA4KSAmIDB4ZmZcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSB2YWx1ZVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSAwXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSB2YWx1ZSA8IDAgPyAxIDogMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50QkUgPSBmdW5jdGlvbiB3cml0ZUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IHZhbHVlIDwgMCA/IDEgOiAwXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDggPSBmdW5jdGlvbiB3cml0ZUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHg3ZiwgLTB4ODApXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHZhbHVlID0gTWF0aC5mbG9vcih2YWx1ZSlcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmICsgdmFsdWUgKyAxXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9IHZhbHVlXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSB2YWx1ZVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbmZ1bmN0aW9uIGNoZWNrSUVFRTc1NCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICh2YWx1ZSA+IG1heCB8fCB2YWx1ZSA8IG1pbikgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3ZhbHVlIGlzIG91dCBvZiBib3VuZHMnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuZnVuY3Rpb24gd3JpdGVGbG9hdCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA0LCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA4LCAxLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCwgLTEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxuICByZXR1cm4gb2Zmc2V0ICsgOFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIGNvcHkgKHRhcmdldCwgdGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kICYmIGVuZCAhPT0gMCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldFN0YXJ0ID49IHRhcmdldC5sZW5ndGgpIHRhcmdldFN0YXJ0ID0gdGFyZ2V0Lmxlbmd0aFxuICBpZiAoIXRhcmdldFN0YXJ0KSB0YXJnZXRTdGFydCA9IDBcbiAgaWYgKGVuZCA+IDAgJiYgZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm4gMFxuICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBGYXRhbCBlcnJvciBjb25kaXRpb25zXG4gIGlmICh0YXJnZXRTdGFydCA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIH1cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZVN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBpZiAoZW5kIDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgPCBlbmQgLSBzdGFydCkge1xuICAgIGVuZCA9IHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCArIHN0YXJ0XG4gIH1cblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcbiAgdmFyIGlcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHN0YXJ0IDwgdGFyZ2V0U3RhcnQgJiYgdGFyZ2V0U3RhcnQgPCBlbmQpIHtcbiAgICAvLyBkZXNjZW5kaW5nIGNvcHkgZnJvbSBlbmRcbiAgICBmb3IgKGkgPSBsZW4gLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSBpZiAobGVuIDwgMTAwMCB8fCAhQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBhc2NlbmRpbmcgY29weSBmcm9tIHN0YXJ0XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0YXJnZXQuX3NldCh0aGlzLnN1YmFycmF5KHN0YXJ0LCBzdGFydCArIGxlbiksIHRhcmdldFN0YXJ0KVxuICB9XG5cbiAgcmV0dXJuIGxlblxufVxuXG4vLyBmaWxsKHZhbHVlLCBzdGFydD0wLCBlbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uIGZpbGwgKHZhbHVlLCBzdGFydCwgZW5kKSB7XG4gIGlmICghdmFsdWUpIHZhbHVlID0gMFxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQpIGVuZCA9IHRoaXMubGVuZ3RoXG5cbiAgaWYgKGVuZCA8IHN0YXJ0KSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignZW5kIDwgc3RhcnQnKVxuXG4gIC8vIEZpbGwgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuXG4gIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3N0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBpZiAoZW5kIDwgMCB8fCBlbmQgPiB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2VuZCBvdXQgb2YgYm91bmRzJylcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIHRoaXNbaV0gPSB2YWx1ZVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgYnl0ZXMgPSB1dGY4VG9CeXRlcyh2YWx1ZS50b1N0cmluZygpKVxuICAgIHZhciBsZW4gPSBieXRlcy5sZW5ndGhcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gYnl0ZXNbaSAlIGxlbl1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgYEFycmF5QnVmZmVyYCB3aXRoIHRoZSAqY29waWVkKiBtZW1vcnkgb2YgdGhlIGJ1ZmZlciBpbnN0YW5jZS5cbiAqIEFkZGVkIGluIE5vZGUgMC4xMi4gT25seSBhdmFpbGFibGUgaW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0IEFycmF5QnVmZmVyLlxuICovXG5CdWZmZXIucHJvdG90eXBlLnRvQXJyYXlCdWZmZXIgPSBmdW5jdGlvbiB0b0FycmF5QnVmZmVyICgpIHtcbiAgaWYgKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgICAgcmV0dXJuIChuZXcgQnVmZmVyKHRoaXMpKS5idWZmZXJcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGJ1ZiA9IG5ldyBVaW50OEFycmF5KHRoaXMubGVuZ3RoKVxuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGJ1Zi5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgICBidWZbaV0gPSB0aGlzW2ldXG4gICAgICB9XG4gICAgICByZXR1cm4gYnVmLmJ1ZmZlclxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdCdWZmZXIudG9BcnJheUJ1ZmZlciBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlcicpXG4gIH1cbn1cblxuLy8gSEVMUEVSIEZVTkNUSU9OU1xuLy8gPT09PT09PT09PT09PT09PVxuXG52YXIgQlAgPSBCdWZmZXIucHJvdG90eXBlXG5cbi8qKlxuICogQXVnbWVudCBhIFVpbnQ4QXJyYXkgKmluc3RhbmNlKiAobm90IHRoZSBVaW50OEFycmF5IGNsYXNzISkgd2l0aCBCdWZmZXIgbWV0aG9kc1xuICovXG5CdWZmZXIuX2F1Z21lbnQgPSBmdW5jdGlvbiBfYXVnbWVudCAoYXJyKSB7XG4gIGFyci5jb25zdHJ1Y3RvciA9IEJ1ZmZlclxuICBhcnIuX2lzQnVmZmVyID0gdHJ1ZVxuXG4gIC8vIHNhdmUgcmVmZXJlbmNlIHRvIG9yaWdpbmFsIFVpbnQ4QXJyYXkgc2V0IG1ldGhvZCBiZWZvcmUgb3ZlcndyaXRpbmdcbiAgYXJyLl9zZXQgPSBhcnIuc2V0XG5cbiAgLy8gZGVwcmVjYXRlZFxuICBhcnIuZ2V0ID0gQlAuZ2V0XG4gIGFyci5zZXQgPSBCUC5zZXRcblxuICBhcnIud3JpdGUgPSBCUC53cml0ZVxuICBhcnIudG9TdHJpbmcgPSBCUC50b1N0cmluZ1xuICBhcnIudG9Mb2NhbGVTdHJpbmcgPSBCUC50b1N0cmluZ1xuICBhcnIudG9KU09OID0gQlAudG9KU09OXG4gIGFyci5lcXVhbHMgPSBCUC5lcXVhbHNcbiAgYXJyLmNvbXBhcmUgPSBCUC5jb21wYXJlXG4gIGFyci5pbmRleE9mID0gQlAuaW5kZXhPZlxuICBhcnIuY29weSA9IEJQLmNvcHlcbiAgYXJyLnNsaWNlID0gQlAuc2xpY2VcbiAgYXJyLnJlYWRVSW50TEUgPSBCUC5yZWFkVUludExFXG4gIGFyci5yZWFkVUludEJFID0gQlAucmVhZFVJbnRCRVxuICBhcnIucmVhZFVJbnQ4ID0gQlAucmVhZFVJbnQ4XG4gIGFyci5yZWFkVUludDE2TEUgPSBCUC5yZWFkVUludDE2TEVcbiAgYXJyLnJlYWRVSW50MTZCRSA9IEJQLnJlYWRVSW50MTZCRVxuICBhcnIucmVhZFVJbnQzMkxFID0gQlAucmVhZFVJbnQzMkxFXG4gIGFyci5yZWFkVUludDMyQkUgPSBCUC5yZWFkVUludDMyQkVcbiAgYXJyLnJlYWRJbnRMRSA9IEJQLnJlYWRJbnRMRVxuICBhcnIucmVhZEludEJFID0gQlAucmVhZEludEJFXG4gIGFyci5yZWFkSW50OCA9IEJQLnJlYWRJbnQ4XG4gIGFyci5yZWFkSW50MTZMRSA9IEJQLnJlYWRJbnQxNkxFXG4gIGFyci5yZWFkSW50MTZCRSA9IEJQLnJlYWRJbnQxNkJFXG4gIGFyci5yZWFkSW50MzJMRSA9IEJQLnJlYWRJbnQzMkxFXG4gIGFyci5yZWFkSW50MzJCRSA9IEJQLnJlYWRJbnQzMkJFXG4gIGFyci5yZWFkRmxvYXRMRSA9IEJQLnJlYWRGbG9hdExFXG4gIGFyci5yZWFkRmxvYXRCRSA9IEJQLnJlYWRGbG9hdEJFXG4gIGFyci5yZWFkRG91YmxlTEUgPSBCUC5yZWFkRG91YmxlTEVcbiAgYXJyLnJlYWREb3VibGVCRSA9IEJQLnJlYWREb3VibGVCRVxuICBhcnIud3JpdGVVSW50OCA9IEJQLndyaXRlVUludDhcbiAgYXJyLndyaXRlVUludExFID0gQlAud3JpdGVVSW50TEVcbiAgYXJyLndyaXRlVUludEJFID0gQlAud3JpdGVVSW50QkVcbiAgYXJyLndyaXRlVUludDE2TEUgPSBCUC53cml0ZVVJbnQxNkxFXG4gIGFyci53cml0ZVVJbnQxNkJFID0gQlAud3JpdGVVSW50MTZCRVxuICBhcnIud3JpdGVVSW50MzJMRSA9IEJQLndyaXRlVUludDMyTEVcbiAgYXJyLndyaXRlVUludDMyQkUgPSBCUC53cml0ZVVJbnQzMkJFXG4gIGFyci53cml0ZUludExFID0gQlAud3JpdGVJbnRMRVxuICBhcnIud3JpdGVJbnRCRSA9IEJQLndyaXRlSW50QkVcbiAgYXJyLndyaXRlSW50OCA9IEJQLndyaXRlSW50OFxuICBhcnIud3JpdGVJbnQxNkxFID0gQlAud3JpdGVJbnQxNkxFXG4gIGFyci53cml0ZUludDE2QkUgPSBCUC53cml0ZUludDE2QkVcbiAgYXJyLndyaXRlSW50MzJMRSA9IEJQLndyaXRlSW50MzJMRVxuICBhcnIud3JpdGVJbnQzMkJFID0gQlAud3JpdGVJbnQzMkJFXG4gIGFyci53cml0ZUZsb2F0TEUgPSBCUC53cml0ZUZsb2F0TEVcbiAgYXJyLndyaXRlRmxvYXRCRSA9IEJQLndyaXRlRmxvYXRCRVxuICBhcnIud3JpdGVEb3VibGVMRSA9IEJQLndyaXRlRG91YmxlTEVcbiAgYXJyLndyaXRlRG91YmxlQkUgPSBCUC53cml0ZURvdWJsZUJFXG4gIGFyci5maWxsID0gQlAuZmlsbFxuICBhcnIuaW5zcGVjdCA9IEJQLmluc3BlY3RcbiAgYXJyLnRvQXJyYXlCdWZmZXIgPSBCUC50b0FycmF5QnVmZmVyXG5cbiAgcmV0dXJuIGFyclxufVxuXG52YXIgSU5WQUxJRF9CQVNFNjRfUkUgPSAvW14rXFwvMC05QS1aYS16LV9dL2dcblxuZnVuY3Rpb24gYmFzZTY0Y2xlYW4gKHN0cikge1xuICAvLyBOb2RlIHN0cmlwcyBvdXQgaW52YWxpZCBjaGFyYWN0ZXJzIGxpa2UgXFxuIGFuZCBcXHQgZnJvbSB0aGUgc3RyaW5nLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgc3RyID0gc3RyaW5ndHJpbShzdHIpLnJlcGxhY2UoSU5WQUxJRF9CQVNFNjRfUkUsICcnKVxuICAvLyBOb2RlIGNvbnZlcnRzIHN0cmluZ3Mgd2l0aCBsZW5ndGggPCAyIHRvICcnXG4gIGlmIChzdHIubGVuZ3RoIDwgMikgcmV0dXJuICcnXG4gIC8vIE5vZGUgYWxsb3dzIGZvciBub24tcGFkZGVkIGJhc2U2NCBzdHJpbmdzIChtaXNzaW5nIHRyYWlsaW5nID09PSksIGJhc2U2NC1qcyBkb2VzIG5vdFxuICB3aGlsZSAoc3RyLmxlbmd0aCAlIDQgIT09IDApIHtcbiAgICBzdHIgPSBzdHIgKyAnPSdcbiAgfVxuICByZXR1cm4gc3RyXG59XG5cbmZ1bmN0aW9uIHN0cmluZ3RyaW0gKHN0cikge1xuICBpZiAoc3RyLnRyaW0pIHJldHVybiBzdHIudHJpbSgpXG4gIHJldHVybiBzdHIucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpXG59XG5cbmZ1bmN0aW9uIHRvSGV4IChuKSB7XG4gIGlmIChuIDwgMTYpIHJldHVybiAnMCcgKyBuLnRvU3RyaW5nKDE2KVxuICByZXR1cm4gbi50b1N0cmluZygxNilcbn1cblxuZnVuY3Rpb24gdXRmOFRvQnl0ZXMgKHN0cmluZywgdW5pdHMpIHtcbiAgdW5pdHMgPSB1bml0cyB8fCBJbmZpbml0eVxuICB2YXIgY29kZVBvaW50XG4gIHZhciBsZW5ndGggPSBzdHJpbmcubGVuZ3RoXG4gIHZhciBsZWFkU3Vycm9nYXRlID0gbnVsbFxuICB2YXIgYnl0ZXMgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBjb2RlUG9pbnQgPSBzdHJpbmcuY2hhckNvZGVBdChpKVxuXG4gICAgLy8gaXMgc3Vycm9nYXRlIGNvbXBvbmVudFxuICAgIGlmIChjb2RlUG9pbnQgPiAweEQ3RkYgJiYgY29kZVBvaW50IDwgMHhFMDAwKSB7XG4gICAgICAvLyBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCFsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAgIC8vIG5vIGxlYWQgeWV0XG4gICAgICAgIGlmIChjb2RlUG9pbnQgPiAweERCRkYpIHtcbiAgICAgICAgICAvLyB1bmV4cGVjdGVkIHRyYWlsXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfSBlbHNlIGlmIChpICsgMSA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgLy8gdW5wYWlyZWQgbGVhZFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YWxpZCBsZWFkXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyAyIGxlYWRzIGluIGEgcm93XG4gICAgICBpZiAoY29kZVBvaW50IDwgMHhEQzAwKSB7XG4gICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIHZhbGlkIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICBjb2RlUG9pbnQgPSBsZWFkU3Vycm9nYXRlIC0gMHhEODAwIDw8IDEwIHwgY29kZVBvaW50IC0gMHhEQzAwIHwgMHgxMDAwMFxuICAgIH0gZWxzZSBpZiAobGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgLy8gdmFsaWQgYm1wIGNoYXIsIGJ1dCBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgfVxuXG4gICAgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcblxuICAgIC8vIGVuY29kZSB1dGY4XG4gICAgaWYgKGNvZGVQb2ludCA8IDB4ODApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMSkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChjb2RlUG9pbnQpXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDgwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2IHwgMHhDMCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyB8IDB4RTAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDQpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDEyIHwgMHhGMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb2RlIHBvaW50JylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnl0ZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0ciwgdW5pdHMpIHtcbiAgdmFyIGMsIGhpLCBsb1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcblxuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KGJhc2U2NGNsZWFuKHN0cikpXG59XG5cbmZ1bmN0aW9uIGJsaXRCdWZmZXIgKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKSBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG4iLCJ2YXIgbG9va3VwID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nO1xuXG47KGZ1bmN0aW9uIChleHBvcnRzKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuICB2YXIgQXJyID0gKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJylcbiAgICA/IFVpbnQ4QXJyYXlcbiAgICA6IEFycmF5XG5cblx0dmFyIFBMVVMgICA9ICcrJy5jaGFyQ29kZUF0KDApXG5cdHZhciBTTEFTSCAgPSAnLycuY2hhckNvZGVBdCgwKVxuXHR2YXIgTlVNQkVSID0gJzAnLmNoYXJDb2RlQXQoMClcblx0dmFyIExPV0VSICA9ICdhJy5jaGFyQ29kZUF0KDApXG5cdHZhciBVUFBFUiAgPSAnQScuY2hhckNvZGVBdCgwKVxuXHR2YXIgUExVU19VUkxfU0FGRSA9ICctJy5jaGFyQ29kZUF0KDApXG5cdHZhciBTTEFTSF9VUkxfU0FGRSA9ICdfJy5jaGFyQ29kZUF0KDApXG5cblx0ZnVuY3Rpb24gZGVjb2RlIChlbHQpIHtcblx0XHR2YXIgY29kZSA9IGVsdC5jaGFyQ29kZUF0KDApXG5cdFx0aWYgKGNvZGUgPT09IFBMVVMgfHxcblx0XHQgICAgY29kZSA9PT0gUExVU19VUkxfU0FGRSlcblx0XHRcdHJldHVybiA2MiAvLyAnKydcblx0XHRpZiAoY29kZSA9PT0gU0xBU0ggfHxcblx0XHQgICAgY29kZSA9PT0gU0xBU0hfVVJMX1NBRkUpXG5cdFx0XHRyZXR1cm4gNjMgLy8gJy8nXG5cdFx0aWYgKGNvZGUgPCBOVU1CRVIpXG5cdFx0XHRyZXR1cm4gLTEgLy9ubyBtYXRjaFxuXHRcdGlmIChjb2RlIDwgTlVNQkVSICsgMTApXG5cdFx0XHRyZXR1cm4gY29kZSAtIE5VTUJFUiArIDI2ICsgMjZcblx0XHRpZiAoY29kZSA8IFVQUEVSICsgMjYpXG5cdFx0XHRyZXR1cm4gY29kZSAtIFVQUEVSXG5cdFx0aWYgKGNvZGUgPCBMT1dFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBMT1dFUiArIDI2XG5cdH1cblxuXHRmdW5jdGlvbiBiNjRUb0J5dGVBcnJheSAoYjY0KSB7XG5cdFx0dmFyIGksIGosIGwsIHRtcCwgcGxhY2VIb2xkZXJzLCBhcnJcblxuXHRcdGlmIChiNjQubGVuZ3RoICUgNCA+IDApIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdHJpbmcuIExlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNCcpXG5cdFx0fVxuXG5cdFx0Ly8gdGhlIG51bWJlciBvZiBlcXVhbCBzaWducyAocGxhY2UgaG9sZGVycylcblx0XHQvLyBpZiB0aGVyZSBhcmUgdHdvIHBsYWNlaG9sZGVycywgdGhhbiB0aGUgdHdvIGNoYXJhY3RlcnMgYmVmb3JlIGl0XG5cdFx0Ly8gcmVwcmVzZW50IG9uZSBieXRlXG5cdFx0Ly8gaWYgdGhlcmUgaXMgb25seSBvbmUsIHRoZW4gdGhlIHRocmVlIGNoYXJhY3RlcnMgYmVmb3JlIGl0IHJlcHJlc2VudCAyIGJ5dGVzXG5cdFx0Ly8gdGhpcyBpcyBqdXN0IGEgY2hlYXAgaGFjayB0byBub3QgZG8gaW5kZXhPZiB0d2ljZVxuXHRcdHZhciBsZW4gPSBiNjQubGVuZ3RoXG5cdFx0cGxhY2VIb2xkZXJzID0gJz0nID09PSBiNjQuY2hhckF0KGxlbiAtIDIpID8gMiA6ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAxKSA/IDEgOiAwXG5cblx0XHQvLyBiYXNlNjQgaXMgNC8zICsgdXAgdG8gdHdvIGNoYXJhY3RlcnMgb2YgdGhlIG9yaWdpbmFsIGRhdGFcblx0XHRhcnIgPSBuZXcgQXJyKGI2NC5sZW5ndGggKiAzIC8gNCAtIHBsYWNlSG9sZGVycylcblxuXHRcdC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcblx0XHRsID0gcGxhY2VIb2xkZXJzID4gMCA/IGI2NC5sZW5ndGggLSA0IDogYjY0Lmxlbmd0aFxuXG5cdFx0dmFyIEwgPSAwXG5cblx0XHRmdW5jdGlvbiBwdXNoICh2KSB7XG5cdFx0XHRhcnJbTCsrXSA9IHZcblx0XHR9XG5cblx0XHRmb3IgKGkgPSAwLCBqID0gMDsgaSA8IGw7IGkgKz0gNCwgaiArPSAzKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDE4KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpIDw8IDEyKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpIDw8IDYpIHwgZGVjb2RlKGI2NC5jaGFyQXQoaSArIDMpKVxuXHRcdFx0cHVzaCgodG1wICYgMHhGRjAwMDApID4+IDE2KVxuXHRcdFx0cHVzaCgodG1wICYgMHhGRjAwKSA+PiA4KVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdGlmIChwbGFjZUhvbGRlcnMgPT09IDIpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA+PiA0KVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH0gZWxzZSBpZiAocGxhY2VIb2xkZXJzID09PSAxKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDEwKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpIDw8IDQpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPj4gMilcblx0XHRcdHB1c2goKHRtcCA+PiA4KSAmIDB4RkYpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGFyclxuXHR9XG5cblx0ZnVuY3Rpb24gdWludDhUb0Jhc2U2NCAodWludDgpIHtcblx0XHR2YXIgaSxcblx0XHRcdGV4dHJhQnl0ZXMgPSB1aW50OC5sZW5ndGggJSAzLCAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuXHRcdFx0b3V0cHV0ID0gXCJcIixcblx0XHRcdHRlbXAsIGxlbmd0aFxuXG5cdFx0ZnVuY3Rpb24gZW5jb2RlIChudW0pIHtcblx0XHRcdHJldHVybiBsb29rdXAuY2hhckF0KG51bSlcblx0XHR9XG5cblx0XHRmdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQgKG51bSkge1xuXHRcdFx0cmV0dXJuIGVuY29kZShudW0gPj4gMTggJiAweDNGKSArIGVuY29kZShudW0gPj4gMTIgJiAweDNGKSArIGVuY29kZShudW0gPj4gNiAmIDB4M0YpICsgZW5jb2RlKG51bSAmIDB4M0YpXG5cdFx0fVxuXG5cdFx0Ly8gZ28gdGhyb3VnaCB0aGUgYXJyYXkgZXZlcnkgdGhyZWUgYnl0ZXMsIHdlJ2xsIGRlYWwgd2l0aCB0cmFpbGluZyBzdHVmZiBsYXRlclxuXHRcdGZvciAoaSA9IDAsIGxlbmd0aCA9IHVpbnQ4Lmxlbmd0aCAtIGV4dHJhQnl0ZXM7IGkgPCBsZW5ndGg7IGkgKz0gMykge1xuXHRcdFx0dGVtcCA9ICh1aW50OFtpXSA8PCAxNikgKyAodWludDhbaSArIDFdIDw8IDgpICsgKHVpbnQ4W2kgKyAyXSlcblx0XHRcdG91dHB1dCArPSB0cmlwbGV0VG9CYXNlNjQodGVtcClcblx0XHR9XG5cblx0XHQvLyBwYWQgdGhlIGVuZCB3aXRoIHplcm9zLCBidXQgbWFrZSBzdXJlIHRvIG5vdCBmb3JnZXQgdGhlIGV4dHJhIGJ5dGVzXG5cdFx0c3dpdGNoIChleHRyYUJ5dGVzKSB7XG5cdFx0XHRjYXNlIDE6XG5cdFx0XHRcdHRlbXAgPSB1aW50OFt1aW50OC5sZW5ndGggLSAxXVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMilcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA8PCA0KSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSAnPT0nXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHRjYXNlIDI6XG5cdFx0XHRcdHRlbXAgPSAodWludDhbdWludDgubGVuZ3RoIC0gMl0gPDwgOCkgKyAodWludDhbdWludDgubGVuZ3RoIC0gMV0pXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUodGVtcCA+PiAxMClcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA+PiA0KSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgMikgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz0nXG5cdFx0XHRcdGJyZWFrXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG91dHB1dFxuXHR9XG5cblx0ZXhwb3J0cy50b0J5dGVBcnJheSA9IGI2NFRvQnl0ZUFycmF5XG5cdGV4cG9ydHMuZnJvbUJ5dGVBcnJheSA9IHVpbnQ4VG9CYXNlNjRcbn0odHlwZW9mIGV4cG9ydHMgPT09ICd1bmRlZmluZWQnID8gKHRoaXMuYmFzZTY0anMgPSB7fSkgOiBleHBvcnRzKSlcbiIsImV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uIChidWZmZXIsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtXG4gIHZhciBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgbkJpdHMgPSAtN1xuICB2YXIgaSA9IGlzTEUgPyAobkJ5dGVzIC0gMSkgOiAwXG4gIHZhciBkID0gaXNMRSA/IC0xIDogMVxuICB2YXIgcyA9IGJ1ZmZlcltvZmZzZXQgKyBpXVxuXG4gIGkgKz0gZFxuXG4gIGUgPSBzICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIHMgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IGVMZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgZSA9IGUgKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBtID0gZSAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBlID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBtTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IG0gPSBtICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgaWYgKGUgPT09IDApIHtcbiAgICBlID0gMSAtIGVCaWFzXG4gIH0gZWxzZSBpZiAoZSA9PT0gZU1heCkge1xuICAgIHJldHVybiBtID8gTmFOIDogKChzID8gLTEgOiAxKSAqIEluZmluaXR5KVxuICB9IGVsc2Uge1xuICAgIG0gPSBtICsgTWF0aC5wb3coMiwgbUxlbilcbiAgICBlID0gZSAtIGVCaWFzXG4gIH1cbiAgcmV0dXJuIChzID8gLTEgOiAxKSAqIG0gKiBNYXRoLnBvdygyLCBlIC0gbUxlbilcbn1cblxuZXhwb3J0cy53cml0ZSA9IGZ1bmN0aW9uIChidWZmZXIsIHZhbHVlLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSwgY1xuICB2YXIgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIHJ0ID0gKG1MZW4gPT09IDIzID8gTWF0aC5wb3coMiwgLTI0KSAtIE1hdGgucG93KDIsIC03NykgOiAwKVxuICB2YXIgaSA9IGlzTEUgPyAwIDogKG5CeXRlcyAtIDEpXG4gIHZhciBkID0gaXNMRSA/IDEgOiAtMVxuICB2YXIgcyA9IHZhbHVlIDwgMCB8fCAodmFsdWUgPT09IDAgJiYgMSAvIHZhbHVlIDwgMCkgPyAxIDogMFxuXG4gIHZhbHVlID0gTWF0aC5hYnModmFsdWUpXG5cbiAgaWYgKGlzTmFOKHZhbHVlKSB8fCB2YWx1ZSA9PT0gSW5maW5pdHkpIHtcbiAgICBtID0gaXNOYU4odmFsdWUpID8gMSA6IDBcbiAgICBlID0gZU1heFxuICB9IGVsc2Uge1xuICAgIGUgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4yKVxuICAgIGlmICh2YWx1ZSAqIChjID0gTWF0aC5wb3coMiwgLWUpKSA8IDEpIHtcbiAgICAgIGUtLVxuICAgICAgYyAqPSAyXG4gICAgfVxuICAgIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgdmFsdWUgKz0gcnQgLyBjXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlICs9IHJ0ICogTWF0aC5wb3coMiwgMSAtIGVCaWFzKVxuICAgIH1cbiAgICBpZiAodmFsdWUgKiBjID49IDIpIHtcbiAgICAgIGUrK1xuICAgICAgYyAvPSAyXG4gICAgfVxuXG4gICAgaWYgKGUgKyBlQmlhcyA+PSBlTWF4KSB7XG4gICAgICBtID0gMFxuICAgICAgZSA9IGVNYXhcbiAgICB9IGVsc2UgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICBtID0gKHZhbHVlICogYyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSBlICsgZUJpYXNcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHZhbHVlICogTWF0aC5wb3coMiwgZUJpYXMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gMFxuICAgIH1cbiAgfVxuXG4gIGZvciAoOyBtTGVuID49IDg7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IG0gJiAweGZmLCBpICs9IGQsIG0gLz0gMjU2LCBtTGVuIC09IDgpIHt9XG5cbiAgZSA9IChlIDw8IG1MZW4pIHwgbVxuICBlTGVuICs9IG1MZW5cbiAgZm9yICg7IGVMZW4gPiAwOyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBlICYgMHhmZiwgaSArPSBkLCBlIC89IDI1NiwgZUxlbiAtPSA4KSB7fVxuXG4gIGJ1ZmZlcltvZmZzZXQgKyBpIC0gZF0gfD0gcyAqIDEyOFxufVxuIiwiXG4vKipcbiAqIGlzQXJyYXlcbiAqL1xuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG5cbi8qKlxuICogdG9TdHJpbmdcbiAqL1xuXG52YXIgc3RyID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuLyoqXG4gKiBXaGV0aGVyIG9yIG5vdCB0aGUgZ2l2ZW4gYHZhbGBcbiAqIGlzIGFuIGFycmF5LlxuICpcbiAqIGV4YW1wbGU6XG4gKlxuICogICAgICAgIGlzQXJyYXkoW10pO1xuICogICAgICAgIC8vID4gdHJ1ZVxuICogICAgICAgIGlzQXJyYXkoYXJndW1lbnRzKTtcbiAqICAgICAgICAvLyA+IGZhbHNlXG4gKiAgICAgICAgaXNBcnJheSgnJyk7XG4gKiAgICAgICAgLy8gPiBmYWxzZVxuICpcbiAqIEBwYXJhbSB7bWl4ZWR9IHZhbFxuICogQHJldHVybiB7Ym9vbH1cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlzQXJyYXkgfHwgZnVuY3Rpb24gKHZhbCkge1xuICByZXR1cm4gISEgdmFsICYmICdbb2JqZWN0IEFycmF5XScgPT0gc3RyLmNhbGwodmFsKTtcbn07XG4iXX0=
