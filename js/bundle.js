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
  "'": 222
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

},{"../editor/editor":32}],16:[function(require,module,exports){
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
module.exports={
}
},{}],26:[function(require,module,exports){
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
},{}],27:[function(require,module,exports){
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
},{}],28:[function(require,module,exports){
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
},{"../../utils/arrayutils":57,"./blockcommand":27}],29:[function(require,module,exports){
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
},{"../../utils/arrayutils":57}],30:[function(require,module,exports){
var BlockCommand = require('./blockcommand');

module.exports = function(blocks, coords, value) {
  var command = new BlockCommand(blocks);
  command.setAtCoords(coords, value);

  return command;
};
},{"./blockcommand":27}],31:[function(require,module,exports){
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

},{}],32:[function(require,module,exports){
(function (global){
var THREE = (typeof window !== "undefined" ? window['THREE'] : typeof global !== "undefined" ? global['THREE'] : null);
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

  this.colorBar.highlight(0);
  this.prefabsBar.highlight(0);
  this.toolBar.highlight(0);
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
  } else if (this.input.keyDown('5')) {
    this.setTool(this.toolNames[4]);
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

  if (this.tool.start != null) {
    this.tool.start();
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

Editor.prototype.createNew = function(index) {
  index = index || this.prefabs.length;

  this.blocks.clear();
  var prefab = this.blocks.serialize();
  this.prefabs.splice(index, 0, prefab);
  this.updateScreenshotAtIndex(index);
  this.prefabIndex = index;
  this.prefabsBar.highlight(index);
  this.updatePropertyPanel();
  this.updateLastBlocks();
};

Editor.prototype.removeSelected = function() {
  this.prefabs.splice(this.prefabIndex, 1);

  if (this.prefabs.length === 0) {
    this.blocks.clear();
    this.prefabs.push(this.blocks.serialize());
    this.updatePropertyPanel();
  }

  if (this.prefabIndex > this.prefabs.length - 1) {
    this.prefabIndex = this.prefabs.length - 1;
    this.prefabsBar.highlight(this.prefabIndex);
    this.blocks.deserialize(this.prefabs[this.prefabIndex]);
    this.updatePropertyPanel();
  }

  this.updateScreenshots();
  this.updateLastBlocks();
};

Editor.prototype.createClone = function() {
  var prefab = this.blocks.serialize();
  this.createNew(this.prefabIndex + 1);
  this.blocks.deserialize(prefab);
  this.updateCurrentPrefab();

  this.updateScreenshots();
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
  this.updateLastBlocks();
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

},{"../components/blocks":18,"../utils/arrayutils":57,"./commands/offsetcommand":28,"./dragcamera":31,"./editorconsole":33,"./editortools":34,"./gui/arrowbar":35,"./gui/colorbar":36,"./gui/filebar":38,"./gui/prefabsbar":41,"./gui/prefabstoolbar":42,"./gui/propertypanel":43,"./gui/toolbar":44,"./tools/cameratool":45,"./tools/filltool":46,"./tools/pentool":47,"./tools/sampletool":48,"./tools/selecttool":49,"cbuffer":1}],33:[function(require,module,exports){
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
},{"./editor":32}],34:[function(require,module,exports){
var EditorTools = {
  Pen: 'Pen',
  Select: 'Select',
  Sample: 'Sample',
  Camera: 'Camera',
  Fill: 'Fill'
};

module.exports = EditorTools;
},{}],35:[function(require,module,exports){
var cpr = require('./cpr');

module.exports = function(editor) {
  var data = [{
    src: '/images/icons/arrow1_light.png',
    srcActive: '/images/icons/arrow1_dark.png',
    index: 0,
    tooltip: 'move right (D)'
  }, {
    src: '/images/icons/arrow2_light.png',
    srcActive: '/images/icons/arrow2_dark.png',
    index: 1,
    tooltip: 'move left (A)'
  }, {
    src: '/images/icons/arrow3_light.png',
    srcActive: '/images/icons/arrow3_dark.png',
    index: 2,
    tooltip: 'move front (W)'
  }, {
    src: '/images/icons/arrow4_light.png',
    srcActive: '/images/icons/arrow4_dark.png',
    index: 3,
    tooltip: 'move back (S)'
  }, {
    src: '/images/icons/arrow5_light.png',
    srcActive: '/images/icons/arrow5_dark.png',
    index: 4,
    tooltip: 'move up (R)'
  }, {
    src: '/images/icons/arrow6_light.png',
    srcActive: '/images/icons/arrow6_dark.png',
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
    },
    isButton: true
  });

  var gui = document.getElementById('gui');
  gui.appendChild(bar.domElement);

  bar.domElement.classList.add('toolbar');
  bar.domElement.style.position = 'absolute';
  bar.domElement.style.top = '70px';
  bar.domElement.style.left = '20px';
};
},{"./cpr":37}],36:[function(require,module,exports){
var cpr = require('./cpr');

module.exports = function(editor) {
  var bar = cpr({
    data: editor.palette,
    onPick: function(color) {
      editor.selectedColor = color.isClearColor ? null : color;
    },
    customPlacement: true
  });

  var gui = document.getElementById('gui');
  gui.appendChild(bar.domElement);

  bar.domElement.style.position = 'absolute';
  bar.domElement.style.left = '20px';
  bar.domElement.style.bottom = '20px';

  return bar;
};
},{"./cpr":37}],37:[function(require,module,exports){
module.exports = function(opts) {
  opts = opts || {};
  var dataToLoad = opts.data || [];
  var onPick = opts.onPick || function() {};
  var onHover = opts.onHover || function() {};
  var onLeave = opts.onLeave || function() {};
  var customPlacement = opts.customPlacement || false;
  var showTooltip = opts.showTooltip || false;
  var paddingRight = opts.paddingRight || 0;
  var blockWidth = opts.blockWidth || 20;
  var blockHeight = opts.blockHeight || 20;
  var columns = opts.columns || 14;
  var isButton = opts.isButton || false;
  var skinBlock = opts.skinBlock || function() {};
  var stickySelection = opts.stickySelection || false;

  var container = document.createElement('div');
  container.className = 'cpr';

  var mousedownListeners = [];
  var mouseupListeners = [];
  var blocks = [];
  var data = [];
  var highlightDiv = null;
  var selectedIndex = -1;

  if (showTooltip) {
    var tooltip = document.createElement('div');
    tooltip.className = 'tooltip';

    tooltip.style.position = 'absolute';
    tooltip.style.visibility = 'hidden';
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
    blocks[index].removeEventListener('mousedown', mousedownListeners[index]);
    blocks[index].removeEventListener('mouseup', mouseupListeners[index]);

    mousedownListeners[index] = undefined;
    mouseupListeners[index] = undefined;
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

    element.className = 'block box-sizing';
    if (isButton) {
      element.classList.add('button');
    }

    container.appendChild(element);
    position(element, row, column);

    blocks[index] = element;
    data[index] = obj;

    updateContainer();

    skinBlock(element);

    var onMouseDown = function(e) {
      highlight(index, true);
      onPick(obj, index);
    };

    var onMouseUp = function(e) {
      if (isButton && !stickySelection) {
        highlight(index, false);
      } 
    };

    element.addEventListener('mousedown', onMouseDown);

    element.addEventListener('mouseup', onMouseUp);

    mousedownListeners[index] = onMouseDown;
    mouseupListeners[index] = onMouseUp;
  };

  function add(obj) {
    var index = blocks.length;
    set(index, obj);
  };

  function position(element, row, column) {
    element.style.position = 'absolute';
    element.style.left = column * (blockWidth + paddingRight) + 'px';
    element.style.top = row * blockHeight + 'px';
    element.style.width = blockWidth + 'px';
    element.style.height = blockHeight + 'px';
  };

  function updateContainer() {
    var numberOfColumns = data.length > columns ? columns : data.length;
    container.style.width = numberOfColumns * (blockWidth + paddingRight) + 'px';
    container.style.height = getRows() * blockHeight + 'px';
  };

  function highlight(index, value) {
    value = value === undefined ? true : value;

    var element = blocks[index];

    if (element == null) {
      return;
    }

    var obj = data[index];

    if (value) {
      if (isButton) {
        // un highlight last element if sticky selection
        if (stickySelection && selectedIndex != index) {
          highlight(selectedIndex, false);
        }

        element.classList.add('selected');
        if (obj.srcActive != null) element.src = obj.srcActive;
      } else {
        var row = getRow(index);
        var column = getColumn(index);
        if (highlightDiv == null) {
          highlightDiv = document.createElement('div');
          highlightDiv.className = 'highlight';
          highlightDiv.style.position = 'absolute';
          highlightDiv.style.width = blockWidth + 'px';
          highlightDiv.style.height = blockHeight + 'px';
          highlightDiv.style.zIndex = 1;
          container.appendChild(highlightDiv);
        }

        highlightDiv.style.left = column * (blockWidth + paddingRight) - 1 + 'px';
        highlightDiv.style.top = row * blockHeight - 1 + 'px';
      }

      selectedIndex = index;
    } else {
      if (isButton) {
        element.classList.remove('selected');
        element.src = obj.src;
      }
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
      tooltip.style.left = mouseX + 2 + 'px';
      tooltip.style.top = mouseY + 2 + 'px';
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
},{}],38:[function(require,module,exports){
var cpr = require('./cpr');
var popup = require('./popup');

module.exports = function(editor) {
  // download.png
  var data = [{
    src: '/images/icons/undo_light.png',
    srcActive: '/images/icons/undo_dark.png',
    button: 'undo',
    tooltip: 'Undo (ctrl + z)'
  }, {
    src: '/images/icons/redo_light.png',
    srcActive: '/images/icons/redo_dark.png',
    button: 'redo',
    tooltip: 'Redo (shift + ctrl + z)'
  }, {
    src: '/images/icons/download_light.png',
    srcActive: '/images/icons/download_dark.png',
    button: 'save',
    tooltip: 'Save in browser'
  }];

  var bar = cpr({
    data: data,
    customPlacement: true,
    blockWidth: 32,
    blockHeight: 32,
    hideHighlight: true,
    showTooltip: true,
    onPick: function(obj) {
      var button = obj.button;

      if (button === 'save') {
        editor.save();
      } else if (button === 'undo') {
        editor.undo();
      } else if (button === 'redo') {
        editor.redo();
      }
    },
    isButton: true
  });

  var gui = document.getElementById('gui');
  gui.appendChild(bar.domElement);

  bar.domElement.classList.add('toolbar');

  bar.domElement.style.position = 'absolute';
  bar.domElement.style.left = 20 + 'px';
  bar.domElement.style.top = 120 + 'px';
};
},{"./cpr":37,"./popup":40}],39:[function(require,module,exports){
module.exports = function(data, opts) {
  var customPlacement = opts.customPlacement || false;

  var container = document.createElement('div');

  container.className = 'panel';

  if (!customPlacement) {
    container.style.position = 'absolute';
    container.style.right = 40 + 'px';
    container.style.top = 20 + 'px';
    container.style.width = 200 + 'px';
    document.body.appendChild(container);
  }

  var panel = {};
  panel.controllers = {};
  panel.domElement = container;

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
  input.className = 'text-field';

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

      button.classList.toggle('selected');

      onChange(getSelectedOptions());
    };
  };

  function getSelectedOptions() {
    var selection = [];
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].classList.contains('selected')) {
        selection.push(options[i]);
      }
    }

    return selection;
  };

  for (var i = 0; i < options.length; i++) {
    var option = options[i];
    var button = document.createElement('button');
    button.className = 'segmented-button';
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
},{}],40:[function(require,module,exports){
module.exports = {
  prompt: function(opts, callback) {
    var text = opts.text;
    var buttons = opts.buttons || ['OK'];
    var containerWidth = opts.containerWidth || 200;
    var containerHeight = opts.containerHeight || 200;

    var background = document.createElement('div');
    background.style.backgroundColor = 'rgba(0,0,0,0.8)'
    background.style.position = 'absolute';
    background.style.width = '100%';
    background.style.height = '100%';
    document.body.appendChild(background);

    containerWidth = 200;
    containerHeight = 200;
    var container = document.createElement('div');
    container.className = 'prompt';
    container.style.position = 'absolute';
    container.style.width = containerWidth + 'px';
    // container.style.height = containerHeight + 'px';

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

    // var input = document.createElement('input');
    // input.type = 'text';
    // container.appendChild(input);

    // container.appendChild(document.createElement('br'));

    // input.focus();

    function onClick(index) {
      return function() {
        var shouldDismiss = callback(index);
        if (shouldDismiss === undefined) {
          shouldDismiss = true;
        }

        if (shouldDismiss) {
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

    var prompt = {
      dismiss: dismiss
    };

    return prompt;
  }
}
},{}],41:[function(require,module,exports){
var cpr = require('./cpr');

module.exports = function(editor) {
  var bar = cpr({
    onPick: function(obj, index) {
      editor.prefabIndex = index;
      editor.load(editor.prefabs[index]);
    },
    blockWidth: 48,
    blockHeight: 48,
    customPlacement: true
  });

  var gui = document.getElementById('gui');
  gui.appendChild(bar.domElement);

  bar.domElement.style.position = 'absolute';
  bar.domElement.style.left = '20px';
  bar.domElement.style.bottom = '120px';

  return bar;
};
},{"./cpr":37}],42:[function(require,module,exports){
var cpr = require('./cpr');
var popup = require('./popup');

module.exports = function(editor) {
  var input = editor.input;
  var data = [{
    button: 'plus',
    src: '/images/icons/plus_light.png',
    srcActive: '/images/icons/plus_dark.png',
    tooltip: 'Create new'
  }, {
    button: 'minus',
    src: '/images/icons/minus_light.png',
    srcActive: '/images/icons/minus_dark.png',
    tooltip: 'Remove selected'
  }, {
    button: 'clone',
    src: '/images/icons/clone_light.png',
    srcActive: '/images/icons/clone_dark.png',
    tooltip: 'Clone selected'
  }];

  var bar = cpr({
    data: data,
    blockWidth: 32,
    blockHeight: 32,
    disableHighlight: true,
    showTooltip: true,
    onPick: function(obj) {
      var button = obj.button;

      if (button === 'plus') {
        editor.createNew();
      } else if (button === 'minus') {
        popup.prompt({
          text: "Are you sure?",
          buttons: ["Yea", "Na"]
        }, function(index) {
          if (index === 0) {
            editor.removeSelected();
          }
        });

        bar.highlight(1, false);

      } else if (button === 'clone') {
        editor.createClone();
      }
    },
    customPlacement: true,
    isButton: true
  });

  var gui = document.getElementById('gui');
  gui.appendChild(bar.domElement);

  bar.domElement.style.position = 'absolute';
  bar.domElement.style.left = '20px';
  bar.domElement.style.bottom = '180px';
};
},{"./cpr":37,"./popup":40}],43:[function(require,module,exports){
var panel = require('./panel');

function clamp(value, min, max) {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
};

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
      var reg = /^\s*(\d{1,2}) (\d{1,2}) (\d{1,2})\s*$/g
      var matches = reg.exec(value);

      if (matches == null) {
        editor.updatePropertyPanel();
        return;
      }

      editor.updateSize([
        clamp(parseInt(matches[1]), 0, 32),
        clamp(parseInt(matches[2]), 0, 32),
        clamp(parseInt(matches[3]), 0, 32)
      ]);

      editor.updatePropertyPanel();
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

  var propertyPanel = panel(data, {
    customPlacement: true
  });

  propertyPanel.domElement.style.position = 'absolute';
  propertyPanel.domElement.style.right = 40 + 'px';
  propertyPanel.domElement.style.top = 20 + 'px';
  propertyPanel.domElement.style.width = 200 + 'px';
  document.getElementById('gui').appendChild(propertyPanel.domElement);

  return propertyPanel;
};
},{"./panel":39}],44:[function(require,module,exports){
var cpr = require('./cpr');
var EditorTools = require('../editortools');

module.exports = function(editor) {
  var bar = cpr({
    data: [{
      src: '/images/icons/pencil_light.png',
      srcActive: '/images/icons/pencil_dark.png',
      toolname: EditorTools.Pen,
      tooltip: 'pen tool (1)'
    }, {
      src: '/images/icons/sampler_light.png',
      srcActive: '/images/icons/sampler_dark.png',
      toolname: EditorTools.Sample,
      tooltip: 'sample tool (2)'
    }, {
      src: '/images/icons/lasso_light.png',
      srcActive: '/images/icons/lasso_dark.png',
      toolname: EditorTools.Select,
      tooltip: 'lasso tool (3)'
    }, {
      src: '/images/icons/camera_light.png',
      srcActive: '/images/icons/camera_dark.png',
      toolname: EditorTools.Camera,
      tooltip: 'camera tool (4 or drag empty space)'
    }, {
      src: '/images/icons/fill_light.png',
      srcActive: '/images/icons/fill_dark.png',
      toolname: EditorTools.Fill,
      tooltip: 'block tool (5) (drag and drop between two points)'
    }],
    blockWidth: 32,
    blockHeight: 32,
    onPick: function(obj) {
      editor.toolName = obj.toolname;
      editor.updateTool();
    },
    customPlacement: true,
    showTooltip: true,
    hideHighlight: true,
    isButton: true,
    stickySelection: true
  });

  var gui = document.getElementById('gui');
  gui.appendChild(bar.domElement);

  bar.domElement.classList.add('toolbar');

  bar.domElement.style.position = 'absolute';
  bar.domElement.style.top = 20 + 'px';
  bar.domElement.style.left = 20 + 'px';

  return bar;
};
},{"../editortools":34,"./cpr":37}],45:[function(require,module,exports){
var CameraTool = function() {

};

CameraTool.prototype.tick = function() {
	
};

module.exports = CameraTool;
},{}],46:[function(require,module,exports){
var SetCommand = require('../commands/setcommand');

var FillTool = function(editor) {
  this.editor = editor;
  this.input = this.editor.input;
  this.blocksCopy = null;
  this.startCoord = null;
  this.endCoord = null;
};

FillTool.prototype.start = function() {
  this.editor.updateLastBlocks();
};

FillTool.prototype.tick = function() {
  var coordAbove = this.editor.getCoordAbove();
  var coordBelow = this.editor.getCoordBelow();
  var shouldUpdate = false;

  var isRemove = this.input.mouseHold(2) || this.input.mouseUp(2);

  this.editor.highlightCoord = this.editor.selectedColor == null ? coordBelow : coordAbove;

  var coord = (isRemove || this.editor.selectedColor == null) ? coordBelow : coordAbove;

  if (this.input.mouseDown() && coord != null) {
    this.blocksCopy = this.editor.blocks.serialize();
    if (this.startCoord == null) {
      this.startCoord = coord;
      this.endCoord = coord;
      shouldUpdate = true;
    }
  }

  if (this.startCoord != null && coord != null) {
    if (this.endCoord == null || !this.endCoord.equals(coord)) {
      this.endCoord = coord;
      shouldUpdate = true;
    }
  }

  var index = isRemove ? 0 :
    this.editor.blocks.getOrAddColorIndex(this.editor.selectedColor);

  if (this.startCoord != null && this.endCoord != null && shouldUpdate) {
    this.editor.blocks.deserialize(this.blocksCopy);

    var self = this;
    this.loopCoords(this.startCoord, this.endCoord, function(i, j, k) {
      self.editor.blocks.set(i, j, k, index);
    });
  }

  if (this.input.mouseUp() && this.blocksCopy != null) {
    this.editor.blocks.deserialize(this.blocksCopy);

    var coords = [];

    this.loopCoords(this.startCoord, this.endCoord, function(i, j, k) {
      coords.push(new THREE.Vector3(i, j, k));
    });

    var command = new SetCommand(this.editor.blocks, coords, index);
    this.editor.runCommand(command);
    this.editor.updateLastBlocks();

    this.startCoord = null;
    this.endCoord = null;
    this.blocksCopy = null;
  }
};

FillTool.prototype.loopCoords = function(startCoord, endCoord, callback) {
  var min = new THREE.Vector3(
    Math.min(startCoord.x, endCoord.x),
    Math.min(startCoord.y, endCoord.y),
    Math.min(startCoord.z, endCoord.z)
  );

  var max = new THREE.Vector3(
    Math.max(startCoord.x, endCoord.x),
    Math.max(startCoord.y, endCoord.y),
    Math.max(startCoord.z, endCoord.z)
  );

  for (var i = min.x; i <= max.x; i++) {
    for (var j = min.y; j <= max.y; j++) {
      for (var k = min.z; k <= max.z; k++) {
        callback(i, j, k);
      }
    }
  }
};

module.exports = FillTool;
},{"../commands/setcommand":30}],47:[function(require,module,exports){
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
},{"../commands/setcommand":30}],48:[function(require,module,exports){
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
  }
};

module.exports = SampleTool;
},{"../editortools":34}],49:[function(require,module,exports){
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
},{"../commands/selectcommand":29,"point-in-polygon":13}],50:[function(require,module,exports){
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

},{"./assemblies/aeditor":15,"./assemblies/aground":16,"./assemblies/aplayer":17,"./components/playerCamera":20,"./core/b":23,"./data/config.json":25,"./data/palette.json":26,"./services/devconsole":51,"./services/materials":52,"./services/prefabservice":53,"./services/stats":54,"./systems/input":55,"./systems/renderer":56,"./voxel/voxel":61}],51:[function(require,module,exports){
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
  renderer.setClearColor(0x222222);
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY2J1ZmZlci9jYnVmZmVyLmpzIiwibm9kZV9tb2R1bGVzL2dyZWVkeS1tZXNoZXIvZ3JlZWR5LmpzIiwibm9kZV9tb2R1bGVzL2dyZWVkeS1tZXNoZXIvbm9kZV9tb2R1bGVzL2lvdGEtYXJyYXkvaW90YS5qcyIsIm5vZGVfbW9kdWxlcy9ncmVlZHktbWVzaGVyL25vZGVfbW9kdWxlcy90eXBlZGFycmF5LXBvb2wvbm9kZV9tb2R1bGVzL2JpdC10d2lkZGxlL3R3aWRkbGUuanMiLCJub2RlX21vZHVsZXMvZ3JlZWR5LW1lc2hlci9ub2RlX21vZHVsZXMvdHlwZWRhcnJheS1wb29sL25vZGVfbW9kdWxlcy9kdXAvZHVwLmpzIiwibm9kZV9tb2R1bGVzL2dyZWVkeS1tZXNoZXIvbm9kZV9tb2R1bGVzL3R5cGVkYXJyYXktcG9vbC9wb29sLmpzIiwibm9kZV9tb2R1bGVzL2dyZWVkeS1tZXNoZXIvbm9kZV9tb2R1bGVzL3VuaXEvdW5pcS5qcyIsIm5vZGVfbW9kdWxlcy9rZXljb2RlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL21pbmltaXN0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL25kYXJyYXkvbmRhcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9uZGFycmF5L25vZGVfbW9kdWxlcy9pcy1idWZmZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcG9pbnQtaW4tcG9seWdvbi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zdGF0cy5qcy9zcmMvU3RhdHMuanMiLCJzcmMvYXNzZW1ibGllcy9hZWRpdG9yLmpzIiwic3JjL2Fzc2VtYmxpZXMvYWdyb3VuZC5qcyIsInNyYy9hc3NlbWJsaWVzL2FwbGF5ZXIuanMiLCJzcmMvY29tcG9uZW50cy9ibG9ja3MuanMiLCJzcmMvY29tcG9uZW50cy9jaGFyYWN0ZXIuanMiLCJzcmMvY29tcG9uZW50cy9wbGF5ZXJDYW1lcmEuanMiLCJzcmMvY29tcG9uZW50cy9wbGF5ZXJjb250cm9sLmpzIiwic3JjL2NvbXBvbmVudHMvcmlnaWRib2R5LmpzIiwic3JjL2NvcmUvYi5qcyIsInNyYy9jb3JlL2V2ZW50cy5qcyIsInNyYy9kYXRhL2NvbmZpZy5qc29uIiwic3JjL2RhdGEvcGFsZXR0ZS5qc29uIiwic3JjL2VkaXRvci9jb21tYW5kcy9ibG9ja2NvbW1hbmQuanMiLCJzcmMvZWRpdG9yL2NvbW1hbmRzL29mZnNldGNvbW1hbmQuanMiLCJzcmMvZWRpdG9yL2NvbW1hbmRzL3NlbGVjdGNvbW1hbmQuanMiLCJzcmMvZWRpdG9yL2NvbW1hbmRzL3NldGNvbW1hbmQuanMiLCJzcmMvZWRpdG9yL2RyYWdjYW1lcmEuanMiLCJzcmMvZWRpdG9yL2VkaXRvci5qcyIsInNyYy9lZGl0b3IvZWRpdG9yY29uc29sZS5qcyIsInNyYy9lZGl0b3IvZWRpdG9ydG9vbHMuanMiLCJzcmMvZWRpdG9yL2d1aS9hcnJvd2Jhci5qcyIsInNyYy9lZGl0b3IvZ3VpL2NvbG9yYmFyLmpzIiwic3JjL2VkaXRvci9ndWkvY3ByLmpzIiwic3JjL2VkaXRvci9ndWkvZmlsZWJhci5qcyIsInNyYy9lZGl0b3IvZ3VpL3BhbmVsLmpzIiwic3JjL2VkaXRvci9ndWkvcG9wdXAuanMiLCJzcmMvZWRpdG9yL2d1aS9wcmVmYWJzYmFyLmpzIiwic3JjL2VkaXRvci9ndWkvcHJlZmFic3Rvb2xiYXIuanMiLCJzcmMvZWRpdG9yL2d1aS9wcm9wZXJ0eXBhbmVsLmpzIiwic3JjL2VkaXRvci9ndWkvdG9vbGJhci5qcyIsInNyYy9lZGl0b3IvdG9vbHMvY2FtZXJhdG9vbC5qcyIsInNyYy9lZGl0b3IvdG9vbHMvZmlsbHRvb2wuanMiLCJzcmMvZWRpdG9yL3Rvb2xzL3BlbnRvb2wuanMiLCJzcmMvZWRpdG9yL3Rvb2xzL3NhbXBsZXRvb2wuanMiLCJzcmMvZWRpdG9yL3Rvb2xzL3NlbGVjdHRvb2wuanMiLCJzcmMvbWFpbi5qcyIsInNyYy9zZXJ2aWNlcy9kZXZjb25zb2xlLmpzIiwic3JjL3NlcnZpY2VzL21hdGVyaWFscy5qcyIsInNyYy9zZXJ2aWNlcy9wcmVmYWJzZXJ2aWNlLmpzIiwic3JjL3NlcnZpY2VzL3N0YXRzLmpzIiwic3JjL3N5c3RlbXMvaW5wdXQuanMiLCJzcmMvc3lzdGVtcy9yZW5kZXJlci5qcyIsInNyYy91dGlscy9hcnJheXV0aWxzLmpzIiwic3JjL3ZveGVsL2dyYXZpdHkuanMiLCJzcmMvdm94ZWwvZ3Jhdml0eXV0aWxzLmpzIiwic3JjL3ZveGVsL21lc2hlci5qcyIsInNyYy92b3hlbC92b3hlbC5qcyIsIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvaW5kZXguanMiLCIuLi8uLi8uLi8uLi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9iYXNlNjQtanMvbGliL2I2NC5qcyIsIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvbm9kZV9tb2R1bGVzL2llZWU3NTQvaW5kZXguanMiLCIuLi8uLi8uLi8uLi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pcy1hcnJheS9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3JOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdlZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3BKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDL05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDL3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM3S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDMUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzcvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKSB7XG5cbmZ1bmN0aW9uIENCdWZmZXIoKSB7XG5cdC8vIGhhbmRsZSBjYXNlcyB3aGVyZSBcIm5ld1wiIGtleXdvcmQgd2Fzbid0IHVzZWRcblx0aWYgKCEodGhpcyBpbnN0YW5jZW9mIENCdWZmZXIpKSB7XG5cdFx0Ly8gbXVsdGlwbGUgY29uZGl0aW9ucyBuZWVkIHRvIGJlIGNoZWNrZWQgdG8gcHJvcGVybHkgZW11bGF0ZSBBcnJheVxuXHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSB8fCB0eXBlb2YgYXJndW1lbnRzWzBdICE9PSAnbnVtYmVyJykge1xuXHRcdFx0cmV0dXJuIENCdWZmZXIuYXBwbHkobmV3IENCdWZmZXIoYXJndW1lbnRzLmxlbmd0aCksIGFyZ3VtZW50cyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBuZXcgQ0J1ZmZlcihhcmd1bWVudHNbMF0pO1xuXHRcdH1cblx0fVxuXHQvLyBpZiBubyBhcmd1bWVudHMsIHRoZW4gbm90aGluZyBuZWVkcyB0byBiZSBzZXRcblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG5cdHRocm93IG5ldyBFcnJvcignTWlzc2luZyBBcmd1bWVudDogWW91IG11c3QgcGFzcyBhIHZhbGlkIGJ1ZmZlciBsZW5ndGgnKTtcblx0Ly8gdGhpcyBpcyB0aGUgc2FtZSBpbiBlaXRoZXIgc2NlbmFyaW9cblx0dGhpcy5zaXplID0gdGhpcy5zdGFydCA9IDA7XG5cdC8vIHNldCB0byBjYWxsYmFjayBmbiBpZiBkYXRhIGlzIGFib3V0IHRvIGJlIG92ZXJ3cml0dGVuXG5cdHRoaXMub3ZlcmZsb3cgPSBudWxsO1xuXHQvLyBlbXVsYXRlIEFycmF5IGJhc2VkIG9uIHBhc3NlZCBhcmd1bWVudHNcblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxIHx8IHR5cGVvZiBhcmd1bWVudHNbMF0gIT09ICdudW1iZXInKSB7XG5cdFx0dGhpcy5kYXRhID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGgpO1xuXHRcdHRoaXMuZW5kID0gKHRoaXMubGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aCkgLSAxO1xuXHRcdHRoaXMucHVzaC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHR9IGVsc2Uge1xuXHRcdHRoaXMuZGF0YSA9IG5ldyBBcnJheShhcmd1bWVudHNbMF0pO1xuXHRcdHRoaXMuZW5kID0gKHRoaXMubGVuZ3RoID0gYXJndW1lbnRzWzBdKSAtIDE7XG5cdH1cblx0Ly8gbmVlZCB0byBgcmV0dXJuIHRoaXNgIHNvIGByZXR1cm4gQ0J1ZmZlci5hcHBseWAgd29ya3Ncblx0cmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRDb21wYXJpdG9yKGEsIGIpIHtcblx0cmV0dXJuIGEgPT0gYiA/IDAgOiBhID4gYiA/IDEgOiAtMTtcbn1cblxuQ0J1ZmZlci5wcm90b3R5cGUgPSB7XG5cdC8vIHByb3Blcmx5IHNldCBjb25zdHJ1Y3RvclxuXHRjb25zdHJ1Y3RvciA6IENCdWZmZXIsXG5cblx0LyogbXV0YXRvciBtZXRob2RzICovXG5cdC8vIHBvcCBsYXN0IGl0ZW1cblx0cG9wIDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpdGVtO1xuXHRcdGlmICh0aGlzLnNpemUgPT09IDApIHJldHVybjtcblx0XHRpdGVtID0gdGhpcy5kYXRhW3RoaXMuZW5kXTtcblx0XHQvLyByZW1vdmUgdGhlIHJlZmVyZW5jZSB0byB0aGUgb2JqZWN0IHNvIGl0IGNhbiBiZSBnYXJiYWdlIGNvbGxlY3RlZFxuXHRcdGRlbGV0ZSB0aGlzLmRhdGFbdGhpcy5lbmRdO1xuXHRcdHRoaXMuZW5kID0gKHRoaXMuZW5kIC0gMSArIHRoaXMubGVuZ3RoKSAlIHRoaXMubGVuZ3RoO1xuXHRcdHRoaXMuc2l6ZS0tO1xuXHRcdHJldHVybiBpdGVtO1xuXHR9LFxuXHQvLyBwdXNoIGl0ZW0gdG8gdGhlIGVuZFxuXHRwdXNoIDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpID0gMDtcblx0XHQvLyBjaGVjayBpZiBvdmVyZmxvdyBpcyBzZXQsIGFuZCBpZiBkYXRhIGlzIGFib3V0IHRvIGJlIG92ZXJ3cml0dGVuXG5cdFx0aWYgKHRoaXMub3ZlcmZsb3cgJiYgdGhpcy5zaXplICsgYXJndW1lbnRzLmxlbmd0aCA+IHRoaXMubGVuZ3RoKSB7XG5cdFx0XHQvLyBjYWxsIG92ZXJmbG93IGZ1bmN0aW9uIGFuZCBzZW5kIGRhdGEgdGhhdCdzIGFib3V0IHRvIGJlIG92ZXJ3cml0dGVuXG5cdFx0XHRmb3IgKDsgaSA8IHRoaXMuc2l6ZSArIGFyZ3VtZW50cy5sZW5ndGggLSB0aGlzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHRoaXMub3ZlcmZsb3codGhpcy5kYXRhWyh0aGlzLmVuZCArIGkgKyAxKSAlIHRoaXMubGVuZ3RoXSwgdGhpcyk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vIHB1c2ggaXRlbXMgdG8gdGhlIGVuZCwgd3JhcHBpbmcgYW5kIGVyYXNpbmcgZXhpc3RpbmcgaXRlbXNcblx0XHQvLyB1c2luZyBhcmd1bWVudHMgdmFyaWFibGUgZGlyZWN0bHkgdG8gcmVkdWNlIGdjIGZvb3RwcmludFxuXHRcdGZvciAoaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHRoaXMuZGF0YVsodGhpcy5lbmQgKyBpICsgMSkgJSB0aGlzLmxlbmd0aF0gPSBhcmd1bWVudHNbaV07XG5cdFx0fVxuXHRcdC8vIHJlY2FsY3VsYXRlIHNpemVcblx0XHRpZiAodGhpcy5zaXplIDwgdGhpcy5sZW5ndGgpIHtcblx0XHRcdGlmICh0aGlzLnNpemUgKyBpID4gdGhpcy5sZW5ndGgpIHRoaXMuc2l6ZSA9IHRoaXMubGVuZ3RoO1xuXHRcdFx0ZWxzZSB0aGlzLnNpemUgKz0gaTtcblx0XHR9XG5cdFx0Ly8gcmVjYWxjdWxhdGUgZW5kXG5cdFx0dGhpcy5lbmQgPSAodGhpcy5lbmQgKyBpKSAlIHRoaXMubGVuZ3RoO1xuXHRcdC8vIHJlY2FsY3VsYXRlIHN0YXJ0XG5cdFx0dGhpcy5zdGFydCA9ICh0aGlzLmxlbmd0aCArIHRoaXMuZW5kIC0gdGhpcy5zaXplICsgMSkgJSB0aGlzLmxlbmd0aDtcblx0XHQvLyByZXR1cm4gbnVtYmVyIGN1cnJlbnQgbnVtYmVyIG9mIGl0ZW1zIGluIENCdWZmZXJcblx0XHRyZXR1cm4gdGhpcy5zaXplO1xuXHR9LFxuXHQvLyByZXZlcnNlIG9yZGVyIG9mIHRoZSBidWZmZXJcblx0cmV2ZXJzZSA6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgaSA9IDAsXG5cdFx0XHR0bXA7XG5cdFx0Zm9yICg7IGkgPCB+fih0aGlzLnNpemUgLyAyKTsgaSsrKSB7XG5cdFx0XHR0bXAgPSB0aGlzLmRhdGFbKHRoaXMuc3RhcnQgKyBpKSAlIHRoaXMubGVuZ3RoXTtcblx0XHRcdHRoaXMuZGF0YVsodGhpcy5zdGFydCArIGkpICUgdGhpcy5sZW5ndGhdID0gdGhpcy5kYXRhWyh0aGlzLnN0YXJ0ICsgKHRoaXMuc2l6ZSAtIGkgLSAxKSkgJSB0aGlzLmxlbmd0aF07XG5cdFx0XHR0aGlzLmRhdGFbKHRoaXMuc3RhcnQgKyAodGhpcy5zaXplIC0gaSAtIDEpKSAlIHRoaXMubGVuZ3RoXSA9IHRtcDtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdC8vIHJvdGF0ZSBidWZmZXIgdG8gdGhlIGxlZnQgYnkgY250ciwgb3IgYnkgMVxuXHRyb3RhdGVMZWZ0IDogZnVuY3Rpb24gKGNudHIpIHtcblx0XHRpZiAodHlwZW9mIGNudHIgPT09ICd1bmRlZmluZWQnKSBjbnRyID0gMTtcblx0XHRpZiAodHlwZW9mIGNudHIgIT09ICdudW1iZXInKSB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCBtdXN0IGJlIGEgbnVtYmVyXCIpO1xuXHRcdHdoaWxlICgtLWNudHIgPj0gMCkge1xuXHRcdFx0dGhpcy5wdXNoKHRoaXMuc2hpZnQoKSk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHQvLyByb3RhdGUgYnVmZmVyIHRvIHRoZSByaWdodCBieSBjbnRyLCBvciBieSAxXG5cdHJvdGF0ZVJpZ2h0IDogZnVuY3Rpb24gKGNudHIpIHtcblx0XHRpZiAodHlwZW9mIGNudHIgPT09ICd1bmRlZmluZWQnKSBjbnRyID0gMTtcblx0XHRpZiAodHlwZW9mIGNudHIgIT09ICdudW1iZXInKSB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCBtdXN0IGJlIGEgbnVtYmVyXCIpO1xuXHRcdHdoaWxlICgtLWNudHIgPj0gMCkge1xuXHRcdFx0dGhpcy51bnNoaWZ0KHRoaXMucG9wKCkpO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0Ly8gcmVtb3ZlIGFuZCByZXR1cm4gZmlyc3QgaXRlbVxuXHRzaGlmdCA6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgaXRlbTtcblx0XHQvLyBjaGVjayBpZiB0aGVyZSBhcmUgYW55IGl0ZW1zIGluIENCdWZmXG5cdFx0aWYgKHRoaXMuc2l6ZSA9PT0gMCkgcmV0dXJuO1xuXHRcdC8vIHN0b3JlIGZpcnN0IGl0ZW0gZm9yIHJldHVyblxuXHRcdGl0ZW0gPSB0aGlzLmRhdGFbdGhpcy5zdGFydF07XG5cdFx0Ly8gcmVjYWxjdWxhdGUgc3RhcnQgb2YgQ0J1ZmZlclxuXHRcdHRoaXMuc3RhcnQgPSAodGhpcy5zdGFydCArIDEpICUgdGhpcy5sZW5ndGg7XG5cdFx0Ly8gZGVjcmVtZW50IHNpemVcblx0XHR0aGlzLnNpemUtLTtcblx0XHRyZXR1cm4gaXRlbTtcblx0fSxcblx0Ly8gc29ydCBpdGVtc1xuXHRzb3J0IDogZnVuY3Rpb24gKGZuKSB7XG5cdFx0dGhpcy5kYXRhLnNvcnQoZm4gfHwgZGVmYXVsdENvbXBhcml0b3IpO1xuXHRcdHRoaXMuc3RhcnQgPSAwO1xuXHRcdHRoaXMuZW5kID0gdGhpcy5zaXplIC0gMTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0Ly8gYWRkIGl0ZW0gdG8gYmVnaW5uaW5nIG9mIGJ1ZmZlclxuXHR1bnNoaWZ0IDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpID0gMDtcblx0XHQvLyBjaGVjayBpZiBvdmVyZmxvdyBpcyBzZXQsIGFuZCBpZiBkYXRhIGlzIGFib3V0IHRvIGJlIG92ZXJ3cml0dGVuXG5cdFx0aWYgKHRoaXMub3ZlcmZsb3cgJiYgdGhpcy5zaXplICsgYXJndW1lbnRzLmxlbmd0aCA+IHRoaXMubGVuZ3RoKSB7XG5cdFx0XHQvLyBjYWxsIG92ZXJmbG93IGZ1bmN0aW9uIGFuZCBzZW5kIGRhdGEgdGhhdCdzIGFib3V0IHRvIGJlIG92ZXJ3cml0dGVuXG5cdFx0XHRmb3IgKDsgaSA8IHRoaXMuc2l6ZSArIGFyZ3VtZW50cy5sZW5ndGggLSB0aGlzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHRoaXMub3ZlcmZsb3codGhpcy5kYXRhW3RoaXMuZW5kIC0gKGkgJSB0aGlzLmxlbmd0aCldLCB0aGlzKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0Zm9yIChpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dGhpcy5kYXRhWyh0aGlzLmxlbmd0aCArIHRoaXMuc3RhcnQgLSAoaSAlIHRoaXMubGVuZ3RoKSAtIDEpICUgdGhpcy5sZW5ndGhdID0gYXJndW1lbnRzW2ldO1xuXHRcdH1cblx0XHRpZiAodGhpcy5sZW5ndGggLSB0aGlzLnNpemUgLSBpIDwgMCkge1xuXHRcdFx0dGhpcy5lbmQgKz0gdGhpcy5sZW5ndGggLSB0aGlzLnNpemUgLSBpO1xuXHRcdFx0aWYgKHRoaXMuZW5kIDwgMCkgdGhpcy5lbmQgPSB0aGlzLmxlbmd0aCArICh0aGlzLmVuZCAlIHRoaXMubGVuZ3RoKTtcblx0XHR9XG5cdFx0aWYgKHRoaXMuc2l6ZSA8IHRoaXMubGVuZ3RoKSB7XG5cdFx0XHRpZiAodGhpcy5zaXplICsgaSA+IHRoaXMubGVuZ3RoKSB0aGlzLnNpemUgPSB0aGlzLmxlbmd0aDtcblx0XHRcdGVsc2UgdGhpcy5zaXplICs9IGk7XG5cdFx0fVxuXHRcdHRoaXMuc3RhcnQgLT0gYXJndW1lbnRzLmxlbmd0aDtcblx0XHRpZiAodGhpcy5zdGFydCA8IDApIHRoaXMuc3RhcnQgPSB0aGlzLmxlbmd0aCArICh0aGlzLnN0YXJ0ICUgdGhpcy5sZW5ndGgpO1xuXHRcdHJldHVybiB0aGlzLnNpemU7XG5cdH0sXG5cblx0LyogYWNjZXNzb3IgbWV0aG9kcyAqL1xuXHQvLyByZXR1cm4gaW5kZXggb2YgZmlyc3QgbWF0Y2hlZCBlbGVtZW50XG5cdGluZGV4T2YgOiBmdW5jdGlvbiAoYXJnLCBpZHgpIHtcblx0XHRpZiAoIWlkeCkgaWR4ID0gMDtcblx0XHRmb3IgKDsgaWR4IDwgdGhpcy5zaXplOyBpZHgrKykge1xuXHRcdFx0aWYgKHRoaXMuZGF0YVsodGhpcy5zdGFydCArIGlkeCkgJSB0aGlzLmxlbmd0aF0gPT09IGFyZykgcmV0dXJuIGlkeDtcblx0XHR9XG5cdFx0cmV0dXJuIC0xO1xuXHR9LFxuXHQvLyByZXR1cm4gbGFzdCBpbmRleCBvZiB0aGUgZmlyc3QgbWF0Y2hcblx0bGFzdEluZGV4T2YgOiBmdW5jdGlvbiAoYXJnLCBpZHgpIHtcblx0XHRpZiAoIWlkeCkgaWR4ID0gdGhpcy5zaXplIC0gMTtcblx0XHRmb3IgKDsgaWR4ID49IDA7IGlkeC0tKSB7XG5cdFx0XHRpZiAodGhpcy5kYXRhWyh0aGlzLnN0YXJ0ICsgaWR4KSAlIHRoaXMubGVuZ3RoXSA9PT0gYXJnKSByZXR1cm4gaWR4O1xuXHRcdH1cblx0XHRyZXR1cm4gLTE7XG5cdH0sXG5cblx0Ly8gcmV0dXJuIHRoZSBpbmRleCBhbiBpdGVtIHdvdWxkIGJlIGluc2VydGVkIHRvIGlmIHRoaXNcblx0Ly8gaXMgYSBzb3J0ZWQgY2lyY3VsYXIgYnVmZmVyXG5cdHNvcnRlZEluZGV4IDogZnVuY3Rpb24odmFsdWUsIGNvbXBhcml0b3IsIGNvbnRleHQpIHtcblx0XHRjb21wYXJpdG9yID0gY29tcGFyaXRvciB8fCBkZWZhdWx0Q29tcGFyaXRvcjtcblx0XHR2YXIgbG93ID0gdGhpcy5zdGFydCxcblx0XHRcdGhpZ2ggPSB0aGlzLnNpemUgLSAxO1xuXG5cdFx0Ly8gVHJpY2t5IHBhcnQgaXMgZmluZGluZyBpZiBpdHMgYmVmb3JlIG9yIGFmdGVyIHRoZSBwaXZvdFxuXHRcdC8vIHdlIGNhbiBnZXQgdGhpcyBpbmZvIGJ5IGNoZWNraW5nIGlmIHRoZSB0YXJnZXQgaXMgbGVzcyB0aGFuXG5cdFx0Ly8gdGhlIGxhc3QgaXRlbS4gQWZ0ZXIgdGhhdCBpdCdzIGp1c3QgYSB0eXBpY2FsIGJpbmFyeSBzZWFyY2guXG5cdFx0aWYgKGxvdyAmJiBjb21wYXJpdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIHRoaXMuZGF0YVtoaWdoXSkgPiAwKSB7XG5cdFx0XHRsb3cgPSAwLCBoaWdoID0gdGhpcy5lbmQ7XG5cdFx0fVxuXG5cdFx0d2hpbGUgKGxvdyA8IGhpZ2gpIHtcblx0XHQgIHZhciBtaWQgPSAobG93ICsgaGlnaCkgPj4+IDE7XG5cdFx0ICBpZiAoY29tcGFyaXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCB0aGlzLmRhdGFbbWlkXSkgPiAwKSBsb3cgPSBtaWQgKyAxO1xuXHRcdCAgZWxzZSBoaWdoID0gbWlkO1xuXHRcdH1cblx0XHQvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xODYxODI3My8xNTE3OTE5XG5cdFx0cmV0dXJuICgoKGxvdyAtIHRoaXMuc3RhcnQpICUgdGhpcy5zaXplKSArIHRoaXMuc2l6ZSkgJSB0aGlzLnNpemU7XG5cdH0sXG5cblx0LyogaXRlcmF0aW9uIG1ldGhvZHMgKi9cblx0Ly8gY2hlY2sgZXZlcnkgaXRlbSBpbiB0aGUgYXJyYXkgYWdhaW5zdCBhIHRlc3Rcblx0ZXZlcnkgOiBmdW5jdGlvbiAoY2FsbGJhY2ssIGNvbnRleHQpIHtcblx0XHR2YXIgaSA9IDA7XG5cdFx0Zm9yICg7IGkgPCB0aGlzLnNpemU7IGkrKykge1xuXHRcdFx0aWYgKCFjYWxsYmFjay5jYWxsKGNvbnRleHQsIHRoaXMuZGF0YVsodGhpcy5zdGFydCArIGkpICUgdGhpcy5sZW5ndGhdLCBpLCB0aGlzKSlcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSxcblx0Ly8gbG9vcCB0aHJvdWdoIGVhY2ggaXRlbSBpbiBidWZmZXJcblx0Ly8gVE9ETzogZmlndXJlIG91dCBob3cgdG8gZW11bGF0ZSBBcnJheSB1c2UgYmV0dGVyXG5cdGZvckVhY2ggOiBmdW5jdGlvbiAoY2FsbGJhY2ssIGNvbnRleHQpIHtcblx0XHR2YXIgaSA9IDA7XG5cdFx0Zm9yICg7IGkgPCB0aGlzLnNpemU7IGkrKykge1xuXHRcdFx0Y2FsbGJhY2suY2FsbChjb250ZXh0LCB0aGlzLmRhdGFbKHRoaXMuc3RhcnQgKyBpKSAlIHRoaXMubGVuZ3RoXSwgaSwgdGhpcyk7XG5cdFx0fVxuXHR9LFxuXHQvLyBjaGVjayBpdGVtcyBhZ2FpbnMgdGVzdCB1bnRpbCBvbmUgcmV0dXJucyB0cnVlXG5cdC8vIFRPRE86IGZpZ3VyZSBvdXQgaG93IHRvIGVtdWxkYXRlIEFycmF5IHVzZSBiZXR0ZXJcblx0c29tZSA6IGZ1bmN0aW9uIChjYWxsYmFjaywgY29udGV4dCkge1xuXHRcdHZhciBpID0gMDtcblx0XHRmb3IgKDsgaSA8IHRoaXMuc2l6ZTsgaSsrKSB7XG5cdFx0XHRpZiAoY2FsbGJhY2suY2FsbChjb250ZXh0LCB0aGlzLmRhdGFbKHRoaXMuc3RhcnQgKyBpKSAlIHRoaXMubGVuZ3RoXSwgaSwgdGhpcykpXG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0sXG5cdC8vIGNhbGN1bGF0ZSB0aGUgYXZlcmFnZSB2YWx1ZSBvZiBhIGNpcmN1bGFyIGJ1ZmZlclxuXHRhdmcgOiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuc2l6ZSA9PSAwID8gMCA6ICh0aGlzLnN1bSgpIC8gdGhpcy5zaXplKTtcblx0fSxcblx0Ly8gbG9vcCB0aHJvdWdoIGVhY2ggaXRlbSBpbiBidWZmZXIgYW5kIGNhbGN1bGF0ZSBzdW1cblx0c3VtIDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpbmRleCA9IHRoaXMuc2l6ZTtcblx0XHR2YXIgcyA9IDA7XG5cdFx0d2hpbGUgKGluZGV4LS0pIHMgKz0gdGhpcy5kYXRhW2luZGV4XTtcblx0XHRyZXR1cm4gcztcblx0fSxcblx0Ly8gbG9vcCB0aHJvdWdoIGVhY2ggaXRlbSBpbiBidWZmZXIgYW5kIGNhbGN1bGF0ZSBtZWRpYW5cblx0bWVkaWFuIDogZnVuY3Rpb24gKCkge1xuXHRcdGlmICh0aGlzLnNpemUgPT09IDApXG5cdFx0XHRyZXR1cm4gMDtcblx0XHR2YXIgdmFsdWVzID0gdGhpcy5zbGljZSgpLnNvcnQoZGVmYXVsdENvbXBhcml0b3IpO1xuXHRcdHZhciBoYWxmID0gTWF0aC5mbG9vcih2YWx1ZXMubGVuZ3RoIC8gMik7XG5cdFx0aWYodmFsdWVzLmxlbmd0aCAlIDIpXG5cdFx0XHRyZXR1cm4gdmFsdWVzW2hhbGZdO1xuXHRcdGVsc2Vcblx0XHRcdHJldHVybiAodmFsdWVzW2hhbGYtMV0gKyB2YWx1ZXNbaGFsZl0pIC8gMi4wO1xuXHR9LFxuXHQvKiB1dGlsaXR5IG1ldGhvZHMgKi9cblx0Ly8gcmVzZXQgcG9pbnRlcnMgdG8gYnVmZmVyIHdpdGggemVybyBpdGVtc1xuXHQvLyBub3RlOiB0aGlzIHdpbGwgbm90IHJlbW92ZSB2YWx1ZXMgaW4gY2J1ZmZlciwgc28gaWYgZm9yIHNlY3VyaXR5IHZhbHVlc1xuXHQvLyAgICAgICBuZWVkIHRvIGJlIG92ZXJ3cml0dGVuLCBydW4gYC5maWxsKG51bGwpLmVtcHR5KClgXG5cdGVtcHR5IDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpID0gMDtcblx0XHR0aGlzLnNpemUgPSB0aGlzLnN0YXJ0ID0gMDtcblx0XHR0aGlzLmVuZCA9IHRoaXMubGVuZ3RoIC0gMTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0Ly8gZmlsbCBhbGwgcGxhY2VzIHdpdGggcGFzc2VkIHZhbHVlIG9yIGZ1bmN0aW9uXG5cdGZpbGwgOiBmdW5jdGlvbiAoYXJnKSB7XG5cdFx0dmFyIGkgPSAwO1xuXHRcdGlmICh0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHR3aGlsZSh0aGlzLmRhdGFbaV0gPSBhcmcoKSwgKytpIDwgdGhpcy5sZW5ndGgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR3aGlsZSh0aGlzLmRhdGFbaV0gPSBhcmcsICsraSA8IHRoaXMubGVuZ3RoKTtcblx0XHR9XG5cdFx0Ly8gcmVwb3NpdGlvbiBzdGFydC9lbmRcblx0XHR0aGlzLnN0YXJ0ID0gMDtcblx0XHR0aGlzLmVuZCA9IHRoaXMubGVuZ3RoIC0gMTtcblx0XHR0aGlzLnNpemUgPSB0aGlzLmxlbmd0aDtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0Ly8gcmV0dXJuIGZpcnN0IGl0ZW0gaW4gYnVmZmVyXG5cdGZpcnN0IDogZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLmRhdGFbdGhpcy5zdGFydF07XG5cdH0sXG5cdC8vIHJldHVybiBsYXN0IGl0ZW0gaW4gYnVmZmVyXG5cdGxhc3QgOiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuZGF0YVt0aGlzLmVuZF07XG5cdH0sXG5cdC8vIHJldHVybiBzcGVjaWZpYyBpbmRleCBpbiBidWZmZXJcblx0Z2V0IDogZnVuY3Rpb24gKGFyZykge1xuXHRcdHJldHVybiB0aGlzLmRhdGFbKHRoaXMuc3RhcnQgKyBhcmcpICUgdGhpcy5sZW5ndGhdO1xuXHR9LFxuXHRpc0Z1bGwgOiBmdW5jdGlvbiAoYXJnKSB7XG5cdFx0cmV0dXJuIHRoaXMubGVuZ3RoID09PSB0aGlzLnNpemU7XG5cdH0sXG5cdC8vIHNldCB2YWx1ZSBhdCBzcGVjaWZpZWQgaW5kZXhcblx0c2V0IDogZnVuY3Rpb24gKGlkeCwgYXJnKSB7XG5cdFx0cmV0dXJuIHRoaXMuZGF0YVsodGhpcy5zdGFydCArIGlkeCkgJSB0aGlzLmxlbmd0aF0gPSBhcmc7XG5cdH0sXG5cdC8vIHJldHVybiBjbGVhbiBhcnJheSBvZiB2YWx1ZXNcblx0dG9BcnJheSA6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpcy5zbGljZSgpO1xuXHR9LFxuXHQvLyBzbGljZSB0aGUgYnVmZmVyIHRvIGFuIGFycmFheVxuXHRzbGljZSA6IGZ1bmN0aW9uIChzdGFydCwgZW5kKSB7XG5cdFx0dmFyIGxlbmd0aCA9IHRoaXMuc2l6ZTtcblxuXHRcdHN0YXJ0ID0gK3N0YXJ0IHx8IDA7XG5cblx0XHRpZiAoc3RhcnQgPCAwKSB7XG5cdFx0XHRpZiAoc3RhcnQgPj0gZW5kKVxuXHRcdFx0XHRyZXR1cm4gW107XG5cdFx0XHRzdGFydCA9ICgtc3RhcnQgPiBsZW5ndGgpID8gMCA6IGxlbmd0aCArIHN0YXJ0O1xuXHRcdH1cblxuXHRcdGlmIChlbmQgPT0gbnVsbCB8fCBlbmQgPiBsZW5ndGgpXG5cdFx0XHRlbmQgPSBsZW5ndGg7XG5cdFx0ZWxzZSBpZiAoZW5kIDwgMClcblx0XHRcdGVuZCArPSBsZW5ndGg7XG5cdFx0ZWxzZVxuXHRcdFx0ZW5kID0gK2VuZCB8fCAwO1xuXG5cdFx0bGVuZ3RoID0gc3RhcnQgPCBlbmQgPyBlbmQgLSBzdGFydCA6IDA7XG5cblx0XHR2YXIgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKTtcblx0XHRmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG5cdFx0XHRyZXN1bHRbaW5kZXhdID0gdGhpcy5kYXRhWyh0aGlzLnN0YXJ0ICsgc3RhcnQgKyBpbmRleCkgJSB0aGlzLmxlbmd0aF07XG5cdFx0fVxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH1cbn07XG5cbmlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykgbW9kdWxlLmV4cG9ydHMgPSBDQnVmZmVyO1xuZWxzZSBnbG9iYWwuQ0J1ZmZlciA9IENCdWZmZXI7XG5cbn0odGhpcykpO1xuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIHBvb2wgPSByZXF1aXJlKFwidHlwZWRhcnJheS1wb29sXCIpXG52YXIgdW5pcSA9IHJlcXVpcmUoXCJ1bmlxXCIpXG52YXIgaW90YSA9IHJlcXVpcmUoXCJpb3RhLWFycmF5XCIpXG5cbmZ1bmN0aW9uIGdlbmVyYXRlTWVzaGVyKG9yZGVyLCBza2lwLCBtZXJnZSwgYXBwZW5kLCBudW1fb3B0aW9ucywgb3B0aW9ucywgdXNlR2V0dGVyKSB7XG4gIHZhciBjb2RlID0gW11cbiAgdmFyIGQgPSBvcmRlci5sZW5ndGhcbiAgdmFyIGksIGosIGtcbiAgXG4gIC8vQnVpbGQgYXJndW1lbnRzIGZvciBhcHBlbmQgbWFjcm9cbiAgdmFyIGFwcGVuZF9hcmdzID0gbmV3IEFycmF5KDIqZCsxK251bV9vcHRpb25zKVxuICBmb3IoaT0wOyBpPGQ7ICsraSkge1xuICAgIGFwcGVuZF9hcmdzW2ldID0gXCJpXCIraVxuICB9XG4gIGZvcihpPTA7IGk8ZDsgKytpKSB7XG4gICAgYXBwZW5kX2FyZ3NbaStkXSA9IFwialwiK2lcbiAgfVxuICBhcHBlbmRfYXJnc1syKmRdID0gXCJvdmFsXCJcbiAgXG4gIHZhciBvcHRfYXJncyA9IG5ldyBBcnJheShudW1fb3B0aW9ucylcbiAgZm9yKGk9MDsgaTxudW1fb3B0aW9uczsgKytpKSB7XG4gICAgb3B0X2FyZ3NbaV0gPSBcIm9wdFwiK2lcbiAgICBhcHBlbmRfYXJnc1syKmQrMStpXSA9IFwib3B0XCIraVxuICB9XG5cbiAgLy9VbnBhY2sgc3RyaWRlIGFuZCBzaGFwZSBhcnJheXMgaW50byB2YXJpYWJsZXNcbiAgY29kZS5wdXNoKFwidmFyIGRhdGE9YXJyYXkuZGF0YSxvZmZzZXQ9YXJyYXkub2Zmc2V0LHNoYXBlPWFycmF5LnNoYXBlLHN0cmlkZT1hcnJheS5zdHJpZGVcIilcbiAgZm9yKHZhciBpPTA7IGk8ZDsgKytpKSB7XG4gICAgY29kZS5wdXNoKFtcInZhciBzdHJpZGVcIixpLFwiPXN0cmlkZVtcIixvcmRlcltpXSxcIl18MCxzaGFwZVwiLGksXCI9c2hhcGVbXCIsb3JkZXJbaV0sXCJdfDBcIl0uam9pbihcIlwiKSlcbiAgICBpZihpID4gMCkge1xuICAgICAgY29kZS5wdXNoKFtcInZhciBhc3RlcFwiLGksXCI9KHN0cmlkZVwiLGksXCItc3RyaWRlXCIsaS0xLFwiKnNoYXBlXCIsaS0xLFwiKXwwXCJdLmpvaW4oXCJcIikpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZGUucHVzaChbXCJ2YXIgYXN0ZXBcIixpLFwiPXN0cmlkZVwiLGksXCJ8MFwiXS5qb2luKFwiXCIpKVxuICAgIH1cbiAgICBpZihpID4gMCkge1xuICAgICAgY29kZS5wdXNoKFtcInZhciB2c3RlcFwiLGksXCI9KHZzdGVwXCIsaS0xLFwiKnNoYXBlXCIsaS0xLFwiKXwwXCJdLmpvaW4oXCJcIikpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZGUucHVzaChbXCJ2YXIgdnN0ZXBcIixpLFwiPTFcIl0uam9pbihcIlwiKSlcbiAgICB9XG4gICAgY29kZS5wdXNoKFtcInZhciBpXCIsaSxcIj0wLGpcIixpLFwiPTAsa1wiLGksXCI9MCx1c3RlcFwiLGksXCI9dnN0ZXBcIixpLFwifDAsYnN0ZXBcIixpLFwiPWFzdGVwXCIsaSxcInwwXCJdLmpvaW4oXCJcIikpXG4gIH1cbiAgXG4gIC8vSW5pdGlhbGl6ZSBwb2ludGVyc1xuICBjb2RlLnB1c2goXCJ2YXIgYV9wdHI9b2Zmc2V0Pj4+MCxiX3B0cj0wLHVfcHRyPTAsdl9wdHI9MCxpPTAsZD0wLHZhbD0wLG92YWw9MFwiKVxuICBcbiAgLy9Jbml0aWFsaXplIGNvdW50XG4gIGNvZGUucHVzaChcInZhciBjb3VudD1cIiArIGlvdGEoZCkubWFwKGZ1bmN0aW9uKGkpIHsgcmV0dXJuIFwic2hhcGVcIitpfSkuam9pbihcIipcIikpXG4gIGNvZGUucHVzaChcInZhciB2aXNpdGVkPW1hbGxvY1VpbnQ4KGNvdW50KVwiKVxuICBcbiAgLy9aZXJvIG91dCB2aXNpdGVkIG1hcFxuICBjb2RlLnB1c2goXCJmb3IoO2k8Y291bnQ7KytpKXt2aXNpdGVkW2ldPTB9XCIpXG4gIFxuICAvL0JlZ2luIHRyYXZlcnNhbFxuICBmb3IoaT1kLTE7IGk+PTA7IC0taSkge1xuICAgIGNvZGUucHVzaChbXCJmb3IoaVwiLGksXCI9MDtpXCIsaSxcIjxzaGFwZVwiLGksXCI7KytpXCIsaSxcIil7XCJdLmpvaW4oXCJcIikpXG4gIH1cbiAgY29kZS5wdXNoKFwiaWYoIXZpc2l0ZWRbdl9wdHJdKXtcIilcbiAgXG4gICAgaWYodXNlR2V0dGVyKSB7XG4gICAgICBjb2RlLnB1c2goXCJ2YWw9ZGF0YS5nZXQoYV9wdHIpXCIpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZGUucHVzaChcInZhbD1kYXRhW2FfcHRyXVwiKVxuICAgIH1cbiAgXG4gICAgaWYoc2tpcCkge1xuICAgICAgY29kZS5wdXNoKFwiaWYoIXNraXAodmFsKSl7XCIpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZGUucHVzaChcImlmKHZhbCE9PTApe1wiKVxuICAgIH1cbiAgXG4gICAgICAvL1NhdmUgdmFsIHRvIG92YWxcbiAgICAgIGNvZGUucHVzaChcIm92YWwgPSB2YWxcIilcbiAgXG4gICAgICAvL0dlbmVyYXRlIG1lcmdpbmcgY29kZVxuICAgICAgZm9yKGk9MDsgaTxkOyArK2kpIHtcbiAgICAgICAgY29kZS5wdXNoKFwidV9wdHI9dl9wdHIrdnN0ZXBcIitpKVxuICAgICAgICBjb2RlLnB1c2goXCJiX3B0cj1hX3B0citzdHJpZGVcIitpKVxuICAgICAgICBjb2RlLnB1c2goW1wialwiLGksXCJfbG9vcDogZm9yKGpcIixpLFwiPTEraVwiLGksXCI7alwiLGksXCI8c2hhcGVcIixpLFwiOysralwiLGksXCIpe1wiXS5qb2luKFwiXCIpKVxuICAgICAgICBmb3Ioaj1pLTE7IGo+PTA7IC0taikge1xuICAgICAgICAgIGNvZGUucHVzaChbXCJmb3Ioa1wiLGosXCI9aVwiLGosXCI7a1wiLGosXCI8alwiLGosXCI7KytrXCIsaixcIil7XCJdLmpvaW4oXCJcIikpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgICAgLy9DaGVjayBpZiB3ZSBjYW4gbWVyZ2UgdGhpcyB2b3hlbFxuICAgICAgICAgIGNvZGUucHVzaChcImlmKHZpc2l0ZWRbdV9wdHJdKSB7IGJyZWFrIGpcIitpK1wiX2xvb3A7IH1cIilcbiAgICAgICAgXG4gICAgICAgICAgaWYodXNlR2V0dGVyKSB7XG4gICAgICAgICAgICBjb2RlLnB1c2goXCJ2YWw9ZGF0YS5nZXQoYl9wdHIpXCIpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvZGUucHVzaChcInZhbD1kYXRhW2JfcHRyXVwiKVxuICAgICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgICAgaWYoc2tpcCAmJiBtZXJnZSkge1xuICAgICAgICAgICAgY29kZS5wdXNoKFwiaWYoc2tpcCh2YWwpIHx8ICFtZXJnZShvdmFsLHZhbCkpeyBicmVhayBqXCIraStcIl9sb29wOyB9XCIpXG4gICAgICAgICAgfSBlbHNlIGlmKHNraXApIHtcbiAgICAgICAgICAgIGNvZGUucHVzaChcImlmKHNraXAodmFsKSB8fCB2YWwgIT09IG92YWwpeyBicmVhayBqXCIraStcIl9sb29wOyB9XCIpXG4gICAgICAgICAgfSBlbHNlIGlmKG1lcmdlKSB7XG4gICAgICAgICAgICBjb2RlLnB1c2goXCJpZih2YWwgPT09IDAgfHwgIW1lcmdlKG92YWwsdmFsKSl7IGJyZWFrIGpcIitpK1wiX2xvb3A7IH1cIilcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29kZS5wdXNoKFwiaWYodmFsID09PSAwIHx8IHZhbCAhPT0gb3ZhbCl7IGJyZWFrIGpcIitpK1wiX2xvb3A7IH1cIilcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy9DbG9zZSBvZmYgbG9vcCBib2RpZXNcbiAgICAgICAgICBjb2RlLnB1c2goXCIrK3VfcHRyXCIpXG4gICAgICAgICAgY29kZS5wdXNoKFwiYl9wdHIrPXN0cmlkZTBcIilcbiAgICAgICAgY29kZS5wdXNoKFwifVwiKVxuICAgICAgICBcbiAgICAgICAgZm9yKGo9MTsgajw9aTsgKytqKSB7XG4gICAgICAgICAgY29kZS5wdXNoKFwidV9wdHIrPXVzdGVwXCIrailcbiAgICAgICAgICBjb2RlLnB1c2goXCJiX3B0cis9YnN0ZXBcIitqKVxuICAgICAgICAgIGNvZGUucHVzaChcIn1cIilcbiAgICAgICAgfVxuICAgICAgICBpZihpIDwgZC0xKSB7XG4gICAgICAgICAgY29kZS5wdXNoKFwiZD1qXCIraStcIi1pXCIraSlcbiAgICAgICAgICBjb2RlLnB1c2goW1widXN0ZXBcIixpKzEsXCI9KHZzdGVwXCIsaSsxLFwiLXZzdGVwXCIsaSxcIipkKXwwXCJdLmpvaW4oXCJcIikpXG4gICAgICAgICAgY29kZS5wdXNoKFtcImJzdGVwXCIsaSsxLFwiPShzdHJpZGVcIixpKzEsXCItc3RyaWRlXCIsaSxcIipkKXwwXCJdLmpvaW4oXCJcIikpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgXG4gICAgICAvL01hcmsgb2ZmIHZpc2l0ZWQgdGFibGVcbiAgICAgIGNvZGUucHVzaChcInVfcHRyPXZfcHRyXCIpXG4gICAgICBmb3IoaT1kLTE7IGk+PTA7IC0taSkge1xuICAgICAgICBjb2RlLnB1c2goW1wiZm9yKGtcIixpLFwiPWlcIixpLFwiO2tcIixpLFwiPGpcIixpLFwiOysra1wiLGksXCIpe1wiXS5qb2luKFwiXCIpKVxuICAgICAgfVxuICAgICAgY29kZS5wdXNoKFwidmlzaXRlZFt1X3B0cisrXT0xXCIpXG4gICAgICBjb2RlLnB1c2goXCJ9XCIpXG4gICAgICBmb3IoaT0xOyBpPGQ7ICsraSkge1xuICAgICAgICBjb2RlLnB1c2goXCJ1X3B0cis9dXN0ZXBcIitpKVxuICAgICAgICBjb2RlLnB1c2goXCJ9XCIpXG4gICAgICB9XG4gIFxuICAgICAgLy9BcHBlbmQgY2h1bmsgdG8gbWVzaFxuICAgICAgY29kZS5wdXNoKFwiYXBwZW5kKFwiKyBhcHBlbmRfYXJncy5qb2luKFwiLFwiKSsgXCIpXCIpXG4gICAgXG4gICAgY29kZS5wdXNoKFwifVwiKVxuICBjb2RlLnB1c2goXCJ9XCIpXG4gIGNvZGUucHVzaChcIisrdl9wdHJcIilcbiAgZm9yKHZhciBpPTA7IGk8ZDsgKytpKSB7XG4gICAgY29kZS5wdXNoKFwiYV9wdHIrPWFzdGVwXCIraSlcbiAgICBjb2RlLnB1c2goXCJ9XCIpXG4gIH1cbiAgXG4gIGNvZGUucHVzaChcImZyZWVVaW50OCh2aXNpdGVkKVwiKVxuICBcbiAgaWYob3B0aW9ucy5kZWJ1Zykge1xuICAgIGNvbnNvbGUubG9nKFwiR0VORVJBVElORyBNRVNIRVI6XCIpXG4gICAgY29uc29sZS5sb2coY29kZS5qb2luKFwiXFxuXCIpKVxuICB9XG4gIFxuICAvL0NvbXBpbGUgcHJvY2VkdXJlXG4gIHZhciBhcmdzID0gW1wiYXBwZW5kXCIsIFwibWFsbG9jVWludDhcIiwgXCJmcmVlVWludDhcIl1cbiAgaWYobWVyZ2UpIHtcbiAgICBhcmdzLnVuc2hpZnQoXCJtZXJnZVwiKVxuICB9XG4gIGlmKHNraXApIHtcbiAgICBhcmdzLnVuc2hpZnQoXCJza2lwXCIpXG4gIH1cbiAgXG4gIC8vQnVpbGQgd3JhcHBlclxuICB2YXIgbG9jYWxfYXJncyA9IFtcImFycmF5XCJdLmNvbmNhdChvcHRfYXJncylcbiAgdmFyIGZ1bmNOYW1lID0gW1wiZ3JlZWR5TWVzaGVyXCIsIGQsIFwiZF9vcmRcIiwgb3JkZXIuam9pbihcInNcIikgLCAoc2tpcCA/IFwic2tpcFwiIDogXCJcIikgLCAobWVyZ2UgPyBcIm1lcmdlXCIgOiBcIlwiKV0uam9pbihcIlwiKVxuICB2YXIgZ2VuX2JvZHkgPSBbXCIndXNlIHN0cmljdCc7ZnVuY3Rpb24gXCIsIGZ1bmNOYW1lLCBcIihcIiwgbG9jYWxfYXJncy5qb2luKFwiLFwiKSwgXCIpe1wiLCBjb2RlLmpvaW4oXCJcXG5cIiksIFwifTtyZXR1cm4gXCIsIGZ1bmNOYW1lXS5qb2luKFwiXCIpXG4gIGFyZ3MucHVzaChnZW5fYm9keSlcbiAgdmFyIHByb2MgPSBGdW5jdGlvbi5hcHBseSh1bmRlZmluZWQsIGFyZ3MpXG4gIFxuICBpZihza2lwICYmIG1lcmdlKSB7XG4gICAgcmV0dXJuIHByb2Moc2tpcCwgbWVyZ2UsIGFwcGVuZCwgcG9vbC5tYWxsb2NVaW50OCwgcG9vbC5mcmVlVWludDgpXG4gIH0gZWxzZSBpZihza2lwKSB7XG4gICAgcmV0dXJuIHByb2Moc2tpcCwgYXBwZW5kLCBwb29sLm1hbGxvY1VpbnQ4LCBwb29sLmZyZWVVaW50OClcbiAgfSBlbHNlIGlmKG1lcmdlKSB7XG4gICAgcmV0dXJuIHByb2MobWVyZ2UsIGFwcGVuZCwgcG9vbC5tYWxsb2NVaW50OCwgcG9vbC5mcmVlVWludDgpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHByb2MoYXBwZW5kLCBwb29sLm1hbGxvY1VpbnQ4LCBwb29sLmZyZWVVaW50OClcbiAgfVxufVxuXG4vL1RoZSBhY3R1YWwgbWVzaCBjb21waWxlclxuZnVuY3Rpb24gY29tcGlsZU1lc2hlcihvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gIGlmKCFvcHRpb25zLm9yZGVyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiZ3JlZWR5LW1lc2hlcjogTWlzc2luZyBvcmRlciBmaWVsZFwiKVxuICB9XG4gIGlmKCFvcHRpb25zLmFwcGVuZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcImdyZWVkeS1tZXNoZXI6IE1pc3NpbmcgYXBwZW5kIGZpZWxkXCIpXG4gIH1cbiAgcmV0dXJuIGdlbmVyYXRlTWVzaGVyKFxuICAgIG9wdGlvbnMub3JkZXIsXG4gICAgb3B0aW9ucy5za2lwLFxuICAgIG9wdGlvbnMubWVyZ2UsXG4gICAgb3B0aW9ucy5hcHBlbmQsXG4gICAgb3B0aW9ucy5leHRyYUFyZ3N8MCxcbiAgICBvcHRpb25zLFxuICAgICEhb3B0aW9ucy51c2VHZXR0ZXJcbiAgKVxufVxubW9kdWxlLmV4cG9ydHMgPSBjb21waWxlTWVzaGVyXG4iLCJcInVzZSBzdHJpY3RcIlxuXG5mdW5jdGlvbiBpb3RhKG4pIHtcbiAgdmFyIHJlc3VsdCA9IG5ldyBBcnJheShuKVxuICBmb3IodmFyIGk9MDsgaTxuOyArK2kpIHtcbiAgICByZXN1bHRbaV0gPSBpXG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlvdGEiLCIvKipcbiAqIEJpdCB0d2lkZGxpbmcgaGFja3MgZm9yIEphdmFTY3JpcHQuXG4gKlxuICogQXV0aG9yOiBNaWtvbGEgTHlzZW5rb1xuICpcbiAqIFBvcnRlZCBmcm9tIFN0YW5mb3JkIGJpdCB0d2lkZGxpbmcgaGFjayBsaWJyYXJ5OlxuICogICAgaHR0cDovL2dyYXBoaWNzLnN0YW5mb3JkLmVkdS9+c2VhbmRlci9iaXRoYWNrcy5odG1sXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7IFwidXNlIHJlc3RyaWN0XCI7XG5cbi8vTnVtYmVyIG9mIGJpdHMgaW4gYW4gaW50ZWdlclxudmFyIElOVF9CSVRTID0gMzI7XG5cbi8vQ29uc3RhbnRzXG5leHBvcnRzLklOVF9CSVRTICA9IElOVF9CSVRTO1xuZXhwb3J0cy5JTlRfTUFYICAgPSAgMHg3ZmZmZmZmZjtcbmV4cG9ydHMuSU5UX01JTiAgID0gLTE8PChJTlRfQklUUy0xKTtcblxuLy9SZXR1cm5zIC0xLCAwLCArMSBkZXBlbmRpbmcgb24gc2lnbiBvZiB4XG5leHBvcnRzLnNpZ24gPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiAodiA+IDApIC0gKHYgPCAwKTtcbn1cblxuLy9Db21wdXRlcyBhYnNvbHV0ZSB2YWx1ZSBvZiBpbnRlZ2VyXG5leHBvcnRzLmFicyA9IGZ1bmN0aW9uKHYpIHtcbiAgdmFyIG1hc2sgPSB2ID4+IChJTlRfQklUUy0xKTtcbiAgcmV0dXJuICh2IF4gbWFzaykgLSBtYXNrO1xufVxuXG4vL0NvbXB1dGVzIG1pbmltdW0gb2YgaW50ZWdlcnMgeCBhbmQgeVxuZXhwb3J0cy5taW4gPSBmdW5jdGlvbih4LCB5KSB7XG4gIHJldHVybiB5IF4gKCh4IF4geSkgJiAtKHggPCB5KSk7XG59XG5cbi8vQ29tcHV0ZXMgbWF4aW11bSBvZiBpbnRlZ2VycyB4IGFuZCB5XG5leHBvcnRzLm1heCA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgcmV0dXJuIHggXiAoKHggXiB5KSAmIC0oeCA8IHkpKTtcbn1cblxuLy9DaGVja3MgaWYgYSBudW1iZXIgaXMgYSBwb3dlciBvZiB0d29cbmV4cG9ydHMuaXNQb3cyID0gZnVuY3Rpb24odikge1xuICByZXR1cm4gISh2ICYgKHYtMSkpICYmICghIXYpO1xufVxuXG4vL0NvbXB1dGVzIGxvZyBiYXNlIDIgb2YgdlxuZXhwb3J0cy5sb2cyID0gZnVuY3Rpb24odikge1xuICB2YXIgciwgc2hpZnQ7XG4gIHIgPSAgICAgKHYgPiAweEZGRkYpIDw8IDQ7IHYgPj4+PSByO1xuICBzaGlmdCA9ICh2ID4gMHhGRiAgKSA8PCAzOyB2ID4+Pj0gc2hpZnQ7IHIgfD0gc2hpZnQ7XG4gIHNoaWZ0ID0gKHYgPiAweEYgICApIDw8IDI7IHYgPj4+PSBzaGlmdDsgciB8PSBzaGlmdDtcbiAgc2hpZnQgPSAodiA+IDB4MyAgICkgPDwgMTsgdiA+Pj49IHNoaWZ0OyByIHw9IHNoaWZ0O1xuICByZXR1cm4gciB8ICh2ID4+IDEpO1xufVxuXG4vL0NvbXB1dGVzIGxvZyBiYXNlIDEwIG9mIHZcbmV4cG9ydHMubG9nMTAgPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiAgKHYgPj0gMTAwMDAwMDAwMCkgPyA5IDogKHYgPj0gMTAwMDAwMDAwKSA/IDggOiAodiA+PSAxMDAwMDAwMCkgPyA3IDpcbiAgICAgICAgICAodiA+PSAxMDAwMDAwKSA/IDYgOiAodiA+PSAxMDAwMDApID8gNSA6ICh2ID49IDEwMDAwKSA/IDQgOlxuICAgICAgICAgICh2ID49IDEwMDApID8gMyA6ICh2ID49IDEwMCkgPyAyIDogKHYgPj0gMTApID8gMSA6IDA7XG59XG5cbi8vQ291bnRzIG51bWJlciBvZiBiaXRzXG5leHBvcnRzLnBvcENvdW50ID0gZnVuY3Rpb24odikge1xuICB2ID0gdiAtICgodiA+Pj4gMSkgJiAweDU1NTU1NTU1KTtcbiAgdiA9ICh2ICYgMHgzMzMzMzMzMykgKyAoKHYgPj4+IDIpICYgMHgzMzMzMzMzMyk7XG4gIHJldHVybiAoKHYgKyAodiA+Pj4gNCkgJiAweEYwRjBGMEYpICogMHgxMDEwMTAxKSA+Pj4gMjQ7XG59XG5cbi8vQ291bnRzIG51bWJlciBvZiB0cmFpbGluZyB6ZXJvc1xuZnVuY3Rpb24gY291bnRUcmFpbGluZ1plcm9zKHYpIHtcbiAgdmFyIGMgPSAzMjtcbiAgdiAmPSAtdjtcbiAgaWYgKHYpIGMtLTtcbiAgaWYgKHYgJiAweDAwMDBGRkZGKSBjIC09IDE2O1xuICBpZiAodiAmIDB4MDBGRjAwRkYpIGMgLT0gODtcbiAgaWYgKHYgJiAweDBGMEYwRjBGKSBjIC09IDQ7XG4gIGlmICh2ICYgMHgzMzMzMzMzMykgYyAtPSAyO1xuICBpZiAodiAmIDB4NTU1NTU1NTUpIGMgLT0gMTtcbiAgcmV0dXJuIGM7XG59XG5leHBvcnRzLmNvdW50VHJhaWxpbmdaZXJvcyA9IGNvdW50VHJhaWxpbmdaZXJvcztcblxuLy9Sb3VuZHMgdG8gbmV4dCBwb3dlciBvZiAyXG5leHBvcnRzLm5leHRQb3cyID0gZnVuY3Rpb24odikge1xuICB2ICs9IHYgPT09IDA7XG4gIC0tdjtcbiAgdiB8PSB2ID4+PiAxO1xuICB2IHw9IHYgPj4+IDI7XG4gIHYgfD0gdiA+Pj4gNDtcbiAgdiB8PSB2ID4+PiA4O1xuICB2IHw9IHYgPj4+IDE2O1xuICByZXR1cm4gdiArIDE7XG59XG5cbi8vUm91bmRzIGRvd24gdG8gcHJldmlvdXMgcG93ZXIgb2YgMlxuZXhwb3J0cy5wcmV2UG93MiA9IGZ1bmN0aW9uKHYpIHtcbiAgdiB8PSB2ID4+PiAxO1xuICB2IHw9IHYgPj4+IDI7XG4gIHYgfD0gdiA+Pj4gNDtcbiAgdiB8PSB2ID4+PiA4O1xuICB2IHw9IHYgPj4+IDE2O1xuICByZXR1cm4gdiAtICh2Pj4+MSk7XG59XG5cbi8vQ29tcHV0ZXMgcGFyaXR5IG9mIHdvcmRcbmV4cG9ydHMucGFyaXR5ID0gZnVuY3Rpb24odikge1xuICB2IF49IHYgPj4+IDE2O1xuICB2IF49IHYgPj4+IDg7XG4gIHYgXj0gdiA+Pj4gNDtcbiAgdiAmPSAweGY7XG4gIHJldHVybiAoMHg2OTk2ID4+PiB2KSAmIDE7XG59XG5cbnZhciBSRVZFUlNFX1RBQkxFID0gbmV3IEFycmF5KDI1Nik7XG5cbihmdW5jdGlvbih0YWIpIHtcbiAgZm9yKHZhciBpPTA7IGk8MjU2OyArK2kpIHtcbiAgICB2YXIgdiA9IGksIHIgPSBpLCBzID0gNztcbiAgICBmb3IgKHYgPj4+PSAxOyB2OyB2ID4+Pj0gMSkge1xuICAgICAgciA8PD0gMTtcbiAgICAgIHIgfD0gdiAmIDE7XG4gICAgICAtLXM7XG4gICAgfVxuICAgIHRhYltpXSA9IChyIDw8IHMpICYgMHhmZjtcbiAgfVxufSkoUkVWRVJTRV9UQUJMRSk7XG5cbi8vUmV2ZXJzZSBiaXRzIGluIGEgMzIgYml0IHdvcmRcbmV4cG9ydHMucmV2ZXJzZSA9IGZ1bmN0aW9uKHYpIHtcbiAgcmV0dXJuICAoUkVWRVJTRV9UQUJMRVsgdiAgICAgICAgICYgMHhmZl0gPDwgMjQpIHxcbiAgICAgICAgICAoUkVWRVJTRV9UQUJMRVsodiA+Pj4gOCkgICYgMHhmZl0gPDwgMTYpIHxcbiAgICAgICAgICAoUkVWRVJTRV9UQUJMRVsodiA+Pj4gMTYpICYgMHhmZl0gPDwgOCkgIHxcbiAgICAgICAgICAgUkVWRVJTRV9UQUJMRVsodiA+Pj4gMjQpICYgMHhmZl07XG59XG5cbi8vSW50ZXJsZWF2ZSBiaXRzIG9mIDIgY29vcmRpbmF0ZXMgd2l0aCAxNiBiaXRzLiAgVXNlZnVsIGZvciBmYXN0IHF1YWR0cmVlIGNvZGVzXG5leHBvcnRzLmludGVybGVhdmUyID0gZnVuY3Rpb24oeCwgeSkge1xuICB4ICY9IDB4RkZGRjtcbiAgeCA9ICh4IHwgKHggPDwgOCkpICYgMHgwMEZGMDBGRjtcbiAgeCA9ICh4IHwgKHggPDwgNCkpICYgMHgwRjBGMEYwRjtcbiAgeCA9ICh4IHwgKHggPDwgMikpICYgMHgzMzMzMzMzMztcbiAgeCA9ICh4IHwgKHggPDwgMSkpICYgMHg1NTU1NTU1NTtcblxuICB5ICY9IDB4RkZGRjtcbiAgeSA9ICh5IHwgKHkgPDwgOCkpICYgMHgwMEZGMDBGRjtcbiAgeSA9ICh5IHwgKHkgPDwgNCkpICYgMHgwRjBGMEYwRjtcbiAgeSA9ICh5IHwgKHkgPDwgMikpICYgMHgzMzMzMzMzMztcbiAgeSA9ICh5IHwgKHkgPDwgMSkpICYgMHg1NTU1NTU1NTtcblxuICByZXR1cm4geCB8ICh5IDw8IDEpO1xufVxuXG4vL0V4dHJhY3RzIHRoZSBudGggaW50ZXJsZWF2ZWQgY29tcG9uZW50XG5leHBvcnRzLmRlaW50ZXJsZWF2ZTIgPSBmdW5jdGlvbih2LCBuKSB7XG4gIHYgPSAodiA+Pj4gbikgJiAweDU1NTU1NTU1O1xuICB2ID0gKHYgfCAodiA+Pj4gMSkpICAmIDB4MzMzMzMzMzM7XG4gIHYgPSAodiB8ICh2ID4+PiAyKSkgICYgMHgwRjBGMEYwRjtcbiAgdiA9ICh2IHwgKHYgPj4+IDQpKSAgJiAweDAwRkYwMEZGO1xuICB2ID0gKHYgfCAodiA+Pj4gMTYpKSAmIDB4MDAwRkZGRjtcbiAgcmV0dXJuICh2IDw8IDE2KSA+PiAxNjtcbn1cblxuXG4vL0ludGVybGVhdmUgYml0cyBvZiAzIGNvb3JkaW5hdGVzLCBlYWNoIHdpdGggMTAgYml0cy4gIFVzZWZ1bCBmb3IgZmFzdCBvY3RyZWUgY29kZXNcbmV4cG9ydHMuaW50ZXJsZWF2ZTMgPSBmdW5jdGlvbih4LCB5LCB6KSB7XG4gIHggJj0gMHgzRkY7XG4gIHggID0gKHggfCAoeDw8MTYpKSAmIDQyNzgxOTAzMzU7XG4gIHggID0gKHggfCAoeDw8OCkpICAmIDI1MTcxOTY5NTtcbiAgeCAgPSAoeCB8ICh4PDw0KSkgICYgMzI3MjM1NjAzNTtcbiAgeCAgPSAoeCB8ICh4PDwyKSkgICYgMTIyNzEzMzUxMztcblxuICB5ICY9IDB4M0ZGO1xuICB5ICA9ICh5IHwgKHk8PDE2KSkgJiA0Mjc4MTkwMzM1O1xuICB5ICA9ICh5IHwgKHk8PDgpKSAgJiAyNTE3MTk2OTU7XG4gIHkgID0gKHkgfCAoeTw8NCkpICAmIDMyNzIzNTYwMzU7XG4gIHkgID0gKHkgfCAoeTw8MikpICAmIDEyMjcxMzM1MTM7XG4gIHggfD0gKHkgPDwgMSk7XG4gIFxuICB6ICY9IDB4M0ZGO1xuICB6ICA9ICh6IHwgKHo8PDE2KSkgJiA0Mjc4MTkwMzM1O1xuICB6ICA9ICh6IHwgKHo8PDgpKSAgJiAyNTE3MTk2OTU7XG4gIHogID0gKHogfCAoejw8NCkpICAmIDMyNzIzNTYwMzU7XG4gIHogID0gKHogfCAoejw8MikpICAmIDEyMjcxMzM1MTM7XG4gIFxuICByZXR1cm4geCB8ICh6IDw8IDIpO1xufVxuXG4vL0V4dHJhY3RzIG50aCBpbnRlcmxlYXZlZCBjb21wb25lbnQgb2YgYSAzLXR1cGxlXG5leHBvcnRzLmRlaW50ZXJsZWF2ZTMgPSBmdW5jdGlvbih2LCBuKSB7XG4gIHYgPSAodiA+Pj4gbikgICAgICAgJiAxMjI3MTMzNTEzO1xuICB2ID0gKHYgfCAodj4+PjIpKSAgICYgMzI3MjM1NjAzNTtcbiAgdiA9ICh2IHwgKHY+Pj40KSkgICAmIDI1MTcxOTY5NTtcbiAgdiA9ICh2IHwgKHY+Pj44KSkgICAmIDQyNzgxOTAzMzU7XG4gIHYgPSAodiB8ICh2Pj4+MTYpKSAgJiAweDNGRjtcbiAgcmV0dXJuICh2PDwyMik+PjIyO1xufVxuXG4vL0NvbXB1dGVzIG5leHQgY29tYmluYXRpb24gaW4gY29sZXhpY29ncmFwaGljIG9yZGVyICh0aGlzIGlzIG1pc3Rha2VubHkgY2FsbGVkIG5leHRQZXJtdXRhdGlvbiBvbiB0aGUgYml0IHR3aWRkbGluZyBoYWNrcyBwYWdlKVxuZXhwb3J0cy5uZXh0Q29tYmluYXRpb24gPSBmdW5jdGlvbih2KSB7XG4gIHZhciB0ID0gdiB8ICh2IC0gMSk7XG4gIHJldHVybiAodCArIDEpIHwgKCgofnQgJiAtfnQpIC0gMSkgPj4+IChjb3VudFRyYWlsaW5nWmVyb3ModikgKyAxKSk7XG59XG5cbiIsIlwidXNlIHN0cmljdFwiXG5cbmZ1bmN0aW9uIGR1cGVfYXJyYXkoY291bnQsIHZhbHVlLCBpKSB7XG4gIHZhciBjID0gY291bnRbaV18MFxuICBpZihjIDw9IDApIHtcbiAgICByZXR1cm4gW11cbiAgfVxuICB2YXIgcmVzdWx0ID0gbmV3IEFycmF5KGMpLCBqXG4gIGlmKGkgPT09IGNvdW50Lmxlbmd0aC0xKSB7XG4gICAgZm9yKGo9MDsgajxjOyArK2opIHtcbiAgICAgIHJlc3VsdFtqXSA9IHZhbHVlXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGZvcihqPTA7IGo8YzsgKytqKSB7XG4gICAgICByZXN1bHRbal0gPSBkdXBlX2FycmF5KGNvdW50LCB2YWx1ZSwgaSsxKVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIGR1cGVfbnVtYmVyKGNvdW50LCB2YWx1ZSkge1xuICB2YXIgcmVzdWx0LCBpXG4gIHJlc3VsdCA9IG5ldyBBcnJheShjb3VudClcbiAgZm9yKGk9MDsgaTxjb3VudDsgKytpKSB7XG4gICAgcmVzdWx0W2ldID0gdmFsdWVcbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIGR1cGUoY291bnQsIHZhbHVlKSB7XG4gIGlmKHR5cGVvZiB2YWx1ZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHZhbHVlID0gMFxuICB9XG4gIHN3aXRjaCh0eXBlb2YgY291bnQpIHtcbiAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgICBpZihjb3VudCA+IDApIHtcbiAgICAgICAgcmV0dXJuIGR1cGVfbnVtYmVyKGNvdW50fDAsIHZhbHVlKVxuICAgICAgfVxuICAgIGJyZWFrXG4gICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgaWYodHlwZW9mIChjb3VudC5sZW5ndGgpID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHJldHVybiBkdXBlX2FycmF5KGNvdW50LCB2YWx1ZSwgMClcbiAgICAgIH1cbiAgICBicmVha1xuICB9XG4gIHJldHVybiBbXVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGR1cGUiLCIndXNlIHN0cmljdCdcblxudmFyIGJpdHMgPSByZXF1aXJlKCdiaXQtdHdpZGRsZScpXG52YXIgZHVwID0gcmVxdWlyZSgnZHVwJylcblxuLy9MZWdhY3kgcG9vbCBzdXBwb3J0XG5pZighZ2xvYmFsLl9fVFlQRURBUlJBWV9QT09MKSB7XG4gIGdsb2JhbC5fX1RZUEVEQVJSQVlfUE9PTCA9IHtcbiAgICAgIFVJTlQ4ICAgOiBkdXAoWzMyLCAwXSlcbiAgICAsIFVJTlQxNiAgOiBkdXAoWzMyLCAwXSlcbiAgICAsIFVJTlQzMiAgOiBkdXAoWzMyLCAwXSlcbiAgICAsIElOVDggICAgOiBkdXAoWzMyLCAwXSlcbiAgICAsIElOVDE2ICAgOiBkdXAoWzMyLCAwXSlcbiAgICAsIElOVDMyICAgOiBkdXAoWzMyLCAwXSlcbiAgICAsIEZMT0FUICAgOiBkdXAoWzMyLCAwXSlcbiAgICAsIERPVUJMRSAgOiBkdXAoWzMyLCAwXSlcbiAgICAsIERBVEEgICAgOiBkdXAoWzMyLCAwXSlcbiAgICAsIFVJTlQ4QyAgOiBkdXAoWzMyLCAwXSlcbiAgICAsIEJVRkZFUiAgOiBkdXAoWzMyLCAwXSlcbiAgfVxufVxuXG52YXIgaGFzVWludDhDID0gKHR5cGVvZiBVaW50OENsYW1wZWRBcnJheSkgIT09ICd1bmRlZmluZWQnXG52YXIgUE9PTCA9IGdsb2JhbC5fX1RZUEVEQVJSQVlfUE9PTFxuXG4vL1VwZ3JhZGUgcG9vbFxuaWYoIVBPT0wuVUlOVDhDKSB7XG4gIFBPT0wuVUlOVDhDID0gZHVwKFszMiwgMF0pXG59XG5pZighUE9PTC5CVUZGRVIpIHtcbiAgUE9PTC5CVUZGRVIgPSBkdXAoWzMyLCAwXSlcbn1cblxuLy9OZXcgdGVjaG5pcXVlOiBPbmx5IGFsbG9jYXRlIGZyb20gQXJyYXlCdWZmZXJWaWV3IGFuZCBCdWZmZXJcbnZhciBEQVRBICAgID0gUE9PTC5EQVRBXG4gICwgQlVGRkVSICA9IFBPT0wuQlVGRkVSXG5cbmV4cG9ydHMuZnJlZSA9IGZ1bmN0aW9uIGZyZWUoYXJyYXkpIHtcbiAgaWYoQnVmZmVyLmlzQnVmZmVyKGFycmF5KSkge1xuICAgIEJVRkZFUltiaXRzLmxvZzIoYXJyYXkubGVuZ3RoKV0ucHVzaChhcnJheSlcbiAgfSBlbHNlIHtcbiAgICBpZihPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJyYXkpICE9PSAnW29iamVjdCBBcnJheUJ1ZmZlcl0nKSB7XG4gICAgICBhcnJheSA9IGFycmF5LmJ1ZmZlclxuICAgIH1cbiAgICBpZighYXJyYXkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB2YXIgbiA9IGFycmF5Lmxlbmd0aCB8fCBhcnJheS5ieXRlTGVuZ3RoXG4gICAgdmFyIGxvZ19uID0gYml0cy5sb2cyKG4pfDBcbiAgICBEQVRBW2xvZ19uXS5wdXNoKGFycmF5KVxuICB9XG59XG5cbmZ1bmN0aW9uIGZyZWVBcnJheUJ1ZmZlcihidWZmZXIpIHtcbiAgaWYoIWJ1ZmZlcikge1xuICAgIHJldHVyblxuICB9XG4gIHZhciBuID0gYnVmZmVyLmxlbmd0aCB8fCBidWZmZXIuYnl0ZUxlbmd0aFxuICB2YXIgbG9nX24gPSBiaXRzLmxvZzIobilcbiAgREFUQVtsb2dfbl0ucHVzaChidWZmZXIpXG59XG5cbmZ1bmN0aW9uIGZyZWVUeXBlZEFycmF5KGFycmF5KSB7XG4gIGZyZWVBcnJheUJ1ZmZlcihhcnJheS5idWZmZXIpXG59XG5cbmV4cG9ydHMuZnJlZVVpbnQ4ID1cbmV4cG9ydHMuZnJlZVVpbnQxNiA9XG5leHBvcnRzLmZyZWVVaW50MzIgPVxuZXhwb3J0cy5mcmVlSW50OCA9XG5leHBvcnRzLmZyZWVJbnQxNiA9XG5leHBvcnRzLmZyZWVJbnQzMiA9XG5leHBvcnRzLmZyZWVGbG9hdDMyID0gXG5leHBvcnRzLmZyZWVGbG9hdCA9XG5leHBvcnRzLmZyZWVGbG9hdDY0ID0gXG5leHBvcnRzLmZyZWVEb3VibGUgPSBcbmV4cG9ydHMuZnJlZVVpbnQ4Q2xhbXBlZCA9IFxuZXhwb3J0cy5mcmVlRGF0YVZpZXcgPSBmcmVlVHlwZWRBcnJheVxuXG5leHBvcnRzLmZyZWVBcnJheUJ1ZmZlciA9IGZyZWVBcnJheUJ1ZmZlclxuXG5leHBvcnRzLmZyZWVCdWZmZXIgPSBmdW5jdGlvbiBmcmVlQnVmZmVyKGFycmF5KSB7XG4gIEJVRkZFUltiaXRzLmxvZzIoYXJyYXkubGVuZ3RoKV0ucHVzaChhcnJheSlcbn1cblxuZXhwb3J0cy5tYWxsb2MgPSBmdW5jdGlvbiBtYWxsb2MobiwgZHR5cGUpIHtcbiAgaWYoZHR5cGUgPT09IHVuZGVmaW5lZCB8fCBkdHlwZSA9PT0gJ2FycmF5YnVmZmVyJykge1xuICAgIHJldHVybiBtYWxsb2NBcnJheUJ1ZmZlcihuKVxuICB9IGVsc2Uge1xuICAgIHN3aXRjaChkdHlwZSkge1xuICAgICAgY2FzZSAndWludDgnOlxuICAgICAgICByZXR1cm4gbWFsbG9jVWludDgobilcbiAgICAgIGNhc2UgJ3VpbnQxNic6XG4gICAgICAgIHJldHVybiBtYWxsb2NVaW50MTYobilcbiAgICAgIGNhc2UgJ3VpbnQzMic6XG4gICAgICAgIHJldHVybiBtYWxsb2NVaW50MzIobilcbiAgICAgIGNhc2UgJ2ludDgnOlxuICAgICAgICByZXR1cm4gbWFsbG9jSW50OChuKVxuICAgICAgY2FzZSAnaW50MTYnOlxuICAgICAgICByZXR1cm4gbWFsbG9jSW50MTYobilcbiAgICAgIGNhc2UgJ2ludDMyJzpcbiAgICAgICAgcmV0dXJuIG1hbGxvY0ludDMyKG4pXG4gICAgICBjYXNlICdmbG9hdCc6XG4gICAgICBjYXNlICdmbG9hdDMyJzpcbiAgICAgICAgcmV0dXJuIG1hbGxvY0Zsb2F0KG4pXG4gICAgICBjYXNlICdkb3VibGUnOlxuICAgICAgY2FzZSAnZmxvYXQ2NCc6XG4gICAgICAgIHJldHVybiBtYWxsb2NEb3VibGUobilcbiAgICAgIGNhc2UgJ3VpbnQ4X2NsYW1wZWQnOlxuICAgICAgICByZXR1cm4gbWFsbG9jVWludDhDbGFtcGVkKG4pXG4gICAgICBjYXNlICdidWZmZXInOlxuICAgICAgICByZXR1cm4gbWFsbG9jQnVmZmVyKG4pXG4gICAgICBjYXNlICdkYXRhJzpcbiAgICAgIGNhc2UgJ2RhdGF2aWV3JzpcbiAgICAgICAgcmV0dXJuIG1hbGxvY0RhdGFWaWV3KG4pXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBudWxsXG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsXG59XG5cbmZ1bmN0aW9uIG1hbGxvY0FycmF5QnVmZmVyKG4pIHtcbiAgdmFyIG4gPSBiaXRzLm5leHRQb3cyKG4pXG4gIHZhciBsb2dfbiA9IGJpdHMubG9nMihuKVxuICB2YXIgZCA9IERBVEFbbG9nX25dXG4gIGlmKGQubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBkLnBvcCgpXG4gIH1cbiAgcmV0dXJuIG5ldyBBcnJheUJ1ZmZlcihuKVxufVxuZXhwb3J0cy5tYWxsb2NBcnJheUJ1ZmZlciA9IG1hbGxvY0FycmF5QnVmZmVyXG5cbmZ1bmN0aW9uIG1hbGxvY1VpbnQ4KG4pIHtcbiAgcmV0dXJuIG5ldyBVaW50OEFycmF5KG1hbGxvY0FycmF5QnVmZmVyKG4pLCAwLCBuKVxufVxuZXhwb3J0cy5tYWxsb2NVaW50OCA9IG1hbGxvY1VpbnQ4XG5cbmZ1bmN0aW9uIG1hbGxvY1VpbnQxNihuKSB7XG4gIHJldHVybiBuZXcgVWludDE2QXJyYXkobWFsbG9jQXJyYXlCdWZmZXIoMipuKSwgMCwgbilcbn1cbmV4cG9ydHMubWFsbG9jVWludDE2ID0gbWFsbG9jVWludDE2XG5cbmZ1bmN0aW9uIG1hbGxvY1VpbnQzMihuKSB7XG4gIHJldHVybiBuZXcgVWludDMyQXJyYXkobWFsbG9jQXJyYXlCdWZmZXIoNCpuKSwgMCwgbilcbn1cbmV4cG9ydHMubWFsbG9jVWludDMyID0gbWFsbG9jVWludDMyXG5cbmZ1bmN0aW9uIG1hbGxvY0ludDgobikge1xuICByZXR1cm4gbmV3IEludDhBcnJheShtYWxsb2NBcnJheUJ1ZmZlcihuKSwgMCwgbilcbn1cbmV4cG9ydHMubWFsbG9jSW50OCA9IG1hbGxvY0ludDhcblxuZnVuY3Rpb24gbWFsbG9jSW50MTYobikge1xuICByZXR1cm4gbmV3IEludDE2QXJyYXkobWFsbG9jQXJyYXlCdWZmZXIoMipuKSwgMCwgbilcbn1cbmV4cG9ydHMubWFsbG9jSW50MTYgPSBtYWxsb2NJbnQxNlxuXG5mdW5jdGlvbiBtYWxsb2NJbnQzMihuKSB7XG4gIHJldHVybiBuZXcgSW50MzJBcnJheShtYWxsb2NBcnJheUJ1ZmZlcig0Km4pLCAwLCBuKVxufVxuZXhwb3J0cy5tYWxsb2NJbnQzMiA9IG1hbGxvY0ludDMyXG5cbmZ1bmN0aW9uIG1hbGxvY0Zsb2F0KG4pIHtcbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkobWFsbG9jQXJyYXlCdWZmZXIoNCpuKSwgMCwgbilcbn1cbmV4cG9ydHMubWFsbG9jRmxvYXQzMiA9IGV4cG9ydHMubWFsbG9jRmxvYXQgPSBtYWxsb2NGbG9hdFxuXG5mdW5jdGlvbiBtYWxsb2NEb3VibGUobikge1xuICByZXR1cm4gbmV3IEZsb2F0NjRBcnJheShtYWxsb2NBcnJheUJ1ZmZlcig4Km4pLCAwLCBuKVxufVxuZXhwb3J0cy5tYWxsb2NGbG9hdDY0ID0gZXhwb3J0cy5tYWxsb2NEb3VibGUgPSBtYWxsb2NEb3VibGVcblxuZnVuY3Rpb24gbWFsbG9jVWludDhDbGFtcGVkKG4pIHtcbiAgaWYoaGFzVWludDhDKSB7XG4gICAgcmV0dXJuIG5ldyBVaW50OENsYW1wZWRBcnJheShtYWxsb2NBcnJheUJ1ZmZlcihuKSwgMCwgbilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbWFsbG9jVWludDgobilcbiAgfVxufVxuZXhwb3J0cy5tYWxsb2NVaW50OENsYW1wZWQgPSBtYWxsb2NVaW50OENsYW1wZWRcblxuZnVuY3Rpb24gbWFsbG9jRGF0YVZpZXcobikge1xuICByZXR1cm4gbmV3IERhdGFWaWV3KG1hbGxvY0FycmF5QnVmZmVyKG4pLCAwLCBuKVxufVxuZXhwb3J0cy5tYWxsb2NEYXRhVmlldyA9IG1hbGxvY0RhdGFWaWV3XG5cbmZ1bmN0aW9uIG1hbGxvY0J1ZmZlcihuKSB7XG4gIG4gPSBiaXRzLm5leHRQb3cyKG4pXG4gIHZhciBsb2dfbiA9IGJpdHMubG9nMihuKVxuICB2YXIgY2FjaGUgPSBCVUZGRVJbbG9nX25dXG4gIGlmKGNhY2hlLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gY2FjaGUucG9wKClcbiAgfVxuICByZXR1cm4gbmV3IEJ1ZmZlcihuKVxufVxuZXhwb3J0cy5tYWxsb2NCdWZmZXIgPSBtYWxsb2NCdWZmZXJcblxuZXhwb3J0cy5jbGVhckNhY2hlID0gZnVuY3Rpb24gY2xlYXJDYWNoZSgpIHtcbiAgZm9yKHZhciBpPTA7IGk8MzI7ICsraSkge1xuICAgIFBPT0wuVUlOVDhbaV0ubGVuZ3RoID0gMFxuICAgIFBPT0wuVUlOVDE2W2ldLmxlbmd0aCA9IDBcbiAgICBQT09MLlVJTlQzMltpXS5sZW5ndGggPSAwXG4gICAgUE9PTC5JTlQ4W2ldLmxlbmd0aCA9IDBcbiAgICBQT09MLklOVDE2W2ldLmxlbmd0aCA9IDBcbiAgICBQT09MLklOVDMyW2ldLmxlbmd0aCA9IDBcbiAgICBQT09MLkZMT0FUW2ldLmxlbmd0aCA9IDBcbiAgICBQT09MLkRPVUJMRVtpXS5sZW5ndGggPSAwXG4gICAgUE9PTC5VSU5UOENbaV0ubGVuZ3RoID0gMFxuICAgIERBVEFbaV0ubGVuZ3RoID0gMFxuICAgIEJVRkZFUltpXS5sZW5ndGggPSAwXG4gIH1cbn0iLCJcInVzZSBzdHJpY3RcIlxuXG5mdW5jdGlvbiB1bmlxdWVfcHJlZChsaXN0LCBjb21wYXJlKSB7XG4gIHZhciBwdHIgPSAxXG4gICAgLCBsZW4gPSBsaXN0Lmxlbmd0aFxuICAgICwgYT1saXN0WzBdLCBiPWxpc3RbMF1cbiAgZm9yKHZhciBpPTE7IGk8bGVuOyArK2kpIHtcbiAgICBiID0gYVxuICAgIGEgPSBsaXN0W2ldXG4gICAgaWYoY29tcGFyZShhLCBiKSkge1xuICAgICAgaWYoaSA9PT0gcHRyKSB7XG4gICAgICAgIHB0cisrXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgICBsaXN0W3B0cisrXSA9IGFcbiAgICB9XG4gIH1cbiAgbGlzdC5sZW5ndGggPSBwdHJcbiAgcmV0dXJuIGxpc3Rcbn1cblxuZnVuY3Rpb24gdW5pcXVlX2VxKGxpc3QpIHtcbiAgdmFyIHB0ciA9IDFcbiAgICAsIGxlbiA9IGxpc3QubGVuZ3RoXG4gICAgLCBhPWxpc3RbMF0sIGIgPSBsaXN0WzBdXG4gIGZvcih2YXIgaT0xOyBpPGxlbjsgKytpLCBiPWEpIHtcbiAgICBiID0gYVxuICAgIGEgPSBsaXN0W2ldXG4gICAgaWYoYSAhPT0gYikge1xuICAgICAgaWYoaSA9PT0gcHRyKSB7XG4gICAgICAgIHB0cisrXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgICBsaXN0W3B0cisrXSA9IGFcbiAgICB9XG4gIH1cbiAgbGlzdC5sZW5ndGggPSBwdHJcbiAgcmV0dXJuIGxpc3Rcbn1cblxuZnVuY3Rpb24gdW5pcXVlKGxpc3QsIGNvbXBhcmUsIHNvcnRlZCkge1xuICBpZihsaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBsaXN0XG4gIH1cbiAgaWYoY29tcGFyZSkge1xuICAgIGlmKCFzb3J0ZWQpIHtcbiAgICAgIGxpc3Quc29ydChjb21wYXJlKVxuICAgIH1cbiAgICByZXR1cm4gdW5pcXVlX3ByZWQobGlzdCwgY29tcGFyZSlcbiAgfVxuICBpZighc29ydGVkKSB7XG4gICAgbGlzdC5zb3J0KClcbiAgfVxuICByZXR1cm4gdW5pcXVlX2VxKGxpc3QpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gdW5pcXVlXG4iLCIvLyBTb3VyY2U6IGh0dHA6Ly9qc2ZpZGRsZS5uZXQvdld4OFYvXG4vLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzU2MDMxOTUvZnVsbC1saXN0LW9mLWphdmFzY3JpcHQta2V5Y29kZXNcblxuLyoqXG4gKiBDb25lbmllbmNlIG1ldGhvZCByZXR1cm5zIGNvcnJlc3BvbmRpbmcgdmFsdWUgZm9yIGdpdmVuIGtleU5hbWUgb3Iga2V5Q29kZS5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSBrZXlDb2RlIHtOdW1iZXJ9IG9yIGtleU5hbWUge1N0cmluZ31cbiAqIEByZXR1cm4ge01peGVkfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzZWFyY2hJbnB1dCkge1xuICAvLyBLZXlib2FyZCBFdmVudHNcbiAgaWYgKHNlYXJjaElucHV0ICYmICdvYmplY3QnID09PSB0eXBlb2Ygc2VhcmNoSW5wdXQpIHtcbiAgICB2YXIgaGFzS2V5Q29kZSA9IHNlYXJjaElucHV0LndoaWNoIHx8IHNlYXJjaElucHV0LmtleUNvZGUgfHwgc2VhcmNoSW5wdXQuY2hhckNvZGVcbiAgICBpZiAoaGFzS2V5Q29kZSkgc2VhcmNoSW5wdXQgPSBoYXNLZXlDb2RlXG4gIH1cblxuICAvLyBOdW1iZXJzXG4gIGlmICgnbnVtYmVyJyA9PT0gdHlwZW9mIHNlYXJjaElucHV0KSByZXR1cm4gbmFtZXNbc2VhcmNoSW5wdXRdXG5cbiAgLy8gRXZlcnl0aGluZyBlbHNlIChjYXN0IHRvIHN0cmluZylcbiAgdmFyIHNlYXJjaCA9IFN0cmluZyhzZWFyY2hJbnB1dClcblxuICAvLyBjaGVjayBjb2Rlc1xuICB2YXIgZm91bmROYW1lZEtleSA9IGNvZGVzW3NlYXJjaC50b0xvd2VyQ2FzZSgpXVxuICBpZiAoZm91bmROYW1lZEtleSkgcmV0dXJuIGZvdW5kTmFtZWRLZXlcblxuICAvLyBjaGVjayBhbGlhc2VzXG4gIHZhciBmb3VuZE5hbWVkS2V5ID0gYWxpYXNlc1tzZWFyY2gudG9Mb3dlckNhc2UoKV1cbiAgaWYgKGZvdW5kTmFtZWRLZXkpIHJldHVybiBmb3VuZE5hbWVkS2V5XG5cbiAgLy8gd2VpcmQgY2hhcmFjdGVyP1xuICBpZiAoc2VhcmNoLmxlbmd0aCA9PT0gMSkgcmV0dXJuIHNlYXJjaC5jaGFyQ29kZUF0KDApXG5cbiAgcmV0dXJuIHVuZGVmaW5lZFxufVxuXG4vKipcbiAqIEdldCBieSBuYW1lXG4gKlxuICogICBleHBvcnRzLmNvZGVbJ2VudGVyJ10gLy8gPT4gMTNcbiAqL1xuXG52YXIgY29kZXMgPSBleHBvcnRzLmNvZGUgPSBleHBvcnRzLmNvZGVzID0ge1xuICAnYmFja3NwYWNlJzogOCxcbiAgJ3RhYic6IDksXG4gICdlbnRlcic6IDEzLFxuICAnc2hpZnQnOiAxNixcbiAgJ2N0cmwnOiAxNyxcbiAgJ2FsdCc6IDE4LFxuICAncGF1c2UvYnJlYWsnOiAxOSxcbiAgJ2NhcHMgbG9jayc6IDIwLFxuICAnZXNjJzogMjcsXG4gICdzcGFjZSc6IDMyLFxuICAncGFnZSB1cCc6IDMzLFxuICAncGFnZSBkb3duJzogMzQsXG4gICdlbmQnOiAzNSxcbiAgJ2hvbWUnOiAzNixcbiAgJ2xlZnQnOiAzNyxcbiAgJ3VwJzogMzgsXG4gICdyaWdodCc6IDM5LFxuICAnZG93bic6IDQwLFxuICAnaW5zZXJ0JzogNDUsXG4gICdkZWxldGUnOiA0NixcbiAgJ2NvbW1hbmQnOiA5MSxcbiAgJ3JpZ2h0IGNsaWNrJzogOTMsXG4gICdudW1wYWQgKic6IDEwNixcbiAgJ251bXBhZCArJzogMTA3LFxuICAnbnVtcGFkIC0nOiAxMDksXG4gICdudW1wYWQgLic6IDExMCxcbiAgJ251bXBhZCAvJzogMTExLFxuICAnbnVtIGxvY2snOiAxNDQsXG4gICdzY3JvbGwgbG9jayc6IDE0NSxcbiAgJ215IGNvbXB1dGVyJzogMTgyLFxuICAnbXkgY2FsY3VsYXRvcic6IDE4MyxcbiAgJzsnOiAxODYsXG4gICc9JzogMTg3LFxuICAnLCc6IDE4OCxcbiAgJy0nOiAxODksXG4gICcuJzogMTkwLFxuICAnLyc6IDE5MSxcbiAgJ2AnOiAxOTIsXG4gICdbJzogMjE5LFxuICAnXFxcXCc6IDIyMCxcbiAgJ10nOiAyMjEsXG4gIFwiJ1wiOiAyMjJcbn1cblxuLy8gSGVscGVyIGFsaWFzZXNcblxudmFyIGFsaWFzZXMgPSBleHBvcnRzLmFsaWFzZXMgPSB7XG4gICd3aW5kb3dzJzogOTEsXG4gICfih6cnOiAxNixcbiAgJ+KMpSc6IDE4LFxuICAn4oyDJzogMTcsXG4gICfijJgnOiA5MSxcbiAgJ2N0bCc6IDE3LFxuICAnY29udHJvbCc6IDE3LFxuICAnb3B0aW9uJzogMTgsXG4gICdwYXVzZSc6IDE5LFxuICAnYnJlYWsnOiAxOSxcbiAgJ2NhcHMnOiAyMCxcbiAgJ3JldHVybic6IDEzLFxuICAnZXNjYXBlJzogMjcsXG4gICdzcGMnOiAzMixcbiAgJ3BndXAnOiAzMyxcbiAgJ3BnZG4nOiAzMyxcbiAgJ2lucyc6IDQ1LFxuICAnZGVsJzogNDYsXG4gICdjbWQnOiA5MVxufVxuXG5cbi8qIVxuICogUHJvZ3JhbWF0aWNhbGx5IGFkZCB0aGUgZm9sbG93aW5nXG4gKi9cblxuLy8gbG93ZXIgY2FzZSBjaGFyc1xuZm9yIChpID0gOTc7IGkgPCAxMjM7IGkrKykgY29kZXNbU3RyaW5nLmZyb21DaGFyQ29kZShpKV0gPSBpIC0gMzJcblxuLy8gbnVtYmVyc1xuZm9yICh2YXIgaSA9IDQ4OyBpIDwgNTg7IGkrKykgY29kZXNbaSAtIDQ4XSA9IGlcblxuLy8gZnVuY3Rpb24ga2V5c1xuZm9yIChpID0gMTsgaSA8IDEzOyBpKyspIGNvZGVzWydmJytpXSA9IGkgKyAxMTFcblxuLy8gbnVtcGFkIGtleXNcbmZvciAoaSA9IDA7IGkgPCAxMDsgaSsrKSBjb2Rlc1snbnVtcGFkICcraV0gPSBpICsgOTZcblxuLyoqXG4gKiBHZXQgYnkgY29kZVxuICpcbiAqICAgZXhwb3J0cy5uYW1lWzEzXSAvLyA9PiAnRW50ZXInXG4gKi9cblxudmFyIG5hbWVzID0gZXhwb3J0cy5uYW1lcyA9IGV4cG9ydHMudGl0bGUgPSB7fSAvLyB0aXRsZSBmb3IgYmFja3dhcmQgY29tcGF0XG5cbi8vIENyZWF0ZSByZXZlcnNlIG1hcHBpbmdcbmZvciAoaSBpbiBjb2RlcykgbmFtZXNbY29kZXNbaV1dID0gaVxuXG4vLyBBZGQgYWxpYXNlc1xuZm9yICh2YXIgYWxpYXMgaW4gYWxpYXNlcykge1xuICBjb2Rlc1thbGlhc10gPSBhbGlhc2VzW2FsaWFzXVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYXJncywgb3B0cykge1xuICAgIGlmICghb3B0cykgb3B0cyA9IHt9O1xuICAgIFxuICAgIHZhciBmbGFncyA9IHsgYm9vbHMgOiB7fSwgc3RyaW5ncyA6IHt9LCB1bmtub3duRm46IG51bGwgfTtcblxuICAgIGlmICh0eXBlb2Ygb3B0c1sndW5rbm93biddID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGZsYWdzLnVua25vd25GbiA9IG9wdHNbJ3Vua25vd24nXTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9wdHNbJ2Jvb2xlYW4nXSA9PT0gJ2Jvb2xlYW4nICYmIG9wdHNbJ2Jvb2xlYW4nXSkge1xuICAgICAgZmxhZ3MuYWxsQm9vbHMgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBbXS5jb25jYXQob3B0c1snYm9vbGVhbiddKS5maWx0ZXIoQm9vbGVhbikuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgZmxhZ3MuYm9vbHNba2V5XSA9IHRydWU7XG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgdmFyIGFsaWFzZXMgPSB7fTtcbiAgICBPYmplY3Qua2V5cyhvcHRzLmFsaWFzIHx8IHt9KS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgYWxpYXNlc1trZXldID0gW10uY29uY2F0KG9wdHMuYWxpYXNba2V5XSk7XG4gICAgICAgIGFsaWFzZXNba2V5XS5mb3JFYWNoKGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICBhbGlhc2VzW3hdID0gW2tleV0uY29uY2F0KGFsaWFzZXNba2V5XS5maWx0ZXIoZnVuY3Rpb24gKHkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geCAhPT0geTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBbXS5jb25jYXQob3B0cy5zdHJpbmcpLmZpbHRlcihCb29sZWFuKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgZmxhZ3Muc3RyaW5nc1trZXldID0gdHJ1ZTtcbiAgICAgICAgaWYgKGFsaWFzZXNba2V5XSkge1xuICAgICAgICAgICAgZmxhZ3Muc3RyaW5nc1thbGlhc2VzW2tleV1dID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICB9KTtcblxuICAgIHZhciBkZWZhdWx0cyA9IG9wdHNbJ2RlZmF1bHQnXSB8fCB7fTtcbiAgICBcbiAgICB2YXIgYXJndiA9IHsgXyA6IFtdIH07XG4gICAgT2JqZWN0LmtleXMoZmxhZ3MuYm9vbHMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBzZXRBcmcoa2V5LCBkZWZhdWx0c1trZXldID09PSB1bmRlZmluZWQgPyBmYWxzZSA6IGRlZmF1bHRzW2tleV0pO1xuICAgIH0pO1xuICAgIFxuICAgIHZhciBub3RGbGFncyA9IFtdO1xuXG4gICAgaWYgKGFyZ3MuaW5kZXhPZignLS0nKSAhPT0gLTEpIHtcbiAgICAgICAgbm90RmxhZ3MgPSBhcmdzLnNsaWNlKGFyZ3MuaW5kZXhPZignLS0nKSsxKTtcbiAgICAgICAgYXJncyA9IGFyZ3Muc2xpY2UoMCwgYXJncy5pbmRleE9mKCctLScpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhcmdEZWZpbmVkKGtleSwgYXJnKSB7XG4gICAgICAgIHJldHVybiAoZmxhZ3MuYWxsQm9vbHMgJiYgL14tLVtePV0rJC8udGVzdChhcmcpKSB8fFxuICAgICAgICAgICAgZmxhZ3Muc3RyaW5nc1trZXldIHx8IGZsYWdzLmJvb2xzW2tleV0gfHwgYWxpYXNlc1trZXldO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldEFyZyAoa2V5LCB2YWwsIGFyZykge1xuICAgICAgICBpZiAoYXJnICYmIGZsYWdzLnVua25vd25GbiAmJiAhYXJnRGVmaW5lZChrZXksIGFyZykpIHtcbiAgICAgICAgICAgIGlmIChmbGFncy51bmtub3duRm4oYXJnKSA9PT0gZmFsc2UpIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB2YWx1ZSA9ICFmbGFncy5zdHJpbmdzW2tleV0gJiYgaXNOdW1iZXIodmFsKVxuICAgICAgICAgICAgPyBOdW1iZXIodmFsKSA6IHZhbFxuICAgICAgICA7XG4gICAgICAgIHNldEtleShhcmd2LCBrZXkuc3BsaXQoJy4nKSwgdmFsdWUpO1xuICAgICAgICBcbiAgICAgICAgKGFsaWFzZXNba2V5XSB8fCBbXSkuZm9yRWFjaChmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgc2V0S2V5KGFyZ3YsIHguc3BsaXQoJy4nKSwgdmFsdWUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRLZXkgKG9iaiwga2V5cywgdmFsdWUpIHtcbiAgICAgICAgdmFyIG8gPSBvYmo7XG4gICAgICAgIGtleXMuc2xpY2UoMCwtMSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICBpZiAob1trZXldID09PSB1bmRlZmluZWQpIG9ba2V5XSA9IHt9O1xuICAgICAgICAgICAgbyA9IG9ba2V5XTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGtleSA9IGtleXNba2V5cy5sZW5ndGggLSAxXTtcbiAgICAgICAgaWYgKG9ba2V5XSA9PT0gdW5kZWZpbmVkIHx8IGZsYWdzLmJvb2xzW2tleV0gfHwgdHlwZW9mIG9ba2V5XSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICBvW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9ba2V5XSkpIHtcbiAgICAgICAgICAgIG9ba2V5XS5wdXNoKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG9ba2V5XSA9IFsgb1trZXldLCB2YWx1ZSBdO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGZ1bmN0aW9uIGFsaWFzSXNCb29sZWFuKGtleSkge1xuICAgICAgcmV0dXJuIGFsaWFzZXNba2V5XS5zb21lKGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgcmV0dXJuIGZsYWdzLmJvb2xzW3hdO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBhcmcgPSBhcmdzW2ldO1xuICAgICAgICBcbiAgICAgICAgaWYgKC9eLS0uKz0vLnRlc3QoYXJnKSkge1xuICAgICAgICAgICAgLy8gVXNpbmcgW1xcc1xcU10gaW5zdGVhZCBvZiAuIGJlY2F1c2UganMgZG9lc24ndCBzdXBwb3J0IHRoZVxuICAgICAgICAgICAgLy8gJ2RvdGFsbCcgcmVnZXggbW9kaWZpZXIuIFNlZTpcbiAgICAgICAgICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEwNjgzMDgvMTMyMTZcbiAgICAgICAgICAgIHZhciBtID0gYXJnLm1hdGNoKC9eLS0oW149XSspPShbXFxzXFxTXSopJC8pO1xuICAgICAgICAgICAgdmFyIGtleSA9IG1bMV07XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBtWzJdO1xuICAgICAgICAgICAgaWYgKGZsYWdzLmJvb2xzW2tleV0pIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICE9PSAnZmFsc2UnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2V0QXJnKGtleSwgdmFsdWUsIGFyZyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoL14tLW5vLS4rLy50ZXN0KGFyZykpIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBhcmcubWF0Y2goL14tLW5vLSguKykvKVsxXTtcbiAgICAgICAgICAgIHNldEFyZyhrZXksIGZhbHNlLCBhcmcpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKC9eLS0uKy8udGVzdChhcmcpKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gYXJnLm1hdGNoKC9eLS0oLispLylbMV07XG4gICAgICAgICAgICB2YXIgbmV4dCA9IGFyZ3NbaSArIDFdO1xuICAgICAgICAgICAgaWYgKG5leHQgIT09IHVuZGVmaW5lZCAmJiAhL14tLy50ZXN0KG5leHQpXG4gICAgICAgICAgICAmJiAhZmxhZ3MuYm9vbHNba2V5XVxuICAgICAgICAgICAgJiYgIWZsYWdzLmFsbEJvb2xzXG4gICAgICAgICAgICAmJiAoYWxpYXNlc1trZXldID8gIWFsaWFzSXNCb29sZWFuKGtleSkgOiB0cnVlKSkge1xuICAgICAgICAgICAgICAgIHNldEFyZyhrZXksIG5leHQsIGFyZyk7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoL14odHJ1ZXxmYWxzZSkkLy50ZXN0KG5leHQpKSB7XG4gICAgICAgICAgICAgICAgc2V0QXJnKGtleSwgbmV4dCA9PT0gJ3RydWUnLCBhcmcpO1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNldEFyZyhrZXksIGZsYWdzLnN0cmluZ3Nba2V5XSA/ICcnIDogdHJ1ZSwgYXJnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICgvXi1bXi1dKy8udGVzdChhcmcpKSB7XG4gICAgICAgICAgICB2YXIgbGV0dGVycyA9IGFyZy5zbGljZSgxLC0xKS5zcGxpdCgnJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBicm9rZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbGV0dGVycy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIHZhciBuZXh0ID0gYXJnLnNsaWNlKGorMik7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKG5leHQgPT09ICctJykge1xuICAgICAgICAgICAgICAgICAgICBzZXRBcmcobGV0dGVyc1tqXSwgbmV4dCwgYXJnKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKC9bQS1aYS16XS8udGVzdChsZXR0ZXJzW2pdKSAmJiAvPS8udGVzdChuZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICBzZXRBcmcobGV0dGVyc1tqXSwgbmV4dC5zcGxpdCgnPScpWzFdLCBhcmcpO1xuICAgICAgICAgICAgICAgICAgICBicm9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKC9bQS1aYS16XS8udGVzdChsZXR0ZXJzW2pdKVxuICAgICAgICAgICAgICAgICYmIC8tP1xcZCsoXFwuXFxkKik/KGUtP1xcZCspPyQvLnRlc3QobmV4dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0QXJnKGxldHRlcnNbal0sIG5leHQsIGFyZyk7XG4gICAgICAgICAgICAgICAgICAgIGJyb2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAobGV0dGVyc1tqKzFdICYmIGxldHRlcnNbaisxXS5tYXRjaCgvXFxXLykpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0QXJnKGxldHRlcnNbal0sIGFyZy5zbGljZShqKzIpLCBhcmcpO1xuICAgICAgICAgICAgICAgICAgICBicm9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNldEFyZyhsZXR0ZXJzW2pdLCBmbGFncy5zdHJpbmdzW2xldHRlcnNbal1dID8gJycgOiB0cnVlLCBhcmcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGtleSA9IGFyZy5zbGljZSgtMSlbMF07XG4gICAgICAgICAgICBpZiAoIWJyb2tlbiAmJiBrZXkgIT09ICctJykge1xuICAgICAgICAgICAgICAgIGlmIChhcmdzW2krMV0gJiYgIS9eKC18LS0pW14tXS8udGVzdChhcmdzW2krMV0pXG4gICAgICAgICAgICAgICAgJiYgIWZsYWdzLmJvb2xzW2tleV1cbiAgICAgICAgICAgICAgICAmJiAoYWxpYXNlc1trZXldID8gIWFsaWFzSXNCb29sZWFuKGtleSkgOiB0cnVlKSkge1xuICAgICAgICAgICAgICAgICAgICBzZXRBcmcoa2V5LCBhcmdzW2krMV0sIGFyZyk7XG4gICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoYXJnc1tpKzFdICYmIC90cnVlfGZhbHNlLy50ZXN0KGFyZ3NbaSsxXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0QXJnKGtleSwgYXJnc1tpKzFdID09PSAndHJ1ZScsIGFyZyk7XG4gICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNldEFyZyhrZXksIGZsYWdzLnN0cmluZ3Nba2V5XSA/ICcnIDogdHJ1ZSwgYXJnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoIWZsYWdzLnVua25vd25GbiB8fCBmbGFncy51bmtub3duRm4oYXJnKSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBhcmd2Ll8ucHVzaChcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3Muc3RyaW5nc1snXyddIHx8ICFpc051bWJlcihhcmcpID8gYXJnIDogTnVtYmVyKGFyZylcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9wdHMuc3RvcEVhcmx5KSB7XG4gICAgICAgICAgICAgICAgYXJndi5fLnB1c2guYXBwbHkoYXJndi5fLCBhcmdzLnNsaWNlKGkgKyAxKSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgT2JqZWN0LmtleXMoZGVmYXVsdHMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBpZiAoIWhhc0tleShhcmd2LCBrZXkuc3BsaXQoJy4nKSkpIHtcbiAgICAgICAgICAgIHNldEtleShhcmd2LCBrZXkuc3BsaXQoJy4nKSwgZGVmYXVsdHNba2V5XSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIChhbGlhc2VzW2tleV0gfHwgW10pLmZvckVhY2goZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICBzZXRLZXkoYXJndiwgeC5zcGxpdCgnLicpLCBkZWZhdWx0c1trZXldKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgXG4gICAgaWYgKG9wdHNbJy0tJ10pIHtcbiAgICAgICAgYXJndlsnLS0nXSA9IG5ldyBBcnJheSgpO1xuICAgICAgICBub3RGbGFncy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgYXJndlsnLS0nXS5wdXNoKGtleSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgbm90RmxhZ3MuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgIGFyZ3YuXy5wdXNoKGtleSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBhcmd2O1xufTtcblxuZnVuY3Rpb24gaGFzS2V5IChvYmosIGtleXMpIHtcbiAgICB2YXIgbyA9IG9iajtcbiAgICBrZXlzLnNsaWNlKDAsLTEpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBvID0gKG9ba2V5XSB8fCB7fSk7XG4gICAgfSk7XG5cbiAgICB2YXIga2V5ID0ga2V5c1trZXlzLmxlbmd0aCAtIDFdO1xuICAgIHJldHVybiBrZXkgaW4gbztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIgKHgpIHtcbiAgICBpZiAodHlwZW9mIHggPT09ICdudW1iZXInKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoL14weFswLTlhLWZdKyQvaS50ZXN0KHgpKSByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gL15bLStdPyg/OlxcZCsoPzpcXC5cXGQqKT98XFwuXFxkKykoZVstK10/XFxkKyk/JC8udGVzdCh4KTtcbn1cblxuIiwidmFyIGlvdGEgPSByZXF1aXJlKFwiaW90YS1hcnJheVwiKVxudmFyIGlzQnVmZmVyID0gcmVxdWlyZShcImlzLWJ1ZmZlclwiKVxuXG52YXIgaGFzVHlwZWRBcnJheXMgID0gKCh0eXBlb2YgRmxvYXQ2NEFycmF5KSAhPT0gXCJ1bmRlZmluZWRcIilcblxuZnVuY3Rpb24gY29tcGFyZTFzdChhLCBiKSB7XG4gIHJldHVybiBhWzBdIC0gYlswXVxufVxuXG5mdW5jdGlvbiBvcmRlcigpIHtcbiAgdmFyIHN0cmlkZSA9IHRoaXMuc3RyaWRlXG4gIHZhciB0ZXJtcyA9IG5ldyBBcnJheShzdHJpZGUubGVuZ3RoKVxuICB2YXIgaVxuICBmb3IoaT0wOyBpPHRlcm1zLmxlbmd0aDsgKytpKSB7XG4gICAgdGVybXNbaV0gPSBbTWF0aC5hYnMoc3RyaWRlW2ldKSwgaV1cbiAgfVxuICB0ZXJtcy5zb3J0KGNvbXBhcmUxc3QpXG4gIHZhciByZXN1bHQgPSBuZXcgQXJyYXkodGVybXMubGVuZ3RoKVxuICBmb3IoaT0wOyBpPHJlc3VsdC5sZW5ndGg7ICsraSkge1xuICAgIHJlc3VsdFtpXSA9IHRlcm1zW2ldWzFdXG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5mdW5jdGlvbiBjb21waWxlQ29uc3RydWN0b3IoZHR5cGUsIGRpbWVuc2lvbikge1xuICB2YXIgY2xhc3NOYW1lID0gW1wiVmlld1wiLCBkaW1lbnNpb24sIFwiZFwiLCBkdHlwZV0uam9pbihcIlwiKVxuICBpZihkaW1lbnNpb24gPCAwKSB7XG4gICAgY2xhc3NOYW1lID0gXCJWaWV3X05pbFwiICsgZHR5cGVcbiAgfVxuICB2YXIgdXNlR2V0dGVycyA9IChkdHlwZSA9PT0gXCJnZW5lcmljXCIpXG5cbiAgaWYoZGltZW5zaW9uID09PSAtMSkge1xuICAgIC8vU3BlY2lhbCBjYXNlIGZvciB0cml2aWFsIGFycmF5c1xuICAgIHZhciBjb2RlID1cbiAgICAgIFwiZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiKGEpe3RoaXMuZGF0YT1hO307XFxcbnZhciBwcm90bz1cIitjbGFzc05hbWUrXCIucHJvdG90eXBlO1xcXG5wcm90by5kdHlwZT0nXCIrZHR5cGUrXCInO1xcXG5wcm90by5pbmRleD1mdW5jdGlvbigpe3JldHVybiAtMX07XFxcbnByb3RvLnNpemU9MDtcXFxucHJvdG8uZGltZW5zaW9uPS0xO1xcXG5wcm90by5zaGFwZT1wcm90by5zdHJpZGU9cHJvdG8ub3JkZXI9W107XFxcbnByb3RvLmxvPXByb3RvLmhpPXByb3RvLnRyYW5zcG9zZT1wcm90by5zdGVwPVxcXG5mdW5jdGlvbigpe3JldHVybiBuZXcgXCIrY2xhc3NOYW1lK1wiKHRoaXMuZGF0YSk7fTtcXFxucHJvdG8uZ2V0PXByb3RvLnNldD1mdW5jdGlvbigpe307XFxcbnByb3RvLnBpY2s9ZnVuY3Rpb24oKXtyZXR1cm4gbnVsbH07XFxcbnJldHVybiBmdW5jdGlvbiBjb25zdHJ1Y3RfXCIrY2xhc3NOYW1lK1wiKGEpe3JldHVybiBuZXcgXCIrY2xhc3NOYW1lK1wiKGEpO31cIlxuICAgIHZhciBwcm9jZWR1cmUgPSBuZXcgRnVuY3Rpb24oY29kZSlcbiAgICByZXR1cm4gcHJvY2VkdXJlKClcbiAgfSBlbHNlIGlmKGRpbWVuc2lvbiA9PT0gMCkge1xuICAgIC8vU3BlY2lhbCBjYXNlIGZvciAwZCBhcnJheXNcbiAgICB2YXIgY29kZSA9XG4gICAgICBcImZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIihhLGQpIHtcXFxudGhpcy5kYXRhID0gYTtcXFxudGhpcy5vZmZzZXQgPSBkXFxcbn07XFxcbnZhciBwcm90bz1cIitjbGFzc05hbWUrXCIucHJvdG90eXBlO1xcXG5wcm90by5kdHlwZT0nXCIrZHR5cGUrXCInO1xcXG5wcm90by5pbmRleD1mdW5jdGlvbigpe3JldHVybiB0aGlzLm9mZnNldH07XFxcbnByb3RvLmRpbWVuc2lvbj0wO1xcXG5wcm90by5zaXplPTE7XFxcbnByb3RvLnNoYXBlPVxcXG5wcm90by5zdHJpZGU9XFxcbnByb3RvLm9yZGVyPVtdO1xcXG5wcm90by5sbz1cXFxucHJvdG8uaGk9XFxcbnByb3RvLnRyYW5zcG9zZT1cXFxucHJvdG8uc3RlcD1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfY29weSgpIHtcXFxucmV0dXJuIG5ldyBcIitjbGFzc05hbWUrXCIodGhpcy5kYXRhLHRoaXMub2Zmc2V0KVxcXG59O1xcXG5wcm90by5waWNrPWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9waWNrKCl7XFxcbnJldHVybiBUcml2aWFsQXJyYXkodGhpcy5kYXRhKTtcXFxufTtcXFxucHJvdG8udmFsdWVPZj1wcm90by5nZXQ9ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX2dldCgpe1xcXG5yZXR1cm4gXCIrKHVzZUdldHRlcnMgPyBcInRoaXMuZGF0YS5nZXQodGhpcy5vZmZzZXQpXCIgOiBcInRoaXMuZGF0YVt0aGlzLm9mZnNldF1cIikrXG5cIn07XFxcbnByb3RvLnNldD1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfc2V0KHYpe1xcXG5yZXR1cm4gXCIrKHVzZUdldHRlcnMgPyBcInRoaXMuZGF0YS5zZXQodGhpcy5vZmZzZXQsdilcIiA6IFwidGhpcy5kYXRhW3RoaXMub2Zmc2V0XT12XCIpK1wiXFxcbn07XFxcbnJldHVybiBmdW5jdGlvbiBjb25zdHJ1Y3RfXCIrY2xhc3NOYW1lK1wiKGEsYixjLGQpe3JldHVybiBuZXcgXCIrY2xhc3NOYW1lK1wiKGEsZCl9XCJcbiAgICB2YXIgcHJvY2VkdXJlID0gbmV3IEZ1bmN0aW9uKFwiVHJpdmlhbEFycmF5XCIsIGNvZGUpXG4gICAgcmV0dXJuIHByb2NlZHVyZShDQUNIRURfQ09OU1RSVUNUT1JTW2R0eXBlXVswXSlcbiAgfVxuXG4gIHZhciBjb2RlID0gW1wiJ3VzZSBzdHJpY3QnXCJdXG5cbiAgLy9DcmVhdGUgY29uc3RydWN0b3IgZm9yIHZpZXdcbiAgdmFyIGluZGljZXMgPSBpb3RhKGRpbWVuc2lvbilcbiAgdmFyIGFyZ3MgPSBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7IHJldHVybiBcImlcIitpIH0pXG4gIHZhciBpbmRleF9zdHIgPSBcInRoaXMub2Zmc2V0K1wiICsgaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgICByZXR1cm4gXCJ0aGlzLnN0cmlkZVtcIiArIGkgKyBcIl0qaVwiICsgaVxuICAgICAgfSkuam9pbihcIitcIilcbiAgdmFyIHNoYXBlQXJnID0gaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFwiYlwiK2lcbiAgICB9KS5qb2luKFwiLFwiKVxuICB2YXIgc3RyaWRlQXJnID0gaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFwiY1wiK2lcbiAgICB9KS5qb2luKFwiLFwiKVxuICBjb2RlLnB1c2goXG4gICAgXCJmdW5jdGlvbiBcIitjbGFzc05hbWUrXCIoYSxcIiArIHNoYXBlQXJnICsgXCIsXCIgKyBzdHJpZGVBcmcgKyBcIixkKXt0aGlzLmRhdGE9YVwiLFxuICAgICAgXCJ0aGlzLnNoYXBlPVtcIiArIHNoYXBlQXJnICsgXCJdXCIsXG4gICAgICBcInRoaXMuc3RyaWRlPVtcIiArIHN0cmlkZUFyZyArIFwiXVwiLFxuICAgICAgXCJ0aGlzLm9mZnNldD1kfDB9XCIsXG4gICAgXCJ2YXIgcHJvdG89XCIrY2xhc3NOYW1lK1wiLnByb3RvdHlwZVwiLFxuICAgIFwicHJvdG8uZHR5cGU9J1wiK2R0eXBlK1wiJ1wiLFxuICAgIFwicHJvdG8uZGltZW5zaW9uPVwiK2RpbWVuc2lvbilcblxuICAvL3ZpZXcuc2l6ZTpcbiAgY29kZS5wdXNoKFwiT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCdzaXplJyx7Z2V0OmZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9zaXplKCl7XFxcbnJldHVybiBcIitpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7IHJldHVybiBcInRoaXMuc2hhcGVbXCIraStcIl1cIiB9KS5qb2luKFwiKlwiKSxcblwifX0pXCIpXG5cbiAgLy92aWV3Lm9yZGVyOlxuICBpZihkaW1lbnNpb24gPT09IDEpIHtcbiAgICBjb2RlLnB1c2goXCJwcm90by5vcmRlcj1bMF1cIilcbiAgfSBlbHNlIHtcbiAgICBjb2RlLnB1c2goXCJPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sJ29yZGVyJyx7Z2V0OlwiKVxuICAgIGlmKGRpbWVuc2lvbiA8IDQpIHtcbiAgICAgIGNvZGUucHVzaChcImZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9vcmRlcigpe1wiKVxuICAgICAgaWYoZGltZW5zaW9uID09PSAyKSB7XG4gICAgICAgIGNvZGUucHVzaChcInJldHVybiAoTWF0aC5hYnModGhpcy5zdHJpZGVbMF0pPk1hdGguYWJzKHRoaXMuc3RyaWRlWzFdKSk/WzEsMF06WzAsMV19fSlcIilcbiAgICAgIH0gZWxzZSBpZihkaW1lbnNpb24gPT09IDMpIHtcbiAgICAgICAgY29kZS5wdXNoKFxuXCJ2YXIgczA9TWF0aC5hYnModGhpcy5zdHJpZGVbMF0pLHMxPU1hdGguYWJzKHRoaXMuc3RyaWRlWzFdKSxzMj1NYXRoLmFicyh0aGlzLnN0cmlkZVsyXSk7XFxcbmlmKHMwPnMxKXtcXFxuaWYoczE+czIpe1xcXG5yZXR1cm4gWzIsMSwwXTtcXFxufWVsc2UgaWYoczA+czIpe1xcXG5yZXR1cm4gWzEsMiwwXTtcXFxufWVsc2V7XFxcbnJldHVybiBbMSwwLDJdO1xcXG59XFxcbn1lbHNlIGlmKHMwPnMyKXtcXFxucmV0dXJuIFsyLDAsMV07XFxcbn1lbHNlIGlmKHMyPnMxKXtcXFxucmV0dXJuIFswLDEsMl07XFxcbn1lbHNle1xcXG5yZXR1cm4gWzAsMiwxXTtcXFxufX19KVwiKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb2RlLnB1c2goXCJPUkRFUn0pXCIpXG4gICAgfVxuICB9XG5cbiAgLy92aWV3LnNldChpMCwgLi4uLCB2KTpcbiAgY29kZS5wdXNoKFxuXCJwcm90by5zZXQ9ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX3NldChcIithcmdzLmpvaW4oXCIsXCIpK1wiLHYpe1wiKVxuICBpZih1c2VHZXR0ZXJzKSB7XG4gICAgY29kZS5wdXNoKFwicmV0dXJuIHRoaXMuZGF0YS5zZXQoXCIraW5kZXhfc3RyK1wiLHYpfVwiKVxuICB9IGVsc2Uge1xuICAgIGNvZGUucHVzaChcInJldHVybiB0aGlzLmRhdGFbXCIraW5kZXhfc3RyK1wiXT12fVwiKVxuICB9XG5cbiAgLy92aWV3LmdldChpMCwgLi4uKTpcbiAgY29kZS5wdXNoKFwicHJvdG8uZ2V0PWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9nZXQoXCIrYXJncy5qb2luKFwiLFwiKStcIil7XCIpXG4gIGlmKHVzZUdldHRlcnMpIHtcbiAgICBjb2RlLnB1c2goXCJyZXR1cm4gdGhpcy5kYXRhLmdldChcIitpbmRleF9zdHIrXCIpfVwiKVxuICB9IGVsc2Uge1xuICAgIGNvZGUucHVzaChcInJldHVybiB0aGlzLmRhdGFbXCIraW5kZXhfc3RyK1wiXX1cIilcbiAgfVxuXG4gIC8vdmlldy5pbmRleDpcbiAgY29kZS5wdXNoKFxuICAgIFwicHJvdG8uaW5kZXg9ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX2luZGV4KFwiLCBhcmdzLmpvaW4oKSwgXCIpe3JldHVybiBcIitpbmRleF9zdHIrXCJ9XCIpXG5cbiAgLy92aWV3LmhpKCk6XG4gIGNvZGUucHVzaChcInByb3RvLmhpPWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9oaShcIithcmdzLmpvaW4oXCIsXCIpK1wiKXtyZXR1cm4gbmV3IFwiK2NsYXNzTmFtZStcIih0aGlzLmRhdGEsXCIrXG4gICAgaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFtcIih0eXBlb2YgaVwiLGksXCIhPT0nbnVtYmVyJ3x8aVwiLGksXCI8MCk/dGhpcy5zaGFwZVtcIiwgaSwgXCJdOmlcIiwgaSxcInwwXCJdLmpvaW4oXCJcIilcbiAgICB9KS5qb2luKFwiLFwiKStcIixcIitcbiAgICBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gXCJ0aGlzLnN0cmlkZVtcIitpICsgXCJdXCJcbiAgICB9KS5qb2luKFwiLFwiKStcIix0aGlzLm9mZnNldCl9XCIpXG5cbiAgLy92aWV3LmxvKCk6XG4gIHZhciBhX3ZhcnMgPSBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7IHJldHVybiBcImFcIitpK1wiPXRoaXMuc2hhcGVbXCIraStcIl1cIiB9KVxuICB2YXIgY192YXJzID0gaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkgeyByZXR1cm4gXCJjXCIraStcIj10aGlzLnN0cmlkZVtcIitpK1wiXVwiIH0pXG4gIGNvZGUucHVzaChcInByb3RvLmxvPWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9sbyhcIithcmdzLmpvaW4oXCIsXCIpK1wiKXt2YXIgYj10aGlzLm9mZnNldCxkPTAsXCIrYV92YXJzLmpvaW4oXCIsXCIpK1wiLFwiK2NfdmFycy5qb2luKFwiLFwiKSlcbiAgZm9yKHZhciBpPTA7IGk8ZGltZW5zaW9uOyArK2kpIHtcbiAgICBjb2RlLnB1c2goXG5cImlmKHR5cGVvZiBpXCIraStcIj09PSdudW1iZXInJiZpXCIraStcIj49MCl7XFxcbmQ9aVwiK2krXCJ8MDtcXFxuYis9Y1wiK2krXCIqZDtcXFxuYVwiK2krXCItPWR9XCIpXG4gIH1cbiAgY29kZS5wdXNoKFwicmV0dXJuIG5ldyBcIitjbGFzc05hbWUrXCIodGhpcy5kYXRhLFwiK1xuICAgIGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBcImFcIitpXG4gICAgfSkuam9pbihcIixcIikrXCIsXCIrXG4gICAgaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFwiY1wiK2lcbiAgICB9KS5qb2luKFwiLFwiKStcIixiKX1cIilcblxuICAvL3ZpZXcuc3RlcCgpOlxuICBjb2RlLnB1c2goXCJwcm90by5zdGVwPWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9zdGVwKFwiK2FyZ3Muam9pbihcIixcIikrXCIpe3ZhciBcIitcbiAgICBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gXCJhXCIraStcIj10aGlzLnNoYXBlW1wiK2krXCJdXCJcbiAgICB9KS5qb2luKFwiLFwiKStcIixcIitcbiAgICBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gXCJiXCIraStcIj10aGlzLnN0cmlkZVtcIitpK1wiXVwiXG4gICAgfSkuam9pbihcIixcIikrXCIsYz10aGlzLm9mZnNldCxkPTAsY2VpbD1NYXRoLmNlaWxcIilcbiAgZm9yKHZhciBpPTA7IGk8ZGltZW5zaW9uOyArK2kpIHtcbiAgICBjb2RlLnB1c2goXG5cImlmKHR5cGVvZiBpXCIraStcIj09PSdudW1iZXInKXtcXFxuZD1pXCIraStcInwwO1xcXG5pZihkPDApe1xcXG5jKz1iXCIraStcIiooYVwiK2krXCItMSk7XFxcbmFcIitpK1wiPWNlaWwoLWFcIitpK1wiL2QpXFxcbn1lbHNle1xcXG5hXCIraStcIj1jZWlsKGFcIitpK1wiL2QpXFxcbn1cXFxuYlwiK2krXCIqPWRcXFxufVwiKVxuICB9XG4gIGNvZGUucHVzaChcInJldHVybiBuZXcgXCIrY2xhc3NOYW1lK1wiKHRoaXMuZGF0YSxcIitcbiAgICBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gXCJhXCIgKyBpXG4gICAgfSkuam9pbihcIixcIikrXCIsXCIrXG4gICAgaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFwiYlwiICsgaVxuICAgIH0pLmpvaW4oXCIsXCIpK1wiLGMpfVwiKVxuXG4gIC8vdmlldy50cmFuc3Bvc2UoKTpcbiAgdmFyIHRTaGFwZSA9IG5ldyBBcnJheShkaW1lbnNpb24pXG4gIHZhciB0U3RyaWRlID0gbmV3IEFycmF5KGRpbWVuc2lvbilcbiAgZm9yKHZhciBpPTA7IGk8ZGltZW5zaW9uOyArK2kpIHtcbiAgICB0U2hhcGVbaV0gPSBcImFbaVwiK2krXCJdXCJcbiAgICB0U3RyaWRlW2ldID0gXCJiW2lcIitpK1wiXVwiXG4gIH1cbiAgY29kZS5wdXNoKFwicHJvdG8udHJhbnNwb3NlPWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl90cmFuc3Bvc2UoXCIrYXJncytcIil7XCIrXG4gICAgYXJncy5tYXAoZnVuY3Rpb24obixpZHgpIHsgcmV0dXJuIG4gKyBcIj0oXCIgKyBuICsgXCI9PT11bmRlZmluZWQ/XCIgKyBpZHggKyBcIjpcIiArIG4gKyBcInwwKVwifSkuam9pbihcIjtcIiksXG4gICAgXCJ2YXIgYT10aGlzLnNoYXBlLGI9dGhpcy5zdHJpZGU7cmV0dXJuIG5ldyBcIitjbGFzc05hbWUrXCIodGhpcy5kYXRhLFwiK3RTaGFwZS5qb2luKFwiLFwiKStcIixcIit0U3RyaWRlLmpvaW4oXCIsXCIpK1wiLHRoaXMub2Zmc2V0KX1cIilcblxuICAvL3ZpZXcucGljaygpOlxuICBjb2RlLnB1c2goXCJwcm90by5waWNrPWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9waWNrKFwiK2FyZ3MrXCIpe3ZhciBhPVtdLGI9W10sYz10aGlzLm9mZnNldFwiKVxuICBmb3IodmFyIGk9MDsgaTxkaW1lbnNpb247ICsraSkge1xuICAgIGNvZGUucHVzaChcImlmKHR5cGVvZiBpXCIraStcIj09PSdudW1iZXInJiZpXCIraStcIj49MCl7Yz0oYyt0aGlzLnN0cmlkZVtcIitpK1wiXSppXCIraStcIil8MH1lbHNle2EucHVzaCh0aGlzLnNoYXBlW1wiK2krXCJdKTtiLnB1c2godGhpcy5zdHJpZGVbXCIraStcIl0pfVwiKVxuICB9XG4gIGNvZGUucHVzaChcInZhciBjdG9yPUNUT1JfTElTVFthLmxlbmd0aCsxXTtyZXR1cm4gY3Rvcih0aGlzLmRhdGEsYSxiLGMpfVwiKVxuXG4gIC8vQWRkIHJldHVybiBzdGF0ZW1lbnRcbiAgY29kZS5wdXNoKFwicmV0dXJuIGZ1bmN0aW9uIGNvbnN0cnVjdF9cIitjbGFzc05hbWUrXCIoZGF0YSxzaGFwZSxzdHJpZGUsb2Zmc2V0KXtyZXR1cm4gbmV3IFwiK2NsYXNzTmFtZStcIihkYXRhLFwiK1xuICAgIGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBcInNoYXBlW1wiK2krXCJdXCJcbiAgICB9KS5qb2luKFwiLFwiKStcIixcIitcbiAgICBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gXCJzdHJpZGVbXCIraStcIl1cIlxuICAgIH0pLmpvaW4oXCIsXCIpK1wiLG9mZnNldCl9XCIpXG5cbiAgLy9Db21waWxlIHByb2NlZHVyZVxuICB2YXIgcHJvY2VkdXJlID0gbmV3IEZ1bmN0aW9uKFwiQ1RPUl9MSVNUXCIsIFwiT1JERVJcIiwgY29kZS5qb2luKFwiXFxuXCIpKVxuICByZXR1cm4gcHJvY2VkdXJlKENBQ0hFRF9DT05TVFJVQ1RPUlNbZHR5cGVdLCBvcmRlcilcbn1cblxuZnVuY3Rpb24gYXJyYXlEVHlwZShkYXRhKSB7XG4gIGlmKGlzQnVmZmVyKGRhdGEpKSB7XG4gICAgcmV0dXJuIFwiYnVmZmVyXCJcbiAgfVxuICBpZihoYXNUeXBlZEFycmF5cykge1xuICAgIHN3aXRjaChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZGF0YSkpIHtcbiAgICAgIGNhc2UgXCJbb2JqZWN0IEZsb2F0NjRBcnJheV1cIjpcbiAgICAgICAgcmV0dXJuIFwiZmxvYXQ2NFwiXG4gICAgICBjYXNlIFwiW29iamVjdCBGbG9hdDMyQXJyYXldXCI6XG4gICAgICAgIHJldHVybiBcImZsb2F0MzJcIlxuICAgICAgY2FzZSBcIltvYmplY3QgSW50OEFycmF5XVwiOlxuICAgICAgICByZXR1cm4gXCJpbnQ4XCJcbiAgICAgIGNhc2UgXCJbb2JqZWN0IEludDE2QXJyYXldXCI6XG4gICAgICAgIHJldHVybiBcImludDE2XCJcbiAgICAgIGNhc2UgXCJbb2JqZWN0IEludDMyQXJyYXldXCI6XG4gICAgICAgIHJldHVybiBcImludDMyXCJcbiAgICAgIGNhc2UgXCJbb2JqZWN0IFVpbnQ4QXJyYXldXCI6XG4gICAgICAgIHJldHVybiBcInVpbnQ4XCJcbiAgICAgIGNhc2UgXCJbb2JqZWN0IFVpbnQxNkFycmF5XVwiOlxuICAgICAgICByZXR1cm4gXCJ1aW50MTZcIlxuICAgICAgY2FzZSBcIltvYmplY3QgVWludDMyQXJyYXldXCI6XG4gICAgICAgIHJldHVybiBcInVpbnQzMlwiXG4gICAgICBjYXNlIFwiW29iamVjdCBVaW50OENsYW1wZWRBcnJheV1cIjpcbiAgICAgICAgcmV0dXJuIFwidWludDhfY2xhbXBlZFwiXG4gICAgfVxuICB9XG4gIGlmKEFycmF5LmlzQXJyYXkoZGF0YSkpIHtcbiAgICByZXR1cm4gXCJhcnJheVwiXG4gIH1cbiAgcmV0dXJuIFwiZ2VuZXJpY1wiXG59XG5cbnZhciBDQUNIRURfQ09OU1RSVUNUT1JTID0ge1xuICBcImZsb2F0MzJcIjpbXSxcbiAgXCJmbG9hdDY0XCI6W10sXG4gIFwiaW50OFwiOltdLFxuICBcImludDE2XCI6W10sXG4gIFwiaW50MzJcIjpbXSxcbiAgXCJ1aW50OFwiOltdLFxuICBcInVpbnQxNlwiOltdLFxuICBcInVpbnQzMlwiOltdLFxuICBcImFycmF5XCI6W10sXG4gIFwidWludDhfY2xhbXBlZFwiOltdLFxuICBcImJ1ZmZlclwiOltdLFxuICBcImdlbmVyaWNcIjpbXVxufVxuXG47KGZ1bmN0aW9uKCkge1xuICBmb3IodmFyIGlkIGluIENBQ0hFRF9DT05TVFJVQ1RPUlMpIHtcbiAgICBDQUNIRURfQ09OU1RSVUNUT1JTW2lkXS5wdXNoKGNvbXBpbGVDb25zdHJ1Y3RvcihpZCwgLTEpKVxuICB9XG59KTtcblxuZnVuY3Rpb24gd3JhcHBlZE5EQXJyYXlDdG9yKGRhdGEsIHNoYXBlLCBzdHJpZGUsIG9mZnNldCkge1xuICBpZihkYXRhID09PSB1bmRlZmluZWQpIHtcbiAgICB2YXIgY3RvciA9IENBQ0hFRF9DT05TVFJVQ1RPUlMuYXJyYXlbMF1cbiAgICByZXR1cm4gY3RvcihbXSlcbiAgfSBlbHNlIGlmKHR5cGVvZiBkYXRhID09PSBcIm51bWJlclwiKSB7XG4gICAgZGF0YSA9IFtkYXRhXVxuICB9XG4gIGlmKHNoYXBlID09PSB1bmRlZmluZWQpIHtcbiAgICBzaGFwZSA9IFsgZGF0YS5sZW5ndGggXVxuICB9XG4gIHZhciBkID0gc2hhcGUubGVuZ3RoXG4gIGlmKHN0cmlkZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgc3RyaWRlID0gbmV3IEFycmF5KGQpXG4gICAgZm9yKHZhciBpPWQtMSwgc3o9MTsgaT49MDsgLS1pKSB7XG4gICAgICBzdHJpZGVbaV0gPSBzelxuICAgICAgc3ogKj0gc2hhcGVbaV1cbiAgICB9XG4gIH1cbiAgaWYob2Zmc2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICBvZmZzZXQgPSAwXG4gICAgZm9yKHZhciBpPTA7IGk8ZDsgKytpKSB7XG4gICAgICBpZihzdHJpZGVbaV0gPCAwKSB7XG4gICAgICAgIG9mZnNldCAtPSAoc2hhcGVbaV0tMSkqc3RyaWRlW2ldXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHZhciBkdHlwZSA9IGFycmF5RFR5cGUoZGF0YSlcbiAgdmFyIGN0b3JfbGlzdCA9IENBQ0hFRF9DT05TVFJVQ1RPUlNbZHR5cGVdXG4gIHdoaWxlKGN0b3JfbGlzdC5sZW5ndGggPD0gZCsxKSB7XG4gICAgY3Rvcl9saXN0LnB1c2goY29tcGlsZUNvbnN0cnVjdG9yKGR0eXBlLCBjdG9yX2xpc3QubGVuZ3RoLTEpKVxuICB9XG4gIHZhciBjdG9yID0gY3Rvcl9saXN0W2QrMV1cbiAgcmV0dXJuIGN0b3IoZGF0YSwgc2hhcGUsIHN0cmlkZSwgb2Zmc2V0KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHdyYXBwZWROREFycmF5Q3RvclxuIiwiLyoqXG4gKiBEZXRlcm1pbmUgaWYgYW4gb2JqZWN0IGlzIEJ1ZmZlclxuICpcbiAqIEF1dGhvcjogICBGZXJvc3MgQWJvdWtoYWRpamVoIDxmZXJvc3NAZmVyb3NzLm9yZz4gPGh0dHA6Ly9mZXJvc3Mub3JnPlxuICogTGljZW5zZTogIE1JVFxuICpcbiAqIGBucG0gaW5zdGFsbCBpcy1idWZmZXJgXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiAhIShvYmogIT0gbnVsbCAmJlxuICAgIChvYmouX2lzQnVmZmVyIHx8IC8vIEZvciBTYWZhcmkgNS03IChtaXNzaW5nIE9iamVjdC5wcm90b3R5cGUuY29uc3RydWN0b3IpXG4gICAgICAob2JqLmNvbnN0cnVjdG9yICYmXG4gICAgICB0eXBlb2Ygb2JqLmNvbnN0cnVjdG9yLmlzQnVmZmVyID09PSAnZnVuY3Rpb24nICYmXG4gICAgICBvYmouY29uc3RydWN0b3IuaXNCdWZmZXIob2JqKSlcbiAgICApKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocG9pbnQsIHZzKSB7XG4gICAgLy8gcmF5LWNhc3RpbmcgYWxnb3JpdGhtIGJhc2VkIG9uXG4gICAgLy8gaHR0cDovL3d3dy5lY3NlLnJwaS5lZHUvSG9tZXBhZ2VzL3dyZi9SZXNlYXJjaC9TaG9ydF9Ob3Rlcy9wbnBvbHkuaHRtbFxuICAgIFxuICAgIHZhciB4ID0gcG9pbnRbMF0sIHkgPSBwb2ludFsxXTtcbiAgICBcbiAgICB2YXIgaW5zaWRlID0gZmFsc2U7XG4gICAgZm9yICh2YXIgaSA9IDAsIGogPSB2cy5sZW5ndGggLSAxOyBpIDwgdnMubGVuZ3RoOyBqID0gaSsrKSB7XG4gICAgICAgIHZhciB4aSA9IHZzW2ldWzBdLCB5aSA9IHZzW2ldWzFdO1xuICAgICAgICB2YXIgeGogPSB2c1tqXVswXSwgeWogPSB2c1tqXVsxXTtcbiAgICAgICAgXG4gICAgICAgIHZhciBpbnRlcnNlY3QgPSAoKHlpID4geSkgIT0gKHlqID4geSkpXG4gICAgICAgICAgICAmJiAoeCA8ICh4aiAtIHhpKSAqICh5IC0geWkpIC8gKHlqIC0geWkpICsgeGkpO1xuICAgICAgICBpZiAoaW50ZXJzZWN0KSBpbnNpZGUgPSAhaW5zaWRlO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gaW5zaWRlO1xufTtcbiIsIi8qKlxuICogQGF1dGhvciBtcmRvb2IgLyBodHRwOi8vbXJkb29iLmNvbS9cbiAqL1xuXG52YXIgU3RhdHMgPSBmdW5jdGlvbiAoKSB7XG5cblx0dmFyIHN0YXJ0VGltZSA9IERhdGUubm93KCksIHByZXZUaW1lID0gc3RhcnRUaW1lO1xuXHR2YXIgbXMgPSAwLCBtc01pbiA9IEluZmluaXR5LCBtc01heCA9IDA7XG5cdHZhciBmcHMgPSAwLCBmcHNNaW4gPSBJbmZpbml0eSwgZnBzTWF4ID0gMDtcblx0dmFyIGZyYW1lcyA9IDAsIG1vZGUgPSAwO1xuXG5cdHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuXHRjb250YWluZXIuaWQgPSAnc3RhdHMnO1xuXHRjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lciggJ21vdXNlZG93bicsIGZ1bmN0aW9uICggZXZlbnQgKSB7IGV2ZW50LnByZXZlbnREZWZhdWx0KCk7IHNldE1vZGUoICsrIG1vZGUgJSAyICkgfSwgZmFsc2UgKTtcblx0Y29udGFpbmVyLnN0eWxlLmNzc1RleHQgPSAnd2lkdGg6ODBweDtvcGFjaXR5OjAuOTtjdXJzb3I6cG9pbnRlcic7XG5cblx0dmFyIGZwc0RpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG5cdGZwc0Rpdi5pZCA9ICdmcHMnO1xuXHRmcHNEaXYuc3R5bGUuY3NzVGV4dCA9ICdwYWRkaW5nOjAgMCAzcHggM3B4O3RleHQtYWxpZ246bGVmdDtiYWNrZ3JvdW5kLWNvbG9yOiMwMDInO1xuXHRjb250YWluZXIuYXBwZW5kQ2hpbGQoIGZwc0RpdiApO1xuXG5cdHZhciBmcHNUZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0ZnBzVGV4dC5pZCA9ICdmcHNUZXh0Jztcblx0ZnBzVGV4dC5zdHlsZS5jc3NUZXh0ID0gJ2NvbG9yOiMwZmY7Zm9udC1mYW1pbHk6SGVsdmV0aWNhLEFyaWFsLHNhbnMtc2VyaWY7Zm9udC1zaXplOjlweDtmb250LXdlaWdodDpib2xkO2xpbmUtaGVpZ2h0OjE1cHgnO1xuXHRmcHNUZXh0LmlubmVySFRNTCA9ICdGUFMnO1xuXHRmcHNEaXYuYXBwZW5kQ2hpbGQoIGZwc1RleHQgKTtcblxuXHR2YXIgZnBzR3JhcGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuXHRmcHNHcmFwaC5pZCA9ICdmcHNHcmFwaCc7XG5cdGZwc0dyYXBoLnN0eWxlLmNzc1RleHQgPSAncG9zaXRpb246cmVsYXRpdmU7d2lkdGg6NzRweDtoZWlnaHQ6MzBweDtiYWNrZ3JvdW5kLWNvbG9yOiMwZmYnO1xuXHRmcHNEaXYuYXBwZW5kQ2hpbGQoIGZwc0dyYXBoICk7XG5cblx0d2hpbGUgKCBmcHNHcmFwaC5jaGlsZHJlbi5sZW5ndGggPCA3NCApIHtcblxuXHRcdHZhciBiYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnc3BhbicgKTtcblx0XHRiYXIuc3R5bGUuY3NzVGV4dCA9ICd3aWR0aDoxcHg7aGVpZ2h0OjMwcHg7ZmxvYXQ6bGVmdDtiYWNrZ3JvdW5kLWNvbG9yOiMxMTMnO1xuXHRcdGZwc0dyYXBoLmFwcGVuZENoaWxkKCBiYXIgKTtcblxuXHR9XG5cblx0dmFyIG1zRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0bXNEaXYuaWQgPSAnbXMnO1xuXHRtc0Rpdi5zdHlsZS5jc3NUZXh0ID0gJ3BhZGRpbmc6MCAwIDNweCAzcHg7dGV4dC1hbGlnbjpsZWZ0O2JhY2tncm91bmQtY29sb3I6IzAyMDtkaXNwbGF5Om5vbmUnO1xuXHRjb250YWluZXIuYXBwZW5kQ2hpbGQoIG1zRGl2ICk7XG5cblx0dmFyIG1zVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG5cdG1zVGV4dC5pZCA9ICdtc1RleHQnO1xuXHRtc1RleHQuc3R5bGUuY3NzVGV4dCA9ICdjb2xvcjojMGYwO2ZvbnQtZmFtaWx5OkhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmO2ZvbnQtc2l6ZTo5cHg7Zm9udC13ZWlnaHQ6Ym9sZDtsaW5lLWhlaWdodDoxNXB4Jztcblx0bXNUZXh0LmlubmVySFRNTCA9ICdNUyc7XG5cdG1zRGl2LmFwcGVuZENoaWxkKCBtc1RleHQgKTtcblxuXHR2YXIgbXNHcmFwaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG5cdG1zR3JhcGguaWQgPSAnbXNHcmFwaCc7XG5cdG1zR3JhcGguc3R5bGUuY3NzVGV4dCA9ICdwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDo3NHB4O2hlaWdodDozMHB4O2JhY2tncm91bmQtY29sb3I6IzBmMCc7XG5cdG1zRGl2LmFwcGVuZENoaWxkKCBtc0dyYXBoICk7XG5cblx0d2hpbGUgKCBtc0dyYXBoLmNoaWxkcmVuLmxlbmd0aCA8IDc0ICkge1xuXG5cdFx0dmFyIGJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdzcGFuJyApO1xuXHRcdGJhci5zdHlsZS5jc3NUZXh0ID0gJ3dpZHRoOjFweDtoZWlnaHQ6MzBweDtmbG9hdDpsZWZ0O2JhY2tncm91bmQtY29sb3I6IzEzMSc7XG5cdFx0bXNHcmFwaC5hcHBlbmRDaGlsZCggYmFyICk7XG5cblx0fVxuXG5cdHZhciBzZXRNb2RlID0gZnVuY3Rpb24gKCB2YWx1ZSApIHtcblxuXHRcdG1vZGUgPSB2YWx1ZTtcblxuXHRcdHN3aXRjaCAoIG1vZGUgKSB7XG5cblx0XHRcdGNhc2UgMDpcblx0XHRcdFx0ZnBzRGl2LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXHRcdFx0XHRtc0Rpdi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgMTpcblx0XHRcdFx0ZnBzRGl2LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cdFx0XHRcdG1zRGl2LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXHRcdFx0XHRicmVhaztcblx0XHR9XG5cblx0fTtcblxuXHR2YXIgdXBkYXRlR3JhcGggPSBmdW5jdGlvbiAoIGRvbSwgdmFsdWUgKSB7XG5cblx0XHR2YXIgY2hpbGQgPSBkb20uYXBwZW5kQ2hpbGQoIGRvbS5maXJzdENoaWxkICk7XG5cdFx0Y2hpbGQuc3R5bGUuaGVpZ2h0ID0gdmFsdWUgKyAncHgnO1xuXG5cdH07XG5cblx0cmV0dXJuIHtcblxuXHRcdFJFVklTSU9OOiAxMixcblxuXHRcdGRvbUVsZW1lbnQ6IGNvbnRhaW5lcixcblxuXHRcdHNldE1vZGU6IHNldE1vZGUsXG5cblx0XHRiZWdpbjogZnVuY3Rpb24gKCkge1xuXG5cdFx0XHRzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG5cdFx0fSxcblxuXHRcdGVuZDogZnVuY3Rpb24gKCkge1xuXG5cdFx0XHR2YXIgdGltZSA9IERhdGUubm93KCk7XG5cblx0XHRcdG1zID0gdGltZSAtIHN0YXJ0VGltZTtcblx0XHRcdG1zTWluID0gTWF0aC5taW4oIG1zTWluLCBtcyApO1xuXHRcdFx0bXNNYXggPSBNYXRoLm1heCggbXNNYXgsIG1zICk7XG5cblx0XHRcdG1zVGV4dC50ZXh0Q29udGVudCA9IG1zICsgJyBNUyAoJyArIG1zTWluICsgJy0nICsgbXNNYXggKyAnKSc7XG5cdFx0XHR1cGRhdGVHcmFwaCggbXNHcmFwaCwgTWF0aC5taW4oIDMwLCAzMCAtICggbXMgLyAyMDAgKSAqIDMwICkgKTtcblxuXHRcdFx0ZnJhbWVzICsrO1xuXG5cdFx0XHRpZiAoIHRpbWUgPiBwcmV2VGltZSArIDEwMDAgKSB7XG5cblx0XHRcdFx0ZnBzID0gTWF0aC5yb3VuZCggKCBmcmFtZXMgKiAxMDAwICkgLyAoIHRpbWUgLSBwcmV2VGltZSApICk7XG5cdFx0XHRcdGZwc01pbiA9IE1hdGgubWluKCBmcHNNaW4sIGZwcyApO1xuXHRcdFx0XHRmcHNNYXggPSBNYXRoLm1heCggZnBzTWF4LCBmcHMgKTtcblxuXHRcdFx0XHRmcHNUZXh0LnRleHRDb250ZW50ID0gZnBzICsgJyBGUFMgKCcgKyBmcHNNaW4gKyAnLScgKyBmcHNNYXggKyAnKSc7XG5cdFx0XHRcdHVwZGF0ZUdyYXBoKCBmcHNHcmFwaCwgTWF0aC5taW4oIDMwLCAzMCAtICggZnBzIC8gMTAwICkgKiAzMCApICk7XG5cblx0XHRcdFx0cHJldlRpbWUgPSB0aW1lO1xuXHRcdFx0XHRmcmFtZXMgPSAwO1xuXG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB0aW1lO1xuXG5cdFx0fSxcblxuXHRcdHVwZGF0ZTogZnVuY3Rpb24gKCkge1xuXG5cdFx0XHRzdGFydFRpbWUgPSB0aGlzLmVuZCgpO1xuXG5cdFx0fVxuXG5cdH1cblxufTtcblxuaWYgKCB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyApIHtcblxuXHRtb2R1bGUuZXhwb3J0cyA9IFN0YXRzO1xuXG59IiwidmFyIFRIUkVFID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ1RIUkVFJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydUSFJFRSddIDogbnVsbCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXBwKSB7XG4gIHZhciBzY2VuZSA9IGFwcC5nZXQoJ3NjZW5lJyk7XG5cbiAgdmFyIG9iamVjdCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuXG4gIHZhciBlZGl0b3IgPSBhcHAuYXR0YWNoKG9iamVjdCwgcmVxdWlyZSgnLi4vZWRpdG9yL2VkaXRvcicpKTtcblxuICBzY2VuZS5hZGQob2JqZWN0KTtcblxuICByZXR1cm4gb2JqZWN0O1xufTsiLCJ2YXIgbmRhcnJheSA9IHJlcXVpcmUoJ25kYXJyYXknKTtcbnZhciBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydUSFJFRSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnVEhSRUUnXSA6IG51bGwpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFwcCkge1xuICB2YXIgc2NlbmUgPSBhcHAuZ2V0KCdzY2VuZScpO1xuICB2YXIgY2FtZXJhID0gYXBwLmdldCgnY2FtZXJhJyk7XG5cbiAgdmFyIG9iamVjdCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICB2YXIgYmxvY2tzID0gYXBwLmF0dGFjaChvYmplY3QsIHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvYmxvY2tzJykpO1xuXG4gIHZhciBkaW0gPSBbMzIsIDMyLCAzMl07XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBkaW1bMF07IGkrKykge1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGltWzFdOyBqKyspIHtcbiAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgZGltWzJdOyBrKyspIHtcbiAgICAgICAgYmxvY2tzLnNldChpLCBqLCBrLCAxKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBibG9ja3Mub2Zmc2V0LnNldCgtMTYsIC0xNiwgLTE2KTtcbiAgYmxvY2tzLnVwZGF0ZU1lc2goKTtcblxuICB2YXIgcmlnaWRCb2R5ID0gYXBwLmF0dGFjaChvYmplY3QsIHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvcmlnaWRib2R5JykpO1xuICByaWdpZEJvZHkuY29sbGlzaW9uT2JqZWN0ID0gYmxvY2tzLm9iamVjdDtcbiAgcmlnaWRCb2R5LmlzRml4dHVyZSA9IHRydWU7XG4gIFxuICBzY2VuZS5hZGQob2JqZWN0KTtcbn07IiwidmFyIFRIUkVFID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ1RIUkVFJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydUSFJFRSddIDogbnVsbCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXBwKSB7XG4gIHZhciBzY2VuZSA9IGFwcC5nZXQoJ3NjZW5lJyk7XG5cbiAgdmFyIG9iamVjdCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICB2YXIgY2hhcmFjdGVyID0gYXBwLmF0dGFjaChvYmplY3QsIHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvY2hhcmFjdGVyJykpO1xuICB2YXIgcmlnaWRCb2R5ID0gYXBwLmF0dGFjaChvYmplY3QsIHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvcmlnaWRib2R5JykpO1xuICByaWdpZEJvZHkubWFzcyA9IDE7XG4gIHZhciBwbGF5ZXJDb250cm9sID0gYXBwLmF0dGFjaChvYmplY3QsIHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvcGxheWVyY29udHJvbCcpKTtcblxuICBjaGFyYWN0ZXIucmlnaWRCb2R5ID0gcmlnaWRCb2R5O1xuICBwbGF5ZXJDb250cm9sLmNoYXJhY3RlciA9IGNoYXJhY3RlcjtcbiAgcGxheWVyQ29udHJvbC5yaWdpZEJvZHkgPSByaWdpZEJvZHk7XG5cbiAgc2NlbmUuYWRkKG9iamVjdCk7XG5cbiAgb2JqZWN0LnBvc2l0aW9uLnNldCgwLCA0MCwgMCk7XG5cbiAgcmV0dXJuIG9iamVjdDtcbn07IiwidmFyIG5kYXJyYXkgPSByZXF1aXJlKCduZGFycmF5Jyk7XG52YXIgbWVzaGVyID0gcmVxdWlyZSgnLi4vdm94ZWwvbWVzaGVyJyk7XG52YXIgYXJyYXlVdGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzL2FycmF5dXRpbHMnKTtcblxudmFyIEJsb2NrcyA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICB0aGlzLm9iamVjdCA9IG9iamVjdDtcbiAgdGhpcy50eXBlID0gJ2Jsb2Nrcyc7XG5cbiAgdGhpcy5kaW0gPSBbMTYsIDE2LCAxNl07XG4gIHRoaXMuY2h1bmsgPSBuZGFycmF5KFtdLCB0aGlzLmRpbSk7XG5cbiAgdGhpcy5tZXNoID0gbnVsbDtcbiAgdGhpcy5vYmogPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcbiAgdGhpcy5tYXRlcmlhbCA9IG5ldyBUSFJFRS5NdWx0aU1hdGVyaWFsKCk7XG5cbiAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xuICB0aGlzLmRpbU5lZWRzVXBkYXRlID0gZmFsc2U7XG5cbiAgdGhpcy5vYmplY3QuYWRkKHRoaXMub2JqKTtcblxuICB0aGlzLnBhbGV0dGUgPSBbbnVsbF07XG5cbiAgdGhpcy51c2VyRGF0YSA9IHt9O1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbih4LCB5LCB6LCBiKSB7XG4gIHRoaXMuY2h1bmsuc2V0KHgsIHksIHosIGIpO1xuICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuc2V0QXRDb29yZCA9IGZ1bmN0aW9uKGNvb3JkLCBiKSB7XG4gIHRoaXMuc2V0KGNvb3JkLngsIGNvb3JkLnksIGNvb3JkLnosIGIpO1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbih4LCB5LCB6KSB7XG4gIHJldHVybiB0aGlzLmNodW5rLmdldCh4LCB5LCB6KTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuZ2V0QXRDb29yZCA9IGZ1bmN0aW9uKGNvb3JkKSB7XG4gIHJldHVybiB0aGlzLmdldChjb29yZC54LCBjb29yZC55LCBjb29yZC56KTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUucG9pbnRUb0Nvb3JkID0gZnVuY3Rpb24ocG9pbnQpIHtcbiAgcmV0dXJuIG5ldyBUSFJFRS5WZWN0b3IzKHBvaW50LnggLSAwLjUsIHBvaW50LnkgLSAwLjUsIHBvaW50LnogLSAwLjUpO1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS5jb29yZFRvUG9pbnQgPSBmdW5jdGlvbihjb29yZCkge1xuICByZXR1cm4gbmV3IFRIUkVFLlZlY3RvcjMoY29vcmQueCwgY29vcmQueSwgY29vcmQueik7XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuZGltTmVlZHNVcGRhdGUpIHtcbiAgICB0aGlzLl91cGRhdGVEaW0oKTtcbiAgICB0aGlzLmRpbU5lZWRzVXBkYXRlID0gZmFsc2U7XG4gIH1cblxuICB0aGlzLnVwZGF0ZU1lc2goKTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5jaHVuayA9IG5kYXJyYXkoW10sIHRoaXMuZGltKTtcbiAgdGhpcy5vYmoucmVtb3ZlKHRoaXMubWVzaCk7XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLnNldERpbSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHRoaXMuZGltID0gdmFsdWU7XG4gIHRoaXMuZGltTmVlZHNVcGRhdGUgPSB0cnVlO1xuICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUudmlzaXQgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICB2YXIgc2hhcGUgPSB0aGlzLmNodW5rLnNoYXBlO1xuICB2YXIgZGF0YSA9IHRoaXMuY2h1bmsuZGF0YTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaGFwZVswXTsgaSsrKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBzaGFwZVsxXTsgaisrKSB7XG4gICAgICBmb3IgKHZhciBrID0gMDsgayA8IHNoYXBlWzJdOyBrKyspIHtcbiAgICAgICAgdmFyIGIgPSB0aGlzLmNodW5rLmdldChpLCBqLCBrKTtcbiAgICAgICAgaWYgKCEhYikge1xuICAgICAgICAgIGNhbGxiYWNrKGksIGosIGssIGIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLmdldEFsbENvb3JkcyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY29vcmRzID0gW107XG4gIHRoaXMudmlzaXQoZnVuY3Rpb24oaSwgaiwgaykge1xuICAgIGNvb3Jkcy5wdXNoKG5ldyBUSFJFRS5WZWN0b3IzKGksIGosIGspKTtcbiAgfSk7XG4gIHJldHVybiBjb29yZHM7XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLnByaW50ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMudmlzaXQoZnVuY3Rpb24oaSwgaiwgaywgYikge1xuICAgIGNvbnNvbGUubG9nKFtpLCBqLCBrXS5qb2luKCcsJyksIGIpO1xuICB9KTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuc2VyaWFsaXplID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgZGltOiB0aGlzLmRpbSxcbiAgICBjaHVua0RhdGE6IGFycmF5VXRpbHMuY2xvbmUodGhpcy5jaHVuay5kYXRhKSxcbiAgICBwYWxldHRlOiB0aGlzLnBhbGV0dGUsXG4gICAgdXNlckRhdGE6IHRoaXMudXNlckRhdGFcbiAgfTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuZGVzZXJpYWxpemUgPSBmdW5jdGlvbihqc29uKSB7XG4gIHRoaXMuZGltID0ganNvbi5kaW07XG4gIHRoaXMuY2h1bmsgPSBuZGFycmF5KFtdLCB0aGlzLmRpbSk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwganNvbi5jaHVua0RhdGEubGVuZ3RoOyBpKyspIHtcbiAgICB0aGlzLmNodW5rLmRhdGFbaV0gPSBqc29uLmNodW5rRGF0YVtpXTtcbiAgfVxuXG4gIHRoaXMucGFsZXR0ZSA9IGpzb24ucGFsZXR0ZTtcblxuICB0aGlzLnVwZGF0ZU1hdGVyaWFsKCk7XG5cbiAgdGhpcy5kaW1OZWVkc1VwZGF0ZSA9IHRydWU7XG4gIHRoaXMuZGlydHkgPSB0cnVlO1xuXG4gIHRoaXMudXNlckRhdGEgPSBqc29uLnVzZXJEYXRhO1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS51cGRhdGVNZXNoID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmRpcnR5KSB7XG4gICAgdGhpcy5fdXBkYXRlTWVzaCgpO1xuICAgIHRoaXMuZGlydHkgPSBmYWxzZTtcbiAgfVxufTtcblxuQmxvY2tzLnByb3RvdHlwZS5fdXBkYXRlTWVzaCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5tZXNoICE9IG51bGwpIHtcbiAgICB0aGlzLm9iai5yZW1vdmUodGhpcy5tZXNoKTtcbiAgfVxuXG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIGRpbSA9IHRoaXMuZGltO1xuXG4gIHZhciByZXN1bHQgPSBtZXNoZXIoZnVuY3Rpb24oaSwgaiwgaykge1xuICAgIHJldHVybiBzZWxmLmdldChpLCBqLCBrKTtcbiAgfSwgZGltKTtcblxuICB2YXIgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuR2VvbWV0cnkoKTtcblxuICByZXN1bHQudmVydGljZXMuZm9yRWFjaChmdW5jdGlvbih2KSB7XG4gICAgdmFyIHZlcnRpY2UgPSBuZXcgVEhSRUUuVmVjdG9yMyhcbiAgICAgIHZbMF0sIHZbMV0sIHZbMl1cbiAgICApO1xuICAgIGdlb21ldHJ5LnZlcnRpY2VzLnB1c2godmVydGljZSk7XG4gIH0pO1xuXG4gIHJlc3VsdC5zdXJmYWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHN1cmZhY2UpIHtcbiAgICB2YXIgZiA9IHN1cmZhY2UuZmFjZTtcbiAgICB2YXIgdXYgPSBzdXJmYWNlLnV2O1xuICAgIHZhciBjID0gZls0XTtcblxuICAgIHZhciBmYWNlID0gbmV3IFRIUkVFLkZhY2UzKGZbMF0sIGZbMV0sIGZbMl0pO1xuICAgIGdlb21ldHJ5LmZhY2VzLnB1c2goZmFjZSk7XG4gICAgZ2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXS5wdXNoKFt1dlswXSwgdXZbMV0sIHV2WzJdXSk7XG4gICAgZmFjZS5tYXRlcmlhbEluZGV4ID0gYyAtIDE7XG5cbiAgICBmYWNlID0gbmV3IFRIUkVFLkZhY2UzKGZbMl0sIGZbM10sIGZbMF0pO1xuICAgIGdlb21ldHJ5LmZhY2VzLnB1c2goZmFjZSk7XG4gICAgZ2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXS5wdXNoKFt1dlsyXSwgdXZbM10sIHV2WzBdXSk7XG4gICAgZmFjZS5tYXRlcmlhbEluZGV4ID0gYyAtIDE7XG4gIH0pO1xuXG4gIGdlb21ldHJ5LmNvbXB1dGVGYWNlTm9ybWFscygpO1xuXG4gIHRoaXMubWVzaCA9IG5ldyBUSFJFRS5NZXNoKGdlb21ldHJ5LCB0aGlzLm1hdGVyaWFsKTtcbiAgdGhpcy5vYmouYWRkKHRoaXMubWVzaCk7XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLl91cGRhdGVEaW0gPSBmdW5jdGlvbigpIHtcbiAgdmFyIG5ld0NodW5rID0gbmRhcnJheShbXSwgdGhpcy5kaW0pO1xuICB2YXIgc2hhcGUgPSB0aGlzLmNodW5rLnNoYXBlO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc2hhcGVbMF07IGkrKykge1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgc2hhcGVbMV07IGorKykge1xuICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBzaGFwZVsyXTsgaysrKSB7XG4gICAgICAgIHZhciBiID0gdGhpcy5jaHVuay5nZXQoaSwgaiwgayk7XG4gICAgICAgIGlmICghIWIpIHtcbiAgICAgICAgICBuZXdDaHVuay5zZXQoaSwgaiwgaywgYik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB0aGlzLmNodW5rID0gbmV3Q2h1bms7XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLmdldE9yQWRkQ29sb3JJbmRleCA9IGZ1bmN0aW9uKGNvbG9yKSB7XG4gIC8vIG51bGwsIDAsIGZhbHNlLCB1bmRlZmluZWRcbiAgaWYgKCFjb2xvcikge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgdmFyIGluZGV4ID0gYXJyYXlVdGlscy5pbmRleE9mKHRoaXMucGFsZXR0ZSwgY29sb3IpO1xuICBpZiAoaW5kZXggPT0gLTEpIHtcbiAgICB0aGlzLnBhbGV0dGUucHVzaChjb2xvcik7XG4gICAgaW5kZXggPSB0aGlzLnBhbGV0dGUubGVuZ3RoIC0gMTtcbiAgICB2YXIgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaExhbWJlcnRNYXRlcmlhbCh7XG4gICAgICBjb2xvcjogbmV3IFRIUkVFLkNvbG9yKHRoaXMucGFsZXR0ZVtpbmRleF0pXG4gICAgfSk7XG4gICAgdGhpcy5tYXRlcmlhbC5tYXRlcmlhbHMucHVzaChtYXRlcmlhbCk7XG4gICAgcmV0dXJuIHRoaXMucGFsZXR0ZS5sZW5ndGggLSAxO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBpbmRleDtcbiAgfVxufTtcblxuQmxvY2tzLnByb3RvdHlwZS51cGRhdGVNYXRlcmlhbCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLm1hdGVyaWFsID0gbmV3IFRIUkVFLk11bHRpTWF0ZXJpYWwoKTtcbiAgZm9yICh2YXIgaSA9IDE7IGkgPCB0aGlzLnBhbGV0dGUubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaExhbWJlcnRNYXRlcmlhbCh7XG4gICAgICBjb2xvcjogbmV3IFRIUkVFLkNvbG9yKHRoaXMucGFsZXR0ZVtpXSlcbiAgICB9KTtcbiAgICB0aGlzLm1hdGVyaWFsLm1hdGVyaWFscy5wdXNoKG1hdGVyaWFsKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCbG9ja3M7IiwidmFyIFRIUkVFID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ1RIUkVFJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydUSFJFRSddIDogbnVsbCk7XG5cbnZhciBDaGFyYWN0ZXIgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgdGhpcy5vYmplY3QgPSBvYmplY3Q7XG5cbiAgdGhpcy5nZW9tZXRyeSA9IG5ldyBUSFJFRS5Cb3hHZW9tZXRyeSgxLCAxLCAxKTtcbiAgdGhpcy5tYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgY29sb3I6IDB4ZmYwMDAwXG4gIH0pO1xuXG4gIHRoaXMubWVzaCA9IG5ldyBUSFJFRS5NZXNoKHRoaXMuZ2VvbWV0cnksIHRoaXMubWF0ZXJpYWwpO1xuICB0aGlzLm9iamVjdC5hZGQodGhpcy5tZXNoKTtcblxuICB0aGlzLm1vdmVTcGVlZCA9IDAuNTtcbiAgdGhpcy5qdW1wU3BlZWQgPSAwLjg7XG4gIHRoaXMuanVtcGluZyA9IGZhbHNlO1xufTtcblxuQ2hhcmFjdGVyLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuZ3Jhdml0eSA9IHRoaXMucmlnaWRCb2R5LmdyYXZpdHk7XG4gIGlmICh0aGlzLmp1bXBpbmcgJiYgdGhpcy5yaWdpZEJvZHkuZ3JvdW5kZWQpIHtcbiAgICB0aGlzLmp1bXBpbmcgPSBmYWxzZTtcbiAgfVxufTtcblxuQ2hhcmFjdGVyLnByb3RvdHlwZS5tb3ZlID0gZnVuY3Rpb24oZm9yd2FyZCwgYW1vdW50KSB7XG4gIHZhciBncmF2aXR5ID0gdGhpcy5yaWdpZEJvZHkuZ3Jhdml0eTtcbiAgaWYgKGdyYXZpdHkgPT0gbnVsbCkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAodGhpcy5yaWdpZEJvZHkuZ3JvdW5kZWQgfHwgdGhpcy5qdW1waW5nKSB7XG4gICAgdmFyIHZlcnRpY2FsU3BlZWQgPSB0aGlzLnJpZ2lkQm9keS52ZWxvY2l0eS5jbG9uZSgpLnByb2plY3RPblZlY3RvcihncmF2aXR5LmRpcik7XG4gICAgdmFyIGZvcndhcmRTcGVlZCA9IGZvcndhcmQuY2xvbmUoKS5zZXRMZW5ndGgoYW1vdW50ICogdGhpcy5tb3ZlU3BlZWQpO1xuICAgIHRoaXMucmlnaWRCb2R5LnZlbG9jaXR5LmNvcHkodmVydGljYWxTcGVlZC5hZGQoZm9yd2FyZFNwZWVkKSk7XG4gIH1cbn07XG5cbkNoYXJhY3Rlci5wcm90b3R5cGUuanVtcCA9IGZ1bmN0aW9uKGFtb3VudCkge1xuICB2YXIgZ3Jhdml0eSA9IHRoaXMucmlnaWRCb2R5LmdyYXZpdHk7XG4gIGlmIChncmF2aXR5ID09IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKHRoaXMucmlnaWRCb2R5Lmdyb3VuZGVkKSB7XG4gICAgdGhpcy5qdW1waW5nID0gdHJ1ZTtcbiAgICB0aGlzLnJpZ2lkQm9keS52ZWxvY2l0eS5jb3B5KGdyYXZpdHkuZGlyLmNsb25lKCkubXVsdGlwbHlTY2FsYXIoLXRoaXMuanVtcFNwZWVkKSk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2hhcmFjdGVyOyIsInZhciBQbGF5ZXJDYW1lcmEgPSBmdW5jdGlvbihjYW1lcmEsIGFwcCkge1xuICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcbiAgdGhpcy5hcHAgPSBhcHA7XG5cbiAgdGhpcy5jYW1lcmFUaWx0ID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIoXG4gICAgbmV3IFRIUkVFLkV1bGVyKC1NYXRoLlBJIC8gNCwgTWF0aC5QSSAvIDQsIDAsICdZWFonKSk7XG5cbiAgdGhpcy5jYW1lcmFRdWF0ID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbiAgdGhpcy5jYW1lcmFRdWF0RmluYWwgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXG4gIHRoaXMuZGlzdGFuY2UgPSAxMDA7XG4gIHRoaXMudGFyZ2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgdGhpcy5xdWF0ZXJuaW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbn07XG5cblBsYXllckNhbWVyYS4kaW5qZWN0ID0gWydhcHAnXTtcblxuUGxheWVyQ2FtZXJhLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwbGF5ZXIgPSBhcHAuZ2V0KCdwbGF5ZXInKTtcbiAgaWYgKHBsYXllciA9PSBudWxsKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIHJpZ2lkQm9keSA9IGFwcC5nZXRDb21wb25lbnQocGxheWVyLCAncmlnaWRCb2R5Jyk7XG5cbiAgdmFyIGdyYXZpdHlEaXI7XG4gIGlmIChyaWdpZEJvZHkuZ3JvdW5kZWQpIHtcbiAgICBncmF2aXR5RGlyID0gcmlnaWRCb2R5LmdyYXZpdHkuZGlyLmNsb25lKCk7XG4gIH0gZWxzZSB7XG4gICAgZ3Jhdml0eURpciA9IHJpZ2lkQm9keS5ncmF2aXR5LmZvcmNlRGlyLmNsb25lKCk7XG4gIH1cblxuICBpZiAoZ3Jhdml0eURpci5sZW5ndGgoKSA9PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGEgPSBncmF2aXR5RGlyLmNsb25lKCkubXVsdGlwbHlTY2FsYXIoLTEpO1xuXG4gIHZhciBkaWZmID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zZXRGcm9tVW5pdFZlY3RvcnMoXG4gICAgbmV3IFRIUkVFLlZlY3RvcjMoMCwgMSwgMCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMuY2FtZXJhUXVhdCksXG4gICAgYVxuICApO1xuXG4gIHRoaXMuY2FtZXJhUXVhdC5tdWx0aXBseVF1YXRlcm5pb25zKGRpZmYsIHRoaXMuY2FtZXJhUXVhdCk7XG4gIHRoaXMuY2FtZXJhUXVhdEZpbmFsID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5tdWx0aXBseVF1YXRlcm5pb25zKFxuICAgIHRoaXMuY2FtZXJhUXVhdCxcbiAgICB0aGlzLmNhbWVyYVRpbHQpO1xuXG4gIHRoaXMucXVhdGVybmlvbi5zbGVycCh0aGlzLmNhbWVyYVF1YXRGaW5hbCwgMC4xKTtcblxuICBsYXN0R3Jhdml0eSA9IGdyYXZpdHlEaXI7XG5cbiAgdGhpcy51cGRhdGVDYW1lcmEoKTtcbn07XG5cblBsYXllckNhbWVyYS5wcm90b3R5cGUudXBkYXRlQ2FtZXJhID0gZnVuY3Rpb24oKSB7XG4gIHZhciBkaWZmID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMSlcbiAgICAuYXBwbHlRdWF0ZXJuaW9uKHRoaXMucXVhdGVybmlvbilcbiAgICAuc2V0TGVuZ3RoKHRoaXMuZGlzdGFuY2UpO1xuICB2YXIgcG9zID0gdGhpcy50YXJnZXQuY2xvbmUoKVxuICAgIC5hZGQoZGlmZik7XG4gIGNhbWVyYS5wb3NpdGlvbi5jb3B5KHBvcyk7XG5cbiAgdmFyIHVwID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMSwgMCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMucXVhdGVybmlvbik7XG4gIGNhbWVyYS51cC5jb3B5KHVwKTtcbiAgY2FtZXJhLmxvb2tBdCh0aGlzLnRhcmdldCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXllckNhbWVyYTsiLCJ2YXIgUGxheWVyQ29udHJvbCA9IGZ1bmN0aW9uKG9iamVjdCwgYXBwLCBpbnB1dCwgY2FtZXJhKSB7XG4gIHRoaXMub2JqZWN0ID0gb2JqZWN0O1xuICB0aGlzLmlucHV0ID0gaW5wdXQ7XG4gIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuXG4gIHRoaXMuY2hhcmFjdGVyID0gbnVsbDtcbiAgdGhpcy5yaWdpZEJvZHkgPSBudWxsO1xufTtcblxuUGxheWVyQ29udHJvbC4kaW5qZWN0ID0gWydpbnB1dCcsICdjYW1lcmEnXTtcblxuUGxheWVyQ29udHJvbC5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZm9yd2FyZEFtb3VudCA9IDA7XG4gIGlmICh0aGlzLmlucHV0LmtleUhvbGQoJ3cnKSkgZm9yd2FyZEFtb3VudCArPSAxO1xuICBpZiAodGhpcy5pbnB1dC5rZXlIb2xkKCdzJykpIGZvcndhcmRBbW91bnQgLT0gMTtcblxuICB2YXIgcmlnaHRBbW91bnQgPSAwO1xuICBpZiAodGhpcy5pbnB1dC5rZXlIb2xkKCdkJykpIHJpZ2h0QW1vdW50ICs9IDE7XG4gIGlmICh0aGlzLmlucHV0LmtleUhvbGQoJ2EnKSkgcmlnaHRBbW91bnQgLT0gMTtcblxuICB2YXIgZ3Jhdml0eSA9IHRoaXMucmlnaWRCb2R5LmdyYXZpdHk7XG5cbiAgaWYgKGdyYXZpdHkgIT0gbnVsbCkge1xuICAgIHZhciBub3JtYWwgPSBncmF2aXR5LmRpci5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKC0xKTtcblxuICAgIHZhciB1cCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDEsIDApLmFwcGx5UXVhdGVybmlvbih0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uKTtcbiAgICB2YXIgcmlnaHQgPSBuZXcgVEhSRUUuVmVjdG9yMygxLCAwLCAwKS5hcHBseVF1YXRlcm5pb24odGhpcy5jYW1lcmEucXVhdGVybmlvbik7XG5cbiAgICB2YXIgbW92ZSA9IHVwLm11bHRpcGx5U2NhbGFyKGZvcndhcmRBbW91bnQpLmFkZChyaWdodC5tdWx0aXBseVNjYWxhcihyaWdodEFtb3VudCkpO1xuICAgIG1vdmUucHJvamVjdE9uUGxhbmUobm9ybWFsKTtcbiAgICBtb3ZlLnNldExlbmd0aCgxKTtcblxuICAgIHRoaXMuY2hhcmFjdGVyLm1vdmUobW92ZSwgMSk7XG5cbiAgICBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCdzcGFjZScpKSB7XG4gICAgICB0aGlzLmNoYXJhY3Rlci5qdW1wKCk7XG4gICAgfVxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXllckNvbnRyb2w7IiwidmFyIFRIUkVFID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ1RIUkVFJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydUSFJFRSddIDogbnVsbCk7XG5cbnZhciBSaWdpZEJvZHkgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgdGhpcy5vYmplY3QgPSBvYmplY3Q7XG4gIFxuICB0aGlzLnZlbG9jaXR5ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgXG4gIHRoaXMuYWNjZWxlcmF0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgXG4gIHRoaXMudHlwZSA9ICdyaWdpZEJvZHknO1xuICBcbiAgdGhpcy5mcmljdGlvbiA9IDAuOTg7XG5cbiAgLy8gMCBtYXNzIG1lYW5zIGltbW92YWJsZVxuICB0aGlzLm1hc3MgPSAwO1xuICBcbiAgdGhpcy5ncmF2aXR5ID0gbnVsbDtcblxuICB0aGlzLmNvbGxpc2lvbk9iamVjdCA9IG51bGw7XG59O1xuXG5SaWdpZEJvZHkucHJvdG90eXBlLmFwcGx5Rm9yY2UgPSBmdW5jdGlvbihmb3JjZSkge1xuICB0aGlzLmFjY2VsZXJhdGlvbi5hZGQoZm9yY2UuY2xvbmUoKS5tdWx0aXBseVNjYWxhcigxIC8gdGhpcy5tYXNzKSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJpZ2lkQm9keTsiLCJ2YXIgZXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcblxudmFyIGlkQ291bnQgPSAwO1xuXG5mdW5jdGlvbiBnZXROZXh0SWQoKSB7XG4gIHJldHVybiBpZENvdW50Kys7XG59XG5cbnZhciBFbmdpbmUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5lbnRpdHlNYXAgPSB7fTtcbiAgdGhpcy5sb29rdXAgPSB7fTtcbiAgdGhpcy5mcmFtZVJhdGUgPSA2MC4wO1xuICB0aGlzLnN5c3RlbXMgPSBbXTtcbiAgdGhpcy5iaW5kaW5ncyA9IHt9O1xufTtcblxuRW5naW5lLnByb3RvdHlwZS5hdHRhY2ggPSBmdW5jdGlvbihvYmplY3QsIGZhY3RvcnkpIHtcbiAgdmFyIGFyZ3MgPSBbb2JqZWN0XTtcbiAgdmFyIGNvbXBvbmVudDtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIGlmICh0eXBlb2YgZmFjdG9yeSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGlmIChmYWN0b3J5LiRpbmplY3QgIT0gbnVsbCkge1xuICAgICAgZmFjdG9yeS4kaW5qZWN0LmZvckVhY2goZnVuY3Rpb24oZGVwKSB7XG4gICAgICAgIGFyZ3MucHVzaChzZWxmLnJlc29sdmUoZGVwKSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgY29tcG9uZW50ID0gbmV3KEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kLmFwcGx5KGZhY3RvcnksIFtudWxsXS5jb25jYXQoYXJncykpKTtcbiAgfSBlbHNlIHtcbiAgICBjb21wb25lbnQgPSBmYWN0b3J5O1xuICB9XG5cbiAgaWYgKGNvbXBvbmVudCAhPSBudWxsKSB7XG4gICAgY29tcG9uZW50Lm9iamVjdCA9IG9iamVjdDtcblxuICAgIGlmIChvYmplY3QuX2lkID09IG51bGwpIHtcbiAgICAgIG9iamVjdC5faWQgPSBnZXROZXh0SWQoKTtcbiAgICAgIHRoaXMubG9va3VwW29iamVjdC5faWRdID0gb2JqZWN0O1xuICAgIH1cblxuICAgIGlmIChjb21wb25lbnQuX2lkID09IG51bGwpIHtcbiAgICAgIGNvbXBvbmVudC5faWQgPSBnZXROZXh0SWQoKTtcbiAgICAgIHRoaXMubG9va3VwW2NvbXBvbmVudC5faWRdID0gY29tcG9uZW50O1xuICAgIH1cblxuICAgIHZhciBjb21wb25lbnRzID0gdGhpcy5lbnRpdHlNYXBbb2JqZWN0Ll9pZF07XG4gICAgaWYgKGNvbXBvbmVudHMgPT0gbnVsbCkgY29tcG9uZW50cyA9IHRoaXMuZW50aXR5TWFwW29iamVjdC5faWRdID0ge307XG4gICAgY29tcG9uZW50c1tjb21wb25lbnQuX2lkXSA9IGNvbXBvbmVudDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zeXN0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgc3lzdGVtID0gdGhpcy5zeXN0ZW1zW2ldO1xuICAgICAgaWYgKHN5c3RlbS5vbkF0dGFjaCAhPSBudWxsKSBzeXN0ZW0ub25BdHRhY2gob2JqZWN0LCBjb21wb25lbnQpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjb21wb25lbnQ7XG59O1xuXG5FbmdpbmUucHJvdG90eXBlLnVzZSA9IGZ1bmN0aW9uKHR5cGUsIHN5c3RlbSkge1xuICB2YXIgaGFzVHlwZSA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJztcbiAgaWYgKCFoYXNUeXBlKSB7XG4gICAgc3lzdGVtID0gdHlwZTtcbiAgfVxuXG4gIGlmIChzeXN0ZW0gIT0gbnVsbCkge1xuICAgIHRoaXMuc3lzdGVtcy5wdXNoKHN5c3RlbSk7XG4gICAgaWYgKGhhc1R5cGUpIHtcbiAgICAgIHRoaXMudmFsdWUodHlwZSwgc3lzdGVtKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gc3lzdGVtO1xufTtcblxuRW5naW5lLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuZW1pdCgnYmVmb3JlVGljaycpO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zeXN0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHN5c3RlbSA9IHRoaXMuc3lzdGVtc1tpXTtcbiAgICBpZiAoc3lzdGVtLnRpY2sgIT0gbnVsbCkgc3lzdGVtLnRpY2soKTtcbiAgfVxuXG4gIGZvciAodmFyIGkgaW4gdGhpcy5lbnRpdHlNYXApIHtcbiAgICB2YXIgY29tcG9uZW50cyA9IHRoaXMuZW50aXR5TWFwW2ldO1xuICAgIGZvciAodmFyIGogaW4gY29tcG9uZW50cykge1xuICAgICAgdmFyIGNvbXBvbmVudCA9IGNvbXBvbmVudHNbal07XG4gICAgICBpZiAoY29tcG9uZW50LnRpY2sgIT0gbnVsbCkgY29tcG9uZW50LnRpY2soKTtcbiAgICB9XG4gIH1cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3lzdGVtcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBzeXN0ZW0gPSB0aGlzLnN5c3RlbXNbaV07XG4gICAgaWYgKHN5c3RlbS5sYXRlVGljayAhPSBudWxsKSBzeXN0ZW0ubGF0ZVRpY2soKTtcbiAgfVxuXG4gIHRoaXMuZW1pdCgnYWZ0ZXJUaWNrJyk7XG59O1xuXG5FbmdpbmUucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIGludGVydmFsID0gZnVuY3Rpb24oKSB7XG4gICAgc2VsZi50aWNrKCk7XG4gICAgc2V0VGltZW91dChpbnRlcnZhbCwgMTAwMCAvIHRoaXMuZnJhbWVSYXRlKTtcbiAgfVxuICBpbnRlcnZhbCgpO1xufTtcblxuRW5naW5lLnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uKHR5cGUsIG9iamVjdCkge1xuICB0aGlzLmJpbmRpbmdzW3R5cGVdID0ge1xuICAgIHZhbHVlOiBvYmplY3RcbiAgfTtcbn07XG5cbkVuZ2luZS5wcm90b3R5cGUucmVzb2x2ZSA9IGZ1bmN0aW9uKHR5cGUsIGNvbnRleHQpIHtcbiAgdmFyIGJpbmRpbmcgPSB0aGlzLmJpbmRpbmdzW3R5cGVdO1xuICBpZiAoYmluZGluZyA9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdiaW5kaW5nIGZvciB0eXBlICcgKyB0eXBlICsgJyBub3QgZm91bmQnKTtcbiAgfVxuXG4gIGlmIChiaW5kaW5nLmZhY3RvcnkgIT0gbnVsbCkge1xuICAgIHJldHVybiBiaW5kaW5nLmZhY3RvcnkoY29udGV4dCk7XG4gIH1cblxuICBpZiAoYmluZGluZy52YWx1ZSAhPSBudWxsKSB7XG4gICAgcmV0dXJuIGJpbmRpbmcudmFsdWU7XG4gIH1cblxuICByZXR1cm4gdW5kZWZpbmVkO1xufTtcblxuRW5naW5lLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbih0eXBlLCBjb250ZXh0KSB7XG4gIHJldHVybiB0aGlzLnJlc29sdmUodHlwZSwgY29udGV4dCk7XG59O1xuXG5FbmdpbmUucHJvdG90eXBlLmdldENvbXBvbmVudCA9IGZ1bmN0aW9uKG9iamVjdCwgdHlwZSkge1xuICB2YXIgY29tcG9uZW50cyA9IHRoaXMuZW50aXR5TWFwW29iamVjdC5faWRdO1xuICBmb3IgKHZhciBpZCBpbiBjb21wb25lbnRzKSB7XG4gICAgaWYgKGNvbXBvbmVudHNbaWRdLnR5cGUgPT09IHR5cGUpIHtcbiAgICAgIHJldHVybiBjb21wb25lbnRzW2lkXTtcbiAgICB9XG4gIH1cbn07XG5cbkVuZ2luZS5wcm90b3R5cGUubG9hZEFzc2VtYmx5ID0gZnVuY3Rpb24oYXNzZW1ibHkpIHtcbiAgcmV0dXJuIGFzc2VtYmx5KHRoaXMpO1xufTtcblxuZXZlbnRzLnByb3RvdHlwZS5hcHBseShFbmdpbmUucHJvdG90eXBlKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBFbmdpbmUoKTtcbn07IiwidmFyIEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9saXN0ZW5lcnMgPSB7fTtcbn07XG5cbkV2ZW50cy5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKGV2ZW50LCBvYmplY3QpIHtcbiAgdmFyIGNhbGxiYWNrcyA9IHRoaXMuX2xpc3RlbmVyc1tldmVudF07XG4gIGlmIChjYWxsYmFja3MgPT0gbnVsbCkge1xuICAgIHJldHVybjtcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBjYWxsYmFjayA9IGNhbGxiYWNrc1tpXTtcbiAgICBjYWxsYmFjayhvYmplY3QpO1xuICB9XG59O1xuXG5FdmVudHMucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oZXZlbnQsIGNhbGxiYWNrKSB7XG4gIHZhciBjYWxsYmFja3MgPSB0aGlzLl9saXN0ZW5lcnNbZXZlbnRdO1xuICBpZiAoY2FsbGJhY2tzID09IG51bGwpIHtcbiAgICBjYWxsYmFja3MgPSB0aGlzLl9saXN0ZW5lcnNbZXZlbnRdID0gW107XG4gIH1cbiAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xufTtcblxuRXZlbnRzLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbihldmVudCwgY2FsbGJhY2spIHtcbiAgdmFyIGNhbGxiYWNrcyA9IHRoaXMuX2xpc3RlbmVyc1tldmVudF07XG4gIGlmIChjYWxsYmFja3MgPT0gbnVsbCkge1xuICAgIHJldHVybjtcbiAgfVxuICBhcnJheVV0aWxzLnJlbW92ZShjYWxsYmFja3MsIGNhbGxiYWNrKTtcbn07XG5cbkV2ZW50cy5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbihvYmopIHtcbiAgb2JqLmVtaXQgPSB0aGlzLmVtaXQ7XG4gIG9iai5vbiA9IHRoaXMub247XG4gIG9iai5vZmYgPSB0aGlzLm9mZjtcbiAgb2JqLl9saXN0ZW5lcnMgPSB7fTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRzOyIsIm1vZHVsZS5leHBvcnRzPXtcbn0iLCJtb2R1bGUuZXhwb3J0cz1bXG4gIFwiIzdDN0M3Q1wiLFxuICBcIiMwMDAwRkNcIixcbiAgXCIjMDAwMEJDXCIsXG4gIFwiIzQ0MjhCQ1wiLFxuICBcIiM5NDAwODRcIixcbiAgXCIjQTgwMDIwXCIsXG4gIFwiI0E4MTAwMFwiLFxuICBcIiM4ODE0MDBcIixcbiAgXCIjNTAzMDAwXCIsXG4gIFwiIzAwNzgwMFwiLFxuICBcIiMwMDY4MDBcIixcbiAgXCIjMDA1ODAwXCIsXG4gIFwiIzAwNDA1OFwiLFxuICBcIiMwMDAwMDBcIixcblxuICBcIiNCQ0JDQkNcIixcbiAgXCIjMDA3OEY4XCIsXG4gIFwiIzAwNThGOFwiLFxuICBcIiM2ODQ0RkNcIixcbiAgXCIjRDgwMENDXCIsXG4gIFwiI0U0MDA1OFwiLFxuICBcIiNGODM4MDBcIixcbiAgXCIjRTQ1QzEwXCIsXG4gIFwiI0FDN0MwMFwiLFxuICBcIiMwMEI4MDBcIixcbiAgXCIjMDBBODAwXCIsXG4gIFwiIzAwQTg0NFwiLFxuICBcIiMwMDg4ODhcIiwge1xuICAgIFwic3JjXCI6IFwiL2ltYWdlcy9jbGVhci5wbmdcIixcbiAgICBcImlzQ2xlYXJDb2xvclwiOiB0cnVlXG4gIH0sXG5cbiAgXCIjRjhGOEY4XCIsXG4gIFwiIzNDQkNGQ1wiLFxuICBcIiM2ODg4RkNcIixcbiAgXCIjOTg3OEY4XCIsXG4gIFwiI0Y4NzhGOFwiLFxuICBcIiNGODU4OThcIixcbiAgXCIjRjg3ODU4XCIsXG4gIFwiI0ZDQTA0NFwiLFxuICBcIiNGOEI4MDBcIixcbiAgXCIjQjhGODE4XCIsXG4gIFwiIzU4RDg1NFwiLFxuICBcIiM1OEY4OThcIixcbiAgXCIjMDBFOEQ4XCIsXG4gIFwiIzc4Nzg3OFwiLFxuXG4gIFwiI0ZDRkNGQ1wiLFxuICBcIiNBNEU0RkNcIixcbiAgXCIjQjhCOEY4XCIsXG4gIFwiI0Q4QjhGOFwiLFxuICBcIiNGOEI4RjhcIixcbiAgXCIjRjhBNEMwXCIsXG4gIFwiI0YwRDBCMFwiLFxuICBcIiNGQ0UwQThcIixcbiAgXCIjRjhEODc4XCIsXG4gIFwiI0Q4Rjg3OFwiLFxuICBcIiNCOEY4QjhcIixcbiAgXCIjQjhGOEQ4XCIsXG4gIFwiIzAwRkNGQ1wiLFxuICBcIiNGOEQ4RjhcIixcbl0iLCJ2YXIgQmxvY2tDb21tYW5kID0gZnVuY3Rpb24oYmxvY2tzKSB7XG4gIHRoaXMuYmxvY2tzID0gYmxvY2tzO1xuXG4gIHRoaXMuc3ViQ29tbWFuZHMgPSBbXTtcblxuICB0aGlzLmRlbHRhcyA9IFtdO1xufTtcblxuQmxvY2tDb21tYW5kLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihjb29yZCwgdmFsdWUpIHtcbiAgdGhpcy5zdWJDb21tYW5kcy5wdXNoKHtcbiAgICBjb29yZDogY29vcmQsXG4gICAgdmFsdWU6IHZhbHVlXG4gIH0pO1xufTtcblxuQmxvY2tDb21tYW5kLnByb3RvdHlwZS5zZXRBdENvb3JkcyA9IGZ1bmN0aW9uKGNvb3JkcywgdmFsdWUpIHtcbiAgdGhpcy5zdWJDb21tYW5kcy5wdXNoKHtcbiAgICBjb29yZHM6IGNvb3JkcyxcbiAgICB2YWx1ZTogdmFsdWVcbiAgfSk7XG59O1xuXG5CbG9ja0NvbW1hbmQucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uKCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3ViQ29tbWFuZHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgc3ViQ29tbWFuZCA9IHRoaXMuc3ViQ29tbWFuZHNbaV07XG4gICAgdmFyIHZhbHVlID0gc3ViQ29tbWFuZC52YWx1ZTtcbiAgICB2YXIgY29vcmRzID0gc3ViQ29tbWFuZC5jb29yZHMgfHwgW3N1YkNvbW1hbmQuY29vcmRdO1xuXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBjb29yZHMubGVuZ3RoOyBqKyspIHtcbiAgICAgIHZhciBjb29yZCA9IGNvb3Jkc1tqXTtcbiAgICAgIHZhciBwcmV2aW91c1ZhbHVlID0gdGhpcy5ibG9ja3MuZ2V0QXRDb29yZChjb29yZCk7XG4gICAgICB0aGlzLmRlbHRhcy5wdXNoKHtcbiAgICAgICAgY29vcmQ6IGNvb3JkLFxuICAgICAgICBwcmV2aW91c1ZhbHVlOiBwcmV2aW91c1ZhbHVlXG4gICAgICB9KTtcblxuICAgICAgdGhpcy5ibG9ja3Muc2V0QXRDb29yZChjb29yZCwgdmFsdWUpO1xuICAgIH1cbiAgfVxufTtcblxuQmxvY2tDb21tYW5kLnByb3RvdHlwZS51bmRvID0gZnVuY3Rpb24oKSB7XG4gIGZvciAodmFyIGkgPSB0aGlzLmRlbHRhcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHZhciBkZWx0YSA9IHRoaXMuZGVsdGFzW2ldO1xuICAgIHRoaXMuYmxvY2tzLnNldEF0Q29vcmQoZGVsdGEuY29vcmQsIGRlbHRhLnByZXZpb3VzVmFsdWUpO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJsb2NrQ29tbWFuZDsiLCJ2YXIgQmxvY2tDb21tYW5kID0gcmVxdWlyZSgnLi9ibG9ja2NvbW1hbmQnKTtcbnZhciBhcnJheVV0aWxzID0gcmVxdWlyZSgnLi4vLi4vdXRpbHMvYXJyYXl1dGlscycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVkaXRvciwgYmxvY2tzLCBjb29yZHMsIG9mZnNldCkge1xuICB2YXIgY29tbWFuZCA9IG5ldyBCbG9ja0NvbW1hbmQoZWRpdG9yLmJsb2Nrcyk7XG5cbiAgdmFyIHRvQWRkID0gW107XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgY29vcmQgPSBjb29yZHNbaV07XG4gICAgdmFyIHZhbHVlID0gYmxvY2tzLmdldEF0Q29vcmQoY29vcmQpO1xuXG4gICAgLy8gUmVtb3ZlXG4gICAgY29tbWFuZC5zZXQoY29vcmRzW2ldLCB1bmRlZmluZWQpO1xuXG4gICAgdG9BZGQucHVzaCh7XG4gICAgICBjb29yZDogbm9ybWFsaXplQ29vcmQobmV3IFRIUkVFLlZlY3RvcjMoKS5hZGRWZWN0b3JzKGNvb3JkLCBvZmZzZXQpLCBibG9ja3MuZGltKSxcbiAgICAgIHZhbHVlOiB2YWx1ZVxuICAgIH0pO1xuICB9XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b0FkZC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBhZGQgPSB0b0FkZFtpXTtcblxuICAgIC8vIEFkZFxuICAgIGNvbW1hbmQuc2V0KGFkZC5jb29yZCwgYWRkLnZhbHVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZUNvb3JkKGNvb3JkLCBkaW0pIHtcbiAgICByZXR1cm4gbmV3IFRIUkVFLlZlY3RvcjMoXG4gICAgICAoY29vcmQueCArIGRpbVswXSkgJSBkaW1bMF0sXG4gICAgICAoY29vcmQueSArIGRpbVsxXSkgJSBkaW1bMV0sXG4gICAgICAoY29vcmQueiArIGRpbVsyXSkgJSBkaW1bMl1cbiAgICApO1xuICB9O1xuXG4gIHJldHVybiB7XG4gICAgc2VsZWN0aW9uQ29weTogbnVsbCxcbiAgICBydW46IGZ1bmN0aW9uKCkge1xuICAgICAgY29tbWFuZC5ydW4oKTtcbiAgICAgIHRoaXMuc2VsZWN0aW9uQ29weSA9IGFycmF5VXRpbHMuY2xvbmUoZWRpdG9yLnNlbGVjdGlvbnMpO1xuXG4gICAgICBpZiAoZWRpdG9yLnNlbGVjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyBPZmZzZXQgc2VsZWN0aW9uXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWRpdG9yLnNlbGVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB2YXIgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZUNvb3JkKG5ldyBUSFJFRS5WZWN0b3IzKCkuYWRkVmVjdG9ycyhlZGl0b3Iuc2VsZWN0aW9uc1tpXSwgb2Zmc2V0KSwgYmxvY2tzLmRpbSk7XG4gICAgICAgICAgZWRpdG9yLnNlbGVjdGlvbnNbaV0gPSBub3JtYWxpemVkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICB1bmRvOiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbW1hbmQudW5kbygpO1xuXG4gICAgICBpZiAoZWRpdG9yLnNlbGVjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyBPZmZzZXQgc2VsZWN0aW9uXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWRpdG9yLnNlbGVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB2YXIgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZUNvb3JkKG5ldyBUSFJFRS5WZWN0b3IzKCkuc3ViVmVjdG9ycyhlZGl0b3Iuc2VsZWN0aW9uc1tpXSwgb2Zmc2V0KSwgYmxvY2tzLmRpbSk7XG4gICAgICAgICAgZWRpdG9yLnNlbGVjdGlvbnNbaV0gPSBub3JtYWxpemVkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59OyIsInZhciBhcnJheVV0aWxzID0gcmVxdWlyZSgnLi4vLi4vdXRpbHMvYXJyYXl1dGlscycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVkaXRvciwgc2VsZWN0aW9ucykge1xuICB2YXIgb3JpZ2luYWxTZWxlY3Rpb25zID0gbnVsbDtcbiAgcmV0dXJuIHtcbiAgICBydW46IGZ1bmN0aW9uKCkge1xuICAgICAgb3JpZ2luYWxTZWxlY3Rpb25zID0gYXJyYXlVdGlscy5jbG9uZShlZGl0b3Iuc2VsZWN0aW9ucyk7XG4gICAgICBlZGl0b3Iuc2VsZWN0aW9ucyA9IHNlbGVjdGlvbnM7XG4gICAgfSxcblxuICAgIHVuZG86IGZ1bmN0aW9uKCkge1xuICAgICAgZWRpdG9yLnNlbGVjdGlvbnMgPSBvcmlnaW5hbFNlbGVjdGlvbnM7XG4gICAgfVxuICB9O1xufTsiLCJ2YXIgQmxvY2tDb21tYW5kID0gcmVxdWlyZSgnLi9ibG9ja2NvbW1hbmQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihibG9ja3MsIGNvb3JkcywgdmFsdWUpIHtcbiAgdmFyIGNvbW1hbmQgPSBuZXcgQmxvY2tDb21tYW5kKGJsb2Nrcyk7XG4gIGNvbW1hbmQuc2V0QXRDb29yZHMoY29vcmRzLCB2YWx1ZSk7XG5cbiAgcmV0dXJuIGNvbW1hbmQ7XG59OyIsInZhciBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydUSFJFRSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnVEhSRUUnXSA6IG51bGwpO1xuXG52YXIgRHJhZ0NhbWVyYSA9IGZ1bmN0aW9uKGNhbWVyYSwgaW5wdXQpIHtcbiAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XG4gIHRoaXMuaW5wdXQgPSBpbnB1dDtcblxuICB0aGlzLnJvdGF0aW9uID0gbmV3IFRIUkVFLkV1bGVyKC1NYXRoLlBJIC8gNCwgTWF0aC5QSSAvIDQsIDAsICdZWFonKTtcbiAgdGhpcy5sYXN0TW91c2UgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICB0aGlzLm1vdXNlU3BlZWRYID0gMC4wMTtcbiAgdGhpcy5tb3VzZVNwZWVkWSA9IDAuMDE7XG4gIHRoaXMubW91c2VLZXlTcGVlZFggPSAwLjAzO1xuICB0aGlzLm1vdXNlS2V5U3BlZWRZID0gMC4wMztcbiAgdGhpcy51bml0VmVjdG9yID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMSk7XG4gIHRoaXMuZGlzdGFuY2UgPSA1MDtcbiAgdGhpcy50YXJnZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAwKTtcbiAgdGhpcy5tYXhQaXRjaCA9IE1hdGguUEkgLyAyIC0gMC4wMTtcbiAgdGhpcy5taW5QaXRjaCA9IC1NYXRoLlBJIC8gMiArIDAuMDE7XG4gIHRoaXMuem9vbVJhdGUgPSAxLjE7XG5cbiAgdGhpcy51cGRhdGVDYW1lcmEoKTtcblxuICB0aGlzLmxvY2sgPSBmYWxzZTtcbn07XG5cbkRyYWdDYW1lcmEuJGluamVjdCA9IFsnaW5wdXQnXTtcblxuRHJhZ0NhbWVyYS5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnByb2Nlc3NJbnB1dCgpO1xuXG4gIHRoaXMudXBkYXRlQ2FtZXJhKCk7XG59O1xuXG5EcmFnQ2FtZXJhLnByb3RvdHlwZS5wcm9jZXNzSW5wdXQgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuaW5wdXQubW91c2VIb2xkKCkpIHtcbiAgICBpZiAoIXRoaXMubG9jaykge1xuICAgICAgdmFyIGRpZmYgPSBuZXcgVEhSRUUuVmVjdG9yMigpLnN1YlZlY3RvcnModGhpcy5pbnB1dC5tb3VzZSwgdGhpcy5sYXN0TW91c2UpO1xuICAgICAgdGhpcy5yb3RhdGlvbi55ICs9IGRpZmYueCAqIHRoaXMubW91c2VTcGVlZFk7XG4gICAgICB0aGlzLnJvdGF0aW9uLnggKz0gZGlmZi55ICogdGhpcy5tb3VzZVNwZWVkWDtcblxuICAgICAgaWYgKHRoaXMucm90YXRpb24ueCA8IHRoaXMubWluUGl0Y2gpIHRoaXMucm90YXRpb24ueCA9IHRoaXMubWluUGl0Y2g7XG4gICAgICBpZiAodGhpcy5yb3RhdGlvbi54ID4gdGhpcy5tYXhQaXRjaCkgdGhpcy5yb3RhdGlvbi54ID0gdGhpcy5tYXhQaXRjaDtcbiAgICB9XG4gIH1cblxuICB2YXIgcm90YXRlUmlnaHQgPSAwO1xuICB2YXIgcm90YXRlVXAgPSAwO1xuICBpZiAodGhpcy5pbnB1dC5rZXlIb2xkKCdyaWdodCcpKSB7XG4gICAgcm90YXRlUmlnaHQrKztcbiAgfVxuICBpZiAodGhpcy5pbnB1dC5rZXlIb2xkKCdsZWZ0JykpIHtcbiAgICByb3RhdGVSaWdodC0tO1xuICB9XG4gIGlmICh0aGlzLmlucHV0LmtleUhvbGQoJ3VwJykpIHtcbiAgICByb3RhdGVVcCsrO1xuICB9XG4gIGlmICh0aGlzLmlucHV0LmtleUhvbGQoJ2Rvd24nKSkge1xuICAgIHJvdGF0ZVVwLS07XG4gIH1cblxuICB0aGlzLnJvdGF0aW9uLnggKz0gcm90YXRlVXAgKiB0aGlzLm1vdXNlS2V5U3BlZWRYO1xuICB0aGlzLnJvdGF0aW9uLnkgLT0gcm90YXRlUmlnaHQgKiB0aGlzLm1vdXNlS2V5U3BlZWRZO1xuXG4gIHRoaXMubGFzdE1vdXNlLmNvcHkodGhpcy5pbnB1dC5tb3VzZSk7XG5cbiAgaWYgKHRoaXMuaW5wdXQua2V5VXAoJz0nKSkge1xuICAgIHRoaXMuZGlzdGFuY2UgLz0gdGhpcy56b29tUmF0ZTtcbiAgfSBlbHNlIGlmICh0aGlzLmlucHV0LmtleVVwKCctJykpIHtcbiAgICB0aGlzLmRpc3RhbmNlICo9IHRoaXMuem9vbVJhdGU7XG4gIH1cbn07XG5cbkRyYWdDYW1lcmEucHJvdG90eXBlLnVwZGF0ZUNhbWVyYSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcG9zaXRpb24gPSB0aGlzLnVuaXRWZWN0b3IuY2xvbmUoKS5hcHBseUV1bGVyKHRoaXMucm90YXRpb24pLnNldExlbmd0aCh0aGlzLmRpc3RhbmNlKS5hZGQodGhpcy50YXJnZXQpO1xuICB0aGlzLmNhbWVyYS5wb3NpdGlvbi5jb3B5KHBvc2l0aW9uKTtcbiAgdGhpcy5jYW1lcmEubG9va0F0KHRoaXMudGFyZ2V0KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRHJhZ0NhbWVyYTsiLCJ2YXIgVEhSRUUgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snVEhSRUUnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ1RIUkVFJ10gOiBudWxsKTtcbnZhciBDQnVmZmVyID0gcmVxdWlyZSgnY2J1ZmZlcicpO1xudmFyIGJsb2Nrc0NvbXBvbmVudCA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvYmxvY2tzJyk7XG52YXIgZHJhZ0NhbWVyYUNvbXBvbmVudCA9IHJlcXVpcmUoJy4vZHJhZ2NhbWVyYScpO1xudmFyIGVkaXRvckNvbnNvbGUgPSByZXF1aXJlKCcuL2VkaXRvcmNvbnNvbGUnKTtcbnZhciBFZGl0b3JUb29scyA9IHJlcXVpcmUoJy4vZWRpdG9ydG9vbHMnKTtcbnZhciBPZmZzZXRDb21tYW5kID0gcmVxdWlyZSgnLi9jb21tYW5kcy9vZmZzZXRjb21tYW5kJyk7XG52YXIgQmxvY2tzID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9ibG9ja3MnKTtcbnZhciBhcnJheVV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMvYXJyYXl1dGlscycpO1xuXG52YXIgdG9vbEJhciA9IHJlcXVpcmUoJy4vZ3VpL3Rvb2xiYXInKTtcbnZhciBhcnJvd0JhciA9IHJlcXVpcmUoJy4vZ3VpL2Fycm93YmFyJyk7XG52YXIgZmlsZUJhciA9IHJlcXVpcmUoJy4vZ3VpL2ZpbGViYXInKTtcbnZhciBwcmVmYWJzQmFyID0gcmVxdWlyZSgnLi9ndWkvcHJlZmFic2JhcicpO1xudmFyIHByZWZhYnNUb29sQmFyID0gcmVxdWlyZSgnLi9ndWkvcHJlZmFic3Rvb2xiYXInKTtcbnZhciBjb2xvckJhciA9IHJlcXVpcmUoJy4vZ3VpL2NvbG9yYmFyJyk7XG52YXIgcHJvcGVydHlQYW5lbCA9IHJlcXVpcmUoJy4vZ3VpL3Byb3BlcnR5cGFuZWwnKTtcblxudmFyIFBlblRvb2wgPSByZXF1aXJlKCcuL3Rvb2xzL3BlbnRvb2wnKTtcbnZhciBTYW1wbGVUb29sID0gcmVxdWlyZSgnLi90b29scy9zYW1wbGV0b29sJyk7XG52YXIgU2VsZWN0VG9vbCA9IHJlcXVpcmUoJy4vdG9vbHMvc2VsZWN0dG9vbCcpO1xudmFyIENhbWVyYVRvb2wgPSByZXF1aXJlKCcuL3Rvb2xzL2NhbWVyYXRvb2wnKTtcbnZhciBGaWxsVG9vbCA9IHJlcXVpcmUoJy4vdG9vbHMvZmlsbHRvb2wnKTtcblxudmFyIEVkaXRvciA9IGZ1bmN0aW9uKG9iamVjdCwgYXBwLCBpbnB1dCwgY2FtZXJhLCBkZXZDb25zb2xlLCBjb25maWcsIHBhbGV0dGUsIGNhbnZhcywgcHJlZmFiU2VydmljZSkge1xuXG4gIHRoaXMub2JqZWN0ID0gb2JqZWN0O1xuXG4gIHRoaXMuYXBwID0gYXBwO1xuXG4gIHRoaXMuaW5wdXQgPSBpbnB1dDtcblxuICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcblxuICB0aGlzLmRldkNvbnNvbGUgPSBkZXZDb25zb2xlO1xuXG4gIHRoaXMuY29uZmlnID0gY29uZmlnO1xuXG4gIHRoaXMucGFsZXR0ZSA9IHBhbGV0dGU7XG5cbiAgdGhpcy5jYW52YXMgPSBjYW52YXM7XG5cbiAgdGhpcy5wcmVmYWJTZXJ2aWNlID0gcHJlZmFiU2VydmljZTtcblxuICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gIHRoaXMuYmxvY2tzID0gbnVsbDtcblxuICB0aGlzLmRyYWdDYW1lcmEgPSBudWxsO1xuXG4gIHRoaXMub2JqR3JvdW5kID0gbnVsbDtcblxuICB0aGlzLm9iakJvdW5kaW5nQm94ID0gbnVsbDtcblxuICB0aGlzLl9zdGFydGVkID0gZmFsc2U7XG5cbiAgdGhpcy5tYXRlcmlhbHMgPSBbXTtcblxuICB0aGlzLnNlbGVjdGVkQ29sb3IgPSBudWxsO1xuXG4gIHRoaXMudW5kb3MgPSBDQnVmZmVyKDIwMCk7XG5cbiAgdGhpcy5yZWRvcyA9IENCdWZmZXIoMjAwKTtcblxuICB0aGlzLmNvbG9yQmFyID0gbnVsbDtcblxuICB0aGlzLnByZWZhYnNCYXIgPSBudWxsO1xuXG4gIHRoaXMucHJlZmFiVG9vbGJhciA9IG51bGw7XG5cbiAgdGhpcy50b29sQmFyID0gbnVsbDtcblxuICB0aGlzLmFycm93QmFyID0gbnVsbDtcblxuICB0aGlzLmZpbGVCYXIgPSBudWxsO1xuXG4gIHRoaXMudG9vbE5hbWVzID0gW0VkaXRvclRvb2xzLlBlbiwgRWRpdG9yVG9vbHMuU2FtcGxlLCBFZGl0b3JUb29scy5TZWxlY3QsIEVkaXRvclRvb2xzLkNhbWVyYSwgRWRpdG9yVG9vbHMuRmlsbF07XG5cbiAgdGhpcy50b29sTmFtZSA9IEVkaXRvclRvb2xzLlBlbjtcblxuICB0aGlzLnRvb2wgPSBudWxsO1xuXG4gIHRoaXMuc2VsZWN0aW9ucyA9IFtdO1xuXG4gIHRoaXMucmVmbGVjdFggPSBmYWxzZTtcblxuICB0aGlzLnJlZmxlY3RZID0gZmFsc2U7XG5cbiAgdGhpcy5yZWZsZWN0WiA9IGZhbHNlO1xuXG4gIC8vIGxvYWRlZCBzYXZlc1xuICB0aGlzLnByZWZhYnMgPSBbXTtcblxuICB0aGlzLnNjcmVlbnNob3RSZW5kZXJlciA9IG51bGw7XG5cbiAgLy8gQ29weSBvZiBibG9jayBvYmplY3RcbiAgdGhpcy5sYXN0QmxvY2tzID0gbnVsbDtcblxuICB0aGlzLm9iakhpZ2hsaWdodCA9IG51bGw7XG5cbiAgdGhpcy5zbiA9IDAuMDAwMTtcblxuICB0aGlzLmhpZ2hsaWdodENvb3JkID0gbnVsbDtcblxuICB0aGlzLmRvd25sb2FkRWxlbWVudCA9IG51bGw7XG5cbiAgdGhpcy5lZGl0TG9jayA9IGZhbHNlO1xuXG4gIHRoaXMuY2FtZXJhTG9jayA9IGZhbHNlO1xuXG4gIHRoaXMucHJvcGVydHlQYW5lbCA9IG51bGw7XG5cbiAgdGhpcy5wcmVmYWJJbmRleCA9IDA7XG59O1xuXG5FZGl0b3IuJGluamVjdCA9IFsnYXBwJywgJ2lucHV0JywgJ2NhbWVyYScsICdkZXZDb25zb2xlJywgJ2NvbmZpZycsICdwYWxldHRlJywgJ2NhbnZhcycsICdwcmVmYWJTZXJ2aWNlJ107XG5cbkVkaXRvci5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgZWRpdG9yQ29uc29sZSh0aGlzLCB0aGlzLmRldkNvbnNvbGUpO1xuXG4gIHRoaXMucHJlZmFicyA9IHRoaXMucHJlZmFiU2VydmljZS5sb2FkKCk7XG5cbiAgdGhpcy5ibG9ja3MgPSB0aGlzLmFwcC5hdHRhY2godGhpcy5vYmplY3QsIGJsb2Nrc0NvbXBvbmVudCk7XG5cbiAgdGhpcy5kcmFnQ2FtZXJhID0gdGhpcy5hcHAuYXR0YWNoKHRoaXMuY2FtZXJhLCBkcmFnQ2FtZXJhQ29tcG9uZW50KTtcblxuICB0aGlzLnVwZGF0ZVRvb2woKTtcblxuICB0aGlzLnVwZGF0ZU1hdGVyaWFsKHRoaXMuYmxvY2tzKTtcblxuICB0aGlzLnNlbGVjdGVkQ29sb3IgPSB0aGlzLnBhbGV0dGVbMF07XG5cbiAgLy8gU2V0IHVwIEdVSVxuICB0aGlzLnRvb2xCYXIgPSB0b29sQmFyKHRoaXMpO1xuICB0aGlzLmFycm93QmFyID0gYXJyb3dCYXIodGhpcyk7XG4gIHRoaXMuZmlsZUJhciA9IGZpbGVCYXIodGhpcyk7XG4gIHRoaXMuY29sb3JCYXIgPSBjb2xvckJhcih0aGlzKTtcbiAgdGhpcy5wcmVmYWJzQmFyID0gcHJlZmFic0Jhcih0aGlzKTtcbiAgdGhpcy5wcmVmYWJzVG9vbGJhciA9IHByZWZhYnNUb29sQmFyKHRoaXMpO1xuICB0aGlzLnByb3BlcnR5UGFuZWwgPSBwcm9wZXJ0eVBhbmVsKHRoaXMpO1xuXG4gIGlmICh0aGlzLnByZWZhYnMubGVuZ3RoID09PSAwKSB7XG4gICAgdGhpcy5wcmVmYWJzLnB1c2godGhpcy5ibG9ja3Muc2VyaWFsaXplKCkpO1xuICB9XG5cbiAgdGhpcy5sb2FkKHRoaXMucHJlZmFic1swXSk7XG4gIHRoaXMudXBkYXRlU2NyZWVuc2hvdHMoKTtcblxuICB0aGlzLmNvbG9yQmFyLmhpZ2hsaWdodCgwKTtcbiAgdGhpcy5wcmVmYWJzQmFyLmhpZ2hsaWdodCgwKTtcbiAgdGhpcy50b29sQmFyLmhpZ2hsaWdodCgwKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUuc2V0VG9vbCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgdmFyIGluZGV4ID0gYXJyYXlVdGlscy5pbmRleE9mKHRoaXMudG9vbE5hbWVzLCBuYW1lKTtcbiAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMudG9vbEJhci5oaWdobGlnaHQoaW5kZXgpO1xuICB0aGlzLnRvb2xOYW1lID0gbmFtZTtcbiAgdGhpcy51cGRhdGVUb29sKCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCF0aGlzLl9zdGFydGVkKSB7XG4gICAgdGhpcy5zdGFydCgpO1xuICAgIHRoaXMuX3N0YXJ0ZWQgPSB0cnVlO1xuICB9XG5cbiAgdGhpcy5jb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcblxuICB2YXIgaGFzSW50ZXJzZWN0ID0gdGhpcy5nZXRDb29yZEFib3ZlKCkgIT0gbnVsbDtcblxuICBpZiAoIWhhc0ludGVyc2VjdCAmJiB0aGlzLmlucHV0Lm1vdXNlRG93bigpKSB7XG4gICAgdGhpcy5lZGl0TG9jayA9IHRydWU7XG4gIH1cblxuICBpZiAoaGFzSW50ZXJzZWN0ICYmIHRoaXMuaW5wdXQubW91c2VEb3duKCkpIHtcbiAgICB0aGlzLmNhbWVyYUxvY2sgPSB0cnVlO1xuICB9XG5cbiAgaWYgKHRoaXMuaW5wdXQubW91c2VVcCgpKSB7XG4gICAgdGhpcy5lZGl0TG9jayA9IGZhbHNlO1xuICAgIHRoaXMuY2FtZXJhTG9jayA9IGZhbHNlO1xuICB9XG5cbiAgaWYgKHRoaXMudG9vbE5hbWUgPT09IEVkaXRvclRvb2xzLlNlbGVjdCB8fCB0aGlzLnRvb2xOYW1lID09PSBFZGl0b3JUb29scy5TYW1wbGUpIHtcbiAgICB0aGlzLmNhbWVyYUxvY2sgPSB0cnVlO1xuICB9IGVsc2UgaWYgKHRoaXMudG9vbE5hbWUgPT09IEVkaXRvclRvb2xzLkNhbWVyYSkge1xuICAgIHRoaXMuY2FtZXJhTG9jayA9IGZhbHNlO1xuICB9XG5cbiAgdGhpcy5kcmFnQ2FtZXJhLmxvY2sgPSB0aGlzLmNhbWVyYUxvY2s7XG5cbiAgdGhpcy50b29sLnRpY2soKTtcblxuICB0aGlzLnVwZGF0ZUhpZ2hsaWdodCh0aGlzLmhpZ2hsaWdodENvb3JkKTtcblxuICB0aGlzLmRyYXdTZWxlY3Rpb24oKTtcblxuICB2YXIgb2Zmc2V0Q29vcmQgPSBudWxsO1xuICBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCdmJykpIHtcbiAgICBvZmZzZXRDb29yZCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIC0xLCAwKTtcbiAgfVxuICBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCdyJykpIHtcbiAgICBvZmZzZXRDb29yZCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDEsIDApO1xuICB9XG4gIGlmICh0aGlzLmlucHV0LmtleURvd24oJ2EnKSkge1xuICAgIG9mZnNldENvb3JkID0gbmV3IFRIUkVFLlZlY3RvcjMoLTEsIDAsIDApO1xuICB9XG4gIGlmICh0aGlzLmlucHV0LmtleURvd24oJ2QnKSkge1xuICAgIG9mZnNldENvb3JkID0gbmV3IFRIUkVFLlZlY3RvcjMoMSwgMCwgMCk7XG4gIH1cbiAgaWYgKHRoaXMuaW5wdXQua2V5RG93bigndycpKSB7XG4gICAgb2Zmc2V0Q29vcmQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSk7XG4gIH1cbiAgaWYgKHRoaXMuaW5wdXQua2V5RG93bigncycpKSB7XG4gICAgb2Zmc2V0Q29vcmQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAxKTtcbiAgfVxuXG4gIGlmIChvZmZzZXRDb29yZCAhPSBudWxsKSB7XG4gICAgdGhpcy5hcHBseU9mZnNldChvZmZzZXRDb29yZCk7XG4gIH1cblxuICBpZiAodGhpcy5pbnB1dC5rZXlIb2xkKCdjb21tYW5kJykgJiYgdGhpcy5pbnB1dC5rZXlIb2xkKCdzaGlmdCcpKSB7XG4gICAgaWYgKHRoaXMuaW5wdXQua2V5RG93bigneicpKSB7XG4gICAgICB0aGlzLnJlZG8oKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodGhpcy5pbnB1dC5rZXlIb2xkKCdjb21tYW5kJykpIHtcbiAgICBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCd6JykpIHtcbiAgICAgIHRoaXMudW5kbygpO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0aGlzLmlucHV0LmtleURvd24oJzEnKSkge1xuICAgIHRoaXMuc2V0VG9vbCh0aGlzLnRvb2xOYW1lc1swXSk7XG4gIH0gZWxzZSBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCcyJykpIHtcbiAgICB0aGlzLnNldFRvb2wodGhpcy50b29sTmFtZXNbMV0pO1xuICB9IGVsc2UgaWYgKHRoaXMuaW5wdXQua2V5RG93bignMycpKSB7XG4gICAgdGhpcy5zZXRUb29sKHRoaXMudG9vbE5hbWVzWzJdKTtcbiAgfSBlbHNlIGlmICh0aGlzLmlucHV0LmtleURvd24oJzQnKSkge1xuICAgIHRoaXMuc2V0VG9vbCh0aGlzLnRvb2xOYW1lc1szXSk7XG4gIH0gZWxzZSBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCc1JykpIHtcbiAgICB0aGlzLnNldFRvb2wodGhpcy50b29sTmFtZXNbNF0pO1xuICB9XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnVuZG8gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGNvbW1hbmQgPSB0aGlzLnVuZG9zLmxhc3QoKTtcbiAgaWYgKGNvbW1hbmQgPT0gbnVsbCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb21tYW5kLnVuZG8oKTtcbiAgdGhpcy51bmRvcy5wb3AoKTtcbiAgdGhpcy5yZWRvcy5wdXNoKGNvbW1hbmQpO1xuICB0aGlzLnVwZGF0ZUN1cnJlbnRTY3JlZW5zaG90KCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnJlZG8gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGNvbW1hbmQgPSB0aGlzLnJlZG9zLmxhc3QoKTtcbiAgaWYgKGNvbW1hbmQgPT0gbnVsbCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb21tYW5kLnJ1bigpO1xuICB0aGlzLnJlZG9zLnBvcCgpO1xuICB0aGlzLnVuZG9zLnB1c2goY29tbWFuZCk7XG4gIHRoaXMudXBkYXRlQ3VycmVudFNjcmVlbnNob3QoKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUucnVuQ29tbWFuZCA9IGZ1bmN0aW9uKGNvbW1hbmQpIHtcbiAgY29tbWFuZC5ydW4oKTtcbiAgdGhpcy51bmRvcy5wdXNoKGNvbW1hbmQpO1xuICB0aGlzLnJlZG9zID0gQ0J1ZmZlcigyMDApO1xuICB0aGlzLnVwZGF0ZUN1cnJlbnRTY3JlZW5zaG90KCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnVwZGF0ZUN1cnJlbnRTY3JlZW5zaG90ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpbmRleCA9IHRoaXMucHJlZmFiSW5kZXg7XG4gIHRoaXMucHJlZmFic1tpbmRleF0gPSB0aGlzLmJsb2Nrcy5zZXJpYWxpemUoKTtcbiAgdGhpcy51cGRhdGVTY3JlZW5zaG90QXRJbmRleChpbmRleCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnVwZGF0ZVNjcmVlbnNob3RzID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucHJlZmFic0Jhci5jbGVhcigpO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJzLmxlbmd0aDsgaSsrKSB7XG4gICAgdGhpcy51cGRhdGVTY3JlZW5zaG90QXRJbmRleChpKTtcbiAgfVxufTtcblxuRWRpdG9yLnByb3RvdHlwZS51cGRhdGVTY3JlZW5zaG90QXRJbmRleCA9IGZ1bmN0aW9uKGluZGV4KSB7XG4gIHZhciBwcmVmYWIgPSB0aGlzLnByZWZhYnNbaW5kZXhdO1xuICB2YXIgaW1nRGF0YSA9IHRoaXMuc2NyZWVuc2hvdChwcmVmYWIpO1xuXG4gIHRoaXMucHJlZmFic0Jhci5zZXQoaW5kZXgsIHtcbiAgICBpbWdEYXRhOiBpbWdEYXRhLFxuICAgIGluZGV4OiBpbmRleFxuICB9KTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUudXBkYXRlTWF0ZXJpYWwgPSBmdW5jdGlvbihibG9ja3MpIHtcbiAgdmFyIG1hdGVyaWFscyA9IGJsb2Nrcy5tYXRlcmlhbC5tYXRlcmlhbHM7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tYXRlcmlhbHMubGVuZ3RoOyBpKyspIHtcbiAgICBtYXRlcmlhbHNbaV0gPSB0aGlzLm1hdGVyaWFsc1tpXTtcbiAgfVxufTtcblxuRWRpdG9yLnByb3RvdHlwZS51cGRhdGVTaXplID0gZnVuY3Rpb24oc2l6ZSkge1xuICB0aGlzLmJsb2Nrcy5zZXREaW0oW3NpemVbMF0sIHNpemVbMV0sIHNpemVbMl1dKTtcbiAgdGhpcy5ibG9ja3Mub2JqLnBvc2l0aW9uLnNldCgtc2l6ZVswXSAvIDIsIC1zaXplWzFdIC8gMiwgLXNpemVbMl0gLyAyKTtcbiAgdGhpcy51cGRhdGVHcm91bmQoc2l6ZSk7XG4gIHRoaXMudXBkYXRlQm91bmRpbmdCb3goc2l6ZSk7XG5cbiAgLy8gTWF4IGZyb20gMyBudW1iZXJzXG4gIHZhciBtYXhTaXplID0gTWF0aC5tYXgoc2l6ZVswXSwgc2l6ZVsxXSwgc2l6ZVsyXSk7XG4gIHRoaXMuZHJhZ0NhbWVyYS5kaXN0YW5jZSA9IDIgKiAobWF4U2l6ZSk7XG4gIHRoaXMudXBkYXRlQ3VycmVudFByZWZhYigpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS51cGRhdGVHcm91bmQgPSBmdW5jdGlvbihzaXplKSB7XG4gIGlmICh0aGlzLm9iakdyb3VuZCAhPSBudWxsKSB7XG4gICAgdGhpcy5vYmplY3QucmVtb3ZlKHRoaXMub2JqR3JvdW5kKTtcbiAgfVxuXG4gIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5HZW9tZXRyeSgpO1xuICBnZW9tZXRyeS52ZXJ0aWNlcy5wdXNoKFxuICAgIG5ldyBUSFJFRS5WZWN0b3IzKC1zaXplWzBdIC8gMiwgLXNpemVbMV0gLyAyLCAtc2l6ZVsyXSAvIDIpLFxuICAgIG5ldyBUSFJFRS5WZWN0b3IzKHNpemVbMF0gLyAyLCAtc2l6ZVsxXSAvIDIsIC1zaXplWzJdIC8gMiksXG4gICAgbmV3IFRIUkVFLlZlY3RvcjMoc2l6ZVswXSAvIDIsIC1zaXplWzFdIC8gMiwgc2l6ZVsyXSAvIDIpLFxuICAgIG5ldyBUSFJFRS5WZWN0b3IzKC1zaXplWzBdIC8gMiwgLXNpemVbMV0gLyAyLCBzaXplWzJdIC8gMilcbiAgKTtcbiAgZ2VvbWV0cnkuZmFjZXMucHVzaChcbiAgICBuZXcgVEhSRUUuRmFjZTMoMiwgMSwgMCksXG4gICAgbmV3IFRIUkVFLkZhY2UzKDAsIDMsIDIpXG4gICk7XG4gIGdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF0ucHVzaChcbiAgICBbXG4gICAgICBuZXcgVEhSRUUuVmVjdG9yMigwLCAwKSxcbiAgICAgIG5ldyBUSFJFRS5WZWN0b3IyKHNpemVbMl0gLyAyLCAwKSxcbiAgICAgIG5ldyBUSFJFRS5WZWN0b3IyKHNpemVbMl0gLyAyLCBzaXplWzBdIC8gMilcbiAgICBdLCBbXG4gICAgICBuZXcgVEhSRUUuVmVjdG9yMihzaXplWzJdIC8gMiwgc2l6ZVswXSAvIDIpLFxuICAgICAgbmV3IFRIUkVFLlZlY3RvcjIoMCwgc2l6ZVswXSAvIDIpLFxuICAgICAgbmV3IFRIUkVFLlZlY3RvcjIoMCwgMClcbiAgICBdXG4gICk7XG4gIHZhciBtYXRlcmlhbCA9IG1hdGVyaWFsc1sncGxhY2Vob2xkZXInXTtcbiAgdGhpcy5vYmpHcm91bmQgPSBuZXcgVEhSRUUuTWVzaChnZW9tZXRyeSwgbWF0ZXJpYWwpO1xuICB0aGlzLm9iamVjdC5hZGQodGhpcy5vYmpHcm91bmQpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS51cGRhdGVCb3VuZGluZ0JveCA9IGZ1bmN0aW9uKHNpemUpIHtcbiAgaWYgKHRoaXMub2JqQm91bmRpbmdCb3ggIT0gbnVsbCkge1xuICAgIHRoaXMub2JqZWN0LnJlbW92ZSh0aGlzLm9iakJvdW5kaW5nQm94KTtcbiAgfVxuXG4gIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5HZW9tZXRyeSgpO1xuXG4gIHZhciBhID0gbmV3IFRIUkVFLlZlY3RvcjMoLXNpemVbMF0gLyAyLCAtc2l6ZVsxXSAvIDIsIC1zaXplWzJdIC8gMik7XG4gIHZhciBiID0gbmV3IFRIUkVFLlZlY3RvcjMoc2l6ZVswXSAvIDIsIC1zaXplWzFdIC8gMiwgLXNpemVbMl0gLyAyKTtcbiAgdmFyIGMgPSBuZXcgVEhSRUUuVmVjdG9yMyhzaXplWzBdIC8gMiwgLXNpemVbMV0gLyAyLCBzaXplWzJdIC8gMik7XG4gIHZhciBkID0gbmV3IFRIUkVFLlZlY3RvcjMoLXNpemVbMF0gLyAyLCAtc2l6ZVsxXSAvIDIsIHNpemVbMl0gLyAyKTtcblxuICB2YXIgZSA9IG5ldyBUSFJFRS5WZWN0b3IzKC1zaXplWzBdIC8gMiwgc2l6ZVsxXSAvIDIsIC1zaXplWzJdIC8gMik7XG4gIHZhciBmID0gbmV3IFRIUkVFLlZlY3RvcjMoc2l6ZVswXSAvIDIsIHNpemVbMV0gLyAyLCAtc2l6ZVsyXSAvIDIpO1xuICB2YXIgZyA9IG5ldyBUSFJFRS5WZWN0b3IzKHNpemVbMF0gLyAyLCBzaXplWzFdIC8gMiwgc2l6ZVsyXSAvIDIpO1xuICB2YXIgaCA9IG5ldyBUSFJFRS5WZWN0b3IzKC1zaXplWzBdIC8gMiwgc2l6ZVsxXSAvIDIsIHNpemVbMl0gLyAyKTtcblxuICBnZW9tZXRyeS52ZXJ0aWNlcy5wdXNoKGEsIGUsIGIsIGYsIGMsIGcsIGQsIGgsIGUsIGYsIGYsIGcsIGcsIGgsIGgsIGUpO1xuXG4gIHZhciBtYXRlcmlhbCA9IG5ldyBUSFJFRS5MaW5lQmFzaWNNYXRlcmlhbCh7XG4gICAgY29sb3I6IDB4ZmZmZmZmLFxuICAgIHRyYW5zcGFyZW50OiB0cnVlLFxuICAgIG9wYWNpdHk6IDAuNVxuICB9KTtcbiAgdGhpcy5vYmpCb3VuZGluZ0JveCA9IG5ldyBUSFJFRS5MaW5lU2VnbWVudHMoZ2VvbWV0cnksIG1hdGVyaWFsKTtcbiAgdGhpcy5vYmplY3QuYWRkKHRoaXMub2JqQm91bmRpbmdCb3gpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS51cGRhdGVUb29sID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLnRvb2wgIT0gbnVsbCkge1xuICAgIGlmICh0aGlzLnRvb2wuZGlzcG9zZSAhPSBudWxsKSB7XG4gICAgICB0aGlzLnRvb2wuZGlzcG9zZSgpO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0aGlzLnRvb2xOYW1lID09PSBFZGl0b3JUb29scy5QZW4pIHtcbiAgICB0aGlzLnRvb2wgPSBuZXcgUGVuVG9vbCh0aGlzKTtcbiAgfSBlbHNlIGlmICh0aGlzLnRvb2xOYW1lID09PSBFZGl0b3JUb29scy5TYW1wbGUpIHtcbiAgICB0aGlzLnRvb2wgPSBuZXcgU2FtcGxlVG9vbCh0aGlzKTtcbiAgfSBlbHNlIGlmICh0aGlzLnRvb2xOYW1lID09PSBFZGl0b3JUb29scy5TZWxlY3QpIHtcbiAgICB0aGlzLnRvb2wgPSBuZXcgU2VsZWN0VG9vbCh0aGlzKTtcbiAgfSBlbHNlIGlmICh0aGlzLnRvb2xOYW1lID09PSBFZGl0b3JUb29scy5DYW1lcmEpIHtcbiAgICB0aGlzLnRvb2wgPSBuZXcgQ2FtZXJhVG9vbCh0aGlzKTtcbiAgfSBlbHNlIGlmICh0aGlzLnRvb2xOYW1lID09PSBFZGl0b3JUb29scy5GaWxsKSB7XG4gICAgdGhpcy50b29sID0gbmV3IEZpbGxUb29sKHRoaXMpO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IG1ha2UgdG9vbCBuYW1lZDogJyArIHRoaXMudG9vbE5hbWUpO1xuICB9XG5cbiAgaWYgKHRoaXMudG9vbC5zdGFydCAhPSBudWxsKSB7XG4gICAgdGhpcy50b29sLnN0YXJ0KCk7XG4gIH1cbn07XG5cbkVkaXRvci5wcm90b3R5cGUuZHJhd1NlbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYmxvY2tzID0gdGhpcy5ibG9ja3M7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zZWxlY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGNvb3JkID0gdGhpcy5zZWxlY3Rpb25zW2ldO1xuICAgIGNvb3JkID0gY29vcmQuY2xvbmUoKS5hZGQobmV3IFRIUkVFLlZlY3RvcjMoMC41LCAwLjUsIDAuNSkpO1xuICAgIHZhciBsb2NhbFBvaW50ID0gYmxvY2tzLmNvb3JkVG9Qb2ludChjb29yZCk7XG4gICAgdmFyIHdvcmxkUG9pbnQgPSBibG9ja3Mub2JqLmxvY2FsVG9Xb3JsZChsb2NhbFBvaW50KTtcbiAgICB2YXIgdmVjdG9yID0gd29ybGRQb2ludC5wcm9qZWN0KHRoaXMuY2FtZXJhKTtcbiAgICB2ZWN0b3IueCA9IE1hdGgucm91bmQoKHZlY3Rvci54ICsgMSkgKiBjYW52YXMud2lkdGggLyAyKTtcbiAgICB2ZWN0b3IueSA9IE1hdGgucm91bmQoKC12ZWN0b3IueSArIDEpICogY2FudmFzLmhlaWdodCAvIDIpO1xuXG4gICAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9ICcjZmZmZmZmJztcbiAgICB0aGlzLmNvbnRleHQuZmlsbFJlY3QodmVjdG9yLngsIHZlY3Rvci55LCAxLCAxKTtcbiAgfVxufTtcblxuRWRpdG9yLnByb3RvdHlwZS5jcmVhdGVOZXcgPSBmdW5jdGlvbihpbmRleCkge1xuICBpbmRleCA9IGluZGV4IHx8IHRoaXMucHJlZmFicy5sZW5ndGg7XG5cbiAgdGhpcy5ibG9ja3MuY2xlYXIoKTtcbiAgdmFyIHByZWZhYiA9IHRoaXMuYmxvY2tzLnNlcmlhbGl6ZSgpO1xuICB0aGlzLnByZWZhYnMuc3BsaWNlKGluZGV4LCAwLCBwcmVmYWIpO1xuICB0aGlzLnVwZGF0ZVNjcmVlbnNob3RBdEluZGV4KGluZGV4KTtcbiAgdGhpcy5wcmVmYWJJbmRleCA9IGluZGV4O1xuICB0aGlzLnByZWZhYnNCYXIuaGlnaGxpZ2h0KGluZGV4KTtcbiAgdGhpcy51cGRhdGVQcm9wZXJ0eVBhbmVsKCk7XG4gIHRoaXMudXBkYXRlTGFzdEJsb2NrcygpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5yZW1vdmVTZWxlY3RlZCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnByZWZhYnMuc3BsaWNlKHRoaXMucHJlZmFiSW5kZXgsIDEpO1xuXG4gIGlmICh0aGlzLnByZWZhYnMubGVuZ3RoID09PSAwKSB7XG4gICAgdGhpcy5ibG9ja3MuY2xlYXIoKTtcbiAgICB0aGlzLnByZWZhYnMucHVzaCh0aGlzLmJsb2Nrcy5zZXJpYWxpemUoKSk7XG4gICAgdGhpcy51cGRhdGVQcm9wZXJ0eVBhbmVsKCk7XG4gIH1cblxuICBpZiAodGhpcy5wcmVmYWJJbmRleCA+IHRoaXMucHJlZmFicy5sZW5ndGggLSAxKSB7XG4gICAgdGhpcy5wcmVmYWJJbmRleCA9IHRoaXMucHJlZmFicy5sZW5ndGggLSAxO1xuICAgIHRoaXMucHJlZmFic0Jhci5oaWdobGlnaHQodGhpcy5wcmVmYWJJbmRleCk7XG4gICAgdGhpcy5ibG9ja3MuZGVzZXJpYWxpemUodGhpcy5wcmVmYWJzW3RoaXMucHJlZmFiSW5kZXhdKTtcbiAgICB0aGlzLnVwZGF0ZVByb3BlcnR5UGFuZWwoKTtcbiAgfVxuXG4gIHRoaXMudXBkYXRlU2NyZWVuc2hvdHMoKTtcbiAgdGhpcy51cGRhdGVMYXN0QmxvY2tzKCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLmNyZWF0ZUNsb25lID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwcmVmYWIgPSB0aGlzLmJsb2Nrcy5zZXJpYWxpemUoKTtcbiAgdGhpcy5jcmVhdGVOZXcodGhpcy5wcmVmYWJJbmRleCArIDEpO1xuICB0aGlzLmJsb2Nrcy5kZXNlcmlhbGl6ZShwcmVmYWIpO1xuICB0aGlzLnVwZGF0ZUN1cnJlbnRQcmVmYWIoKTtcblxuICB0aGlzLnVwZGF0ZVNjcmVlbnNob3RzKCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnNjcmVlbnNob3QgPSBmdW5jdGlvbihkYXRhKSB7XG4gIGlmICh0aGlzLnNjcmVlbnNob3RSZW5kZXJlciA9PSBudWxsKSB7XG4gICAgdGhpcy5zY3JlZW5zaG90UmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlcih7XG4gICAgICBhbHBoYTogdHJ1ZVxuICAgIH0pO1xuICAgIHRoaXMuc2NyZWVuc2hvdFJlbmRlcmVyLnNldENsZWFyQ29sb3IoMHhmZmZmZmYsIDAuMCk7XG4gIH1cblxuICB2YXIgcmVuZGVyZXIgPSB0aGlzLnNjcmVlbnNob3RSZW5kZXJlcjtcblxuICB2YXIgd2lkdGggPSAxMDA7XG4gIHZhciBoZWlnaHQgPSAxMDA7XG4gIHJlbmRlcmVyLnNldFNpemUod2lkdGgsIGhlaWdodCk7XG5cbiAgdmFyIG9iamVjdCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICB2YXIgYmxvY2tzID0gbmV3IEJsb2NrcyhvYmplY3QpO1xuICBibG9ja3MuZGVzZXJpYWxpemUoZGF0YSk7XG4gIGJsb2Nrcy50aWNrKCk7XG5cbiAgdmFyIGRpbSA9IGJsb2Nrcy5kaW07XG5cbiAgYmxvY2tzLm9iai5wb3NpdGlvbi5zZXQoLWRpbVswXSAvIDIsIC1kaW1bMV0gLyAyLCAtZGltWzJdIC8gMik7XG5cbiAgdmFyIG9iamVjdENsb25lID0gb2JqZWN0LmNsb25lKCk7XG4gIHZhciBzY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xuICBzY2VuZS5hZGQob2JqZWN0Q2xvbmUpO1xuXG4gIHZhciBhbWJpZW50ID0gbmV3IFRIUkVFLkFtYmllbnRMaWdodChuZXcgVEhSRUUuQ29sb3IoXCJyZ2IoNjAlLCA2MCUsIDYwJSlcIikpO1xuICB2YXIgbGlnaHQgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCgweGZmZmZmZiwgMC42KTtcbiAgbGlnaHQucG9zaXRpb24uc2V0KDAuOCwgMSwgMC41KTtcbiAgc2NlbmUuYWRkKGxpZ2h0KTtcbiAgc2NlbmUuYWRkKGFtYmllbnQpO1xuXG4gIHZhciBtYXhTaXplID0gTWF0aC5tYXgoZGltWzBdLCBkaW1bMV0sIGRpbVsyXSkgKiAyO1xuXG4gIHZhciBjYW1lcmEgPSBuZXcgVEhSRUUuT3J0aG9ncmFwaGljQ2FtZXJhKG1heFNpemUgLyAtMiwgbWF4U2l6ZSAvIDIsIG1heFNpemUgLyAyLCBtYXhTaXplIC8gLTIsIDAuMSwgMTAwMCk7XG4gIGNhbWVyYS5wb3NpdGlvbi5zZXQoMCwgMCwgMTApO1xuXG4gIHZhciBjYW1lcmFQb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIG1heFNpemUpXG4gICAgLmFwcGx5RXVsZXIobmV3IFRIUkVFLkV1bGVyKC1NYXRoLlBJIC8gNCwgMCwgMCwgJ1lYWicpKVxuICBjYW1lcmEucG9zaXRpb24uY29weShjYW1lcmFQb3NpdGlvbik7XG4gIGNhbWVyYS5sb29rQXQobmV3IFRIUkVFLlZlY3RvcjMoKSk7XG5cbiAgcmVuZGVyZXIucmVuZGVyKHNjZW5lLCBjYW1lcmEpO1xuICBpbWdEYXRhID0gcmVuZGVyZXIuZG9tRWxlbWVudC50b0RhdGFVUkwoKTtcblxuICByZW5kZXJlci5kaXNwb3NlKCk7XG5cbiAgcmV0dXJuIGltZ0RhdGE7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbihkYXRhKSB7XG4gIHRoaXMuYmxvY2tzLmRlc2VyaWFsaXplKGRhdGEpO1xuXG4gIHRoaXMudXBkYXRlU2l6ZSh0aGlzLmJsb2Nrcy5kaW0pO1xuXG4gIHRoaXMudXBkYXRlTGFzdEJsb2NrcygpO1xuXG4gIHRoaXMudXBkYXRlUHJvcGVydHlQYW5lbCgpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS51cGRhdGVQcm9wZXJ0eVBhbmVsID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwcmVmYWIgPSB0aGlzLmdldFNlbGVjdGVkUHJlZmFiKCk7XG5cbiAgdGhpcy5wcm9wZXJ0eVBhbmVsLmNvbnRyb2xsZXJzWyduYW1lJ10uc2V0VmFsdWUocHJlZmFiLnVzZXJEYXRhLm5hbWUgfHwgJ3VubmFtZWQnKTtcblxuICB2YXIgZGltID0gcHJlZmFiLmRpbTtcbiAgdmFyIGZvcm1hdHRlZFNpemUgPSBkaW0uam9pbignICcpO1xuICB0aGlzLnByb3BlcnR5UGFuZWwuY29udHJvbGxlcnNbJ3NpemUnXS5zZXRWYWx1ZShmb3JtYXR0ZWRTaXplKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wcmVmYWJTZXJ2aWNlLnJlc2V0KCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnNhdmUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wcmVmYWJTZXJ2aWNlLnNhdmUodGhpcy5wcmVmYWJzKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUudXBkYXRlTGFzdEJsb2NrcyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmJsb2Nrcy51cGRhdGVNZXNoKCk7XG4gIHRoaXMubGFzdEJsb2NrcyA9IHRoaXMuYmxvY2tzLm9iai5jbG9uZSgpO1xuICB0aGlzLmxhc3RCbG9ja3MudXBkYXRlTWF0cml4V29ybGQoKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUuZ2V0Q29vcmRBYm92ZSA9IGZ1bmN0aW9uKHBvaW50KSB7XG4gIHBvaW50ID0gcG9pbnQgfHwgdGhpcy5pbnB1dC5tb3VzZTtcbiAgdmFyIG9iamVjdHMgPSBbXTtcbiAgaWYgKHRoaXMubGFzdEJsb2NrcyAhPSBudWxsKSBvYmplY3RzLnB1c2godGhpcy5sYXN0QmxvY2tzKTtcbiAgaWYgKHRoaXMub2JqR3JvdW5kICE9IG51bGwpIG9iamVjdHMucHVzaCh0aGlzLm9iakdyb3VuZCk7XG4gIHJldHVybiB0aGlzLmdldENvb3JkKG9iamVjdHMsIHBvaW50LCAtdGhpcy5zbik7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLmdldENvb3JkQmVsb3cgPSBmdW5jdGlvbihwb2ludCkge1xuICBwb2ludCA9IHBvaW50IHx8IHRoaXMuaW5wdXQubW91c2U7XG4gIHZhciBvYmplY3RzID0gW107XG4gIGlmICh0aGlzLmxhc3RCbG9ja3MgIT0gbnVsbCkgb2JqZWN0cy5wdXNoKHRoaXMubGFzdEJsb2Nrcyk7XG4gIHZhciBjb29yZCA9IHRoaXMuZ2V0Q29vcmQob2JqZWN0cywgcG9pbnQsIHRoaXMuc24pO1xuXG4gIGlmIChjb29yZCA9PSBudWxsICYmIHRoaXMub2JqR3JvdW5kICE9IG51bGwpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRDb29yZChbdGhpcy5vYmpHcm91bmRdLCBwb2ludCwgLXRoaXMuc24pO1xuICB9XG5cbiAgcmV0dXJuIGNvb3JkO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5nZXRDb29yZCA9IGZ1bmN0aW9uKG9iamVjdHMsIGF0UG9pbnQsIGRlbHRhKSB7XG4gIHZhciB2aWV3cG9ydCA9IHRoaXMuaW5wdXQuc2NyZWVuVG9WaWV3cG9ydChhdFBvaW50KTtcbiAgdmFyIHJheWNhc3RlciA9IG5ldyBUSFJFRS5SYXljYXN0ZXIoKTtcbiAgcmF5Y2FzdGVyLnNldEZyb21DYW1lcmEodmlld3BvcnQsIHRoaXMuY2FtZXJhKTtcbiAgdmFyIGludGVyc2VjdHMgPSByYXljYXN0ZXIuaW50ZXJzZWN0T2JqZWN0cyhvYmplY3RzLCB0cnVlKTtcblxuICBpZiAoaW50ZXJzZWN0cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgdmFyIGludGVyc2VjdCA9IGludGVyc2VjdHNbMF07XG5cbiAgdmFyIHBvaW50ID0gaW50ZXJzZWN0LnBvaW50O1xuICB2YXIgZGlmZiA9IHBvaW50LmNsb25lKCkuc3ViKHRoaXMuY2FtZXJhLnBvc2l0aW9uKTtcbiAgZGlmZiA9IGRpZmYuc2V0TGVuZ3RoKGRpZmYubGVuZ3RoKCkgKyAoZGVsdGEgfHwgMCkpO1xuICBwb2ludCA9IHRoaXMuY2FtZXJhLnBvc2l0aW9uLmNsb25lKCkuYWRkKGRpZmYpO1xuXG4gIHZhciBsb2NhbFBvaW50ID0gdGhpcy5ibG9ja3Mub2JqLndvcmxkVG9Mb2NhbChwb2ludCk7XG4gIHZhciBjb29yZCA9IHRoaXMuYmxvY2tzLnBvaW50VG9Db29yZChsb2NhbFBvaW50KTtcbiAgY29vcmQgPSBuZXcgVEhSRUUuVmVjdG9yMyhcbiAgICBNYXRoLnJvdW5kKGNvb3JkLngpLFxuICAgIE1hdGgucm91bmQoY29vcmQueSksXG4gICAgTWF0aC5yb3VuZChjb29yZC56KVxuICApO1xuXG4gIHJldHVybiBjb29yZDtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUudXBkYXRlSGlnaGxpZ2h0ID0gZnVuY3Rpb24oY29vcmQpIHtcbiAgaWYgKHRoaXMub2JqSGlnaGxpZ2h0ID09IG51bGwpIHtcbiAgICB2YXIgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuQm94R2VvbWV0cnkoMSwgMSwgMSk7XG4gICAgdmFyIG1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKCk7XG4gICAgdmFyIG1lc2ggPSBuZXcgVEhSRUUuTWVzaChnZW9tZXRyeSwgbWF0ZXJpYWwpO1xuICAgIHZhciB3aXJlZnJhbWUgPSBuZXcgVEhSRUUuRWRnZXNIZWxwZXIobWVzaCwgMHhmZmZmZmYpO1xuICAgIHRoaXMub2JqSGlnaGxpZ2h0ID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gICAgdGhpcy5vYmpIaWdobGlnaHQuYWRkKHdpcmVmcmFtZSk7XG4gICAgdGhpcy5vYmplY3QuYWRkKHRoaXMub2JqSGlnaGxpZ2h0KTtcbiAgfVxuXG4gIGlmIChjb29yZCA9PSBudWxsKSB7XG4gICAgdGhpcy5vYmpIaWdobGlnaHQudmlzaWJsZSA9IGZhbHNlO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvb3JkID0gY29vcmQuY2xvbmUoKS5hZGQobmV3IFRIUkVFLlZlY3RvcjMoMC41LCAwLjUsIDAuNSkpO1xuICB0aGlzLm9iakhpZ2hsaWdodC52aXNpYmxlID0gdHJ1ZTtcbiAgdmFyIGxvY2FsUG9pbnQgPSB0aGlzLmJsb2Nrcy5jb29yZFRvUG9pbnQoY29vcmQpO1xuICB2YXIgd29ybGRQb2ludCA9IHRoaXMuYmxvY2tzLm9iai5sb2NhbFRvV29ybGQobG9jYWxQb2ludCk7XG4gIHRoaXMub2JqSGlnaGxpZ2h0LnBvc2l0aW9uLmNvcHkod29ybGRQb2ludCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnNldFNlbGVjdGVkQ29sb3IgPSBmdW5jdGlvbihjb2xvcikge1xuICB2YXIgaW5kZXggPSBhcnJheVV0aWxzLmluZGV4T2YodGhpcy5wYWxldHRlLCBmdW5jdGlvbihjKSB7XG4gICAgcmV0dXJuIGNvbG9yID09PSBjIHx8IChjb2xvciA9PSBudWxsICYmIGMuaXNDbGVhckNvbG9yKTtcbiAgfSk7XG5cbiAgaWYgKGluZGV4ID09IC0xKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhpcy5zZWxlY3RlZENvbG9yID0gY29sb3I7XG4gIHRoaXMuY29sb3JCYXIuaGlnaGxpZ2h0KGluZGV4KTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUuYXBwbHlPZmZzZXQgPSBmdW5jdGlvbihvZmZzZXQpIHtcbiAgdmFyIHNlbGVjdGVkQ29vcmRzO1xuICBpZiAodGhpcy5zZWxlY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICBzZWxlY3RlZENvb3JkcyA9IHRoaXMuc2VsZWN0aW9ucztcbiAgfSBlbHNlIHtcbiAgICBzZWxlY3RlZENvb3JkcyA9IHRoaXMuYmxvY2tzLmdldEFsbENvb3JkcygpO1xuICB9XG5cbiAgdGhpcy5ydW5Db21tYW5kKG5ldyBPZmZzZXRDb21tYW5kKHRoaXMsIHRoaXMuYmxvY2tzLCBzZWxlY3RlZENvb3Jkcywgb2Zmc2V0KSk7XG4gIHRoaXMudXBkYXRlTGFzdEJsb2NrcygpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5kb3dubG9hZEpTT04gPSBmdW5jdGlvbihqc29uLCBuYW1lKSB7XG4gIG5hbWUgPSBuYW1lIHx8ICdibG9ja3MnO1xuICB2YXIgZGF0YVN0ciA9IFwiZGF0YTp0ZXh0L2pzb247Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShqc29uKSk7XG4gIGlmICh0aGlzLmRvd25sb2FkRWxlbWVudCA9PSBudWxsKSB7XG4gICAgdGhpcy5kb3dubG9hZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgdGhpcy5kb3dubG9hZEVsZW1lbnQuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5kb3dubG9hZEVsZW1lbnQpO1xuICB9XG4gIHRoaXMuZG93bmxvYWRFbGVtZW50LnNldEF0dHJpYnV0ZShcImhyZWZcIiwgZGF0YVN0cik7XG4gIHRoaXMuZG93bmxvYWRFbGVtZW50LnNldEF0dHJpYnV0ZShcImRvd25sb2FkXCIsIG5hbWUgKyAnLmpzb24nKTtcbiAgdGhpcy5kb3dubG9hZEVsZW1lbnQuY2xpY2soKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUuc2VyaWFsaXplID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmJsb2Nrcy5zZXJpYWxpemUoKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUuZ2V0U2VsZWN0ZWRQcmVmYWIgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMucHJlZmFic1t0aGlzLnByZWZhYkluZGV4XTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUudXBkYXRlQ3VycmVudFByZWZhYiA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnByZWZhYnNbdGhpcy5wcmVmYWJJbmRleF0gPSB0aGlzLmJsb2Nrcy5zZXJpYWxpemUoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yOyIsInZhciBFZGl0b3IgPSByZXF1aXJlKCcuL2VkaXRvcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVkaXRvciwgZGV2Q29uc29sZSkge1xuXG4gIGRldkNvbnNvbGUuY29tbWFuZHNbJ3NpemUnXSA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICB2YXIgZGVmYXVsdFNpemUgPSBlZGl0b3IuY29uZmlnWydlZGl0b3JfZGVmYXVsdF9zaXplJ107XG4gICAgdmFyIHggPSBhcmdzLl9bMF0gfHwgZGVmYXVsdFNpemVbMF07XG4gICAgdmFyIHkgPSBhcmdzLl9bMV0gfHwgYXJncy5fWzBdIHx8IGRlZmF1bHRTaXplWzFdO1xuICAgIHZhciB6ID0gYXJncy5fWzJdIHx8IGFyZ3MuX1swXSB8fCBkZWZhdWx0U2l6ZVsyXTtcblxuICAgIGVkaXRvci51cGRhdGVTaXplKFt4LCB5LCB6XSk7XG4gIH07XG5cbiAgZGV2Q29uc29sZS5jb21tYW5kc1snb2Zmc2V0J10gPSBmdW5jdGlvbihhcmdzKSB7XG4gICAgdmFyIHggPSBhcmdzLl9bMF0gfHwgMDtcbiAgICB2YXIgeSA9IGFyZ3MuX1sxXSB8fCAwO1xuICAgIHZhciB6ID0gYXJncy5fWzJdIHx8IDA7XG5cbiAgICBlZGl0b3IuYmxvY2tzLnNldE9mZnNldChuZXcgVEhSRUUuVmVjdG9yMyh4LCB5LCB6KSk7XG4gIH07XG5cbiAgZGV2Q29uc29sZS5jb21tYW5kc1snbmV3J10gPSBmdW5jdGlvbihhcmdzKSB7XG4gICAgZWRpdG9yLmNyZWF0ZU5ldygpO1xuICB9O1xuXG4gIGRldkNvbnNvbGUuY29tbWFuZHNbJ21pcnJvciddID0gZnVuY3Rpb24oYXJncykge1xuICAgIGlmIChhcmdzLl8ubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3BsZWFzZSBzcGVjaWZ5IHggeSB6IG9yIG5vbmUnKTtcbiAgICB9XG5cbiAgICBpZiAoYXJncy5fLmxlbmd0aCA9PT0gMSkge1xuICAgICAgaWYgKGFyZ3MuX1swXSA9PT0gJ25vbmUnKSB7XG4gICAgICAgIGVkaXRvci5yZWZsZWN0WCA9IGVkaXRvci5yZWZsZWN0WSA9IGVkaXRvci5yZWZsZWN0WiA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGVkaXRvci5yZWZsZWN0WCA9IGVkaXRvci5yZWZsZWN0WSA9IGVkaXRvci5yZWZsZWN0WiA9IGZhbHNlO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5fLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgYXJnID0gYXJncy5fW2ldO1xuICAgICAgaWYgKGFyZyA9PT0gJ3gnKSB7XG4gICAgICAgIGVkaXRvci5yZWZsZWN0WCA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGFyZyA9PT0gJ3knKSB7XG4gICAgICAgIGVkaXRvci5yZWZsZWN0WSA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGFyZyA9PT0gJ3onKSB7XG4gICAgICAgIGVkaXRvci5yZWZsZWN0WiA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Vua25vd24gb3B0aW9uOiAnICsgYXJnKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgZGV2Q29uc29sZS5jb21tYW5kc1sncmVzZXQnXSA9IGZ1bmN0aW9uKCkge1xuICAgIGVkaXRvci5yZXNldCgpO1xuICB9O1xuXG4gIGRldkNvbnNvbGUuY29tbWFuZHNbJ3NhdmUnXSA9IGZ1bmN0aW9uKCkge1xuICAgIGVkaXRvci5zYXZlKCk7XG4gIH07XG59IiwidmFyIEVkaXRvclRvb2xzID0ge1xuICBQZW46ICdQZW4nLFxuICBTZWxlY3Q6ICdTZWxlY3QnLFxuICBTYW1wbGU6ICdTYW1wbGUnLFxuICBDYW1lcmE6ICdDYW1lcmEnLFxuICBGaWxsOiAnRmlsbCdcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yVG9vbHM7IiwidmFyIGNwciA9IHJlcXVpcmUoJy4vY3ByJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWRpdG9yKSB7XG4gIHZhciBkYXRhID0gW3tcbiAgICBzcmM6ICcvaW1hZ2VzL2ljb25zL2Fycm93MV9saWdodC5wbmcnLFxuICAgIHNyY0FjdGl2ZTogJy9pbWFnZXMvaWNvbnMvYXJyb3cxX2RhcmsucG5nJyxcbiAgICBpbmRleDogMCxcbiAgICB0b29sdGlwOiAnbW92ZSByaWdodCAoRCknXG4gIH0sIHtcbiAgICBzcmM6ICcvaW1hZ2VzL2ljb25zL2Fycm93Ml9saWdodC5wbmcnLFxuICAgIHNyY0FjdGl2ZTogJy9pbWFnZXMvaWNvbnMvYXJyb3cyX2RhcmsucG5nJyxcbiAgICBpbmRleDogMSxcbiAgICB0b29sdGlwOiAnbW92ZSBsZWZ0IChBKSdcbiAgfSwge1xuICAgIHNyYzogJy9pbWFnZXMvaWNvbnMvYXJyb3czX2xpZ2h0LnBuZycsXG4gICAgc3JjQWN0aXZlOiAnL2ltYWdlcy9pY29ucy9hcnJvdzNfZGFyay5wbmcnLFxuICAgIGluZGV4OiAyLFxuICAgIHRvb2x0aXA6ICdtb3ZlIGZyb250IChXKSdcbiAgfSwge1xuICAgIHNyYzogJy9pbWFnZXMvaWNvbnMvYXJyb3c0X2xpZ2h0LnBuZycsXG4gICAgc3JjQWN0aXZlOiAnL2ltYWdlcy9pY29ucy9hcnJvdzRfZGFyay5wbmcnLFxuICAgIGluZGV4OiAzLFxuICAgIHRvb2x0aXA6ICdtb3ZlIGJhY2sgKFMpJ1xuICB9LCB7XG4gICAgc3JjOiAnL2ltYWdlcy9pY29ucy9hcnJvdzVfbGlnaHQucG5nJyxcbiAgICBzcmNBY3RpdmU6ICcvaW1hZ2VzL2ljb25zL2Fycm93NV9kYXJrLnBuZycsXG4gICAgaW5kZXg6IDQsXG4gICAgdG9vbHRpcDogJ21vdmUgdXAgKFIpJ1xuICB9LCB7XG4gICAgc3JjOiAnL2ltYWdlcy9pY29ucy9hcnJvdzZfbGlnaHQucG5nJyxcbiAgICBzcmNBY3RpdmU6ICcvaW1hZ2VzL2ljb25zL2Fycm93Nl9kYXJrLnBuZycsXG4gICAgaW5kZXg6IDUsXG4gICAgdG9vbHRpcDogJ21vdmUgZG93biAoRiknXG4gIH1dO1xuXG4gIHZhciBiYXIgPSBjcHIoe1xuICAgIGRhdGE6IGRhdGEsXG4gICAgYmxvY2tXaWR0aDogMzIsXG4gICAgYmxvY2tIZWlnaHQ6IDMyLFxuICAgIGhpZGVIaWdobGlnaHQ6IHRydWUsXG4gICAgY3VzdG9tUGxhY2VtZW50OiB0cnVlLFxuICAgIHNob3dUb29sdGlwOiB0cnVlLFxuICAgIG9uUGljazogZnVuY3Rpb24ob2JqKSB7XG4gICAgICB2YXIgaW5kZXggPSBvYmouaW5kZXg7XG5cbiAgICAgIHZhciBvZmZzZXQgPSBudWxsO1xuICAgICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICAgIG9mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKDEsIDAsIDApO1xuICAgICAgfSBlbHNlIGlmIChpbmRleCA9PT0gMSkge1xuICAgICAgICBvZmZzZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygtMSwgMCwgMCk7XG4gICAgICB9IGVsc2UgaWYgKGluZGV4ID09PSAyKSB7XG4gICAgICAgIG9mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKTtcbiAgICAgIH0gZWxzZSBpZiAoaW5kZXggPT09IDMpIHtcbiAgICAgICAgb2Zmc2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMSk7XG4gICAgICB9IGVsc2UgaWYgKGluZGV4ID09PSA0KSB7XG4gICAgICAgIG9mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDEsIDApO1xuICAgICAgfSBlbHNlIGlmIChpbmRleCA9PT0gNSkge1xuICAgICAgICBvZmZzZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAtMSwgMCk7XG4gICAgICB9XG5cbiAgICAgIGVkaXRvci5hcHBseU9mZnNldChvZmZzZXQpO1xuICAgIH0sXG4gICAgaXNCdXR0b246IHRydWVcbiAgfSk7XG5cbiAgdmFyIGd1aSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdndWknKTtcbiAgZ3VpLmFwcGVuZENoaWxkKGJhci5kb21FbGVtZW50KTtcblxuICBiYXIuZG9tRWxlbWVudC5jbGFzc0xpc3QuYWRkKCd0b29sYmFyJyk7XG4gIGJhci5kb21FbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgYmFyLmRvbUVsZW1lbnQuc3R5bGUudG9wID0gJzcwcHgnO1xuICBiYXIuZG9tRWxlbWVudC5zdHlsZS5sZWZ0ID0gJzIwcHgnO1xufTsiLCJ2YXIgY3ByID0gcmVxdWlyZSgnLi9jcHInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlZGl0b3IpIHtcbiAgdmFyIGJhciA9IGNwcih7XG4gICAgZGF0YTogZWRpdG9yLnBhbGV0dGUsXG4gICAgb25QaWNrOiBmdW5jdGlvbihjb2xvcikge1xuICAgICAgZWRpdG9yLnNlbGVjdGVkQ29sb3IgPSBjb2xvci5pc0NsZWFyQ29sb3IgPyBudWxsIDogY29sb3I7XG4gICAgfSxcbiAgICBjdXN0b21QbGFjZW1lbnQ6IHRydWVcbiAgfSk7XG5cbiAgdmFyIGd1aSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdndWknKTtcbiAgZ3VpLmFwcGVuZENoaWxkKGJhci5kb21FbGVtZW50KTtcblxuICBiYXIuZG9tRWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIGJhci5kb21FbGVtZW50LnN0eWxlLmxlZnQgPSAnMjBweCc7XG4gIGJhci5kb21FbGVtZW50LnN0eWxlLmJvdHRvbSA9ICcyMHB4JztcblxuICByZXR1cm4gYmFyO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgb3B0cyA9IG9wdHMgfHwge307XG4gIHZhciBkYXRhVG9Mb2FkID0gb3B0cy5kYXRhIHx8IFtdO1xuICB2YXIgb25QaWNrID0gb3B0cy5vblBpY2sgfHwgZnVuY3Rpb24oKSB7fTtcbiAgdmFyIG9uSG92ZXIgPSBvcHRzLm9uSG92ZXIgfHwgZnVuY3Rpb24oKSB7fTtcbiAgdmFyIG9uTGVhdmUgPSBvcHRzLm9uTGVhdmUgfHwgZnVuY3Rpb24oKSB7fTtcbiAgdmFyIGN1c3RvbVBsYWNlbWVudCA9IG9wdHMuY3VzdG9tUGxhY2VtZW50IHx8IGZhbHNlO1xuICB2YXIgc2hvd1Rvb2x0aXAgPSBvcHRzLnNob3dUb29sdGlwIHx8IGZhbHNlO1xuICB2YXIgcGFkZGluZ1JpZ2h0ID0gb3B0cy5wYWRkaW5nUmlnaHQgfHwgMDtcbiAgdmFyIGJsb2NrV2lkdGggPSBvcHRzLmJsb2NrV2lkdGggfHwgMjA7XG4gIHZhciBibG9ja0hlaWdodCA9IG9wdHMuYmxvY2tIZWlnaHQgfHwgMjA7XG4gIHZhciBjb2x1bW5zID0gb3B0cy5jb2x1bW5zIHx8IDE0O1xuICB2YXIgaXNCdXR0b24gPSBvcHRzLmlzQnV0dG9uIHx8IGZhbHNlO1xuICB2YXIgc2tpbkJsb2NrID0gb3B0cy5za2luQmxvY2sgfHwgZnVuY3Rpb24oKSB7fTtcbiAgdmFyIHN0aWNreVNlbGVjdGlvbiA9IG9wdHMuc3RpY2t5U2VsZWN0aW9uIHx8IGZhbHNlO1xuXG4gIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgY29udGFpbmVyLmNsYXNzTmFtZSA9ICdjcHInO1xuXG4gIHZhciBtb3VzZWRvd25MaXN0ZW5lcnMgPSBbXTtcbiAgdmFyIG1vdXNldXBMaXN0ZW5lcnMgPSBbXTtcbiAgdmFyIGJsb2NrcyA9IFtdO1xuICB2YXIgZGF0YSA9IFtdO1xuICB2YXIgaGlnaGxpZ2h0RGl2ID0gbnVsbDtcbiAgdmFyIHNlbGVjdGVkSW5kZXggPSAtMTtcblxuICBpZiAoc2hvd1Rvb2x0aXApIHtcbiAgICB2YXIgdG9vbHRpcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRvb2x0aXAuY2xhc3NOYW1lID0gJ3Rvb2x0aXAnO1xuXG4gICAgdG9vbHRpcC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgdG9vbHRpcC5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRvb2x0aXApO1xuICB9XG5cbiAgaWYgKCFjdXN0b21QbGFjZW1lbnQpIHtcbiAgICBjb250YWluZXIuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIGNvbnRhaW5lci5zdHlsZS5sZWZ0ID0gJzIwcHgnO1xuICAgIGNvbnRhaW5lci5zdHlsZS5ib3R0b20gPSAnMjBweCc7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuICB9XG5cbiAgY29udGFpbmVyLm9uZm9jdXMgPSBmdW5jdGlvbigpIHtcbiAgICBjb250YWluZXIuc3R5bGVbJ291dGxpbmUnXSA9ICdub25lJztcbiAgfTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGFUb0xvYWQubGVuZ3RoOyBpKyspIHtcbiAgICBhZGQoZGF0YVRvTG9hZFtpXSk7XG4gIH1cblxuICB1cGRhdGVDb250YWluZXIoKTtcblxuICBmdW5jdGlvbiBnZXRSb3coaW5kZXgpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcihpbmRleCAvIGNvbHVtbnMpO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGdldENvbHVtbihpbmRleCkge1xuICAgIHJldHVybiBpbmRleCAlIGNvbHVtbnM7XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0Um93cygpIHtcbiAgICByZXR1cm4gTWF0aC5jZWlsKGRhdGEubGVuZ3RoIC8gY29sdW1ucyk7XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0SW5kZXgocm93LCBjb2x1bW4pIHtcbiAgICByZXR1cm4gcm93ICogY29sdW1ucyArIGNvbHVtbjtcbiAgfTtcblxuICBmdW5jdGlvbiByZW1vdmUoaW5kZXgpIHtcbiAgICBjb250YWluZXIucmVtb3ZlQ2hpbGQoYmxvY2tzW2luZGV4XSk7XG4gICAgYmxvY2tzW2luZGV4XS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBtb3VzZWRvd25MaXN0ZW5lcnNbaW5kZXhdKTtcbiAgICBibG9ja3NbaW5kZXhdLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBtb3VzZXVwTGlzdGVuZXJzW2luZGV4XSk7XG5cbiAgICBtb3VzZWRvd25MaXN0ZW5lcnNbaW5kZXhdID0gdW5kZWZpbmVkO1xuICAgIG1vdXNldXBMaXN0ZW5lcnNbaW5kZXhdID0gdW5kZWZpbmVkO1xuICAgIGJsb2Nrc1tpbmRleF0gPSB1bmRlZmluZWQ7XG4gICAgZGF0YVtpbmRleF0gPSB1bmRlZmluZWQ7XG4gIH07XG5cbiAgZnVuY3Rpb24gc2V0KGluZGV4LCBvYmopIHtcbiAgICBpZiAoZGF0YVtpbmRleF0gIT0gbnVsbCkge1xuICAgICAgcmVtb3ZlKGluZGV4KTtcbiAgICB9O1xuXG4gICAgdmFyIHJvdyA9IGdldFJvdyhpbmRleCk7XG4gICAgdmFyIGNvbHVtbiA9IGdldENvbHVtbihpbmRleCk7XG5cbiAgICB2YXIgZWxlbWVudDtcbiAgICBpZiAob2JqLmltZ0RhdGEgIT0gbnVsbCkge1xuICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICAgICAgZWxlbWVudC5zcmMgPSBvYmouaW1nRGF0YTtcbiAgICB9IGVsc2UgaWYgKG9iai5zcmMgIT0gbnVsbCkge1xuICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICAgICAgZWxlbWVudC5zcmMgPSBvYmouc3JjO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgY29sb3IgPSBvYmo7XG4gICAgICBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBlbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yO1xuICAgIH1cblxuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gJ2Jsb2NrIGJveC1zaXppbmcnO1xuICAgIGlmIChpc0J1dHRvbikge1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdidXR0b24nKTtcbiAgICB9XG5cbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgcG9zaXRpb24oZWxlbWVudCwgcm93LCBjb2x1bW4pO1xuXG4gICAgYmxvY2tzW2luZGV4XSA9IGVsZW1lbnQ7XG4gICAgZGF0YVtpbmRleF0gPSBvYmo7XG5cbiAgICB1cGRhdGVDb250YWluZXIoKTtcblxuICAgIHNraW5CbG9jayhlbGVtZW50KTtcblxuICAgIHZhciBvbk1vdXNlRG93biA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGhpZ2hsaWdodChpbmRleCwgdHJ1ZSk7XG4gICAgICBvblBpY2sob2JqLCBpbmRleCk7XG4gICAgfTtcblxuICAgIHZhciBvbk1vdXNlVXAgPSBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoaXNCdXR0b24gJiYgIXN0aWNreVNlbGVjdGlvbikge1xuICAgICAgICBoaWdobGlnaHQoaW5kZXgsIGZhbHNlKTtcbiAgICAgIH0gXG4gICAgfTtcblxuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgb25Nb3VzZURvd24pO1xuXG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgb25Nb3VzZVVwKTtcblxuICAgIG1vdXNlZG93bkxpc3RlbmVyc1tpbmRleF0gPSBvbk1vdXNlRG93bjtcbiAgICBtb3VzZXVwTGlzdGVuZXJzW2luZGV4XSA9IG9uTW91c2VVcDtcbiAgfTtcblxuICBmdW5jdGlvbiBhZGQob2JqKSB7XG4gICAgdmFyIGluZGV4ID0gYmxvY2tzLmxlbmd0aDtcbiAgICBzZXQoaW5kZXgsIG9iaik7XG4gIH07XG5cbiAgZnVuY3Rpb24gcG9zaXRpb24oZWxlbWVudCwgcm93LCBjb2x1bW4pIHtcbiAgICBlbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBlbGVtZW50LnN0eWxlLmxlZnQgPSBjb2x1bW4gKiAoYmxvY2tXaWR0aCArIHBhZGRpbmdSaWdodCkgKyAncHgnO1xuICAgIGVsZW1lbnQuc3R5bGUudG9wID0gcm93ICogYmxvY2tIZWlnaHQgKyAncHgnO1xuICAgIGVsZW1lbnQuc3R5bGUud2lkdGggPSBibG9ja1dpZHRoICsgJ3B4JztcbiAgICBlbGVtZW50LnN0eWxlLmhlaWdodCA9IGJsb2NrSGVpZ2h0ICsgJ3B4JztcbiAgfTtcblxuICBmdW5jdGlvbiB1cGRhdGVDb250YWluZXIoKSB7XG4gICAgdmFyIG51bWJlck9mQ29sdW1ucyA9IGRhdGEubGVuZ3RoID4gY29sdW1ucyA/IGNvbHVtbnMgOiBkYXRhLmxlbmd0aDtcbiAgICBjb250YWluZXIuc3R5bGUud2lkdGggPSBudW1iZXJPZkNvbHVtbnMgKiAoYmxvY2tXaWR0aCArIHBhZGRpbmdSaWdodCkgKyAncHgnO1xuICAgIGNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBnZXRSb3dzKCkgKiBibG9ja0hlaWdodCArICdweCc7XG4gIH07XG5cbiAgZnVuY3Rpb24gaGlnaGxpZ2h0KGluZGV4LCB2YWx1ZSkge1xuICAgIHZhbHVlID0gdmFsdWUgPT09IHVuZGVmaW5lZCA/IHRydWUgOiB2YWx1ZTtcblxuICAgIHZhciBlbGVtZW50ID0gYmxvY2tzW2luZGV4XTtcblxuICAgIGlmIChlbGVtZW50ID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgb2JqID0gZGF0YVtpbmRleF07XG5cbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIGlmIChpc0J1dHRvbikge1xuICAgICAgICAvLyB1biBoaWdobGlnaHQgbGFzdCBlbGVtZW50IGlmIHN0aWNreSBzZWxlY3Rpb25cbiAgICAgICAgaWYgKHN0aWNreVNlbGVjdGlvbiAmJiBzZWxlY3RlZEluZGV4ICE9IGluZGV4KSB7XG4gICAgICAgICAgaGlnaGxpZ2h0KHNlbGVjdGVkSW5kZXgsIGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnc2VsZWN0ZWQnKTtcbiAgICAgICAgaWYgKG9iai5zcmNBY3RpdmUgIT0gbnVsbCkgZWxlbWVudC5zcmMgPSBvYmouc3JjQWN0aXZlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHJvdyA9IGdldFJvdyhpbmRleCk7XG4gICAgICAgIHZhciBjb2x1bW4gPSBnZXRDb2x1bW4oaW5kZXgpO1xuICAgICAgICBpZiAoaGlnaGxpZ2h0RGl2ID09IG51bGwpIHtcbiAgICAgICAgICBoaWdobGlnaHREaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICBoaWdobGlnaHREaXYuY2xhc3NOYW1lID0gJ2hpZ2hsaWdodCc7XG4gICAgICAgICAgaGlnaGxpZ2h0RGl2LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgICBoaWdobGlnaHREaXYuc3R5bGUud2lkdGggPSBibG9ja1dpZHRoICsgJ3B4JztcbiAgICAgICAgICBoaWdobGlnaHREaXYuc3R5bGUuaGVpZ2h0ID0gYmxvY2tIZWlnaHQgKyAncHgnO1xuICAgICAgICAgIGhpZ2hsaWdodERpdi5zdHlsZS56SW5kZXggPSAxO1xuICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChoaWdobGlnaHREaXYpO1xuICAgICAgICB9XG5cbiAgICAgICAgaGlnaGxpZ2h0RGl2LnN0eWxlLmxlZnQgPSBjb2x1bW4gKiAoYmxvY2tXaWR0aCArIHBhZGRpbmdSaWdodCkgLSAxICsgJ3B4JztcbiAgICAgICAgaGlnaGxpZ2h0RGl2LnN0eWxlLnRvcCA9IHJvdyAqIGJsb2NrSGVpZ2h0IC0gMSArICdweCc7XG4gICAgICB9XG5cbiAgICAgIHNlbGVjdGVkSW5kZXggPSBpbmRleDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGlzQnV0dG9uKSB7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWN0ZWQnKTtcbiAgICAgICAgZWxlbWVudC5zcmMgPSBvYmouc3JjO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlbW92ZShpKTtcbiAgICB9XG5cbiAgICBkYXRhID0gW107XG4gIH07XG5cbiAgZnVuY3Rpb24gaXNEZXNjZW5kYW50KHBhcmVudCwgY2hpbGQpIHtcbiAgICBpZiAoY2hpbGQgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBub2RlID0gY2hpbGQucGFyZW50Tm9kZTtcbiAgICB3aGlsZSAobm9kZSAhPSBudWxsKSB7XG4gICAgICBpZiAobm9kZSA9PSBwYXJlbnQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICB2YXIgbW91c2UgPSBudWxsO1xuICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZnVuY3Rpb24oZSkge1xuICAgIG1vdXNlID0gZTtcbiAgICB2YXIgbW91c2VYID0gZS5wYWdlWCAtIGNvbnRhaW5lci5vZmZzZXRMZWZ0O1xuICAgIHZhciBtb3VzZVkgPSBlLnBhZ2VZIC0gY29udGFpbmVyLm9mZnNldFRvcDtcbiAgICB2YXIgcm93ID0gTWF0aC5mbG9vcihtb3VzZVkgLyBibG9ja0hlaWdodCk7XG4gICAgdmFyIGNvbHVtbiA9IE1hdGguZmxvb3IobW91c2VYIC8gYmxvY2tXaWR0aCk7XG4gICAgdmFyIGluZGV4ID0gZ2V0SW5kZXgocm93LCBjb2x1bW4pO1xuXG4gICAgaWYgKGRhdGFbaW5kZXhdID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgb2JqID0gZGF0YVtpbmRleF07XG4gICAgb25Ib3ZlcihvYmosIGluZGV4KTtcblxuICAgIGlmIChzaG93VG9vbHRpcCAmJiBvYmoudG9vbHRpcCAhPSBudWxsKSB7XG4gICAgICB0b29sdGlwLnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG4gICAgICB0b29sdGlwLnN0eWxlLmxlZnQgPSBtb3VzZVggKyAyICsgJ3B4JztcbiAgICAgIHRvb2x0aXAuc3R5bGUudG9wID0gbW91c2VZICsgMiArICdweCc7XG4gICAgICBpZiAodG9vbHRpcC5pbm5lckhUTUwgIT09IG9iai50b29sdGlwKSB7XG4gICAgICAgIHRvb2x0aXAuaW5uZXJIVE1MID0gb2JqLnRvb2x0aXA7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoIWlzRGVzY2VuZGFudChjb250YWluZXIsIGUudG9FbGVtZW50KSkge1xuICAgICAgb25MZWF2ZShlKTtcblxuICAgICAgaWYgKHNob3dUb29sdGlwKSB7XG4gICAgICAgIHRvb2x0aXAuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICBoaWdobGlnaHQ6IGhpZ2hsaWdodCxcbiAgICBhZGQ6IGFkZCxcbiAgICBzZXQ6IHNldCxcbiAgICBjbGVhcjogY2xlYXIsXG4gICAgZGF0YTogZGF0YSxcbiAgICBkb21FbGVtZW50OiBjb250YWluZXIsXG4gICAgZ2V0IHNlbGVjdGVkSW5kZXgoKSB7XG4gICAgICByZXR1cm4gc2VsZWN0ZWRJbmRleDtcbiAgICB9LFxuICAgIGdldCBtb3VzZSgpIHtcbiAgICAgIHJldHVybiBtb3VzZTtcbiAgICB9LFxuICAgIGdldCB0b29sdGlwKCkge1xuICAgICAgcmV0dXJuIHRvb2x0aXA7XG4gICAgfVxuICB9XG59OyIsInZhciBjcHIgPSByZXF1aXJlKCcuL2NwcicpO1xudmFyIHBvcHVwID0gcmVxdWlyZSgnLi9wb3B1cCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVkaXRvcikge1xuICAvLyBkb3dubG9hZC5wbmdcbiAgdmFyIGRhdGEgPSBbe1xuICAgIHNyYzogJy9pbWFnZXMvaWNvbnMvdW5kb19saWdodC5wbmcnLFxuICAgIHNyY0FjdGl2ZTogJy9pbWFnZXMvaWNvbnMvdW5kb19kYXJrLnBuZycsXG4gICAgYnV0dG9uOiAndW5kbycsXG4gICAgdG9vbHRpcDogJ1VuZG8gKGN0cmwgKyB6KSdcbiAgfSwge1xuICAgIHNyYzogJy9pbWFnZXMvaWNvbnMvcmVkb19saWdodC5wbmcnLFxuICAgIHNyY0FjdGl2ZTogJy9pbWFnZXMvaWNvbnMvcmVkb19kYXJrLnBuZycsXG4gICAgYnV0dG9uOiAncmVkbycsXG4gICAgdG9vbHRpcDogJ1JlZG8gKHNoaWZ0ICsgY3RybCArIHopJ1xuICB9LCB7XG4gICAgc3JjOiAnL2ltYWdlcy9pY29ucy9kb3dubG9hZF9saWdodC5wbmcnLFxuICAgIHNyY0FjdGl2ZTogJy9pbWFnZXMvaWNvbnMvZG93bmxvYWRfZGFyay5wbmcnLFxuICAgIGJ1dHRvbjogJ3NhdmUnLFxuICAgIHRvb2x0aXA6ICdTYXZlIGluIGJyb3dzZXInXG4gIH1dO1xuXG4gIHZhciBiYXIgPSBjcHIoe1xuICAgIGRhdGE6IGRhdGEsXG4gICAgY3VzdG9tUGxhY2VtZW50OiB0cnVlLFxuICAgIGJsb2NrV2lkdGg6IDMyLFxuICAgIGJsb2NrSGVpZ2h0OiAzMixcbiAgICBoaWRlSGlnaGxpZ2h0OiB0cnVlLFxuICAgIHNob3dUb29sdGlwOiB0cnVlLFxuICAgIG9uUGljazogZnVuY3Rpb24ob2JqKSB7XG4gICAgICB2YXIgYnV0dG9uID0gb2JqLmJ1dHRvbjtcblxuICAgICAgaWYgKGJ1dHRvbiA9PT0gJ3NhdmUnKSB7XG4gICAgICAgIGVkaXRvci5zYXZlKCk7XG4gICAgICB9IGVsc2UgaWYgKGJ1dHRvbiA9PT0gJ3VuZG8nKSB7XG4gICAgICAgIGVkaXRvci51bmRvKCk7XG4gICAgICB9IGVsc2UgaWYgKGJ1dHRvbiA9PT0gJ3JlZG8nKSB7XG4gICAgICAgIGVkaXRvci5yZWRvKCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBpc0J1dHRvbjogdHJ1ZVxuICB9KTtcblxuICB2YXIgZ3VpID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2d1aScpO1xuICBndWkuYXBwZW5kQ2hpbGQoYmFyLmRvbUVsZW1lbnQpO1xuXG4gIGJhci5kb21FbGVtZW50LmNsYXNzTGlzdC5hZGQoJ3Rvb2xiYXInKTtcblxuICBiYXIuZG9tRWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIGJhci5kb21FbGVtZW50LnN0eWxlLmxlZnQgPSAyMCArICdweCc7XG4gIGJhci5kb21FbGVtZW50LnN0eWxlLnRvcCA9IDEyMCArICdweCc7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGF0YSwgb3B0cykge1xuICB2YXIgY3VzdG9tUGxhY2VtZW50ID0gb3B0cy5jdXN0b21QbGFjZW1lbnQgfHwgZmFsc2U7XG5cbiAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gIGNvbnRhaW5lci5jbGFzc05hbWUgPSAncGFuZWwnO1xuXG4gIGlmICghY3VzdG9tUGxhY2VtZW50KSB7XG4gICAgY29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBjb250YWluZXIuc3R5bGUucmlnaHQgPSA0MCArICdweCc7XG4gICAgY29udGFpbmVyLnN0eWxlLnRvcCA9IDIwICsgJ3B4JztcbiAgICBjb250YWluZXIuc3R5bGUud2lkdGggPSAyMDAgKyAncHgnO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgfVxuXG4gIHZhciBwYW5lbCA9IHt9O1xuICBwYW5lbC5jb250cm9sbGVycyA9IHt9O1xuICBwYW5lbC5kb21FbGVtZW50ID0gY29udGFpbmVyO1xuXG4gIHZhciBjb250cm9sbGVycyA9IHtcbiAgICAnY2hlY2tMaXN0JzogY2hlY2tMaXN0Q29udHJvbGxlclxuICB9O1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgIHZhciBpdGVtID0gZGF0YVtpXTtcblxuICAgIHZhciBmYWN0b3J5ID0gY29udHJvbGxlcnNbaXRlbS50eXBlXSB8fCB2YWx1ZUNvbnRyb2xsZXI7XG4gICAgdmFyIGNvbnRyb2xsZXIgPSBmYWN0b3J5KGl0ZW0pO1xuICAgIHBhbmVsLmNvbnRyb2xsZXJzW2l0ZW0udGl0bGVdID0gY29udHJvbGxlcjtcblxuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjb250cm9sbGVyLmVsZW1lbnQpO1xuICB9XG5cbiAgcmV0dXJuIHBhbmVsO1xufTtcblxudmFyIHZhbHVlQ29udHJvbGxlciA9IGZ1bmN0aW9uKGl0ZW0pIHtcblxuICB2YXIgb25DaGFuZ2UgPSBpdGVtLm9uQ2hhbmdlIHx8IGZ1bmN0aW9uKCkge307XG4gIHZhciBvbkZpbmlzaEVkaXRpbmcgPSBpdGVtLm9uRmluaXNoRWRpdGluZyB8fCBmdW5jdGlvbigpIHt9O1xuXG4gIHZhciBzZWN0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VjdGlvbicpO1xuICBzZWN0aW9uLmNsYXNzTmFtZSA9ICdzZWN0aW9uJztcblxuICB2YXIgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGl0bGUuaW5uZXJIVE1MID0gaXRlbS50aXRsZTtcbiAgdGl0bGUuY2xhc3NOYW1lID0gJ3RpdGxlJztcbiAgc2VjdGlvbi5hcHBlbmRDaGlsZCh0aXRsZSk7XG5cbiAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgaW5wdXQudHlwZSA9ICd0ZXh0JztcbiAgaW5wdXQudmFsdWUgPSBpdGVtLnZhbHVlO1xuICBpbnB1dC5jbGFzc05hbWUgPSAndGV4dC1maWVsZCc7XG5cbiAgc2VjdGlvbi5hcHBlbmRDaGlsZChpbnB1dCk7XG5cbiAgdmFyIGlucHV0TGlzdGVuZXIgPSBmdW5jdGlvbigpIHtcbiAgICBvbkNoYW5nZShpbnB1dC52YWx1ZSk7XG4gIH07XG5cbiAgdmFyIGtleWRvd25MaXN0ZW5lciA9IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgaW5wdXQuYmx1cigpO1xuICAgIH1cbiAgfTtcblxuICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGlucHV0TGlzdGVuZXIpO1xuICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywga2V5ZG93bkxpc3RlbmVyKTtcblxuICBmdW5jdGlvbiBzZXRWYWx1ZSh2YWx1ZSkge1xuICAgIGlucHV0LnZhbHVlID0gdmFsdWU7XG4gIH07XG5cbiAgZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICBpbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyKCdpbnB1dCcsIGlucHV0TGlzdGVuZXIpO1xuICAgIGlucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBrZXlkb3duTGlzdGVuZXIpO1xuICB9O1xuXG4gIGlucHV0Lm9uYmx1ciA9IGZ1bmN0aW9uKCkge1xuICAgIG9uRmluaXNoRWRpdGluZyhpbnB1dC52YWx1ZSwgaW5wdXQpO1xuICB9O1xuXG4gIHJldHVybiB7XG4gICAgZWxlbWVudDogc2VjdGlvbixcbiAgICBzZXRWYWx1ZTogc2V0VmFsdWUsXG4gICAgc2V0IG9uQ2hhbmdlKHZhbHVlKSB7XG4gICAgICBvbkNoYW5nZSA9IHZhbHVlO1xuICAgIH0sXG4gICAgZGlzcG9zZTogZGlzcG9zZVxuICB9XG59O1xuXG52YXIgY2hlY2tMaXN0Q29udHJvbGxlciA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgdmFyIG9uQ2hhbmdlID0gaXRlbS5vbkNoYW5nZSB8fCBmdW5jdGlvbigpIHt9O1xuXG4gIHZhciBzZWN0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VjdGlvbicpO1xuICBzZWN0aW9uLmNsYXNzTmFtZSA9ICdzZWN0aW9uJztcblxuICB2YXIgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGl0bGUuaW5uZXJIVE1MID0gaXRlbS50aXRsZTtcbiAgdGl0bGUuY2xhc3NOYW1lID0gJ3RpdGxlJztcbiAgc2VjdGlvbi5hcHBlbmRDaGlsZCh0aXRsZSk7XG5cbiAgdmFyIG9wdGlvbnMgPSBpdGVtLm9wdGlvbnM7XG5cbiAgdmFyIGJ1dHRvbnMgPSBbXTtcblxuICB2YXIgb25DbGljayA9IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGJ1dHRvbiA9IGJ1dHRvbnNbaW5kZXhdO1xuXG4gICAgICBidXR0b24uY2xhc3NMaXN0LnRvZ2dsZSgnc2VsZWN0ZWQnKTtcblxuICAgICAgb25DaGFuZ2UoZ2V0U2VsZWN0ZWRPcHRpb25zKCkpO1xuICAgIH07XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0U2VsZWN0ZWRPcHRpb25zKCkge1xuICAgIHZhciBzZWxlY3Rpb24gPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1dHRvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChidXR0b25zW2ldLmNsYXNzTGlzdC5jb250YWlucygnc2VsZWN0ZWQnKSkge1xuICAgICAgICBzZWxlY3Rpb24ucHVzaChvcHRpb25zW2ldKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2VsZWN0aW9uO1xuICB9O1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBvcHRpb24gPSBvcHRpb25zW2ldO1xuICAgIHZhciBidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICBidXR0b24uY2xhc3NOYW1lID0gJ3NlZ21lbnRlZC1idXR0b24nO1xuICAgIGJ1dHRvbi5pbm5lckhUTUwgPSBvcHRpb247XG4gICAgc2VjdGlvbi5hcHBlbmRDaGlsZChidXR0b24pO1xuXG4gICAgaWYgKGkgPT09IG9wdGlvbnMubGVuZ3RoIC0gMSkge1xuICAgICAgYnV0dG9uLnN0eWxlWydib3JkZXItcmlnaHQtc3R5bGUnXSA9ICcycHggc29saWQgIzAwMCc7XG4gICAgfVxuXG4gICAgYnV0dG9uLm9uY2xpY2sgPSBvbkNsaWNrKGkpO1xuXG4gICAgYnV0dG9ucy5wdXNoKGJ1dHRvbik7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGVsZW1lbnQ6IHNlY3Rpb25cbiAgfVxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgcHJvbXB0OiBmdW5jdGlvbihvcHRzLCBjYWxsYmFjaykge1xuICAgIHZhciB0ZXh0ID0gb3B0cy50ZXh0O1xuICAgIHZhciBidXR0b25zID0gb3B0cy5idXR0b25zIHx8IFsnT0snXTtcbiAgICB2YXIgY29udGFpbmVyV2lkdGggPSBvcHRzLmNvbnRhaW5lcldpZHRoIHx8IDIwMDtcbiAgICB2YXIgY29udGFpbmVySGVpZ2h0ID0gb3B0cy5jb250YWluZXJIZWlnaHQgfHwgMjAwO1xuXG4gICAgdmFyIGJhY2tncm91bmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBiYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICdyZ2JhKDAsMCwwLDAuOCknXG4gICAgYmFja2dyb3VuZC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgYmFja2dyb3VuZC5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgICBiYWNrZ3JvdW5kLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGJhY2tncm91bmQpO1xuXG4gICAgY29udGFpbmVyV2lkdGggPSAyMDA7XG4gICAgY29udGFpbmVySGVpZ2h0ID0gMjAwO1xuICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb250YWluZXIuY2xhc3NOYW1lID0gJ3Byb21wdCc7XG4gICAgY29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBjb250YWluZXIuc3R5bGUud2lkdGggPSBjb250YWluZXJXaWR0aCArICdweCc7XG4gICAgLy8gY29udGFpbmVyLnN0eWxlLmhlaWdodCA9IGNvbnRhaW5lckhlaWdodCArICdweCc7XG5cbiAgICBiYWNrZ3JvdW5kLmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XG5cbiAgICB1cGRhdGVMYXlvdXQoKTtcblxuICAgIGZ1bmN0aW9uIG9uV2luZG93UmVzaXplKCkge1xuICAgICAgdXBkYXRlTGF5b3V0KCk7XG4gICAgfTtcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBvbldpbmRvd1Jlc2l6ZSk7XG5cbiAgICB2YXIgcXVlc3Rpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMicpO1xuICAgIHF1ZXN0aW9uLmlubmVySFRNTCA9IHRleHQ7XG4gICAgcXVlc3Rpb24uc3R5bGUuZm9udEZhbWlseSA9ICcnXG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHF1ZXN0aW9uKTtcblxuICAgIC8vIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgLy8gaW5wdXQudHlwZSA9ICd0ZXh0JztcbiAgICAvLyBjb250YWluZXIuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuXG4gICAgLy8gY29udGFpbmVyLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2JyJykpO1xuXG4gICAgLy8gaW5wdXQuZm9jdXMoKTtcblxuICAgIGZ1bmN0aW9uIG9uQ2xpY2soaW5kZXgpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNob3VsZERpc21pc3MgPSBjYWxsYmFjayhpbmRleCk7XG4gICAgICAgIGlmIChzaG91bGREaXNtaXNzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBzaG91bGREaXNtaXNzID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzaG91bGREaXNtaXNzKSB7XG4gICAgICAgICAgZGlzbWlzcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYnV0dG9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGJ1dHRvblRleHQgPSBidXR0b25zW2ldO1xuICAgICAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgYnV0dG9uLmlubmVySFRNTCA9IGJ1dHRvblRleHQ7XG4gICAgICBidXR0b24ub25jbGljayA9IG9uQ2xpY2soaSk7XG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoYnV0dG9uKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1cGRhdGVMYXlvdXQoKSB7XG4gICAgICBjb250YWluZXIuc3R5bGUubGVmdCA9ICh3aW5kb3cuaW5uZXJXaWR0aCAtIGNvbnRhaW5lcldpZHRoKSAvIDIgKyAncHgnO1xuICAgICAgY29udGFpbmVyLnN0eWxlLnRvcCA9ICh3aW5kb3cuaW5uZXJIZWlnaHQgLSBjb250YWluZXJIZWlnaHQpIC8gMiArICdweCc7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGRpc21pc3MoKSB7XG4gICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGJhY2tncm91bmQpO1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIG9uV2luZG93UmVzaXplKTtcbiAgICB9XG5cbiAgICB2YXIgcHJvbXB0ID0ge1xuICAgICAgZGlzbWlzczogZGlzbWlzc1xuICAgIH07XG5cbiAgICByZXR1cm4gcHJvbXB0O1xuICB9XG59IiwidmFyIGNwciA9IHJlcXVpcmUoJy4vY3ByJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWRpdG9yKSB7XG4gIHZhciBiYXIgPSBjcHIoe1xuICAgIG9uUGljazogZnVuY3Rpb24ob2JqLCBpbmRleCkge1xuICAgICAgZWRpdG9yLnByZWZhYkluZGV4ID0gaW5kZXg7XG4gICAgICBlZGl0b3IubG9hZChlZGl0b3IucHJlZmFic1tpbmRleF0pO1xuICAgIH0sXG4gICAgYmxvY2tXaWR0aDogNDgsXG4gICAgYmxvY2tIZWlnaHQ6IDQ4LFxuICAgIGN1c3RvbVBsYWNlbWVudDogdHJ1ZVxuICB9KTtcblxuICB2YXIgZ3VpID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2d1aScpO1xuICBndWkuYXBwZW5kQ2hpbGQoYmFyLmRvbUVsZW1lbnQpO1xuXG4gIGJhci5kb21FbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgYmFyLmRvbUVsZW1lbnQuc3R5bGUubGVmdCA9ICcyMHB4JztcbiAgYmFyLmRvbUVsZW1lbnQuc3R5bGUuYm90dG9tID0gJzEyMHB4JztcblxuICByZXR1cm4gYmFyO1xufTsiLCJ2YXIgY3ByID0gcmVxdWlyZSgnLi9jcHInKTtcbnZhciBwb3B1cCA9IHJlcXVpcmUoJy4vcG9wdXAnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlZGl0b3IpIHtcbiAgdmFyIGlucHV0ID0gZWRpdG9yLmlucHV0O1xuICB2YXIgZGF0YSA9IFt7XG4gICAgYnV0dG9uOiAncGx1cycsXG4gICAgc3JjOiAnL2ltYWdlcy9pY29ucy9wbHVzX2xpZ2h0LnBuZycsXG4gICAgc3JjQWN0aXZlOiAnL2ltYWdlcy9pY29ucy9wbHVzX2RhcmsucG5nJyxcbiAgICB0b29sdGlwOiAnQ3JlYXRlIG5ldydcbiAgfSwge1xuICAgIGJ1dHRvbjogJ21pbnVzJyxcbiAgICBzcmM6ICcvaW1hZ2VzL2ljb25zL21pbnVzX2xpZ2h0LnBuZycsXG4gICAgc3JjQWN0aXZlOiAnL2ltYWdlcy9pY29ucy9taW51c19kYXJrLnBuZycsXG4gICAgdG9vbHRpcDogJ1JlbW92ZSBzZWxlY3RlZCdcbiAgfSwge1xuICAgIGJ1dHRvbjogJ2Nsb25lJyxcbiAgICBzcmM6ICcvaW1hZ2VzL2ljb25zL2Nsb25lX2xpZ2h0LnBuZycsXG4gICAgc3JjQWN0aXZlOiAnL2ltYWdlcy9pY29ucy9jbG9uZV9kYXJrLnBuZycsXG4gICAgdG9vbHRpcDogJ0Nsb25lIHNlbGVjdGVkJ1xuICB9XTtcblxuICB2YXIgYmFyID0gY3ByKHtcbiAgICBkYXRhOiBkYXRhLFxuICAgIGJsb2NrV2lkdGg6IDMyLFxuICAgIGJsb2NrSGVpZ2h0OiAzMixcbiAgICBkaXNhYmxlSGlnaGxpZ2h0OiB0cnVlLFxuICAgIHNob3dUb29sdGlwOiB0cnVlLFxuICAgIG9uUGljazogZnVuY3Rpb24ob2JqKSB7XG4gICAgICB2YXIgYnV0dG9uID0gb2JqLmJ1dHRvbjtcblxuICAgICAgaWYgKGJ1dHRvbiA9PT0gJ3BsdXMnKSB7XG4gICAgICAgIGVkaXRvci5jcmVhdGVOZXcoKTtcbiAgICAgIH0gZWxzZSBpZiAoYnV0dG9uID09PSAnbWludXMnKSB7XG4gICAgICAgIHBvcHVwLnByb21wdCh7XG4gICAgICAgICAgdGV4dDogXCJBcmUgeW91IHN1cmU/XCIsXG4gICAgICAgICAgYnV0dG9uczogW1wiWWVhXCIsIFwiTmFcIl1cbiAgICAgICAgfSwgZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgICBpZiAoaW5kZXggPT09IDApIHtcbiAgICAgICAgICAgIGVkaXRvci5yZW1vdmVTZWxlY3RlZCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgYmFyLmhpZ2hsaWdodCgxLCBmYWxzZSk7XG5cbiAgICAgIH0gZWxzZSBpZiAoYnV0dG9uID09PSAnY2xvbmUnKSB7XG4gICAgICAgIGVkaXRvci5jcmVhdGVDbG9uZSgpO1xuICAgICAgfVxuICAgIH0sXG4gICAgY3VzdG9tUGxhY2VtZW50OiB0cnVlLFxuICAgIGlzQnV0dG9uOiB0cnVlXG4gIH0pO1xuXG4gIHZhciBndWkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ3VpJyk7XG4gIGd1aS5hcHBlbmRDaGlsZChiYXIuZG9tRWxlbWVudCk7XG5cbiAgYmFyLmRvbUVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICBiYXIuZG9tRWxlbWVudC5zdHlsZS5sZWZ0ID0gJzIwcHgnO1xuICBiYXIuZG9tRWxlbWVudC5zdHlsZS5ib3R0b20gPSAnMTgwcHgnO1xufTsiLCJ2YXIgcGFuZWwgPSByZXF1aXJlKCcuL3BhbmVsJyk7XG5cbmZ1bmN0aW9uIGNsYW1wKHZhbHVlLCBtaW4sIG1heCkge1xuICBpZiAodmFsdWUgPCBtaW4pIHtcbiAgICByZXR1cm4gbWluO1xuICB9XG5cbiAgaWYgKHZhbHVlID4gbWF4KSB7XG4gICAgcmV0dXJuIG1heDtcbiAgfVxuXG4gIHJldHVybiB2YWx1ZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWRpdG9yKSB7XG4gIHZhciBkYXRhID0gW3tcbiAgICB0aXRsZTogJ25hbWUnLFxuICAgIHZhbHVlOiAnJyxcbiAgICBvbkNoYW5nZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGVkaXRvci5nZXRTZWxlY3RlZFByZWZhYigpLnVzZXJEYXRhLm5hbWUgPSB2YWx1ZTtcbiAgICB9XG4gIH0sIHtcbiAgICB0aXRsZTogJ3NpemUnLFxuICAgIHZhbHVlOiAnJyxcbiAgICBvbkZpbmlzaEVkaXRpbmc6IGZ1bmN0aW9uKHZhbHVlLCBpbnB1dCkge1xuICAgICAgdmFyIHJlZyA9IC9eXFxzKihcXGR7MSwyfSkgKFxcZHsxLDJ9KSAoXFxkezEsMn0pXFxzKiQvZ1xuICAgICAgdmFyIG1hdGNoZXMgPSByZWcuZXhlYyh2YWx1ZSk7XG5cbiAgICAgIGlmIChtYXRjaGVzID09IG51bGwpIHtcbiAgICAgICAgZWRpdG9yLnVwZGF0ZVByb3BlcnR5UGFuZWwoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBlZGl0b3IudXBkYXRlU2l6ZShbXG4gICAgICAgIGNsYW1wKHBhcnNlSW50KG1hdGNoZXNbMV0pLCAwLCAzMiksXG4gICAgICAgIGNsYW1wKHBhcnNlSW50KG1hdGNoZXNbMl0pLCAwLCAzMiksXG4gICAgICAgIGNsYW1wKHBhcnNlSW50KG1hdGNoZXNbM10pLCAwLCAzMilcbiAgICAgIF0pO1xuXG4gICAgICBlZGl0b3IudXBkYXRlUHJvcGVydHlQYW5lbCgpO1xuICAgIH1cbiAgfSwge1xuICAgIHRpdGxlOiAnbWlycm9yJyxcbiAgICB0eXBlOiAnY2hlY2tMaXN0JyxcbiAgICBvcHRpb25zOiBbJ3gnLCAneScsICd6J10sXG4gICAgb25DaGFuZ2U6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIGVkaXRvci5yZWZsZWN0WCA9IGVkaXRvci5yZWZsZWN0WSA9IGVkaXRvci5yZWZsZWN0WiA9IGZhbHNlO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChvcHRpb25zW2ldID09PSAneCcpIHtcbiAgICAgICAgICBlZGl0b3IucmVmbGVjdFggPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnNbaV0gPT09ICd5Jykge1xuICAgICAgICAgIGVkaXRvci5yZWZsZWN0WSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9uc1tpXSA9PT0gJ3onKSB7XG4gICAgICAgICAgZWRpdG9yLnJlZmxlY3RaID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfV07XG5cbiAgdmFyIHByb3BlcnR5UGFuZWwgPSBwYW5lbChkYXRhLCB7XG4gICAgY3VzdG9tUGxhY2VtZW50OiB0cnVlXG4gIH0pO1xuXG4gIHByb3BlcnR5UGFuZWwuZG9tRWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIHByb3BlcnR5UGFuZWwuZG9tRWxlbWVudC5zdHlsZS5yaWdodCA9IDQwICsgJ3B4JztcbiAgcHJvcGVydHlQYW5lbC5kb21FbGVtZW50LnN0eWxlLnRvcCA9IDIwICsgJ3B4JztcbiAgcHJvcGVydHlQYW5lbC5kb21FbGVtZW50LnN0eWxlLndpZHRoID0gMjAwICsgJ3B4JztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2d1aScpLmFwcGVuZENoaWxkKHByb3BlcnR5UGFuZWwuZG9tRWxlbWVudCk7XG5cbiAgcmV0dXJuIHByb3BlcnR5UGFuZWw7XG59OyIsInZhciBjcHIgPSByZXF1aXJlKCcuL2NwcicpO1xudmFyIEVkaXRvclRvb2xzID0gcmVxdWlyZSgnLi4vZWRpdG9ydG9vbHMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlZGl0b3IpIHtcbiAgdmFyIGJhciA9IGNwcih7XG4gICAgZGF0YTogW3tcbiAgICAgIHNyYzogJy9pbWFnZXMvaWNvbnMvcGVuY2lsX2xpZ2h0LnBuZycsXG4gICAgICBzcmNBY3RpdmU6ICcvaW1hZ2VzL2ljb25zL3BlbmNpbF9kYXJrLnBuZycsXG4gICAgICB0b29sbmFtZTogRWRpdG9yVG9vbHMuUGVuLFxuICAgICAgdG9vbHRpcDogJ3BlbiB0b29sICgxKSdcbiAgICB9LCB7XG4gICAgICBzcmM6ICcvaW1hZ2VzL2ljb25zL3NhbXBsZXJfbGlnaHQucG5nJyxcbiAgICAgIHNyY0FjdGl2ZTogJy9pbWFnZXMvaWNvbnMvc2FtcGxlcl9kYXJrLnBuZycsXG4gICAgICB0b29sbmFtZTogRWRpdG9yVG9vbHMuU2FtcGxlLFxuICAgICAgdG9vbHRpcDogJ3NhbXBsZSB0b29sICgyKSdcbiAgICB9LCB7XG4gICAgICBzcmM6ICcvaW1hZ2VzL2ljb25zL2xhc3NvX2xpZ2h0LnBuZycsXG4gICAgICBzcmNBY3RpdmU6ICcvaW1hZ2VzL2ljb25zL2xhc3NvX2RhcmsucG5nJyxcbiAgICAgIHRvb2xuYW1lOiBFZGl0b3JUb29scy5TZWxlY3QsXG4gICAgICB0b29sdGlwOiAnbGFzc28gdG9vbCAoMyknXG4gICAgfSwge1xuICAgICAgc3JjOiAnL2ltYWdlcy9pY29ucy9jYW1lcmFfbGlnaHQucG5nJyxcbiAgICAgIHNyY0FjdGl2ZTogJy9pbWFnZXMvaWNvbnMvY2FtZXJhX2RhcmsucG5nJyxcbiAgICAgIHRvb2xuYW1lOiBFZGl0b3JUb29scy5DYW1lcmEsXG4gICAgICB0b29sdGlwOiAnY2FtZXJhIHRvb2wgKDQgb3IgZHJhZyBlbXB0eSBzcGFjZSknXG4gICAgfSwge1xuICAgICAgc3JjOiAnL2ltYWdlcy9pY29ucy9maWxsX2xpZ2h0LnBuZycsXG4gICAgICBzcmNBY3RpdmU6ICcvaW1hZ2VzL2ljb25zL2ZpbGxfZGFyay5wbmcnLFxuICAgICAgdG9vbG5hbWU6IEVkaXRvclRvb2xzLkZpbGwsXG4gICAgICB0b29sdGlwOiAnYmxvY2sgdG9vbCAoNSkgKGRyYWcgYW5kIGRyb3AgYmV0d2VlbiB0d28gcG9pbnRzKSdcbiAgICB9XSxcbiAgICBibG9ja1dpZHRoOiAzMixcbiAgICBibG9ja0hlaWdodDogMzIsXG4gICAgb25QaWNrOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIGVkaXRvci50b29sTmFtZSA9IG9iai50b29sbmFtZTtcbiAgICAgIGVkaXRvci51cGRhdGVUb29sKCk7XG4gICAgfSxcbiAgICBjdXN0b21QbGFjZW1lbnQ6IHRydWUsXG4gICAgc2hvd1Rvb2x0aXA6IHRydWUsXG4gICAgaGlkZUhpZ2hsaWdodDogdHJ1ZSxcbiAgICBpc0J1dHRvbjogdHJ1ZSxcbiAgICBzdGlja3lTZWxlY3Rpb246IHRydWVcbiAgfSk7XG5cbiAgdmFyIGd1aSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdndWknKTtcbiAgZ3VpLmFwcGVuZENoaWxkKGJhci5kb21FbGVtZW50KTtcblxuICBiYXIuZG9tRWxlbWVudC5jbGFzc0xpc3QuYWRkKCd0b29sYmFyJyk7XG5cbiAgYmFyLmRvbUVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICBiYXIuZG9tRWxlbWVudC5zdHlsZS50b3AgPSAyMCArICdweCc7XG4gIGJhci5kb21FbGVtZW50LnN0eWxlLmxlZnQgPSAyMCArICdweCc7XG5cbiAgcmV0dXJuIGJhcjtcbn07IiwidmFyIENhbWVyYVRvb2wgPSBmdW5jdGlvbigpIHtcblxufTtcblxuQ2FtZXJhVG9vbC5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCkge1xuXHRcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FtZXJhVG9vbDsiLCJ2YXIgU2V0Q29tbWFuZCA9IHJlcXVpcmUoJy4uL2NvbW1hbmRzL3NldGNvbW1hbmQnKTtcblxudmFyIEZpbGxUb29sID0gZnVuY3Rpb24oZWRpdG9yKSB7XG4gIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xuICB0aGlzLmlucHV0ID0gdGhpcy5lZGl0b3IuaW5wdXQ7XG4gIHRoaXMuYmxvY2tzQ29weSA9IG51bGw7XG4gIHRoaXMuc3RhcnRDb29yZCA9IG51bGw7XG4gIHRoaXMuZW5kQ29vcmQgPSBudWxsO1xufTtcblxuRmlsbFRvb2wucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuZWRpdG9yLnVwZGF0ZUxhc3RCbG9ja3MoKTtcbn07XG5cbkZpbGxUb29sLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjb29yZEFib3ZlID0gdGhpcy5lZGl0b3IuZ2V0Q29vcmRBYm92ZSgpO1xuICB2YXIgY29vcmRCZWxvdyA9IHRoaXMuZWRpdG9yLmdldENvb3JkQmVsb3coKTtcbiAgdmFyIHNob3VsZFVwZGF0ZSA9IGZhbHNlO1xuXG4gIHZhciBpc1JlbW92ZSA9IHRoaXMuaW5wdXQubW91c2VIb2xkKDIpIHx8IHRoaXMuaW5wdXQubW91c2VVcCgyKTtcblxuICB0aGlzLmVkaXRvci5oaWdobGlnaHRDb29yZCA9IHRoaXMuZWRpdG9yLnNlbGVjdGVkQ29sb3IgPT0gbnVsbCA/IGNvb3JkQmVsb3cgOiBjb29yZEFib3ZlO1xuXG4gIHZhciBjb29yZCA9IChpc1JlbW92ZSB8fCB0aGlzLmVkaXRvci5zZWxlY3RlZENvbG9yID09IG51bGwpID8gY29vcmRCZWxvdyA6IGNvb3JkQWJvdmU7XG5cbiAgaWYgKHRoaXMuaW5wdXQubW91c2VEb3duKCkgJiYgY29vcmQgIT0gbnVsbCkge1xuICAgIHRoaXMuYmxvY2tzQ29weSA9IHRoaXMuZWRpdG9yLmJsb2Nrcy5zZXJpYWxpemUoKTtcbiAgICBpZiAodGhpcy5zdGFydENvb3JkID09IG51bGwpIHtcbiAgICAgIHRoaXMuc3RhcnRDb29yZCA9IGNvb3JkO1xuICAgICAgdGhpcy5lbmRDb29yZCA9IGNvb3JkO1xuICAgICAgc2hvdWxkVXBkYXRlID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAodGhpcy5zdGFydENvb3JkICE9IG51bGwgJiYgY29vcmQgIT0gbnVsbCkge1xuICAgIGlmICh0aGlzLmVuZENvb3JkID09IG51bGwgfHwgIXRoaXMuZW5kQ29vcmQuZXF1YWxzKGNvb3JkKSkge1xuICAgICAgdGhpcy5lbmRDb29yZCA9IGNvb3JkO1xuICAgICAgc2hvdWxkVXBkYXRlID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICB2YXIgaW5kZXggPSBpc1JlbW92ZSA/IDAgOlxuICAgIHRoaXMuZWRpdG9yLmJsb2Nrcy5nZXRPckFkZENvbG9ySW5kZXgodGhpcy5lZGl0b3Iuc2VsZWN0ZWRDb2xvcik7XG5cbiAgaWYgKHRoaXMuc3RhcnRDb29yZCAhPSBudWxsICYmIHRoaXMuZW5kQ29vcmQgIT0gbnVsbCAmJiBzaG91bGRVcGRhdGUpIHtcbiAgICB0aGlzLmVkaXRvci5ibG9ja3MuZGVzZXJpYWxpemUodGhpcy5ibG9ja3NDb3B5KTtcblxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLmxvb3BDb29yZHModGhpcy5zdGFydENvb3JkLCB0aGlzLmVuZENvb3JkLCBmdW5jdGlvbihpLCBqLCBrKSB7XG4gICAgICBzZWxmLmVkaXRvci5ibG9ja3Muc2V0KGksIGosIGssIGluZGV4KTtcbiAgICB9KTtcbiAgfVxuXG4gIGlmICh0aGlzLmlucHV0Lm1vdXNlVXAoKSAmJiB0aGlzLmJsb2Nrc0NvcHkgIT0gbnVsbCkge1xuICAgIHRoaXMuZWRpdG9yLmJsb2Nrcy5kZXNlcmlhbGl6ZSh0aGlzLmJsb2Nrc0NvcHkpO1xuXG4gICAgdmFyIGNvb3JkcyA9IFtdO1xuXG4gICAgdGhpcy5sb29wQ29vcmRzKHRoaXMuc3RhcnRDb29yZCwgdGhpcy5lbmRDb29yZCwgZnVuY3Rpb24oaSwgaiwgaykge1xuICAgICAgY29vcmRzLnB1c2gobmV3IFRIUkVFLlZlY3RvcjMoaSwgaiwgaykpO1xuICAgIH0pO1xuXG4gICAgdmFyIGNvbW1hbmQgPSBuZXcgU2V0Q29tbWFuZCh0aGlzLmVkaXRvci5ibG9ja3MsIGNvb3JkcywgaW5kZXgpO1xuICAgIHRoaXMuZWRpdG9yLnJ1bkNvbW1hbmQoY29tbWFuZCk7XG4gICAgdGhpcy5lZGl0b3IudXBkYXRlTGFzdEJsb2NrcygpO1xuXG4gICAgdGhpcy5zdGFydENvb3JkID0gbnVsbDtcbiAgICB0aGlzLmVuZENvb3JkID0gbnVsbDtcbiAgICB0aGlzLmJsb2Nrc0NvcHkgPSBudWxsO1xuICB9XG59O1xuXG5GaWxsVG9vbC5wcm90b3R5cGUubG9vcENvb3JkcyA9IGZ1bmN0aW9uKHN0YXJ0Q29vcmQsIGVuZENvb3JkLCBjYWxsYmFjaykge1xuICB2YXIgbWluID0gbmV3IFRIUkVFLlZlY3RvcjMoXG4gICAgTWF0aC5taW4oc3RhcnRDb29yZC54LCBlbmRDb29yZC54KSxcbiAgICBNYXRoLm1pbihzdGFydENvb3JkLnksIGVuZENvb3JkLnkpLFxuICAgIE1hdGgubWluKHN0YXJ0Q29vcmQueiwgZW5kQ29vcmQueilcbiAgKTtcblxuICB2YXIgbWF4ID0gbmV3IFRIUkVFLlZlY3RvcjMoXG4gICAgTWF0aC5tYXgoc3RhcnRDb29yZC54LCBlbmRDb29yZC54KSxcbiAgICBNYXRoLm1heChzdGFydENvb3JkLnksIGVuZENvb3JkLnkpLFxuICAgIE1hdGgubWF4KHN0YXJ0Q29vcmQueiwgZW5kQ29vcmQueilcbiAgKTtcblxuICBmb3IgKHZhciBpID0gbWluLng7IGkgPD0gbWF4Lng7IGkrKykge1xuICAgIGZvciAodmFyIGogPSBtaW4ueTsgaiA8PSBtYXgueTsgaisrKSB7XG4gICAgICBmb3IgKHZhciBrID0gbWluLno7IGsgPD0gbWF4Lno7IGsrKykge1xuICAgICAgICBjYWxsYmFjayhpLCBqLCBrKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsbFRvb2w7IiwidmFyIFNldENvbW1hbmQgPSByZXF1aXJlKCcuLi9jb21tYW5kcy9zZXRjb21tYW5kJyk7XG5cbnZhciBQZW5Ub29sID0gZnVuY3Rpb24oZWRpdG9yKSB7XG5cbiAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XG5cbiAgdGhpcy5jYW1lcmEgPSB0aGlzLmVkaXRvci5jYW1lcmE7XG5cbiAgdGhpcy5pbnB1dCA9IHRoaXMuZWRpdG9yLmlucHV0O1xuXG4gIHRoaXMuYmxvY2tzID0gdGhpcy5lZGl0b3IuYmxvY2tzO1xuXG4gIHRoaXMub2JqZWN0ID0gdGhpcy5lZGl0b3Iub2JqZWN0O1xuXG4gIHRoaXMubGFzdE1vdXNlID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcblxuICB0aGlzLm1vdXNlU2FtcGxlSW50ZXJ2YWwgPSA0O1xufTtcblxuUGVuVG9vbC5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5lZGl0b3IuZWRpdExvY2spIHtcbiAgICByZXR1cm47XG4gIH1cbiAgXG4gIHZhciBpc0NsZWFyQ29sb3IgPSB0aGlzLmVkaXRvci5zZWxlY3RlZENvbG9yID09IG51bGw7XG5cbiAgdGhpcy5lZGl0b3IuaGlnaGxpZ2h0Q29vcmQgPSBpc0NsZWFyQ29sb3IgP1xuICAgIHRoaXMuZWRpdG9yLmdldENvb3JkQmVsb3coKSA6XG4gICAgdGhpcy5lZGl0b3IuZ2V0Q29vcmRBYm92ZSgpO1xuXG4gIGlmICh0aGlzLmlucHV0Lm1vdXNlRG93bigpIHx8IHRoaXMuaW5wdXQubW91c2VVcCgpKSB7XG4gICAgdGhpcy5lZGl0b3IudXBkYXRlTGFzdEJsb2NrcygpO1xuICB9XG5cbiAgaWYgKHRoaXMuaW5wdXQubW91c2VEb3duKDApKSB7XG4gICAgdGhpcy5vbkNsaWNrKGlzQ2xlYXJDb2xvcik7XG4gIH0gZWxzZSBpZiAodGhpcy5pbnB1dC5tb3VzZURvd24oMikpIHtcbiAgICB0aGlzLm9uQ2xpY2sodHJ1ZSk7XG4gIH1cblxuICBpZiAodGhpcy5pbnB1dC5tb3VzZUhvbGQoMCkgJiYgdGhpcy5pbnB1dC5tb3VzZU1vdmUoKSkge1xuICAgIHRoaXMub25EcmFnKGlzQ2xlYXJDb2xvcik7XG4gIH0gZWxzZSBpZiAodGhpcy5pbnB1dC5tb3VzZUhvbGQoMikgJiYgdGhpcy5pbnB1dC5tb3VzZU1vdmUoKSkge1xuICAgIHRoaXMub25EcmFnKHRydWUpO1xuICB9XG5cbiAgdGhpcy5sYXN0TW91c2UgPSB0aGlzLmlucHV0Lm1vdXNlLmNsb25lKCk7XG59O1xuXG5QZW5Ub29sLnByb3RvdHlwZS5vbkNsaWNrID0gZnVuY3Rpb24oaXNDbGVhcikge1xuICB2YXIgY29sb3IgPSBpc0NsZWFyID8gbnVsbCA6IHRoaXMuZWRpdG9yLnNlbGVjdGVkQ29sb3I7XG4gIHZhciBzZWxlY3RlZEluZGV4ID0gdGhpcy5ibG9ja3MuZ2V0T3JBZGRDb2xvckluZGV4KGNvbG9yKTtcblxuICB2YXIgY29vcmQgPSBpc0NsZWFyID9cbiAgICB0aGlzLmVkaXRvci5nZXRDb29yZEJlbG93KCkgOlxuICAgIHRoaXMuZWRpdG9yLmdldENvb3JkQWJvdmUoKTtcblxuICBpZiAoISFjb29yZCkge1xuICAgIGlmICh0aGlzLmJsb2Nrcy5nZXRBdENvb3JkKGNvb3JkKSAhPT0gc2VsZWN0ZWRJbmRleCkge1xuICAgICAgdGhpcy5lZGl0b3IucnVuQ29tbWFuZChuZXcgU2V0Q29tbWFuZCh0aGlzLmJsb2NrcywgdGhpcy5yZWZsZWN0Q29vcmRzKFtjb29yZF0pLCBzZWxlY3RlZEluZGV4KSk7XG4gICAgICB0aGlzLmVkaXRvci51cGRhdGVMYXN0QmxvY2tzKCk7XG4gICAgfVxuICB9XG59O1xuXG5QZW5Ub29sLnByb3RvdHlwZS5vbkRyYWcgPSBmdW5jdGlvbihpc0NsZWFyKSB7XG4gIHZhciBjb2xvciA9IGlzQ2xlYXIgPyBudWxsIDogdGhpcy5lZGl0b3Iuc2VsZWN0ZWRDb2xvcjtcbiAgdmFyIHNlbGVjdGVkSW5kZXggPSB0aGlzLmJsb2Nrcy5nZXRPckFkZENvbG9ySW5kZXgoY29sb3IpO1xuXG4gIHZhciBwb2ludHMgPSB0aGlzLmdldE1vdXNlUG9pbnRzKHRoaXMubGFzdE1vdXNlLCB0aGlzLmlucHV0Lm1vdXNlLCB0aGlzLm1vdXNlU2FtcGxlSW50ZXJ2YWwpO1xuICB2YXIgY29vcmRzID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcG9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGNvb3JkID0gaXNDbGVhciA/XG4gICAgICB0aGlzLmVkaXRvci5nZXRDb29yZEJlbG93KHBvaW50c1tpXSkgOlxuICAgICAgdGhpcy5lZGl0b3IuZ2V0Q29vcmRBYm92ZShwb2ludHNbaV0pO1xuXG4gICAgaWYgKCEhY29vcmQpIHtcbiAgICAgIGlmICh0aGlzLmJsb2Nrcy5nZXRBdENvb3JkKGNvb3JkKSAhPT0gc2VsZWN0ZWRJbmRleCkge1xuICAgICAgICBjb29yZHMucHVzaChjb29yZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29vcmRzID0gdW5pcXVlQ29vcmRzKGNvb3Jkcyk7XG4gIGlmIChjb29yZHMubGVuZ3RoID4gMCkge1xuICAgIHRoaXMuZWRpdG9yLnJ1bkNvbW1hbmQobmV3IFNldENvbW1hbmQodGhpcy5ibG9ja3MsIHRoaXMucmVmbGVjdENvb3Jkcyhjb29yZHMpLCBzZWxlY3RlZEluZGV4KSk7XG4gIH1cbn07XG5cbi8vIFJlZmxlY3QgY29vcmRzIHdpdGggZWRpdG9yIHNldHRpbmdzXG5QZW5Ub29sLnByb3RvdHlwZS5yZWZsZWN0Q29vcmRzID0gZnVuY3Rpb24oY29vcmRzKSB7XG4gIGlmICghdGhpcy5lZGl0b3IucmVmbGVjdFggJiYgIXRoaXMuZWRpdG9yLnJlZmxlY3RZICYmICF0aGlzLmVkaXRvci5yZWZsZWN0Wikge1xuICAgIHJldHVybiBjb29yZHM7XG4gIH1cblxuICB2YXIgZGltID0gdGhpcy5ibG9ja3MuZGltO1xuICB2YXIgcGl2b3QgPSBbXG4gICAgTWF0aC5yb3VuZCgoZGltWzBdIC0gMSkgLyAyKSxcbiAgICBNYXRoLnJvdW5kKChkaW1bMV0gLSAxKSAvIDIpLFxuICAgIE1hdGgucm91bmQoKGRpbVsyXSAtIDEpIC8gMilcbiAgXTtcblxuICBpZiAodGhpcy5lZGl0b3IucmVmbGVjdFgpIHtcbiAgICB2YXIgcmVmbGVjdGVkID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciByID0gY29vcmRzW2ldLmNsb25lKCk7XG4gICAgICByLnggPSBwaXZvdFswXSArIHBpdm90WzBdIC0gci54O1xuICAgICAgcmVmbGVjdGVkLnB1c2gocik7XG4gICAgfVxuICAgIGNvb3JkcyA9IGNvb3Jkcy5jb25jYXQocmVmbGVjdGVkKTtcbiAgfVxuXG4gIGlmICh0aGlzLmVkaXRvci5yZWZsZWN0WSkge1xuICAgIHZhciByZWZsZWN0ZWQgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHIgPSBjb29yZHNbaV0uY2xvbmUoKTtcbiAgICAgIHIueSA9IHBpdm90WzFdICsgcGl2b3RbMV0gLSByLnk7XG4gICAgICByZWZsZWN0ZWQucHVzaChyKTtcbiAgICB9XG4gICAgY29vcmRzID0gY29vcmRzLmNvbmNhdChyZWZsZWN0ZWQpO1xuICB9XG5cbiAgaWYgKHRoaXMuZWRpdG9yLnJlZmxlY3RaKSB7XG4gICAgdmFyIHJlZmxlY3RlZCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29vcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgciA9IGNvb3Jkc1tpXS5jbG9uZSgpO1xuICAgICAgci56ID0gcGl2b3RbMl0gKyBwaXZvdFsyXSAtIHIuejtcbiAgICAgIHJlZmxlY3RlZC5wdXNoKHIpO1xuICAgIH1cbiAgICBjb29yZHMgPSBjb29yZHMuY29uY2F0KHJlZmxlY3RlZCk7XG4gIH1cblxuICByZXR1cm4gY29vcmRzO1xufTtcblxuUGVuVG9vbC5wcm90b3R5cGUuZ2V0TW91c2VQb2ludHMgPSBmdW5jdGlvbihmcm9tLCB0bywgbWF4RGlzKSB7XG4gIHZhciBkaXN0YW5jZSA9IG5ldyBUSFJFRS5WZWN0b3IyKCkuc3ViVmVjdG9ycyh0bywgZnJvbSkubGVuZ3RoKCk7XG5cbiAgdmFyIGludGVydmFsID0gTWF0aC5jZWlsKGRpc3RhbmNlIC8gbWF4RGlzKTtcbiAgdmFyIHN0ZXAgPSBuZXcgVEhSRUUuVmVjdG9yMigpLnN1YlZlY3RvcnModG8sIGZyb20pLnNldExlbmd0aChkaXN0YW5jZSAvIGludGVydmFsKTtcblxuICB2YXIgbGlzdCA9IFtdO1xuICB2YXIgc3RhcnQgPSBmcm9tLmNsb25lKCk7XG4gIGxpc3QucHVzaChzdGFydCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgaW50ZXJ2YWw7IGkrKykge1xuICAgIHN0YXJ0LmFkZChzdGVwKTtcbiAgICBsaXN0LnB1c2goc3RhcnQuY2xvbmUoKSk7XG4gIH1cbiAgcmV0dXJuIGxpc3Q7XG59O1xuXG5mdW5jdGlvbiB1bmlxdWVDb29yZHMoY29vcmRzKSB7XG4gIHZhciBtYXAgPSB7fTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICBtYXBbY29vcmRzW2ldLnRvQXJyYXkoKS5qb2luKCcsJyldID0gY29vcmRzW2ldO1xuICB9XG4gIHZhciBsaXN0ID0gW107XG4gIGZvciAodmFyIGlkIGluIG1hcCkge1xuICAgIGxpc3QucHVzaChtYXBbaWRdKTtcbiAgfVxuICByZXR1cm4gbGlzdDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUGVuVG9vbDsiLCJ2YXIgRWRpdG9yVG9vbHMgPSByZXF1aXJlKCcuLi9lZGl0b3J0b29scycpO1xuXG52YXIgU2FtcGxlVG9vbCA9IGZ1bmN0aW9uKGVkaXRvcikge1xuICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcbiAgdGhpcy5pbnB1dCA9IHRoaXMuZWRpdG9yLmlucHV0O1xuICB0aGlzLmJsb2NrcyA9IHRoaXMuZWRpdG9yLmJsb2Nrcztcbn07XG5cblNhbXBsZVRvb2wucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5lZGl0b3IuaGlnaGxpZ2h0Q29vcmQgPSB0aGlzLmVkaXRvci5nZXRDb29yZEJlbG93KCk7XG5cbiAgaWYgKHRoaXMuaW5wdXQubW91c2VEb3duKCkpIHtcbiAgICB2YXIgY29vcmQgPSB0aGlzLmVkaXRvci5nZXRDb29yZEJlbG93KCk7XG5cbiAgICB2YXIgY29sb3IgPSBudWxsO1xuICAgIGlmIChjb29yZCAhPSBudWxsKSB7XG4gICAgICB2YXIgaW5kZXggPSB0aGlzLmJsb2Nrcy5nZXRBdENvb3JkKGNvb3JkKTtcbiAgICAgIHZhciBjb2xvciA9IHRoaXMuYmxvY2tzLnBhbGV0dGVbaW5kZXhdO1xuICAgICAgdGhpcy5lZGl0b3Iuc2V0U2VsZWN0ZWRDb2xvcihjb2xvcik7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lZGl0b3Iuc2V0U2VsZWN0ZWRDb2xvcihudWxsKTtcbiAgICB9XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2FtcGxlVG9vbDsiLCJ2YXIgaW5zaWRlID0gcmVxdWlyZSgncG9pbnQtaW4tcG9seWdvbicpO1xudmFyIFNlbGVjdENvbW1hbmQgPSByZXF1aXJlKCcuLi9jb21tYW5kcy9zZWxlY3Rjb21tYW5kJyk7XG5cbnZhciBTZWxlY3RUb29sID0gZnVuY3Rpb24oZWRpdG9yKSB7XG4gIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xuICB0aGlzLmlucHV0ID0gdGhpcy5lZGl0b3IuaW5wdXQ7XG4gIHRoaXMuYmxvY2tzID0gdGhpcy5lZGl0b3IuYmxvY2tzO1xuICB0aGlzLmNhbWVyYSA9IHRoaXMuZWRpdG9yLmNhbWVyYTtcblxuICB0aGlzLmRpdlNlbGVjdGlvbkJveCA9IG51bGw7XG5cbiAgdGhpcy5jYW52YXMgPSBlZGl0b3IuY2FudmFzO1xuICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gIHRoaXMucG9pbnRzID0gW107XG4gIHRoaXMubWluRGlzdGFuY2UgPSAyO1xufTtcblxuU2VsZWN0VG9vbC5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCkge1xuXG4gIGlmICh0aGlzLmlucHV0Lm1vdXNlSG9sZCgwKSkge1xuICAgIHZhciBtb3VzZSA9IHRoaXMuaW5wdXQubW91c2UuY2xvbmUoKTtcbiAgICBpZiAodGhpcy5wb2ludHMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLnBvaW50cy5wdXNoKG1vdXNlLnRvQXJyYXkoKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBsYXN0TW91c2UgPSBuZXcgVEhSRUUuVmVjdG9yMigpLmZyb21BcnJheSh0aGlzLnBvaW50c1t0aGlzLnBvaW50cy5sZW5ndGggLSAxXSk7XG4gICAgICB2YXIgZGlzdGFuY2UgPSBsYXN0TW91c2UuZGlzdGFuY2VUbyhtb3VzZSk7XG4gICAgICBpZiAoZGlzdGFuY2UgPiB0aGlzLm1pbkRpc3RhbmNlKSB7XG4gICAgICAgIHRoaXMucG9pbnRzLnB1c2gobW91c2UudG9BcnJheSgpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKHRoaXMucG9pbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMudXBkYXRlU2VsZWN0aW9uKCk7XG4gICAgfVxuICAgIHRoaXMucG9pbnRzID0gW107XG4gIH1cblxuICB0aGlzLmRyYXdMYXNzbygpO1xufTtcblxuU2VsZWN0VG9vbC5wcm90b3R5cGUuZHJhd0xhc3NvID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLnBvaW50cy5sZW5ndGggPCAyKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhpcy5jb250ZXh0LmxpbmVXaWR0aCA9ICcxJztcbiAgdGhpcy5jb250ZXh0LnNldExpbmVEYXNoKFszXSk7XG4gIHRoaXMuY29udGV4dC5zdHJva2VTdHlsZSA9ICcjZmZmZmZmJztcbiAgdGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucG9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHBvaW50ID0gdGhpcy5wb2ludHNbaV07XG4gICAgaWYgKGkgPT09IDApIHtcbiAgICAgIHRoaXMuY29udGV4dC5tb3ZlVG8ocG9pbnRbMF0sIHBvaW50WzFdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jb250ZXh0LmxpbmVUbyhwb2ludFswXSwgcG9pbnRbMV0pO1xuICAgIH1cbiAgfVxuICB0aGlzLmNvbnRleHQuc3Ryb2tlKCk7XG59O1xuXG5TZWxlY3RUb29sLnByb3RvdHlwZS51cGRhdGVTZWxlY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGJsb2NrcyA9IHRoaXMuYmxvY2tzO1xuICB2YXIgY2FtZXJhID0gdGhpcy5jYW1lcmE7XG4gIHZhciBjYW52YXMgPSB0aGlzLmNhbnZhcztcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHZhciBzY3JlZW5Qb2ludHMgPSBbXTtcbiAgdGhpcy5ibG9ja3MudmlzaXQoZnVuY3Rpb24oaSwgaiwgaywgYikge1xuICAgIHZhciBjb29yZCA9IG5ldyBUSFJFRS5WZWN0b3IzKGkgKyAwLjUsIGogKyAwLjUsIGsgKyAwLjUpO1xuICAgIHZhciBsb2NhbFBvaW50ID0gYmxvY2tzLmNvb3JkVG9Qb2ludChjb29yZCk7XG4gICAgdmFyIHdvcmxkUG9pbnQgPSBibG9ja3Mub2JqLmxvY2FsVG9Xb3JsZChsb2NhbFBvaW50KTtcbiAgICB2YXIgdmVjdG9yID0gd29ybGRQb2ludC5wcm9qZWN0KGNhbWVyYSk7XG4gICAgdmVjdG9yLnggPSBNYXRoLnJvdW5kKCh2ZWN0b3IueCArIDEpICogY2FudmFzLndpZHRoIC8gMik7XG4gICAgdmVjdG9yLnkgPSBNYXRoLnJvdW5kKCgtdmVjdG9yLnkgKyAxKSAqIGNhbnZhcy5oZWlnaHQgLyAyKTtcblxuICAgIHNjcmVlblBvaW50cy5wdXNoKHtcbiAgICAgIHNjcmVlbjogW3ZlY3Rvci54LCB2ZWN0b3IueV0sXG4gICAgICBjb29yZDogbmV3IFRIUkVFLlZlY3RvcjMoaSwgaiwgaylcbiAgICB9KTtcbiAgfSk7XG5cbiAgdmFyIHNlbGVjdGlvbnMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY3JlZW5Qb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgc2NyZWVuID0gc2NyZWVuUG9pbnRzW2ldLnNjcmVlbjtcbiAgICAvLyBUZXN0IHBvaW50IGluIHBvbHlnb25cbiAgICBpZiAoaW5zaWRlKHNjcmVlbiwgdGhpcy5wb2ludHMpKSB7XG4gICAgICBzZWxlY3Rpb25zLnB1c2goc2NyZWVuUG9pbnRzW2ldLmNvb3JkKTtcbiAgICB9XG4gIH1cblxuICB0aGlzLmVkaXRvci5ydW5Db21tYW5kKG5ldyBTZWxlY3RDb21tYW5kKHRoaXMuZWRpdG9yLCBzZWxlY3Rpb25zKSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbGVjdFRvb2w7IiwidmFyIFRIUkVFID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ1RIUkVFJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydUSFJFRSddIDogbnVsbCk7XG52YXIgYiA9IHJlcXVpcmUoJy4vY29yZS9iJyk7XG52YXIgc3RhdHMgPSByZXF1aXJlKCcuL3NlcnZpY2VzL3N0YXRzJyk7XG5cbnZhciBhcHAgPSBiKCdtYWluJyk7XG5cbnZhciBzY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xudmFyIGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSg2MCwgd2luZG93LmlubmVyV2lkdGggLyB3aW5kb3cuaW5uZXJIZWlnaHQsIDAuMSwgMTAwMCk7XG5cbi8vIFJlZ3NpdGVyIHZhbHVlc1xuYXBwLnZhbHVlKCdhcHAnLCBhcHApO1xuYXBwLnZhbHVlKCdzY2VuZScsIHNjZW5lKTtcbmFwcC52YWx1ZSgnY2FtZXJhJywgY2FtZXJhKTtcbmFwcC52YWx1ZSgnY29uZmlnJywgcmVxdWlyZSgnLi9kYXRhL2NvbmZpZy5qc29uJykpO1xuYXBwLnZhbHVlKCdwYWxldHRlJywgcmVxdWlyZSgnLi9kYXRhL3BhbGV0dGUuanNvbicpKTtcbmFwcC52YWx1ZSgnbWF0ZXJpYWxzJywgcmVxdWlyZSgnLi9zZXJ2aWNlcy9tYXRlcmlhbHMnKSk7XG5hcHAudmFsdWUoJ2NhbnZhcycsIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW52YXMnKSk7XG5cbnZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29udGFpbmVyJyk7XG5hcHAudXNlKHJlcXVpcmUoJy4vc3lzdGVtcy9yZW5kZXJlcicpKHNjZW5lLCBjYW1lcmEsIGNvbnRhaW5lcikpO1xuYXBwLnVzZSgnaW5wdXQnLCByZXF1aXJlKCcuL3N5c3RlbXMvaW5wdXQnKShjb250YWluZXIpKTtcbmFwcC51c2UocmVxdWlyZSgnLi92b3hlbC92b3hlbCcpKCkpO1xuXG52YXIgZGV2Q29uc29sZSA9IHJlcXVpcmUoJy4vc2VydmljZXMvZGV2Y29uc29sZScpKHtcbiAgb25ibHVyOiBmdW5jdGlvbigpIHtcbiAgICBjb250YWluZXIuZm9jdXMoKTtcbiAgfVxufSk7XG5hcHAudmFsdWUoJ2RldkNvbnNvbGUnLCBkZXZDb25zb2xlKTtcblxudmFyIHByZWZhYlNlcnZpY2UgPSByZXF1aXJlKCcuL3NlcnZpY2VzL3ByZWZhYnNlcnZpY2UnKSgpO1xuYXBwLnZhbHVlKCdwcmVmYWJTZXJ2aWNlJywgcHJlZmFiU2VydmljZSk7XG5cbnN0YXRzKGFwcCk7XG5cbi8vIEF0dGFjaCBjYW1lcmEgY29udHJvbFxuZnVuY3Rpb24gbG9hZEdhbWUoKSB7XG4gIGFwcC5hdHRhY2goY2FtZXJhLCByZXF1aXJlKCcuL2NvbXBvbmVudHMvcGxheWVyQ2FtZXJhJykpO1xuXG4gIGFwcC5sb2FkQXNzZW1ibHkocmVxdWlyZSgnLi9hc3NlbWJsaWVzL2Fncm91bmQnKSk7XG5cbiAgdmFyIHBsYXllciA9IGFwcC5sb2FkQXNzZW1ibHkocmVxdWlyZSgnLi9hc3NlbWJsaWVzL2FwbGF5ZXInKSk7XG4gIGFwcC52YWx1ZSgncGxheWVyJywgcGxheWVyKTtcbn07XG5cbmZ1bmN0aW9uIGxvYWRFZGl0b3IoKSB7XG4gIGFwcC5sb2FkQXNzZW1ibHkocmVxdWlyZSgnLi9hc3NlbWJsaWVzL2FlZGl0b3InKSk7XG59XG5cbmxvYWRFZGl0b3IoKTtcblxuYXBwLnN0YXJ0KCk7XG5cbnZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FudmFzJyk7XG5hcHAub24oJ2JlZm9yZVRpY2snLCBmdW5jdGlvbigpIHtcbiAgaWYgKGNhbnZhcy53aWR0aCAhPT0gd2luZG93LmlubmVyV2lkdGgpIHtcbiAgICBjYW52YXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgfVxuICBpZiAoY2FudmFzLmhlaWdodCAhPT0gd2luZG93LmlubmVySGVpZ2h0KSB7XG4gICAgY2FudmFzLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgfVxufSk7IiwidmFyIHBhcnNlQXJncyA9IHJlcXVpcmUoJ21pbmltaXN0Jyk7XG52YXIga2V5Y29kZSA9IHJlcXVpcmUoJ2tleWNvZGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRzKSB7XG4gIG9wdHMgPSBvcHRzIHx8IHt9O1xuICB2YXIgb25mb2N1cyA9IG9wdHMub25mb2N1cyB8fCBudWxsO1xuICB2YXIgb25ibHVyID0gb3B0cy5vbmJsdXIgfHwgbnVsbDtcbiAgdmFyIGNvbW1hbmRzID0gb3B0cy5jb21tYW5kcyB8fCB7fTtcblxuICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZGl2KTtcbiAgZGl2LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgZGl2LnN0eWxlLmxlZnQgPSAnMHB4JztcbiAgZGl2LnN0eWxlLnRvcCA9ICcwcHgnO1xuICBkaXYuc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gIGRpdi5zdHlsZS5oZWlnaHQgPSAnMTIwcHgnO1xuICBkaXYuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3JnYmEoMCwgMCwgMCwgMC41KSc7XG5cbiAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgaW5wdXQudHlwZSA9ICd0ZXh0JztcbiAgaW5wdXQuY2xhc3NOYW1lID0gJ2NvbnNvbGUtaW5wdXQnO1xuICBpbnB1dC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIGlucHV0LnN0eWxlLmxlZnQgPSAnMHB4JztcbiAgaW5wdXQuc3R5bGUudG9wID0gJzBweCc7XG4gIGlucHV0LnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICBpbnB1dC5zdHlsZS5oZWlnaHQgPSAnMjBweCc7XG4gIGlucHV0LnN0eWxlWydiYWNrZ3JvdW5kLWNvbG9yJ10gPSAndHJhbnNwYXJlbnQnO1xuICBpbnB1dC5zdHlsZVsnYm9yZGVyJ10gPSAnMHB4IHNvbGlkJztcbiAgaW5wdXQuc3BlbGxjaGVjayA9IGZhbHNlO1xuICBpbnB1dC5zdHlsZS5jb2xvciA9ICcjRkZGRkZGJztcbiAgaW5wdXQuc3R5bGUuZm9udFNpemUgPSAnMTZweCc7XG4gIGlucHV0LnN0eWxlLnBhZGRpbmcgPSAnMnB4IDJweCAwcHggMnB4JztcbiAgaW5wdXQudmFsdWUgPSAnPiAnO1xuXG4gIGRpdi5hcHBlbmRDaGlsZChpbnB1dCk7XG5cbiAgdmFyIHRleHRTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICB0ZXh0U3Bhbi5jbGFzc05hbWUgPSAnY29uc29sZS1zcGFuJztcbiAgdGV4dFNwYW4uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICB0ZXh0U3Bhbi5zdHlsZS5sZWZ0ID0gJzBweCc7XG4gIHRleHRTcGFuLnN0eWxlLnRvcCA9ICcyMHB4JztcbiAgdGV4dFNwYW4uc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gIHRleHRTcGFuLnN0eWxlLmhlaWdodCA9ICcxMDBweCc7XG4gIHRleHRTcGFuLnN0eWxlLmNvbG9yID0gJyNGRkZGRkYnO1xuICB0ZXh0U3Bhbi5zdHlsZS5mb250U2l6ZSA9ICcxNnB4JztcbiAgdGV4dFNwYW4uc3R5bGUucGFkZGluZyA9ICcwcHggMnB4IDJweCAycHgnO1xuXG4gIGRpdi5hcHBlbmRDaGlsZCh0ZXh0U3Bhbik7XG5cbiAgLy8gUmVtb3ZlIG91dGxpbmUgb24gZm9jdXNcbiAgaW5wdXQub25mb2N1cyA9IGZ1bmN0aW9uKCkge1xuICAgIGlucHV0LnN0eWxlWydvdXRsaW5lJ10gPSAnbm9uZSc7XG4gIH07XG5cbiAgaW5wdXQub25rZXlwcmVzcyA9IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgb25FbnRlclByZXNzZWQoKTtcbiAgICB9XG4gICAgb25JbnB1dENoYW5nZWQoZSk7XG4gIH07XG5cbiAgaW5wdXQub25rZXl1cCA9IGZ1bmN0aW9uKGUpIHtcbiAgICBvbklucHV0Q2hhbmdlZChlKTtcbiAgfTtcblxuICBmdW5jdGlvbiBvbklucHV0Q2hhbmdlZChlKSB7XG4gICAgaWYgKGlucHV0LnZhbHVlLmxlbmd0aCA8IDIpIHtcbiAgICAgIGlucHV0LnZhbHVlID0gJz4gJztcbiAgICB9XG4gIH07XG5cbiAgdmFyIGxpbmVzID0gW107XG4gIHZhciBoaXN0b3J5TGVuZ3RoID0gMTAwO1xuICB2YXIgbnVtYmVyT2ZMaW5lcyA9IDU7XG5cbiAgZnVuY3Rpb24gb25FbnRlclByZXNzZWQoKSB7XG4gICAgdmFyIGxpbmUgPSBpbnB1dC52YWx1ZTtcbiAgICBhZGRMb2cobGluZSk7XG4gICAgbGluZSA9IGxpbmUuc3Vic3RyaW5nKDIpO1xuICAgIGxpbmUgPSBsaW5lLnRyaW0oKTtcbiAgICB2YXIgaW5kZXggPSBsaW5lLmluZGV4T2YoJyAnKTtcbiAgICB2YXIgY29tbWFuZE5hbWUgPSBpbmRleCA9PT0gLTEgPyBsaW5lIDogbGluZS5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuICAgIHZhciBhcmdzID0gaW5kZXggPT09IC0xID8gJycgOiBsaW5lLnN1YnN0cmluZyhpbmRleCArIDEpO1xuXG4gICAgdmFyIGNvbW1hbmQgPSBjb21tYW5kc1tjb21tYW5kTmFtZV07XG4gICAgaWYgKGNvbW1hbmQgPT0gbnVsbCkge1xuICAgICAgYWRkRXJyb3IoY29tbWFuZE5hbWUgKyAnOiBjb21tYW5kIG5vdCBmb3VuZCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0cnkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gY29tbWFuZChwYXJzZUFyZ3MoYXJncy5zcGxpdCgnICcpKSk7XG4gICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIGFkZExvZyhyZXN1bHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaGlkZSgpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGFkZEVycm9yKGVycik7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpbnB1dC52YWx1ZSA9ICcnO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGFkZExvZyhsaW5lKSB7XG4gICAgYWRkTGluZShsaW5lKTtcbiAgfTtcblxuICBmdW5jdGlvbiBhZGRFcnJvcihsaW5lKSB7XG4gICAgYWRkTGluZShsaW5lKTtcbiAgfTtcblxuICBmdW5jdGlvbiBhZGRMaW5lKGxpbmUpIHtcbiAgICBsaW5lcy5wdXNoKGxpbmUpO1xuICAgIGlmIChsaW5lcy5sZW5ndGggPiBoaXN0b3J5TGVuZ3RoKSB7XG4gICAgICBsaW5lcy5wb3AoKTtcbiAgICB9XG4gICAgdXBkYXRlTGluZXMoKTtcbiAgfTtcblxuICBmdW5jdGlvbiB1cGRhdGVMaW5lcygpIHtcbiAgICB2YXIgdGV4dCA9ICcnO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtYmVyT2ZMaW5lczsgaSsrKSB7XG4gICAgICB2YXIgbGluZSA9IGxpbmVzW2xpbmVzLmxlbmd0aCAtIDEgLSBpXTtcbiAgICAgIGxpbmUgPSBsaW5lIHx8ICcnO1xuICAgICAgdGV4dCArPSBsaW5lO1xuICAgICAgdGV4dCArPSBcIjxiciAvPlwiO1xuICAgIH1cblxuICAgIHRleHRTcGFuLmlubmVySFRNTCA9IHRleHQ7XG4gIH07XG5cbiAgZnVuY3Rpb24gaGlkZSgpIHtcbiAgICBkaXYuaGlkZGVuID0gdHJ1ZTtcbiAgICBpbnB1dC5ibHVyKCk7XG4gICAgaWYgKG9uYmx1ciAhPSBudWxsKSB7XG4gICAgICBvbmJsdXIoKTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gc2hvdygpIHtcbiAgICBkaXYuaGlkZGVuID0gZmFsc2U7XG4gICAgaW5wdXQudmFsdWUgPSBpbnB1dC52YWx1ZS5zcGxpdCgnYCcpLmpvaW4oJycpO1xuICAgIGlucHV0LmZvY3VzKCk7XG4gICAgaWYgKG9uZm9jdXMgIT0gbnVsbCkge1xuICAgICAgb25mb2N1cygpO1xuICAgIH1cbiAgfTtcblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBmdW5jdGlvbihlKSB7XG4gICAgdmFyIGtleSA9IGtleWNvZGUoZSk7XG4gICAgaWYgKGtleSA9PT0gJ2AnKSB7XG4gICAgICBpZiAoZGl2LmhpZGRlbikge1xuICAgICAgICBzaG93KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBoaWRlKCk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICAvLyBIaWRkZW4gYnkgZGVmYXVsdFxuICBkaXYuaGlkZGVuID0gdHJ1ZTtcblxuICBmdW5jdGlvbiBsb2FkQ29tbWFuZHModmFsdWUpIHtcbiAgICBmb3IgKHZhciBpIGluIHZhbHVlKSB7XG4gICAgICBjb21tYW5kc1tpXSA9IHZhbHVlW2ldO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4ge1xuICAgIGNvbW1hbmRzOiBjb21tYW5kcyxcbiAgICBsb2FkQ29tbWFuZHM6IGxvYWRDb21tYW5kc1xuICB9O1xufTsiLCJ2YXIgVEhSRUUgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snVEhSRUUnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ1RIUkVFJ10gOiBudWxsKTtcblxudmFyIHRleHR1cmVMb2FkZXIgPSBuZXcgVEhSRUUuVGV4dHVyZUxvYWRlcigpO1xuXG5mdW5jdGlvbiBsb2FkTGFtYmVydE1hdGVyaWFsKHNvdXJjZSkge1xuICB2YXIgdGV4dHVyZSA9IHRleHR1cmVMb2FkZXIubG9hZChzb3VyY2UpO1xuICB0ZXh0dXJlLndyYXBTID0gVEhSRUUuUmVwZWF0V3JhcHBpbmc7XG4gIHRleHR1cmUud3JhcFQgPSBUSFJFRS5SZXBlYXRXcmFwcGluZztcblxuICByZXR1cm4gbmV3IFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwoe1xuICAgIG1hcDogdGV4dHVyZVxuICB9KTtcbn07XG5cbmZ1bmN0aW9uIGxvYWRCYXNpY01hdGVyaWFsKHNvdXJjZSkge1xuICB2YXIgdGV4dHVyZSA9IHRleHR1cmVMb2FkZXIubG9hZChzb3VyY2UpO1xuICB0ZXh0dXJlLndyYXBTID0gVEhSRUUuUmVwZWF0V3JhcHBpbmc7XG4gIHRleHR1cmUud3JhcFQgPSBUSFJFRS5SZXBlYXRXcmFwcGluZztcblxuICB0ZXh0dXJlLm1hZ0ZpbHRlciA9IFRIUkVFLk5lYXJlc3RGaWx0ZXI7XG4gIFxuICByZXR1cm4gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICBtYXA6IHRleHR1cmVcbiAgfSk7XG59O1xuXG5tYXRlcmlhbHMgPSB7XG4gICdwbGFjZWhvbGRlcic6IGxvYWRCYXNpY01hdGVyaWFsKCdpbWFnZXMvcGxhY2Vob2xkZXIucG5nJylcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBtYXRlcmlhbHM7IiwidmFyIFByZWZhYlNlcnZpY2UgPSBmdW5jdGlvbigpIHt9O1xuXG5QcmVmYWJTZXJ2aWNlLnByb3RvdHlwZS5sb2FkID0gZnVuY3Rpb24oKSB7XG4gIHRyeSB7XG4gICAgdmFyIHNhdmVzID0gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2Jfc2F2ZXMnKSB8fCBbXSk7XG4gICAgcmV0dXJuIHNhdmVzO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gW107XG4gIH1cbn07XG5cblByZWZhYlNlcnZpY2UucHJvdG90eXBlLnNhdmUgPSBmdW5jdGlvbihkYXRhKSB7XG4gIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYl9zYXZlcycsIEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbn07XG5cblByZWZhYlNlcnZpY2UucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYl9zYXZlcycsICcnKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgUHJlZmFiU2VydmljZSgpO1xufTsiLCJ2YXIgU3RhdHMgPSByZXF1aXJlKCdzdGF0cy5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFwcCkge1xuICBhcHAub24oJ2JlZm9yZVRpY2snLCBmdW5jdGlvbigpIHtcbiAgICBzdGF0cy5iZWdpbigpO1xuICB9KTtcblxuICBhcHAub24oJ2FmdGVyVGljaycsIGZ1bmN0aW9uKCkge1xuICAgIHN0YXRzLmVuZCgpO1xuICB9KTtcblxuICB2YXIgc3RhdHMgPSBuZXcgU3RhdHMoKTtcbiAgc3RhdHMuZG9tRWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIHN0YXRzLmRvbUVsZW1lbnQuc3R5bGUucmlnaHQgPSAnMHB4JztcbiAgc3RhdHMuZG9tRWxlbWVudC5zdHlsZS5ib3R0b20gPSAnNTBweCc7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc3RhdHMuZG9tRWxlbWVudCk7XG5cbiAgcmV0dXJuIHN0YXRzLmRvbUVsZW1lbnQ7XG59OyIsInZhciBhcnJheVV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMvYXJyYXl1dGlscycpO1xudmFyIGtleWNvZGUgPSByZXF1aXJlKCdrZXljb2RlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICB2YXIgbW91c2UgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICB2YXIgbW91c2Vkb3ducyA9IFtdO1xuICB2YXIgbW91c2V1cHMgPSBbXTtcbiAgdmFyIG1vdXNlbW92ZSA9IGZhbHNlO1xuICB2YXIgbW91c2Vob2xkcyA9IFtdO1xuICB2YXIga2V5ZG93bnMgPSBbXTtcbiAgdmFyIGtleXVwcyA9IFtdO1xuICB2YXIga2V5aG9sZHMgPSBbXTtcbiAgdmFyIG1vdXNlZG93blRpbWVzID0ge307XG4gIHZhciBjbGlja1RpbWUgPSAxNTA7XG4gIHZhciBtb3VzZWNsaWNrcyA9IFtdO1xuXG4gIGVsZW1lbnQuZm9jdXMoKTtcblxuICBmdW5jdGlvbiBvbk1vdXNlTW92ZShlKSB7XG4gICAgbW91c2Vtb3ZlID0gdHJ1ZTtcbiAgICBtb3VzZS54ID0gZS5jbGllbnRYO1xuICAgIG1vdXNlLnkgPSBlLmNsaWVudFk7XG4gIH07XG5cbiAgZnVuY3Rpb24gb25Nb3VzZURvd24oZSkge1xuICAgIG1vdXNlZG93bnMucHVzaChlLmJ1dHRvbik7XG4gICAgbW91c2Vkb3duVGltZXNbZS5idXR0b25dID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgaWYgKCFhcnJheVV0aWxzLmluY2x1ZGVzKG1vdXNlaG9sZHMsIGUuYnV0dG9uKSkge1xuICAgICAgbW91c2Vob2xkcy5wdXNoKGUuYnV0dG9uKTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gb25Nb3VzZVVwKGUpIHtcbiAgICBpZiAoISFtb3VzZWRvd25UaW1lc1tlLmJ1dHRvbl0pIHtcbiAgICAgIHZhciBkaWZmID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBtb3VzZWRvd25UaW1lc1tlLmJ1dHRvbl07XG4gICAgICBpZiAoZGlmZiA8IGNsaWNrVGltZSkge1xuICAgICAgICBtb3VzZWNsaWNrcy5wdXNoKGUuYnV0dG9uKTtcbiAgICAgIH1cbiAgICB9XG4gICAgbW91c2V1cHMucHVzaChlLmJ1dHRvbik7XG4gICAgYXJyYXlVdGlscy5yZW1vdmUobW91c2Vob2xkcywgZS5idXR0b24pO1xuICB9O1xuXG4gIGZ1bmN0aW9uIG9uS2V5RG93bihlKSB7XG4gICAgdmFyIGtleSA9IGtleWNvZGUoZSk7XG4gICAga2V5ZG93bnMucHVzaChrZXkpO1xuICAgIGlmICghYXJyYXlVdGlscy5pbmNsdWRlcyhrZXlob2xkcywga2V5KSkge1xuICAgICAga2V5aG9sZHMucHVzaChrZXkpO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBvbktleVVwKGUpIHtcbiAgICB2YXIga2V5ID0ga2V5Y29kZShlKTtcbiAgICBrZXl1cHMucHVzaChrZXkpO1xuICAgIGFycmF5VXRpbHMucmVtb3ZlKGtleWhvbGRzLCBrZXkpO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIG1vdXNlZG93bnMgPSBbXTtcbiAgICBtb3VzZXVwcyA9IFtdO1xuICAgIG1vdXNlbW92ZSA9IGZhbHNlO1xuICAgIGtleWRvd25zID0gW107XG4gICAga2V5dXBzID0gW107XG4gICAgbW91c2VjbGlja3MgPSBbXTtcbiAgfVxuXG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgb25Nb3VzZURvd24pO1xuICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlKTtcbiAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgb25Nb3VzZVVwKTtcbiAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25LZXlEb3duKTtcbiAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIG9uS2V5VXApO1xuXG4gIHJldHVybiB7XG4gICAgbW91c2U6IG1vdXNlLFxuXG4gICAgbW91c2VEb3duOiBmdW5jdGlvbihidXR0b24pIHtcbiAgICAgIGlmIChidXR0b24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gbW91c2Vkb3ducy5sZW5ndGggPiAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFycmF5VXRpbHMuaW5jbHVkZXMobW91c2Vkb3ducywgYnV0dG9uKTtcbiAgICB9LFxuXG4gICAgbW91c2VVcDogZnVuY3Rpb24oYnV0dG9uKSB7XG4gICAgICBpZiAoYnV0dG9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIG1vdXNldXBzLmxlbmd0aCA+IDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gYXJyYXlVdGlscy5pbmNsdWRlcyhtb3VzZXVwcywgYnV0dG9uKTtcbiAgICB9LFxuXG4gICAgbW91c2VIb2xkOiBmdW5jdGlvbihidXR0b24pIHtcbiAgICAgIGlmIChidXR0b24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gbW91c2Vob2xkcy5sZW5ndGggPiAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFycmF5VXRpbHMuaW5jbHVkZXMobW91c2Vob2xkcywgYnV0dG9uKTtcbiAgICB9LFxuXG4gICAgbW91c2VDbGljazogZnVuY3Rpb24oYnV0dG9uKSB7XG4gICAgICBpZiAoYnV0dG9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIG1vdXNlY2xpY2tzLmxlbmd0aCA+IDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gYXJyYXlVdGlscy5pbmNsdWRlcyhtb3VzZWNsaWNrcywgYnV0dG9uKTtcbiAgICB9LFxuXG4gICAga2V5RG93bjogZnVuY3Rpb24oa2V5KSB7XG4gICAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGtleWRvd25zLmxlbmd0aCA+IDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gYXJyYXlVdGlscy5pbmNsdWRlcyhrZXlkb3ducywga2V5KTtcbiAgICB9LFxuXG4gICAga2V5VXA6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBrZXl1cHMubGVuZ3RoID4gMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcnJheVV0aWxzLmluY2x1ZGVzKGtleXVwcywga2V5KTtcbiAgICB9LFxuXG4gICAga2V5SG9sZDogZnVuY3Rpb24oa2V5KSB7XG4gICAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGtleWhvbGRzLmxlbmd0aCA+IDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gYXJyYXlVdGlscy5pbmNsdWRlcyhrZXlob2xkcywga2V5KTtcbiAgICB9LFxuXG4gICAgbW91c2VNb3ZlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBtb3VzZW1vdmU7XG4gICAgfSxcblxuICAgIGxhdGVUaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgIGNsZWFyKCk7XG4gICAgfSxcblxuICAgIHNjcmVlblRvVmlld3BvcnQ6IGZ1bmN0aW9uKHNjcmVlbikge1xuICAgICAgdmFyIHZpZXdwb3J0ID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcbiAgICAgIHZpZXdwb3J0LnggPSAoc2NyZWVuLnggLyB3aW5kb3cuaW5uZXJXaWR0aCkgKiAyIC0gMTtcbiAgICAgIHZpZXdwb3J0LnkgPSAtKHNjcmVlbi55IC8gd2luZG93LmlubmVySGVpZ2h0KSAqIDIgKyAxO1xuICAgICAgcmV0dXJuIHZpZXdwb3J0O1xuICAgIH1cbiAgfTtcbn07IiwidmFyIFN0YXRzID0gcmVxdWlyZSgnc3RhdHMuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzY2VuZSwgY2FtZXJhLCBjb250YWluZXIpIHtcbiAgdmFyIHJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoKTtcbiAgcmVuZGVyZXIuc2V0Q2xlYXJDb2xvcigweDIyMjIyMik7XG4gIHJlbmRlcmVyLnNldFNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG5cbiAgY29udGFpbmVyID0gY29udGFpbmVyIHx8IGRvY3VtZW50LmJvZHk7XG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChyZW5kZXJlci5kb21FbGVtZW50KTtcblxuICB2YXIgcmVuZGVyZXIsIGNhbWVyYTtcbiAgdmFyIHNzYW9QYXNzLCBlZmZlY3RDb21wb3NlcjtcblxuICB2YXIgc3lzdGVtID0ge307XG4gIHN5c3RlbS5yZW5kZXJlciA9IHJlbmRlcmVyO1xuXG4gIHZhciBzdGF0cyA9IG5ldyBTdGF0cygpO1xuICBzdGF0cy5kb21FbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgc3RhdHMuZG9tRWxlbWVudC5zdHlsZS5yaWdodCA9ICcwcHgnO1xuICBzdGF0cy5kb21FbGVtZW50LnN0eWxlLmJvdHRvbSA9ICcwcHgnO1xuXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc3RhdHMuZG9tRWxlbWVudCk7XG5cbiAgdmFyIHNzYW8gPSB0cnVlO1xuXG4gIHZhciBhbWJpZW50ID0gbmV3IFRIUkVFLkFtYmllbnRMaWdodChuZXcgVEhSRUUuQ29sb3IoXCJyZ2IoNjAlLCA2MCUsIDYwJSlcIikpO1xuICB2YXIgbGlnaHQgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCgweGZmZmZmZiwgMC42KTtcbiAgbGlnaHQucG9zaXRpb24uc2V0KDAuOCwgMSwgMC41KTtcbiAgc2NlbmUuYWRkKGxpZ2h0KTtcbiAgc2NlbmUuYWRkKGFtYmllbnQpO1xuXG4gIGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVyKTtcblxuICAgIHN0YXRzLmJlZ2luKCk7XG5cbiAgICBpZiAoc3Nhbykge1xuICAgICAgLy8gUmVuZGVyIGRlcHRoIGludG8gZGVwdGhSZW5kZXJUYXJnZXRcbiAgICAgIHNjZW5lLm92ZXJyaWRlTWF0ZXJpYWwgPSBkZXB0aE1hdGVyaWFsO1xuICAgICAgcmVuZGVyZXIucmVuZGVyKHNjZW5lLCBjYW1lcmEsIGRlcHRoUmVuZGVyVGFyZ2V0LCB0cnVlKTtcblxuICAgICAgLy8gUmVuZGVyIHJlbmRlclBhc3MgYW5kIFNTQU8gc2hhZGVyUGFzc1xuICAgICAgc2NlbmUub3ZlcnJpZGVNYXRlcmlhbCA9IG51bGw7XG4gICAgICBlZmZlY3RDb21wb3Nlci5yZW5kZXIoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVuZGVyZXIucmVuZGVyKHNjZW5lLCBjYW1lcmEpO1xuICAgIH1cblxuXG4gICAgc3RhdHMuZW5kKCk7XG4gIH07XG5cbiAgZnVuY3Rpb24gb25XaW5kb3dSZXNpemUoKSB7XG4gICAgdmFyIHdpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgdmFyIGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcblxuICAgIGNhbWVyYS5hc3BlY3QgPSB3aWR0aCAvIGhlaWdodDtcbiAgICBjYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xuICAgIHJlbmRlcmVyLnNldFNpemUod2lkdGgsIGhlaWdodCk7XG5cbiAgICAvLyBSZXNpemUgcmVuZGVyVGFyZ2V0c1xuICAgIHNzYW9QYXNzLnVuaWZvcm1zWydzaXplJ10udmFsdWUuc2V0KHdpZHRoLCBoZWlnaHQpO1xuXG4gICAgdmFyIHBpeGVsUmF0aW8gPSByZW5kZXJlci5nZXRQaXhlbFJhdGlvKCk7XG4gICAgdmFyIG5ld1dpZHRoID0gTWF0aC5mbG9vcih3aWR0aCAvIHBpeGVsUmF0aW8pIHx8IDE7XG4gICAgdmFyIG5ld0hlaWdodCA9IE1hdGguZmxvb3IoaGVpZ2h0IC8gcGl4ZWxSYXRpbykgfHwgMTtcbiAgICBkZXB0aFJlbmRlclRhcmdldC5zZXRTaXplKG5ld1dpZHRoLCBuZXdIZWlnaHQpO1xuICAgIGVmZmVjdENvbXBvc2VyLnNldFNpemUobmV3V2lkdGgsIG5ld0hlaWdodCk7XG4gIH1cblxuICBmdW5jdGlvbiBpbml0UG9zdHByb2Nlc3NpbmcoKSB7XG5cbiAgICAvLyBTZXR1cCByZW5kZXIgcGFzc1xuICAgIHZhciByZW5kZXJQYXNzID0gbmV3IFRIUkVFLlJlbmRlclBhc3Moc2NlbmUsIGNhbWVyYSk7XG5cbiAgICAvLyBTZXR1cCBkZXB0aCBwYXNzXG4gICAgdmFyIGRlcHRoU2hhZGVyID0gVEhSRUUuU2hhZGVyTGliW1wiZGVwdGhSR0JBXCJdO1xuICAgIHZhciBkZXB0aFVuaWZvcm1zID0gVEhSRUUuVW5pZm9ybXNVdGlscy5jbG9uZShkZXB0aFNoYWRlci51bmlmb3Jtcyk7XG5cbiAgICBkZXB0aE1hdGVyaWFsID0gbmV3IFRIUkVFLlNoYWRlck1hdGVyaWFsKHtcbiAgICAgIGZyYWdtZW50U2hhZGVyOiBkZXB0aFNoYWRlci5mcmFnbWVudFNoYWRlcixcbiAgICAgIHZlcnRleFNoYWRlcjogZGVwdGhTaGFkZXIudmVydGV4U2hhZGVyLFxuICAgICAgdW5pZm9ybXM6IGRlcHRoVW5pZm9ybXMsXG4gICAgICBibGVuZGluZzogVEhSRUUuTm9CbGVuZGluZ1xuICAgIH0pO1xuXG4gICAgdmFyIHBhcnMgPSB7XG4gICAgICBtaW5GaWx0ZXI6IFRIUkVFLkxpbmVhckZpbHRlcixcbiAgICAgIG1hZ0ZpbHRlcjogVEhSRUUuTGluZWFyRmlsdGVyXG4gICAgfTtcbiAgICBkZXB0aFJlbmRlclRhcmdldCA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlclRhcmdldCh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0LCBwYXJzKTtcblxuICAgIC8vIFNldHVwIFNTQU8gcGFzc1xuICAgIHNzYW9QYXNzID0gbmV3IFRIUkVFLlNoYWRlclBhc3MoVEhSRUUuU1NBT1NoYWRlcik7XG4gICAgc3Nhb1Bhc3MucmVuZGVyVG9TY3JlZW4gPSB0cnVlO1xuICAgIC8vc3Nhb1Bhc3MudW5pZm9ybXNbIFwidERpZmZ1c2VcIiBdLnZhbHVlIHdpbGwgYmUgc2V0IGJ5IFNoYWRlclBhc3NcbiAgICBzc2FvUGFzcy51bmlmb3Jtc1tcInREZXB0aFwiXS52YWx1ZSA9IGRlcHRoUmVuZGVyVGFyZ2V0O1xuICAgIHNzYW9QYXNzLnVuaWZvcm1zWydzaXplJ10udmFsdWUuc2V0KHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpO1xuICAgIHNzYW9QYXNzLnVuaWZvcm1zWydjYW1lcmFOZWFyJ10udmFsdWUgPSBjYW1lcmEubmVhcjtcbiAgICBzc2FvUGFzcy51bmlmb3Jtc1snY2FtZXJhRmFyJ10udmFsdWUgPSBjYW1lcmEuZmFyO1xuICAgIHNzYW9QYXNzLnVuaWZvcm1zWydvbmx5QU8nXS52YWx1ZSA9IGZhbHNlO1xuICAgIHNzYW9QYXNzLnVuaWZvcm1zWydhb0NsYW1wJ10udmFsdWUgPSAxO1xuICAgIHNzYW9QYXNzLnVuaWZvcm1zWydsdW1JbmZsdWVuY2UnXS52YWx1ZSA9IDAuNTtcblxuICAgIC8vIEFkZCBwYXNzIHRvIGVmZmVjdCBjb21wb3NlclxuICAgIGVmZmVjdENvbXBvc2VyID0gbmV3IFRIUkVFLkVmZmVjdENvbXBvc2VyKHJlbmRlcmVyKTtcbiAgICBlZmZlY3RDb21wb3Nlci5hZGRQYXNzKHJlbmRlclBhc3MpO1xuICAgIGVmZmVjdENvbXBvc2VyLmFkZFBhc3Moc3Nhb1Bhc3MpO1xuICB9XG5cbiAgLy8gU2V0IHVwIHJlbmRlciBsb29wXG4gIGluaXRQb3N0cHJvY2Vzc2luZygpO1xuICByZW5kZXIoKTtcblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgb25XaW5kb3dSZXNpemUsIGZhbHNlKTtcblxuICByZXR1cm4gc3lzdGVtO1xufTsiLCJ2YXIgYXJyYXkgPSB7XG4gIGluZGV4T2Y6IGZ1bmN0aW9uKGFycmF5LCBlbGVtZW50KSB7XG4gICAgdmFyIHByZWRpY2F0ZSA9IHR5cGVvZiBlbGVtZW50ID09PSAnZnVuY3Rpb24nID8gZWxlbWVudCA6IGZ1bmN0aW9uKHYpIHtcbiAgICAgIHJldHVybiB2ID09PSBlbGVtZW50O1xuICAgIH07XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocHJlZGljYXRlKGFycmF5W2ldKSkge1xuICAgICAgICByZXR1cm4gaTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xO1xuICB9LFxuXG4gIGluY2x1ZGVzOiBmdW5jdGlvbihhcnJheSwgZWxlbWVudCkge1xuICAgIHJldHVybiB0aGlzLmluZGV4T2YoYXJyYXksIGVsZW1lbnQpICE9PSAtMTtcbiAgfSxcblxuICByZW1vdmU6IGZ1bmN0aW9uKGFycmF5LCBlbGVtZW50KSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5pbmRleE9mKGFycmF5LCBlbGVtZW50KTtcbiAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICBhcnJheS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfSxcblxuICBjbG9uZTogZnVuY3Rpb24oYXJyYXkpIHtcbiAgICB2YXIgY29weSA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvcHlbaV0gPSBhcnJheVtpXTtcbiAgICB9XG4gICAgcmV0dXJuIGNvcHk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYXJyYXk7IiwidmFyIEdyYXZpdHkgPSBmdW5jdGlvbihkaXIsIGF4aXMsIHBvc2l0aXZlKSB7XG4gIHRoaXMuZGlyID0gZGlyIHx8IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gIHRoaXMuYXhpcyA9IGF4aXMgfHwgJyc7XG4gIHRoaXMucG9zaXRpdmUgPSBwb3NpdGl2ZSB8fCAnJztcblxuICB0aGlzLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBHcmF2aXR5KHRoaXMuZGlyLCB0aGlzLmF4aXMsIHRoaXMucG9zaXRpdmUpO1xuICB9O1xuXG4gIHRoaXMuZXF1YWxzID0gZnVuY3Rpb24oZ3Jhdml0eSkge1xuICAgIHJldHVybiB0aGlzLmRpci5lcXVhbHMoZ3Jhdml0eS5kaXIpO1xuICB9O1xuXG4gIHRoaXMuaXNOb25lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlyLmxlbmd0aCgpID09PSAwO1xuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBHcmF2aXR5OyIsInZhciBHcmF2aXR5ID0gcmVxdWlyZSgnLi9ncmF2aXR5Jyk7XG5cbnZhciBncmF2aXRpZXMgPSB7XG4gIG5vbmU6IG5ldyBHcmF2aXR5KCksXG4gIHJpZ2h0OiBuZXcgR3Jhdml0eShuZXcgVEhSRUUuVmVjdG9yMygxLCAwLCAwKS5ub3JtYWxpemUoKSwgJ3gnLCB0cnVlKSxcbiAgbGVmdDogbmV3IEdyYXZpdHkobmV3IFRIUkVFLlZlY3RvcjMoLTEsIDAsIDApLm5vcm1hbGl6ZSgpLCAneCcsIGZhbHNlKSxcbiAgdG9wOiBuZXcgR3Jhdml0eShuZXcgVEhSRUUuVmVjdG9yMygwLCAxLCAwKS5ub3JtYWxpemUoKSwgJ3knLCB0cnVlKSxcbiAgYm90dG9tOiBuZXcgR3Jhdml0eShuZXcgVEhSRUUuVmVjdG9yMygwLCAtMSwgMCkubm9ybWFsaXplKCksICd5JywgZmFsc2UpLFxuICBmcm9udDogbmV3IEdyYXZpdHkobmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMSkubm9ybWFsaXplKCksICd6JywgdHJ1ZSksXG4gIGJhY2s6IG5ldyBHcmF2aXR5KG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKS5ub3JtYWxpemUoKSwgJ3onLCBmYWxzZSlcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBnZXRHcmF2aXR5OiBmdW5jdGlvbihwb3NpdGlvbikge1xuICAgIHZhciBtaW4gPSAxO1xuICAgIHZhciBjbG9zZXN0ID0gbnVsbDtcbiAgICB2YXIgZm9yY2UgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIGZvciAodmFyIGlkIGluIGdyYXZpdGllcykge1xuICAgICAgdmFyIGdyYXZpdHkgPSBncmF2aXRpZXNbaWRdO1xuICAgICAgdmFyIGRvdCA9IGdyYXZpdHkuZGlyLmNsb25lKCkuZG90KHBvc2l0aW9uLmNsb25lKCkubm9ybWFsaXplKCkpO1xuICAgICAgaWYgKGRvdCA8IG1pbikge1xuICAgICAgICBtaW4gPSBkb3Q7XG4gICAgICAgIGNsb3Nlc3QgPSBncmF2aXR5O1xuICAgICAgfVxuXG4gICAgICBpZihkb3QgPCAtIDAuNSkge1xuICAgICAgICB2YXIgcmF0aW8gPSAtMC41IC0gZG90O1xuICAgICAgICBmb3JjZS5hZGQoZ3Jhdml0eS5kaXIuY2xvbmUoKS5tdWx0aXBseVNjYWxhcihyYXRpbykpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBncmF2aXR5ID0gY2xvc2VzdC5jbG9uZSgpO1xuICAgIGdyYXZpdHkuZm9yY2VEaXIgPSBmb3JjZS5ub3JtYWxpemUoKTtcbiAgICByZXR1cm4gZ3Jhdml0eTtcbiAgfVxufTsiLCJ2YXIgY29tcGlsZU1lc2hlciA9IHJlcXVpcmUoJ2dyZWVkeS1tZXNoZXInKTtcbnZhciBuZGFycmF5ID0gcmVxdWlyZSgnbmRhcnJheScpO1xuXG52YXIgbWVzaGVyID0gY29tcGlsZU1lc2hlcih7XG4gIGV4dHJhQXJnczogMSxcbiAgb3JkZXI6IFswLCAxXSxcbiAgYXBwZW5kOiBmdW5jdGlvbihsb194LCBsb195LCBoaV94LCBoaV95LCB2YWwsIHJlc3VsdCkge1xuICAgIHJlc3VsdC5wdXNoKFtcbiAgICAgIFtsb194LCBsb195XSxcbiAgICAgIFtoaV94LCBoaV95XVxuICAgIF0pXG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRhdGEsIGRpbSwgdm94ZWxTaWRlVGV4dHVyZUlkcykge1xuICB2b3hlbFNpZGVUZXh0dXJlSWRzID0gdm94ZWxTaWRlVGV4dHVyZUlkcyB8fCB7fTtcblxuICB2YXIgdmVydGljZXMgPSBbXTtcbiAgdmFyIHN1cmZhY2VzID0gW107XG5cbiAgdmFyIHUsIHYsIGRpbXNELCBkaW1zVSwgZGltc1YsIHRkMCwgdGQxLCBkdiwgZmxpcDtcblxuICAvLyBJbnRlcmF0ZSB0aHJvdWdoIGRpbWVuc2lvbnNcbiAgZm9yICh2YXIgZCA9IDA7IGQgPCAzOyBkKyspIHtcbiAgICB1ID0gKGQgKyAxKSAlIDM7XG4gICAgdiA9IChkICsgMikgJSAzO1xuICAgIGRpbXNEID0gZGltW2RdO1xuICAgIGRpbXNVID0gZGltW3VdO1xuICAgIGRpbXNWID0gZGltW3ZdO1xuICAgIHRkMCA9IGQgKiAyO1xuICAgIHRkMSA9IGQgKiAyICsgMTtcblxuICAgIC8vIEludGVyYXRlIHRocm91Z2ggU2xpY2VzXG4gICAgZmxpcCA9IGZhbHNlO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGltc0Q7IGkrKykge1xuICAgICAgcHJvY2Vzc1NsaWNlKGkpO1xuICAgIH1cblxuXG4gICAgLy8gSW50ZXJhdGUgdGhyb3VnaCBTbGljZXMgZnJvbSBvdGhlciBkaXJcbiAgICBmbGlwID0gdHJ1ZTtcbiAgICBmb3IgKHZhciBpID0gZGltc0QgLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgcHJvY2Vzc1NsaWNlKGkpO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBwcm9jZXNzU2xpY2UoaSkge1xuICAgIHZhciBzbGljZSA9IG5kYXJyYXkoW10sIFtkaW1zVSwgZGltc1ZdKTtcblxuICAgIHZhciBzMCA9IDA7XG4gICAgZHYgPSBmbGlwID8gaSA6IGkgKyAxO1xuXG4gICAgLy9JbnRlcmF0ZSB0aHJvdWdoIHV2XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBkaW1zVTsgaisrKSB7XG4gICAgICB2YXIgczEgPSAwO1xuICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBkaW1zVjsgaysrKSB7XG4gICAgICAgIHZhciBiID0gZ2V0Vm94ZWwoaSwgaiwgaywgZCk7XG4gICAgICAgIGlmICghYikge1xuICAgICAgICAgIHNsaWNlLnNldChqLCBrLCAwKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYjE7XG4gICAgICAgIGlmIChmbGlwKSB7XG4gICAgICAgICAgYjEgPSBpID09PSAwID8gMCA6IGdldFZveGVsKGkgLSAxLCBqLCBrLCBkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBiMSA9IGkgPT09IGRpbXNEIC0gMSA/IDAgOiBnZXRWb3hlbChpICsgMSwgaiwgaywgZCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCEhYjEpIHtcbiAgICAgICAgICBzbGljZS5zZXQoaiwgaywgMCk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHQgPSBnZXRUZXh0dXJlSWQoYiwgZmxpcCA/IHRkMCA6IHRkMSk7XG4gICAgICAgIHNsaWNlLnNldChqLCBrLCB0KTtcbiAgICAgICAgczErKztcbiAgICAgIH1cbiAgICAgIHMwKys7XG4gICAgfVxuXG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgIG1lc2hlcihzbGljZSwgcmVzdWx0KTtcblxuICAgIGlmIChyZXN1bHQubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yICh2YXIgbCA9IDA7IGwgPCByZXN1bHQubGVuZ3RoOyBsKyspIHtcbiAgICAgIHZhciBmID0gcmVzdWx0W2xdO1xuICAgICAgdmFyIGxvID0gZlswXTtcbiAgICAgIHZhciBoaSA9IGZbMV07XG4gICAgICB2YXIgc2l6ZXUgPSBoaVswXSAtIGxvWzBdO1xuICAgICAgdmFyIHNpemV2ID0gaGlbMV0gLSBsb1sxXTtcblxuICAgICAgdmFyIGZ1dnMgPSBbXG4gICAgICAgIFswLCAwXSxcbiAgICAgICAgW3NpemV1LCAwXSxcbiAgICAgICAgW3NpemV1LCBzaXpldl0sXG4gICAgICAgIFswLCBzaXpldl1cbiAgICAgIF07XG5cbiAgICAgIHZhciBjID0gc2xpY2UuZ2V0KGxvWzBdLCBsb1sxXSk7XG5cbiAgICAgIHZhciB2MCA9IFtdO1xuICAgICAgdmFyIHYxID0gW107XG4gICAgICB2YXIgdjIgPSBbXTtcbiAgICAgIHZhciB2MyA9IFtdO1xuXG4gICAgICB2MFtkXSA9IGR2O1xuICAgICAgdjBbdV0gPSBsb1swXTtcbiAgICAgIHYwW3ZdID0gbG9bMV07XG5cbiAgICAgIHYxW2RdID0gZHY7XG4gICAgICB2MVt1XSA9IGhpWzBdO1xuICAgICAgdjFbdl0gPSBsb1sxXTtcblxuICAgICAgdjJbZF0gPSBkdjtcbiAgICAgIHYyW3VdID0gaGlbMF07XG4gICAgICB2Mlt2XSA9IGhpWzFdO1xuXG4gICAgICB2M1tkXSA9IGR2O1xuICAgICAgdjNbdV0gPSBsb1swXTtcbiAgICAgIHYzW3ZdID0gaGlbMV07XG5cbiAgICAgIHZhciB2aW5kZXggPSB2ZXJ0aWNlcy5sZW5ndGg7XG4gICAgICB2ZXJ0aWNlcy5wdXNoKHYwLCB2MSwgdjIsIHYzKTtcbiAgICAgIGlmIChmbGlwKSB7XG4gICAgICAgIHN1cmZhY2VzLnB1c2goe1xuICAgICAgICAgIGZhY2U6IFt2aW5kZXggKyAzLCB2aW5kZXggKyAyLCB2aW5kZXggKyAxLCB2aW5kZXgsIGNdLFxuICAgICAgICAgIHV2OiBbZnV2c1szXSwgZnV2c1syXSwgZnV2c1sxXSwgZnV2c1swXV1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdXJmYWNlcy5wdXNoKHtcbiAgICAgICAgICBmYWNlOiBbdmluZGV4LCB2aW5kZXggKyAxLCB2aW5kZXggKyAyLCB2aW5kZXggKyAzLCBjXSxcbiAgICAgICAgICB1djogW2Z1dnNbMF0sIGZ1dnNbMV0sIGZ1dnNbMl0sIGZ1dnNbM11dXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFZveGVsKGksIGosIGssIGQpIHtcbiAgICBpZiAoZCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGRhdGEoaSwgaiwgayk7XG4gICAgICAvLyByZXR1cm4gZGF0YVtrICsgKGogKyBpICogZGltWzBdKSAqIGRpbVsxXV07XG4gICAgfSBlbHNlIGlmIChkID09PSAxKSB7XG4gICAgICByZXR1cm4gZGF0YShrLCBpLCBqKTtcbiAgICAgIC8vIHJldHVybiBkYXRhW2ogKyAoaSArIGsgKiBkaW1bMF0pICogZGltWzFdXTtcbiAgICB9IGVsc2UgaWYgKGQgPT09IDIpIHtcbiAgICAgIHJldHVybiBkYXRhKGosIGssIGkpO1xuICAgICAgLy8gcmV0dXJuIGRhdGFbaSArIChrICsgaiAqIGRpbVswXSkgKiBkaW1bMV1dO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBnZXRUZXh0dXJlSWQoYiwgc2lkZSkge1xuICAgIGlmICghYikge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgdmFyIG1hcCA9IHZveGVsU2lkZVRleHR1cmVJZHNbYl07XG4gICAgaWYgKG1hcCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gYjtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhzaWRlKTtcbiAgICAvLyBjb25zb2xlLmxvZyhtYXBbc2lkZV0gfHwgYik7XG4gICAgcmV0dXJuIG1hcFtzaWRlXSB8fCBiO1xuICB9O1xuXG4gIHJldHVybiB7XG4gICAgdmVydGljZXM6IHZlcnRpY2VzLFxuICAgIHN1cmZhY2VzOiBzdXJmYWNlc1xuICB9XG59OyIsInZhciBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydUSFJFRSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnVEhSRUUnXSA6IG51bGwpO1xudmFyIGdyYXZpdHlVdGlscyA9IHJlcXVpcmUoJy4vZ3Jhdml0eXV0aWxzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuXG4gIHZhciBtYXAgPSB7fTtcbiAgdmFyIGNvZyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gIHZhciBncmF2aXR5QW1vdW50ID0gMC4wNTtcblxuICBmdW5jdGlvbiBvbkF0dGFjaChvYmplY3QsIGNvbXBvbmVudCkge1xuICAgIGlmKGNvbXBvbmVudC50eXBlID09PSAncmlnaWRCb2R5Jykge1xuICAgICAgbWFwW2NvbXBvbmVudC5faWRdID0gY29tcG9uZW50O1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBvbkRldHRhY2gob2JqZWN0LCBjb21wb25lbnQpIHtcbiAgICBpZihjb21wb25lbnQudHlwZSA9PT0gJ3JpZ2lkQm9keScpIHtcbiAgICAgIGRlbGV0ZSBtYXBbY29tcG9uZW50Ll9pZF07XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIHRpY2soKSB7XG4gICAgdmFyIGJvZGllcyA9IFtdO1xuICAgIHZhciBmaXh0dXJlcyA9IFtdO1xuICAgIGZvciAodmFyIGlkIGluIG1hcCkge1xuICAgICAgdmFyIGJvZHkgPSBtYXBbaWRdO1xuICAgICAgaWYgKGJvZHkuaXNGaXh0dXJlKSB7XG4gICAgICAgIGZpeHR1cmVzLnB1c2goYm9keSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBib2RpZXMucHVzaChib2R5KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJvZGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHJpZ2lkQm9keSA9IGJvZGllc1tpXTtcblxuICAgICAgLy8gQXBwbHkgZ3Jhdml0eVxuICAgICAgdmFyIGdyYXZpdHkgPSBncmF2aXR5VXRpbHMuZ2V0R3Jhdml0eShyaWdpZEJvZHkub2JqZWN0LnBvc2l0aW9uKTtcbiAgICAgIHJpZ2lkQm9keS5ncmF2aXR5ID0gZ3Jhdml0eTtcblxuICAgICAgaWYgKHJpZ2lkQm9keS5ncm91bmRlZCkge1xuICAgICAgICB2YXIgZ3Jhdml0eUZvcmNlID0gZ3Jhdml0eS5kaXIuY2xvbmUoKS5zZXRMZW5ndGgoZ3Jhdml0eUFtb3VudCk7XG4gICAgICAgIHJpZ2lkQm9keS5hcHBseUZvcmNlKGdyYXZpdHlGb3JjZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZ3Jhdml0eUZvcmNlID0gZ3Jhdml0eS5mb3JjZURpci5jbG9uZSgpLnNldExlbmd0aChncmF2aXR5QW1vdW50KTtcbiAgICAgICAgcmlnaWRCb2R5LmFwcGx5Rm9yY2UoZ3Jhdml0eUZvcmNlKTtcbiAgICAgIH1cblxuXG4gICAgICAvLyBBcHBseSBhY2NlbGVyYXRpb24gdG8gdmVsb2NpdHlcbiAgICAgIHJpZ2lkQm9keS52ZWxvY2l0eS5hZGQocmlnaWRCb2R5LmFjY2VsZXJhdGlvbik7XG4gICAgICByaWdpZEJvZHkudmVsb2NpdHkubXVsdGlwbHlTY2FsYXIocmlnaWRCb2R5LmZyaWN0aW9uKTtcblxuICAgICAgcmlnaWRCb2R5Lmdyb3VuZGVkID0gZmFsc2U7XG5cbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZml4dHVyZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgdmFyIGZpeHR1cmUgPSBmaXh0dXJlc1tqXTtcblxuICAgICAgICB2YXIgdmVsb2NpdGllcyA9IHtcbiAgICAgICAgICAneCc6IG5ldyBUSFJFRS5WZWN0b3IzKHJpZ2lkQm9keS52ZWxvY2l0eS54LCAwLCAwKSxcbiAgICAgICAgICAneSc6IG5ldyBUSFJFRS5WZWN0b3IzKDAsIHJpZ2lkQm9keS52ZWxvY2l0eS55LCAwKSxcbiAgICAgICAgICAneic6IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIHJpZ2lkQm9keS52ZWxvY2l0eS56KVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHBvc2l0aW9uID0gcmlnaWRCb2R5Lm9iamVjdC5wb3NpdGlvbi5jbG9uZSgpO1xuICAgICAgICBmb3IgKHZhciBheGlzIGluIHZlbG9jaXRpZXMpIHtcbiAgICAgICAgICB2YXIgdiA9IHZlbG9jaXRpZXNbYXhpc107XG4gICAgICAgICAgdmFyIHJheWNhc3RlciA9IG5ldyBUSFJFRS5SYXljYXN0ZXIoXG4gICAgICAgICAgICBwb3NpdGlvbixcbiAgICAgICAgICAgIHYuY2xvbmUoKS5ub3JtYWxpemUoKSxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICB2Lmxlbmd0aCgpICsgMC41XG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHZhciBpbnRlcnNlY3RzID0gcmF5Y2FzdGVyLmludGVyc2VjdE9iamVjdChmaXh0dXJlLm9iamVjdCwgdHJ1ZSk7XG4gICAgICAgICAgaWYgKGludGVyc2VjdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdmFyIGludGVyc2VjdCA9IGludGVyc2VjdHNbMF07XG4gICAgICAgICAgICB2YXIgbWFnID0gaW50ZXJzZWN0LmRpc3RhbmNlIC0gMC41O1xuICAgICAgICAgICAgcmlnaWRCb2R5LnZlbG9jaXR5W2F4aXNdID0gcmlnaWRCb2R5LnZlbG9jaXR5W2F4aXNdID4gMCA/IG1hZyA6IC1tYWc7XG4gICAgICAgICAgICBpZiAoYXhpcyA9PT0gZ3Jhdml0eS5heGlzKSB7XG4gICAgICAgICAgICAgIHJpZ2lkQm9keS5ncm91bmRlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcG9zaXRpb24uYWRkKHYpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEFwcGx5IHZlbG9jaXR5XG4gICAgICByaWdpZEJvZHkub2JqZWN0LnBvc2l0aW9uLmFkZChyaWdpZEJvZHkudmVsb2NpdHkpO1xuXG4gICAgICAvLyBDbGVhciBhY2NlbGVyYXRpb25cbiAgICAgIHJpZ2lkQm9keS5hY2NlbGVyYXRpb24uc2V0KDAsIDAsIDApO1xuICAgIH1cbiAgfTtcblxuICB2YXIgcGh5c2ljcyA9IHtcbiAgICBvbkF0dGFjaDogb25BdHRhY2gsXG4gICAgb25EZXR0YWNoOiBvbkRldHRhY2gsXG4gICAgdGljazogdGljayxcbiAgICBhcHA6IG51bGxcbiAgfTtcblxuICByZXR1cm4gcGh5c2ljcztcbn07IiwiLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8ZmVyb3NzQGZlcm9zcy5vcmc+IDxodHRwOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuXG52YXIgYmFzZTY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJylcbnZhciBpZWVlNzU0ID0gcmVxdWlyZSgnaWVlZTc1NCcpXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoJ2lzLWFycmF5JylcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IFNsb3dCdWZmZXJcbmV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMgPSA1MFxuQnVmZmVyLnBvb2xTaXplID0gODE5MiAvLyBub3QgdXNlZCBieSB0aGlzIGltcGxlbWVudGF0aW9uXG5cbnZhciByb290UGFyZW50ID0ge31cblxuLyoqXG4gKiBJZiBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgOlxuICogICA9PT0gdHJ1ZSAgICBVc2UgVWludDhBcnJheSBpbXBsZW1lbnRhdGlvbiAoZmFzdGVzdClcbiAqICAgPT09IGZhbHNlICAgVXNlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiAobW9zdCBjb21wYXRpYmxlLCBldmVuIElFNilcbiAqXG4gKiBCcm93c2VycyB0aGF0IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGFyZSBJRSAxMCssIEZpcmVmb3ggNCssIENocm9tZSA3KywgU2FmYXJpIDUuMSssXG4gKiBPcGVyYSAxMS42KywgaU9TIDQuMisuXG4gKlxuICogRHVlIHRvIHZhcmlvdXMgYnJvd3NlciBidWdzLCBzb21ldGltZXMgdGhlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiB3aWxsIGJlIHVzZWQgZXZlblxuICogd2hlbiB0aGUgYnJvd3NlciBzdXBwb3J0cyB0eXBlZCBhcnJheXMuXG4gKlxuICogTm90ZTpcbiAqXG4gKiAgIC0gRmlyZWZveCA0LTI5IGxhY2tzIHN1cHBvcnQgZm9yIGFkZGluZyBuZXcgcHJvcGVydGllcyB0byBgVWludDhBcnJheWAgaW5zdGFuY2VzLFxuICogICAgIFNlZTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4LlxuICpcbiAqICAgLSBTYWZhcmkgNS03IGxhY2tzIHN1cHBvcnQgZm9yIGNoYW5naW5nIHRoZSBgT2JqZWN0LnByb3RvdHlwZS5jb25zdHJ1Y3RvcmAgcHJvcGVydHlcbiAqICAgICBvbiBvYmplY3RzLlxuICpcbiAqICAgLSBDaHJvbWUgOS0xMCBpcyBtaXNzaW5nIHRoZSBgVHlwZWRBcnJheS5wcm90b3R5cGUuc3ViYXJyYXlgIGZ1bmN0aW9uLlxuICpcbiAqICAgLSBJRTEwIGhhcyBhIGJyb2tlbiBgVHlwZWRBcnJheS5wcm90b3R5cGUuc3ViYXJyYXlgIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgYXJyYXlzIG9mXG4gKiAgICAgaW5jb3JyZWN0IGxlbmd0aCBpbiBzb21lIHNpdHVhdGlvbnMuXG5cbiAqIFdlIGRldGVjdCB0aGVzZSBidWdneSBicm93c2VycyBhbmQgc2V0IGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGAgdG8gYGZhbHNlYCBzbyB0aGV5XG4gKiBnZXQgdGhlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiwgd2hpY2ggaXMgc2xvd2VyIGJ1dCBiZWhhdmVzIGNvcnJlY3RseS5cbiAqL1xuQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgPSAoZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBCYXIgKCkge31cbiAgdHJ5IHtcbiAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkoMSlcbiAgICBhcnIuZm9vID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfVxuICAgIGFyci5jb25zdHJ1Y3RvciA9IEJhclxuICAgIHJldHVybiBhcnIuZm9vKCkgPT09IDQyICYmIC8vIHR5cGVkIGFycmF5IGluc3RhbmNlcyBjYW4gYmUgYXVnbWVudGVkXG4gICAgICAgIGFyci5jb25zdHJ1Y3RvciA9PT0gQmFyICYmIC8vIGNvbnN0cnVjdG9yIGNhbiBiZSBzZXRcbiAgICAgICAgdHlwZW9mIGFyci5zdWJhcnJheSA9PT0gJ2Z1bmN0aW9uJyAmJiAvLyBjaHJvbWUgOS0xMCBsYWNrIGBzdWJhcnJheWBcbiAgICAgICAgYXJyLnN1YmFycmF5KDEsIDEpLmJ5dGVMZW5ndGggPT09IDAgLy8gaWUxMCBoYXMgYnJva2VuIGBzdWJhcnJheWBcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59KSgpXG5cbmZ1bmN0aW9uIGtNYXhMZW5ndGggKCkge1xuICByZXR1cm4gQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRcbiAgICA/IDB4N2ZmZmZmZmZcbiAgICA6IDB4M2ZmZmZmZmZcbn1cblxuLyoqXG4gKiBDbGFzczogQnVmZmVyXG4gKiA9PT09PT09PT09PT09XG4gKlxuICogVGhlIEJ1ZmZlciBjb25zdHJ1Y3RvciByZXR1cm5zIGluc3RhbmNlcyBvZiBgVWludDhBcnJheWAgdGhhdCBhcmUgYXVnbWVudGVkXG4gKiB3aXRoIGZ1bmN0aW9uIHByb3BlcnRpZXMgZm9yIGFsbCB0aGUgbm9kZSBgQnVmZmVyYCBBUEkgZnVuY3Rpb25zLiBXZSB1c2VcbiAqIGBVaW50OEFycmF5YCBzbyB0aGF0IHNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0IHJldHVybnNcbiAqIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIEJ5IGF1Z21lbnRpbmcgdGhlIGluc3RhbmNlcywgd2UgY2FuIGF2b2lkIG1vZGlmeWluZyB0aGUgYFVpbnQ4QXJyYXlgXG4gKiBwcm90b3R5cGUuXG4gKi9cbmZ1bmN0aW9uIEJ1ZmZlciAoYXJnKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBCdWZmZXIpKSB7XG4gICAgLy8gQXZvaWQgZ29pbmcgdGhyb3VnaCBhbiBBcmd1bWVudHNBZGFwdG9yVHJhbXBvbGluZSBpbiB0aGUgY29tbW9uIGNhc2UuXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSByZXR1cm4gbmV3IEJ1ZmZlcihhcmcsIGFyZ3VtZW50c1sxXSlcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcihhcmcpXG4gIH1cblxuICB0aGlzLmxlbmd0aCA9IDBcbiAgdGhpcy5wYXJlbnQgPSB1bmRlZmluZWRcblxuICAvLyBDb21tb24gY2FzZS5cbiAgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSB7XG4gICAgcmV0dXJuIGZyb21OdW1iZXIodGhpcywgYXJnKVxuICB9XG5cbiAgLy8gU2xpZ2h0bHkgbGVzcyBjb21tb24gY2FzZS5cbiAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGZyb21TdHJpbmcodGhpcywgYXJnLCBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6ICd1dGY4JylcbiAgfVxuXG4gIC8vIFVudXN1YWwuXG4gIHJldHVybiBmcm9tT2JqZWN0KHRoaXMsIGFyZylcbn1cblxuZnVuY3Rpb24gZnJvbU51bWJlciAodGhhdCwgbGVuZ3RoKSB7XG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGggPCAwID8gMCA6IGNoZWNrZWQobGVuZ3RoKSB8IDApXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGF0W2ldID0gMFxuICAgIH1cbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tU3RyaW5nICh0aGF0LCBzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnIHx8IGVuY29kaW5nID09PSAnJykgZW5jb2RpbmcgPSAndXRmOCdcblxuICAvLyBBc3N1bXB0aW9uOiBieXRlTGVuZ3RoKCkgcmV0dXJuIHZhbHVlIGlzIGFsd2F5cyA8IGtNYXhMZW5ndGguXG4gIHZhciBsZW5ndGggPSBieXRlTGVuZ3RoKHN0cmluZywgZW5jb2RpbmcpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuXG4gIHRoYXQud3JpdGUoc3RyaW5nLCBlbmNvZGluZylcbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbU9iamVjdCAodGhhdCwgb2JqZWN0KSB7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIob2JqZWN0KSkgcmV0dXJuIGZyb21CdWZmZXIodGhhdCwgb2JqZWN0KVxuXG4gIGlmIChpc0FycmF5KG9iamVjdCkpIHJldHVybiBmcm9tQXJyYXkodGhhdCwgb2JqZWN0KVxuXG4gIGlmIChvYmplY3QgPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ211c3Qgc3RhcnQgd2l0aCBudW1iZXIsIGJ1ZmZlciwgYXJyYXkgb3Igc3RyaW5nJylcbiAgfVxuXG4gIGlmICh0eXBlb2YgQXJyYXlCdWZmZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKG9iamVjdC5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgcmV0dXJuIGZyb21UeXBlZEFycmF5KHRoYXQsIG9iamVjdClcbiAgICB9XG4gICAgaWYgKG9iamVjdCBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICByZXR1cm4gZnJvbUFycmF5QnVmZmVyKHRoYXQsIG9iamVjdClcbiAgICB9XG4gIH1cblxuICBpZiAob2JqZWN0Lmxlbmd0aCkgcmV0dXJuIGZyb21BcnJheUxpa2UodGhhdCwgb2JqZWN0KVxuXG4gIHJldHVybiBmcm9tSnNvbk9iamVjdCh0aGF0LCBvYmplY3QpXG59XG5cbmZ1bmN0aW9uIGZyb21CdWZmZXIgKHRoYXQsIGJ1ZmZlcikge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChidWZmZXIubGVuZ3RoKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcbiAgYnVmZmVyLmNvcHkodGhhdCwgMCwgMCwgbGVuZ3RoKVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXkgKHRoYXQsIGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICB0aGF0W2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG4vLyBEdXBsaWNhdGUgb2YgZnJvbUFycmF5KCkgdG8ga2VlcCBmcm9tQXJyYXkoKSBtb25vbW9ycGhpYy5cbmZ1bmN0aW9uIGZyb21UeXBlZEFycmF5ICh0aGF0LCBhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuICAvLyBUcnVuY2F0aW5nIHRoZSBlbGVtZW50cyBpcyBwcm9iYWJseSBub3Qgd2hhdCBwZW9wbGUgZXhwZWN0IGZyb20gdHlwZWRcbiAgLy8gYXJyYXlzIHdpdGggQllURVNfUEVSX0VMRU1FTlQgPiAxIGJ1dCBpdCdzIGNvbXBhdGlibGUgd2l0aCB0aGUgYmVoYXZpb3JcbiAgLy8gb2YgdGhlIG9sZCBCdWZmZXIgY29uc3RydWN0b3IuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICB0aGF0W2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlCdWZmZXIgKHRoYXQsIGFycmF5KSB7XG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlLCBmb3IgYmVzdCBwZXJmb3JtYW5jZVxuICAgIGFycmF5LmJ5dGVMZW5ndGhcbiAgICB0aGF0ID0gQnVmZmVyLl9hdWdtZW50KG5ldyBVaW50OEFycmF5KGFycmF5KSlcbiAgfSBlbHNlIHtcbiAgICAvLyBGYWxsYmFjazogUmV0dXJuIGFuIG9iamVjdCBpbnN0YW5jZSBvZiB0aGUgQnVmZmVyIGNsYXNzXG4gICAgdGhhdCA9IGZyb21UeXBlZEFycmF5KHRoYXQsIG5ldyBVaW50OEFycmF5KGFycmF5KSlcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlMaWtlICh0aGF0LCBhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuLy8gRGVzZXJpYWxpemUgeyB0eXBlOiAnQnVmZmVyJywgZGF0YTogWzEsMiwzLC4uLl0gfSBpbnRvIGEgQnVmZmVyIG9iamVjdC5cbi8vIFJldHVybnMgYSB6ZXJvLWxlbmd0aCBidWZmZXIgZm9yIGlucHV0cyB0aGF0IGRvbid0IGNvbmZvcm0gdG8gdGhlIHNwZWMuXG5mdW5jdGlvbiBmcm9tSnNvbk9iamVjdCAodGhhdCwgb2JqZWN0KSB7XG4gIHZhciBhcnJheVxuICB2YXIgbGVuZ3RoID0gMFxuXG4gIGlmIChvYmplY3QudHlwZSA9PT0gJ0J1ZmZlcicgJiYgaXNBcnJheShvYmplY3QuZGF0YSkpIHtcbiAgICBhcnJheSA9IG9iamVjdC5kYXRhXG4gICAgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB9XG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIHRoYXRbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGFsbG9jYXRlICh0aGF0LCBsZW5ndGgpIHtcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2UsIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgdGhhdCA9IEJ1ZmZlci5fYXVnbWVudChuZXcgVWludDhBcnJheShsZW5ndGgpKVxuICB9IGVsc2Uge1xuICAgIC8vIEZhbGxiYWNrOiBSZXR1cm4gYW4gb2JqZWN0IGluc3RhbmNlIG9mIHRoZSBCdWZmZXIgY2xhc3NcbiAgICB0aGF0Lmxlbmd0aCA9IGxlbmd0aFxuICAgIHRoYXQuX2lzQnVmZmVyID0gdHJ1ZVxuICB9XG5cbiAgdmFyIGZyb21Qb29sID0gbGVuZ3RoICE9PSAwICYmIGxlbmd0aCA8PSBCdWZmZXIucG9vbFNpemUgPj4+IDFcbiAgaWYgKGZyb21Qb29sKSB0aGF0LnBhcmVudCA9IHJvb3RQYXJlbnRcblxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBjaGVja2VkIChsZW5ndGgpIHtcbiAgLy8gTm90ZTogY2Fubm90IHVzZSBgbGVuZ3RoIDwga01heExlbmd0aGAgaGVyZSBiZWNhdXNlIHRoYXQgZmFpbHMgd2hlblxuICAvLyBsZW5ndGggaXMgTmFOICh3aGljaCBpcyBvdGhlcndpc2UgY29lcmNlZCB0byB6ZXJvLilcbiAgaWYgKGxlbmd0aCA+PSBrTWF4TGVuZ3RoKCkpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byBhbGxvY2F0ZSBCdWZmZXIgbGFyZ2VyIHRoYW4gbWF4aW11bSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAnc2l6ZTogMHgnICsga01heExlbmd0aCgpLnRvU3RyaW5nKDE2KSArICcgYnl0ZXMnKVxuICB9XG4gIHJldHVybiBsZW5ndGggfCAwXG59XG5cbmZ1bmN0aW9uIFNsb3dCdWZmZXIgKHN1YmplY3QsIGVuY29kaW5nKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBTbG93QnVmZmVyKSkgcmV0dXJuIG5ldyBTbG93QnVmZmVyKHN1YmplY3QsIGVuY29kaW5nKVxuXG4gIHZhciBidWYgPSBuZXcgQnVmZmVyKHN1YmplY3QsIGVuY29kaW5nKVxuICBkZWxldGUgYnVmLnBhcmVudFxuICByZXR1cm4gYnVmXG59XG5cbkJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uIGlzQnVmZmVyIChiKSB7XG4gIHJldHVybiAhIShiICE9IG51bGwgJiYgYi5faXNCdWZmZXIpXG59XG5cbkJ1ZmZlci5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAoYSwgYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihhKSB8fCAhQnVmZmVyLmlzQnVmZmVyKGIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIG11c3QgYmUgQnVmZmVycycpXG4gIH1cblxuICBpZiAoYSA9PT0gYikgcmV0dXJuIDBcblxuICB2YXIgeCA9IGEubGVuZ3RoXG4gIHZhciB5ID0gYi5sZW5ndGhcblxuICB2YXIgaSA9IDBcbiAgdmFyIGxlbiA9IE1hdGgubWluKHgsIHkpXG4gIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIGJyZWFrXG5cbiAgICArK2lcbiAgfVxuXG4gIGlmIChpICE9PSBsZW4pIHtcbiAgICB4ID0gYVtpXVxuICAgIHkgPSBiW2ldXG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gaXNFbmNvZGluZyAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgIGNhc2UgJ3Jhdyc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQgKGxpc3QsIGxlbmd0aCkge1xuICBpZiAoIWlzQXJyYXkobGlzdCkpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2xpc3QgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzLicpXG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoMClcbiAgfVxuXG4gIHZhciBpXG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGxlbmd0aCA9IDBcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgbGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1ZiA9IG5ldyBCdWZmZXIobGVuZ3RoKVxuICB2YXIgcG9zID0gMFxuICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBpdGVtID0gbGlzdFtpXVxuICAgIGl0ZW0uY29weShidWYsIHBvcylcbiAgICBwb3MgKz0gaXRlbS5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKSBzdHJpbmcgPSAnJyArIHN0cmluZ1xuXG4gIHZhciBsZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGlmIChsZW4gPT09IDApIHJldHVybiAwXG5cbiAgLy8gVXNlIGEgZm9yIGxvb3AgdG8gYXZvaWQgcmVjdXJzaW9uXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgLy8gRGVwcmVjYXRlZFxuICAgICAgY2FzZSAncmF3JzpcbiAgICAgIGNhc2UgJ3Jhd3MnOlxuICAgICAgICByZXR1cm4gbGVuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gbGVuICogMlxuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGxlbiA+Pj4gMVxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgcmV0dXJuIHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoIC8vIGFzc3VtZSB1dGY4XG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhcblxuLy8gcHJlLXNldCBmb3IgdmFsdWVzIHRoYXQgbWF5IGV4aXN0IGluIHRoZSBmdXR1cmVcbkJ1ZmZlci5wcm90b3R5cGUubGVuZ3RoID0gdW5kZWZpbmVkXG5CdWZmZXIucHJvdG90eXBlLnBhcmVudCA9IHVuZGVmaW5lZFxuXG5mdW5jdGlvbiBzbG93VG9TdHJpbmcgKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG5cbiAgc3RhcnQgPSBzdGFydCB8IDBcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgfHwgZW5kID09PSBJbmZpbml0eSA/IHRoaXMubGVuZ3RoIDogZW5kIHwgMFxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG4gIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmIChlbmQgPD0gc3RhcnQpIHJldHVybiAnJ1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGJpbmFyeVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdXRmMTZsZVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9IChlbmNvZGluZyArICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGggfCAwXG4gIGlmIChsZW5ndGggPT09IDApIHJldHVybiAnJ1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCAwLCBsZW5ndGgpXG4gIHJldHVybiBzbG93VG9TdHJpbmcuYXBwbHkodGhpcywgYXJndW1lbnRzKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIGVxdWFscyAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYikgPT09IDBcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gaW5zcGVjdCAoKSB7XG4gIHZhciBzdHIgPSAnJ1xuICB2YXIgbWF4ID0gZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFU1xuICBpZiAodGhpcy5sZW5ndGggPiAwKSB7XG4gICAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5tYXRjaCgvLnsyfS9nKS5qb2luKCcgJylcbiAgICBpZiAodGhpcy5sZW5ndGggPiBtYXgpIHN0ciArPSAnIC4uLiAnXG4gIH1cbiAgcmV0dXJuICc8QnVmZmVyICcgKyBzdHIgKyAnPidcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gMFxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYilcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gaW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0KSB7XG4gIGlmIChieXRlT2Zmc2V0ID4gMHg3ZmZmZmZmZikgYnl0ZU9mZnNldCA9IDB4N2ZmZmZmZmZcbiAgZWxzZSBpZiAoYnl0ZU9mZnNldCA8IC0weDgwMDAwMDAwKSBieXRlT2Zmc2V0ID0gLTB4ODAwMDAwMDBcbiAgYnl0ZU9mZnNldCA+Pj0gMFxuXG4gIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xXG4gIGlmIChieXRlT2Zmc2V0ID49IHRoaXMubGVuZ3RoKSByZXR1cm4gLTFcblxuICAvLyBOZWdhdGl2ZSBvZmZzZXRzIHN0YXJ0IGZyb20gdGhlIGVuZCBvZiB0aGUgYnVmZmVyXG4gIGlmIChieXRlT2Zmc2V0IDwgMCkgYnl0ZU9mZnNldCA9IE1hdGgubWF4KHRoaXMubGVuZ3RoICsgYnl0ZU9mZnNldCwgMClcblxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xIC8vIHNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nIGFsd2F5cyBmYWlsc1xuICAgIHJldHVybiBTdHJpbmcucHJvdG90eXBlLmluZGV4T2YuY2FsbCh0aGlzLCB2YWwsIGJ5dGVPZmZzZXQpXG4gIH1cbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcih2YWwpKSB7XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQpXG4gIH1cbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwodGhpcywgdmFsLCBieXRlT2Zmc2V0KVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKHRoaXMsIFsgdmFsIF0sIGJ5dGVPZmZzZXQpXG4gIH1cblxuICBmdW5jdGlvbiBhcnJheUluZGV4T2YgKGFyciwgdmFsLCBieXRlT2Zmc2V0KSB7XG4gICAgdmFyIGZvdW5kSW5kZXggPSAtMVxuICAgIGZvciAodmFyIGkgPSAwOyBieXRlT2Zmc2V0ICsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFycltieXRlT2Zmc2V0ICsgaV0gPT09IHZhbFtmb3VuZEluZGV4ID09PSAtMSA/IDAgOiBpIC0gZm91bmRJbmRleF0pIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggPT09IC0xKSBmb3VuZEluZGV4ID0gaVxuICAgICAgICBpZiAoaSAtIGZvdW5kSW5kZXggKyAxID09PSB2YWwubGVuZ3RoKSByZXR1cm4gYnl0ZU9mZnNldCArIGZvdW5kSW5kZXhcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvdW5kSW5kZXggPSAtMVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLTFcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbCBtdXN0IGJlIHN0cmluZywgbnVtYmVyIG9yIEJ1ZmZlcicpXG59XG5cbi8vIGBnZXRgIGlzIGRlcHJlY2F0ZWRcbkJ1ZmZlci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0IChvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5nZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLnJlYWRVSW50OChvZmZzZXQpXG59XG5cbi8vIGBzZXRgIGlzIGRlcHJlY2F0ZWRcbkJ1ZmZlci5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0ICh2LCBvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5zZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLndyaXRlVUludDgodiwgb2Zmc2V0KVxufVxuXG5mdW5jdGlvbiBoZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIC8vIG11c3QgYmUgYW4gZXZlbiBudW1iZXIgb2YgZGlnaXRzXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGlmIChzdHJMZW4gJSAyICE9PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaGV4IHN0cmluZycpXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHZhciBwYXJzZWQgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgaWYgKGlzTmFOKHBhcnNlZCkpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBoZXggc3RyaW5nJylcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSBwYXJzZWRcbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiB1dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBhc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYXNjaWlUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJpbmFyeVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGFzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGJhc2U2NFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gdWNzMldyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIHdyaXRlIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZykge1xuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nKVxuICBpZiAob2Zmc2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIG9mZnNldFssIGxlbmd0aF1bLCBlbmNvZGluZ10pXG4gIH0gZWxzZSBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgICBpZiAoaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgbGVuZ3RoID0gbGVuZ3RoIHwgMFxuICAgICAgaWYgKGVuY29kaW5nID09PSB1bmRlZmluZWQpIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgfSBlbHNlIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIC8vIGxlZ2FjeSB3cml0ZShzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXQsIGxlbmd0aCkgLSByZW1vdmUgaW4gdjAuMTNcbiAgfSBlbHNlIHtcbiAgICB2YXIgc3dhcCA9IGVuY29kaW5nXG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBvZmZzZXQgPSBsZW5ndGggfCAwXG4gICAgbGVuZ3RoID0gc3dhcFxuICB9XG5cbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPiByZW1haW5pbmcpIGxlbmd0aCA9IHJlbWFpbmluZ1xuXG4gIGlmICgoc3RyaW5nLmxlbmd0aCA+IDAgJiYgKGxlbmd0aCA8IDAgfHwgb2Zmc2V0IDwgMCkpIHx8IG9mZnNldCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2F0dGVtcHQgdG8gd3JpdGUgb3V0c2lkZSBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBiaW5hcnlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICAvLyBXYXJuaW5nOiBtYXhMZW5ndGggbm90IHRha2VuIGludG8gYWNjb3VudCBpbiBiYXNlNjRXcml0ZVxuICAgICAgICByZXR1cm4gYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHVjczJXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gYnVmLmxlbmd0aCkge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1Zi5zbGljZShzdGFydCwgZW5kKSlcbiAgfVxufVxuXG5mdW5jdGlvbiB1dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG4gIHZhciByZXMgPSBbXVxuXG4gIHZhciBpID0gc3RhcnRcbiAgd2hpbGUgKGkgPCBlbmQpIHtcbiAgICB2YXIgZmlyc3RCeXRlID0gYnVmW2ldXG4gICAgdmFyIGNvZGVQb2ludCA9IG51bGxcbiAgICB2YXIgYnl0ZXNQZXJTZXF1ZW5jZSA9IChmaXJzdEJ5dGUgPiAweEVGKSA/IDRcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4REYpID8gM1xuICAgICAgOiAoZmlyc3RCeXRlID4gMHhCRikgPyAyXG4gICAgICA6IDFcblxuICAgIGlmIChpICsgYnl0ZXNQZXJTZXF1ZW5jZSA8PSBlbmQpIHtcbiAgICAgIHZhciBzZWNvbmRCeXRlLCB0aGlyZEJ5dGUsIGZvdXJ0aEJ5dGUsIHRlbXBDb2RlUG9pbnRcblxuICAgICAgc3dpdGNoIChieXRlc1BlclNlcXVlbmNlKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBpZiAoZmlyc3RCeXRlIDwgMHg4MCkge1xuICAgICAgICAgICAgY29kZVBvaW50ID0gZmlyc3RCeXRlXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4MUYpIDw8IDB4NiB8IChzZWNvbmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3Rikge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweEMgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4NiB8ICh0aGlyZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGRiAmJiAodGVtcENvZGVQb2ludCA8IDB4RDgwMCB8fCB0ZW1wQ29kZVBvaW50ID4gMHhERkZGKSkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBmb3VydGhCeXRlID0gYnVmW2kgKyAzXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAoZm91cnRoQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHgxMiB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHhDIHwgKHRoaXJkQnl0ZSAmIDB4M0YpIDw8IDB4NiB8IChmb3VydGhCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHhGRkZGICYmIHRlbXBDb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb2RlUG9pbnQgPT09IG51bGwpIHtcbiAgICAgIC8vIHdlIGRpZCBub3QgZ2VuZXJhdGUgYSB2YWxpZCBjb2RlUG9pbnQgc28gaW5zZXJ0IGFcbiAgICAgIC8vIHJlcGxhY2VtZW50IGNoYXIgKFUrRkZGRCkgYW5kIGFkdmFuY2Ugb25seSAxIGJ5dGVcbiAgICAgIGNvZGVQb2ludCA9IDB4RkZGRFxuICAgICAgYnl0ZXNQZXJTZXF1ZW5jZSA9IDFcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA+IDB4RkZGRikge1xuICAgICAgLy8gZW5jb2RlIHRvIHV0ZjE2IChzdXJyb2dhdGUgcGFpciBkYW5jZSlcbiAgICAgIGNvZGVQb2ludCAtPSAweDEwMDAwXG4gICAgICByZXMucHVzaChjb2RlUG9pbnQgPj4+IDEwICYgMHgzRkYgfCAweEQ4MDApXG4gICAgICBjb2RlUG9pbnQgPSAweERDMDAgfCBjb2RlUG9pbnQgJiAweDNGRlxuICAgIH1cblxuICAgIHJlcy5wdXNoKGNvZGVQb2ludClcbiAgICBpICs9IGJ5dGVzUGVyU2VxdWVuY2VcbiAgfVxuXG4gIHJldHVybiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkocmVzKVxufVxuXG4vLyBCYXNlZCBvbiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMjc0NzI3Mi82ODA3NDIsIHRoZSBicm93c2VyIHdpdGhcbi8vIHRoZSBsb3dlc3QgbGltaXQgaXMgQ2hyb21lLCB3aXRoIDB4MTAwMDAgYXJncy5cbi8vIFdlIGdvIDEgbWFnbml0dWRlIGxlc3MsIGZvciBzYWZldHlcbnZhciBNQVhfQVJHVU1FTlRTX0xFTkdUSCA9IDB4MTAwMFxuXG5mdW5jdGlvbiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkgKGNvZGVQb2ludHMpIHtcbiAgdmFyIGxlbiA9IGNvZGVQb2ludHMubGVuZ3RoXG4gIGlmIChsZW4gPD0gTUFYX0FSR1VNRU5UU19MRU5HVEgpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNvZGVQb2ludHMpIC8vIGF2b2lkIGV4dHJhIHNsaWNlKClcbiAgfVxuXG4gIC8vIERlY29kZSBpbiBjaHVua3MgdG8gYXZvaWQgXCJjYWxsIHN0YWNrIHNpemUgZXhjZWVkZWRcIi5cbiAgdmFyIHJlcyA9ICcnXG4gIHZhciBpID0gMFxuICB3aGlsZSAoaSA8IGxlbikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFxuICAgICAgU3RyaW5nLFxuICAgICAgY29kZVBvaW50cy5zbGljZShpLCBpICs9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKVxuICAgIClcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldICYgMHg3RilcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGJpbmFyeVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGhleFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcblxuICBpZiAoIXN0YXJ0IHx8IHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmICghZW5kIHx8IGVuZCA8IDAgfHwgZW5kID4gbGVuKSBlbmQgPSBsZW5cblxuICB2YXIgb3V0ID0gJydcbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBvdXQgKz0gdG9IZXgoYnVmW2ldKVxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyBieXRlc1tpICsgMV0gKiAyNTYpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZlxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICBuZXdCdWYgPSBCdWZmZXIuX2F1Z21lbnQodGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSlcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2xpY2VMZW4gPSBlbmQgLSBzdGFydFxuICAgIG5ld0J1ZiA9IG5ldyBCdWZmZXIoc2xpY2VMZW4sIHVuZGVmaW5lZClcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWNlTGVuOyBpKyspIHtcbiAgICAgIG5ld0J1ZltpXSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfVxuXG4gIGlmIChuZXdCdWYubGVuZ3RoKSBuZXdCdWYucGFyZW50ID0gdGhpcy5wYXJlbnQgfHwgdGhpc1xuXG4gIHJldHVybiBuZXdCdWZcbn1cblxuLypcbiAqIE5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgYnVmZmVyIGlzbid0IHRyeWluZyB0byB3cml0ZSBvdXQgb2YgYm91bmRzLlxuICovXG5mdW5jdGlvbiBjaGVja09mZnNldCAob2Zmc2V0LCBleHQsIGxlbmd0aCkge1xuICBpZiAoKG9mZnNldCAlIDEpICE9PSAwIHx8IG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdvZmZzZXQgaXMgbm90IHVpbnQnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gbGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVHJ5aW5nIHRvIGFjY2VzcyBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRMRSA9IGZ1bmN0aW9uIHJlYWRVSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRCRSA9IGZ1bmN0aW9uIHJlYWRVSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG4gIH1cblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdXG4gIHZhciBtdWwgPSAxXG4gIHdoaWxlIChieXRlTGVuZ3RoID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiByZWFkVUludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiByZWFkVUludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgOCkgfCB0aGlzW29mZnNldCArIDFdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICgodGhpc1tvZmZzZXRdKSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikpICtcbiAgICAgICh0aGlzW29mZnNldCArIDNdICogMHgxMDAwMDAwKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdICogMHgxMDAwMDAwKSArXG4gICAgKCh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgIHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludExFID0gZnVuY3Rpb24gcmVhZEludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludEJFID0gZnVuY3Rpb24gcmVhZEludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoXG4gIHZhciBtdWwgPSAxXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0taV1cbiAgd2hpbGUgKGkgPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1pXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiByZWFkSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICBpZiAoISh0aGlzW29mZnNldF0gJiAweDgwKSkgcmV0dXJuICh0aGlzW29mZnNldF0pXG4gIHJldHVybiAoKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gcmVhZEludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIDFdIHwgKHRoaXNbb2Zmc2V0XSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbiByZWFkSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdKSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10gPDwgMjQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiByZWFkSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDI0KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiByZWFkRmxvYXRMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0QkUgPSBmdW5jdGlvbiByZWFkRmxvYXRCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gcmVhZERvdWJsZUJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgNTIsIDgpXG59XG5cbmZ1bmN0aW9uIGNoZWNrSW50IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignYnVmZmVyIG11c3QgYmUgYSBCdWZmZXIgaW5zdGFuY2UnKVxuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCd2YWx1ZSBpcyBvdXQgb2YgYm91bmRzJylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdpbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludExFID0gZnVuY3Rpb24gd3JpdGVVSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSwgMClcblxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludEJFID0gZnVuY3Rpb24gd3JpdGVVSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSwgMClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiB3cml0ZVVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4ZmYsIDApXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHZhbHVlID0gTWF0aC5mbG9vcih2YWx1ZSlcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuZnVuY3Rpb24gb2JqZWN0V3JpdGVVSW50MTYgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuKSB7XG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmICsgdmFsdWUgKyAxXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4oYnVmLmxlbmd0aCAtIG9mZnNldCwgMik7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSAodmFsdWUgJiAoMHhmZiA8PCAoOCAqIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpKSkpID4+PlxuICAgICAgKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkgKiA4XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9IHZhbHVlXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuZnVuY3Rpb24gb2JqZWN0V3JpdGVVSW50MzIgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuKSB7XG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGJ1Zi5sZW5ndGggLSBvZmZzZXQsIDQpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID0gKHZhbHVlID4+PiAobGl0dGxlRW5kaWFuID8gaSA6IDMgLSBpKSAqIDgpICYgMHhmZlxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9IHZhbHVlXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludExFID0gZnVuY3Rpb24gd3JpdGVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGggLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IDBcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IHZhbHVlIDwgMCA/IDEgOiAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gdmFsdWUgPCAwID8gMSA6IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uIHdyaXRlSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweDdmLCAtMHg4MClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkgdmFsdWUgPSBNYXRoLmZsb29yKHZhbHVlKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDFdID0gdmFsdWVcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9IHZhbHVlXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuZnVuY3Rpb24gY2hlY2tJRUVFNzU0IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndmFsdWUgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdpbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5mdW5jdGlvbiB3cml0ZUZsb2F0IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDQsIDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgsIC0zLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gd3JpdGVGbG9hdEJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDgsIDEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4LCAtMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG4gIHJldHVybiBvZmZzZXQgKyA4XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVMRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUJFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuLy8gY29weSh0YXJnZXRCdWZmZXIsIHRhcmdldFN0YXJ0PTAsIHNvdXJjZVN0YXJ0PTAsIHNvdXJjZUVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gY29weSAodGFyZ2V0LCB0YXJnZXRTdGFydCwgc3RhcnQsIGVuZCkge1xuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0U3RhcnQgPj0gdGFyZ2V0Lmxlbmd0aCkgdGFyZ2V0U3RhcnQgPSB0YXJnZXQubGVuZ3RoXG4gIGlmICghdGFyZ2V0U3RhcnQpIHRhcmdldFN0YXJ0ID0gMFxuICBpZiAoZW5kID4gMCAmJiBlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICAvLyBDb3B5IDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVybiAwXG4gIGlmICh0YXJnZXQubGVuZ3RoID09PSAwIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIEZhdGFsIGVycm9yIGNvbmRpdGlvbnNcbiAgaWYgKHRhcmdldFN0YXJ0IDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgfVxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlU3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChlbmQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlRW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIC8vIEFyZSB3ZSBvb2I/XG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCA8IGVuZCAtIHN0YXJ0KSB7XG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0ICsgc3RhcnRcbiAgfVxuXG4gIHZhciBsZW4gPSBlbmQgLSBzdGFydFxuICB2YXIgaVxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQgJiYgc3RhcnQgPCB0YXJnZXRTdGFydCAmJiB0YXJnZXRTdGFydCA8IGVuZCkge1xuICAgIC8vIGRlc2NlbmRpbmcgY29weSBmcm9tIGVuZFxuICAgIGZvciAoaSA9IGxlbiAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIGlmIChsZW4gPCAxMDAwIHx8ICFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIC8vIGFzY2VuZGluZyBjb3B5IGZyb20gc3RhcnRcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0U3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRhcmdldC5fc2V0KHRoaXMuc3ViYXJyYXkoc3RhcnQsIHN0YXJ0ICsgbGVuKSwgdGFyZ2V0U3RhcnQpXG4gIH1cblxuICByZXR1cm4gbGVuXG59XG5cbi8vIGZpbGwodmFsdWUsIHN0YXJ0PTAsIGVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gZmlsbCAodmFsdWUsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCF2YWx1ZSkgdmFsdWUgPSAwXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCkgZW5kID0gdGhpcy5sZW5ndGhcblxuICBpZiAoZW5kIDwgc3RhcnQpIHRocm93IG5ldyBSYW5nZUVycm9yKCdlbmQgPCBzdGFydCcpXG5cbiAgLy8gRmlsbCAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm5cbiAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChlbmQgPCAwIHx8IGVuZCA+IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignZW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIHZhciBpXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgdGhpc1tpXSA9IHZhbHVlXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBieXRlcyA9IHV0ZjhUb0J5dGVzKHZhbHVlLnRvU3RyaW5nKCkpXG4gICAgdmFyIGxlbiA9IGJ5dGVzLmxlbmd0aFxuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIHRoaXNbaV0gPSBieXRlc1tpICUgbGVuXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBgQXJyYXlCdWZmZXJgIHdpdGggdGhlICpjb3BpZWQqIG1lbW9yeSBvZiB0aGUgYnVmZmVyIGluc3RhbmNlLlxuICogQWRkZWQgaW4gTm9kZSAwLjEyLiBPbmx5IGF2YWlsYWJsZSBpbiBicm93c2VycyB0aGF0IHN1cHBvcnQgQXJyYXlCdWZmZXIuXG4gKi9cbkJ1ZmZlci5wcm90b3R5cGUudG9BcnJheUJ1ZmZlciA9IGZ1bmN0aW9uIHRvQXJyYXlCdWZmZXIgKCkge1xuICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgICByZXR1cm4gKG5ldyBCdWZmZXIodGhpcykpLmJ1ZmZlclxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5sZW5ndGgpXG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYnVmLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgIGJ1ZltpXSA9IHRoaXNbaV1cbiAgICAgIH1cbiAgICAgIHJldHVybiBidWYuYnVmZmVyXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0J1ZmZlci50b0FycmF5QnVmZmVyIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyJylcbiAgfVxufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbnZhciBCUCA9IEJ1ZmZlci5wcm90b3R5cGVcblxuLyoqXG4gKiBBdWdtZW50IGEgVWludDhBcnJheSAqaW5zdGFuY2UqIChub3QgdGhlIFVpbnQ4QXJyYXkgY2xhc3MhKSB3aXRoIEJ1ZmZlciBtZXRob2RzXG4gKi9cbkJ1ZmZlci5fYXVnbWVudCA9IGZ1bmN0aW9uIF9hdWdtZW50IChhcnIpIHtcbiAgYXJyLmNvbnN0cnVjdG9yID0gQnVmZmVyXG4gIGFyci5faXNCdWZmZXIgPSB0cnVlXG5cbiAgLy8gc2F2ZSByZWZlcmVuY2UgdG8gb3JpZ2luYWwgVWludDhBcnJheSBzZXQgbWV0aG9kIGJlZm9yZSBvdmVyd3JpdGluZ1xuICBhcnIuX3NldCA9IGFyci5zZXRcblxuICAvLyBkZXByZWNhdGVkXG4gIGFyci5nZXQgPSBCUC5nZXRcbiAgYXJyLnNldCA9IEJQLnNldFxuXG4gIGFyci53cml0ZSA9IEJQLndyaXRlXG4gIGFyci50b1N0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0xvY2FsZVN0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0pTT04gPSBCUC50b0pTT05cbiAgYXJyLmVxdWFscyA9IEJQLmVxdWFsc1xuICBhcnIuY29tcGFyZSA9IEJQLmNvbXBhcmVcbiAgYXJyLmluZGV4T2YgPSBCUC5pbmRleE9mXG4gIGFyci5jb3B5ID0gQlAuY29weVxuICBhcnIuc2xpY2UgPSBCUC5zbGljZVxuICBhcnIucmVhZFVJbnRMRSA9IEJQLnJlYWRVSW50TEVcbiAgYXJyLnJlYWRVSW50QkUgPSBCUC5yZWFkVUludEJFXG4gIGFyci5yZWFkVUludDggPSBCUC5yZWFkVUludDhcbiAgYXJyLnJlYWRVSW50MTZMRSA9IEJQLnJlYWRVSW50MTZMRVxuICBhcnIucmVhZFVJbnQxNkJFID0gQlAucmVhZFVJbnQxNkJFXG4gIGFyci5yZWFkVUludDMyTEUgPSBCUC5yZWFkVUludDMyTEVcbiAgYXJyLnJlYWRVSW50MzJCRSA9IEJQLnJlYWRVSW50MzJCRVxuICBhcnIucmVhZEludExFID0gQlAucmVhZEludExFXG4gIGFyci5yZWFkSW50QkUgPSBCUC5yZWFkSW50QkVcbiAgYXJyLnJlYWRJbnQ4ID0gQlAucmVhZEludDhcbiAgYXJyLnJlYWRJbnQxNkxFID0gQlAucmVhZEludDE2TEVcbiAgYXJyLnJlYWRJbnQxNkJFID0gQlAucmVhZEludDE2QkVcbiAgYXJyLnJlYWRJbnQzMkxFID0gQlAucmVhZEludDMyTEVcbiAgYXJyLnJlYWRJbnQzMkJFID0gQlAucmVhZEludDMyQkVcbiAgYXJyLnJlYWRGbG9hdExFID0gQlAucmVhZEZsb2F0TEVcbiAgYXJyLnJlYWRGbG9hdEJFID0gQlAucmVhZEZsb2F0QkVcbiAgYXJyLnJlYWREb3VibGVMRSA9IEJQLnJlYWREb3VibGVMRVxuICBhcnIucmVhZERvdWJsZUJFID0gQlAucmVhZERvdWJsZUJFXG4gIGFyci53cml0ZVVJbnQ4ID0gQlAud3JpdGVVSW50OFxuICBhcnIud3JpdGVVSW50TEUgPSBCUC53cml0ZVVJbnRMRVxuICBhcnIud3JpdGVVSW50QkUgPSBCUC53cml0ZVVJbnRCRVxuICBhcnIud3JpdGVVSW50MTZMRSA9IEJQLndyaXRlVUludDE2TEVcbiAgYXJyLndyaXRlVUludDE2QkUgPSBCUC53cml0ZVVJbnQxNkJFXG4gIGFyci53cml0ZVVJbnQzMkxFID0gQlAud3JpdGVVSW50MzJMRVxuICBhcnIud3JpdGVVSW50MzJCRSA9IEJQLndyaXRlVUludDMyQkVcbiAgYXJyLndyaXRlSW50TEUgPSBCUC53cml0ZUludExFXG4gIGFyci53cml0ZUludEJFID0gQlAud3JpdGVJbnRCRVxuICBhcnIud3JpdGVJbnQ4ID0gQlAud3JpdGVJbnQ4XG4gIGFyci53cml0ZUludDE2TEUgPSBCUC53cml0ZUludDE2TEVcbiAgYXJyLndyaXRlSW50MTZCRSA9IEJQLndyaXRlSW50MTZCRVxuICBhcnIud3JpdGVJbnQzMkxFID0gQlAud3JpdGVJbnQzMkxFXG4gIGFyci53cml0ZUludDMyQkUgPSBCUC53cml0ZUludDMyQkVcbiAgYXJyLndyaXRlRmxvYXRMRSA9IEJQLndyaXRlRmxvYXRMRVxuICBhcnIud3JpdGVGbG9hdEJFID0gQlAud3JpdGVGbG9hdEJFXG4gIGFyci53cml0ZURvdWJsZUxFID0gQlAud3JpdGVEb3VibGVMRVxuICBhcnIud3JpdGVEb3VibGVCRSA9IEJQLndyaXRlRG91YmxlQkVcbiAgYXJyLmZpbGwgPSBCUC5maWxsXG4gIGFyci5pbnNwZWN0ID0gQlAuaW5zcGVjdFxuICBhcnIudG9BcnJheUJ1ZmZlciA9IEJQLnRvQXJyYXlCdWZmZXJcblxuICByZXR1cm4gYXJyXG59XG5cbnZhciBJTlZBTElEX0JBU0U2NF9SRSA9IC9bXitcXC8wLTlBLVphLXotX10vZ1xuXG5mdW5jdGlvbiBiYXNlNjRjbGVhbiAoc3RyKSB7XG4gIC8vIE5vZGUgc3RyaXBzIG91dCBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSBcXG4gYW5kIFxcdCBmcm9tIHRoZSBzdHJpbmcsIGJhc2U2NC1qcyBkb2VzIG5vdFxuICBzdHIgPSBzdHJpbmd0cmltKHN0cikucmVwbGFjZShJTlZBTElEX0JBU0U2NF9SRSwgJycpXG4gIC8vIE5vZGUgY29udmVydHMgc3RyaW5ncyB3aXRoIGxlbmd0aCA8IDIgdG8gJydcbiAgaWYgKHN0ci5sZW5ndGggPCAyKSByZXR1cm4gJydcbiAgLy8gTm9kZSBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgYmFzZTY0IHN0cmluZ3MgKG1pc3NpbmcgdHJhaWxpbmcgPT09KSwgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHdoaWxlIChzdHIubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgIHN0ciA9IHN0ciArICc9J1xuICB9XG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gc3RyaW5ndHJpbSAoc3RyKSB7XG4gIGlmIChzdHIudHJpbSkgcmV0dXJuIHN0ci50cmltKClcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJylcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyaW5nLCB1bml0cykge1xuICB1bml0cyA9IHVuaXRzIHx8IEluZmluaXR5XG4gIHZhciBjb2RlUG9pbnRcbiAgdmFyIGxlbmd0aCA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIGxlYWRTdXJyb2dhdGUgPSBudWxsXG4gIHZhciBieXRlcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGNvZGVQb2ludCA9IHN0cmluZy5jaGFyQ29kZUF0KGkpXG5cbiAgICAvLyBpcyBzdXJyb2dhdGUgY29tcG9uZW50XG4gICAgaWYgKGNvZGVQb2ludCA+IDB4RDdGRiAmJiBjb2RlUG9pbnQgPCAweEUwMDApIHtcbiAgICAgIC8vIGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoIWxlYWRTdXJyb2dhdGUpIHtcbiAgICAgICAgLy8gbm8gbGVhZCB5ZXRcbiAgICAgICAgaWYgKGNvZGVQb2ludCA+IDB4REJGRikge1xuICAgICAgICAgIC8vIHVuZXhwZWN0ZWQgdHJhaWxcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKGkgKyAxID09PSBsZW5ndGgpIHtcbiAgICAgICAgICAvLyB1bnBhaXJlZCBsZWFkXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhbGlkIGxlYWRcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIDIgbGVhZHMgaW4gYSByb3dcbiAgICAgIGlmIChjb2RlUG9pbnQgPCAweERDMDApIHtcbiAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gdmFsaWQgc3Vycm9nYXRlIHBhaXJcbiAgICAgIGNvZGVQb2ludCA9IGxlYWRTdXJyb2dhdGUgLSAweEQ4MDAgPDwgMTAgfCBjb2RlUG9pbnQgLSAweERDMDAgfCAweDEwMDAwXG4gICAgfSBlbHNlIGlmIChsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAvLyB2YWxpZCBibXAgY2hhciwgYnV0IGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICB9XG5cbiAgICBsZWFkU3Vycm9nYXRlID0gbnVsbFxuXG4gICAgLy8gZW5jb2RlIHV0ZjhcbiAgICBpZiAoY29kZVBvaW50IDwgMHg4MCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAxKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKGNvZGVQb2ludClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4ODAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgfCAweEMwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAzKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDIHwgMHhFMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gNCkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4MTIgfCAweEYwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvZGUgcG9pbnQnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBieXRlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyLCB1bml0cykge1xuICB2YXIgYywgaGksIGxvXG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuXG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIHJldHVybiBiYXNlNjQudG9CeXRlQXJyYXkoYmFzZTY0Y2xlYW4oc3RyKSlcbn1cblxuZnVuY3Rpb24gYmxpdEJ1ZmZlciAoc3JjLCBkc3QsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoKGkgKyBvZmZzZXQgPj0gZHN0Lmxlbmd0aCkgfHwgKGkgPj0gc3JjLmxlbmd0aCkpIGJyZWFrXG4gICAgZHN0W2kgKyBvZmZzZXRdID0gc3JjW2ldXG4gIH1cbiAgcmV0dXJuIGlcbn1cbiIsInZhciBsb29rdXAgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLyc7XG5cbjsoZnVuY3Rpb24gKGV4cG9ydHMpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG4gIHZhciBBcnIgPSAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnKVxuICAgID8gVWludDhBcnJheVxuICAgIDogQXJyYXlcblxuXHR2YXIgUExVUyAgID0gJysnLmNoYXJDb2RlQXQoMClcblx0dmFyIFNMQVNIICA9ICcvJy5jaGFyQ29kZUF0KDApXG5cdHZhciBOVU1CRVIgPSAnMCcuY2hhckNvZGVBdCgwKVxuXHR2YXIgTE9XRVIgID0gJ2EnLmNoYXJDb2RlQXQoMClcblx0dmFyIFVQUEVSICA9ICdBJy5jaGFyQ29kZUF0KDApXG5cdHZhciBQTFVTX1VSTF9TQUZFID0gJy0nLmNoYXJDb2RlQXQoMClcblx0dmFyIFNMQVNIX1VSTF9TQUZFID0gJ18nLmNoYXJDb2RlQXQoMClcblxuXHRmdW5jdGlvbiBkZWNvZGUgKGVsdCkge1xuXHRcdHZhciBjb2RlID0gZWx0LmNoYXJDb2RlQXQoMClcblx0XHRpZiAoY29kZSA9PT0gUExVUyB8fFxuXHRcdCAgICBjb2RlID09PSBQTFVTX1VSTF9TQUZFKVxuXHRcdFx0cmV0dXJuIDYyIC8vICcrJ1xuXHRcdGlmIChjb2RlID09PSBTTEFTSCB8fFxuXHRcdCAgICBjb2RlID09PSBTTEFTSF9VUkxfU0FGRSlcblx0XHRcdHJldHVybiA2MyAvLyAnLydcblx0XHRpZiAoY29kZSA8IE5VTUJFUilcblx0XHRcdHJldHVybiAtMSAvL25vIG1hdGNoXG5cdFx0aWYgKGNvZGUgPCBOVU1CRVIgKyAxMClcblx0XHRcdHJldHVybiBjb2RlIC0gTlVNQkVSICsgMjYgKyAyNlxuXHRcdGlmIChjb2RlIDwgVVBQRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gVVBQRVJcblx0XHRpZiAoY29kZSA8IExPV0VSICsgMjYpXG5cdFx0XHRyZXR1cm4gY29kZSAtIExPV0VSICsgMjZcblx0fVxuXG5cdGZ1bmN0aW9uIGI2NFRvQnl0ZUFycmF5IChiNjQpIHtcblx0XHR2YXIgaSwgaiwgbCwgdG1wLCBwbGFjZUhvbGRlcnMsIGFyclxuXG5cdFx0aWYgKGI2NC5sZW5ndGggJSA0ID4gMCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0Jylcblx0XHR9XG5cblx0XHQvLyB0aGUgbnVtYmVyIG9mIGVxdWFsIHNpZ25zIChwbGFjZSBob2xkZXJzKVxuXHRcdC8vIGlmIHRoZXJlIGFyZSB0d28gcGxhY2Vob2xkZXJzLCB0aGFuIHRoZSB0d28gY2hhcmFjdGVycyBiZWZvcmUgaXRcblx0XHQvLyByZXByZXNlbnQgb25lIGJ5dGVcblx0XHQvLyBpZiB0aGVyZSBpcyBvbmx5IG9uZSwgdGhlbiB0aGUgdGhyZWUgY2hhcmFjdGVycyBiZWZvcmUgaXQgcmVwcmVzZW50IDIgYnl0ZXNcblx0XHQvLyB0aGlzIGlzIGp1c3QgYSBjaGVhcCBoYWNrIHRvIG5vdCBkbyBpbmRleE9mIHR3aWNlXG5cdFx0dmFyIGxlbiA9IGI2NC5sZW5ndGhcblx0XHRwbGFjZUhvbGRlcnMgPSAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMikgPyAyIDogJz0nID09PSBiNjQuY2hhckF0KGxlbiAtIDEpID8gMSA6IDBcblxuXHRcdC8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuXHRcdGFyciA9IG5ldyBBcnIoYjY0Lmxlbmd0aCAqIDMgLyA0IC0gcGxhY2VIb2xkZXJzKVxuXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuXHRcdGwgPSBwbGFjZUhvbGRlcnMgPiAwID8gYjY0Lmxlbmd0aCAtIDQgOiBiNjQubGVuZ3RoXG5cblx0XHR2YXIgTCA9IDBcblxuXHRcdGZ1bmN0aW9uIHB1c2ggKHYpIHtcblx0XHRcdGFycltMKytdID0gdlxuXHRcdH1cblxuXHRcdGZvciAoaSA9IDAsIGogPSAwOyBpIDwgbDsgaSArPSA0LCBqICs9IDMpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTgpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgMTIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPDwgNikgfCBkZWNvZGUoYjY0LmNoYXJBdChpICsgMykpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDAwMCkgPj4gMTYpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDApID4+IDgpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fVxuXG5cdFx0aWYgKHBsYWNlSG9sZGVycyA9PT0gMikge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAyKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpID4+IDQpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fSBlbHNlIGlmIChwbGFjZUhvbGRlcnMgPT09IDEpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTApIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgNCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA+PiAyKVxuXHRcdFx0cHVzaCgodG1wID4+IDgpICYgMHhGRilcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRyZXR1cm4gYXJyXG5cdH1cblxuXHRmdW5jdGlvbiB1aW50OFRvQmFzZTY0ICh1aW50OCkge1xuXHRcdHZhciBpLFxuXHRcdFx0ZXh0cmFCeXRlcyA9IHVpbnQ4Lmxlbmd0aCAlIDMsIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG5cdFx0XHRvdXRwdXQgPSBcIlwiLFxuXHRcdFx0dGVtcCwgbGVuZ3RoXG5cblx0XHRmdW5jdGlvbiBlbmNvZGUgKG51bSkge1xuXHRcdFx0cmV0dXJuIGxvb2t1cC5jaGFyQXQobnVtKVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG5cdFx0XHRyZXR1cm4gZW5jb2RlKG51bSA+PiAxOCAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiAxMiAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiA2ICYgMHgzRikgKyBlbmNvZGUobnVtICYgMHgzRilcblx0XHR9XG5cblx0XHQvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG5cdFx0Zm9yIChpID0gMCwgbGVuZ3RoID0gdWludDgubGVuZ3RoIC0gZXh0cmFCeXRlczsgaSA8IGxlbmd0aDsgaSArPSAzKSB7XG5cdFx0XHR0ZW1wID0gKHVpbnQ4W2ldIDw8IDE2KSArICh1aW50OFtpICsgMV0gPDwgOCkgKyAodWludDhbaSArIDJdKVxuXHRcdFx0b3V0cHV0ICs9IHRyaXBsZXRUb0Jhc2U2NCh0ZW1wKVxuXHRcdH1cblxuXHRcdC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcblx0XHRzd2l0Y2ggKGV4dHJhQnl0ZXMpIHtcblx0XHRcdGNhc2UgMTpcblx0XHRcdFx0dGVtcCA9IHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUodGVtcCA+PiAyKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9PSdcblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgMjpcblx0XHRcdFx0dGVtcCA9ICh1aW50OFt1aW50OC5sZW5ndGggLSAyXSA8PCA4KSArICh1aW50OFt1aW50OC5sZW5ndGggLSAxXSlcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDEwKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wID4+IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA8PCAyKSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSAnPSdcblx0XHRcdFx0YnJlYWtcblx0XHR9XG5cblx0XHRyZXR1cm4gb3V0cHV0XG5cdH1cblxuXHRleHBvcnRzLnRvQnl0ZUFycmF5ID0gYjY0VG9CeXRlQXJyYXlcblx0ZXhwb3J0cy5mcm9tQnl0ZUFycmF5ID0gdWludDhUb0Jhc2U2NFxufSh0eXBlb2YgZXhwb3J0cyA9PT0gJ3VuZGVmaW5lZCcgPyAodGhpcy5iYXNlNjRqcyA9IHt9KSA6IGV4cG9ydHMpKVxuIiwiZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24gKGJ1ZmZlciwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG1cbiAgdmFyIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBuQml0cyA9IC03XG4gIHZhciBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDBcbiAgdmFyIGQgPSBpc0xFID8gLTEgOiAxXG4gIHZhciBzID0gYnVmZmVyW29mZnNldCArIGldXG5cbiAgaSArPSBkXG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgcyA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gZUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gZSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIG0gPSBlICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIGUgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IG1MZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgbSA9IG0gKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBpZiAoZSA9PT0gMCkge1xuICAgIGUgPSAxIC0gZUJpYXNcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpXG4gIH0gZWxzZSB7XG4gICAgbSA9IG0gKyBNYXRoLnBvdygyLCBtTGVuKVxuICAgIGUgPSBlIC0gZUJpYXNcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKVxufVxuXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24gKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLCBjXG4gIHZhciBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApXG4gIHZhciBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSlcbiAgdmFyIGQgPSBpc0xFID8gMSA6IC0xXG4gIHZhciBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwXG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSlcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMFxuICAgIGUgPSBlTWF4XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpXG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tXG4gICAgICBjICo9IDJcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGNcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpXG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrXG4gICAgICBjIC89IDJcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwXG4gICAgICBlID0gZU1heFxuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAodmFsdWUgKiBjIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IGUgKyBlQmlhc1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSAwXG4gICAgfVxuICB9XG5cbiAgZm9yICg7IG1MZW4gPj0gODsgYnVmZmVyW29mZnNldCArIGldID0gbSAmIDB4ZmYsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCkge31cblxuICBlID0gKGUgPDwgbUxlbikgfCBtXG4gIGVMZW4gKz0gbUxlblxuICBmb3IgKDsgZUxlbiA+IDA7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGUgJiAweGZmLCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpIHt9XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4XG59XG4iLCJcbi8qKlxuICogaXNBcnJheVxuICovXG5cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcblxuLyoqXG4gKiB0b1N0cmluZ1xuICovXG5cbnZhciBzdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4vKipcbiAqIFdoZXRoZXIgb3Igbm90IHRoZSBnaXZlbiBgdmFsYFxuICogaXMgYW4gYXJyYXkuXG4gKlxuICogZXhhbXBsZTpcbiAqXG4gKiAgICAgICAgaXNBcnJheShbXSk7XG4gKiAgICAgICAgLy8gPiB0cnVlXG4gKiAgICAgICAgaXNBcnJheShhcmd1bWVudHMpO1xuICogICAgICAgIC8vID4gZmFsc2VcbiAqICAgICAgICBpc0FycmF5KCcnKTtcbiAqICAgICAgICAvLyA+IGZhbHNlXG4gKlxuICogQHBhcmFtIHttaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtib29sfVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcnJheSB8fCBmdW5jdGlvbiAodmFsKSB7XG4gIHJldHVybiAhISB2YWwgJiYgJ1tvYmplY3QgQXJyYXldJyA9PSBzdHIuY2FsbCh2YWwpO1xufTtcbiJdfQ==
