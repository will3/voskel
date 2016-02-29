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

},{"bit-twiddle":4,"buffer":49,"dup":5}],7:[function(require,module,exports){
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

},{"../components/blocks":18,"../components/rigidbody":23,"ndarray":10}],17:[function(require,module,exports){
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

},{"../components/character":19,"../components/playercontrol":22,"../components/rigidbody":23}],18:[function(require,module,exports){
var ndarray = require('ndarray');
var mesher = require('../voxel/mesher');
var arrayUtils = require('../utils/arrayutils');

var Blocks = function(object) {
  this.object = object;
  this.type = 'blocks';

  this.dim = [32, 32, 32];
  this.chunk = ndarray([], this.dim);

  this.mesh = null;
  this.obj = new THREE.Object3D();
  this.material = new THREE.MultiMaterial();

  this.dirty = false;
  this.dimNeedsUpdate = false;

  this.object.add(this.obj);

  this.palette = [null];
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

  if (this.dirty) {
    this._updateMesh();
    this.dirty = false;
  }
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
    palette: this.palette
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
};

Blocks.prototype._updateMesh = function(result) {
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
    console.log(material.color);
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
},{"../utils/arrayutils":44,"../voxel/mesher":47,"ndarray":10}],19:[function(require,module,exports){
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

  this.lockRotation = false;

  this.updateCamera();
};

DragCamera.$inject = ['input'];

DragCamera.prototype.tick = function() {
  this.processInput();

  this.updateCamera();
};

DragCamera.prototype.processInput = function() {
  if (this.input.mouseHold() && !this.lockRotation) {
    var diff = new THREE.Vector2().subVectors(this.input.mouse, this.lastMouse);
    this.rotation.y += diff.x * this.mouseSpeedY;
    this.rotation.x += diff.y * this.mouseSpeedX;

    if (this.rotation.x < this.minPitch) this.rotation.x = this.minPitch;
    if (this.rotation.x > this.maxPitch) this.rotation.x = this.maxPitch;
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

},{}],21:[function(require,module,exports){
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
},{}],22:[function(require,module,exports){
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
},{}],23:[function(require,module,exports){
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

},{}],24:[function(require,module,exports){
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
},{"./events":25}],25:[function(require,module,exports){
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
},{}],26:[function(require,module,exports){
module.exports = function(opts) {
  opts = opts || {};
  var palette = opts.palette || [];
  var onPick = opts.onPick || function() {};
  var blockWidth = opts.blockWidth || 20;
  var blockHeight = opts.blockHeight || 20;

  var container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '20px';
  container.style.bottom = '20px';
  document.body.appendChild(container);

  container.onfocus = function() {
    container.style['outline'] = 'none';
  };

  var blocks = [];

  for (var i = 0; i < palette.length; i++) {
    var row = palette[i];
    for (var j = 0; j < row.length; j++) {
      addColorBlock(i, j, row[j]);
    }
  }

  updateContainer();

  function addColorBlock(row, column, color) {
    var div = document.createElement('div');
    div.style.backgroundColor = color;
    position(div, row, column);
    container.appendChild(div);

    var columns = blocks[row] || (blocks[row] = []);
    columns[column] = div;
  };

  function add(row, column, obj) {
    var identifier;
    var element;

    if (obj.imgData != null) {
      element = document.createElement('img');
      position(element, row, column);
      element.src = obj.imgData;
      container.appendChild(element);

      identifier = obj.identifier;
    }

    if (blocks[row] == null) {
      blocks[row] = [];
    }
    blocks[row][column] = element;

    if (palette[row] == null) {
      palette[row] = [];
    }
    palette[row][column] = identifier;

    updateContainer();
  };

  function position(element, row, column) {
    element.style.position = 'absolute';
    element.style.left = column * blockWidth + 'px';
    element.style.top = row * blockHeight + 'px';
    element.style.width = blockWidth + 'px';
    element.style.height = blockHeight + 'px';
    element.style.display = 'inline-block';
  };

  function getMaxColumns() {
    var max = 0;
    for (var i = 0; i < palette.length; i++) {
      if (palette[i].length > max) {
        max = palette[i].length;
      }
    }

    return max;
  };

  function updateContainer() {
    container.style.width = getMaxColumns() * blockWidth + 'px';
    container.style.height = palette.length * blockHeight + 'px';
  };

  var highlightDiv = null;

  function highlight(row, column) {
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
  };

  container.addEventListener('mousedown', function(e) {
    var mouseX = e.pageX - container.offsetLeft;
    var mouseY = e.pageY - container.offsetTop;
    var row = Math.floor(mouseY / blockHeight);
    var column = Math.floor(mouseX / blockWidth);

    if (palette[row] == null) {
      return;
    }

    var color = palette[row][column];
    highlight(row, column);
    onPick(color);
  });

  highlight(0, 0);

  return {
    highlight: highlight,
    add: add,
    palette: palette,
    domElement: container
  }
};
},{}],27:[function(require,module,exports){
module.exports={
  "editor_default_size": [12, 12, 12]
}
},{}],28:[function(require,module,exports){
module.exports=[
  [
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
    "#000000",
    "#000000"
  ],

  ["#BCBCBC",
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
    "#008888",
    "#000000",
    "#000000",
    "#000000"
  ],

  ["#F8F8F8",
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
    "#000000",
    "#000000"
  ],

  ["#FCFCFC",
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
    "#000000",
    "#000000"
  ]
]
},{}],29:[function(require,module,exports){
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
},{}],30:[function(require,module,exports){
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
},{"../../utils/arrayutils":44,"./blockcommand":29}],31:[function(require,module,exports){
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
},{"../../utils/arrayutils":44}],32:[function(require,module,exports){
var BlockCommand = require('./blockcommand');

module.exports = function(blocks, coords, value) {
  var command = new BlockCommand(blocks);
  command.setAtCoords(coords, value);

  return command;
};
},{"./blockcommand":29}],33:[function(require,module,exports){
(function (global){
var THREE = (typeof window !== "undefined" ? window['THREE'] : typeof global !== "undefined" ? global['THREE'] : null);
var cpr = require('../cpr/cpr');
var CBuffer = require('cbuffer');
var blocksComponent = require('../components/blocks');
var dragCameraComponent = require('../components/dragcamera');
var editorConsole = require('./editorconsole');
var editorTools = require('./editortools');
var OffsetCommand = require('./commands/offsetcommand');
var Blocks = require('../components/blocks');

var Editor = function(object, app, input, camera, devConsole, config, palette, canvas) {

  this.object = object;

  this.app = app;

  this.input = input;

  this.camera = camera;

  this.devConsole = devConsole;

  this.config = config;

  this.palette = palette;

  this.canvas = canvas;

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

  this.frames = [];

  this.currentFrame = 0;

  this.cpr = null;

  this.cprPrefabs = null;

  this.toolNames = ['pen', 'select'];

  this.toolName = 'pen';

  this.tool = null;

  this.lockCamera = false;

  this.selections = [];

  this.frameRate = 4;

  this.playing = false;

  this.playTimeout = null;

  this.allFrames = false;

  this.reflectX = false;

  this.reflectY = false;

  this.reflectZ = false;
};

Editor.$inject = ['app', 'input', 'camera', 'devConsole', 'config', 'palette', 'canvas'];

Editor.prototype.start = function() {
  this.blocks = this.app.attach(this.object, blocksComponent);

  this.frames.push({
    data: this.blocks.serialize()
  });

  this.updateMaterial(this.blocks);

  this.selectedColor = this.palette[0][0];

  // Create color picker
  var self = this;
  this.cpr = cpr({
    palette: this.palette,
    onPick: function(color) {
      console.log(color);
      self.selectedColor = color;
    }
  });

  this.cprPrefabs = cpr({
    palette: [
      []
    ],
    onPick: function(obj) {},
    blockWidth: 48,
    blockHeight: 48
  });

  var saves = this.getSaves();
  for (var id in saves) {
    var save = saves[id];
    var firstFrame = save.frames[0];
    var imgData = this.screenshot(firstFrame.data);
    this.cprPrefabs.add(0, this.cprPrefabs.palette[0].length, {
      imgData: imgData
    });
  }

  this.cprPrefabs.domElement.style.bottom = '120px';

  editorConsole(this, this.devConsole);

  this.dragCamera = this.app.attach(this.camera, dragCameraComponent);

  this.updateSize(this.config['editor_default_size']);

  this.updateTool();
};

Editor.prototype.tick = function() {
  if (!this._started) {
    this.start();
    this._started = true;
  }

  this.tool.tick();

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
    var selectedCoords;
    if (this.selections.length > 0) {
      selectedCoords = this.selections;
    } else {
      selectedCoords = this.blocks.getAllCoords();
    }

    this.runCommand(new OffsetCommand(this, this.blocks, selectedCoords, offsetCoord));
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

  if (this.input.keyDown(';')) {
    this.lastFrame();
  }

  if (this.input.keyDown('\'')) {
    this.nextFrame();
  }

  if (this.input.keyDown('1')) {
    this.toolName = this.toolNames[0];
    this.updateTool();
  } else if (this.input.keyDown('2')) {
    this.toolName = this.toolNames[1];
    this.updateTool();
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
};

Editor.prototype.redo = function() {
  var command = this.redos.last();
  if (command == null) {
    return;
  }
  command.run();
  this.redos.pop();
  this.undos.push(command);
};

Editor.prototype.runCommand = function(command) {
  command.run();
  this.undos.push(command);
  this.redos = CBuffer(200);
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

Editor.prototype.addFrame = function() {
  this.frames.push({
    data: this.blocks.serialize()
  })

  this.currentFrame = this.frames.length - 1;
  this.updateCurrentFrame();
};

Editor.prototype.updateCurrentFrame = function() {
  if (this.frames.length === 0) {
    return;
  }

  var frame = this.frames[this.currentFrame];
  var data = frame.data;
  this.blocks.deserialize(data);
};

Editor.prototype.nextFrame = function() {
  if (this.frames.length === 0) {
    return;
  }

  this.saveCurrentFrame();

  this.currentFrame++;
  if (this.currentFrame === this.frames.length) {
    this.currentFrame = 0;
  }

  this.updateCurrentFrame();
};

Editor.prototype.lastFrame = function() {
  if (this.frames.length === 0) {
    return;
  }

  this.saveCurrentFrame();

  if (this.currentFrame > 0) {
    this.currentFrame--;
    this.updateCurrentFrame();
  }
};

Editor.prototype.saveCurrentFrame = function() {
  this.frames[this.currentFrame] = {
    data: this.blocks.serialize()
  };
};

Editor.prototype.serialize = function() {
  this.saveCurrentFrame();

  var json = {};
  json.frames = this.frames;

  return json;
};

Editor.prototype.deserialize = function(json) {
  this.frames = json.frames || [];
  this.updateCurrentFrame();
  this.updateSize(this.blocks.dim);
};

Editor.prototype.updateTool = function() {
  if (this.tool != null) {
    if (this.tool.dispose != null) {
      this.tool.dispose();
    }
  }

  var factory = editorTools[this.toolName];
  this.tool = factory(this);
};

Editor.prototype.setLockCamera = function(value) {
  this.lockCamera = value;
  this.dragCamera.lockRotation = value;
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

Editor.prototype.play = function() {
  if (this.frames <= 1) {
    return;
  }

  if (this.playing) {
    return;
  }

  this.playing = true;

  var self = this;
  var interval = function() {
    self.nextFrame(true);
    self.playTimeout = setTimeout(interval, 1000 / self.frameRate);
  };

  interval();
};

Editor.prototype.stop = function() {
  if (!this.playing) {
    return;
  }

  clearTimeout(this.playTimeout);
  this.playing = false;
};

Editor.prototype.createNew = function() {
  this.stop();
  this.frames = [];
  this.blocks.clear();
  this.updateSize(this.config['editor_default_size']);
};

Editor.prototype.screenshot = function(data) {
  var renderer = new THREE.WebGLRenderer({
    alpha: true
  });
  renderer.setClearColor(0xffffff, 0.0);

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

  return imgData;
};

Editor.prototype.getSaves = function() {
  try {
    return JSON.parse(window.localStorage.getItem('b_saves') || {});
  } catch (err) {
    return {};
  }
};

module.exports = Editor;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../components/blocks":18,"../components/dragcamera":20,"../cpr/cpr":26,"./commands/offsetcommand":30,"./editorconsole":34,"./editortools":35,"cbuffer":1}],34:[function(require,module,exports){
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

  devConsole.commands['save'] = function(args) {
    var saves;
    try {
      saves = JSON.parse(window.localStorage.getItem('b_saves') || {});
    } catch (err) {
      throw err;
    }

    var name = args._[0];

    if (name.length === 0) {
      throw new Error('Usage: save [name]');
    }

    saves[name] = editor.serialize();

    window.localStorage.setItem('b_saves', JSON.stringify(saves));
  };

  devConsole.commands['delete'] = function(args) {
    var saves;
    try {
      saves = JSON.parse(window.localStorage.getItem('b_saves') || {});
    } catch (err) {
      throw err;
    }

    var name = args._[0];

    if (name.length === 0) {
      throw new Error('Usage: delete [name]');
    }
    delete saves[name];

    window.localStorage.setItem('b_saves', JSON.stringify(saves));
  };

  devConsole.commands['load'] = function(args) {
    var saves;
    try {
      saves = JSON.parse(window.localStorage.getItem('b_saves') || {});
    } catch (err) {
      throw err;
    }

    var name = args._[0];

    if (saves[name] == null) {
      throw new Error('cannot find save named: ' + name);
    }

    editor.deserialize(saves[name]);
  };

  devConsole.commands['new'] = function(args) {
    editor.createNew();
  };

  devConsole.commands['frame'] = function(args) {
    var subCommand = args._[0];

    if (subCommand === 'add') {
      editor.addFrame();
    } else if (subCommand === 'next') {
      editor.nextFrame();
    } else if (subCommand === 'last') {
      editor.lastFrame();
    } else {
      throw new Error('Usage: frame [add|next|last]');
    }
  };

  devConsole.commands['tool'] = function(args) {
    if (editor.toolName !== args._[0]) {
      editor.toolName = args._[0];
      editor.updateTool();
    }
  };

  devConsole.commands['play'] = function(args) {
    var frameRate = args._[0] || 4;

    editor.frameRate = frameRate;
    editor.play();
  };

  devConsole.commands['stop'] = function(args) {
    editor.stop();
  };

  devConsole.commands['set'] = function(args) {
    var key = args._[0];
    var value = args._[1];

    if (editor[key] === undefined) {
      throw new Error('key not found: ' + key);
    }

    editor[key] = value;
  };

  devConsole.commands['export'] = function(args) {
    var name = args._[0];
    var saves;
    try {
      saves = JSON.parse(window.localStorage.getItem('b_saves') || {});
      if (saves[name] == null) {
        throw new Error('save not found for name: ' + name);
      }
      window.prompt('copy and paste', JSON.stringify(saves[name]));
    } catch (err) {
      throw err;
    }
  };

  devConsole.commands['reset'] = function(args) {
    if (args.f == null) {
      throw new Error('please reset -f to confirm');
    }

    if (args.f) {
      window.localStorage.setItem('b_saves', '{}');
    }
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

  devConsole.commands['screen'] = function(args) {
    editor.screenshot();
  };
}
},{"./editor":33}],35:[function(require,module,exports){
var PenTool = require('./tools/pentool');
var SelectTool = require('./tools/selecttool');

module.exports = {
  pen: function(editor) {
    return new PenTool(editor);
  },
  select: function(editor) {
    return new SelectTool(editor);
  }
};
},{"./tools/pentool":36,"./tools/selecttool":37}],36:[function(require,module,exports){
var SetCommand = require('../commands/setcommand');

var PenTool = function(editor) {

  this.editor = editor;

  this.camera = this.editor.camera;

  this.input = this.editor.input;

  this.blocks = this.editor.blocks;

  this.object = this.editor.object;

  this.objShadow = null;

  this.objShadowNeedsUpdate = false;

  this.objHighlight = null;

  this.sn = 0.0001;

  this.lastMouse = new THREE.Vector2();

  this.mouseSampleInterval = 4;
};

PenTool.prototype.tick = function() {
  var coord = this.getCoordToAdd(this.input.mouse);

  if (this.input.mouseDown() && coord != null) {
    this.editor.setLockCamera(true);
  }

  if (this.input.mouseUp()) {
    this.editor.setLockCamera(false);
  }

  if (coord != null) {
    this.updateHighlight(coord);
  }

  if (this.input.mouseDown() || this.input.mouseUp() || this.objShadowNeedsUpdate) {
    this.updateObjShadow();
    this.objShadowNeedsUpdate = false;
  }

  if (this.input.mouseDown(0)) {
    var selectedIndex = this.blocks.getOrAddColorIndex(this.editor.selectedColor);

    var coord = this.getCoordToAdd(this.input.mouse);
    if (!!coord) {
      if (this.blocks.getAtCoord(coord) !== selectedIndex) {
        this.editor.runCommand(new SetCommand(this.blocks, this.reflectCoords([coord]), selectedIndex));
        this.objShadowNeedsUpdate = true;
      }
    }
  }

  if (this.input.mouseDown(2)) {
    var selectedIndex = this.blocks.getOrAddColorIndex(this.editor.selectedColor);

    var coord = this.getCoordToRemove(this.input.mouse);
    if (!!coord) {
      if (!!this.blocks.getAtCoord(coord)) {
        this.editor.runCommand(new SetCommand(this.blocks, this.reflectCoords([coord]), 0));
        this.objShadowNeedsUpdate = true;
      }
    }
  }

  if (this.input.mouseHold(0) && this.editor.lockCamera && this.input.mouseMove()) {
    var selectedIndex = this.blocks.getOrAddColorIndex(this.editor.selectedColor);

    var points = this.getMousePoints(this.lastMouse, this.input.mouse, this.mouseSampleInterval);
    var coords = [];
    for (var i = 0; i < points.length; i++) {
      var coord = this.getCoordToAdd(points[i]);
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
  }

  if (this.input.mouseHold(2) && this.editor.lockCamera && this.input.mouseMove()) {
    var selectedIndex = this.blocks.getOrAddColorIndex(this.editor.selectedColor);

    var points = this.getMousePoints(this.lastMouse, this.input.mouse, this.mouseSampleInterval);
    var coords = [];
    for (var i = 0; i < points.length; i++) {
      var coord = this.getCoordToRemove(points[i], this.sn);
      if (!!coord) {
        if (!!this.blocks.getAtCoord(coord)) {
          coords.push(coord);
        }
      }
    }

    coords = uniqueCoords(coords);
    if (coords.length > 0) {
      this.editor.runCommand(new SetCommand(this.blocks, this.reflectCoords(coords), 0));
    }
  }

  this.lastMouse = this.input.mouse.clone();
};

PenTool.prototype.dispose = function() {
  this.object.remove(this.objHighlight);
  this.editor.setLockCamera(false);
};

PenTool.prototype.getCoordToAdd = function(point) {
  var objects = [];
  if (this.objShadow != null) objects.push(this.objShadow);
  if (this.editor.objGround != null) objects.push(this.editor.objGround);
  return this.getCoord(objects, point, -this.sn);
};

PenTool.prototype.getCoordToRemove = function(point) {
  var objects = [];
  if (this.objShadow != null) objects.push(this.objShadow);
  return this.getCoord(objects, point, this.sn);
};

PenTool.prototype.getCoord = function(objects, atPoint, delta) {
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
  diff = diff.setLength(diff.length() + delta || 0);
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

PenTool.prototype.updateObjShadow = function() {
  this.objShadow = this.editor.blocks.obj.clone();
  this.objShadow.updateMatrixWorld();
};


PenTool.prototype.updateHighlight = function(coord) {
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
},{"../commands/setcommand":32}],37:[function(require,module,exports){
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
  this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

  if (this.input.mouseHold(0)) {
    this.editor.setLockCamera(true);
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
    this.editor.setLockCamera(false);
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
},{"../commands/selectcommand":31,"point-in-polygon":13}],38:[function(require,module,exports){
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

},{"./assemblies/aeditor":15,"./assemblies/aground":16,"./assemblies/aplayer":17,"./components/playerCamera":21,"./core/b":24,"./data/config.json":27,"./data/palette.json":28,"./services/devconsole":39,"./services/materials":40,"./services/stats":41,"./systems/input":42,"./systems/renderer":43,"./voxel/voxel":48}],39:[function(require,module,exports){
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
  input.style.fontFamily = 'Arial';
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
  textSpan.style.fontFamily = 'Arial';
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
},{"keycode":8,"minimist":9}],40:[function(require,module,exports){
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

},{}],41:[function(require,module,exports){
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
},{"stats.js":14}],42:[function(require,module,exports){
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
},{"../utils/arrayutils":44,"keycode":8}],43:[function(require,module,exports){
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
},{"stats.js":14}],44:[function(require,module,exports){
var array = {
  indexOf: function(array, element) {
    for (var i = 0; i < array.length; i++) {
      if (array[i] === element) {
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
},{}],45:[function(require,module,exports){
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
},{}],46:[function(require,module,exports){
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
},{"./gravity":45}],47:[function(require,module,exports){
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
},{"greedy-mesher":2,"ndarray":10}],48:[function(require,module,exports){
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

},{"./gravityutils":46}],49:[function(require,module,exports){
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

},{"base64-js":50,"ieee754":51,"is-array":52}],50:[function(require,module,exports){
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

},{}],51:[function(require,module,exports){
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

},{}],52:[function(require,module,exports){

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

},{}]},{},[38])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY2J1ZmZlci9jYnVmZmVyLmpzIiwibm9kZV9tb2R1bGVzL2dyZWVkeS1tZXNoZXIvZ3JlZWR5LmpzIiwibm9kZV9tb2R1bGVzL2dyZWVkeS1tZXNoZXIvbm9kZV9tb2R1bGVzL2lvdGEtYXJyYXkvaW90YS5qcyIsIm5vZGVfbW9kdWxlcy9ncmVlZHktbWVzaGVyL25vZGVfbW9kdWxlcy90eXBlZGFycmF5LXBvb2wvbm9kZV9tb2R1bGVzL2JpdC10d2lkZGxlL3R3aWRkbGUuanMiLCJub2RlX21vZHVsZXMvZ3JlZWR5LW1lc2hlci9ub2RlX21vZHVsZXMvdHlwZWRhcnJheS1wb29sL25vZGVfbW9kdWxlcy9kdXAvZHVwLmpzIiwibm9kZV9tb2R1bGVzL2dyZWVkeS1tZXNoZXIvbm9kZV9tb2R1bGVzL3R5cGVkYXJyYXktcG9vbC9wb29sLmpzIiwibm9kZV9tb2R1bGVzL2dyZWVkeS1tZXNoZXIvbm9kZV9tb2R1bGVzL3VuaXEvdW5pcS5qcyIsIm5vZGVfbW9kdWxlcy9rZXljb2RlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL21pbmltaXN0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL25kYXJyYXkvbmRhcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9uZGFycmF5L25vZGVfbW9kdWxlcy9pcy1idWZmZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcG9pbnQtaW4tcG9seWdvbi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zdGF0cy5qcy9zcmMvU3RhdHMuanMiLCJzcmMvYXNzZW1ibGllcy9hZWRpdG9yLmpzIiwic3JjL2Fzc2VtYmxpZXMvYWdyb3VuZC5qcyIsInNyYy9hc3NlbWJsaWVzL2FwbGF5ZXIuanMiLCJzcmMvY29tcG9uZW50cy9ibG9ja3MuanMiLCJzcmMvY29tcG9uZW50cy9jaGFyYWN0ZXIuanMiLCJzcmMvY29tcG9uZW50cy9kcmFnY2FtZXJhLmpzIiwic3JjL2NvbXBvbmVudHMvcGxheWVyQ2FtZXJhLmpzIiwic3JjL2NvbXBvbmVudHMvcGxheWVyY29udHJvbC5qcyIsInNyYy9jb21wb25lbnRzL3JpZ2lkYm9keS5qcyIsInNyYy9jb3JlL2IuanMiLCJzcmMvY29yZS9ldmVudHMuanMiLCJzcmMvY3ByL2Nwci5qcyIsInNyYy9kYXRhL2NvbmZpZy5qc29uIiwic3JjL2RhdGEvcGFsZXR0ZS5qc29uIiwic3JjL2VkaXRvci9jb21tYW5kcy9ibG9ja2NvbW1hbmQuanMiLCJzcmMvZWRpdG9yL2NvbW1hbmRzL29mZnNldGNvbW1hbmQuanMiLCJzcmMvZWRpdG9yL2NvbW1hbmRzL3NlbGVjdGNvbW1hbmQuanMiLCJzcmMvZWRpdG9yL2NvbW1hbmRzL3NldGNvbW1hbmQuanMiLCJzcmMvZWRpdG9yL2VkaXRvci5qcyIsInNyYy9lZGl0b3IvZWRpdG9yY29uc29sZS5qcyIsInNyYy9lZGl0b3IvZWRpdG9ydG9vbHMuanMiLCJzcmMvZWRpdG9yL3Rvb2xzL3BlbnRvb2wuanMiLCJzcmMvZWRpdG9yL3Rvb2xzL3NlbGVjdHRvb2wuanMiLCJzcmMvbWFpbi5qcyIsInNyYy9zZXJ2aWNlcy9kZXZjb25zb2xlLmpzIiwic3JjL3NlcnZpY2VzL21hdGVyaWFscy5qcyIsInNyYy9zZXJ2aWNlcy9zdGF0cy5qcyIsInNyYy9zeXN0ZW1zL2lucHV0LmpzIiwic3JjL3N5c3RlbXMvcmVuZGVyZXIuanMiLCJzcmMvdXRpbHMvYXJyYXl1dGlscy5qcyIsInNyYy92b3hlbC9ncmF2aXR5LmpzIiwic3JjL3ZveGVsL2dyYXZpdHl1dGlscy5qcyIsInNyYy92b3hlbC9tZXNoZXIuanMiLCJzcmMvdm94ZWwvdm94ZWwuanMiLCIuLi8uLi8uLi8uLi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwiLi4vLi4vLi4vLi4vdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCIuLi8uLi8uLi8uLi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwiLi4vLi4vLi4vLi4vdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaXMtYXJyYXkvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDck1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNyTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN2VkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDcEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3ZOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pJQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDL2VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMvS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpIHtcblxuZnVuY3Rpb24gQ0J1ZmZlcigpIHtcblx0Ly8gaGFuZGxlIGNhc2VzIHdoZXJlIFwibmV3XCIga2V5d29yZCB3YXNuJ3QgdXNlZFxuXHRpZiAoISh0aGlzIGluc3RhbmNlb2YgQ0J1ZmZlcikpIHtcblx0XHQvLyBtdWx0aXBsZSBjb25kaXRpb25zIG5lZWQgdG8gYmUgY2hlY2tlZCB0byBwcm9wZXJseSBlbXVsYXRlIEFycmF5XG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxIHx8IHR5cGVvZiBhcmd1bWVudHNbMF0gIT09ICdudW1iZXInKSB7XG5cdFx0XHRyZXR1cm4gQ0J1ZmZlci5hcHBseShuZXcgQ0J1ZmZlcihhcmd1bWVudHMubGVuZ3RoKSwgYXJndW1lbnRzKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIG5ldyBDQnVmZmVyKGFyZ3VtZW50c1swXSk7XG5cdFx0fVxuXHR9XG5cdC8vIGlmIG5vIGFyZ3VtZW50cywgdGhlbiBub3RoaW5nIG5lZWRzIHRvIGJlIHNldFxuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcblx0dGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIEFyZ3VtZW50OiBZb3UgbXVzdCBwYXNzIGEgdmFsaWQgYnVmZmVyIGxlbmd0aCcpO1xuXHQvLyB0aGlzIGlzIHRoZSBzYW1lIGluIGVpdGhlciBzY2VuYXJpb1xuXHR0aGlzLnNpemUgPSB0aGlzLnN0YXJ0ID0gMDtcblx0Ly8gc2V0IHRvIGNhbGxiYWNrIGZuIGlmIGRhdGEgaXMgYWJvdXQgdG8gYmUgb3ZlcndyaXR0ZW5cblx0dGhpcy5vdmVyZmxvdyA9IG51bGw7XG5cdC8vIGVtdWxhdGUgQXJyYXkgYmFzZWQgb24gcGFzc2VkIGFyZ3VtZW50c1xuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEgfHwgdHlwZW9mIGFyZ3VtZW50c1swXSAhPT0gJ251bWJlcicpIHtcblx0XHR0aGlzLmRhdGEgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCk7XG5cdFx0dGhpcy5lbmQgPSAodGhpcy5sZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoKSAtIDE7XG5cdFx0dGhpcy5wdXNoLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdH0gZWxzZSB7XG5cdFx0dGhpcy5kYXRhID0gbmV3IEFycmF5KGFyZ3VtZW50c1swXSk7XG5cdFx0dGhpcy5lbmQgPSAodGhpcy5sZW5ndGggPSBhcmd1bWVudHNbMF0pIC0gMTtcblx0fVxuXHQvLyBuZWVkIHRvIGByZXR1cm4gdGhpc2Agc28gYHJldHVybiBDQnVmZmVyLmFwcGx5YCB3b3Jrc1xuXHRyZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gZGVmYXVsdENvbXBhcml0b3IoYSwgYikge1xuXHRyZXR1cm4gYSA9PSBiID8gMCA6IGEgPiBiID8gMSA6IC0xO1xufVxuXG5DQnVmZmVyLnByb3RvdHlwZSA9IHtcblx0Ly8gcHJvcGVybHkgc2V0IGNvbnN0cnVjdG9yXG5cdGNvbnN0cnVjdG9yIDogQ0J1ZmZlcixcblxuXHQvKiBtdXRhdG9yIG1ldGhvZHMgKi9cblx0Ly8gcG9wIGxhc3QgaXRlbVxuXHRwb3AgOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGl0ZW07XG5cdFx0aWYgKHRoaXMuc2l6ZSA9PT0gMCkgcmV0dXJuO1xuXHRcdGl0ZW0gPSB0aGlzLmRhdGFbdGhpcy5lbmRdO1xuXHRcdC8vIHJlbW92ZSB0aGUgcmVmZXJlbmNlIHRvIHRoZSBvYmplY3Qgc28gaXQgY2FuIGJlIGdhcmJhZ2UgY29sbGVjdGVkXG5cdFx0ZGVsZXRlIHRoaXMuZGF0YVt0aGlzLmVuZF07XG5cdFx0dGhpcy5lbmQgPSAodGhpcy5lbmQgLSAxICsgdGhpcy5sZW5ndGgpICUgdGhpcy5sZW5ndGg7XG5cdFx0dGhpcy5zaXplLS07XG5cdFx0cmV0dXJuIGl0ZW07XG5cdH0sXG5cdC8vIHB1c2ggaXRlbSB0byB0aGUgZW5kXG5cdHB1c2ggOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGkgPSAwO1xuXHRcdC8vIGNoZWNrIGlmIG92ZXJmbG93IGlzIHNldCwgYW5kIGlmIGRhdGEgaXMgYWJvdXQgdG8gYmUgb3ZlcndyaXR0ZW5cblx0XHRpZiAodGhpcy5vdmVyZmxvdyAmJiB0aGlzLnNpemUgKyBhcmd1bWVudHMubGVuZ3RoID4gdGhpcy5sZW5ndGgpIHtcblx0XHRcdC8vIGNhbGwgb3ZlcmZsb3cgZnVuY3Rpb24gYW5kIHNlbmQgZGF0YSB0aGF0J3MgYWJvdXQgdG8gYmUgb3ZlcndyaXR0ZW5cblx0XHRcdGZvciAoOyBpIDwgdGhpcy5zaXplICsgYXJndW1lbnRzLmxlbmd0aCAtIHRoaXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0dGhpcy5vdmVyZmxvdyh0aGlzLmRhdGFbKHRoaXMuZW5kICsgaSArIDEpICUgdGhpcy5sZW5ndGhdLCB0aGlzKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0Ly8gcHVzaCBpdGVtcyB0byB0aGUgZW5kLCB3cmFwcGluZyBhbmQgZXJhc2luZyBleGlzdGluZyBpdGVtc1xuXHRcdC8vIHVzaW5nIGFyZ3VtZW50cyB2YXJpYWJsZSBkaXJlY3RseSB0byByZWR1Y2UgZ2MgZm9vdHByaW50XG5cdFx0Zm9yIChpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dGhpcy5kYXRhWyh0aGlzLmVuZCArIGkgKyAxKSAlIHRoaXMubGVuZ3RoXSA9IGFyZ3VtZW50c1tpXTtcblx0XHR9XG5cdFx0Ly8gcmVjYWxjdWxhdGUgc2l6ZVxuXHRcdGlmICh0aGlzLnNpemUgPCB0aGlzLmxlbmd0aCkge1xuXHRcdFx0aWYgKHRoaXMuc2l6ZSArIGkgPiB0aGlzLmxlbmd0aCkgdGhpcy5zaXplID0gdGhpcy5sZW5ndGg7XG5cdFx0XHRlbHNlIHRoaXMuc2l6ZSArPSBpO1xuXHRcdH1cblx0XHQvLyByZWNhbGN1bGF0ZSBlbmRcblx0XHR0aGlzLmVuZCA9ICh0aGlzLmVuZCArIGkpICUgdGhpcy5sZW5ndGg7XG5cdFx0Ly8gcmVjYWxjdWxhdGUgc3RhcnRcblx0XHR0aGlzLnN0YXJ0ID0gKHRoaXMubGVuZ3RoICsgdGhpcy5lbmQgLSB0aGlzLnNpemUgKyAxKSAlIHRoaXMubGVuZ3RoO1xuXHRcdC8vIHJldHVybiBudW1iZXIgY3VycmVudCBudW1iZXIgb2YgaXRlbXMgaW4gQ0J1ZmZlclxuXHRcdHJldHVybiB0aGlzLnNpemU7XG5cdH0sXG5cdC8vIHJldmVyc2Ugb3JkZXIgb2YgdGhlIGJ1ZmZlclxuXHRyZXZlcnNlIDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpID0gMCxcblx0XHRcdHRtcDtcblx0XHRmb3IgKDsgaSA8IH5+KHRoaXMuc2l6ZSAvIDIpOyBpKyspIHtcblx0XHRcdHRtcCA9IHRoaXMuZGF0YVsodGhpcy5zdGFydCArIGkpICUgdGhpcy5sZW5ndGhdO1xuXHRcdFx0dGhpcy5kYXRhWyh0aGlzLnN0YXJ0ICsgaSkgJSB0aGlzLmxlbmd0aF0gPSB0aGlzLmRhdGFbKHRoaXMuc3RhcnQgKyAodGhpcy5zaXplIC0gaSAtIDEpKSAlIHRoaXMubGVuZ3RoXTtcblx0XHRcdHRoaXMuZGF0YVsodGhpcy5zdGFydCArICh0aGlzLnNpemUgLSBpIC0gMSkpICUgdGhpcy5sZW5ndGhdID0gdG1wO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0Ly8gcm90YXRlIGJ1ZmZlciB0byB0aGUgbGVmdCBieSBjbnRyLCBvciBieSAxXG5cdHJvdGF0ZUxlZnQgOiBmdW5jdGlvbiAoY250cikge1xuXHRcdGlmICh0eXBlb2YgY250ciA9PT0gJ3VuZGVmaW5lZCcpIGNudHIgPSAxO1xuXHRcdGlmICh0eXBlb2YgY250ciAhPT0gJ251bWJlcicpIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IG11c3QgYmUgYSBudW1iZXJcIik7XG5cdFx0d2hpbGUgKC0tY250ciA+PSAwKSB7XG5cdFx0XHR0aGlzLnB1c2godGhpcy5zaGlmdCgpKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdC8vIHJvdGF0ZSBidWZmZXIgdG8gdGhlIHJpZ2h0IGJ5IGNudHIsIG9yIGJ5IDFcblx0cm90YXRlUmlnaHQgOiBmdW5jdGlvbiAoY250cikge1xuXHRcdGlmICh0eXBlb2YgY250ciA9PT0gJ3VuZGVmaW5lZCcpIGNudHIgPSAxO1xuXHRcdGlmICh0eXBlb2YgY250ciAhPT0gJ251bWJlcicpIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IG11c3QgYmUgYSBudW1iZXJcIik7XG5cdFx0d2hpbGUgKC0tY250ciA+PSAwKSB7XG5cdFx0XHR0aGlzLnVuc2hpZnQodGhpcy5wb3AoKSk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHQvLyByZW1vdmUgYW5kIHJldHVybiBmaXJzdCBpdGVtXG5cdHNoaWZ0IDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpdGVtO1xuXHRcdC8vIGNoZWNrIGlmIHRoZXJlIGFyZSBhbnkgaXRlbXMgaW4gQ0J1ZmZcblx0XHRpZiAodGhpcy5zaXplID09PSAwKSByZXR1cm47XG5cdFx0Ly8gc3RvcmUgZmlyc3QgaXRlbSBmb3IgcmV0dXJuXG5cdFx0aXRlbSA9IHRoaXMuZGF0YVt0aGlzLnN0YXJ0XTtcblx0XHQvLyByZWNhbGN1bGF0ZSBzdGFydCBvZiBDQnVmZmVyXG5cdFx0dGhpcy5zdGFydCA9ICh0aGlzLnN0YXJ0ICsgMSkgJSB0aGlzLmxlbmd0aDtcblx0XHQvLyBkZWNyZW1lbnQgc2l6ZVxuXHRcdHRoaXMuc2l6ZS0tO1xuXHRcdHJldHVybiBpdGVtO1xuXHR9LFxuXHQvLyBzb3J0IGl0ZW1zXG5cdHNvcnQgOiBmdW5jdGlvbiAoZm4pIHtcblx0XHR0aGlzLmRhdGEuc29ydChmbiB8fCBkZWZhdWx0Q29tcGFyaXRvcik7XG5cdFx0dGhpcy5zdGFydCA9IDA7XG5cdFx0dGhpcy5lbmQgPSB0aGlzLnNpemUgLSAxO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHQvLyBhZGQgaXRlbSB0byBiZWdpbm5pbmcgb2YgYnVmZmVyXG5cdHVuc2hpZnQgOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGkgPSAwO1xuXHRcdC8vIGNoZWNrIGlmIG92ZXJmbG93IGlzIHNldCwgYW5kIGlmIGRhdGEgaXMgYWJvdXQgdG8gYmUgb3ZlcndyaXR0ZW5cblx0XHRpZiAodGhpcy5vdmVyZmxvdyAmJiB0aGlzLnNpemUgKyBhcmd1bWVudHMubGVuZ3RoID4gdGhpcy5sZW5ndGgpIHtcblx0XHRcdC8vIGNhbGwgb3ZlcmZsb3cgZnVuY3Rpb24gYW5kIHNlbmQgZGF0YSB0aGF0J3MgYWJvdXQgdG8gYmUgb3ZlcndyaXR0ZW5cblx0XHRcdGZvciAoOyBpIDwgdGhpcy5zaXplICsgYXJndW1lbnRzLmxlbmd0aCAtIHRoaXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0dGhpcy5vdmVyZmxvdyh0aGlzLmRhdGFbdGhpcy5lbmQgLSAoaSAlIHRoaXMubGVuZ3RoKV0sIHRoaXMpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRmb3IgKGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0aGlzLmRhdGFbKHRoaXMubGVuZ3RoICsgdGhpcy5zdGFydCAtIChpICUgdGhpcy5sZW5ndGgpIC0gMSkgJSB0aGlzLmxlbmd0aF0gPSBhcmd1bWVudHNbaV07XG5cdFx0fVxuXHRcdGlmICh0aGlzLmxlbmd0aCAtIHRoaXMuc2l6ZSAtIGkgPCAwKSB7XG5cdFx0XHR0aGlzLmVuZCArPSB0aGlzLmxlbmd0aCAtIHRoaXMuc2l6ZSAtIGk7XG5cdFx0XHRpZiAodGhpcy5lbmQgPCAwKSB0aGlzLmVuZCA9IHRoaXMubGVuZ3RoICsgKHRoaXMuZW5kICUgdGhpcy5sZW5ndGgpO1xuXHRcdH1cblx0XHRpZiAodGhpcy5zaXplIDwgdGhpcy5sZW5ndGgpIHtcblx0XHRcdGlmICh0aGlzLnNpemUgKyBpID4gdGhpcy5sZW5ndGgpIHRoaXMuc2l6ZSA9IHRoaXMubGVuZ3RoO1xuXHRcdFx0ZWxzZSB0aGlzLnNpemUgKz0gaTtcblx0XHR9XG5cdFx0dGhpcy5zdGFydCAtPSBhcmd1bWVudHMubGVuZ3RoO1xuXHRcdGlmICh0aGlzLnN0YXJ0IDwgMCkgdGhpcy5zdGFydCA9IHRoaXMubGVuZ3RoICsgKHRoaXMuc3RhcnQgJSB0aGlzLmxlbmd0aCk7XG5cdFx0cmV0dXJuIHRoaXMuc2l6ZTtcblx0fSxcblxuXHQvKiBhY2Nlc3NvciBtZXRob2RzICovXG5cdC8vIHJldHVybiBpbmRleCBvZiBmaXJzdCBtYXRjaGVkIGVsZW1lbnRcblx0aW5kZXhPZiA6IGZ1bmN0aW9uIChhcmcsIGlkeCkge1xuXHRcdGlmICghaWR4KSBpZHggPSAwO1xuXHRcdGZvciAoOyBpZHggPCB0aGlzLnNpemU7IGlkeCsrKSB7XG5cdFx0XHRpZiAodGhpcy5kYXRhWyh0aGlzLnN0YXJ0ICsgaWR4KSAlIHRoaXMubGVuZ3RoXSA9PT0gYXJnKSByZXR1cm4gaWR4O1xuXHRcdH1cblx0XHRyZXR1cm4gLTE7XG5cdH0sXG5cdC8vIHJldHVybiBsYXN0IGluZGV4IG9mIHRoZSBmaXJzdCBtYXRjaFxuXHRsYXN0SW5kZXhPZiA6IGZ1bmN0aW9uIChhcmcsIGlkeCkge1xuXHRcdGlmICghaWR4KSBpZHggPSB0aGlzLnNpemUgLSAxO1xuXHRcdGZvciAoOyBpZHggPj0gMDsgaWR4LS0pIHtcblx0XHRcdGlmICh0aGlzLmRhdGFbKHRoaXMuc3RhcnQgKyBpZHgpICUgdGhpcy5sZW5ndGhdID09PSBhcmcpIHJldHVybiBpZHg7XG5cdFx0fVxuXHRcdHJldHVybiAtMTtcblx0fSxcblxuXHQvLyByZXR1cm4gdGhlIGluZGV4IGFuIGl0ZW0gd291bGQgYmUgaW5zZXJ0ZWQgdG8gaWYgdGhpc1xuXHQvLyBpcyBhIHNvcnRlZCBjaXJjdWxhciBidWZmZXJcblx0c29ydGVkSW5kZXggOiBmdW5jdGlvbih2YWx1ZSwgY29tcGFyaXRvciwgY29udGV4dCkge1xuXHRcdGNvbXBhcml0b3IgPSBjb21wYXJpdG9yIHx8IGRlZmF1bHRDb21wYXJpdG9yO1xuXHRcdHZhciBsb3cgPSB0aGlzLnN0YXJ0LFxuXHRcdFx0aGlnaCA9IHRoaXMuc2l6ZSAtIDE7XG5cblx0XHQvLyBUcmlja3kgcGFydCBpcyBmaW5kaW5nIGlmIGl0cyBiZWZvcmUgb3IgYWZ0ZXIgdGhlIHBpdm90XG5cdFx0Ly8gd2UgY2FuIGdldCB0aGlzIGluZm8gYnkgY2hlY2tpbmcgaWYgdGhlIHRhcmdldCBpcyBsZXNzIHRoYW5cblx0XHQvLyB0aGUgbGFzdCBpdGVtLiBBZnRlciB0aGF0IGl0J3MganVzdCBhIHR5cGljYWwgYmluYXJ5IHNlYXJjaC5cblx0XHRpZiAobG93ICYmIGNvbXBhcml0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgdGhpcy5kYXRhW2hpZ2hdKSA+IDApIHtcblx0XHRcdGxvdyA9IDAsIGhpZ2ggPSB0aGlzLmVuZDtcblx0XHR9XG5cblx0XHR3aGlsZSAobG93IDwgaGlnaCkge1xuXHRcdCAgdmFyIG1pZCA9IChsb3cgKyBoaWdoKSA+Pj4gMTtcblx0XHQgIGlmIChjb21wYXJpdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIHRoaXMuZGF0YVttaWRdKSA+IDApIGxvdyA9IG1pZCArIDE7XG5cdFx0ICBlbHNlIGhpZ2ggPSBtaWQ7XG5cdFx0fVxuXHRcdC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzE4NjE4MjczLzE1MTc5MTlcblx0XHRyZXR1cm4gKCgobG93IC0gdGhpcy5zdGFydCkgJSB0aGlzLnNpemUpICsgdGhpcy5zaXplKSAlIHRoaXMuc2l6ZTtcblx0fSxcblxuXHQvKiBpdGVyYXRpb24gbWV0aG9kcyAqL1xuXHQvLyBjaGVjayBldmVyeSBpdGVtIGluIHRoZSBhcnJheSBhZ2FpbnN0IGEgdGVzdFxuXHRldmVyeSA6IGZ1bmN0aW9uIChjYWxsYmFjaywgY29udGV4dCkge1xuXHRcdHZhciBpID0gMDtcblx0XHRmb3IgKDsgaSA8IHRoaXMuc2l6ZTsgaSsrKSB7XG5cdFx0XHRpZiAoIWNhbGxiYWNrLmNhbGwoY29udGV4dCwgdGhpcy5kYXRhWyh0aGlzLnN0YXJ0ICsgaSkgJSB0aGlzLmxlbmd0aF0sIGksIHRoaXMpKVxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdHJldHVybiB0cnVlO1xuXHR9LFxuXHQvLyBsb29wIHRocm91Z2ggZWFjaCBpdGVtIGluIGJ1ZmZlclxuXHQvLyBUT0RPOiBmaWd1cmUgb3V0IGhvdyB0byBlbXVsYXRlIEFycmF5IHVzZSBiZXR0ZXJcblx0Zm9yRWFjaCA6IGZ1bmN0aW9uIChjYWxsYmFjaywgY29udGV4dCkge1xuXHRcdHZhciBpID0gMDtcblx0XHRmb3IgKDsgaSA8IHRoaXMuc2l6ZTsgaSsrKSB7XG5cdFx0XHRjYWxsYmFjay5jYWxsKGNvbnRleHQsIHRoaXMuZGF0YVsodGhpcy5zdGFydCArIGkpICUgdGhpcy5sZW5ndGhdLCBpLCB0aGlzKTtcblx0XHR9XG5cdH0sXG5cdC8vIGNoZWNrIGl0ZW1zIGFnYWlucyB0ZXN0IHVudGlsIG9uZSByZXR1cm5zIHRydWVcblx0Ly8gVE9ETzogZmlndXJlIG91dCBob3cgdG8gZW11bGRhdGUgQXJyYXkgdXNlIGJldHRlclxuXHRzb21lIDogZnVuY3Rpb24gKGNhbGxiYWNrLCBjb250ZXh0KSB7XG5cdFx0dmFyIGkgPSAwO1xuXHRcdGZvciAoOyBpIDwgdGhpcy5zaXplOyBpKyspIHtcblx0XHRcdGlmIChjYWxsYmFjay5jYWxsKGNvbnRleHQsIHRoaXMuZGF0YVsodGhpcy5zdGFydCArIGkpICUgdGhpcy5sZW5ndGhdLCBpLCB0aGlzKSlcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fSxcblx0Ly8gY2FsY3VsYXRlIHRoZSBhdmVyYWdlIHZhbHVlIG9mIGEgY2lyY3VsYXIgYnVmZmVyXG5cdGF2ZyA6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpcy5zaXplID09IDAgPyAwIDogKHRoaXMuc3VtKCkgLyB0aGlzLnNpemUpO1xuXHR9LFxuXHQvLyBsb29wIHRocm91Z2ggZWFjaCBpdGVtIGluIGJ1ZmZlciBhbmQgY2FsY3VsYXRlIHN1bVxuXHRzdW0gOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGluZGV4ID0gdGhpcy5zaXplO1xuXHRcdHZhciBzID0gMDtcblx0XHR3aGlsZSAoaW5kZXgtLSkgcyArPSB0aGlzLmRhdGFbaW5kZXhdO1xuXHRcdHJldHVybiBzO1xuXHR9LFxuXHQvLyBsb29wIHRocm91Z2ggZWFjaCBpdGVtIGluIGJ1ZmZlciBhbmQgY2FsY3VsYXRlIG1lZGlhblxuXHRtZWRpYW4gOiBmdW5jdGlvbiAoKSB7XG5cdFx0aWYgKHRoaXMuc2l6ZSA9PT0gMClcblx0XHRcdHJldHVybiAwO1xuXHRcdHZhciB2YWx1ZXMgPSB0aGlzLnNsaWNlKCkuc29ydChkZWZhdWx0Q29tcGFyaXRvcik7XG5cdFx0dmFyIGhhbGYgPSBNYXRoLmZsb29yKHZhbHVlcy5sZW5ndGggLyAyKTtcblx0XHRpZih2YWx1ZXMubGVuZ3RoICUgMilcblx0XHRcdHJldHVybiB2YWx1ZXNbaGFsZl07XG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuICh2YWx1ZXNbaGFsZi0xXSArIHZhbHVlc1toYWxmXSkgLyAyLjA7XG5cdH0sXG5cdC8qIHV0aWxpdHkgbWV0aG9kcyAqL1xuXHQvLyByZXNldCBwb2ludGVycyB0byBidWZmZXIgd2l0aCB6ZXJvIGl0ZW1zXG5cdC8vIG5vdGU6IHRoaXMgd2lsbCBub3QgcmVtb3ZlIHZhbHVlcyBpbiBjYnVmZmVyLCBzbyBpZiBmb3Igc2VjdXJpdHkgdmFsdWVzXG5cdC8vICAgICAgIG5lZWQgdG8gYmUgb3ZlcndyaXR0ZW4sIHJ1biBgLmZpbGwobnVsbCkuZW1wdHkoKWBcblx0ZW1wdHkgOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGkgPSAwO1xuXHRcdHRoaXMuc2l6ZSA9IHRoaXMuc3RhcnQgPSAwO1xuXHRcdHRoaXMuZW5kID0gdGhpcy5sZW5ndGggLSAxO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHQvLyBmaWxsIGFsbCBwbGFjZXMgd2l0aCBwYXNzZWQgdmFsdWUgb3IgZnVuY3Rpb25cblx0ZmlsbCA6IGZ1bmN0aW9uIChhcmcpIHtcblx0XHR2YXIgaSA9IDA7XG5cdFx0aWYgKHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdHdoaWxlKHRoaXMuZGF0YVtpXSA9IGFyZygpLCArK2kgPCB0aGlzLmxlbmd0aCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHdoaWxlKHRoaXMuZGF0YVtpXSA9IGFyZywgKytpIDwgdGhpcy5sZW5ndGgpO1xuXHRcdH1cblx0XHQvLyByZXBvc2l0aW9uIHN0YXJ0L2VuZFxuXHRcdHRoaXMuc3RhcnQgPSAwO1xuXHRcdHRoaXMuZW5kID0gdGhpcy5sZW5ndGggLSAxO1xuXHRcdHRoaXMuc2l6ZSA9IHRoaXMubGVuZ3RoO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHQvLyByZXR1cm4gZmlyc3QgaXRlbSBpbiBidWZmZXJcblx0Zmlyc3QgOiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuZGF0YVt0aGlzLnN0YXJ0XTtcblx0fSxcblx0Ly8gcmV0dXJuIGxhc3QgaXRlbSBpbiBidWZmZXJcblx0bGFzdCA6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpcy5kYXRhW3RoaXMuZW5kXTtcblx0fSxcblx0Ly8gcmV0dXJuIHNwZWNpZmljIGluZGV4IGluIGJ1ZmZlclxuXHRnZXQgOiBmdW5jdGlvbiAoYXJnKSB7XG5cdFx0cmV0dXJuIHRoaXMuZGF0YVsodGhpcy5zdGFydCArIGFyZykgJSB0aGlzLmxlbmd0aF07XG5cdH0sXG5cdGlzRnVsbCA6IGZ1bmN0aW9uIChhcmcpIHtcblx0XHRyZXR1cm4gdGhpcy5sZW5ndGggPT09IHRoaXMuc2l6ZTtcblx0fSxcblx0Ly8gc2V0IHZhbHVlIGF0IHNwZWNpZmllZCBpbmRleFxuXHRzZXQgOiBmdW5jdGlvbiAoaWR4LCBhcmcpIHtcblx0XHRyZXR1cm4gdGhpcy5kYXRhWyh0aGlzLnN0YXJ0ICsgaWR4KSAlIHRoaXMubGVuZ3RoXSA9IGFyZztcblx0fSxcblx0Ly8gcmV0dXJuIGNsZWFuIGFycmF5IG9mIHZhbHVlc1xuXHR0b0FycmF5IDogZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLnNsaWNlKCk7XG5cdH0sXG5cdC8vIHNsaWNlIHRoZSBidWZmZXIgdG8gYW4gYXJyYWF5XG5cdHNsaWNlIDogZnVuY3Rpb24gKHN0YXJ0LCBlbmQpIHtcblx0XHR2YXIgbGVuZ3RoID0gdGhpcy5zaXplO1xuXG5cdFx0c3RhcnQgPSArc3RhcnQgfHwgMDtcblxuXHRcdGlmIChzdGFydCA8IDApIHtcblx0XHRcdGlmIChzdGFydCA+PSBlbmQpXG5cdFx0XHRcdHJldHVybiBbXTtcblx0XHRcdHN0YXJ0ID0gKC1zdGFydCA+IGxlbmd0aCkgPyAwIDogbGVuZ3RoICsgc3RhcnQ7XG5cdFx0fVxuXG5cdFx0aWYgKGVuZCA9PSBudWxsIHx8IGVuZCA+IGxlbmd0aClcblx0XHRcdGVuZCA9IGxlbmd0aDtcblx0XHRlbHNlIGlmIChlbmQgPCAwKVxuXHRcdFx0ZW5kICs9IGxlbmd0aDtcblx0XHRlbHNlXG5cdFx0XHRlbmQgPSArZW5kIHx8IDA7XG5cblx0XHRsZW5ndGggPSBzdGFydCA8IGVuZCA/IGVuZCAtIHN0YXJ0IDogMDtcblxuXHRcdHZhciByZXN1bHQgPSBBcnJheShsZW5ndGgpO1xuXHRcdGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcblx0XHRcdHJlc3VsdFtpbmRleF0gPSB0aGlzLmRhdGFbKHRoaXMuc3RhcnQgKyBzdGFydCArIGluZGV4KSAlIHRoaXMubGVuZ3RoXTtcblx0XHR9XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxufTtcblxuaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSBtb2R1bGUuZXhwb3J0cyA9IENCdWZmZXI7XG5lbHNlIGdsb2JhbC5DQnVmZmVyID0gQ0J1ZmZlcjtcblxufSh0aGlzKSk7XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgcG9vbCA9IHJlcXVpcmUoXCJ0eXBlZGFycmF5LXBvb2xcIilcbnZhciB1bmlxID0gcmVxdWlyZShcInVuaXFcIilcbnZhciBpb3RhID0gcmVxdWlyZShcImlvdGEtYXJyYXlcIilcblxuZnVuY3Rpb24gZ2VuZXJhdGVNZXNoZXIob3JkZXIsIHNraXAsIG1lcmdlLCBhcHBlbmQsIG51bV9vcHRpb25zLCBvcHRpb25zLCB1c2VHZXR0ZXIpIHtcbiAgdmFyIGNvZGUgPSBbXVxuICB2YXIgZCA9IG9yZGVyLmxlbmd0aFxuICB2YXIgaSwgaiwga1xuICBcbiAgLy9CdWlsZCBhcmd1bWVudHMgZm9yIGFwcGVuZCBtYWNyb1xuICB2YXIgYXBwZW5kX2FyZ3MgPSBuZXcgQXJyYXkoMipkKzErbnVtX29wdGlvbnMpXG4gIGZvcihpPTA7IGk8ZDsgKytpKSB7XG4gICAgYXBwZW5kX2FyZ3NbaV0gPSBcImlcIitpXG4gIH1cbiAgZm9yKGk9MDsgaTxkOyArK2kpIHtcbiAgICBhcHBlbmRfYXJnc1tpK2RdID0gXCJqXCIraVxuICB9XG4gIGFwcGVuZF9hcmdzWzIqZF0gPSBcIm92YWxcIlxuICBcbiAgdmFyIG9wdF9hcmdzID0gbmV3IEFycmF5KG51bV9vcHRpb25zKVxuICBmb3IoaT0wOyBpPG51bV9vcHRpb25zOyArK2kpIHtcbiAgICBvcHRfYXJnc1tpXSA9IFwib3B0XCIraVxuICAgIGFwcGVuZF9hcmdzWzIqZCsxK2ldID0gXCJvcHRcIitpXG4gIH1cblxuICAvL1VucGFjayBzdHJpZGUgYW5kIHNoYXBlIGFycmF5cyBpbnRvIHZhcmlhYmxlc1xuICBjb2RlLnB1c2goXCJ2YXIgZGF0YT1hcnJheS5kYXRhLG9mZnNldD1hcnJheS5vZmZzZXQsc2hhcGU9YXJyYXkuc2hhcGUsc3RyaWRlPWFycmF5LnN0cmlkZVwiKVxuICBmb3IodmFyIGk9MDsgaTxkOyArK2kpIHtcbiAgICBjb2RlLnB1c2goW1widmFyIHN0cmlkZVwiLGksXCI9c3RyaWRlW1wiLG9yZGVyW2ldLFwiXXwwLHNoYXBlXCIsaSxcIj1zaGFwZVtcIixvcmRlcltpXSxcIl18MFwiXS5qb2luKFwiXCIpKVxuICAgIGlmKGkgPiAwKSB7XG4gICAgICBjb2RlLnB1c2goW1widmFyIGFzdGVwXCIsaSxcIj0oc3RyaWRlXCIsaSxcIi1zdHJpZGVcIixpLTEsXCIqc2hhcGVcIixpLTEsXCIpfDBcIl0uam9pbihcIlwiKSlcbiAgICB9IGVsc2Uge1xuICAgICAgY29kZS5wdXNoKFtcInZhciBhc3RlcFwiLGksXCI9c3RyaWRlXCIsaSxcInwwXCJdLmpvaW4oXCJcIikpXG4gICAgfVxuICAgIGlmKGkgPiAwKSB7XG4gICAgICBjb2RlLnB1c2goW1widmFyIHZzdGVwXCIsaSxcIj0odnN0ZXBcIixpLTEsXCIqc2hhcGVcIixpLTEsXCIpfDBcIl0uam9pbihcIlwiKSlcbiAgICB9IGVsc2Uge1xuICAgICAgY29kZS5wdXNoKFtcInZhciB2c3RlcFwiLGksXCI9MVwiXS5qb2luKFwiXCIpKVxuICAgIH1cbiAgICBjb2RlLnB1c2goW1widmFyIGlcIixpLFwiPTAsalwiLGksXCI9MCxrXCIsaSxcIj0wLHVzdGVwXCIsaSxcIj12c3RlcFwiLGksXCJ8MCxic3RlcFwiLGksXCI9YXN0ZXBcIixpLFwifDBcIl0uam9pbihcIlwiKSlcbiAgfVxuICBcbiAgLy9Jbml0aWFsaXplIHBvaW50ZXJzXG4gIGNvZGUucHVzaChcInZhciBhX3B0cj1vZmZzZXQ+Pj4wLGJfcHRyPTAsdV9wdHI9MCx2X3B0cj0wLGk9MCxkPTAsdmFsPTAsb3ZhbD0wXCIpXG4gIFxuICAvL0luaXRpYWxpemUgY291bnRcbiAgY29kZS5wdXNoKFwidmFyIGNvdW50PVwiICsgaW90YShkKS5tYXAoZnVuY3Rpb24oaSkgeyByZXR1cm4gXCJzaGFwZVwiK2l9KS5qb2luKFwiKlwiKSlcbiAgY29kZS5wdXNoKFwidmFyIHZpc2l0ZWQ9bWFsbG9jVWludDgoY291bnQpXCIpXG4gIFxuICAvL1plcm8gb3V0IHZpc2l0ZWQgbWFwXG4gIGNvZGUucHVzaChcImZvcig7aTxjb3VudDsrK2kpe3Zpc2l0ZWRbaV09MH1cIilcbiAgXG4gIC8vQmVnaW4gdHJhdmVyc2FsXG4gIGZvcihpPWQtMTsgaT49MDsgLS1pKSB7XG4gICAgY29kZS5wdXNoKFtcImZvcihpXCIsaSxcIj0wO2lcIixpLFwiPHNoYXBlXCIsaSxcIjsrK2lcIixpLFwiKXtcIl0uam9pbihcIlwiKSlcbiAgfVxuICBjb2RlLnB1c2goXCJpZighdmlzaXRlZFt2X3B0cl0pe1wiKVxuICBcbiAgICBpZih1c2VHZXR0ZXIpIHtcbiAgICAgIGNvZGUucHVzaChcInZhbD1kYXRhLmdldChhX3B0cilcIilcbiAgICB9IGVsc2Uge1xuICAgICAgY29kZS5wdXNoKFwidmFsPWRhdGFbYV9wdHJdXCIpXG4gICAgfVxuICBcbiAgICBpZihza2lwKSB7XG4gICAgICBjb2RlLnB1c2goXCJpZighc2tpcCh2YWwpKXtcIilcbiAgICB9IGVsc2Uge1xuICAgICAgY29kZS5wdXNoKFwiaWYodmFsIT09MCl7XCIpXG4gICAgfVxuICBcbiAgICAgIC8vU2F2ZSB2YWwgdG8gb3ZhbFxuICAgICAgY29kZS5wdXNoKFwib3ZhbCA9IHZhbFwiKVxuICBcbiAgICAgIC8vR2VuZXJhdGUgbWVyZ2luZyBjb2RlXG4gICAgICBmb3IoaT0wOyBpPGQ7ICsraSkge1xuICAgICAgICBjb2RlLnB1c2goXCJ1X3B0cj12X3B0cit2c3RlcFwiK2kpXG4gICAgICAgIGNvZGUucHVzaChcImJfcHRyPWFfcHRyK3N0cmlkZVwiK2kpXG4gICAgICAgIGNvZGUucHVzaChbXCJqXCIsaSxcIl9sb29wOiBmb3IoalwiLGksXCI9MStpXCIsaSxcIjtqXCIsaSxcIjxzaGFwZVwiLGksXCI7KytqXCIsaSxcIil7XCJdLmpvaW4oXCJcIikpXG4gICAgICAgIGZvcihqPWktMTsgaj49MDsgLS1qKSB7XG4gICAgICAgICAgY29kZS5wdXNoKFtcImZvcihrXCIsaixcIj1pXCIsaixcIjtrXCIsaixcIjxqXCIsaixcIjsrK2tcIixqLFwiKXtcIl0uam9pbihcIlwiKSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgICAvL0NoZWNrIGlmIHdlIGNhbiBtZXJnZSB0aGlzIHZveGVsXG4gICAgICAgICAgY29kZS5wdXNoKFwiaWYodmlzaXRlZFt1X3B0cl0pIHsgYnJlYWsgalwiK2krXCJfbG9vcDsgfVwiKVxuICAgICAgICBcbiAgICAgICAgICBpZih1c2VHZXR0ZXIpIHtcbiAgICAgICAgICAgIGNvZGUucHVzaChcInZhbD1kYXRhLmdldChiX3B0cilcIilcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29kZS5wdXNoKFwidmFsPWRhdGFbYl9wdHJdXCIpXG4gICAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgICBpZihza2lwICYmIG1lcmdlKSB7XG4gICAgICAgICAgICBjb2RlLnB1c2goXCJpZihza2lwKHZhbCkgfHwgIW1lcmdlKG92YWwsdmFsKSl7IGJyZWFrIGpcIitpK1wiX2xvb3A7IH1cIilcbiAgICAgICAgICB9IGVsc2UgaWYoc2tpcCkge1xuICAgICAgICAgICAgY29kZS5wdXNoKFwiaWYoc2tpcCh2YWwpIHx8IHZhbCAhPT0gb3ZhbCl7IGJyZWFrIGpcIitpK1wiX2xvb3A7IH1cIilcbiAgICAgICAgICB9IGVsc2UgaWYobWVyZ2UpIHtcbiAgICAgICAgICAgIGNvZGUucHVzaChcImlmKHZhbCA9PT0gMCB8fCAhbWVyZ2Uob3ZhbCx2YWwpKXsgYnJlYWsgalwiK2krXCJfbG9vcDsgfVwiKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb2RlLnB1c2goXCJpZih2YWwgPT09IDAgfHwgdmFsICE9PSBvdmFsKXsgYnJlYWsgalwiK2krXCJfbG9vcDsgfVwiKVxuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAvL0Nsb3NlIG9mZiBsb29wIGJvZGllc1xuICAgICAgICAgIGNvZGUucHVzaChcIisrdV9wdHJcIilcbiAgICAgICAgICBjb2RlLnB1c2goXCJiX3B0cis9c3RyaWRlMFwiKVxuICAgICAgICBjb2RlLnB1c2goXCJ9XCIpXG4gICAgICAgIFxuICAgICAgICBmb3Ioaj0xOyBqPD1pOyArK2opIHtcbiAgICAgICAgICBjb2RlLnB1c2goXCJ1X3B0cis9dXN0ZXBcIitqKVxuICAgICAgICAgIGNvZGUucHVzaChcImJfcHRyKz1ic3RlcFwiK2opXG4gICAgICAgICAgY29kZS5wdXNoKFwifVwiKVxuICAgICAgICB9XG4gICAgICAgIGlmKGkgPCBkLTEpIHtcbiAgICAgICAgICBjb2RlLnB1c2goXCJkPWpcIitpK1wiLWlcIitpKVxuICAgICAgICAgIGNvZGUucHVzaChbXCJ1c3RlcFwiLGkrMSxcIj0odnN0ZXBcIixpKzEsXCItdnN0ZXBcIixpLFwiKmQpfDBcIl0uam9pbihcIlwiKSlcbiAgICAgICAgICBjb2RlLnB1c2goW1wiYnN0ZXBcIixpKzEsXCI9KHN0cmlkZVwiLGkrMSxcIi1zdHJpZGVcIixpLFwiKmQpfDBcIl0uam9pbihcIlwiKSlcbiAgICAgICAgfVxuICAgICAgfVxuICBcbiAgICAgIC8vTWFyayBvZmYgdmlzaXRlZCB0YWJsZVxuICAgICAgY29kZS5wdXNoKFwidV9wdHI9dl9wdHJcIilcbiAgICAgIGZvcihpPWQtMTsgaT49MDsgLS1pKSB7XG4gICAgICAgIGNvZGUucHVzaChbXCJmb3Ioa1wiLGksXCI9aVwiLGksXCI7a1wiLGksXCI8alwiLGksXCI7KytrXCIsaSxcIil7XCJdLmpvaW4oXCJcIikpXG4gICAgICB9XG4gICAgICBjb2RlLnB1c2goXCJ2aXNpdGVkW3VfcHRyKytdPTFcIilcbiAgICAgIGNvZGUucHVzaChcIn1cIilcbiAgICAgIGZvcihpPTE7IGk8ZDsgKytpKSB7XG4gICAgICAgIGNvZGUucHVzaChcInVfcHRyKz11c3RlcFwiK2kpXG4gICAgICAgIGNvZGUucHVzaChcIn1cIilcbiAgICAgIH1cbiAgXG4gICAgICAvL0FwcGVuZCBjaHVuayB0byBtZXNoXG4gICAgICBjb2RlLnB1c2goXCJhcHBlbmQoXCIrIGFwcGVuZF9hcmdzLmpvaW4oXCIsXCIpKyBcIilcIilcbiAgICBcbiAgICBjb2RlLnB1c2goXCJ9XCIpXG4gIGNvZGUucHVzaChcIn1cIilcbiAgY29kZS5wdXNoKFwiKyt2X3B0clwiKVxuICBmb3IodmFyIGk9MDsgaTxkOyArK2kpIHtcbiAgICBjb2RlLnB1c2goXCJhX3B0cis9YXN0ZXBcIitpKVxuICAgIGNvZGUucHVzaChcIn1cIilcbiAgfVxuICBcbiAgY29kZS5wdXNoKFwiZnJlZVVpbnQ4KHZpc2l0ZWQpXCIpXG4gIFxuICBpZihvcHRpb25zLmRlYnVnKSB7XG4gICAgY29uc29sZS5sb2coXCJHRU5FUkFUSU5HIE1FU0hFUjpcIilcbiAgICBjb25zb2xlLmxvZyhjb2RlLmpvaW4oXCJcXG5cIikpXG4gIH1cbiAgXG4gIC8vQ29tcGlsZSBwcm9jZWR1cmVcbiAgdmFyIGFyZ3MgPSBbXCJhcHBlbmRcIiwgXCJtYWxsb2NVaW50OFwiLCBcImZyZWVVaW50OFwiXVxuICBpZihtZXJnZSkge1xuICAgIGFyZ3MudW5zaGlmdChcIm1lcmdlXCIpXG4gIH1cbiAgaWYoc2tpcCkge1xuICAgIGFyZ3MudW5zaGlmdChcInNraXBcIilcbiAgfVxuICBcbiAgLy9CdWlsZCB3cmFwcGVyXG4gIHZhciBsb2NhbF9hcmdzID0gW1wiYXJyYXlcIl0uY29uY2F0KG9wdF9hcmdzKVxuICB2YXIgZnVuY05hbWUgPSBbXCJncmVlZHlNZXNoZXJcIiwgZCwgXCJkX29yZFwiLCBvcmRlci5qb2luKFwic1wiKSAsIChza2lwID8gXCJza2lwXCIgOiBcIlwiKSAsIChtZXJnZSA/IFwibWVyZ2VcIiA6IFwiXCIpXS5qb2luKFwiXCIpXG4gIHZhciBnZW5fYm9keSA9IFtcIid1c2Ugc3RyaWN0JztmdW5jdGlvbiBcIiwgZnVuY05hbWUsIFwiKFwiLCBsb2NhbF9hcmdzLmpvaW4oXCIsXCIpLCBcIil7XCIsIGNvZGUuam9pbihcIlxcblwiKSwgXCJ9O3JldHVybiBcIiwgZnVuY05hbWVdLmpvaW4oXCJcIilcbiAgYXJncy5wdXNoKGdlbl9ib2R5KVxuICB2YXIgcHJvYyA9IEZ1bmN0aW9uLmFwcGx5KHVuZGVmaW5lZCwgYXJncylcbiAgXG4gIGlmKHNraXAgJiYgbWVyZ2UpIHtcbiAgICByZXR1cm4gcHJvYyhza2lwLCBtZXJnZSwgYXBwZW5kLCBwb29sLm1hbGxvY1VpbnQ4LCBwb29sLmZyZWVVaW50OClcbiAgfSBlbHNlIGlmKHNraXApIHtcbiAgICByZXR1cm4gcHJvYyhza2lwLCBhcHBlbmQsIHBvb2wubWFsbG9jVWludDgsIHBvb2wuZnJlZVVpbnQ4KVxuICB9IGVsc2UgaWYobWVyZ2UpIHtcbiAgICByZXR1cm4gcHJvYyhtZXJnZSwgYXBwZW5kLCBwb29sLm1hbGxvY1VpbnQ4LCBwb29sLmZyZWVVaW50OClcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcHJvYyhhcHBlbmQsIHBvb2wubWFsbG9jVWludDgsIHBvb2wuZnJlZVVpbnQ4KVxuICB9XG59XG5cbi8vVGhlIGFjdHVhbCBtZXNoIGNvbXBpbGVyXG5mdW5jdGlvbiBjb21waWxlTWVzaGVyKG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cbiAgaWYoIW9wdGlvbnMub3JkZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJncmVlZHktbWVzaGVyOiBNaXNzaW5nIG9yZGVyIGZpZWxkXCIpXG4gIH1cbiAgaWYoIW9wdGlvbnMuYXBwZW5kKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiZ3JlZWR5LW1lc2hlcjogTWlzc2luZyBhcHBlbmQgZmllbGRcIilcbiAgfVxuICByZXR1cm4gZ2VuZXJhdGVNZXNoZXIoXG4gICAgb3B0aW9ucy5vcmRlcixcbiAgICBvcHRpb25zLnNraXAsXG4gICAgb3B0aW9ucy5tZXJnZSxcbiAgICBvcHRpb25zLmFwcGVuZCxcbiAgICBvcHRpb25zLmV4dHJhQXJnc3wwLFxuICAgIG9wdGlvbnMsXG4gICAgISFvcHRpb25zLnVzZUdldHRlclxuICApXG59XG5tb2R1bGUuZXhwb3J0cyA9IGNvbXBpbGVNZXNoZXJcbiIsIlwidXNlIHN0cmljdFwiXG5cbmZ1bmN0aW9uIGlvdGEobikge1xuICB2YXIgcmVzdWx0ID0gbmV3IEFycmF5KG4pXG4gIGZvcih2YXIgaT0wOyBpPG47ICsraSkge1xuICAgIHJlc3VsdFtpXSA9IGlcbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaW90YSIsIi8qKlxuICogQml0IHR3aWRkbGluZyBoYWNrcyBmb3IgSmF2YVNjcmlwdC5cbiAqXG4gKiBBdXRob3I6IE1pa29sYSBMeXNlbmtvXG4gKlxuICogUG9ydGVkIGZyb20gU3RhbmZvcmQgYml0IHR3aWRkbGluZyBoYWNrIGxpYnJhcnk6XG4gKiAgICBodHRwOi8vZ3JhcGhpY3Muc3RhbmZvcmQuZWR1L35zZWFuZGVyL2JpdGhhY2tzLmh0bWxcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjsgXCJ1c2UgcmVzdHJpY3RcIjtcblxuLy9OdW1iZXIgb2YgYml0cyBpbiBhbiBpbnRlZ2VyXG52YXIgSU5UX0JJVFMgPSAzMjtcblxuLy9Db25zdGFudHNcbmV4cG9ydHMuSU5UX0JJVFMgID0gSU5UX0JJVFM7XG5leHBvcnRzLklOVF9NQVggICA9ICAweDdmZmZmZmZmO1xuZXhwb3J0cy5JTlRfTUlOICAgPSAtMTw8KElOVF9CSVRTLTEpO1xuXG4vL1JldHVybnMgLTEsIDAsICsxIGRlcGVuZGluZyBvbiBzaWduIG9mIHhcbmV4cG9ydHMuc2lnbiA9IGZ1bmN0aW9uKHYpIHtcbiAgcmV0dXJuICh2ID4gMCkgLSAodiA8IDApO1xufVxuXG4vL0NvbXB1dGVzIGFic29sdXRlIHZhbHVlIG9mIGludGVnZXJcbmV4cG9ydHMuYWJzID0gZnVuY3Rpb24odikge1xuICB2YXIgbWFzayA9IHYgPj4gKElOVF9CSVRTLTEpO1xuICByZXR1cm4gKHYgXiBtYXNrKSAtIG1hc2s7XG59XG5cbi8vQ29tcHV0ZXMgbWluaW11bSBvZiBpbnRlZ2VycyB4IGFuZCB5XG5leHBvcnRzLm1pbiA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgcmV0dXJuIHkgXiAoKHggXiB5KSAmIC0oeCA8IHkpKTtcbn1cblxuLy9Db21wdXRlcyBtYXhpbXVtIG9mIGludGVnZXJzIHggYW5kIHlcbmV4cG9ydHMubWF4ID0gZnVuY3Rpb24oeCwgeSkge1xuICByZXR1cm4geCBeICgoeCBeIHkpICYgLSh4IDwgeSkpO1xufVxuXG4vL0NoZWNrcyBpZiBhIG51bWJlciBpcyBhIHBvd2VyIG9mIHR3b1xuZXhwb3J0cy5pc1BvdzIgPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiAhKHYgJiAodi0xKSkgJiYgKCEhdik7XG59XG5cbi8vQ29tcHV0ZXMgbG9nIGJhc2UgMiBvZiB2XG5leHBvcnRzLmxvZzIgPSBmdW5jdGlvbih2KSB7XG4gIHZhciByLCBzaGlmdDtcbiAgciA9ICAgICAodiA+IDB4RkZGRikgPDwgNDsgdiA+Pj49IHI7XG4gIHNoaWZ0ID0gKHYgPiAweEZGICApIDw8IDM7IHYgPj4+PSBzaGlmdDsgciB8PSBzaGlmdDtcbiAgc2hpZnQgPSAodiA+IDB4RiAgICkgPDwgMjsgdiA+Pj49IHNoaWZ0OyByIHw9IHNoaWZ0O1xuICBzaGlmdCA9ICh2ID4gMHgzICAgKSA8PCAxOyB2ID4+Pj0gc2hpZnQ7IHIgfD0gc2hpZnQ7XG4gIHJldHVybiByIHwgKHYgPj4gMSk7XG59XG5cbi8vQ29tcHV0ZXMgbG9nIGJhc2UgMTAgb2YgdlxuZXhwb3J0cy5sb2cxMCA9IGZ1bmN0aW9uKHYpIHtcbiAgcmV0dXJuICAodiA+PSAxMDAwMDAwMDAwKSA/IDkgOiAodiA+PSAxMDAwMDAwMDApID8gOCA6ICh2ID49IDEwMDAwMDAwKSA/IDcgOlxuICAgICAgICAgICh2ID49IDEwMDAwMDApID8gNiA6ICh2ID49IDEwMDAwMCkgPyA1IDogKHYgPj0gMTAwMDApID8gNCA6XG4gICAgICAgICAgKHYgPj0gMTAwMCkgPyAzIDogKHYgPj0gMTAwKSA/IDIgOiAodiA+PSAxMCkgPyAxIDogMDtcbn1cblxuLy9Db3VudHMgbnVtYmVyIG9mIGJpdHNcbmV4cG9ydHMucG9wQ291bnQgPSBmdW5jdGlvbih2KSB7XG4gIHYgPSB2IC0gKCh2ID4+PiAxKSAmIDB4NTU1NTU1NTUpO1xuICB2ID0gKHYgJiAweDMzMzMzMzMzKSArICgodiA+Pj4gMikgJiAweDMzMzMzMzMzKTtcbiAgcmV0dXJuICgodiArICh2ID4+PiA0KSAmIDB4RjBGMEYwRikgKiAweDEwMTAxMDEpID4+PiAyNDtcbn1cblxuLy9Db3VudHMgbnVtYmVyIG9mIHRyYWlsaW5nIHplcm9zXG5mdW5jdGlvbiBjb3VudFRyYWlsaW5nWmVyb3Modikge1xuICB2YXIgYyA9IDMyO1xuICB2ICY9IC12O1xuICBpZiAodikgYy0tO1xuICBpZiAodiAmIDB4MDAwMEZGRkYpIGMgLT0gMTY7XG4gIGlmICh2ICYgMHgwMEZGMDBGRikgYyAtPSA4O1xuICBpZiAodiAmIDB4MEYwRjBGMEYpIGMgLT0gNDtcbiAgaWYgKHYgJiAweDMzMzMzMzMzKSBjIC09IDI7XG4gIGlmICh2ICYgMHg1NTU1NTU1NSkgYyAtPSAxO1xuICByZXR1cm4gYztcbn1cbmV4cG9ydHMuY291bnRUcmFpbGluZ1plcm9zID0gY291bnRUcmFpbGluZ1plcm9zO1xuXG4vL1JvdW5kcyB0byBuZXh0IHBvd2VyIG9mIDJcbmV4cG9ydHMubmV4dFBvdzIgPSBmdW5jdGlvbih2KSB7XG4gIHYgKz0gdiA9PT0gMDtcbiAgLS12O1xuICB2IHw9IHYgPj4+IDE7XG4gIHYgfD0gdiA+Pj4gMjtcbiAgdiB8PSB2ID4+PiA0O1xuICB2IHw9IHYgPj4+IDg7XG4gIHYgfD0gdiA+Pj4gMTY7XG4gIHJldHVybiB2ICsgMTtcbn1cblxuLy9Sb3VuZHMgZG93biB0byBwcmV2aW91cyBwb3dlciBvZiAyXG5leHBvcnRzLnByZXZQb3cyID0gZnVuY3Rpb24odikge1xuICB2IHw9IHYgPj4+IDE7XG4gIHYgfD0gdiA+Pj4gMjtcbiAgdiB8PSB2ID4+PiA0O1xuICB2IHw9IHYgPj4+IDg7XG4gIHYgfD0gdiA+Pj4gMTY7XG4gIHJldHVybiB2IC0gKHY+Pj4xKTtcbn1cblxuLy9Db21wdXRlcyBwYXJpdHkgb2Ygd29yZFxuZXhwb3J0cy5wYXJpdHkgPSBmdW5jdGlvbih2KSB7XG4gIHYgXj0gdiA+Pj4gMTY7XG4gIHYgXj0gdiA+Pj4gODtcbiAgdiBePSB2ID4+PiA0O1xuICB2ICY9IDB4ZjtcbiAgcmV0dXJuICgweDY5OTYgPj4+IHYpICYgMTtcbn1cblxudmFyIFJFVkVSU0VfVEFCTEUgPSBuZXcgQXJyYXkoMjU2KTtcblxuKGZ1bmN0aW9uKHRhYikge1xuICBmb3IodmFyIGk9MDsgaTwyNTY7ICsraSkge1xuICAgIHZhciB2ID0gaSwgciA9IGksIHMgPSA3O1xuICAgIGZvciAodiA+Pj49IDE7IHY7IHYgPj4+PSAxKSB7XG4gICAgICByIDw8PSAxO1xuICAgICAgciB8PSB2ICYgMTtcbiAgICAgIC0tcztcbiAgICB9XG4gICAgdGFiW2ldID0gKHIgPDwgcykgJiAweGZmO1xuICB9XG59KShSRVZFUlNFX1RBQkxFKTtcblxuLy9SZXZlcnNlIGJpdHMgaW4gYSAzMiBiaXQgd29yZFxuZXhwb3J0cy5yZXZlcnNlID0gZnVuY3Rpb24odikge1xuICByZXR1cm4gIChSRVZFUlNFX1RBQkxFWyB2ICAgICAgICAgJiAweGZmXSA8PCAyNCkgfFxuICAgICAgICAgIChSRVZFUlNFX1RBQkxFWyh2ID4+PiA4KSAgJiAweGZmXSA8PCAxNikgfFxuICAgICAgICAgIChSRVZFUlNFX1RBQkxFWyh2ID4+PiAxNikgJiAweGZmXSA8PCA4KSAgfFxuICAgICAgICAgICBSRVZFUlNFX1RBQkxFWyh2ID4+PiAyNCkgJiAweGZmXTtcbn1cblxuLy9JbnRlcmxlYXZlIGJpdHMgb2YgMiBjb29yZGluYXRlcyB3aXRoIDE2IGJpdHMuICBVc2VmdWwgZm9yIGZhc3QgcXVhZHRyZWUgY29kZXNcbmV4cG9ydHMuaW50ZXJsZWF2ZTIgPSBmdW5jdGlvbih4LCB5KSB7XG4gIHggJj0gMHhGRkZGO1xuICB4ID0gKHggfCAoeCA8PCA4KSkgJiAweDAwRkYwMEZGO1xuICB4ID0gKHggfCAoeCA8PCA0KSkgJiAweDBGMEYwRjBGO1xuICB4ID0gKHggfCAoeCA8PCAyKSkgJiAweDMzMzMzMzMzO1xuICB4ID0gKHggfCAoeCA8PCAxKSkgJiAweDU1NTU1NTU1O1xuXG4gIHkgJj0gMHhGRkZGO1xuICB5ID0gKHkgfCAoeSA8PCA4KSkgJiAweDAwRkYwMEZGO1xuICB5ID0gKHkgfCAoeSA8PCA0KSkgJiAweDBGMEYwRjBGO1xuICB5ID0gKHkgfCAoeSA8PCAyKSkgJiAweDMzMzMzMzMzO1xuICB5ID0gKHkgfCAoeSA8PCAxKSkgJiAweDU1NTU1NTU1O1xuXG4gIHJldHVybiB4IHwgKHkgPDwgMSk7XG59XG5cbi8vRXh0cmFjdHMgdGhlIG50aCBpbnRlcmxlYXZlZCBjb21wb25lbnRcbmV4cG9ydHMuZGVpbnRlcmxlYXZlMiA9IGZ1bmN0aW9uKHYsIG4pIHtcbiAgdiA9ICh2ID4+PiBuKSAmIDB4NTU1NTU1NTU7XG4gIHYgPSAodiB8ICh2ID4+PiAxKSkgICYgMHgzMzMzMzMzMztcbiAgdiA9ICh2IHwgKHYgPj4+IDIpKSAgJiAweDBGMEYwRjBGO1xuICB2ID0gKHYgfCAodiA+Pj4gNCkpICAmIDB4MDBGRjAwRkY7XG4gIHYgPSAodiB8ICh2ID4+PiAxNikpICYgMHgwMDBGRkZGO1xuICByZXR1cm4gKHYgPDwgMTYpID4+IDE2O1xufVxuXG5cbi8vSW50ZXJsZWF2ZSBiaXRzIG9mIDMgY29vcmRpbmF0ZXMsIGVhY2ggd2l0aCAxMCBiaXRzLiAgVXNlZnVsIGZvciBmYXN0IG9jdHJlZSBjb2Rlc1xuZXhwb3J0cy5pbnRlcmxlYXZlMyA9IGZ1bmN0aW9uKHgsIHksIHopIHtcbiAgeCAmPSAweDNGRjtcbiAgeCAgPSAoeCB8ICh4PDwxNikpICYgNDI3ODE5MDMzNTtcbiAgeCAgPSAoeCB8ICh4PDw4KSkgICYgMjUxNzE5Njk1O1xuICB4ICA9ICh4IHwgKHg8PDQpKSAgJiAzMjcyMzU2MDM1O1xuICB4ICA9ICh4IHwgKHg8PDIpKSAgJiAxMjI3MTMzNTEzO1xuXG4gIHkgJj0gMHgzRkY7XG4gIHkgID0gKHkgfCAoeTw8MTYpKSAmIDQyNzgxOTAzMzU7XG4gIHkgID0gKHkgfCAoeTw8OCkpICAmIDI1MTcxOTY5NTtcbiAgeSAgPSAoeSB8ICh5PDw0KSkgICYgMzI3MjM1NjAzNTtcbiAgeSAgPSAoeSB8ICh5PDwyKSkgICYgMTIyNzEzMzUxMztcbiAgeCB8PSAoeSA8PCAxKTtcbiAgXG4gIHogJj0gMHgzRkY7XG4gIHogID0gKHogfCAoejw8MTYpKSAmIDQyNzgxOTAzMzU7XG4gIHogID0gKHogfCAoejw8OCkpICAmIDI1MTcxOTY5NTtcbiAgeiAgPSAoeiB8ICh6PDw0KSkgICYgMzI3MjM1NjAzNTtcbiAgeiAgPSAoeiB8ICh6PDwyKSkgICYgMTIyNzEzMzUxMztcbiAgXG4gIHJldHVybiB4IHwgKHogPDwgMik7XG59XG5cbi8vRXh0cmFjdHMgbnRoIGludGVybGVhdmVkIGNvbXBvbmVudCBvZiBhIDMtdHVwbGVcbmV4cG9ydHMuZGVpbnRlcmxlYXZlMyA9IGZ1bmN0aW9uKHYsIG4pIHtcbiAgdiA9ICh2ID4+PiBuKSAgICAgICAmIDEyMjcxMzM1MTM7XG4gIHYgPSAodiB8ICh2Pj4+MikpICAgJiAzMjcyMzU2MDM1O1xuICB2ID0gKHYgfCAodj4+PjQpKSAgICYgMjUxNzE5Njk1O1xuICB2ID0gKHYgfCAodj4+PjgpKSAgICYgNDI3ODE5MDMzNTtcbiAgdiA9ICh2IHwgKHY+Pj4xNikpICAmIDB4M0ZGO1xuICByZXR1cm4gKHY8PDIyKT4+MjI7XG59XG5cbi8vQ29tcHV0ZXMgbmV4dCBjb21iaW5hdGlvbiBpbiBjb2xleGljb2dyYXBoaWMgb3JkZXIgKHRoaXMgaXMgbWlzdGFrZW5seSBjYWxsZWQgbmV4dFBlcm11dGF0aW9uIG9uIHRoZSBiaXQgdHdpZGRsaW5nIGhhY2tzIHBhZ2UpXG5leHBvcnRzLm5leHRDb21iaW5hdGlvbiA9IGZ1bmN0aW9uKHYpIHtcbiAgdmFyIHQgPSB2IHwgKHYgLSAxKTtcbiAgcmV0dXJuICh0ICsgMSkgfCAoKCh+dCAmIC1+dCkgLSAxKSA+Pj4gKGNvdW50VHJhaWxpbmdaZXJvcyh2KSArIDEpKTtcbn1cblxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuZnVuY3Rpb24gZHVwZV9hcnJheShjb3VudCwgdmFsdWUsIGkpIHtcbiAgdmFyIGMgPSBjb3VudFtpXXwwXG4gIGlmKGMgPD0gMCkge1xuICAgIHJldHVybiBbXVxuICB9XG4gIHZhciByZXN1bHQgPSBuZXcgQXJyYXkoYyksIGpcbiAgaWYoaSA9PT0gY291bnQubGVuZ3RoLTEpIHtcbiAgICBmb3Ioaj0wOyBqPGM7ICsraikge1xuICAgICAgcmVzdWx0W2pdID0gdmFsdWVcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZm9yKGo9MDsgajxjOyArK2opIHtcbiAgICAgIHJlc3VsdFtqXSA9IGR1cGVfYXJyYXkoY291bnQsIHZhbHVlLCBpKzEpXG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuZnVuY3Rpb24gZHVwZV9udW1iZXIoY291bnQsIHZhbHVlKSB7XG4gIHZhciByZXN1bHQsIGlcbiAgcmVzdWx0ID0gbmV3IEFycmF5KGNvdW50KVxuICBmb3IoaT0wOyBpPGNvdW50OyArK2kpIHtcbiAgICByZXN1bHRbaV0gPSB2YWx1ZVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuZnVuY3Rpb24gZHVwZShjb3VudCwgdmFsdWUpIHtcbiAgaWYodHlwZW9mIHZhbHVlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgdmFsdWUgPSAwXG4gIH1cbiAgc3dpdGNoKHR5cGVvZiBjb3VudCkge1xuICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICAgIGlmKGNvdW50ID4gMCkge1xuICAgICAgICByZXR1cm4gZHVwZV9udW1iZXIoY291bnR8MCwgdmFsdWUpXG4gICAgICB9XG4gICAgYnJlYWtcbiAgICBjYXNlIFwib2JqZWN0XCI6XG4gICAgICBpZih0eXBlb2YgKGNvdW50Lmxlbmd0aCkgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgcmV0dXJuIGR1cGVfYXJyYXkoY291bnQsIHZhbHVlLCAwKVxuICAgICAgfVxuICAgIGJyZWFrXG4gIH1cbiAgcmV0dXJuIFtdXG59XG5cbm1vZHVsZS5leHBvcnRzID0gZHVwZSIsIid1c2Ugc3RyaWN0J1xuXG52YXIgYml0cyA9IHJlcXVpcmUoJ2JpdC10d2lkZGxlJylcbnZhciBkdXAgPSByZXF1aXJlKCdkdXAnKVxuXG4vL0xlZ2FjeSBwb29sIHN1cHBvcnRcbmlmKCFnbG9iYWwuX19UWVBFREFSUkFZX1BPT0wpIHtcbiAgZ2xvYmFsLl9fVFlQRURBUlJBWV9QT09MID0ge1xuICAgICAgVUlOVDggICA6IGR1cChbMzIsIDBdKVxuICAgICwgVUlOVDE2ICA6IGR1cChbMzIsIDBdKVxuICAgICwgVUlOVDMyICA6IGR1cChbMzIsIDBdKVxuICAgICwgSU5UOCAgICA6IGR1cChbMzIsIDBdKVxuICAgICwgSU5UMTYgICA6IGR1cChbMzIsIDBdKVxuICAgICwgSU5UMzIgICA6IGR1cChbMzIsIDBdKVxuICAgICwgRkxPQVQgICA6IGR1cChbMzIsIDBdKVxuICAgICwgRE9VQkxFICA6IGR1cChbMzIsIDBdKVxuICAgICwgREFUQSAgICA6IGR1cChbMzIsIDBdKVxuICAgICwgVUlOVDhDICA6IGR1cChbMzIsIDBdKVxuICAgICwgQlVGRkVSICA6IGR1cChbMzIsIDBdKVxuICB9XG59XG5cbnZhciBoYXNVaW50OEMgPSAodHlwZW9mIFVpbnQ4Q2xhbXBlZEFycmF5KSAhPT0gJ3VuZGVmaW5lZCdcbnZhciBQT09MID0gZ2xvYmFsLl9fVFlQRURBUlJBWV9QT09MXG5cbi8vVXBncmFkZSBwb29sXG5pZighUE9PTC5VSU5UOEMpIHtcbiAgUE9PTC5VSU5UOEMgPSBkdXAoWzMyLCAwXSlcbn1cbmlmKCFQT09MLkJVRkZFUikge1xuICBQT09MLkJVRkZFUiA9IGR1cChbMzIsIDBdKVxufVxuXG4vL05ldyB0ZWNobmlxdWU6IE9ubHkgYWxsb2NhdGUgZnJvbSBBcnJheUJ1ZmZlclZpZXcgYW5kIEJ1ZmZlclxudmFyIERBVEEgICAgPSBQT09MLkRBVEFcbiAgLCBCVUZGRVIgID0gUE9PTC5CVUZGRVJcblxuZXhwb3J0cy5mcmVlID0gZnVuY3Rpb24gZnJlZShhcnJheSkge1xuICBpZihCdWZmZXIuaXNCdWZmZXIoYXJyYXkpKSB7XG4gICAgQlVGRkVSW2JpdHMubG9nMihhcnJheS5sZW5ndGgpXS5wdXNoKGFycmF5KVxuICB9IGVsc2Uge1xuICAgIGlmKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcnJheSkgIT09ICdbb2JqZWN0IEFycmF5QnVmZmVyXScpIHtcbiAgICAgIGFycmF5ID0gYXJyYXkuYnVmZmVyXG4gICAgfVxuICAgIGlmKCFhcnJheSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHZhciBuID0gYXJyYXkubGVuZ3RoIHx8IGFycmF5LmJ5dGVMZW5ndGhcbiAgICB2YXIgbG9nX24gPSBiaXRzLmxvZzIobil8MFxuICAgIERBVEFbbG9nX25dLnB1c2goYXJyYXkpXG4gIH1cbn1cblxuZnVuY3Rpb24gZnJlZUFycmF5QnVmZmVyKGJ1ZmZlcikge1xuICBpZighYnVmZmVyKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgdmFyIG4gPSBidWZmZXIubGVuZ3RoIHx8IGJ1ZmZlci5ieXRlTGVuZ3RoXG4gIHZhciBsb2dfbiA9IGJpdHMubG9nMihuKVxuICBEQVRBW2xvZ19uXS5wdXNoKGJ1ZmZlcilcbn1cblxuZnVuY3Rpb24gZnJlZVR5cGVkQXJyYXkoYXJyYXkpIHtcbiAgZnJlZUFycmF5QnVmZmVyKGFycmF5LmJ1ZmZlcilcbn1cblxuZXhwb3J0cy5mcmVlVWludDggPVxuZXhwb3J0cy5mcmVlVWludDE2ID1cbmV4cG9ydHMuZnJlZVVpbnQzMiA9XG5leHBvcnRzLmZyZWVJbnQ4ID1cbmV4cG9ydHMuZnJlZUludDE2ID1cbmV4cG9ydHMuZnJlZUludDMyID1cbmV4cG9ydHMuZnJlZUZsb2F0MzIgPSBcbmV4cG9ydHMuZnJlZUZsb2F0ID1cbmV4cG9ydHMuZnJlZUZsb2F0NjQgPSBcbmV4cG9ydHMuZnJlZURvdWJsZSA9IFxuZXhwb3J0cy5mcmVlVWludDhDbGFtcGVkID0gXG5leHBvcnRzLmZyZWVEYXRhVmlldyA9IGZyZWVUeXBlZEFycmF5XG5cbmV4cG9ydHMuZnJlZUFycmF5QnVmZmVyID0gZnJlZUFycmF5QnVmZmVyXG5cbmV4cG9ydHMuZnJlZUJ1ZmZlciA9IGZ1bmN0aW9uIGZyZWVCdWZmZXIoYXJyYXkpIHtcbiAgQlVGRkVSW2JpdHMubG9nMihhcnJheS5sZW5ndGgpXS5wdXNoKGFycmF5KVxufVxuXG5leHBvcnRzLm1hbGxvYyA9IGZ1bmN0aW9uIG1hbGxvYyhuLCBkdHlwZSkge1xuICBpZihkdHlwZSA9PT0gdW5kZWZpbmVkIHx8IGR0eXBlID09PSAnYXJyYXlidWZmZXInKSB7XG4gICAgcmV0dXJuIG1hbGxvY0FycmF5QnVmZmVyKG4pXG4gIH0gZWxzZSB7XG4gICAgc3dpdGNoKGR0eXBlKSB7XG4gICAgICBjYXNlICd1aW50OCc6XG4gICAgICAgIHJldHVybiBtYWxsb2NVaW50OChuKVxuICAgICAgY2FzZSAndWludDE2JzpcbiAgICAgICAgcmV0dXJuIG1hbGxvY1VpbnQxNihuKVxuICAgICAgY2FzZSAndWludDMyJzpcbiAgICAgICAgcmV0dXJuIG1hbGxvY1VpbnQzMihuKVxuICAgICAgY2FzZSAnaW50OCc6XG4gICAgICAgIHJldHVybiBtYWxsb2NJbnQ4KG4pXG4gICAgICBjYXNlICdpbnQxNic6XG4gICAgICAgIHJldHVybiBtYWxsb2NJbnQxNihuKVxuICAgICAgY2FzZSAnaW50MzInOlxuICAgICAgICByZXR1cm4gbWFsbG9jSW50MzIobilcbiAgICAgIGNhc2UgJ2Zsb2F0JzpcbiAgICAgIGNhc2UgJ2Zsb2F0MzInOlxuICAgICAgICByZXR1cm4gbWFsbG9jRmxvYXQobilcbiAgICAgIGNhc2UgJ2RvdWJsZSc6XG4gICAgICBjYXNlICdmbG9hdDY0JzpcbiAgICAgICAgcmV0dXJuIG1hbGxvY0RvdWJsZShuKVxuICAgICAgY2FzZSAndWludDhfY2xhbXBlZCc6XG4gICAgICAgIHJldHVybiBtYWxsb2NVaW50OENsYW1wZWQobilcbiAgICAgIGNhc2UgJ2J1ZmZlcic6XG4gICAgICAgIHJldHVybiBtYWxsb2NCdWZmZXIobilcbiAgICAgIGNhc2UgJ2RhdGEnOlxuICAgICAgY2FzZSAnZGF0YXZpZXcnOlxuICAgICAgICByZXR1cm4gbWFsbG9jRGF0YVZpZXcobilcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cblxuZnVuY3Rpb24gbWFsbG9jQXJyYXlCdWZmZXIobikge1xuICB2YXIgbiA9IGJpdHMubmV4dFBvdzIobilcbiAgdmFyIGxvZ19uID0gYml0cy5sb2cyKG4pXG4gIHZhciBkID0gREFUQVtsb2dfbl1cbiAgaWYoZC5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIGQucG9wKClcbiAgfVxuICByZXR1cm4gbmV3IEFycmF5QnVmZmVyKG4pXG59XG5leHBvcnRzLm1hbGxvY0FycmF5QnVmZmVyID0gbWFsbG9jQXJyYXlCdWZmZXJcblxuZnVuY3Rpb24gbWFsbG9jVWludDgobikge1xuICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkobWFsbG9jQXJyYXlCdWZmZXIobiksIDAsIG4pXG59XG5leHBvcnRzLm1hbGxvY1VpbnQ4ID0gbWFsbG9jVWludDhcblxuZnVuY3Rpb24gbWFsbG9jVWludDE2KG4pIHtcbiAgcmV0dXJuIG5ldyBVaW50MTZBcnJheShtYWxsb2NBcnJheUJ1ZmZlcigyKm4pLCAwLCBuKVxufVxuZXhwb3J0cy5tYWxsb2NVaW50MTYgPSBtYWxsb2NVaW50MTZcblxuZnVuY3Rpb24gbWFsbG9jVWludDMyKG4pIHtcbiAgcmV0dXJuIG5ldyBVaW50MzJBcnJheShtYWxsb2NBcnJheUJ1ZmZlcig0Km4pLCAwLCBuKVxufVxuZXhwb3J0cy5tYWxsb2NVaW50MzIgPSBtYWxsb2NVaW50MzJcblxuZnVuY3Rpb24gbWFsbG9jSW50OChuKSB7XG4gIHJldHVybiBuZXcgSW50OEFycmF5KG1hbGxvY0FycmF5QnVmZmVyKG4pLCAwLCBuKVxufVxuZXhwb3J0cy5tYWxsb2NJbnQ4ID0gbWFsbG9jSW50OFxuXG5mdW5jdGlvbiBtYWxsb2NJbnQxNihuKSB7XG4gIHJldHVybiBuZXcgSW50MTZBcnJheShtYWxsb2NBcnJheUJ1ZmZlcigyKm4pLCAwLCBuKVxufVxuZXhwb3J0cy5tYWxsb2NJbnQxNiA9IG1hbGxvY0ludDE2XG5cbmZ1bmN0aW9uIG1hbGxvY0ludDMyKG4pIHtcbiAgcmV0dXJuIG5ldyBJbnQzMkFycmF5KG1hbGxvY0FycmF5QnVmZmVyKDQqbiksIDAsIG4pXG59XG5leHBvcnRzLm1hbGxvY0ludDMyID0gbWFsbG9jSW50MzJcblxuZnVuY3Rpb24gbWFsbG9jRmxvYXQobikge1xuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShtYWxsb2NBcnJheUJ1ZmZlcig0Km4pLCAwLCBuKVxufVxuZXhwb3J0cy5tYWxsb2NGbG9hdDMyID0gZXhwb3J0cy5tYWxsb2NGbG9hdCA9IG1hbGxvY0Zsb2F0XG5cbmZ1bmN0aW9uIG1hbGxvY0RvdWJsZShuKSB7XG4gIHJldHVybiBuZXcgRmxvYXQ2NEFycmF5KG1hbGxvY0FycmF5QnVmZmVyKDgqbiksIDAsIG4pXG59XG5leHBvcnRzLm1hbGxvY0Zsb2F0NjQgPSBleHBvcnRzLm1hbGxvY0RvdWJsZSA9IG1hbGxvY0RvdWJsZVxuXG5mdW5jdGlvbiBtYWxsb2NVaW50OENsYW1wZWQobikge1xuICBpZihoYXNVaW50OEMpIHtcbiAgICByZXR1cm4gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KG1hbGxvY0FycmF5QnVmZmVyKG4pLCAwLCBuKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBtYWxsb2NVaW50OChuKVxuICB9XG59XG5leHBvcnRzLm1hbGxvY1VpbnQ4Q2xhbXBlZCA9IG1hbGxvY1VpbnQ4Q2xhbXBlZFxuXG5mdW5jdGlvbiBtYWxsb2NEYXRhVmlldyhuKSB7XG4gIHJldHVybiBuZXcgRGF0YVZpZXcobWFsbG9jQXJyYXlCdWZmZXIobiksIDAsIG4pXG59XG5leHBvcnRzLm1hbGxvY0RhdGFWaWV3ID0gbWFsbG9jRGF0YVZpZXdcblxuZnVuY3Rpb24gbWFsbG9jQnVmZmVyKG4pIHtcbiAgbiA9IGJpdHMubmV4dFBvdzIobilcbiAgdmFyIGxvZ19uID0gYml0cy5sb2cyKG4pXG4gIHZhciBjYWNoZSA9IEJVRkZFUltsb2dfbl1cbiAgaWYoY2FjaGUubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBjYWNoZS5wb3AoKVxuICB9XG4gIHJldHVybiBuZXcgQnVmZmVyKG4pXG59XG5leHBvcnRzLm1hbGxvY0J1ZmZlciA9IG1hbGxvY0J1ZmZlclxuXG5leHBvcnRzLmNsZWFyQ2FjaGUgPSBmdW5jdGlvbiBjbGVhckNhY2hlKCkge1xuICBmb3IodmFyIGk9MDsgaTwzMjsgKytpKSB7XG4gICAgUE9PTC5VSU5UOFtpXS5sZW5ndGggPSAwXG4gICAgUE9PTC5VSU5UMTZbaV0ubGVuZ3RoID0gMFxuICAgIFBPT0wuVUlOVDMyW2ldLmxlbmd0aCA9IDBcbiAgICBQT09MLklOVDhbaV0ubGVuZ3RoID0gMFxuICAgIFBPT0wuSU5UMTZbaV0ubGVuZ3RoID0gMFxuICAgIFBPT0wuSU5UMzJbaV0ubGVuZ3RoID0gMFxuICAgIFBPT0wuRkxPQVRbaV0ubGVuZ3RoID0gMFxuICAgIFBPT0wuRE9VQkxFW2ldLmxlbmd0aCA9IDBcbiAgICBQT09MLlVJTlQ4Q1tpXS5sZW5ndGggPSAwXG4gICAgREFUQVtpXS5sZW5ndGggPSAwXG4gICAgQlVGRkVSW2ldLmxlbmd0aCA9IDBcbiAgfVxufSIsIlwidXNlIHN0cmljdFwiXG5cbmZ1bmN0aW9uIHVuaXF1ZV9wcmVkKGxpc3QsIGNvbXBhcmUpIHtcbiAgdmFyIHB0ciA9IDFcbiAgICAsIGxlbiA9IGxpc3QubGVuZ3RoXG4gICAgLCBhPWxpc3RbMF0sIGI9bGlzdFswXVxuICBmb3IodmFyIGk9MTsgaTxsZW47ICsraSkge1xuICAgIGIgPSBhXG4gICAgYSA9IGxpc3RbaV1cbiAgICBpZihjb21wYXJlKGEsIGIpKSB7XG4gICAgICBpZihpID09PSBwdHIpIHtcbiAgICAgICAgcHRyKytcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICAgIGxpc3RbcHRyKytdID0gYVxuICAgIH1cbiAgfVxuICBsaXN0Lmxlbmd0aCA9IHB0clxuICByZXR1cm4gbGlzdFxufVxuXG5mdW5jdGlvbiB1bmlxdWVfZXEobGlzdCkge1xuICB2YXIgcHRyID0gMVxuICAgICwgbGVuID0gbGlzdC5sZW5ndGhcbiAgICAsIGE9bGlzdFswXSwgYiA9IGxpc3RbMF1cbiAgZm9yKHZhciBpPTE7IGk8bGVuOyArK2ksIGI9YSkge1xuICAgIGIgPSBhXG4gICAgYSA9IGxpc3RbaV1cbiAgICBpZihhICE9PSBiKSB7XG4gICAgICBpZihpID09PSBwdHIpIHtcbiAgICAgICAgcHRyKytcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICAgIGxpc3RbcHRyKytdID0gYVxuICAgIH1cbiAgfVxuICBsaXN0Lmxlbmd0aCA9IHB0clxuICByZXR1cm4gbGlzdFxufVxuXG5mdW5jdGlvbiB1bmlxdWUobGlzdCwgY29tcGFyZSwgc29ydGVkKSB7XG4gIGlmKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGxpc3RcbiAgfVxuICBpZihjb21wYXJlKSB7XG4gICAgaWYoIXNvcnRlZCkge1xuICAgICAgbGlzdC5zb3J0KGNvbXBhcmUpXG4gICAgfVxuICAgIHJldHVybiB1bmlxdWVfcHJlZChsaXN0LCBjb21wYXJlKVxuICB9XG4gIGlmKCFzb3J0ZWQpIHtcbiAgICBsaXN0LnNvcnQoKVxuICB9XG4gIHJldHVybiB1bmlxdWVfZXEobGlzdClcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB1bmlxdWVcbiIsIi8vIFNvdXJjZTogaHR0cDovL2pzZmlkZGxlLm5ldC92V3g4Vi9cbi8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNTYwMzE5NS9mdWxsLWxpc3Qtb2YtamF2YXNjcmlwdC1rZXljb2Rlc1xuXG5cblxuLyoqXG4gKiBDb25lbmllbmNlIG1ldGhvZCByZXR1cm5zIGNvcnJlc3BvbmRpbmcgdmFsdWUgZm9yIGdpdmVuIGtleU5hbWUgb3Iga2V5Q29kZS5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSBrZXlDb2RlIHtOdW1iZXJ9IG9yIGtleU5hbWUge1N0cmluZ31cbiAqIEByZXR1cm4ge01peGVkfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzZWFyY2hJbnB1dCkge1xuICAvLyBLZXlib2FyZCBFdmVudHNcbiAgaWYgKHNlYXJjaElucHV0ICYmICdvYmplY3QnID09PSB0eXBlb2Ygc2VhcmNoSW5wdXQpIHtcbiAgICB2YXIgaGFzS2V5Q29kZSA9IHNlYXJjaElucHV0LndoaWNoIHx8IHNlYXJjaElucHV0LmtleUNvZGUgfHwgc2VhcmNoSW5wdXQuY2hhckNvZGVcbiAgICBpZiAoaGFzS2V5Q29kZSkgc2VhcmNoSW5wdXQgPSBoYXNLZXlDb2RlXG4gIH1cblxuICAvLyBOdW1iZXJzXG4gIGlmICgnbnVtYmVyJyA9PT0gdHlwZW9mIHNlYXJjaElucHV0KSByZXR1cm4gbmFtZXNbc2VhcmNoSW5wdXRdXG5cbiAgLy8gRXZlcnl0aGluZyBlbHNlIChjYXN0IHRvIHN0cmluZylcbiAgdmFyIHNlYXJjaCA9IFN0cmluZyhzZWFyY2hJbnB1dClcblxuICAvLyBjaGVjayBjb2Rlc1xuICB2YXIgZm91bmROYW1lZEtleSA9IGNvZGVzW3NlYXJjaC50b0xvd2VyQ2FzZSgpXVxuICBpZiAoZm91bmROYW1lZEtleSkgcmV0dXJuIGZvdW5kTmFtZWRLZXlcblxuICAvLyBjaGVjayBhbGlhc2VzXG4gIHZhciBmb3VuZE5hbWVkS2V5ID0gYWxpYXNlc1tzZWFyY2gudG9Mb3dlckNhc2UoKV1cbiAgaWYgKGZvdW5kTmFtZWRLZXkpIHJldHVybiBmb3VuZE5hbWVkS2V5XG5cbiAgLy8gd2VpcmQgY2hhcmFjdGVyP1xuICBpZiAoc2VhcmNoLmxlbmd0aCA9PT0gMSkgcmV0dXJuIHNlYXJjaC5jaGFyQ29kZUF0KDApXG5cbiAgcmV0dXJuIHVuZGVmaW5lZFxufVxuXG4vKipcbiAqIEdldCBieSBuYW1lXG4gKlxuICogICBleHBvcnRzLmNvZGVbJ2VudGVyJ10gLy8gPT4gMTNcbiAqL1xuXG52YXIgY29kZXMgPSBleHBvcnRzLmNvZGUgPSBleHBvcnRzLmNvZGVzID0ge1xuICAnYmFja3NwYWNlJzogOCxcbiAgJ3RhYic6IDksXG4gICdlbnRlcic6IDEzLFxuICAnc2hpZnQnOiAxNixcbiAgJ2N0cmwnOiAxNyxcbiAgJ2FsdCc6IDE4LFxuICAncGF1c2UvYnJlYWsnOiAxOSxcbiAgJ2NhcHMgbG9jayc6IDIwLFxuICAnZXNjJzogMjcsXG4gICdzcGFjZSc6IDMyLFxuICAncGFnZSB1cCc6IDMzLFxuICAncGFnZSBkb3duJzogMzQsXG4gICdlbmQnOiAzNSxcbiAgJ2hvbWUnOiAzNixcbiAgJ2xlZnQnOiAzNyxcbiAgJ3VwJzogMzgsXG4gICdyaWdodCc6IDM5LFxuICAnZG93bic6IDQwLFxuICAnaW5zZXJ0JzogNDUsXG4gICdkZWxldGUnOiA0NixcbiAgJ2NvbW1hbmQnOiA5MSxcbiAgJ3JpZ2h0IGNsaWNrJzogOTMsXG4gICdudW1wYWQgKic6IDEwNixcbiAgJ251bXBhZCArJzogMTA3LFxuICAnbnVtcGFkIC0nOiAxMDksXG4gICdudW1wYWQgLic6IDExMCxcbiAgJ251bXBhZCAvJzogMTExLFxuICAnbnVtIGxvY2snOiAxNDQsXG4gICdzY3JvbGwgbG9jayc6IDE0NSxcbiAgJ215IGNvbXB1dGVyJzogMTgyLFxuICAnbXkgY2FsY3VsYXRvcic6IDE4MyxcbiAgJzsnOiAxODYsXG4gICc9JzogMTg3LFxuICAnLCc6IDE4OCxcbiAgJy0nOiAxODksXG4gICcuJzogMTkwLFxuICAnLyc6IDE5MSxcbiAgJ2AnOiAxOTIsXG4gICdbJzogMjE5LFxuICAnXFxcXCc6IDIyMCxcbiAgJ10nOiAyMjEsXG4gIFwiJ1wiOiAyMjIsXG59XG5cbi8vIEhlbHBlciBhbGlhc2VzXG5cbnZhciBhbGlhc2VzID0gZXhwb3J0cy5hbGlhc2VzID0ge1xuICAnd2luZG93cyc6IDkxLFxuICAn4oenJzogMTYsXG4gICfijKUnOiAxOCxcbiAgJ+KMgyc6IDE3LFxuICAn4oyYJzogOTEsXG4gICdjdGwnOiAxNyxcbiAgJ2NvbnRyb2wnOiAxNyxcbiAgJ29wdGlvbic6IDE4LFxuICAncGF1c2UnOiAxOSxcbiAgJ2JyZWFrJzogMTksXG4gICdjYXBzJzogMjAsXG4gICdyZXR1cm4nOiAxMyxcbiAgJ2VzY2FwZSc6IDI3LFxuICAnc3BjJzogMzIsXG4gICdwZ3VwJzogMzMsXG4gICdwZ2RuJzogMzMsXG4gICdpbnMnOiA0NSxcbiAgJ2RlbCc6IDQ2LFxuICAnY21kJzogOTFcbn1cblxuXG4vKiFcbiAqIFByb2dyYW1hdGljYWxseSBhZGQgdGhlIGZvbGxvd2luZ1xuICovXG5cbi8vIGxvd2VyIGNhc2UgY2hhcnNcbmZvciAoaSA9IDk3OyBpIDwgMTIzOyBpKyspIGNvZGVzW1N0cmluZy5mcm9tQ2hhckNvZGUoaSldID0gaSAtIDMyXG5cbi8vIG51bWJlcnNcbmZvciAodmFyIGkgPSA0ODsgaSA8IDU4OyBpKyspIGNvZGVzW2kgLSA0OF0gPSBpXG5cbi8vIGZ1bmN0aW9uIGtleXNcbmZvciAoaSA9IDE7IGkgPCAxMzsgaSsrKSBjb2Rlc1snZicraV0gPSBpICsgMTExXG5cbi8vIG51bXBhZCBrZXlzXG5mb3IgKGkgPSAwOyBpIDwgMTA7IGkrKykgY29kZXNbJ251bXBhZCAnK2ldID0gaSArIDk2XG5cbi8qKlxuICogR2V0IGJ5IGNvZGVcbiAqXG4gKiAgIGV4cG9ydHMubmFtZVsxM10gLy8gPT4gJ0VudGVyJ1xuICovXG5cbnZhciBuYW1lcyA9IGV4cG9ydHMubmFtZXMgPSBleHBvcnRzLnRpdGxlID0ge30gLy8gdGl0bGUgZm9yIGJhY2t3YXJkIGNvbXBhdFxuXG4vLyBDcmVhdGUgcmV2ZXJzZSBtYXBwaW5nXG5mb3IgKGkgaW4gY29kZXMpIG5hbWVzW2NvZGVzW2ldXSA9IGlcblxuLy8gQWRkIGFsaWFzZXNcbmZvciAodmFyIGFsaWFzIGluIGFsaWFzZXMpIHtcbiAgY29kZXNbYWxpYXNdID0gYWxpYXNlc1thbGlhc11cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFyZ3MsIG9wdHMpIHtcbiAgICBpZiAoIW9wdHMpIG9wdHMgPSB7fTtcbiAgICBcbiAgICB2YXIgZmxhZ3MgPSB7IGJvb2xzIDoge30sIHN0cmluZ3MgOiB7fSwgdW5rbm93bkZuOiBudWxsIH07XG5cbiAgICBpZiAodHlwZW9mIG9wdHNbJ3Vua25vd24nXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBmbGFncy51bmtub3duRm4gPSBvcHRzWyd1bmtub3duJ107XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvcHRzWydib29sZWFuJ10gPT09ICdib29sZWFuJyAmJiBvcHRzWydib29sZWFuJ10pIHtcbiAgICAgIGZsYWdzLmFsbEJvb2xzID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgW10uY29uY2F0KG9wdHNbJ2Jvb2xlYW4nXSkuZmlsdGVyKEJvb2xlYW4pLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgIGZsYWdzLmJvb2xzW2tleV0gPSB0cnVlO1xuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIHZhciBhbGlhc2VzID0ge307XG4gICAgT2JqZWN0LmtleXMob3B0cy5hbGlhcyB8fCB7fSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGFsaWFzZXNba2V5XSA9IFtdLmNvbmNhdChvcHRzLmFsaWFzW2tleV0pO1xuICAgICAgICBhbGlhc2VzW2tleV0uZm9yRWFjaChmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgYWxpYXNlc1t4XSA9IFtrZXldLmNvbmNhdChhbGlhc2VzW2tleV0uZmlsdGVyKGZ1bmN0aW9uICh5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHggIT09IHk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgW10uY29uY2F0KG9wdHMuc3RyaW5nKS5maWx0ZXIoQm9vbGVhbikuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGZsYWdzLnN0cmluZ3Nba2V5XSA9IHRydWU7XG4gICAgICAgIGlmIChhbGlhc2VzW2tleV0pIHtcbiAgICAgICAgICAgIGZsYWdzLnN0cmluZ3NbYWxpYXNlc1trZXldXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgfSk7XG5cbiAgICB2YXIgZGVmYXVsdHMgPSBvcHRzWydkZWZhdWx0J10gfHwge307XG4gICAgXG4gICAgdmFyIGFyZ3YgPSB7IF8gOiBbXSB9O1xuICAgIE9iamVjdC5rZXlzKGZsYWdzLmJvb2xzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgc2V0QXJnKGtleSwgZGVmYXVsdHNba2V5XSA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiBkZWZhdWx0c1trZXldKTtcbiAgICB9KTtcbiAgICBcbiAgICB2YXIgbm90RmxhZ3MgPSBbXTtcblxuICAgIGlmIChhcmdzLmluZGV4T2YoJy0tJykgIT09IC0xKSB7XG4gICAgICAgIG5vdEZsYWdzID0gYXJncy5zbGljZShhcmdzLmluZGV4T2YoJy0tJykrMSk7XG4gICAgICAgIGFyZ3MgPSBhcmdzLnNsaWNlKDAsIGFyZ3MuaW5kZXhPZignLS0nKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYXJnRGVmaW5lZChrZXksIGFyZykge1xuICAgICAgICByZXR1cm4gKGZsYWdzLmFsbEJvb2xzICYmIC9eLS1bXj1dKyQvLnRlc3QoYXJnKSkgfHxcbiAgICAgICAgICAgIGZsYWdzLnN0cmluZ3Nba2V5XSB8fCBmbGFncy5ib29sc1trZXldIHx8IGFsaWFzZXNba2V5XTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRBcmcgKGtleSwgdmFsLCBhcmcpIHtcbiAgICAgICAgaWYgKGFyZyAmJiBmbGFncy51bmtub3duRm4gJiYgIWFyZ0RlZmluZWQoa2V5LCBhcmcpKSB7XG4gICAgICAgICAgICBpZiAoZmxhZ3MudW5rbm93bkZuKGFyZykgPT09IGZhbHNlKSByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdmFsdWUgPSAhZmxhZ3Muc3RyaW5nc1trZXldICYmIGlzTnVtYmVyKHZhbClcbiAgICAgICAgICAgID8gTnVtYmVyKHZhbCkgOiB2YWxcbiAgICAgICAgO1xuICAgICAgICBzZXRLZXkoYXJndiwga2V5LnNwbGl0KCcuJyksIHZhbHVlKTtcbiAgICAgICAgXG4gICAgICAgIChhbGlhc2VzW2tleV0gfHwgW10pLmZvckVhY2goZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIHNldEtleShhcmd2LCB4LnNwbGl0KCcuJyksIHZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0S2V5IChvYmosIGtleXMsIHZhbHVlKSB7XG4gICAgICAgIHZhciBvID0gb2JqO1xuICAgICAgICBrZXlzLnNsaWNlKDAsLTEpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgaWYgKG9ba2V5XSA9PT0gdW5kZWZpbmVkKSBvW2tleV0gPSB7fTtcbiAgICAgICAgICAgIG8gPSBvW2tleV07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBrZXkgPSBrZXlzW2tleXMubGVuZ3RoIC0gMV07XG4gICAgICAgIGlmIChvW2tleV0gPT09IHVuZGVmaW5lZCB8fCBmbGFncy5ib29sc1trZXldIHx8IHR5cGVvZiBvW2tleV0gPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgb1trZXldID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvW2tleV0pKSB7XG4gICAgICAgICAgICBvW2tleV0ucHVzaCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBvW2tleV0gPSBbIG9ba2V5XSwgdmFsdWUgXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiBhbGlhc0lzQm9vbGVhbihrZXkpIHtcbiAgICAgIHJldHVybiBhbGlhc2VzW2tleV0uc29tZShmdW5jdGlvbiAoeCkge1xuICAgICAgICAgIHJldHVybiBmbGFncy5ib29sc1t4XTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgYXJnID0gYXJnc1tpXTtcbiAgICAgICAgXG4gICAgICAgIGlmICgvXi0tLis9Ly50ZXN0KGFyZykpIHtcbiAgICAgICAgICAgIC8vIFVzaW5nIFtcXHNcXFNdIGluc3RlYWQgb2YgLiBiZWNhdXNlIGpzIGRvZXNuJ3Qgc3VwcG9ydCB0aGVcbiAgICAgICAgICAgIC8vICdkb3RhbGwnIHJlZ2V4IG1vZGlmaWVyLiBTZWU6XG4gICAgICAgICAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xMDY4MzA4LzEzMjE2XG4gICAgICAgICAgICB2YXIgbSA9IGFyZy5tYXRjaCgvXi0tKFtePV0rKT0oW1xcc1xcU10qKSQvKTtcbiAgICAgICAgICAgIHZhciBrZXkgPSBtWzFdO1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gbVsyXTtcbiAgICAgICAgICAgIGlmIChmbGFncy5ib29sc1trZXldKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAhPT0gJ2ZhbHNlJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNldEFyZyhrZXksIHZhbHVlLCBhcmcpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKC9eLS1uby0uKy8udGVzdChhcmcpKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gYXJnLm1hdGNoKC9eLS1uby0oLispLylbMV07XG4gICAgICAgICAgICBzZXRBcmcoa2V5LCBmYWxzZSwgYXJnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICgvXi0tLisvLnRlc3QoYXJnKSkge1xuICAgICAgICAgICAgdmFyIGtleSA9IGFyZy5tYXRjaCgvXi0tKC4rKS8pWzFdO1xuICAgICAgICAgICAgdmFyIG5leHQgPSBhcmdzW2kgKyAxXTtcbiAgICAgICAgICAgIGlmIChuZXh0ICE9PSB1bmRlZmluZWQgJiYgIS9eLS8udGVzdChuZXh0KVxuICAgICAgICAgICAgJiYgIWZsYWdzLmJvb2xzW2tleV1cbiAgICAgICAgICAgICYmICFmbGFncy5hbGxCb29sc1xuICAgICAgICAgICAgJiYgKGFsaWFzZXNba2V5XSA/ICFhbGlhc0lzQm9vbGVhbihrZXkpIDogdHJ1ZSkpIHtcbiAgICAgICAgICAgICAgICBzZXRBcmcoa2V5LCBuZXh0LCBhcmcpO1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKC9eKHRydWV8ZmFsc2UpJC8udGVzdChuZXh0KSkge1xuICAgICAgICAgICAgICAgIHNldEFyZyhrZXksIG5leHQgPT09ICd0cnVlJywgYXJnKTtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZXRBcmcoa2V5LCBmbGFncy5zdHJpbmdzW2tleV0gPyAnJyA6IHRydWUsIGFyZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoL14tW14tXSsvLnRlc3QoYXJnKSkge1xuICAgICAgICAgICAgdmFyIGxldHRlcnMgPSBhcmcuc2xpY2UoMSwtMSkuc3BsaXQoJycpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgYnJva2VuID0gZmFsc2U7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGxldHRlcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dCA9IGFyZy5zbGljZShqKzIpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChuZXh0ID09PSAnLScpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0QXJnKGxldHRlcnNbal0sIG5leHQsIGFyZylcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICgvW0EtWmEtel0vLnRlc3QobGV0dGVyc1tqXSkgJiYgLz0vLnRlc3QobmV4dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0QXJnKGxldHRlcnNbal0sIG5leHQuc3BsaXQoJz0nKVsxXSwgYXJnKTtcbiAgICAgICAgICAgICAgICAgICAgYnJva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICgvW0EtWmEtel0vLnRlc3QobGV0dGVyc1tqXSlcbiAgICAgICAgICAgICAgICAmJiAvLT9cXGQrKFxcLlxcZCopPyhlLT9cXGQrKT8kLy50ZXN0KG5leHQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldEFyZyhsZXR0ZXJzW2pdLCBuZXh0LCBhcmcpO1xuICAgICAgICAgICAgICAgICAgICBicm9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKGxldHRlcnNbaisxXSAmJiBsZXR0ZXJzW2orMV0ubWF0Y2goL1xcVy8pKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldEFyZyhsZXR0ZXJzW2pdLCBhcmcuc2xpY2UoaisyKSwgYXJnKTtcbiAgICAgICAgICAgICAgICAgICAgYnJva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZXRBcmcobGV0dGVyc1tqXSwgZmxhZ3Muc3RyaW5nc1tsZXR0ZXJzW2pdXSA/ICcnIDogdHJ1ZSwgYXJnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBrZXkgPSBhcmcuc2xpY2UoLTEpWzBdO1xuICAgICAgICAgICAgaWYgKCFicm9rZW4gJiYga2V5ICE9PSAnLScpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJnc1tpKzFdICYmICEvXigtfC0tKVteLV0vLnRlc3QoYXJnc1tpKzFdKVxuICAgICAgICAgICAgICAgICYmICFmbGFncy5ib29sc1trZXldXG4gICAgICAgICAgICAgICAgJiYgKGFsaWFzZXNba2V5XSA/ICFhbGlhc0lzQm9vbGVhbihrZXkpIDogdHJ1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0QXJnKGtleSwgYXJnc1tpKzFdLCBhcmcpO1xuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGFyZ3NbaSsxXSAmJiAvdHJ1ZXxmYWxzZS8udGVzdChhcmdzW2krMV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldEFyZyhrZXksIGFyZ3NbaSsxXSA9PT0gJ3RydWUnLCBhcmcpO1xuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZXRBcmcoa2V5LCBmbGFncy5zdHJpbmdzW2tleV0gPyAnJyA6IHRydWUsIGFyZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFmbGFncy51bmtub3duRm4gfHwgZmxhZ3MudW5rbm93bkZuKGFyZykgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgYXJndi5fLnB1c2goXG4gICAgICAgICAgICAgICAgICAgIGZsYWdzLnN0cmluZ3NbJ18nXSB8fCAhaXNOdW1iZXIoYXJnKSA/IGFyZyA6IE51bWJlcihhcmcpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRzLnN0b3BFYXJseSkge1xuICAgICAgICAgICAgICAgIGFyZ3YuXy5wdXNoLmFwcGx5KGFyZ3YuXywgYXJncy5zbGljZShpICsgMSkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIE9iamVjdC5rZXlzKGRlZmF1bHRzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgaWYgKCFoYXNLZXkoYXJndiwga2V5LnNwbGl0KCcuJykpKSB7XG4gICAgICAgICAgICBzZXRLZXkoYXJndiwga2V5LnNwbGl0KCcuJyksIGRlZmF1bHRzW2tleV0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAoYWxpYXNlc1trZXldIHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgc2V0S2V5KGFyZ3YsIHguc3BsaXQoJy4nKSwgZGVmYXVsdHNba2V5XSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIFxuICAgIGlmIChvcHRzWyctLSddKSB7XG4gICAgICAgIGFyZ3ZbJy0tJ10gPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgbm90RmxhZ3MuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgIGFyZ3ZbJy0tJ10ucHVzaChrZXkpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIG5vdEZsYWdzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICBhcmd2Ll8ucHVzaChrZXkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXJndjtcbn07XG5cbmZ1bmN0aW9uIGhhc0tleSAob2JqLCBrZXlzKSB7XG4gICAgdmFyIG8gPSBvYmo7XG4gICAga2V5cy5zbGljZSgwLC0xKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgbyA9IChvW2tleV0gfHwge30pO1xuICAgIH0pO1xuXG4gICAgdmFyIGtleSA9IGtleXNba2V5cy5sZW5ndGggLSAxXTtcbiAgICByZXR1cm4ga2V5IGluIG87XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ID09PSAnbnVtYmVyJykgcmV0dXJuIHRydWU7XG4gICAgaWYgKC9eMHhbMC05YS1mXSskL2kudGVzdCh4KSkgcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIC9eWy0rXT8oPzpcXGQrKD86XFwuXFxkKik/fFxcLlxcZCspKGVbLStdP1xcZCspPyQvLnRlc3QoeCk7XG59XG5cbiIsInZhciBpb3RhID0gcmVxdWlyZShcImlvdGEtYXJyYXlcIilcbnZhciBpc0J1ZmZlciA9IHJlcXVpcmUoXCJpcy1idWZmZXJcIilcblxudmFyIGhhc1R5cGVkQXJyYXlzICA9ICgodHlwZW9mIEZsb2F0NjRBcnJheSkgIT09IFwidW5kZWZpbmVkXCIpXG5cbmZ1bmN0aW9uIGNvbXBhcmUxc3QoYSwgYikge1xuICByZXR1cm4gYVswXSAtIGJbMF1cbn1cblxuZnVuY3Rpb24gb3JkZXIoKSB7XG4gIHZhciBzdHJpZGUgPSB0aGlzLnN0cmlkZVxuICB2YXIgdGVybXMgPSBuZXcgQXJyYXkoc3RyaWRlLmxlbmd0aClcbiAgdmFyIGlcbiAgZm9yKGk9MDsgaTx0ZXJtcy5sZW5ndGg7ICsraSkge1xuICAgIHRlcm1zW2ldID0gW01hdGguYWJzKHN0cmlkZVtpXSksIGldXG4gIH1cbiAgdGVybXMuc29ydChjb21wYXJlMXN0KVxuICB2YXIgcmVzdWx0ID0gbmV3IEFycmF5KHRlcm1zLmxlbmd0aClcbiAgZm9yKGk9MDsgaTxyZXN1bHQubGVuZ3RoOyArK2kpIHtcbiAgICByZXN1bHRbaV0gPSB0ZXJtc1tpXVsxXVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuZnVuY3Rpb24gY29tcGlsZUNvbnN0cnVjdG9yKGR0eXBlLCBkaW1lbnNpb24pIHtcbiAgdmFyIGNsYXNzTmFtZSA9IFtcIlZpZXdcIiwgZGltZW5zaW9uLCBcImRcIiwgZHR5cGVdLmpvaW4oXCJcIilcbiAgaWYoZGltZW5zaW9uIDwgMCkge1xuICAgIGNsYXNzTmFtZSA9IFwiVmlld19OaWxcIiArIGR0eXBlXG4gIH1cbiAgdmFyIHVzZUdldHRlcnMgPSAoZHR5cGUgPT09IFwiZ2VuZXJpY1wiKVxuXG4gIGlmKGRpbWVuc2lvbiA9PT0gLTEpIHtcbiAgICAvL1NwZWNpYWwgY2FzZSBmb3IgdHJpdmlhbCBhcnJheXNcbiAgICB2YXIgY29kZSA9XG4gICAgICBcImZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIihhKXt0aGlzLmRhdGE9YTt9O1xcXG52YXIgcHJvdG89XCIrY2xhc3NOYW1lK1wiLnByb3RvdHlwZTtcXFxucHJvdG8uZHR5cGU9J1wiK2R0eXBlK1wiJztcXFxucHJvdG8uaW5kZXg9ZnVuY3Rpb24oKXtyZXR1cm4gLTF9O1xcXG5wcm90by5zaXplPTA7XFxcbnByb3RvLmRpbWVuc2lvbj0tMTtcXFxucHJvdG8uc2hhcGU9cHJvdG8uc3RyaWRlPXByb3RvLm9yZGVyPVtdO1xcXG5wcm90by5sbz1wcm90by5oaT1wcm90by50cmFuc3Bvc2U9cHJvdG8uc3RlcD1cXFxuZnVuY3Rpb24oKXtyZXR1cm4gbmV3IFwiK2NsYXNzTmFtZStcIih0aGlzLmRhdGEpO307XFxcbnByb3RvLmdldD1wcm90by5zZXQ9ZnVuY3Rpb24oKXt9O1xcXG5wcm90by5waWNrPWZ1bmN0aW9uKCl7cmV0dXJuIG51bGx9O1xcXG5yZXR1cm4gZnVuY3Rpb24gY29uc3RydWN0X1wiK2NsYXNzTmFtZStcIihhKXtyZXR1cm4gbmV3IFwiK2NsYXNzTmFtZStcIihhKTt9XCJcbiAgICB2YXIgcHJvY2VkdXJlID0gbmV3IEZ1bmN0aW9uKGNvZGUpXG4gICAgcmV0dXJuIHByb2NlZHVyZSgpXG4gIH0gZWxzZSBpZihkaW1lbnNpb24gPT09IDApIHtcbiAgICAvL1NwZWNpYWwgY2FzZSBmb3IgMGQgYXJyYXlzXG4gICAgdmFyIGNvZGUgPVxuICAgICAgXCJmdW5jdGlvbiBcIitjbGFzc05hbWUrXCIoYSxkKSB7XFxcbnRoaXMuZGF0YSA9IGE7XFxcbnRoaXMub2Zmc2V0ID0gZFxcXG59O1xcXG52YXIgcHJvdG89XCIrY2xhc3NOYW1lK1wiLnByb3RvdHlwZTtcXFxucHJvdG8uZHR5cGU9J1wiK2R0eXBlK1wiJztcXFxucHJvdG8uaW5kZXg9ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5vZmZzZXR9O1xcXG5wcm90by5kaW1lbnNpb249MDtcXFxucHJvdG8uc2l6ZT0xO1xcXG5wcm90by5zaGFwZT1cXFxucHJvdG8uc3RyaWRlPVxcXG5wcm90by5vcmRlcj1bXTtcXFxucHJvdG8ubG89XFxcbnByb3RvLmhpPVxcXG5wcm90by50cmFuc3Bvc2U9XFxcbnByb3RvLnN0ZXA9ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX2NvcHkoKSB7XFxcbnJldHVybiBuZXcgXCIrY2xhc3NOYW1lK1wiKHRoaXMuZGF0YSx0aGlzLm9mZnNldClcXFxufTtcXFxucHJvdG8ucGljaz1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfcGljaygpe1xcXG5yZXR1cm4gVHJpdmlhbEFycmF5KHRoaXMuZGF0YSk7XFxcbn07XFxcbnByb3RvLnZhbHVlT2Y9cHJvdG8uZ2V0PWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9nZXQoKXtcXFxucmV0dXJuIFwiKyh1c2VHZXR0ZXJzID8gXCJ0aGlzLmRhdGEuZ2V0KHRoaXMub2Zmc2V0KVwiIDogXCJ0aGlzLmRhdGFbdGhpcy5vZmZzZXRdXCIpK1xuXCJ9O1xcXG5wcm90by5zZXQ9ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX3NldCh2KXtcXFxucmV0dXJuIFwiKyh1c2VHZXR0ZXJzID8gXCJ0aGlzLmRhdGEuc2V0KHRoaXMub2Zmc2V0LHYpXCIgOiBcInRoaXMuZGF0YVt0aGlzLm9mZnNldF09dlwiKStcIlxcXG59O1xcXG5yZXR1cm4gZnVuY3Rpb24gY29uc3RydWN0X1wiK2NsYXNzTmFtZStcIihhLGIsYyxkKXtyZXR1cm4gbmV3IFwiK2NsYXNzTmFtZStcIihhLGQpfVwiXG4gICAgdmFyIHByb2NlZHVyZSA9IG5ldyBGdW5jdGlvbihcIlRyaXZpYWxBcnJheVwiLCBjb2RlKVxuICAgIHJldHVybiBwcm9jZWR1cmUoQ0FDSEVEX0NPTlNUUlVDVE9SU1tkdHlwZV1bMF0pXG4gIH1cblxuICB2YXIgY29kZSA9IFtcIid1c2Ugc3RyaWN0J1wiXVxuXG4gIC8vQ3JlYXRlIGNvbnN0cnVjdG9yIGZvciB2aWV3XG4gIHZhciBpbmRpY2VzID0gaW90YShkaW1lbnNpb24pXG4gIHZhciBhcmdzID0gaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkgeyByZXR1cm4gXCJpXCIraSB9KVxuICB2YXIgaW5kZXhfc3RyID0gXCJ0aGlzLm9mZnNldCtcIiArIGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgcmV0dXJuIFwidGhpcy5zdHJpZGVbXCIgKyBpICsgXCJdKmlcIiArIGlcbiAgICAgIH0pLmpvaW4oXCIrXCIpXG4gIHZhciBzaGFwZUFyZyA9IGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBcImJcIitpXG4gICAgfSkuam9pbihcIixcIilcbiAgdmFyIHN0cmlkZUFyZyA9IGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBcImNcIitpXG4gICAgfSkuam9pbihcIixcIilcbiAgY29kZS5wdXNoKFxuICAgIFwiZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiKGEsXCIgKyBzaGFwZUFyZyArIFwiLFwiICsgc3RyaWRlQXJnICsgXCIsZCl7dGhpcy5kYXRhPWFcIixcbiAgICAgIFwidGhpcy5zaGFwZT1bXCIgKyBzaGFwZUFyZyArIFwiXVwiLFxuICAgICAgXCJ0aGlzLnN0cmlkZT1bXCIgKyBzdHJpZGVBcmcgKyBcIl1cIixcbiAgICAgIFwidGhpcy5vZmZzZXQ9ZHwwfVwiLFxuICAgIFwidmFyIHByb3RvPVwiK2NsYXNzTmFtZStcIi5wcm90b3R5cGVcIixcbiAgICBcInByb3RvLmR0eXBlPSdcIitkdHlwZStcIidcIixcbiAgICBcInByb3RvLmRpbWVuc2lvbj1cIitkaW1lbnNpb24pXG5cbiAgLy92aWV3LnNpemU6XG4gIGNvZGUucHVzaChcIk9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywnc2l6ZScse2dldDpmdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfc2l6ZSgpe1xcXG5yZXR1cm4gXCIraW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkgeyByZXR1cm4gXCJ0aGlzLnNoYXBlW1wiK2krXCJdXCIgfSkuam9pbihcIipcIiksXG5cIn19KVwiKVxuXG4gIC8vdmlldy5vcmRlcjpcbiAgaWYoZGltZW5zaW9uID09PSAxKSB7XG4gICAgY29kZS5wdXNoKFwicHJvdG8ub3JkZXI9WzBdXCIpXG4gIH0gZWxzZSB7XG4gICAgY29kZS5wdXNoKFwiT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCdvcmRlcicse2dldDpcIilcbiAgICBpZihkaW1lbnNpb24gPCA0KSB7XG4gICAgICBjb2RlLnB1c2goXCJmdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfb3JkZXIoKXtcIilcbiAgICAgIGlmKGRpbWVuc2lvbiA9PT0gMikge1xuICAgICAgICBjb2RlLnB1c2goXCJyZXR1cm4gKE1hdGguYWJzKHRoaXMuc3RyaWRlWzBdKT5NYXRoLmFicyh0aGlzLnN0cmlkZVsxXSkpP1sxLDBdOlswLDFdfX0pXCIpXG4gICAgICB9IGVsc2UgaWYoZGltZW5zaW9uID09PSAzKSB7XG4gICAgICAgIGNvZGUucHVzaChcblwidmFyIHMwPU1hdGguYWJzKHRoaXMuc3RyaWRlWzBdKSxzMT1NYXRoLmFicyh0aGlzLnN0cmlkZVsxXSksczI9TWF0aC5hYnModGhpcy5zdHJpZGVbMl0pO1xcXG5pZihzMD5zMSl7XFxcbmlmKHMxPnMyKXtcXFxucmV0dXJuIFsyLDEsMF07XFxcbn1lbHNlIGlmKHMwPnMyKXtcXFxucmV0dXJuIFsxLDIsMF07XFxcbn1lbHNle1xcXG5yZXR1cm4gWzEsMCwyXTtcXFxufVxcXG59ZWxzZSBpZihzMD5zMil7XFxcbnJldHVybiBbMiwwLDFdO1xcXG59ZWxzZSBpZihzMj5zMSl7XFxcbnJldHVybiBbMCwxLDJdO1xcXG59ZWxzZXtcXFxucmV0dXJuIFswLDIsMV07XFxcbn19fSlcIilcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29kZS5wdXNoKFwiT1JERVJ9KVwiKVxuICAgIH1cbiAgfVxuXG4gIC8vdmlldy5zZXQoaTAsIC4uLiwgdik6XG4gIGNvZGUucHVzaChcblwicHJvdG8uc2V0PWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9zZXQoXCIrYXJncy5qb2luKFwiLFwiKStcIix2KXtcIilcbiAgaWYodXNlR2V0dGVycykge1xuICAgIGNvZGUucHVzaChcInJldHVybiB0aGlzLmRhdGEuc2V0KFwiK2luZGV4X3N0citcIix2KX1cIilcbiAgfSBlbHNlIHtcbiAgICBjb2RlLnB1c2goXCJyZXR1cm4gdGhpcy5kYXRhW1wiK2luZGV4X3N0citcIl09dn1cIilcbiAgfVxuXG4gIC8vdmlldy5nZXQoaTAsIC4uLik6XG4gIGNvZGUucHVzaChcInByb3RvLmdldD1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfZ2V0KFwiK2FyZ3Muam9pbihcIixcIikrXCIpe1wiKVxuICBpZih1c2VHZXR0ZXJzKSB7XG4gICAgY29kZS5wdXNoKFwicmV0dXJuIHRoaXMuZGF0YS5nZXQoXCIraW5kZXhfc3RyK1wiKX1cIilcbiAgfSBlbHNlIHtcbiAgICBjb2RlLnB1c2goXCJyZXR1cm4gdGhpcy5kYXRhW1wiK2luZGV4X3N0citcIl19XCIpXG4gIH1cblxuICAvL3ZpZXcuaW5kZXg6XG4gIGNvZGUucHVzaChcbiAgICBcInByb3RvLmluZGV4PWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9pbmRleChcIiwgYXJncy5qb2luKCksIFwiKXtyZXR1cm4gXCIraW5kZXhfc3RyK1wifVwiKVxuXG4gIC8vdmlldy5oaSgpOlxuICBjb2RlLnB1c2goXCJwcm90by5oaT1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfaGkoXCIrYXJncy5qb2luKFwiLFwiKStcIil7cmV0dXJuIG5ldyBcIitjbGFzc05hbWUrXCIodGhpcy5kYXRhLFwiK1xuICAgIGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBbXCIodHlwZW9mIGlcIixpLFwiIT09J251bWJlcid8fGlcIixpLFwiPDApP3RoaXMuc2hhcGVbXCIsIGksIFwiXTppXCIsIGksXCJ8MFwiXS5qb2luKFwiXCIpXG4gICAgfSkuam9pbihcIixcIikrXCIsXCIrXG4gICAgaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFwidGhpcy5zdHJpZGVbXCIraSArIFwiXVwiXG4gICAgfSkuam9pbihcIixcIikrXCIsdGhpcy5vZmZzZXQpfVwiKVxuXG4gIC8vdmlldy5sbygpOlxuICB2YXIgYV92YXJzID0gaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkgeyByZXR1cm4gXCJhXCIraStcIj10aGlzLnNoYXBlW1wiK2krXCJdXCIgfSlcbiAgdmFyIGNfdmFycyA9IGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHsgcmV0dXJuIFwiY1wiK2krXCI9dGhpcy5zdHJpZGVbXCIraStcIl1cIiB9KVxuICBjb2RlLnB1c2goXCJwcm90by5sbz1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfbG8oXCIrYXJncy5qb2luKFwiLFwiKStcIil7dmFyIGI9dGhpcy5vZmZzZXQsZD0wLFwiK2FfdmFycy5qb2luKFwiLFwiKStcIixcIitjX3ZhcnMuam9pbihcIixcIikpXG4gIGZvcih2YXIgaT0wOyBpPGRpbWVuc2lvbjsgKytpKSB7XG4gICAgY29kZS5wdXNoKFxuXCJpZih0eXBlb2YgaVwiK2krXCI9PT0nbnVtYmVyJyYmaVwiK2krXCI+PTApe1xcXG5kPWlcIitpK1wifDA7XFxcbmIrPWNcIitpK1wiKmQ7XFxcbmFcIitpK1wiLT1kfVwiKVxuICB9XG4gIGNvZGUucHVzaChcInJldHVybiBuZXcgXCIrY2xhc3NOYW1lK1wiKHRoaXMuZGF0YSxcIitcbiAgICBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gXCJhXCIraVxuICAgIH0pLmpvaW4oXCIsXCIpK1wiLFwiK1xuICAgIGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBcImNcIitpXG4gICAgfSkuam9pbihcIixcIikrXCIsYil9XCIpXG5cbiAgLy92aWV3LnN0ZXAoKTpcbiAgY29kZS5wdXNoKFwicHJvdG8uc3RlcD1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfc3RlcChcIithcmdzLmpvaW4oXCIsXCIpK1wiKXt2YXIgXCIrXG4gICAgaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFwiYVwiK2krXCI9dGhpcy5zaGFwZVtcIitpK1wiXVwiXG4gICAgfSkuam9pbihcIixcIikrXCIsXCIrXG4gICAgaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFwiYlwiK2krXCI9dGhpcy5zdHJpZGVbXCIraStcIl1cIlxuICAgIH0pLmpvaW4oXCIsXCIpK1wiLGM9dGhpcy5vZmZzZXQsZD0wLGNlaWw9TWF0aC5jZWlsXCIpXG4gIGZvcih2YXIgaT0wOyBpPGRpbWVuc2lvbjsgKytpKSB7XG4gICAgY29kZS5wdXNoKFxuXCJpZih0eXBlb2YgaVwiK2krXCI9PT0nbnVtYmVyJyl7XFxcbmQ9aVwiK2krXCJ8MDtcXFxuaWYoZDwwKXtcXFxuYys9YlwiK2krXCIqKGFcIitpK1wiLTEpO1xcXG5hXCIraStcIj1jZWlsKC1hXCIraStcIi9kKVxcXG59ZWxzZXtcXFxuYVwiK2krXCI9Y2VpbChhXCIraStcIi9kKVxcXG59XFxcbmJcIitpK1wiKj1kXFxcbn1cIilcbiAgfVxuICBjb2RlLnB1c2goXCJyZXR1cm4gbmV3IFwiK2NsYXNzTmFtZStcIih0aGlzLmRhdGEsXCIrXG4gICAgaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFwiYVwiICsgaVxuICAgIH0pLmpvaW4oXCIsXCIpK1wiLFwiK1xuICAgIGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBcImJcIiArIGlcbiAgICB9KS5qb2luKFwiLFwiKStcIixjKX1cIilcblxuICAvL3ZpZXcudHJhbnNwb3NlKCk6XG4gIHZhciB0U2hhcGUgPSBuZXcgQXJyYXkoZGltZW5zaW9uKVxuICB2YXIgdFN0cmlkZSA9IG5ldyBBcnJheShkaW1lbnNpb24pXG4gIGZvcih2YXIgaT0wOyBpPGRpbWVuc2lvbjsgKytpKSB7XG4gICAgdFNoYXBlW2ldID0gXCJhW2lcIitpK1wiXVwiXG4gICAgdFN0cmlkZVtpXSA9IFwiYltpXCIraStcIl1cIlxuICB9XG4gIGNvZGUucHVzaChcInByb3RvLnRyYW5zcG9zZT1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfdHJhbnNwb3NlKFwiK2FyZ3MrXCIpe1wiK1xuICAgIGFyZ3MubWFwKGZ1bmN0aW9uKG4saWR4KSB7IHJldHVybiBuICsgXCI9KFwiICsgbiArIFwiPT09dW5kZWZpbmVkP1wiICsgaWR4ICsgXCI6XCIgKyBuICsgXCJ8MClcIn0pLmpvaW4oXCI7XCIpLFxuICAgIFwidmFyIGE9dGhpcy5zaGFwZSxiPXRoaXMuc3RyaWRlO3JldHVybiBuZXcgXCIrY2xhc3NOYW1lK1wiKHRoaXMuZGF0YSxcIit0U2hhcGUuam9pbihcIixcIikrXCIsXCIrdFN0cmlkZS5qb2luKFwiLFwiKStcIix0aGlzLm9mZnNldCl9XCIpXG5cbiAgLy92aWV3LnBpY2soKTpcbiAgY29kZS5wdXNoKFwicHJvdG8ucGljaz1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfcGljayhcIithcmdzK1wiKXt2YXIgYT1bXSxiPVtdLGM9dGhpcy5vZmZzZXRcIilcbiAgZm9yKHZhciBpPTA7IGk8ZGltZW5zaW9uOyArK2kpIHtcbiAgICBjb2RlLnB1c2goXCJpZih0eXBlb2YgaVwiK2krXCI9PT0nbnVtYmVyJyYmaVwiK2krXCI+PTApe2M9KGMrdGhpcy5zdHJpZGVbXCIraStcIl0qaVwiK2krXCIpfDB9ZWxzZXthLnB1c2godGhpcy5zaGFwZVtcIitpK1wiXSk7Yi5wdXNoKHRoaXMuc3RyaWRlW1wiK2krXCJdKX1cIilcbiAgfVxuICBjb2RlLnB1c2goXCJ2YXIgY3Rvcj1DVE9SX0xJU1RbYS5sZW5ndGgrMV07cmV0dXJuIGN0b3IodGhpcy5kYXRhLGEsYixjKX1cIilcblxuICAvL0FkZCByZXR1cm4gc3RhdGVtZW50XG4gIGNvZGUucHVzaChcInJldHVybiBmdW5jdGlvbiBjb25zdHJ1Y3RfXCIrY2xhc3NOYW1lK1wiKGRhdGEsc2hhcGUsc3RyaWRlLG9mZnNldCl7cmV0dXJuIG5ldyBcIitjbGFzc05hbWUrXCIoZGF0YSxcIitcbiAgICBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gXCJzaGFwZVtcIitpK1wiXVwiXG4gICAgfSkuam9pbihcIixcIikrXCIsXCIrXG4gICAgaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFwic3RyaWRlW1wiK2krXCJdXCJcbiAgICB9KS5qb2luKFwiLFwiKStcIixvZmZzZXQpfVwiKVxuXG4gIC8vQ29tcGlsZSBwcm9jZWR1cmVcbiAgdmFyIHByb2NlZHVyZSA9IG5ldyBGdW5jdGlvbihcIkNUT1JfTElTVFwiLCBcIk9SREVSXCIsIGNvZGUuam9pbihcIlxcblwiKSlcbiAgcmV0dXJuIHByb2NlZHVyZShDQUNIRURfQ09OU1RSVUNUT1JTW2R0eXBlXSwgb3JkZXIpXG59XG5cbmZ1bmN0aW9uIGFycmF5RFR5cGUoZGF0YSkge1xuICBpZihpc0J1ZmZlcihkYXRhKSkge1xuICAgIHJldHVybiBcImJ1ZmZlclwiXG4gIH1cbiAgaWYoaGFzVHlwZWRBcnJheXMpIHtcbiAgICBzd2l0Y2goT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGRhdGEpKSB7XG4gICAgICBjYXNlIFwiW29iamVjdCBGbG9hdDY0QXJyYXldXCI6XG4gICAgICAgIHJldHVybiBcImZsb2F0NjRcIlxuICAgICAgY2FzZSBcIltvYmplY3QgRmxvYXQzMkFycmF5XVwiOlxuICAgICAgICByZXR1cm4gXCJmbG9hdDMyXCJcbiAgICAgIGNhc2UgXCJbb2JqZWN0IEludDhBcnJheV1cIjpcbiAgICAgICAgcmV0dXJuIFwiaW50OFwiXG4gICAgICBjYXNlIFwiW29iamVjdCBJbnQxNkFycmF5XVwiOlxuICAgICAgICByZXR1cm4gXCJpbnQxNlwiXG4gICAgICBjYXNlIFwiW29iamVjdCBJbnQzMkFycmF5XVwiOlxuICAgICAgICByZXR1cm4gXCJpbnQzMlwiXG4gICAgICBjYXNlIFwiW29iamVjdCBVaW50OEFycmF5XVwiOlxuICAgICAgICByZXR1cm4gXCJ1aW50OFwiXG4gICAgICBjYXNlIFwiW29iamVjdCBVaW50MTZBcnJheV1cIjpcbiAgICAgICAgcmV0dXJuIFwidWludDE2XCJcbiAgICAgIGNhc2UgXCJbb2JqZWN0IFVpbnQzMkFycmF5XVwiOlxuICAgICAgICByZXR1cm4gXCJ1aW50MzJcIlxuICAgICAgY2FzZSBcIltvYmplY3QgVWludDhDbGFtcGVkQXJyYXldXCI6XG4gICAgICAgIHJldHVybiBcInVpbnQ4X2NsYW1wZWRcIlxuICAgIH1cbiAgfVxuICBpZihBcnJheS5pc0FycmF5KGRhdGEpKSB7XG4gICAgcmV0dXJuIFwiYXJyYXlcIlxuICB9XG4gIHJldHVybiBcImdlbmVyaWNcIlxufVxuXG52YXIgQ0FDSEVEX0NPTlNUUlVDVE9SUyA9IHtcbiAgXCJmbG9hdDMyXCI6W10sXG4gIFwiZmxvYXQ2NFwiOltdLFxuICBcImludDhcIjpbXSxcbiAgXCJpbnQxNlwiOltdLFxuICBcImludDMyXCI6W10sXG4gIFwidWludDhcIjpbXSxcbiAgXCJ1aW50MTZcIjpbXSxcbiAgXCJ1aW50MzJcIjpbXSxcbiAgXCJhcnJheVwiOltdLFxuICBcInVpbnQ4X2NsYW1wZWRcIjpbXSxcbiAgXCJidWZmZXJcIjpbXSxcbiAgXCJnZW5lcmljXCI6W11cbn1cblxuOyhmdW5jdGlvbigpIHtcbiAgZm9yKHZhciBpZCBpbiBDQUNIRURfQ09OU1RSVUNUT1JTKSB7XG4gICAgQ0FDSEVEX0NPTlNUUlVDVE9SU1tpZF0ucHVzaChjb21waWxlQ29uc3RydWN0b3IoaWQsIC0xKSlcbiAgfVxufSk7XG5cbmZ1bmN0aW9uIHdyYXBwZWROREFycmF5Q3RvcihkYXRhLCBzaGFwZSwgc3RyaWRlLCBvZmZzZXQpIHtcbiAgaWYoZGF0YSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdmFyIGN0b3IgPSBDQUNIRURfQ09OU1RSVUNUT1JTLmFycmF5WzBdXG4gICAgcmV0dXJuIGN0b3IoW10pXG4gIH0gZWxzZSBpZih0eXBlb2YgZGF0YSA9PT0gXCJudW1iZXJcIikge1xuICAgIGRhdGEgPSBbZGF0YV1cbiAgfVxuICBpZihzaGFwZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgc2hhcGUgPSBbIGRhdGEubGVuZ3RoIF1cbiAgfVxuICB2YXIgZCA9IHNoYXBlLmxlbmd0aFxuICBpZihzdHJpZGUgPT09IHVuZGVmaW5lZCkge1xuICAgIHN0cmlkZSA9IG5ldyBBcnJheShkKVxuICAgIGZvcih2YXIgaT1kLTEsIHN6PTE7IGk+PTA7IC0taSkge1xuICAgICAgc3RyaWRlW2ldID0gc3pcbiAgICAgIHN6ICo9IHNoYXBlW2ldXG4gICAgfVxuICB9XG4gIGlmKG9mZnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgb2Zmc2V0ID0gMFxuICAgIGZvcih2YXIgaT0wOyBpPGQ7ICsraSkge1xuICAgICAgaWYoc3RyaWRlW2ldIDwgMCkge1xuICAgICAgICBvZmZzZXQgLT0gKHNoYXBlW2ldLTEpKnN0cmlkZVtpXVxuICAgICAgfVxuICAgIH1cbiAgfVxuICB2YXIgZHR5cGUgPSBhcnJheURUeXBlKGRhdGEpXG4gIHZhciBjdG9yX2xpc3QgPSBDQUNIRURfQ09OU1RSVUNUT1JTW2R0eXBlXVxuICB3aGlsZShjdG9yX2xpc3QubGVuZ3RoIDw9IGQrMSkge1xuICAgIGN0b3JfbGlzdC5wdXNoKGNvbXBpbGVDb25zdHJ1Y3RvcihkdHlwZSwgY3Rvcl9saXN0Lmxlbmd0aC0xKSlcbiAgfVxuICB2YXIgY3RvciA9IGN0b3JfbGlzdFtkKzFdXG4gIHJldHVybiBjdG9yKGRhdGEsIHNoYXBlLCBzdHJpZGUsIG9mZnNldClcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB3cmFwcGVkTkRBcnJheUN0b3JcbiIsIi8qKlxuICogRGV0ZXJtaW5lIGlmIGFuIG9iamVjdCBpcyBCdWZmZXJcbiAqXG4gKiBBdXRob3I6ICAgRmVyb3NzIEFib3VraGFkaWplaCA8ZmVyb3NzQGZlcm9zcy5vcmc+IDxodHRwOi8vZmVyb3NzLm9yZz5cbiAqIExpY2Vuc2U6ICBNSVRcbiAqXG4gKiBgbnBtIGluc3RhbGwgaXMtYnVmZmVyYFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gISEob2JqICE9IG51bGwgJiZcbiAgICAob2JqLl9pc0J1ZmZlciB8fCAvLyBGb3IgU2FmYXJpIDUtNyAobWlzc2luZyBPYmplY3QucHJvdG90eXBlLmNvbnN0cnVjdG9yKVxuICAgICAgKG9iai5jb25zdHJ1Y3RvciAmJlxuICAgICAgdHlwZW9mIG9iai5jb25zdHJ1Y3Rvci5pc0J1ZmZlciA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgb2JqLmNvbnN0cnVjdG9yLmlzQnVmZmVyKG9iaikpXG4gICAgKSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBvaW50LCB2cykge1xuICAgIC8vIHJheS1jYXN0aW5nIGFsZ29yaXRobSBiYXNlZCBvblxuICAgIC8vIGh0dHA6Ly93d3cuZWNzZS5ycGkuZWR1L0hvbWVwYWdlcy93cmYvUmVzZWFyY2gvU2hvcnRfTm90ZXMvcG5wb2x5Lmh0bWxcbiAgICBcbiAgICB2YXIgeCA9IHBvaW50WzBdLCB5ID0gcG9pbnRbMV07XG4gICAgXG4gICAgdmFyIGluc2lkZSA9IGZhbHNlO1xuICAgIGZvciAodmFyIGkgPSAwLCBqID0gdnMubGVuZ3RoIC0gMTsgaSA8IHZzLmxlbmd0aDsgaiA9IGkrKykge1xuICAgICAgICB2YXIgeGkgPSB2c1tpXVswXSwgeWkgPSB2c1tpXVsxXTtcbiAgICAgICAgdmFyIHhqID0gdnNbal1bMF0sIHlqID0gdnNbal1bMV07XG4gICAgICAgIFxuICAgICAgICB2YXIgaW50ZXJzZWN0ID0gKCh5aSA+IHkpICE9ICh5aiA+IHkpKVxuICAgICAgICAgICAgJiYgKHggPCAoeGogLSB4aSkgKiAoeSAtIHlpKSAvICh5aiAtIHlpKSArIHhpKTtcbiAgICAgICAgaWYgKGludGVyc2VjdCkgaW5zaWRlID0gIWluc2lkZTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGluc2lkZTtcbn07XG4iLCIvKipcbiAqIEBhdXRob3IgbXJkb29iIC8gaHR0cDovL21yZG9vYi5jb20vXG4gKi9cblxudmFyIFN0YXRzID0gZnVuY3Rpb24gKCkge1xuXG5cdHZhciBzdGFydFRpbWUgPSBEYXRlLm5vdygpLCBwcmV2VGltZSA9IHN0YXJ0VGltZTtcblx0dmFyIG1zID0gMCwgbXNNaW4gPSBJbmZpbml0eSwgbXNNYXggPSAwO1xuXHR2YXIgZnBzID0gMCwgZnBzTWluID0gSW5maW5pdHksIGZwc01heCA9IDA7XG5cdHZhciBmcmFtZXMgPSAwLCBtb2RlID0gMDtcblxuXHR2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0Y29udGFpbmVyLmlkID0gJ3N0YXRzJztcblx0Y29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoICdtb3VzZWRvd24nLCBmdW5jdGlvbiAoIGV2ZW50ICkgeyBldmVudC5wcmV2ZW50RGVmYXVsdCgpOyBzZXRNb2RlKCArKyBtb2RlICUgMiApIH0sIGZhbHNlICk7XG5cdGNvbnRhaW5lci5zdHlsZS5jc3NUZXh0ID0gJ3dpZHRoOjgwcHg7b3BhY2l0eTowLjk7Y3Vyc29yOnBvaW50ZXInO1xuXG5cdHZhciBmcHNEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuXHRmcHNEaXYuaWQgPSAnZnBzJztcblx0ZnBzRGl2LnN0eWxlLmNzc1RleHQgPSAncGFkZGluZzowIDAgM3B4IDNweDt0ZXh0LWFsaWduOmxlZnQ7YmFja2dyb3VuZC1jb2xvcjojMDAyJztcblx0Y29udGFpbmVyLmFwcGVuZENoaWxkKCBmcHNEaXYgKTtcblxuXHR2YXIgZnBzVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG5cdGZwc1RleHQuaWQgPSAnZnBzVGV4dCc7XG5cdGZwc1RleHQuc3R5bGUuY3NzVGV4dCA9ICdjb2xvcjojMGZmO2ZvbnQtZmFtaWx5OkhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmO2ZvbnQtc2l6ZTo5cHg7Zm9udC13ZWlnaHQ6Ym9sZDtsaW5lLWhlaWdodDoxNXB4Jztcblx0ZnBzVGV4dC5pbm5lckhUTUwgPSAnRlBTJztcblx0ZnBzRGl2LmFwcGVuZENoaWxkKCBmcHNUZXh0ICk7XG5cblx0dmFyIGZwc0dyYXBoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0ZnBzR3JhcGguaWQgPSAnZnBzR3JhcGgnO1xuXHRmcHNHcmFwaC5zdHlsZS5jc3NUZXh0ID0gJ3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjc0cHg7aGVpZ2h0OjMwcHg7YmFja2dyb3VuZC1jb2xvcjojMGZmJztcblx0ZnBzRGl2LmFwcGVuZENoaWxkKCBmcHNHcmFwaCApO1xuXG5cdHdoaWxlICggZnBzR3JhcGguY2hpbGRyZW4ubGVuZ3RoIDwgNzQgKSB7XG5cblx0XHR2YXIgYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ3NwYW4nICk7XG5cdFx0YmFyLnN0eWxlLmNzc1RleHQgPSAnd2lkdGg6MXB4O2hlaWdodDozMHB4O2Zsb2F0OmxlZnQ7YmFja2dyb3VuZC1jb2xvcjojMTEzJztcblx0XHRmcHNHcmFwaC5hcHBlbmRDaGlsZCggYmFyICk7XG5cblx0fVxuXG5cdHZhciBtc0RpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG5cdG1zRGl2LmlkID0gJ21zJztcblx0bXNEaXYuc3R5bGUuY3NzVGV4dCA9ICdwYWRkaW5nOjAgMCAzcHggM3B4O3RleHQtYWxpZ246bGVmdDtiYWNrZ3JvdW5kLWNvbG9yOiMwMjA7ZGlzcGxheTpub25lJztcblx0Y29udGFpbmVyLmFwcGVuZENoaWxkKCBtc0RpdiApO1xuXG5cdHZhciBtc1RleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuXHRtc1RleHQuaWQgPSAnbXNUZXh0Jztcblx0bXNUZXh0LnN0eWxlLmNzc1RleHQgPSAnY29sb3I6IzBmMDtmb250LWZhbWlseTpIZWx2ZXRpY2EsQXJpYWwsc2Fucy1zZXJpZjtmb250LXNpemU6OXB4O2ZvbnQtd2VpZ2h0OmJvbGQ7bGluZS1oZWlnaHQ6MTVweCc7XG5cdG1zVGV4dC5pbm5lckhUTUwgPSAnTVMnO1xuXHRtc0Rpdi5hcHBlbmRDaGlsZCggbXNUZXh0ICk7XG5cblx0dmFyIG1zR3JhcGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuXHRtc0dyYXBoLmlkID0gJ21zR3JhcGgnO1xuXHRtc0dyYXBoLnN0eWxlLmNzc1RleHQgPSAncG9zaXRpb246cmVsYXRpdmU7d2lkdGg6NzRweDtoZWlnaHQ6MzBweDtiYWNrZ3JvdW5kLWNvbG9yOiMwZjAnO1xuXHRtc0Rpdi5hcHBlbmRDaGlsZCggbXNHcmFwaCApO1xuXG5cdHdoaWxlICggbXNHcmFwaC5jaGlsZHJlbi5sZW5ndGggPCA3NCApIHtcblxuXHRcdHZhciBiYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnc3BhbicgKTtcblx0XHRiYXIuc3R5bGUuY3NzVGV4dCA9ICd3aWR0aDoxcHg7aGVpZ2h0OjMwcHg7ZmxvYXQ6bGVmdDtiYWNrZ3JvdW5kLWNvbG9yOiMxMzEnO1xuXHRcdG1zR3JhcGguYXBwZW5kQ2hpbGQoIGJhciApO1xuXG5cdH1cblxuXHR2YXIgc2V0TW9kZSA9IGZ1bmN0aW9uICggdmFsdWUgKSB7XG5cblx0XHRtb2RlID0gdmFsdWU7XG5cblx0XHRzd2l0Y2ggKCBtb2RlICkge1xuXG5cdFx0XHRjYXNlIDA6XG5cdFx0XHRcdGZwc0Rpdi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblx0XHRcdFx0bXNEaXYuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIDE6XG5cdFx0XHRcdGZwc0Rpdi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXHRcdFx0XHRtc0Rpdi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXG5cdH07XG5cblx0dmFyIHVwZGF0ZUdyYXBoID0gZnVuY3Rpb24gKCBkb20sIHZhbHVlICkge1xuXG5cdFx0dmFyIGNoaWxkID0gZG9tLmFwcGVuZENoaWxkKCBkb20uZmlyc3RDaGlsZCApO1xuXHRcdGNoaWxkLnN0eWxlLmhlaWdodCA9IHZhbHVlICsgJ3B4JztcblxuXHR9O1xuXG5cdHJldHVybiB7XG5cblx0XHRSRVZJU0lPTjogMTIsXG5cblx0XHRkb21FbGVtZW50OiBjb250YWluZXIsXG5cblx0XHRzZXRNb2RlOiBzZXRNb2RlLFxuXG5cdFx0YmVnaW46IGZ1bmN0aW9uICgpIHtcblxuXHRcdFx0c3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcblxuXHRcdH0sXG5cblx0XHRlbmQ6IGZ1bmN0aW9uICgpIHtcblxuXHRcdFx0dmFyIHRpbWUgPSBEYXRlLm5vdygpO1xuXG5cdFx0XHRtcyA9IHRpbWUgLSBzdGFydFRpbWU7XG5cdFx0XHRtc01pbiA9IE1hdGgubWluKCBtc01pbiwgbXMgKTtcblx0XHRcdG1zTWF4ID0gTWF0aC5tYXgoIG1zTWF4LCBtcyApO1xuXG5cdFx0XHRtc1RleHQudGV4dENvbnRlbnQgPSBtcyArICcgTVMgKCcgKyBtc01pbiArICctJyArIG1zTWF4ICsgJyknO1xuXHRcdFx0dXBkYXRlR3JhcGgoIG1zR3JhcGgsIE1hdGgubWluKCAzMCwgMzAgLSAoIG1zIC8gMjAwICkgKiAzMCApICk7XG5cblx0XHRcdGZyYW1lcyArKztcblxuXHRcdFx0aWYgKCB0aW1lID4gcHJldlRpbWUgKyAxMDAwICkge1xuXG5cdFx0XHRcdGZwcyA9IE1hdGgucm91bmQoICggZnJhbWVzICogMTAwMCApIC8gKCB0aW1lIC0gcHJldlRpbWUgKSApO1xuXHRcdFx0XHRmcHNNaW4gPSBNYXRoLm1pbiggZnBzTWluLCBmcHMgKTtcblx0XHRcdFx0ZnBzTWF4ID0gTWF0aC5tYXgoIGZwc01heCwgZnBzICk7XG5cblx0XHRcdFx0ZnBzVGV4dC50ZXh0Q29udGVudCA9IGZwcyArICcgRlBTICgnICsgZnBzTWluICsgJy0nICsgZnBzTWF4ICsgJyknO1xuXHRcdFx0XHR1cGRhdGVHcmFwaCggZnBzR3JhcGgsIE1hdGgubWluKCAzMCwgMzAgLSAoIGZwcyAvIDEwMCApICogMzAgKSApO1xuXG5cdFx0XHRcdHByZXZUaW1lID0gdGltZTtcblx0XHRcdFx0ZnJhbWVzID0gMDtcblxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdGltZTtcblxuXHRcdH0sXG5cblx0XHR1cGRhdGU6IGZ1bmN0aW9uICgpIHtcblxuXHRcdFx0c3RhcnRUaW1lID0gdGhpcy5lbmQoKTtcblxuXHRcdH1cblxuXHR9XG5cbn07XG5cbmlmICggdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgKSB7XG5cblx0bW9kdWxlLmV4cG9ydHMgPSBTdGF0cztcblxufSIsInZhciBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydUSFJFRSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnVEhSRUUnXSA6IG51bGwpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFwcCkge1xuICB2YXIgc2NlbmUgPSBhcHAuZ2V0KCdzY2VuZScpO1xuXG4gIHZhciBvYmplY3QgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcblxuICB2YXIgZWRpdG9yID0gYXBwLmF0dGFjaChvYmplY3QsIHJlcXVpcmUoJy4uL2VkaXRvci9lZGl0b3InKSk7XG5cbiAgc2NlbmUuYWRkKG9iamVjdCk7XG5cbiAgcmV0dXJuIG9iamVjdDtcbn07IiwidmFyIG5kYXJyYXkgPSByZXF1aXJlKCduZGFycmF5Jyk7XG52YXIgVEhSRUUgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snVEhSRUUnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ1RIUkVFJ10gOiBudWxsKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcHApIHtcbiAgdmFyIHNjZW5lID0gYXBwLmdldCgnc2NlbmUnKTtcbiAgdmFyIGNhbWVyYSA9IGFwcC5nZXQoJ2NhbWVyYScpO1xuXG4gIHZhciBvYmplY3QgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcbiAgdmFyIGJsb2NrcyA9IGFwcC5hdHRhY2gob2JqZWN0LCByZXF1aXJlKCcuLi9jb21wb25lbnRzL2Jsb2NrcycpKTtcblxuICB2YXIgZGltID0gWzMyLCAzMiwgMzJdO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZGltWzBdOyBpKyspIHtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGRpbVsxXTsgaisrKSB7XG4gICAgICBmb3IgKHZhciBrID0gMDsgayA8IGRpbVsyXTsgaysrKSB7XG4gICAgICAgIGJsb2Nrcy5zZXQoaSwgaiwgaywgMSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYmxvY2tzLm9mZnNldC5zZXQoLTE2LCAtMTYsIC0xNik7XG4gIGJsb2Nrcy51cGRhdGVNZXNoKCk7XG5cbiAgdmFyIHJpZ2lkQm9keSA9IGFwcC5hdHRhY2gob2JqZWN0LCByZXF1aXJlKCcuLi9jb21wb25lbnRzL3JpZ2lkYm9keScpKTtcbiAgcmlnaWRCb2R5LmNvbGxpc2lvbk9iamVjdCA9IGJsb2Nrcy5vYmplY3Q7XG4gIHJpZ2lkQm9keS5pc0ZpeHR1cmUgPSB0cnVlO1xuICBcbiAgc2NlbmUuYWRkKG9iamVjdCk7XG59OyIsInZhciBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydUSFJFRSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnVEhSRUUnXSA6IG51bGwpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFwcCkge1xuICB2YXIgc2NlbmUgPSBhcHAuZ2V0KCdzY2VuZScpO1xuXG4gIHZhciBvYmplY3QgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcbiAgdmFyIGNoYXJhY3RlciA9IGFwcC5hdHRhY2gob2JqZWN0LCByZXF1aXJlKCcuLi9jb21wb25lbnRzL2NoYXJhY3RlcicpKTtcbiAgdmFyIHJpZ2lkQm9keSA9IGFwcC5hdHRhY2gob2JqZWN0LCByZXF1aXJlKCcuLi9jb21wb25lbnRzL3JpZ2lkYm9keScpKTtcbiAgcmlnaWRCb2R5Lm1hc3MgPSAxO1xuICB2YXIgcGxheWVyQ29udHJvbCA9IGFwcC5hdHRhY2gob2JqZWN0LCByZXF1aXJlKCcuLi9jb21wb25lbnRzL3BsYXllcmNvbnRyb2wnKSk7XG5cbiAgY2hhcmFjdGVyLnJpZ2lkQm9keSA9IHJpZ2lkQm9keTtcbiAgcGxheWVyQ29udHJvbC5jaGFyYWN0ZXIgPSBjaGFyYWN0ZXI7XG4gIHBsYXllckNvbnRyb2wucmlnaWRCb2R5ID0gcmlnaWRCb2R5O1xuXG4gIHNjZW5lLmFkZChvYmplY3QpO1xuXG4gIG9iamVjdC5wb3NpdGlvbi5zZXQoMCwgNDAsIDApO1xuXG4gIHJldHVybiBvYmplY3Q7XG59OyIsInZhciBuZGFycmF5ID0gcmVxdWlyZSgnbmRhcnJheScpO1xudmFyIG1lc2hlciA9IHJlcXVpcmUoJy4uL3ZveGVsL21lc2hlcicpO1xudmFyIGFycmF5VXRpbHMgPSByZXF1aXJlKCcuLi91dGlscy9hcnJheXV0aWxzJyk7XG5cbnZhciBCbG9ja3MgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgdGhpcy5vYmplY3QgPSBvYmplY3Q7XG4gIHRoaXMudHlwZSA9ICdibG9ja3MnO1xuXG4gIHRoaXMuZGltID0gWzMyLCAzMiwgMzJdO1xuICB0aGlzLmNodW5rID0gbmRhcnJheShbXSwgdGhpcy5kaW0pO1xuXG4gIHRoaXMubWVzaCA9IG51bGw7XG4gIHRoaXMub2JqID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gIHRoaXMubWF0ZXJpYWwgPSBuZXcgVEhSRUUuTXVsdGlNYXRlcmlhbCgpO1xuXG4gIHRoaXMuZGlydHkgPSBmYWxzZTtcbiAgdGhpcy5kaW1OZWVkc1VwZGF0ZSA9IGZhbHNlO1xuXG4gIHRoaXMub2JqZWN0LmFkZCh0aGlzLm9iaik7XG5cbiAgdGhpcy5wYWxldHRlID0gW251bGxdO1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbih4LCB5LCB6LCBiKSB7XG4gIHRoaXMuY2h1bmsuc2V0KHgsIHksIHosIGIpO1xuICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuc2V0QXRDb29yZCA9IGZ1bmN0aW9uKGNvb3JkLCBiKSB7XG4gIHRoaXMuc2V0KGNvb3JkLngsIGNvb3JkLnksIGNvb3JkLnosIGIpO1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbih4LCB5LCB6KSB7XG4gIHJldHVybiB0aGlzLmNodW5rLmdldCh4LCB5LCB6KTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuZ2V0QXRDb29yZCA9IGZ1bmN0aW9uKGNvb3JkKSB7XG4gIHJldHVybiB0aGlzLmdldChjb29yZC54LCBjb29yZC55LCBjb29yZC56KTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUucG9pbnRUb0Nvb3JkID0gZnVuY3Rpb24ocG9pbnQpIHtcbiAgcmV0dXJuIG5ldyBUSFJFRS5WZWN0b3IzKHBvaW50LnggLSAwLjUsIHBvaW50LnkgLSAwLjUsIHBvaW50LnogLSAwLjUpO1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS5jb29yZFRvUG9pbnQgPSBmdW5jdGlvbihjb29yZCkge1xuICByZXR1cm4gbmV3IFRIUkVFLlZlY3RvcjMoY29vcmQueCwgY29vcmQueSwgY29vcmQueik7XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuZGltTmVlZHNVcGRhdGUpIHtcbiAgICB0aGlzLl91cGRhdGVEaW0oKTtcbiAgICB0aGlzLmRpbU5lZWRzVXBkYXRlID0gZmFsc2U7XG4gIH1cblxuICBpZiAodGhpcy5kaXJ0eSkge1xuICAgIHRoaXMuX3VwZGF0ZU1lc2goKTtcbiAgICB0aGlzLmRpcnR5ID0gZmFsc2U7XG4gIH1cbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5jaHVuayA9IG5kYXJyYXkoW10sIHRoaXMuZGltKTtcbiAgdGhpcy5vYmoucmVtb3ZlKHRoaXMubWVzaCk7XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLnNldERpbSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHRoaXMuZGltID0gdmFsdWU7XG4gIHRoaXMuZGltTmVlZHNVcGRhdGUgPSB0cnVlO1xuICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUudmlzaXQgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICB2YXIgc2hhcGUgPSB0aGlzLmNodW5rLnNoYXBlO1xuICB2YXIgZGF0YSA9IHRoaXMuY2h1bmsuZGF0YTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaGFwZVswXTsgaSsrKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBzaGFwZVsxXTsgaisrKSB7XG4gICAgICBmb3IgKHZhciBrID0gMDsgayA8IHNoYXBlWzJdOyBrKyspIHtcbiAgICAgICAgdmFyIGIgPSB0aGlzLmNodW5rLmdldChpLCBqLCBrKTtcbiAgICAgICAgaWYgKCEhYikge1xuICAgICAgICAgIGNhbGxiYWNrKGksIGosIGssIGIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLmdldEFsbENvb3JkcyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY29vcmRzID0gW107XG4gIHRoaXMudmlzaXQoZnVuY3Rpb24oaSwgaiwgaykge1xuICAgIGNvb3Jkcy5wdXNoKG5ldyBUSFJFRS5WZWN0b3IzKGksIGosIGspKTtcbiAgfSk7XG4gIHJldHVybiBjb29yZHM7XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLnByaW50ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMudmlzaXQoZnVuY3Rpb24oaSwgaiwgaywgYikge1xuICAgIGNvbnNvbGUubG9nKFtpLCBqLCBrXS5qb2luKCcsJyksIGIpO1xuICB9KTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuc2VyaWFsaXplID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgZGltOiB0aGlzLmRpbSxcbiAgICBjaHVua0RhdGE6IGFycmF5VXRpbHMuY2xvbmUodGhpcy5jaHVuay5kYXRhKSxcbiAgICBwYWxldHRlOiB0aGlzLnBhbGV0dGVcbiAgfTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuZGVzZXJpYWxpemUgPSBmdW5jdGlvbihqc29uKSB7XG4gIHRoaXMuZGltID0ganNvbi5kaW07XG4gIHRoaXMuY2h1bmsgPSBuZGFycmF5KFtdLCB0aGlzLmRpbSk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwganNvbi5jaHVua0RhdGEubGVuZ3RoOyBpKyspIHtcbiAgICB0aGlzLmNodW5rLmRhdGFbaV0gPSBqc29uLmNodW5rRGF0YVtpXTtcbiAgfVxuXG4gIHRoaXMucGFsZXR0ZSA9IGpzb24ucGFsZXR0ZTtcblxuICB0aGlzLnVwZGF0ZU1hdGVyaWFsKCk7XG5cbiAgdGhpcy5kaW1OZWVkc1VwZGF0ZSA9IHRydWU7XG4gIHRoaXMuZGlydHkgPSB0cnVlO1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS5fdXBkYXRlTWVzaCA9IGZ1bmN0aW9uKHJlc3VsdCkge1xuICBpZiAodGhpcy5tZXNoICE9IG51bGwpIHtcbiAgICB0aGlzLm9iai5yZW1vdmUodGhpcy5tZXNoKTtcbiAgfVxuXG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIGRpbSA9IHRoaXMuZGltO1xuXG4gIHZhciByZXN1bHQgPSBtZXNoZXIoZnVuY3Rpb24oaSwgaiwgaykge1xuICAgIHJldHVybiBzZWxmLmdldChpLCBqLCBrKTtcbiAgfSwgZGltKTtcblxuICB2YXIgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuR2VvbWV0cnkoKTtcblxuICByZXN1bHQudmVydGljZXMuZm9yRWFjaChmdW5jdGlvbih2KSB7XG4gICAgdmFyIHZlcnRpY2UgPSBuZXcgVEhSRUUuVmVjdG9yMyhcbiAgICAgIHZbMF0sIHZbMV0sIHZbMl1cbiAgICApO1xuICAgIGdlb21ldHJ5LnZlcnRpY2VzLnB1c2godmVydGljZSk7XG4gIH0pO1xuXG4gIHJlc3VsdC5zdXJmYWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHN1cmZhY2UpIHtcbiAgICB2YXIgZiA9IHN1cmZhY2UuZmFjZTtcbiAgICB2YXIgdXYgPSBzdXJmYWNlLnV2O1xuICAgIHZhciBjID0gZls0XTtcblxuICAgIHZhciBmYWNlID0gbmV3IFRIUkVFLkZhY2UzKGZbMF0sIGZbMV0sIGZbMl0pO1xuICAgIGdlb21ldHJ5LmZhY2VzLnB1c2goZmFjZSk7XG4gICAgZ2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXS5wdXNoKFt1dlswXSwgdXZbMV0sIHV2WzJdXSk7XG4gICAgZmFjZS5tYXRlcmlhbEluZGV4ID0gYyAtIDE7XG5cbiAgICBmYWNlID0gbmV3IFRIUkVFLkZhY2UzKGZbMl0sIGZbM10sIGZbMF0pO1xuICAgIGdlb21ldHJ5LmZhY2VzLnB1c2goZmFjZSk7XG4gICAgZ2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXS5wdXNoKFt1dlsyXSwgdXZbM10sIHV2WzBdXSk7XG4gICAgZmFjZS5tYXRlcmlhbEluZGV4ID0gYyAtIDE7XG4gIH0pO1xuXG4gIGdlb21ldHJ5LmNvbXB1dGVGYWNlTm9ybWFscygpO1xuXG4gIHRoaXMubWVzaCA9IG5ldyBUSFJFRS5NZXNoKGdlb21ldHJ5LCB0aGlzLm1hdGVyaWFsKTtcbiAgdGhpcy5vYmouYWRkKHRoaXMubWVzaCk7XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLl91cGRhdGVEaW0gPSBmdW5jdGlvbigpIHtcbiAgdmFyIG5ld0NodW5rID0gbmRhcnJheShbXSwgdGhpcy5kaW0pO1xuICB2YXIgc2hhcGUgPSB0aGlzLmNodW5rLnNoYXBlO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc2hhcGVbMF07IGkrKykge1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgc2hhcGVbMV07IGorKykge1xuICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBzaGFwZVsyXTsgaysrKSB7XG4gICAgICAgIHZhciBiID0gdGhpcy5jaHVuay5nZXQoaSwgaiwgayk7XG4gICAgICAgIGlmICghIWIpIHtcbiAgICAgICAgICBuZXdDaHVuay5zZXQoaSwgaiwgaywgYik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB0aGlzLmNodW5rID0gbmV3Q2h1bms7XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLmdldE9yQWRkQ29sb3JJbmRleCA9IGZ1bmN0aW9uKGNvbG9yKSB7XG4gIC8vIG51bGwsIDAsIGZhbHNlLCB1bmRlZmluZWRcbiAgaWYgKCFjb2xvcikge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgdmFyIGluZGV4ID0gYXJyYXlVdGlscy5pbmRleE9mKHRoaXMucGFsZXR0ZSwgY29sb3IpO1xuICBpZiAoaW5kZXggPT0gLTEpIHtcbiAgICB0aGlzLnBhbGV0dGUucHVzaChjb2xvcik7XG4gICAgaW5kZXggPSB0aGlzLnBhbGV0dGUubGVuZ3RoIC0gMTtcbiAgICB2YXIgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaExhbWJlcnRNYXRlcmlhbCh7XG4gICAgICBjb2xvcjogbmV3IFRIUkVFLkNvbG9yKHRoaXMucGFsZXR0ZVtpbmRleF0pXG4gICAgfSk7XG4gICAgY29uc29sZS5sb2cobWF0ZXJpYWwuY29sb3IpO1xuICAgIHRoaXMubWF0ZXJpYWwubWF0ZXJpYWxzLnB1c2gobWF0ZXJpYWwpO1xuICAgIHJldHVybiB0aGlzLnBhbGV0dGUubGVuZ3RoIC0gMTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUudXBkYXRlTWF0ZXJpYWwgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5tYXRlcmlhbCA9IG5ldyBUSFJFRS5NdWx0aU1hdGVyaWFsKCk7XG4gIGZvciAodmFyIGkgPSAxOyBpIDwgdGhpcy5wYWxldHRlLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIG1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwoe1xuICAgICAgY29sb3I6IG5ldyBUSFJFRS5Db2xvcih0aGlzLnBhbGV0dGVbaV0pXG4gICAgfSk7XG4gICAgdGhpcy5tYXRlcmlhbC5tYXRlcmlhbHMucHVzaChtYXRlcmlhbCk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQmxvY2tzOyIsInZhciBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydUSFJFRSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnVEhSRUUnXSA6IG51bGwpO1xuXG52YXIgQ2hhcmFjdGVyID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gIHRoaXMub2JqZWN0ID0gb2JqZWN0O1xuXG4gIHRoaXMuZ2VvbWV0cnkgPSBuZXcgVEhSRUUuQm94R2VvbWV0cnkoMSwgMSwgMSk7XG4gIHRoaXMubWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgIGNvbG9yOiAweGZmMDAwMFxuICB9KTtcblxuICB0aGlzLm1lc2ggPSBuZXcgVEhSRUUuTWVzaCh0aGlzLmdlb21ldHJ5LCB0aGlzLm1hdGVyaWFsKTtcbiAgdGhpcy5vYmplY3QuYWRkKHRoaXMubWVzaCk7XG5cbiAgdGhpcy5tb3ZlU3BlZWQgPSAwLjU7XG4gIHRoaXMuanVtcFNwZWVkID0gMC44O1xuICB0aGlzLmp1bXBpbmcgPSBmYWxzZTtcbn07XG5cbkNoYXJhY3Rlci5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmdyYXZpdHkgPSB0aGlzLnJpZ2lkQm9keS5ncmF2aXR5O1xuICBpZiAodGhpcy5qdW1waW5nICYmIHRoaXMucmlnaWRCb2R5Lmdyb3VuZGVkKSB7XG4gICAgdGhpcy5qdW1waW5nID0gZmFsc2U7XG4gIH1cbn07XG5cbkNoYXJhY3Rlci5wcm90b3R5cGUubW92ZSA9IGZ1bmN0aW9uKGZvcndhcmQsIGFtb3VudCkge1xuICB2YXIgZ3Jhdml0eSA9IHRoaXMucmlnaWRCb2R5LmdyYXZpdHk7XG4gIGlmIChncmF2aXR5ID09IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKHRoaXMucmlnaWRCb2R5Lmdyb3VuZGVkIHx8IHRoaXMuanVtcGluZykge1xuICAgIHZhciB2ZXJ0aWNhbFNwZWVkID0gdGhpcy5yaWdpZEJvZHkudmVsb2NpdHkuY2xvbmUoKS5wcm9qZWN0T25WZWN0b3IoZ3Jhdml0eS5kaXIpO1xuICAgIHZhciBmb3J3YXJkU3BlZWQgPSBmb3J3YXJkLmNsb25lKCkuc2V0TGVuZ3RoKGFtb3VudCAqIHRoaXMubW92ZVNwZWVkKTtcbiAgICB0aGlzLnJpZ2lkQm9keS52ZWxvY2l0eS5jb3B5KHZlcnRpY2FsU3BlZWQuYWRkKGZvcndhcmRTcGVlZCkpO1xuICB9XG59O1xuXG5DaGFyYWN0ZXIucHJvdG90eXBlLmp1bXAgPSBmdW5jdGlvbihhbW91bnQpIHtcbiAgdmFyIGdyYXZpdHkgPSB0aGlzLnJpZ2lkQm9keS5ncmF2aXR5O1xuICBpZiAoZ3Jhdml0eSA9PSBudWxsKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICh0aGlzLnJpZ2lkQm9keS5ncm91bmRlZCkge1xuICAgIHRoaXMuanVtcGluZyA9IHRydWU7XG4gICAgdGhpcy5yaWdpZEJvZHkudmVsb2NpdHkuY29weShncmF2aXR5LmRpci5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKC10aGlzLmp1bXBTcGVlZCkpO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENoYXJhY3RlcjsiLCJ2YXIgVEhSRUUgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snVEhSRUUnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ1RIUkVFJ10gOiBudWxsKTtcblxudmFyIERyYWdDYW1lcmEgPSBmdW5jdGlvbihjYW1lcmEsIGlucHV0KSB7XG4gIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuICB0aGlzLmlucHV0ID0gaW5wdXQ7XG5cbiAgdGhpcy5yb3RhdGlvbiA9IG5ldyBUSFJFRS5FdWxlcigtTWF0aC5QSSAvIDQsIE1hdGguUEkgLyA0LCAwLCAnWVhaJyk7XG4gIHRoaXMubGFzdE1vdXNlID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcbiAgdGhpcy5tb3VzZVNwZWVkWCA9IDAuMDE7XG4gIHRoaXMubW91c2VTcGVlZFkgPSAwLjAxO1xuICB0aGlzLm1vdXNlS2V5U3BlZWRYID0gMC4wMztcbiAgdGhpcy5tb3VzZUtleVNwZWVkWSA9IDAuMDM7XG4gIHRoaXMudW5pdFZlY3RvciA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDEpO1xuICB0aGlzLmRpc3RhbmNlID0gNTA7XG4gIHRoaXMudGFyZ2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMCk7XG4gIHRoaXMubWF4UGl0Y2ggPSBNYXRoLlBJIC8gMiAtIDAuMDE7XG4gIHRoaXMubWluUGl0Y2ggPSAtTWF0aC5QSSAvIDIgKyAwLjAxO1xuICB0aGlzLnpvb21SYXRlID0gMS4xO1xuXG4gIHRoaXMubG9ja1JvdGF0aW9uID0gZmFsc2U7XG5cbiAgdGhpcy51cGRhdGVDYW1lcmEoKTtcbn07XG5cbkRyYWdDYW1lcmEuJGluamVjdCA9IFsnaW5wdXQnXTtcblxuRHJhZ0NhbWVyYS5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnByb2Nlc3NJbnB1dCgpO1xuXG4gIHRoaXMudXBkYXRlQ2FtZXJhKCk7XG59O1xuXG5EcmFnQ2FtZXJhLnByb3RvdHlwZS5wcm9jZXNzSW5wdXQgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuaW5wdXQubW91c2VIb2xkKCkgJiYgIXRoaXMubG9ja1JvdGF0aW9uKSB7XG4gICAgdmFyIGRpZmYgPSBuZXcgVEhSRUUuVmVjdG9yMigpLnN1YlZlY3RvcnModGhpcy5pbnB1dC5tb3VzZSwgdGhpcy5sYXN0TW91c2UpO1xuICAgIHRoaXMucm90YXRpb24ueSArPSBkaWZmLnggKiB0aGlzLm1vdXNlU3BlZWRZO1xuICAgIHRoaXMucm90YXRpb24ueCArPSBkaWZmLnkgKiB0aGlzLm1vdXNlU3BlZWRYO1xuXG4gICAgaWYgKHRoaXMucm90YXRpb24ueCA8IHRoaXMubWluUGl0Y2gpIHRoaXMucm90YXRpb24ueCA9IHRoaXMubWluUGl0Y2g7XG4gICAgaWYgKHRoaXMucm90YXRpb24ueCA+IHRoaXMubWF4UGl0Y2gpIHRoaXMucm90YXRpb24ueCA9IHRoaXMubWF4UGl0Y2g7XG4gIH1cblxuICB2YXIgcm90YXRlUmlnaHQgPSAwO1xuICB2YXIgcm90YXRlVXAgPSAwO1xuICBpZiAodGhpcy5pbnB1dC5rZXlIb2xkKCdyaWdodCcpKSB7XG4gICAgcm90YXRlUmlnaHQrKztcbiAgfVxuICBpZiAodGhpcy5pbnB1dC5rZXlIb2xkKCdsZWZ0JykpIHtcbiAgICByb3RhdGVSaWdodC0tO1xuICB9XG4gIGlmICh0aGlzLmlucHV0LmtleUhvbGQoJ3VwJykpIHtcbiAgICByb3RhdGVVcCsrO1xuICB9XG4gIGlmICh0aGlzLmlucHV0LmtleUhvbGQoJ2Rvd24nKSkge1xuICAgIHJvdGF0ZVVwLS07XG4gIH1cblxuICB0aGlzLnJvdGF0aW9uLnggKz0gcm90YXRlVXAgKiB0aGlzLm1vdXNlS2V5U3BlZWRYO1xuICB0aGlzLnJvdGF0aW9uLnkgLT0gcm90YXRlUmlnaHQgKiB0aGlzLm1vdXNlS2V5U3BlZWRZO1xuXG4gIHRoaXMubGFzdE1vdXNlLmNvcHkodGhpcy5pbnB1dC5tb3VzZSk7XG5cbiAgaWYgKHRoaXMuaW5wdXQua2V5VXAoJz0nKSkge1xuICAgIHRoaXMuZGlzdGFuY2UgLz0gdGhpcy56b29tUmF0ZTtcbiAgfSBlbHNlIGlmICh0aGlzLmlucHV0LmtleVVwKCctJykpIHtcbiAgICB0aGlzLmRpc3RhbmNlICo9IHRoaXMuem9vbVJhdGU7XG4gIH1cbn07XG5cbkRyYWdDYW1lcmEucHJvdG90eXBlLnVwZGF0ZUNhbWVyYSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcG9zaXRpb24gPSB0aGlzLnVuaXRWZWN0b3IuY2xvbmUoKS5hcHBseUV1bGVyKHRoaXMucm90YXRpb24pLnNldExlbmd0aCh0aGlzLmRpc3RhbmNlKS5hZGQodGhpcy50YXJnZXQpO1xuICB0aGlzLmNhbWVyYS5wb3NpdGlvbi5jb3B5KHBvc2l0aW9uKTtcbiAgdGhpcy5jYW1lcmEubG9va0F0KHRoaXMudGFyZ2V0KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRHJhZ0NhbWVyYTsiLCJ2YXIgUGxheWVyQ2FtZXJhID0gZnVuY3Rpb24oY2FtZXJhLCBhcHApIHtcbiAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XG4gIHRoaXMuYXBwID0gYXBwO1xuXG4gIHRoaXMuY2FtZXJhVGlsdCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbUV1bGVyKFxuICAgIG5ldyBUSFJFRS5FdWxlcigtTWF0aC5QSSAvIDQsIE1hdGguUEkgLyA0LCAwLCAnWVhaJykpO1xuXG4gIHRoaXMuY2FtZXJhUXVhdCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG4gIHRoaXMuY2FtZXJhUXVhdEZpbmFsID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblxuICB0aGlzLmRpc3RhbmNlID0gMTAwO1xuICB0aGlzLnRhcmdldCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gIHRoaXMucXVhdGVybmlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG59O1xuXG5QbGF5ZXJDYW1lcmEuJGluamVjdCA9IFsnYXBwJ107XG5cblBsYXllckNhbWVyYS5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGxheWVyID0gYXBwLmdldCgncGxheWVyJyk7XG4gIGlmIChwbGF5ZXIgPT0gbnVsbCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciByaWdpZEJvZHkgPSBhcHAuZ2V0Q29tcG9uZW50KHBsYXllciwgJ3JpZ2lkQm9keScpO1xuXG4gIHZhciBncmF2aXR5RGlyO1xuICBpZiAocmlnaWRCb2R5Lmdyb3VuZGVkKSB7XG4gICAgZ3Jhdml0eURpciA9IHJpZ2lkQm9keS5ncmF2aXR5LmRpci5jbG9uZSgpO1xuICB9IGVsc2Uge1xuICAgIGdyYXZpdHlEaXIgPSByaWdpZEJvZHkuZ3Jhdml0eS5mb3JjZURpci5jbG9uZSgpO1xuICB9XG5cbiAgaWYgKGdyYXZpdHlEaXIubGVuZ3RoKCkgPT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBhID0gZ3Jhdml0eURpci5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKC0xKTtcblxuICB2YXIgZGlmZiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbVVuaXRWZWN0b3JzKFxuICAgIG5ldyBUSFJFRS5WZWN0b3IzKDAsIDEsIDApLmFwcGx5UXVhdGVybmlvbih0aGlzLmNhbWVyYVF1YXQpLFxuICAgIGFcbiAgKTtcblxuICB0aGlzLmNhbWVyYVF1YXQubXVsdGlwbHlRdWF0ZXJuaW9ucyhkaWZmLCB0aGlzLmNhbWVyYVF1YXQpO1xuICB0aGlzLmNhbWVyYVF1YXRGaW5hbCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkubXVsdGlwbHlRdWF0ZXJuaW9ucyhcbiAgICB0aGlzLmNhbWVyYVF1YXQsXG4gICAgdGhpcy5jYW1lcmFUaWx0KTtcblxuICB0aGlzLnF1YXRlcm5pb24uc2xlcnAodGhpcy5jYW1lcmFRdWF0RmluYWwsIDAuMSk7XG5cbiAgbGFzdEdyYXZpdHkgPSBncmF2aXR5RGlyO1xuXG4gIHRoaXMudXBkYXRlQ2FtZXJhKCk7XG59O1xuXG5QbGF5ZXJDYW1lcmEucHJvdG90eXBlLnVwZGF0ZUNhbWVyYSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZGlmZiA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDEpXG4gICAgLmFwcGx5UXVhdGVybmlvbih0aGlzLnF1YXRlcm5pb24pXG4gICAgLnNldExlbmd0aCh0aGlzLmRpc3RhbmNlKTtcbiAgdmFyIHBvcyA9IHRoaXMudGFyZ2V0LmNsb25lKClcbiAgICAuYWRkKGRpZmYpO1xuICBjYW1lcmEucG9zaXRpb24uY29weShwb3MpO1xuXG4gIHZhciB1cCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDEsIDApLmFwcGx5UXVhdGVybmlvbih0aGlzLnF1YXRlcm5pb24pO1xuICBjYW1lcmEudXAuY29weSh1cCk7XG4gIGNhbWVyYS5sb29rQXQodGhpcy50YXJnZXQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQbGF5ZXJDYW1lcmE7IiwidmFyIFBsYXllckNvbnRyb2wgPSBmdW5jdGlvbihvYmplY3QsIGFwcCwgaW5wdXQsIGNhbWVyYSkge1xuICB0aGlzLm9iamVjdCA9IG9iamVjdDtcbiAgdGhpcy5pbnB1dCA9IGlucHV0O1xuICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcblxuICB0aGlzLmNoYXJhY3RlciA9IG51bGw7XG4gIHRoaXMucmlnaWRCb2R5ID0gbnVsbDtcbn07XG5cblBsYXllckNvbnRyb2wuJGluamVjdCA9IFsnaW5wdXQnLCAnY2FtZXJhJ107XG5cblBsYXllckNvbnRyb2wucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGZvcndhcmRBbW91bnQgPSAwO1xuICBpZiAodGhpcy5pbnB1dC5rZXlIb2xkKCd3JykpIGZvcndhcmRBbW91bnQgKz0gMTtcbiAgaWYgKHRoaXMuaW5wdXQua2V5SG9sZCgncycpKSBmb3J3YXJkQW1vdW50IC09IDE7XG5cbiAgdmFyIHJpZ2h0QW1vdW50ID0gMDtcbiAgaWYgKHRoaXMuaW5wdXQua2V5SG9sZCgnZCcpKSByaWdodEFtb3VudCArPSAxO1xuICBpZiAodGhpcy5pbnB1dC5rZXlIb2xkKCdhJykpIHJpZ2h0QW1vdW50IC09IDE7XG5cbiAgdmFyIGdyYXZpdHkgPSB0aGlzLnJpZ2lkQm9keS5ncmF2aXR5O1xuXG4gIGlmIChncmF2aXR5ICE9IG51bGwpIHtcbiAgICB2YXIgbm9ybWFsID0gZ3Jhdml0eS5kaXIuY2xvbmUoKS5tdWx0aXBseVNjYWxhcigtMSk7XG5cbiAgICB2YXIgdXAgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAxLCAwKS5hcHBseVF1YXRlcm5pb24odGhpcy5jYW1lcmEucXVhdGVybmlvbik7XG4gICAgdmFyIHJpZ2h0ID0gbmV3IFRIUkVFLlZlY3RvcjMoMSwgMCwgMCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMuY2FtZXJhLnF1YXRlcm5pb24pO1xuXG4gICAgdmFyIG1vdmUgPSB1cC5tdWx0aXBseVNjYWxhcihmb3J3YXJkQW1vdW50KS5hZGQocmlnaHQubXVsdGlwbHlTY2FsYXIocmlnaHRBbW91bnQpKTtcbiAgICBtb3ZlLnByb2plY3RPblBsYW5lKG5vcm1hbCk7XG4gICAgbW92ZS5zZXRMZW5ndGgoMSk7XG5cbiAgICB0aGlzLmNoYXJhY3Rlci5tb3ZlKG1vdmUsIDEpO1xuXG4gICAgaWYgKHRoaXMuaW5wdXQua2V5RG93bignc3BhY2UnKSkge1xuICAgICAgdGhpcy5jaGFyYWN0ZXIuanVtcCgpO1xuICAgIH1cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQbGF5ZXJDb250cm9sOyIsInZhciBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydUSFJFRSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnVEhSRUUnXSA6IG51bGwpO1xuXG52YXIgUmlnaWRCb2R5ID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gIHRoaXMub2JqZWN0ID0gb2JqZWN0O1xuICBcbiAgdGhpcy52ZWxvY2l0eSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gIFxuICB0aGlzLmFjY2VsZXJhdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gIFxuICB0aGlzLnR5cGUgPSAncmlnaWRCb2R5JztcbiAgXG4gIHRoaXMuZnJpY3Rpb24gPSAwLjk4O1xuXG4gIC8vIDAgbWFzcyBtZWFucyBpbW1vdmFibGVcbiAgdGhpcy5tYXNzID0gMDtcbiAgXG4gIHRoaXMuZ3Jhdml0eSA9IG51bGw7XG5cbiAgdGhpcy5jb2xsaXNpb25PYmplY3QgPSBudWxsO1xufTtcblxuUmlnaWRCb2R5LnByb3RvdHlwZS5hcHBseUZvcmNlID0gZnVuY3Rpb24oZm9yY2UpIHtcbiAgdGhpcy5hY2NlbGVyYXRpb24uYWRkKGZvcmNlLmNsb25lKCkubXVsdGlwbHlTY2FsYXIoMSAvIHRoaXMubWFzcykpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSaWdpZEJvZHk7IiwidmFyIGV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5cbnZhciBpZENvdW50ID0gMDtcblxuZnVuY3Rpb24gZ2V0TmV4dElkKCkge1xuICByZXR1cm4gaWRDb3VudCsrO1xufVxuXG52YXIgRW5naW5lID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuZW50aXR5TWFwID0ge307XG4gIHRoaXMubG9va3VwID0ge307XG4gIHRoaXMuZnJhbWVSYXRlID0gNjAuMDtcbiAgdGhpcy5zeXN0ZW1zID0gW107XG4gIHRoaXMuYmluZGluZ3MgPSB7fTtcbn07XG5cbkVuZ2luZS5wcm90b3R5cGUuYXR0YWNoID0gZnVuY3Rpb24ob2JqZWN0LCBmYWN0b3J5KSB7XG4gIHZhciBhcmdzID0gW29iamVjdF07XG4gIHZhciBjb21wb25lbnQ7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICBpZiAodHlwZW9mIGZhY3RvcnkgPT09ICdmdW5jdGlvbicpIHtcbiAgICBpZiAoZmFjdG9yeS4kaW5qZWN0ICE9IG51bGwpIHtcbiAgICAgIGZhY3RvcnkuJGluamVjdC5mb3JFYWNoKGZ1bmN0aW9uKGRlcCkge1xuICAgICAgICBhcmdzLnB1c2goc2VsZi5yZXNvbHZlKGRlcCkpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGNvbXBvbmVudCA9IG5ldyhGdW5jdGlvbi5wcm90b3R5cGUuYmluZC5hcHBseShmYWN0b3J5LCBbbnVsbF0uY29uY2F0KGFyZ3MpKSk7XG4gIH0gZWxzZSB7XG4gICAgY29tcG9uZW50ID0gZmFjdG9yeTtcbiAgfVxuXG4gIGlmIChjb21wb25lbnQgIT0gbnVsbCkge1xuICAgIGNvbXBvbmVudC5vYmplY3QgPSBvYmplY3Q7XG5cbiAgICBpZiAob2JqZWN0Ll9pZCA9PSBudWxsKSB7XG4gICAgICBvYmplY3QuX2lkID0gZ2V0TmV4dElkKCk7XG4gICAgICB0aGlzLmxvb2t1cFtvYmplY3QuX2lkXSA9IG9iamVjdDtcbiAgICB9XG5cbiAgICBpZiAoY29tcG9uZW50Ll9pZCA9PSBudWxsKSB7XG4gICAgICBjb21wb25lbnQuX2lkID0gZ2V0TmV4dElkKCk7XG4gICAgICB0aGlzLmxvb2t1cFtjb21wb25lbnQuX2lkXSA9IGNvbXBvbmVudDtcbiAgICB9XG5cbiAgICB2YXIgY29tcG9uZW50cyA9IHRoaXMuZW50aXR5TWFwW29iamVjdC5faWRdO1xuICAgIGlmIChjb21wb25lbnRzID09IG51bGwpIGNvbXBvbmVudHMgPSB0aGlzLmVudGl0eU1hcFtvYmplY3QuX2lkXSA9IHt9O1xuICAgIGNvbXBvbmVudHNbY29tcG9uZW50Ll9pZF0gPSBjb21wb25lbnQ7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3lzdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHN5c3RlbSA9IHRoaXMuc3lzdGVtc1tpXTtcbiAgICAgIGlmIChzeXN0ZW0ub25BdHRhY2ggIT0gbnVsbCkgc3lzdGVtLm9uQXR0YWNoKG9iamVjdCwgY29tcG9uZW50KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY29tcG9uZW50O1xufTtcblxuRW5naW5lLnByb3RvdHlwZS51c2UgPSBmdW5jdGlvbih0eXBlLCBzeXN0ZW0pIHtcbiAgdmFyIGhhc1R5cGUgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZyc7XG4gIGlmICghaGFzVHlwZSkge1xuICAgIHN5c3RlbSA9IHR5cGU7XG4gIH1cblxuICBpZiAoc3lzdGVtICE9IG51bGwpIHtcbiAgICB0aGlzLnN5c3RlbXMucHVzaChzeXN0ZW0pO1xuICAgIGlmIChoYXNUeXBlKSB7XG4gICAgICB0aGlzLnZhbHVlKHR5cGUsIHN5c3RlbSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHN5c3RlbTtcbn07XG5cbkVuZ2luZS5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmVtaXQoJ2JlZm9yZVRpY2snKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3lzdGVtcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBzeXN0ZW0gPSB0aGlzLnN5c3RlbXNbaV07XG4gICAgaWYgKHN5c3RlbS50aWNrICE9IG51bGwpIHN5c3RlbS50aWNrKCk7XG4gIH1cblxuICBmb3IgKHZhciBpIGluIHRoaXMuZW50aXR5TWFwKSB7XG4gICAgdmFyIGNvbXBvbmVudHMgPSB0aGlzLmVudGl0eU1hcFtpXTtcbiAgICBmb3IgKHZhciBqIGluIGNvbXBvbmVudHMpIHtcbiAgICAgIHZhciBjb21wb25lbnQgPSBjb21wb25lbnRzW2pdO1xuICAgICAgaWYgKGNvbXBvbmVudC50aWNrICE9IG51bGwpIGNvbXBvbmVudC50aWNrKCk7XG4gICAgfVxuICB9XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN5c3RlbXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgc3lzdGVtID0gdGhpcy5zeXN0ZW1zW2ldO1xuICAgIGlmIChzeXN0ZW0ubGF0ZVRpY2sgIT0gbnVsbCkgc3lzdGVtLmxhdGVUaWNrKCk7XG4gIH1cblxuICB0aGlzLmVtaXQoJ2FmdGVyVGljaycpO1xufTtcblxuRW5naW5lLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciBpbnRlcnZhbCA9IGZ1bmN0aW9uKCkge1xuICAgIHNlbGYudGljaygpO1xuICAgIHNldFRpbWVvdXQoaW50ZXJ2YWwsIDEwMDAgLyB0aGlzLmZyYW1lUmF0ZSk7XG4gIH1cbiAgaW50ZXJ2YWwoKTtcbn07XG5cbkVuZ2luZS5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbih0eXBlLCBvYmplY3QpIHtcbiAgdGhpcy5iaW5kaW5nc1t0eXBlXSA9IHtcbiAgICB2YWx1ZTogb2JqZWN0XG4gIH07XG59O1xuXG5FbmdpbmUucHJvdG90eXBlLnJlc29sdmUgPSBmdW5jdGlvbih0eXBlLCBjb250ZXh0KSB7XG4gIHZhciBiaW5kaW5nID0gdGhpcy5iaW5kaW5nc1t0eXBlXTtcbiAgaWYgKGJpbmRpbmcgPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBFcnJvcignYmluZGluZyBmb3IgdHlwZSAnICsgdHlwZSArICcgbm90IGZvdW5kJyk7XG4gIH1cblxuICBpZiAoYmluZGluZy5mYWN0b3J5ICE9IG51bGwpIHtcbiAgICByZXR1cm4gYmluZGluZy5mYWN0b3J5KGNvbnRleHQpO1xuICB9XG5cbiAgaWYgKGJpbmRpbmcudmFsdWUgIT0gbnVsbCkge1xuICAgIHJldHVybiBiaW5kaW5nLnZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn07XG5cbkVuZ2luZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24odHlwZSwgY29udGV4dCkge1xuICByZXR1cm4gdGhpcy5yZXNvbHZlKHR5cGUsIGNvbnRleHQpO1xufTtcblxuRW5naW5lLnByb3RvdHlwZS5nZXRDb21wb25lbnQgPSBmdW5jdGlvbihvYmplY3QsIHR5cGUpIHtcbiAgdmFyIGNvbXBvbmVudHMgPSB0aGlzLmVudGl0eU1hcFtvYmplY3QuX2lkXTtcbiAgZm9yICh2YXIgaWQgaW4gY29tcG9uZW50cykge1xuICAgIGlmIChjb21wb25lbnRzW2lkXS50eXBlID09PSB0eXBlKSB7XG4gICAgICByZXR1cm4gY29tcG9uZW50c1tpZF07XG4gICAgfVxuICB9XG59O1xuXG5FbmdpbmUucHJvdG90eXBlLmxvYWRBc3NlbWJseSA9IGZ1bmN0aW9uKGFzc2VtYmx5KSB7XG4gIHJldHVybiBhc3NlbWJseSh0aGlzKTtcbn07XG5cbmV2ZW50cy5wcm90b3R5cGUuYXBwbHkoRW5naW5lLnByb3RvdHlwZSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgRW5naW5lKCk7XG59OyIsInZhciBFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fbGlzdGVuZXJzID0ge307XG59O1xuXG5FdmVudHMucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbihldmVudCwgb2JqZWN0KSB7XG4gIHZhciBjYWxsYmFja3MgPSB0aGlzLl9saXN0ZW5lcnNbZXZlbnRdO1xuICBpZiAoY2FsbGJhY2tzID09IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgY2FsbGJhY2sgPSBjYWxsYmFja3NbaV07XG4gICAgY2FsbGJhY2sob2JqZWN0KTtcbiAgfVxufTtcblxuRXZlbnRzLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKGV2ZW50LCBjYWxsYmFjaykge1xuICB2YXIgY2FsbGJhY2tzID0gdGhpcy5fbGlzdGVuZXJzW2V2ZW50XTtcbiAgaWYgKGNhbGxiYWNrcyA9PSBudWxsKSB7XG4gICAgY2FsbGJhY2tzID0gdGhpcy5fbGlzdGVuZXJzW2V2ZW50XSA9IFtdO1xuICB9XG4gIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbn07XG5cbkV2ZW50cy5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24oZXZlbnQsIGNhbGxiYWNrKSB7XG4gIHZhciBjYWxsYmFja3MgPSB0aGlzLl9saXN0ZW5lcnNbZXZlbnRdO1xuICBpZiAoY2FsbGJhY2tzID09IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgYXJyYXlVdGlscy5yZW1vdmUoY2FsbGJhY2tzLCBjYWxsYmFjayk7XG59O1xuXG5FdmVudHMucHJvdG90eXBlLmFwcGx5ID0gZnVuY3Rpb24ob2JqKSB7XG4gIG9iai5lbWl0ID0gdGhpcy5lbWl0O1xuICBvYmoub24gPSB0aGlzLm9uO1xuICBvYmoub2ZmID0gdGhpcy5vZmY7XG4gIG9iai5fbGlzdGVuZXJzID0ge307XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50czsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgb3B0cyA9IG9wdHMgfHwge307XG4gIHZhciBwYWxldHRlID0gb3B0cy5wYWxldHRlIHx8IFtdO1xuICB2YXIgb25QaWNrID0gb3B0cy5vblBpY2sgfHwgZnVuY3Rpb24oKSB7fTtcbiAgdmFyIGJsb2NrV2lkdGggPSBvcHRzLmJsb2NrV2lkdGggfHwgMjA7XG4gIHZhciBibG9ja0hlaWdodCA9IG9wdHMuYmxvY2tIZWlnaHQgfHwgMjA7XG5cbiAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBjb250YWluZXIuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICBjb250YWluZXIuc3R5bGUubGVmdCA9ICcyMHB4JztcbiAgY29udGFpbmVyLnN0eWxlLmJvdHRvbSA9ICcyMHB4JztcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuXG4gIGNvbnRhaW5lci5vbmZvY3VzID0gZnVuY3Rpb24oKSB7XG4gICAgY29udGFpbmVyLnN0eWxlWydvdXRsaW5lJ10gPSAnbm9uZSc7XG4gIH07XG5cbiAgdmFyIGJsb2NrcyA9IFtdO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcGFsZXR0ZS5sZW5ndGg7IGkrKykge1xuICAgIHZhciByb3cgPSBwYWxldHRlW2ldO1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgcm93Lmxlbmd0aDsgaisrKSB7XG4gICAgICBhZGRDb2xvckJsb2NrKGksIGosIHJvd1tqXSk7XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlQ29udGFpbmVyKCk7XG5cbiAgZnVuY3Rpb24gYWRkQ29sb3JCbG9jayhyb3csIGNvbHVtbiwgY29sb3IpIHtcbiAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZGl2LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yO1xuICAgIHBvc2l0aW9uKGRpdiwgcm93LCBjb2x1bW4pO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChkaXYpO1xuXG4gICAgdmFyIGNvbHVtbnMgPSBibG9ja3Nbcm93XSB8fCAoYmxvY2tzW3Jvd10gPSBbXSk7XG4gICAgY29sdW1uc1tjb2x1bW5dID0gZGl2O1xuICB9O1xuXG4gIGZ1bmN0aW9uIGFkZChyb3csIGNvbHVtbiwgb2JqKSB7XG4gICAgdmFyIGlkZW50aWZpZXI7XG4gICAgdmFyIGVsZW1lbnQ7XG5cbiAgICBpZiAob2JqLmltZ0RhdGEgIT0gbnVsbCkge1xuICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICAgICAgcG9zaXRpb24oZWxlbWVudCwgcm93LCBjb2x1bW4pO1xuICAgICAgZWxlbWVudC5zcmMgPSBvYmouaW1nRGF0YTtcbiAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChlbGVtZW50KTtcblxuICAgICAgaWRlbnRpZmllciA9IG9iai5pZGVudGlmaWVyO1xuICAgIH1cblxuICAgIGlmIChibG9ja3Nbcm93XSA9PSBudWxsKSB7XG4gICAgICBibG9ja3Nbcm93XSA9IFtdO1xuICAgIH1cbiAgICBibG9ja3Nbcm93XVtjb2x1bW5dID0gZWxlbWVudDtcblxuICAgIGlmIChwYWxldHRlW3Jvd10gPT0gbnVsbCkge1xuICAgICAgcGFsZXR0ZVtyb3ddID0gW107XG4gICAgfVxuICAgIHBhbGV0dGVbcm93XVtjb2x1bW5dID0gaWRlbnRpZmllcjtcblxuICAgIHVwZGF0ZUNvbnRhaW5lcigpO1xuICB9O1xuXG4gIGZ1bmN0aW9uIHBvc2l0aW9uKGVsZW1lbnQsIHJvdywgY29sdW1uKSB7XG4gICAgZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgZWxlbWVudC5zdHlsZS5sZWZ0ID0gY29sdW1uICogYmxvY2tXaWR0aCArICdweCc7XG4gICAgZWxlbWVudC5zdHlsZS50b3AgPSByb3cgKiBibG9ja0hlaWdodCArICdweCc7XG4gICAgZWxlbWVudC5zdHlsZS53aWR0aCA9IGJsb2NrV2lkdGggKyAncHgnO1xuICAgIGVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gYmxvY2tIZWlnaHQgKyAncHgnO1xuICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUtYmxvY2snO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGdldE1heENvbHVtbnMoKSB7XG4gICAgdmFyIG1heCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYWxldHRlLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocGFsZXR0ZVtpXS5sZW5ndGggPiBtYXgpIHtcbiAgICAgICAgbWF4ID0gcGFsZXR0ZVtpXS5sZW5ndGg7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG1heDtcbiAgfTtcblxuICBmdW5jdGlvbiB1cGRhdGVDb250YWluZXIoKSB7XG4gICAgY29udGFpbmVyLnN0eWxlLndpZHRoID0gZ2V0TWF4Q29sdW1ucygpICogYmxvY2tXaWR0aCArICdweCc7XG4gICAgY29udGFpbmVyLnN0eWxlLmhlaWdodCA9IHBhbGV0dGUubGVuZ3RoICogYmxvY2tIZWlnaHQgKyAncHgnO1xuICB9O1xuXG4gIHZhciBoaWdobGlnaHREaXYgPSBudWxsO1xuXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodChyb3csIGNvbHVtbikge1xuICAgIGlmIChoaWdobGlnaHREaXYgPT0gbnVsbCkge1xuICAgICAgaGlnaGxpZ2h0RGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBoaWdobGlnaHREaXYuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgaGlnaGxpZ2h0RGl2LnN0eWxlLndpZHRoID0gYmxvY2tXaWR0aCArICdweCc7XG4gICAgICBoaWdobGlnaHREaXYuc3R5bGUuaGVpZ2h0ID0gYmxvY2tIZWlnaHQgKyAncHgnO1xuICAgICAgaGlnaGxpZ2h0RGl2LnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lLWJsb2NrJztcbiAgICAgIGhpZ2hsaWdodERpdi5zdHlsZS5ib3JkZXIgPSAnMXB4IHNvbGlkICNGRkZGRkYnO1xuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGhpZ2hsaWdodERpdik7XG4gICAgfVxuXG4gICAgaGlnaGxpZ2h0RGl2LnN0eWxlLmxlZnQgPSBjb2x1bW4gKiBibG9ja1dpZHRoIC0gMSArICdweCc7XG4gICAgaGlnaGxpZ2h0RGl2LnN0eWxlLnRvcCA9IHJvdyAqIGJsb2NrSGVpZ2h0IC0gMSArICdweCc7XG4gIH07XG5cbiAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgbW91c2VYID0gZS5wYWdlWCAtIGNvbnRhaW5lci5vZmZzZXRMZWZ0O1xuICAgIHZhciBtb3VzZVkgPSBlLnBhZ2VZIC0gY29udGFpbmVyLm9mZnNldFRvcDtcbiAgICB2YXIgcm93ID0gTWF0aC5mbG9vcihtb3VzZVkgLyBibG9ja0hlaWdodCk7XG4gICAgdmFyIGNvbHVtbiA9IE1hdGguZmxvb3IobW91c2VYIC8gYmxvY2tXaWR0aCk7XG5cbiAgICBpZiAocGFsZXR0ZVtyb3ddID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgY29sb3IgPSBwYWxldHRlW3Jvd11bY29sdW1uXTtcbiAgICBoaWdobGlnaHQocm93LCBjb2x1bW4pO1xuICAgIG9uUGljayhjb2xvcik7XG4gIH0pO1xuXG4gIGhpZ2hsaWdodCgwLCAwKTtcblxuICByZXR1cm4ge1xuICAgIGhpZ2hsaWdodDogaGlnaGxpZ2h0LFxuICAgIGFkZDogYWRkLFxuICAgIHBhbGV0dGU6IHBhbGV0dGUsXG4gICAgZG9tRWxlbWVudDogY29udGFpbmVyXG4gIH1cbn07IiwibW9kdWxlLmV4cG9ydHM9e1xuICBcImVkaXRvcl9kZWZhdWx0X3NpemVcIjogWzEyLCAxMiwgMTJdXG59IiwibW9kdWxlLmV4cG9ydHM9W1xuICBbXG4gICAgXCIjN0M3QzdDXCIsXG4gICAgXCIjMDAwMEZDXCIsXG4gICAgXCIjMDAwMEJDXCIsXG4gICAgXCIjNDQyOEJDXCIsXG4gICAgXCIjOTQwMDg0XCIsXG4gICAgXCIjQTgwMDIwXCIsXG4gICAgXCIjQTgxMDAwXCIsXG4gICAgXCIjODgxNDAwXCIsXG4gICAgXCIjNTAzMDAwXCIsXG4gICAgXCIjMDA3ODAwXCIsXG4gICAgXCIjMDA2ODAwXCIsXG4gICAgXCIjMDA1ODAwXCIsXG4gICAgXCIjMDA0MDU4XCIsXG4gICAgXCIjMDAwMDAwXCIsXG4gICAgXCIjMDAwMDAwXCIsXG4gICAgXCIjMDAwMDAwXCJcbiAgXSxcblxuICBbXCIjQkNCQ0JDXCIsXG4gICAgXCIjMDA3OEY4XCIsXG4gICAgXCIjMDA1OEY4XCIsXG4gICAgXCIjNjg0NEZDXCIsXG4gICAgXCIjRDgwMENDXCIsXG4gICAgXCIjRTQwMDU4XCIsXG4gICAgXCIjRjgzODAwXCIsXG4gICAgXCIjRTQ1QzEwXCIsXG4gICAgXCIjQUM3QzAwXCIsXG4gICAgXCIjMDBCODAwXCIsXG4gICAgXCIjMDBBODAwXCIsXG4gICAgXCIjMDBBODQ0XCIsXG4gICAgXCIjMDA4ODg4XCIsXG4gICAgXCIjMDAwMDAwXCIsXG4gICAgXCIjMDAwMDAwXCIsXG4gICAgXCIjMDAwMDAwXCJcbiAgXSxcblxuICBbXCIjRjhGOEY4XCIsXG4gICAgXCIjM0NCQ0ZDXCIsXG4gICAgXCIjNjg4OEZDXCIsXG4gICAgXCIjOTg3OEY4XCIsXG4gICAgXCIjRjg3OEY4XCIsXG4gICAgXCIjRjg1ODk4XCIsXG4gICAgXCIjRjg3ODU4XCIsXG4gICAgXCIjRkNBMDQ0XCIsXG4gICAgXCIjRjhCODAwXCIsXG4gICAgXCIjQjhGODE4XCIsXG4gICAgXCIjNThEODU0XCIsXG4gICAgXCIjNThGODk4XCIsXG4gICAgXCIjMDBFOEQ4XCIsXG4gICAgXCIjNzg3ODc4XCIsXG4gICAgXCIjMDAwMDAwXCIsXG4gICAgXCIjMDAwMDAwXCJcbiAgXSxcblxuICBbXCIjRkNGQ0ZDXCIsXG4gICAgXCIjQTRFNEZDXCIsXG4gICAgXCIjQjhCOEY4XCIsXG4gICAgXCIjRDhCOEY4XCIsXG4gICAgXCIjRjhCOEY4XCIsXG4gICAgXCIjRjhBNEMwXCIsXG4gICAgXCIjRjBEMEIwXCIsXG4gICAgXCIjRkNFMEE4XCIsXG4gICAgXCIjRjhEODc4XCIsXG4gICAgXCIjRDhGODc4XCIsXG4gICAgXCIjQjhGOEI4XCIsXG4gICAgXCIjQjhGOEQ4XCIsXG4gICAgXCIjMDBGQ0ZDXCIsXG4gICAgXCIjRjhEOEY4XCIsXG4gICAgXCIjMDAwMDAwXCIsXG4gICAgXCIjMDAwMDAwXCJcbiAgXVxuXSIsInZhciBCbG9ja0NvbW1hbmQgPSBmdW5jdGlvbihibG9ja3MpIHtcbiAgdGhpcy5ibG9ja3MgPSBibG9ja3M7XG5cbiAgdGhpcy5zdWJDb21tYW5kcyA9IFtdO1xuXG4gIHRoaXMuZGVsdGFzID0gW107XG59O1xuXG5CbG9ja0NvbW1hbmQucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKGNvb3JkLCB2YWx1ZSkge1xuICB0aGlzLnN1YkNvbW1hbmRzLnB1c2goe1xuICAgIGNvb3JkOiBjb29yZCxcbiAgICB2YWx1ZTogdmFsdWVcbiAgfSk7XG59O1xuXG5CbG9ja0NvbW1hbmQucHJvdG90eXBlLnNldEF0Q29vcmRzID0gZnVuY3Rpb24oY29vcmRzLCB2YWx1ZSkge1xuICB0aGlzLnN1YkNvbW1hbmRzLnB1c2goe1xuICAgIGNvb3JkczogY29vcmRzLFxuICAgIHZhbHVlOiB2YWx1ZVxuICB9KTtcbn07XG5cbkJsb2NrQ29tbWFuZC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24oKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdWJDb21tYW5kcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBzdWJDb21tYW5kID0gdGhpcy5zdWJDb21tYW5kc1tpXTtcbiAgICB2YXIgdmFsdWUgPSBzdWJDb21tYW5kLnZhbHVlO1xuICAgIHZhciBjb29yZHMgPSBzdWJDb21tYW5kLmNvb3JkcyB8fCBbc3ViQ29tbWFuZC5jb29yZF07XG5cbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNvb3Jkcy5sZW5ndGg7IGorKykge1xuICAgICAgdmFyIGNvb3JkID0gY29vcmRzW2pdO1xuICAgICAgdmFyIHByZXZpb3VzVmFsdWUgPSB0aGlzLmJsb2Nrcy5nZXRBdENvb3JkKGNvb3JkKTtcbiAgICAgIHRoaXMuZGVsdGFzLnB1c2goe1xuICAgICAgICBjb29yZDogY29vcmQsXG4gICAgICAgIHByZXZpb3VzVmFsdWU6IHByZXZpb3VzVmFsdWVcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLmJsb2Nrcy5zZXRBdENvb3JkKGNvb3JkLCB2YWx1ZSk7XG4gICAgfVxuICB9XG59O1xuXG5CbG9ja0NvbW1hbmQucHJvdG90eXBlLnVuZG8gPSBmdW5jdGlvbigpIHtcbiAgZm9yICh2YXIgaSA9IHRoaXMuZGVsdGFzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIGRlbHRhID0gdGhpcy5kZWx0YXNbaV07XG4gICAgdGhpcy5ibG9ja3Muc2V0QXRDb29yZChkZWx0YS5jb29yZCwgZGVsdGEucHJldmlvdXNWYWx1ZSk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQmxvY2tDb21tYW5kOyIsInZhciBCbG9ja0NvbW1hbmQgPSByZXF1aXJlKCcuL2Jsb2NrY29tbWFuZCcpO1xudmFyIGFycmF5VXRpbHMgPSByZXF1aXJlKCcuLi8uLi91dGlscy9hcnJheXV0aWxzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWRpdG9yLCBibG9ja3MsIGNvb3Jkcywgb2Zmc2V0KSB7XG4gIHZhciBjb21tYW5kID0gbmV3IEJsb2NrQ29tbWFuZChlZGl0b3IuYmxvY2tzKTtcblxuICB2YXIgdG9BZGQgPSBbXTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGNvb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBjb29yZCA9IGNvb3Jkc1tpXTtcbiAgICB2YXIgdmFsdWUgPSBibG9ja3MuZ2V0QXRDb29yZChjb29yZCk7XG5cbiAgICAvLyBSZW1vdmVcbiAgICBjb21tYW5kLnNldChjb29yZHNbaV0sIHVuZGVmaW5lZCk7XG5cbiAgICB0b0FkZC5wdXNoKHtcbiAgICAgIGNvb3JkOiBub3JtYWxpemVDb29yZChuZXcgVEhSRUUuVmVjdG9yMygpLmFkZFZlY3RvcnMoY29vcmQsIG9mZnNldCksIGJsb2Nrcy5kaW0pLFxuICAgICAgdmFsdWU6IHZhbHVlXG4gICAgfSk7XG4gIH1cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRvQWRkLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGFkZCA9IHRvQWRkW2ldO1xuXG4gICAgLy8gQWRkXG4gICAgY29tbWFuZC5zZXQoYWRkLmNvb3JkLCBhZGQudmFsdWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplQ29vcmQoY29vcmQsIGRpbSkge1xuICAgIHJldHVybiBuZXcgVEhSRUUuVmVjdG9yMyhcbiAgICAgIChjb29yZC54ICsgZGltWzBdKSAlIGRpbVswXSxcbiAgICAgIChjb29yZC55ICsgZGltWzFdKSAlIGRpbVsxXSxcbiAgICAgIChjb29yZC56ICsgZGltWzJdKSAlIGRpbVsyXVxuICAgICk7XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBzZWxlY3Rpb25Db3B5OiBudWxsLFxuICAgIHJ1bjogZnVuY3Rpb24oKSB7XG4gICAgICBjb21tYW5kLnJ1bigpO1xuICAgICAgdGhpcy5zZWxlY3Rpb25Db3B5ID0gYXJyYXlVdGlscy5jbG9uZShlZGl0b3Iuc2VsZWN0aW9ucyk7XG5cbiAgICAgIGlmIChlZGl0b3Iuc2VsZWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vIE9mZnNldCBzZWxlY3Rpb25cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlZGl0b3Iuc2VsZWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciBub3JtYWxpemVkID0gbm9ybWFsaXplQ29vcmQobmV3IFRIUkVFLlZlY3RvcjMoKS5hZGRWZWN0b3JzKGVkaXRvci5zZWxlY3Rpb25zW2ldLCBvZmZzZXQpLCBibG9ja3MuZGltKTtcbiAgICAgICAgICBlZGl0b3Iuc2VsZWN0aW9uc1tpXSA9IG5vcm1hbGl6ZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIHVuZG86IGZ1bmN0aW9uKCkge1xuICAgICAgY29tbWFuZC51bmRvKCk7XG5cbiAgICAgIGlmIChlZGl0b3Iuc2VsZWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vIE9mZnNldCBzZWxlY3Rpb25cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlZGl0b3Iuc2VsZWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciBub3JtYWxpemVkID0gbm9ybWFsaXplQ29vcmQobmV3IFRIUkVFLlZlY3RvcjMoKS5zdWJWZWN0b3JzKGVkaXRvci5zZWxlY3Rpb25zW2ldLCBvZmZzZXQpLCBibG9ja3MuZGltKTtcbiAgICAgICAgICBlZGl0b3Iuc2VsZWN0aW9uc1tpXSA9IG5vcm1hbGl6ZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn07IiwidmFyIGFycmF5VXRpbHMgPSByZXF1aXJlKCcuLi8uLi91dGlscy9hcnJheXV0aWxzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWRpdG9yLCBzZWxlY3Rpb25zKSB7XG4gIHZhciBvcmlnaW5hbFNlbGVjdGlvbnMgPSBudWxsO1xuICByZXR1cm4ge1xuICAgIHJ1bjogZnVuY3Rpb24oKSB7XG4gICAgICBvcmlnaW5hbFNlbGVjdGlvbnMgPSBhcnJheVV0aWxzLmNsb25lKGVkaXRvci5zZWxlY3Rpb25zKTtcbiAgICAgIGVkaXRvci5zZWxlY3Rpb25zID0gc2VsZWN0aW9ucztcbiAgICB9LFxuXG4gICAgdW5kbzogZnVuY3Rpb24oKSB7XG4gICAgICBlZGl0b3Iuc2VsZWN0aW9ucyA9IG9yaWdpbmFsU2VsZWN0aW9ucztcbiAgICB9XG4gIH07XG59OyIsInZhciBCbG9ja0NvbW1hbmQgPSByZXF1aXJlKCcuL2Jsb2NrY29tbWFuZCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGJsb2NrcywgY29vcmRzLCB2YWx1ZSkge1xuICB2YXIgY29tbWFuZCA9IG5ldyBCbG9ja0NvbW1hbmQoYmxvY2tzKTtcbiAgY29tbWFuZC5zZXRBdENvb3Jkcyhjb29yZHMsIHZhbHVlKTtcblxuICByZXR1cm4gY29tbWFuZDtcbn07IiwidmFyIFRIUkVFID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ1RIUkVFJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydUSFJFRSddIDogbnVsbCk7XG52YXIgY3ByID0gcmVxdWlyZSgnLi4vY3ByL2NwcicpO1xudmFyIENCdWZmZXIgPSByZXF1aXJlKCdjYnVmZmVyJyk7XG52YXIgYmxvY2tzQ29tcG9uZW50ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9ibG9ja3MnKTtcbnZhciBkcmFnQ2FtZXJhQ29tcG9uZW50ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9kcmFnY2FtZXJhJyk7XG52YXIgZWRpdG9yQ29uc29sZSA9IHJlcXVpcmUoJy4vZWRpdG9yY29uc29sZScpO1xudmFyIGVkaXRvclRvb2xzID0gcmVxdWlyZSgnLi9lZGl0b3J0b29scycpO1xudmFyIE9mZnNldENvbW1hbmQgPSByZXF1aXJlKCcuL2NvbW1hbmRzL29mZnNldGNvbW1hbmQnKTtcbnZhciBCbG9ja3MgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL2Jsb2NrcycpO1xuXG52YXIgRWRpdG9yID0gZnVuY3Rpb24ob2JqZWN0LCBhcHAsIGlucHV0LCBjYW1lcmEsIGRldkNvbnNvbGUsIGNvbmZpZywgcGFsZXR0ZSwgY2FudmFzKSB7XG5cbiAgdGhpcy5vYmplY3QgPSBvYmplY3Q7XG5cbiAgdGhpcy5hcHAgPSBhcHA7XG5cbiAgdGhpcy5pbnB1dCA9IGlucHV0O1xuXG4gIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuXG4gIHRoaXMuZGV2Q29uc29sZSA9IGRldkNvbnNvbGU7XG5cbiAgdGhpcy5jb25maWcgPSBjb25maWc7XG5cbiAgdGhpcy5wYWxldHRlID0gcGFsZXR0ZTtcblxuICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcblxuICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gIHRoaXMuYmxvY2tzID0gbnVsbDtcblxuICB0aGlzLmRyYWdDYW1lcmEgPSBudWxsO1xuXG4gIHRoaXMub2JqR3JvdW5kID0gbnVsbDtcblxuICB0aGlzLm9iakJvdW5kaW5nQm94ID0gbnVsbDtcblxuICB0aGlzLl9zdGFydGVkID0gZmFsc2U7XG5cbiAgdGhpcy5tYXRlcmlhbHMgPSBbXTtcblxuICB0aGlzLnNlbGVjdGVkQ29sb3IgPSBudWxsO1xuXG4gIHRoaXMudW5kb3MgPSBDQnVmZmVyKDIwMCk7XG5cbiAgdGhpcy5yZWRvcyA9IENCdWZmZXIoMjAwKTtcblxuICB0aGlzLmZyYW1lcyA9IFtdO1xuXG4gIHRoaXMuY3VycmVudEZyYW1lID0gMDtcblxuICB0aGlzLmNwciA9IG51bGw7XG5cbiAgdGhpcy5jcHJQcmVmYWJzID0gbnVsbDtcblxuICB0aGlzLnRvb2xOYW1lcyA9IFsncGVuJywgJ3NlbGVjdCddO1xuXG4gIHRoaXMudG9vbE5hbWUgPSAncGVuJztcblxuICB0aGlzLnRvb2wgPSBudWxsO1xuXG4gIHRoaXMubG9ja0NhbWVyYSA9IGZhbHNlO1xuXG4gIHRoaXMuc2VsZWN0aW9ucyA9IFtdO1xuXG4gIHRoaXMuZnJhbWVSYXRlID0gNDtcblxuICB0aGlzLnBsYXlpbmcgPSBmYWxzZTtcblxuICB0aGlzLnBsYXlUaW1lb3V0ID0gbnVsbDtcblxuICB0aGlzLmFsbEZyYW1lcyA9IGZhbHNlO1xuXG4gIHRoaXMucmVmbGVjdFggPSBmYWxzZTtcblxuICB0aGlzLnJlZmxlY3RZID0gZmFsc2U7XG5cbiAgdGhpcy5yZWZsZWN0WiA9IGZhbHNlO1xufTtcblxuRWRpdG9yLiRpbmplY3QgPSBbJ2FwcCcsICdpbnB1dCcsICdjYW1lcmEnLCAnZGV2Q29uc29sZScsICdjb25maWcnLCAncGFsZXR0ZScsICdjYW52YXMnXTtcblxuRWRpdG9yLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmJsb2NrcyA9IHRoaXMuYXBwLmF0dGFjaCh0aGlzLm9iamVjdCwgYmxvY2tzQ29tcG9uZW50KTtcblxuICB0aGlzLmZyYW1lcy5wdXNoKHtcbiAgICBkYXRhOiB0aGlzLmJsb2Nrcy5zZXJpYWxpemUoKVxuICB9KTtcblxuICB0aGlzLnVwZGF0ZU1hdGVyaWFsKHRoaXMuYmxvY2tzKTtcblxuICB0aGlzLnNlbGVjdGVkQ29sb3IgPSB0aGlzLnBhbGV0dGVbMF1bMF07XG5cbiAgLy8gQ3JlYXRlIGNvbG9yIHBpY2tlclxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMuY3ByID0gY3ByKHtcbiAgICBwYWxldHRlOiB0aGlzLnBhbGV0dGUsXG4gICAgb25QaWNrOiBmdW5jdGlvbihjb2xvcikge1xuICAgICAgY29uc29sZS5sb2coY29sb3IpO1xuICAgICAgc2VsZi5zZWxlY3RlZENvbG9yID0gY29sb3I7XG4gICAgfVxuICB9KTtcblxuICB0aGlzLmNwclByZWZhYnMgPSBjcHIoe1xuICAgIHBhbGV0dGU6IFtcbiAgICAgIFtdXG4gICAgXSxcbiAgICBvblBpY2s6IGZ1bmN0aW9uKG9iaikge30sXG4gICAgYmxvY2tXaWR0aDogNDgsXG4gICAgYmxvY2tIZWlnaHQ6IDQ4XG4gIH0pO1xuXG4gIHZhciBzYXZlcyA9IHRoaXMuZ2V0U2F2ZXMoKTtcbiAgZm9yICh2YXIgaWQgaW4gc2F2ZXMpIHtcbiAgICB2YXIgc2F2ZSA9IHNhdmVzW2lkXTtcbiAgICB2YXIgZmlyc3RGcmFtZSA9IHNhdmUuZnJhbWVzWzBdO1xuICAgIHZhciBpbWdEYXRhID0gdGhpcy5zY3JlZW5zaG90KGZpcnN0RnJhbWUuZGF0YSk7XG4gICAgdGhpcy5jcHJQcmVmYWJzLmFkZCgwLCB0aGlzLmNwclByZWZhYnMucGFsZXR0ZVswXS5sZW5ndGgsIHtcbiAgICAgIGltZ0RhdGE6IGltZ0RhdGFcbiAgICB9KTtcbiAgfVxuXG4gIHRoaXMuY3ByUHJlZmFicy5kb21FbGVtZW50LnN0eWxlLmJvdHRvbSA9ICcxMjBweCc7XG5cbiAgZWRpdG9yQ29uc29sZSh0aGlzLCB0aGlzLmRldkNvbnNvbGUpO1xuXG4gIHRoaXMuZHJhZ0NhbWVyYSA9IHRoaXMuYXBwLmF0dGFjaCh0aGlzLmNhbWVyYSwgZHJhZ0NhbWVyYUNvbXBvbmVudCk7XG5cbiAgdGhpcy51cGRhdGVTaXplKHRoaXMuY29uZmlnWydlZGl0b3JfZGVmYXVsdF9zaXplJ10pO1xuXG4gIHRoaXMudXBkYXRlVG9vbCgpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oKSB7XG4gIGlmICghdGhpcy5fc3RhcnRlZCkge1xuICAgIHRoaXMuc3RhcnQoKTtcbiAgICB0aGlzLl9zdGFydGVkID0gdHJ1ZTtcbiAgfVxuXG4gIHRoaXMudG9vbC50aWNrKCk7XG5cbiAgdGhpcy5kcmF3U2VsZWN0aW9uKCk7XG5cbiAgdmFyIG9mZnNldENvb3JkID0gbnVsbDtcbiAgaWYgKHRoaXMuaW5wdXQua2V5RG93bignZicpKSB7XG4gICAgb2Zmc2V0Q29vcmQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAtMSwgMCk7XG4gIH1cbiAgaWYgKHRoaXMuaW5wdXQua2V5RG93bigncicpKSB7XG4gICAgb2Zmc2V0Q29vcmQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAxLCAwKTtcbiAgfVxuICBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCdhJykpIHtcbiAgICBvZmZzZXRDb29yZCA9IG5ldyBUSFJFRS5WZWN0b3IzKC0xLCAwLCAwKTtcbiAgfVxuICBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCdkJykpIHtcbiAgICBvZmZzZXRDb29yZCA9IG5ldyBUSFJFRS5WZWN0b3IzKDEsIDAsIDApO1xuICB9XG4gIGlmICh0aGlzLmlucHV0LmtleURvd24oJ3cnKSkge1xuICAgIG9mZnNldENvb3JkID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTEpO1xuICB9XG4gIGlmICh0aGlzLmlucHV0LmtleURvd24oJ3MnKSkge1xuICAgIG9mZnNldENvb3JkID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMSk7XG4gIH1cblxuICBpZiAob2Zmc2V0Q29vcmQgIT0gbnVsbCkge1xuICAgIHZhciBzZWxlY3RlZENvb3JkcztcbiAgICBpZiAodGhpcy5zZWxlY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgIHNlbGVjdGVkQ29vcmRzID0gdGhpcy5zZWxlY3Rpb25zO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWxlY3RlZENvb3JkcyA9IHRoaXMuYmxvY2tzLmdldEFsbENvb3JkcygpO1xuICAgIH1cblxuICAgIHRoaXMucnVuQ29tbWFuZChuZXcgT2Zmc2V0Q29tbWFuZCh0aGlzLCB0aGlzLmJsb2Nrcywgc2VsZWN0ZWRDb29yZHMsIG9mZnNldENvb3JkKSk7XG4gIH1cblxuICBpZiAodGhpcy5pbnB1dC5rZXlIb2xkKCdjb21tYW5kJykgJiYgdGhpcy5pbnB1dC5rZXlIb2xkKCdzaGlmdCcpKSB7XG4gICAgaWYgKHRoaXMuaW5wdXQua2V5RG93bigneicpKSB7XG4gICAgICB0aGlzLnJlZG8oKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodGhpcy5pbnB1dC5rZXlIb2xkKCdjb21tYW5kJykpIHtcbiAgICBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCd6JykpIHtcbiAgICAgIHRoaXMudW5kbygpO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0aGlzLmlucHV0LmtleURvd24oJzsnKSkge1xuICAgIHRoaXMubGFzdEZyYW1lKCk7XG4gIH1cblxuICBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCdcXCcnKSkge1xuICAgIHRoaXMubmV4dEZyYW1lKCk7XG4gIH1cblxuICBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCcxJykpIHtcbiAgICB0aGlzLnRvb2xOYW1lID0gdGhpcy50b29sTmFtZXNbMF07XG4gICAgdGhpcy51cGRhdGVUb29sKCk7XG4gIH0gZWxzZSBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCcyJykpIHtcbiAgICB0aGlzLnRvb2xOYW1lID0gdGhpcy50b29sTmFtZXNbMV07XG4gICAgdGhpcy51cGRhdGVUb29sKCk7XG4gIH1cbn07XG5cbkVkaXRvci5wcm90b3R5cGUudW5kbyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY29tbWFuZCA9IHRoaXMudW5kb3MubGFzdCgpO1xuICBpZiAoY29tbWFuZCA9PSBudWxsKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbW1hbmQudW5kbygpO1xuICB0aGlzLnVuZG9zLnBvcCgpO1xuICB0aGlzLnJlZG9zLnB1c2goY29tbWFuZCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnJlZG8gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGNvbW1hbmQgPSB0aGlzLnJlZG9zLmxhc3QoKTtcbiAgaWYgKGNvbW1hbmQgPT0gbnVsbCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb21tYW5kLnJ1bigpO1xuICB0aGlzLnJlZG9zLnBvcCgpO1xuICB0aGlzLnVuZG9zLnB1c2goY29tbWFuZCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnJ1bkNvbW1hbmQgPSBmdW5jdGlvbihjb21tYW5kKSB7XG4gIGNvbW1hbmQucnVuKCk7XG4gIHRoaXMudW5kb3MucHVzaChjb21tYW5kKTtcbiAgdGhpcy5yZWRvcyA9IENCdWZmZXIoMjAwKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUudXBkYXRlTWF0ZXJpYWwgPSBmdW5jdGlvbihibG9ja3MpIHtcbiAgdmFyIG1hdGVyaWFscyA9IGJsb2Nrcy5tYXRlcmlhbC5tYXRlcmlhbHM7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tYXRlcmlhbHMubGVuZ3RoOyBpKyspIHtcbiAgICBtYXRlcmlhbHNbaV0gPSB0aGlzLm1hdGVyaWFsc1tpXTtcbiAgfVxufTtcblxuRWRpdG9yLnByb3RvdHlwZS51cGRhdGVTaXplID0gZnVuY3Rpb24oc2l6ZSkge1xuICB0aGlzLmJsb2Nrcy5zZXREaW0oW3NpemVbMF0sIHNpemVbMV0sIHNpemVbMl1dKTtcbiAgdGhpcy5ibG9ja3Mub2JqLnBvc2l0aW9uLnNldCgtc2l6ZVswXSAvIDIsIC1zaXplWzFdIC8gMiwgLXNpemVbMl0gLyAyKTtcbiAgdGhpcy51cGRhdGVHcm91bmQoc2l6ZSk7XG4gIHRoaXMudXBkYXRlQm91bmRpbmdCb3goc2l6ZSk7XG5cbiAgLy8gTWF4IGZyb20gMyBudW1iZXJzXG4gIHZhciBtYXhTaXplID0gTWF0aC5tYXgoc2l6ZVswXSwgc2l6ZVsxXSwgc2l6ZVsyXSk7XG4gIHRoaXMuZHJhZ0NhbWVyYS5kaXN0YW5jZSA9IDIgKiAobWF4U2l6ZSk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnVwZGF0ZUdyb3VuZCA9IGZ1bmN0aW9uKHNpemUpIHtcbiAgaWYgKHRoaXMub2JqR3JvdW5kICE9IG51bGwpIHtcbiAgICB0aGlzLm9iamVjdC5yZW1vdmUodGhpcy5vYmpHcm91bmQpO1xuICB9XG5cbiAgdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkdlb21ldHJ5KCk7XG4gIGdlb21ldHJ5LnZlcnRpY2VzLnB1c2goXG4gICAgbmV3IFRIUkVFLlZlY3RvcjMoLXNpemVbMF0gLyAyLCAtc2l6ZVsxXSAvIDIsIC1zaXplWzJdIC8gMiksXG4gICAgbmV3IFRIUkVFLlZlY3RvcjMoc2l6ZVswXSAvIDIsIC1zaXplWzFdIC8gMiwgLXNpemVbMl0gLyAyKSxcbiAgICBuZXcgVEhSRUUuVmVjdG9yMyhzaXplWzBdIC8gMiwgLXNpemVbMV0gLyAyLCBzaXplWzJdIC8gMiksXG4gICAgbmV3IFRIUkVFLlZlY3RvcjMoLXNpemVbMF0gLyAyLCAtc2l6ZVsxXSAvIDIsIHNpemVbMl0gLyAyKVxuICApO1xuICBnZW9tZXRyeS5mYWNlcy5wdXNoKFxuICAgIG5ldyBUSFJFRS5GYWNlMygyLCAxLCAwKSxcbiAgICBuZXcgVEhSRUUuRmFjZTMoMCwgMywgMilcbiAgKTtcbiAgZ2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXS5wdXNoKFxuICAgIFtcbiAgICAgIG5ldyBUSFJFRS5WZWN0b3IyKDAsIDApLFxuICAgICAgbmV3IFRIUkVFLlZlY3RvcjIoc2l6ZVsyXSAvIDIsIDApLFxuICAgICAgbmV3IFRIUkVFLlZlY3RvcjIoc2l6ZVsyXSAvIDIsIHNpemVbMF0gLyAyKVxuICAgIF0sIFtcbiAgICAgIG5ldyBUSFJFRS5WZWN0b3IyKHNpemVbMl0gLyAyLCBzaXplWzBdIC8gMiksXG4gICAgICBuZXcgVEhSRUUuVmVjdG9yMigwLCBzaXplWzBdIC8gMiksXG4gICAgICBuZXcgVEhSRUUuVmVjdG9yMigwLCAwKVxuICAgIF1cbiAgKTtcbiAgdmFyIG1hdGVyaWFsID0gbWF0ZXJpYWxzWydwbGFjZWhvbGRlciddO1xuICB0aGlzLm9iakdyb3VuZCA9IG5ldyBUSFJFRS5NZXNoKGdlb21ldHJ5LCBtYXRlcmlhbCk7XG4gIHRoaXMub2JqZWN0LmFkZCh0aGlzLm9iakdyb3VuZCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnVwZGF0ZUJvdW5kaW5nQm94ID0gZnVuY3Rpb24oc2l6ZSkge1xuICBpZiAodGhpcy5vYmpCb3VuZGluZ0JveCAhPSBudWxsKSB7XG4gICAgdGhpcy5vYmplY3QucmVtb3ZlKHRoaXMub2JqQm91bmRpbmdCb3gpO1xuICB9XG5cbiAgdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkdlb21ldHJ5KCk7XG5cbiAgdmFyIGEgPSBuZXcgVEhSRUUuVmVjdG9yMygtc2l6ZVswXSAvIDIsIC1zaXplWzFdIC8gMiwgLXNpemVbMl0gLyAyKTtcbiAgdmFyIGIgPSBuZXcgVEhSRUUuVmVjdG9yMyhzaXplWzBdIC8gMiwgLXNpemVbMV0gLyAyLCAtc2l6ZVsyXSAvIDIpO1xuICB2YXIgYyA9IG5ldyBUSFJFRS5WZWN0b3IzKHNpemVbMF0gLyAyLCAtc2l6ZVsxXSAvIDIsIHNpemVbMl0gLyAyKTtcbiAgdmFyIGQgPSBuZXcgVEhSRUUuVmVjdG9yMygtc2l6ZVswXSAvIDIsIC1zaXplWzFdIC8gMiwgc2l6ZVsyXSAvIDIpO1xuXG4gIHZhciBlID0gbmV3IFRIUkVFLlZlY3RvcjMoLXNpemVbMF0gLyAyLCBzaXplWzFdIC8gMiwgLXNpemVbMl0gLyAyKTtcbiAgdmFyIGYgPSBuZXcgVEhSRUUuVmVjdG9yMyhzaXplWzBdIC8gMiwgc2l6ZVsxXSAvIDIsIC1zaXplWzJdIC8gMik7XG4gIHZhciBnID0gbmV3IFRIUkVFLlZlY3RvcjMoc2l6ZVswXSAvIDIsIHNpemVbMV0gLyAyLCBzaXplWzJdIC8gMik7XG4gIHZhciBoID0gbmV3IFRIUkVFLlZlY3RvcjMoLXNpemVbMF0gLyAyLCBzaXplWzFdIC8gMiwgc2l6ZVsyXSAvIDIpO1xuXG4gIGdlb21ldHJ5LnZlcnRpY2VzLnB1c2goYSwgZSwgYiwgZiwgYywgZywgZCwgaCwgZSwgZiwgZiwgZywgZywgaCwgaCwgZSk7XG5cbiAgdmFyIG1hdGVyaWFsID0gbmV3IFRIUkVFLkxpbmVCYXNpY01hdGVyaWFsKHtcbiAgICBjb2xvcjogMHhmZmZmZmYsXG4gICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgb3BhY2l0eTogMC41XG4gIH0pO1xuICB0aGlzLm9iakJvdW5kaW5nQm94ID0gbmV3IFRIUkVFLkxpbmVTZWdtZW50cyhnZW9tZXRyeSwgbWF0ZXJpYWwpO1xuICB0aGlzLm9iamVjdC5hZGQodGhpcy5vYmpCb3VuZGluZ0JveCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLmFkZEZyYW1lID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuZnJhbWVzLnB1c2goe1xuICAgIGRhdGE6IHRoaXMuYmxvY2tzLnNlcmlhbGl6ZSgpXG4gIH0pXG5cbiAgdGhpcy5jdXJyZW50RnJhbWUgPSB0aGlzLmZyYW1lcy5sZW5ndGggLSAxO1xuICB0aGlzLnVwZGF0ZUN1cnJlbnRGcmFtZSgpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS51cGRhdGVDdXJyZW50RnJhbWUgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuZnJhbWVzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBmcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMuY3VycmVudEZyYW1lXTtcbiAgdmFyIGRhdGEgPSBmcmFtZS5kYXRhO1xuICB0aGlzLmJsb2Nrcy5kZXNlcmlhbGl6ZShkYXRhKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUubmV4dEZyYW1lID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmZyYW1lcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLnNhdmVDdXJyZW50RnJhbWUoKTtcblxuICB0aGlzLmN1cnJlbnRGcmFtZSsrO1xuICBpZiAodGhpcy5jdXJyZW50RnJhbWUgPT09IHRoaXMuZnJhbWVzLmxlbmd0aCkge1xuICAgIHRoaXMuY3VycmVudEZyYW1lID0gMDtcbiAgfVxuXG4gIHRoaXMudXBkYXRlQ3VycmVudEZyYW1lKCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLmxhc3RGcmFtZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5mcmFtZXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhpcy5zYXZlQ3VycmVudEZyYW1lKCk7XG5cbiAgaWYgKHRoaXMuY3VycmVudEZyYW1lID4gMCkge1xuICAgIHRoaXMuY3VycmVudEZyYW1lLS07XG4gICAgdGhpcy51cGRhdGVDdXJyZW50RnJhbWUoKTtcbiAgfVxufTtcblxuRWRpdG9yLnByb3RvdHlwZS5zYXZlQ3VycmVudEZyYW1lID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuZnJhbWVzW3RoaXMuY3VycmVudEZyYW1lXSA9IHtcbiAgICBkYXRhOiB0aGlzLmJsb2Nrcy5zZXJpYWxpemUoKVxuICB9O1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5zZXJpYWxpemUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5zYXZlQ3VycmVudEZyYW1lKCk7XG5cbiAgdmFyIGpzb24gPSB7fTtcbiAganNvbi5mcmFtZXMgPSB0aGlzLmZyYW1lcztcblxuICByZXR1cm4ganNvbjtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUuZGVzZXJpYWxpemUgPSBmdW5jdGlvbihqc29uKSB7XG4gIHRoaXMuZnJhbWVzID0ganNvbi5mcmFtZXMgfHwgW107XG4gIHRoaXMudXBkYXRlQ3VycmVudEZyYW1lKCk7XG4gIHRoaXMudXBkYXRlU2l6ZSh0aGlzLmJsb2Nrcy5kaW0pO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS51cGRhdGVUb29sID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLnRvb2wgIT0gbnVsbCkge1xuICAgIGlmICh0aGlzLnRvb2wuZGlzcG9zZSAhPSBudWxsKSB7XG4gICAgICB0aGlzLnRvb2wuZGlzcG9zZSgpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBmYWN0b3J5ID0gZWRpdG9yVG9vbHNbdGhpcy50b29sTmFtZV07XG4gIHRoaXMudG9vbCA9IGZhY3RvcnkodGhpcyk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnNldExvY2tDYW1lcmEgPSBmdW5jdGlvbih2YWx1ZSkge1xuICB0aGlzLmxvY2tDYW1lcmEgPSB2YWx1ZTtcbiAgdGhpcy5kcmFnQ2FtZXJhLmxvY2tSb3RhdGlvbiA9IHZhbHVlO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5kcmF3U2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gIHZhciBibG9ja3MgPSB0aGlzLmJsb2NrcztcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNlbGVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgY29vcmQgPSB0aGlzLnNlbGVjdGlvbnNbaV07XG4gICAgY29vcmQgPSBjb29yZC5jbG9uZSgpLmFkZChuZXcgVEhSRUUuVmVjdG9yMygwLjUsIDAuNSwgMC41KSk7XG4gICAgdmFyIGxvY2FsUG9pbnQgPSBibG9ja3MuY29vcmRUb1BvaW50KGNvb3JkKTtcbiAgICB2YXIgd29ybGRQb2ludCA9IGJsb2Nrcy5vYmoubG9jYWxUb1dvcmxkKGxvY2FsUG9pbnQpO1xuICAgIHZhciB2ZWN0b3IgPSB3b3JsZFBvaW50LnByb2plY3QodGhpcy5jYW1lcmEpO1xuICAgIHZlY3Rvci54ID0gTWF0aC5yb3VuZCgodmVjdG9yLnggKyAxKSAqIGNhbnZhcy53aWR0aCAvIDIpO1xuICAgIHZlY3Rvci55ID0gTWF0aC5yb3VuZCgoLXZlY3Rvci55ICsgMSkgKiBjYW52YXMuaGVpZ2h0IC8gMik7XG5cbiAgICB0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gJyNmZmZmZmYnO1xuICAgIHRoaXMuY29udGV4dC5maWxsUmVjdCh2ZWN0b3IueCwgdmVjdG9yLnksIDEsIDEpO1xuICB9XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnBsYXkgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuZnJhbWVzIDw9IDEpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAodGhpcy5wbGF5aW5nKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhpcy5wbGF5aW5nID0gdHJ1ZTtcblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciBpbnRlcnZhbCA9IGZ1bmN0aW9uKCkge1xuICAgIHNlbGYubmV4dEZyYW1lKHRydWUpO1xuICAgIHNlbGYucGxheVRpbWVvdXQgPSBzZXRUaW1lb3V0KGludGVydmFsLCAxMDAwIC8gc2VsZi5mcmFtZVJhdGUpO1xuICB9O1xuXG4gIGludGVydmFsKCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCF0aGlzLnBsYXlpbmcpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjbGVhclRpbWVvdXQodGhpcy5wbGF5VGltZW91dCk7XG4gIHRoaXMucGxheWluZyA9IGZhbHNlO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5jcmVhdGVOZXcgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5zdG9wKCk7XG4gIHRoaXMuZnJhbWVzID0gW107XG4gIHRoaXMuYmxvY2tzLmNsZWFyKCk7XG4gIHRoaXMudXBkYXRlU2l6ZSh0aGlzLmNvbmZpZ1snZWRpdG9yX2RlZmF1bHRfc2l6ZSddKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUuc2NyZWVuc2hvdCA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgdmFyIHJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoe1xuICAgIGFscGhhOiB0cnVlXG4gIH0pO1xuICByZW5kZXJlci5zZXRDbGVhckNvbG9yKDB4ZmZmZmZmLCAwLjApO1xuXG4gIHZhciB3aWR0aCA9IDEwMDtcbiAgdmFyIGhlaWdodCA9IDEwMDtcbiAgcmVuZGVyZXIuc2V0U2l6ZSh3aWR0aCwgaGVpZ2h0KTtcblxuICB2YXIgb2JqZWN0ID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gIHZhciBibG9ja3MgPSBuZXcgQmxvY2tzKG9iamVjdCk7XG4gIGJsb2Nrcy5kZXNlcmlhbGl6ZShkYXRhKTtcbiAgYmxvY2tzLnRpY2soKTtcblxuICB2YXIgZGltID0gYmxvY2tzLmRpbTtcblxuICBibG9ja3Mub2JqLnBvc2l0aW9uLnNldCgtZGltWzBdIC8gMiwgLWRpbVsxXSAvIDIsIC1kaW1bMl0gLyAyKTtcblxuICB2YXIgb2JqZWN0Q2xvbmUgPSBvYmplY3QuY2xvbmUoKTtcbiAgdmFyIHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XG4gIHNjZW5lLmFkZChvYmplY3RDbG9uZSk7XG5cbiAgdmFyIGFtYmllbnQgPSBuZXcgVEhSRUUuQW1iaWVudExpZ2h0KG5ldyBUSFJFRS5Db2xvcihcInJnYig2MCUsIDYwJSwgNjAlKVwiKSk7XG4gIHZhciBsaWdodCA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KDB4ZmZmZmZmLCAwLjYpO1xuICBsaWdodC5wb3NpdGlvbi5zZXQoMC44LCAxLCAwLjUpO1xuICBzY2VuZS5hZGQobGlnaHQpO1xuICBzY2VuZS5hZGQoYW1iaWVudCk7XG5cbiAgdmFyIG1heFNpemUgPSBNYXRoLm1heChkaW1bMF0sIGRpbVsxXSwgZGltWzJdKSAqIDI7XG5cbiAgdmFyIGNhbWVyYSA9IG5ldyBUSFJFRS5PcnRob2dyYXBoaWNDYW1lcmEobWF4U2l6ZSAvIC0yLCBtYXhTaXplIC8gMiwgbWF4U2l6ZSAvIDIsIG1heFNpemUgLyAtMiwgMC4xLCAxMDAwKTtcbiAgY2FtZXJhLnBvc2l0aW9uLnNldCgwLCAwLCAxMCk7XG5cbiAgdmFyIGNhbWVyYVBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgbWF4U2l6ZSlcbiAgICAuYXBwbHlFdWxlcihuZXcgVEhSRUUuRXVsZXIoLU1hdGguUEkgLyA0LCAwLCAwLCAnWVhaJykpXG4gIGNhbWVyYS5wb3NpdGlvbi5jb3B5KGNhbWVyYVBvc2l0aW9uKTtcbiAgY2FtZXJhLmxvb2tBdChuZXcgVEhSRUUuVmVjdG9yMygpKTtcblxuICByZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7XG4gIGltZ0RhdGEgPSByZW5kZXJlci5kb21FbGVtZW50LnRvRGF0YVVSTCgpO1xuXG4gIHJldHVybiBpbWdEYXRhO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5nZXRTYXZlcyA9IGZ1bmN0aW9uKCkge1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYl9zYXZlcycpIHx8IHt9KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRvcjsiLCJ2YXIgRWRpdG9yID0gcmVxdWlyZSgnLi9lZGl0b3InKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlZGl0b3IsIGRldkNvbnNvbGUpIHtcblxuICBkZXZDb25zb2xlLmNvbW1hbmRzWydzaXplJ10gPSBmdW5jdGlvbihhcmdzKSB7XG4gICAgdmFyIGRlZmF1bHRTaXplID0gZWRpdG9yLmNvbmZpZ1snZWRpdG9yX2RlZmF1bHRfc2l6ZSddO1xuICAgIHZhciB4ID0gYXJncy5fWzBdIHx8IGRlZmF1bHRTaXplWzBdO1xuICAgIHZhciB5ID0gYXJncy5fWzFdIHx8IGFyZ3MuX1swXSB8fCBkZWZhdWx0U2l6ZVsxXTtcbiAgICB2YXIgeiA9IGFyZ3MuX1syXSB8fCBhcmdzLl9bMF0gfHwgZGVmYXVsdFNpemVbMl07XG5cbiAgICBlZGl0b3IudXBkYXRlU2l6ZShbeCwgeSwgel0pO1xuICB9O1xuXG4gIGRldkNvbnNvbGUuY29tbWFuZHNbJ29mZnNldCddID0gZnVuY3Rpb24oYXJncykge1xuICAgIHZhciB4ID0gYXJncy5fWzBdIHx8IDA7XG4gICAgdmFyIHkgPSBhcmdzLl9bMV0gfHwgMDtcbiAgICB2YXIgeiA9IGFyZ3MuX1syXSB8fCAwO1xuXG4gICAgZWRpdG9yLmJsb2Nrcy5zZXRPZmZzZXQobmV3IFRIUkVFLlZlY3RvcjMoeCwgeSwgeikpO1xuICB9O1xuXG4gIGRldkNvbnNvbGUuY29tbWFuZHNbJ3NhdmUnXSA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICB2YXIgc2F2ZXM7XG4gICAgdHJ5IHtcbiAgICAgIHNhdmVzID0gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2Jfc2F2ZXMnKSB8fCB7fSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuXG4gICAgdmFyIG5hbWUgPSBhcmdzLl9bMF07XG5cbiAgICBpZiAobmFtZS5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVXNhZ2U6IHNhdmUgW25hbWVdJyk7XG4gICAgfVxuXG4gICAgc2F2ZXNbbmFtZV0gPSBlZGl0b3Iuc2VyaWFsaXplKCk7XG5cbiAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2Jfc2F2ZXMnLCBKU09OLnN0cmluZ2lmeShzYXZlcykpO1xuICB9O1xuXG4gIGRldkNvbnNvbGUuY29tbWFuZHNbJ2RlbGV0ZSddID0gZnVuY3Rpb24oYXJncykge1xuICAgIHZhciBzYXZlcztcbiAgICB0cnkge1xuICAgICAgc2F2ZXMgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYl9zYXZlcycpIHx8IHt9KTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG5cbiAgICB2YXIgbmFtZSA9IGFyZ3MuX1swXTtcblxuICAgIGlmIChuYW1lLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVc2FnZTogZGVsZXRlIFtuYW1lXScpO1xuICAgIH1cbiAgICBkZWxldGUgc2F2ZXNbbmFtZV07XG5cbiAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2Jfc2F2ZXMnLCBKU09OLnN0cmluZ2lmeShzYXZlcykpO1xuICB9O1xuXG4gIGRldkNvbnNvbGUuY29tbWFuZHNbJ2xvYWQnXSA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICB2YXIgc2F2ZXM7XG4gICAgdHJ5IHtcbiAgICAgIHNhdmVzID0gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2Jfc2F2ZXMnKSB8fCB7fSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuXG4gICAgdmFyIG5hbWUgPSBhcmdzLl9bMF07XG5cbiAgICBpZiAoc2F2ZXNbbmFtZV0gPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgZmluZCBzYXZlIG5hbWVkOiAnICsgbmFtZSk7XG4gICAgfVxuXG4gICAgZWRpdG9yLmRlc2VyaWFsaXplKHNhdmVzW25hbWVdKTtcbiAgfTtcblxuICBkZXZDb25zb2xlLmNvbW1hbmRzWyduZXcnXSA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICBlZGl0b3IuY3JlYXRlTmV3KCk7XG4gIH07XG5cbiAgZGV2Q29uc29sZS5jb21tYW5kc1snZnJhbWUnXSA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICB2YXIgc3ViQ29tbWFuZCA9IGFyZ3MuX1swXTtcblxuICAgIGlmIChzdWJDb21tYW5kID09PSAnYWRkJykge1xuICAgICAgZWRpdG9yLmFkZEZyYW1lKCk7XG4gICAgfSBlbHNlIGlmIChzdWJDb21tYW5kID09PSAnbmV4dCcpIHtcbiAgICAgIGVkaXRvci5uZXh0RnJhbWUoKTtcbiAgICB9IGVsc2UgaWYgKHN1YkNvbW1hbmQgPT09ICdsYXN0Jykge1xuICAgICAgZWRpdG9yLmxhc3RGcmFtZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VzYWdlOiBmcmFtZSBbYWRkfG5leHR8bGFzdF0nKTtcbiAgICB9XG4gIH07XG5cbiAgZGV2Q29uc29sZS5jb21tYW5kc1sndG9vbCddID0gZnVuY3Rpb24oYXJncykge1xuICAgIGlmIChlZGl0b3IudG9vbE5hbWUgIT09IGFyZ3MuX1swXSkge1xuICAgICAgZWRpdG9yLnRvb2xOYW1lID0gYXJncy5fWzBdO1xuICAgICAgZWRpdG9yLnVwZGF0ZVRvb2woKTtcbiAgICB9XG4gIH07XG5cbiAgZGV2Q29uc29sZS5jb21tYW5kc1sncGxheSddID0gZnVuY3Rpb24oYXJncykge1xuICAgIHZhciBmcmFtZVJhdGUgPSBhcmdzLl9bMF0gfHwgNDtcblxuICAgIGVkaXRvci5mcmFtZVJhdGUgPSBmcmFtZVJhdGU7XG4gICAgZWRpdG9yLnBsYXkoKTtcbiAgfTtcblxuICBkZXZDb25zb2xlLmNvbW1hbmRzWydzdG9wJ10gPSBmdW5jdGlvbihhcmdzKSB7XG4gICAgZWRpdG9yLnN0b3AoKTtcbiAgfTtcblxuICBkZXZDb25zb2xlLmNvbW1hbmRzWydzZXQnXSA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICB2YXIga2V5ID0gYXJncy5fWzBdO1xuICAgIHZhciB2YWx1ZSA9IGFyZ3MuX1sxXTtcblxuICAgIGlmIChlZGl0b3Jba2V5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2tleSBub3QgZm91bmQ6ICcgKyBrZXkpO1xuICAgIH1cblxuICAgIGVkaXRvcltrZXldID0gdmFsdWU7XG4gIH07XG5cbiAgZGV2Q29uc29sZS5jb21tYW5kc1snZXhwb3J0J10gPSBmdW5jdGlvbihhcmdzKSB7XG4gICAgdmFyIG5hbWUgPSBhcmdzLl9bMF07XG4gICAgdmFyIHNhdmVzO1xuICAgIHRyeSB7XG4gICAgICBzYXZlcyA9IEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKCdiX3NhdmVzJykgfHwge30pO1xuICAgICAgaWYgKHNhdmVzW25hbWVdID09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzYXZlIG5vdCBmb3VuZCBmb3IgbmFtZTogJyArIG5hbWUpO1xuICAgICAgfVxuICAgICAgd2luZG93LnByb21wdCgnY29weSBhbmQgcGFzdGUnLCBKU09OLnN0cmluZ2lmeShzYXZlc1tuYW1lXSkpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfTtcblxuICBkZXZDb25zb2xlLmNvbW1hbmRzWydyZXNldCddID0gZnVuY3Rpb24oYXJncykge1xuICAgIGlmIChhcmdzLmYgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdwbGVhc2UgcmVzZXQgLWYgdG8gY29uZmlybScpO1xuICAgIH1cblxuICAgIGlmIChhcmdzLmYpIHtcbiAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYl9zYXZlcycsICd7fScpO1xuICAgIH1cbiAgfTtcblxuICBkZXZDb25zb2xlLmNvbW1hbmRzWydtaXJyb3InXSA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICBpZiAoYXJncy5fLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdwbGVhc2Ugc3BlY2lmeSB4IHkgeiBvciBub25lJyk7XG4gICAgfVxuXG4gICAgaWYgKGFyZ3MuXy5sZW5ndGggPT09IDEpIHtcbiAgICAgIGlmIChhcmdzLl9bMF0gPT09ICdub25lJykge1xuICAgICAgICBlZGl0b3IucmVmbGVjdFggPSBlZGl0b3IucmVmbGVjdFkgPSBlZGl0b3IucmVmbGVjdFogPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBlZGl0b3IucmVmbGVjdFggPSBlZGl0b3IucmVmbGVjdFkgPSBlZGl0b3IucmVmbGVjdFogPSBmYWxzZTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MuXy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGFyZyA9IGFyZ3MuX1tpXTtcbiAgICAgIGlmIChhcmcgPT09ICd4Jykge1xuICAgICAgICBlZGl0b3IucmVmbGVjdFggPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChhcmcgPT09ICd5Jykge1xuICAgICAgICBlZGl0b3IucmVmbGVjdFkgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChhcmcgPT09ICd6Jykge1xuICAgICAgICBlZGl0b3IucmVmbGVjdFogPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bmtub3duIG9wdGlvbjogJyArIGFyZyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGRldkNvbnNvbGUuY29tbWFuZHNbJ3NjcmVlbiddID0gZnVuY3Rpb24oYXJncykge1xuICAgIGVkaXRvci5zY3JlZW5zaG90KCk7XG4gIH07XG59IiwidmFyIFBlblRvb2wgPSByZXF1aXJlKCcuL3Rvb2xzL3BlbnRvb2wnKTtcbnZhciBTZWxlY3RUb29sID0gcmVxdWlyZSgnLi90b29scy9zZWxlY3R0b29sJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBwZW46IGZ1bmN0aW9uKGVkaXRvcikge1xuICAgIHJldHVybiBuZXcgUGVuVG9vbChlZGl0b3IpO1xuICB9LFxuICBzZWxlY3Q6IGZ1bmN0aW9uKGVkaXRvcikge1xuICAgIHJldHVybiBuZXcgU2VsZWN0VG9vbChlZGl0b3IpO1xuICB9XG59OyIsInZhciBTZXRDb21tYW5kID0gcmVxdWlyZSgnLi4vY29tbWFuZHMvc2V0Y29tbWFuZCcpO1xuXG52YXIgUGVuVG9vbCA9IGZ1bmN0aW9uKGVkaXRvcikge1xuXG4gIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xuXG4gIHRoaXMuY2FtZXJhID0gdGhpcy5lZGl0b3IuY2FtZXJhO1xuXG4gIHRoaXMuaW5wdXQgPSB0aGlzLmVkaXRvci5pbnB1dDtcblxuICB0aGlzLmJsb2NrcyA9IHRoaXMuZWRpdG9yLmJsb2NrcztcblxuICB0aGlzLm9iamVjdCA9IHRoaXMuZWRpdG9yLm9iamVjdDtcblxuICB0aGlzLm9ialNoYWRvdyA9IG51bGw7XG5cbiAgdGhpcy5vYmpTaGFkb3dOZWVkc1VwZGF0ZSA9IGZhbHNlO1xuXG4gIHRoaXMub2JqSGlnaGxpZ2h0ID0gbnVsbDtcblxuICB0aGlzLnNuID0gMC4wMDAxO1xuXG4gIHRoaXMubGFzdE1vdXNlID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcblxuICB0aGlzLm1vdXNlU2FtcGxlSW50ZXJ2YWwgPSA0O1xufTtcblxuUGVuVG9vbC5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY29vcmQgPSB0aGlzLmdldENvb3JkVG9BZGQodGhpcy5pbnB1dC5tb3VzZSk7XG5cbiAgaWYgKHRoaXMuaW5wdXQubW91c2VEb3duKCkgJiYgY29vcmQgIT0gbnVsbCkge1xuICAgIHRoaXMuZWRpdG9yLnNldExvY2tDYW1lcmEodHJ1ZSk7XG4gIH1cblxuICBpZiAodGhpcy5pbnB1dC5tb3VzZVVwKCkpIHtcbiAgICB0aGlzLmVkaXRvci5zZXRMb2NrQ2FtZXJhKGZhbHNlKTtcbiAgfVxuXG4gIGlmIChjb29yZCAhPSBudWxsKSB7XG4gICAgdGhpcy51cGRhdGVIaWdobGlnaHQoY29vcmQpO1xuICB9XG5cbiAgaWYgKHRoaXMuaW5wdXQubW91c2VEb3duKCkgfHwgdGhpcy5pbnB1dC5tb3VzZVVwKCkgfHwgdGhpcy5vYmpTaGFkb3dOZWVkc1VwZGF0ZSkge1xuICAgIHRoaXMudXBkYXRlT2JqU2hhZG93KCk7XG4gICAgdGhpcy5vYmpTaGFkb3dOZWVkc1VwZGF0ZSA9IGZhbHNlO1xuICB9XG5cbiAgaWYgKHRoaXMuaW5wdXQubW91c2VEb3duKDApKSB7XG4gICAgdmFyIHNlbGVjdGVkSW5kZXggPSB0aGlzLmJsb2Nrcy5nZXRPckFkZENvbG9ySW5kZXgodGhpcy5lZGl0b3Iuc2VsZWN0ZWRDb2xvcik7XG5cbiAgICB2YXIgY29vcmQgPSB0aGlzLmdldENvb3JkVG9BZGQodGhpcy5pbnB1dC5tb3VzZSk7XG4gICAgaWYgKCEhY29vcmQpIHtcbiAgICAgIGlmICh0aGlzLmJsb2Nrcy5nZXRBdENvb3JkKGNvb3JkKSAhPT0gc2VsZWN0ZWRJbmRleCkge1xuICAgICAgICB0aGlzLmVkaXRvci5ydW5Db21tYW5kKG5ldyBTZXRDb21tYW5kKHRoaXMuYmxvY2tzLCB0aGlzLnJlZmxlY3RDb29yZHMoW2Nvb3JkXSksIHNlbGVjdGVkSW5kZXgpKTtcbiAgICAgICAgdGhpcy5vYmpTaGFkb3dOZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKHRoaXMuaW5wdXQubW91c2VEb3duKDIpKSB7XG4gICAgdmFyIHNlbGVjdGVkSW5kZXggPSB0aGlzLmJsb2Nrcy5nZXRPckFkZENvbG9ySW5kZXgodGhpcy5lZGl0b3Iuc2VsZWN0ZWRDb2xvcik7XG5cbiAgICB2YXIgY29vcmQgPSB0aGlzLmdldENvb3JkVG9SZW1vdmUodGhpcy5pbnB1dC5tb3VzZSk7XG4gICAgaWYgKCEhY29vcmQpIHtcbiAgICAgIGlmICghIXRoaXMuYmxvY2tzLmdldEF0Q29vcmQoY29vcmQpKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yLnJ1bkNvbW1hbmQobmV3IFNldENvbW1hbmQodGhpcy5ibG9ja3MsIHRoaXMucmVmbGVjdENvb3JkcyhbY29vcmRdKSwgMCkpO1xuICAgICAgICB0aGlzLm9ialNoYWRvd05lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAodGhpcy5pbnB1dC5tb3VzZUhvbGQoMCkgJiYgdGhpcy5lZGl0b3IubG9ja0NhbWVyYSAmJiB0aGlzLmlucHV0Lm1vdXNlTW92ZSgpKSB7XG4gICAgdmFyIHNlbGVjdGVkSW5kZXggPSB0aGlzLmJsb2Nrcy5nZXRPckFkZENvbG9ySW5kZXgodGhpcy5lZGl0b3Iuc2VsZWN0ZWRDb2xvcik7XG5cbiAgICB2YXIgcG9pbnRzID0gdGhpcy5nZXRNb3VzZVBvaW50cyh0aGlzLmxhc3RNb3VzZSwgdGhpcy5pbnB1dC5tb3VzZSwgdGhpcy5tb3VzZVNhbXBsZUludGVydmFsKTtcbiAgICB2YXIgY29vcmRzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjb29yZCA9IHRoaXMuZ2V0Q29vcmRUb0FkZChwb2ludHNbaV0pO1xuICAgICAgaWYgKCEhY29vcmQpIHtcbiAgICAgICAgaWYgKHRoaXMuYmxvY2tzLmdldEF0Q29vcmQoY29vcmQpICE9PSBzZWxlY3RlZEluZGV4KSB7XG4gICAgICAgICAgY29vcmRzLnB1c2goY29vcmQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29vcmRzID0gdW5pcXVlQ29vcmRzKGNvb3Jkcyk7XG4gICAgaWYgKGNvb3Jkcy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLmVkaXRvci5ydW5Db21tYW5kKG5ldyBTZXRDb21tYW5kKHRoaXMuYmxvY2tzLCB0aGlzLnJlZmxlY3RDb29yZHMoY29vcmRzKSwgc2VsZWN0ZWRJbmRleCkpO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0aGlzLmlucHV0Lm1vdXNlSG9sZCgyKSAmJiB0aGlzLmVkaXRvci5sb2NrQ2FtZXJhICYmIHRoaXMuaW5wdXQubW91c2VNb3ZlKCkpIHtcbiAgICB2YXIgc2VsZWN0ZWRJbmRleCA9IHRoaXMuYmxvY2tzLmdldE9yQWRkQ29sb3JJbmRleCh0aGlzLmVkaXRvci5zZWxlY3RlZENvbG9yKTtcblxuICAgIHZhciBwb2ludHMgPSB0aGlzLmdldE1vdXNlUG9pbnRzKHRoaXMubGFzdE1vdXNlLCB0aGlzLmlucHV0Lm1vdXNlLCB0aGlzLm1vdXNlU2FtcGxlSW50ZXJ2YWwpO1xuICAgIHZhciBjb29yZHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNvb3JkID0gdGhpcy5nZXRDb29yZFRvUmVtb3ZlKHBvaW50c1tpXSwgdGhpcy5zbik7XG4gICAgICBpZiAoISFjb29yZCkge1xuICAgICAgICBpZiAoISF0aGlzLmJsb2Nrcy5nZXRBdENvb3JkKGNvb3JkKSkge1xuICAgICAgICAgIGNvb3Jkcy5wdXNoKGNvb3JkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvb3JkcyA9IHVuaXF1ZUNvb3Jkcyhjb29yZHMpO1xuICAgIGlmIChjb29yZHMubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5lZGl0b3IucnVuQ29tbWFuZChuZXcgU2V0Q29tbWFuZCh0aGlzLmJsb2NrcywgdGhpcy5yZWZsZWN0Q29vcmRzKGNvb3JkcyksIDApKTtcbiAgICB9XG4gIH1cblxuICB0aGlzLmxhc3RNb3VzZSA9IHRoaXMuaW5wdXQubW91c2UuY2xvbmUoKTtcbn07XG5cblBlblRvb2wucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5vYmplY3QucmVtb3ZlKHRoaXMub2JqSGlnaGxpZ2h0KTtcbiAgdGhpcy5lZGl0b3Iuc2V0TG9ja0NhbWVyYShmYWxzZSk7XG59O1xuXG5QZW5Ub29sLnByb3RvdHlwZS5nZXRDb29yZFRvQWRkID0gZnVuY3Rpb24ocG9pbnQpIHtcbiAgdmFyIG9iamVjdHMgPSBbXTtcbiAgaWYgKHRoaXMub2JqU2hhZG93ICE9IG51bGwpIG9iamVjdHMucHVzaCh0aGlzLm9ialNoYWRvdyk7XG4gIGlmICh0aGlzLmVkaXRvci5vYmpHcm91bmQgIT0gbnVsbCkgb2JqZWN0cy5wdXNoKHRoaXMuZWRpdG9yLm9iakdyb3VuZCk7XG4gIHJldHVybiB0aGlzLmdldENvb3JkKG9iamVjdHMsIHBvaW50LCAtdGhpcy5zbik7XG59O1xuXG5QZW5Ub29sLnByb3RvdHlwZS5nZXRDb29yZFRvUmVtb3ZlID0gZnVuY3Rpb24ocG9pbnQpIHtcbiAgdmFyIG9iamVjdHMgPSBbXTtcbiAgaWYgKHRoaXMub2JqU2hhZG93ICE9IG51bGwpIG9iamVjdHMucHVzaCh0aGlzLm9ialNoYWRvdyk7XG4gIHJldHVybiB0aGlzLmdldENvb3JkKG9iamVjdHMsIHBvaW50LCB0aGlzLnNuKTtcbn07XG5cblBlblRvb2wucHJvdG90eXBlLmdldENvb3JkID0gZnVuY3Rpb24ob2JqZWN0cywgYXRQb2ludCwgZGVsdGEpIHtcbiAgdmFyIHZpZXdwb3J0ID0gdGhpcy5pbnB1dC5zY3JlZW5Ub1ZpZXdwb3J0KGF0UG9pbnQpO1xuICB2YXIgcmF5Y2FzdGVyID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xuICByYXljYXN0ZXIuc2V0RnJvbUNhbWVyYSh2aWV3cG9ydCwgdGhpcy5jYW1lcmEpO1xuICB2YXIgaW50ZXJzZWN0cyA9IHJheWNhc3Rlci5pbnRlcnNlY3RPYmplY3RzKG9iamVjdHMsIHRydWUpO1xuXG4gIGlmIChpbnRlcnNlY3RzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICB2YXIgaW50ZXJzZWN0ID0gaW50ZXJzZWN0c1swXTtcblxuICB2YXIgcG9pbnQgPSBpbnRlcnNlY3QucG9pbnQ7XG4gIHZhciBkaWZmID0gcG9pbnQuY2xvbmUoKS5zdWIodGhpcy5jYW1lcmEucG9zaXRpb24pO1xuICBkaWZmID0gZGlmZi5zZXRMZW5ndGgoZGlmZi5sZW5ndGgoKSArIGRlbHRhIHx8IDApO1xuICBwb2ludCA9IHRoaXMuY2FtZXJhLnBvc2l0aW9uLmNsb25lKCkuYWRkKGRpZmYpO1xuXG4gIHZhciBsb2NhbFBvaW50ID0gdGhpcy5ibG9ja3Mub2JqLndvcmxkVG9Mb2NhbChwb2ludCk7XG4gIHZhciBjb29yZCA9IHRoaXMuYmxvY2tzLnBvaW50VG9Db29yZChsb2NhbFBvaW50KTtcbiAgY29vcmQgPSBuZXcgVEhSRUUuVmVjdG9yMyhcbiAgICBNYXRoLnJvdW5kKGNvb3JkLngpLFxuICAgIE1hdGgucm91bmQoY29vcmQueSksXG4gICAgTWF0aC5yb3VuZChjb29yZC56KVxuICApO1xuXG4gIHJldHVybiBjb29yZDtcbn07XG5cbi8vIFJlZmxlY3QgY29vcmRzIHdpdGggZWRpdG9yIHNldHRpbmdzXG5QZW5Ub29sLnByb3RvdHlwZS5yZWZsZWN0Q29vcmRzID0gZnVuY3Rpb24oY29vcmRzKSB7XG4gIGlmICghdGhpcy5lZGl0b3IucmVmbGVjdFggJiYgIXRoaXMuZWRpdG9yLnJlZmxlY3RZICYmICF0aGlzLmVkaXRvci5yZWZsZWN0Wikge1xuICAgIHJldHVybiBjb29yZHM7XG4gIH1cblxuICB2YXIgZGltID0gdGhpcy5ibG9ja3MuZGltO1xuICB2YXIgcGl2b3QgPSBbXG4gICAgTWF0aC5yb3VuZCgoZGltWzBdIC0gMSkgLyAyKSxcbiAgICBNYXRoLnJvdW5kKChkaW1bMV0gLSAxKSAvIDIpLFxuICAgIE1hdGgucm91bmQoKGRpbVsyXSAtIDEpIC8gMilcbiAgXTtcblxuICBpZiAodGhpcy5lZGl0b3IucmVmbGVjdFgpIHtcbiAgICB2YXIgcmVmbGVjdGVkID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciByID0gY29vcmRzW2ldLmNsb25lKCk7XG4gICAgICByLnggPSBwaXZvdFswXSArIHBpdm90WzBdIC0gci54O1xuICAgICAgcmVmbGVjdGVkLnB1c2gocik7XG4gICAgfVxuICAgIGNvb3JkcyA9IGNvb3Jkcy5jb25jYXQocmVmbGVjdGVkKTtcbiAgfVxuXG4gIGlmICh0aGlzLmVkaXRvci5yZWZsZWN0WSkge1xuICAgIHZhciByZWZsZWN0ZWQgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHIgPSBjb29yZHNbaV0uY2xvbmUoKTtcbiAgICAgIHIueSA9IHBpdm90WzFdICsgcGl2b3RbMV0gLSByLnk7XG4gICAgICByZWZsZWN0ZWQucHVzaChyKTtcbiAgICB9XG4gICAgY29vcmRzID0gY29vcmRzLmNvbmNhdChyZWZsZWN0ZWQpO1xuICB9XG5cbiAgaWYgKHRoaXMuZWRpdG9yLnJlZmxlY3RaKSB7XG4gICAgdmFyIHJlZmxlY3RlZCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29vcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgciA9IGNvb3Jkc1tpXS5jbG9uZSgpO1xuICAgICAgci56ID0gcGl2b3RbMl0gKyBwaXZvdFsyXSAtIHIuejtcbiAgICAgIHJlZmxlY3RlZC5wdXNoKHIpO1xuICAgIH1cbiAgICBjb29yZHMgPSBjb29yZHMuY29uY2F0KHJlZmxlY3RlZCk7XG4gIH1cblxuICByZXR1cm4gY29vcmRzO1xufTtcblxuUGVuVG9vbC5wcm90b3R5cGUuZ2V0TW91c2VQb2ludHMgPSBmdW5jdGlvbihmcm9tLCB0bywgbWF4RGlzKSB7XG4gIHZhciBkaXN0YW5jZSA9IG5ldyBUSFJFRS5WZWN0b3IyKCkuc3ViVmVjdG9ycyh0bywgZnJvbSkubGVuZ3RoKCk7XG5cbiAgdmFyIGludGVydmFsID0gTWF0aC5jZWlsKGRpc3RhbmNlIC8gbWF4RGlzKTtcbiAgdmFyIHN0ZXAgPSBuZXcgVEhSRUUuVmVjdG9yMigpLnN1YlZlY3RvcnModG8sIGZyb20pLnNldExlbmd0aChkaXN0YW5jZSAvIGludGVydmFsKTtcblxuICB2YXIgbGlzdCA9IFtdO1xuICB2YXIgc3RhcnQgPSBmcm9tLmNsb25lKCk7XG4gIGxpc3QucHVzaChzdGFydCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgaW50ZXJ2YWw7IGkrKykge1xuICAgIHN0YXJ0LmFkZChzdGVwKTtcbiAgICBsaXN0LnB1c2goc3RhcnQuY2xvbmUoKSk7XG4gIH1cbiAgcmV0dXJuIGxpc3Q7XG59O1xuXG5QZW5Ub29sLnByb3RvdHlwZS51cGRhdGVPYmpTaGFkb3cgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5vYmpTaGFkb3cgPSB0aGlzLmVkaXRvci5ibG9ja3Mub2JqLmNsb25lKCk7XG4gIHRoaXMub2JqU2hhZG93LnVwZGF0ZU1hdHJpeFdvcmxkKCk7XG59O1xuXG5cblBlblRvb2wucHJvdG90eXBlLnVwZGF0ZUhpZ2hsaWdodCA9IGZ1bmN0aW9uKGNvb3JkKSB7XG4gIGlmICh0aGlzLm9iakhpZ2hsaWdodCA9PSBudWxsKSB7XG4gICAgdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkJveEdlb21ldHJ5KDEsIDEsIDEpO1xuICAgIHZhciBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCgpO1xuICAgIHZhciBtZXNoID0gbmV3IFRIUkVFLk1lc2goZ2VvbWV0cnksIG1hdGVyaWFsKTtcbiAgICB2YXIgd2lyZWZyYW1lID0gbmV3IFRIUkVFLkVkZ2VzSGVscGVyKG1lc2gsIDB4ZmZmZmZmKTtcbiAgICB0aGlzLm9iakhpZ2hsaWdodCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICAgIHRoaXMub2JqSGlnaGxpZ2h0LmFkZCh3aXJlZnJhbWUpO1xuICAgIHRoaXMub2JqZWN0LmFkZCh0aGlzLm9iakhpZ2hsaWdodCk7XG4gIH1cblxuICBpZiAoY29vcmQgPT0gbnVsbCkge1xuICAgIHRoaXMub2JqSGlnaGxpZ2h0LnZpc2libGUgPSBmYWxzZTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb29yZCA9IGNvb3JkLmNsb25lKCkuYWRkKG5ldyBUSFJFRS5WZWN0b3IzKDAuNSwgMC41LCAwLjUpKTtcbiAgdGhpcy5vYmpIaWdobGlnaHQudmlzaWJsZSA9IHRydWU7XG4gIHZhciBsb2NhbFBvaW50ID0gdGhpcy5ibG9ja3MuY29vcmRUb1BvaW50KGNvb3JkKTtcbiAgdmFyIHdvcmxkUG9pbnQgPSB0aGlzLmJsb2Nrcy5vYmoubG9jYWxUb1dvcmxkKGxvY2FsUG9pbnQpO1xuICB0aGlzLm9iakhpZ2hsaWdodC5wb3NpdGlvbi5jb3B5KHdvcmxkUG9pbnQpO1xufTtcblxuZnVuY3Rpb24gdW5pcXVlQ29vcmRzKGNvb3Jkcykge1xuICB2YXIgbWFwID0ge307XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY29vcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgbWFwW2Nvb3Jkc1tpXS50b0FycmF5KCkuam9pbignLCcpXSA9IGNvb3Jkc1tpXTtcbiAgfVxuICB2YXIgbGlzdCA9IFtdO1xuICBmb3IgKHZhciBpZCBpbiBtYXApIHtcbiAgICBsaXN0LnB1c2gobWFwW2lkXSk7XG4gIH1cbiAgcmV0dXJuIGxpc3Q7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBlblRvb2w7IiwidmFyIGluc2lkZSA9IHJlcXVpcmUoJ3BvaW50LWluLXBvbHlnb24nKTtcbnZhciBTZWxlY3RDb21tYW5kID0gcmVxdWlyZSgnLi4vY29tbWFuZHMvc2VsZWN0Y29tbWFuZCcpO1xuXG52YXIgU2VsZWN0VG9vbCA9IGZ1bmN0aW9uKGVkaXRvcikge1xuICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcbiAgdGhpcy5pbnB1dCA9IHRoaXMuZWRpdG9yLmlucHV0O1xuICB0aGlzLmJsb2NrcyA9IHRoaXMuZWRpdG9yLmJsb2NrcztcbiAgdGhpcy5jYW1lcmEgPSB0aGlzLmVkaXRvci5jYW1lcmE7XG5cbiAgdGhpcy5kaXZTZWxlY3Rpb25Cb3ggPSBudWxsO1xuXG4gIHRoaXMuY2FudmFzID0gZWRpdG9yLmNhbnZhcztcbiAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICB0aGlzLnBvaW50cyA9IFtdO1xuICB0aGlzLm1pbkRpc3RhbmNlID0gMjtcbn07XG5cblNlbGVjdFRvb2wucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5jb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcblxuICBpZiAodGhpcy5pbnB1dC5tb3VzZUhvbGQoMCkpIHtcbiAgICB0aGlzLmVkaXRvci5zZXRMb2NrQ2FtZXJhKHRydWUpO1xuICAgIHZhciBtb3VzZSA9IHRoaXMuaW5wdXQubW91c2UuY2xvbmUoKTtcbiAgICBpZiAodGhpcy5wb2ludHMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLnBvaW50cy5wdXNoKG1vdXNlLnRvQXJyYXkoKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBsYXN0TW91c2UgPSBuZXcgVEhSRUUuVmVjdG9yMigpLmZyb21BcnJheSh0aGlzLnBvaW50c1t0aGlzLnBvaW50cy5sZW5ndGggLSAxXSk7XG4gICAgICB2YXIgZGlzdGFuY2UgPSBsYXN0TW91c2UuZGlzdGFuY2VUbyhtb3VzZSk7XG4gICAgICBpZiAoZGlzdGFuY2UgPiB0aGlzLm1pbkRpc3RhbmNlKSB7XG4gICAgICAgIHRoaXMucG9pbnRzLnB1c2gobW91c2UudG9BcnJheSgpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKHRoaXMucG9pbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMudXBkYXRlU2VsZWN0aW9uKCk7XG4gICAgfVxuICAgIHRoaXMuZWRpdG9yLnNldExvY2tDYW1lcmEoZmFsc2UpO1xuICAgIHRoaXMucG9pbnRzID0gW107XG4gIH1cblxuICB0aGlzLmRyYXdMYXNzbygpO1xufTtcblxuU2VsZWN0VG9vbC5wcm90b3R5cGUuZHJhd0xhc3NvID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLnBvaW50cy5sZW5ndGggPCAyKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhpcy5jb250ZXh0LmxpbmVXaWR0aCA9ICcxJztcbiAgdGhpcy5jb250ZXh0LnNldExpbmVEYXNoKFszXSk7XG4gIHRoaXMuY29udGV4dC5zdHJva2VTdHlsZSA9ICcjZmZmZmZmJztcbiAgdGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucG9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHBvaW50ID0gdGhpcy5wb2ludHNbaV07XG4gICAgaWYgKGkgPT09IDApIHtcbiAgICAgIHRoaXMuY29udGV4dC5tb3ZlVG8ocG9pbnRbMF0sIHBvaW50WzFdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jb250ZXh0LmxpbmVUbyhwb2ludFswXSwgcG9pbnRbMV0pO1xuICAgIH1cbiAgfVxuICB0aGlzLmNvbnRleHQuc3Ryb2tlKCk7XG59O1xuXG5TZWxlY3RUb29sLnByb3RvdHlwZS51cGRhdGVTZWxlY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGJsb2NrcyA9IHRoaXMuYmxvY2tzO1xuICB2YXIgY2FtZXJhID0gdGhpcy5jYW1lcmE7XG4gIHZhciBjYW52YXMgPSB0aGlzLmNhbnZhcztcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHZhciBzY3JlZW5Qb2ludHMgPSBbXTtcbiAgdGhpcy5ibG9ja3MudmlzaXQoZnVuY3Rpb24oaSwgaiwgaywgYikge1xuICAgIHZhciBjb29yZCA9IG5ldyBUSFJFRS5WZWN0b3IzKGkgKyAwLjUsIGogKyAwLjUsIGsgKyAwLjUpO1xuICAgIHZhciBsb2NhbFBvaW50ID0gYmxvY2tzLmNvb3JkVG9Qb2ludChjb29yZCk7XG4gICAgdmFyIHdvcmxkUG9pbnQgPSBibG9ja3Mub2JqLmxvY2FsVG9Xb3JsZChsb2NhbFBvaW50KTtcbiAgICB2YXIgdmVjdG9yID0gd29ybGRQb2ludC5wcm9qZWN0KGNhbWVyYSk7XG4gICAgdmVjdG9yLnggPSBNYXRoLnJvdW5kKCh2ZWN0b3IueCArIDEpICogY2FudmFzLndpZHRoIC8gMik7XG4gICAgdmVjdG9yLnkgPSBNYXRoLnJvdW5kKCgtdmVjdG9yLnkgKyAxKSAqIGNhbnZhcy5oZWlnaHQgLyAyKTtcblxuICAgIHNjcmVlblBvaW50cy5wdXNoKHtcbiAgICAgIHNjcmVlbjogW3ZlY3Rvci54LCB2ZWN0b3IueV0sXG4gICAgICBjb29yZDogbmV3IFRIUkVFLlZlY3RvcjMoaSwgaiwgaylcbiAgICB9KTtcbiAgfSk7XG5cbiAgdmFyIHNlbGVjdGlvbnMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY3JlZW5Qb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgc2NyZWVuID0gc2NyZWVuUG9pbnRzW2ldLnNjcmVlbjtcbiAgICAvLyBUZXN0IHBvaW50IGluIHBvbHlnb25cbiAgICBpZiAoaW5zaWRlKHNjcmVlbiwgdGhpcy5wb2ludHMpKSB7XG4gICAgICBzZWxlY3Rpb25zLnB1c2goc2NyZWVuUG9pbnRzW2ldLmNvb3JkKTtcbiAgICB9XG4gIH1cblxuICB0aGlzLmVkaXRvci5ydW5Db21tYW5kKG5ldyBTZWxlY3RDb21tYW5kKHRoaXMuZWRpdG9yLCBzZWxlY3Rpb25zKSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbGVjdFRvb2w7IiwidmFyIFRIUkVFID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ1RIUkVFJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydUSFJFRSddIDogbnVsbCk7XG52YXIgYiA9IHJlcXVpcmUoJy4vY29yZS9iJyk7XG52YXIgc3RhdHMgPSByZXF1aXJlKCcuL3NlcnZpY2VzL3N0YXRzJyk7XG5cbnZhciBhcHAgPSBiKCdtYWluJyk7XG5cbnZhciBzY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xudmFyIGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSg2MCwgd2luZG93LmlubmVyV2lkdGggLyB3aW5kb3cuaW5uZXJIZWlnaHQsIDAuMSwgMTAwMCk7XG5cbi8vIFJlZ3NpdGVyIHZhbHVlc1xuYXBwLnZhbHVlKCdhcHAnLCBhcHApO1xuYXBwLnZhbHVlKCdzY2VuZScsIHNjZW5lKTtcbmFwcC52YWx1ZSgnY2FtZXJhJywgY2FtZXJhKTtcbmFwcC52YWx1ZSgnY29uZmlnJywgcmVxdWlyZSgnLi9kYXRhL2NvbmZpZy5qc29uJykpO1xuYXBwLnZhbHVlKCdwYWxldHRlJywgcmVxdWlyZSgnLi9kYXRhL3BhbGV0dGUuanNvbicpKTtcbmFwcC52YWx1ZSgnbWF0ZXJpYWxzJywgcmVxdWlyZSgnLi9zZXJ2aWNlcy9tYXRlcmlhbHMnKSk7XG5hcHAudmFsdWUoJ2NhbnZhcycsIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW52YXMnKSk7XG5cbnZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29udGFpbmVyJyk7XG5hcHAudXNlKHJlcXVpcmUoJy4vc3lzdGVtcy9yZW5kZXJlcicpKHNjZW5lLCBjYW1lcmEsIGNvbnRhaW5lcikpO1xuYXBwLnVzZSgnaW5wdXQnLCByZXF1aXJlKCcuL3N5c3RlbXMvaW5wdXQnKShjb250YWluZXIpKTtcbmFwcC51c2UocmVxdWlyZSgnLi92b3hlbC92b3hlbCcpKCkpO1xuXG52YXIgZGV2Q29uc29sZSA9IHJlcXVpcmUoJy4vc2VydmljZXMvZGV2Y29uc29sZScpKHtcbiAgb25ibHVyOiBmdW5jdGlvbigpIHtcbiAgICBjb250YWluZXIuZm9jdXMoKTtcbiAgfVxufSk7XG5hcHAudmFsdWUoJ2RldkNvbnNvbGUnLCBkZXZDb25zb2xlKTtcblxuc3RhdHMoYXBwKTtcblxuLy8gQXR0YWNoIGNhbWVyYSBjb250cm9sXG5mdW5jdGlvbiBsb2FkR2FtZSgpIHtcbiAgYXBwLmF0dGFjaChjYW1lcmEsIHJlcXVpcmUoJy4vY29tcG9uZW50cy9wbGF5ZXJDYW1lcmEnKSk7XG5cbiAgYXBwLmxvYWRBc3NlbWJseShyZXF1aXJlKCcuL2Fzc2VtYmxpZXMvYWdyb3VuZCcpKTtcblxuICB2YXIgcGxheWVyID0gYXBwLmxvYWRBc3NlbWJseShyZXF1aXJlKCcuL2Fzc2VtYmxpZXMvYXBsYXllcicpKTtcbiAgYXBwLnZhbHVlKCdwbGF5ZXInLCBwbGF5ZXIpO1xufTtcblxuZnVuY3Rpb24gbG9hZEVkaXRvcigpIHtcbiAgYXBwLmxvYWRBc3NlbWJseShyZXF1aXJlKCcuL2Fzc2VtYmxpZXMvYWVkaXRvcicpKTtcbn1cblxubG9hZEVkaXRvcigpO1xuXG5hcHAuc3RhcnQoKTtcblxudmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW52YXMnKTtcbmFwcC5vbignYmVmb3JlVGljaycsIGZ1bmN0aW9uKCkge1xuICBpZiAoY2FudmFzLndpZHRoICE9PSB3aW5kb3cuaW5uZXJXaWR0aCkge1xuICAgIGNhbnZhcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICB9XG4gIGlmIChjYW52YXMuaGVpZ2h0ICE9PSB3aW5kb3cuaW5uZXJIZWlnaHQpIHtcbiAgICBjYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICB9XG59KTsiLCJ2YXIgcGFyc2VBcmdzID0gcmVxdWlyZSgnbWluaW1pc3QnKTtcbnZhciBrZXljb2RlID0gcmVxdWlyZSgna2V5Y29kZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgb3B0cyA9IG9wdHMgfHwge307XG4gIHZhciBvbmZvY3VzID0gb3B0cy5vbmZvY3VzIHx8IG51bGw7XG4gIHZhciBvbmJsdXIgPSBvcHRzLm9uYmx1ciB8fCBudWxsO1xuICB2YXIgY29tbWFuZHMgPSBvcHRzLmNvbW1hbmRzIHx8IHt9O1xuXG4gIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkaXYpO1xuICBkaXYuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICBkaXYuc3R5bGUubGVmdCA9ICcwcHgnO1xuICBkaXYuc3R5bGUudG9wID0gJzBweCc7XG4gIGRpdi5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgZGl2LnN0eWxlLmhlaWdodCA9ICcxMjBweCc7XG4gIGRpdi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAncmdiYSgwLCAwLCAwLCAwLjUpJztcblxuICB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICBpbnB1dC50eXBlID0gJ3RleHQnO1xuICBpbnB1dC5jbGFzc05hbWUgPSAnY29uc29sZS1pbnB1dCc7XG4gIGlucHV0LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgaW5wdXQuc3R5bGUubGVmdCA9ICcwcHgnO1xuICBpbnB1dC5zdHlsZS50b3AgPSAnMHB4JztcbiAgaW5wdXQuc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gIGlucHV0LnN0eWxlLmhlaWdodCA9ICcyMHB4JztcbiAgaW5wdXQuc3R5bGVbJ2JhY2tncm91bmQtY29sb3InXSA9ICd0cmFuc3BhcmVudCc7XG4gIGlucHV0LnN0eWxlWydib3JkZXInXSA9ICcwcHggc29saWQnO1xuICBpbnB1dC5zcGVsbGNoZWNrID0gZmFsc2U7XG4gIGlucHV0LnN0eWxlLmNvbG9yID0gJyNGRkZGRkYnO1xuICBpbnB1dC5zdHlsZS5mb250U2l6ZSA9ICcxNnB4JztcbiAgaW5wdXQuc3R5bGUuZm9udEZhbWlseSA9ICdBcmlhbCc7XG4gIGlucHV0LnN0eWxlLnBhZGRpbmcgPSAnMnB4IDJweCAwcHggMnB4JztcbiAgaW5wdXQudmFsdWUgPSAnPiAnO1xuXG4gIGRpdi5hcHBlbmRDaGlsZChpbnB1dCk7XG5cbiAgdmFyIHRleHRTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICB0ZXh0U3Bhbi5jbGFzc05hbWUgPSAnY29uc29sZS1zcGFuJztcbiAgdGV4dFNwYW4uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICB0ZXh0U3Bhbi5zdHlsZS5sZWZ0ID0gJzBweCc7XG4gIHRleHRTcGFuLnN0eWxlLnRvcCA9ICcyMHB4JztcbiAgdGV4dFNwYW4uc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gIHRleHRTcGFuLnN0eWxlLmhlaWdodCA9ICcxMDBweCc7XG4gIHRleHRTcGFuLnN0eWxlLmNvbG9yID0gJyNGRkZGRkYnO1xuICB0ZXh0U3Bhbi5zdHlsZS5mb250U2l6ZSA9ICcxNnB4JztcbiAgdGV4dFNwYW4uc3R5bGUuZm9udEZhbWlseSA9ICdBcmlhbCc7XG4gIHRleHRTcGFuLnN0eWxlLnBhZGRpbmcgPSAnMHB4IDJweCAycHggMnB4JztcblxuICBkaXYuYXBwZW5kQ2hpbGQodGV4dFNwYW4pO1xuXG4gIC8vIFJlbW92ZSBvdXRsaW5lIG9uIGZvY3VzXG4gIGlucHV0Lm9uZm9jdXMgPSBmdW5jdGlvbigpIHtcbiAgICBpbnB1dC5zdHlsZVsnb3V0bGluZSddID0gJ25vbmUnO1xuICB9O1xuXG4gIGlucHV0Lm9ua2V5cHJlc3MgPSBmdW5jdGlvbihlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgIG9uRW50ZXJQcmVzc2VkKCk7XG4gICAgfVxuICAgIG9uSW5wdXRDaGFuZ2VkKGUpO1xuICB9O1xuXG4gIGlucHV0Lm9ua2V5dXAgPSBmdW5jdGlvbihlKSB7XG4gICAgb25JbnB1dENoYW5nZWQoZSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gb25JbnB1dENoYW5nZWQoZSkge1xuICAgIGlmIChpbnB1dC52YWx1ZS5sZW5ndGggPCAyKSB7XG4gICAgICBpbnB1dC52YWx1ZSA9ICc+ICc7XG4gICAgfVxuICB9O1xuXG4gIHZhciBsaW5lcyA9IFtdO1xuICB2YXIgaGlzdG9yeUxlbmd0aCA9IDEwMDtcbiAgdmFyIG51bWJlck9mTGluZXMgPSA1O1xuXG4gIGZ1bmN0aW9uIG9uRW50ZXJQcmVzc2VkKCkge1xuICAgIHZhciBsaW5lID0gaW5wdXQudmFsdWU7XG4gICAgYWRkTG9nKGxpbmUpO1xuICAgIGxpbmUgPSBsaW5lLnN1YnN0cmluZygyKTtcbiAgICBsaW5lID0gbGluZS50cmltKCk7XG4gICAgdmFyIGluZGV4ID0gbGluZS5pbmRleE9mKCcgJyk7XG4gICAgdmFyIGNvbW1hbmROYW1lID0gaW5kZXggPT09IC0xID8gbGluZSA6IGxpbmUuc3Vic3RyaW5nKDAsIGluZGV4KTtcbiAgICB2YXIgYXJncyA9IGluZGV4ID09PSAtMSA/ICcnIDogbGluZS5zdWJzdHJpbmcoaW5kZXggKyAxKTtcblxuICAgIHZhciBjb21tYW5kID0gY29tbWFuZHNbY29tbWFuZE5hbWVdO1xuICAgIGlmIChjb21tYW5kID09IG51bGwpIHtcbiAgICAgIGFkZEVycm9yKGNvbW1hbmROYW1lICsgJzogY29tbWFuZCBub3QgZm91bmQnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IGNvbW1hbmQocGFyc2VBcmdzKGFyZ3Muc3BsaXQoJyAnKSkpO1xuICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBhZGRMb2cocmVzdWx0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhpZGUoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBhZGRFcnJvcihlcnIpO1xuICAgICAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaW5wdXQudmFsdWUgPSAnJztcbiAgfTtcblxuICBmdW5jdGlvbiBhZGRMb2cobGluZSkge1xuICAgIGFkZExpbmUobGluZSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gYWRkRXJyb3IobGluZSkge1xuICAgIGFkZExpbmUobGluZSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gYWRkTGluZShsaW5lKSB7XG4gICAgbGluZXMucHVzaChsaW5lKTtcbiAgICBpZiAobGluZXMubGVuZ3RoID4gaGlzdG9yeUxlbmd0aCkge1xuICAgICAgbGluZXMucG9wKCk7XG4gICAgfVxuICAgIHVwZGF0ZUxpbmVzKCk7XG4gIH07XG5cbiAgZnVuY3Rpb24gdXBkYXRlTGluZXMoKSB7XG4gICAgdmFyIHRleHQgPSAnJztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bWJlck9mTGluZXM7IGkrKykge1xuICAgICAgdmFyIGxpbmUgPSBsaW5lc1tsaW5lcy5sZW5ndGggLSAxIC0gaV07XG4gICAgICBsaW5lID0gbGluZSB8fCAnJztcbiAgICAgIHRleHQgKz0gbGluZTtcbiAgICAgIHRleHQgKz0gXCI8YnIgLz5cIjtcbiAgICB9XG5cbiAgICB0ZXh0U3Bhbi5pbm5lckhUTUwgPSB0ZXh0O1xuICB9O1xuXG4gIGZ1bmN0aW9uIGhpZGUoKSB7XG4gICAgZGl2LmhpZGRlbiA9IHRydWU7XG4gICAgaW5wdXQuYmx1cigpO1xuICAgIGlmIChvbmJsdXIgIT0gbnVsbCkge1xuICAgICAgb25ibHVyKCk7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIHNob3coKSB7XG4gICAgZGl2LmhpZGRlbiA9IGZhbHNlO1xuICAgIGlucHV0LnZhbHVlID0gaW5wdXQudmFsdWUuc3BsaXQoJ2AnKS5qb2luKCcnKTtcbiAgICBpbnB1dC5mb2N1cygpO1xuICAgIGlmIChvbmZvY3VzICE9IG51bGwpIHtcbiAgICAgIG9uZm9jdXMoKTtcbiAgICB9XG4gIH07XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZnVuY3Rpb24oZSkge1xuICAgIHZhciBrZXkgPSBrZXljb2RlKGUpO1xuICAgIGlmIChrZXkgPT09ICdgJykge1xuICAgICAgaWYgKGRpdi5oaWRkZW4pIHtcbiAgICAgICAgc2hvdygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaGlkZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgLy8gSGlkZGVuIGJ5IGRlZmF1bHRcbiAgZGl2LmhpZGRlbiA9IHRydWU7XG5cbiAgZnVuY3Rpb24gbG9hZENvbW1hbmRzKHZhbHVlKSB7XG4gICAgZm9yICh2YXIgaSBpbiB2YWx1ZSkge1xuICAgICAgY29tbWFuZHNbaV0gPSB2YWx1ZVtpXTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBjb21tYW5kczogY29tbWFuZHMsXG4gICAgbG9hZENvbW1hbmRzOiBsb2FkQ29tbWFuZHNcbiAgfTtcbn07IiwidmFyIFRIUkVFID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ1RIUkVFJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydUSFJFRSddIDogbnVsbCk7XG5cbnZhciB0ZXh0dXJlTG9hZGVyID0gbmV3IFRIUkVFLlRleHR1cmVMb2FkZXIoKTtcblxuZnVuY3Rpb24gbG9hZExhbWJlcnRNYXRlcmlhbChzb3VyY2UpIHtcbiAgdmFyIHRleHR1cmUgPSB0ZXh0dXJlTG9hZGVyLmxvYWQoc291cmNlKTtcbiAgdGV4dHVyZS53cmFwUyA9IFRIUkVFLlJlcGVhdFdyYXBwaW5nO1xuICB0ZXh0dXJlLndyYXBUID0gVEhSRUUuUmVwZWF0V3JhcHBpbmc7XG5cbiAgcmV0dXJuIG5ldyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsKHtcbiAgICBtYXA6IHRleHR1cmVcbiAgfSk7XG59O1xuXG5mdW5jdGlvbiBsb2FkQmFzaWNNYXRlcmlhbChzb3VyY2UpIHtcbiAgdmFyIHRleHR1cmUgPSB0ZXh0dXJlTG9hZGVyLmxvYWQoc291cmNlKTtcbiAgdGV4dHVyZS53cmFwUyA9IFRIUkVFLlJlcGVhdFdyYXBwaW5nO1xuICB0ZXh0dXJlLndyYXBUID0gVEhSRUUuUmVwZWF0V3JhcHBpbmc7XG5cbiAgdGV4dHVyZS5tYWdGaWx0ZXIgPSBUSFJFRS5OZWFyZXN0RmlsdGVyO1xuICBcbiAgcmV0dXJuIG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgbWFwOiB0ZXh0dXJlXG4gIH0pO1xufTtcblxubWF0ZXJpYWxzID0ge1xuICAnMSc6IGxvYWRMYW1iZXJ0TWF0ZXJpYWwoJ2ltYWdlcy8xLnBuZycpLFxuICAncGxhY2Vob2xkZXInOiBsb2FkQmFzaWNNYXRlcmlhbCgnaW1hZ2VzL3BsYWNlaG9sZGVyLnBuZycpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gbWF0ZXJpYWxzOyIsInZhciBTdGF0cyA9IHJlcXVpcmUoJ3N0YXRzLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXBwKSB7XG4gIGFwcC5vbignYmVmb3JlVGljaycsIGZ1bmN0aW9uKCkge1xuICAgIHN0YXRzLmJlZ2luKCk7XG4gIH0pO1xuXG4gIGFwcC5vbignYWZ0ZXJUaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgc3RhdHMuZW5kKCk7XG4gIH0pO1xuXG4gIHZhciBzdGF0cyA9IG5ldyBTdGF0cygpO1xuICBzdGF0cy5kb21FbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgc3RhdHMuZG9tRWxlbWVudC5zdHlsZS5yaWdodCA9ICcwcHgnO1xuICBzdGF0cy5kb21FbGVtZW50LnN0eWxlLmJvdHRvbSA9ICc1MHB4JztcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzdGF0cy5kb21FbGVtZW50KTtcblxuICByZXR1cm4gc3RhdHMuZG9tRWxlbWVudDtcbn07IiwidmFyIGFycmF5VXRpbHMgPSByZXF1aXJlKCcuLi91dGlscy9hcnJheXV0aWxzJyk7XG52YXIga2V5Y29kZSA9IHJlcXVpcmUoJ2tleWNvZGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gIFwidXNlIHN0cmljdFwiO1xuXG4gIHZhciBtb3VzZSA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gIHZhciBtb3VzZWRvd25zID0gW107XG4gIHZhciBtb3VzZXVwcyA9IFtdO1xuICB2YXIgbW91c2Vtb3ZlID0gZmFsc2U7XG4gIHZhciBtb3VzZWhvbGRzID0gW107XG4gIHZhciBrZXlkb3ducyA9IFtdO1xuICB2YXIga2V5dXBzID0gW107XG4gIHZhciBrZXlob2xkcyA9IFtdO1xuICB2YXIgbW91c2Vkb3duVGltZXMgPSB7fTtcbiAgdmFyIGNsaWNrVGltZSA9IDE1MDtcbiAgdmFyIG1vdXNlY2xpY2tzID0gW107XG5cbiAgZWxlbWVudC5mb2N1cygpO1xuXG4gIGZ1bmN0aW9uIG9uTW91c2VNb3ZlKGUpIHtcbiAgICBtb3VzZW1vdmUgPSB0cnVlO1xuICAgIG1vdXNlLnggPSBlLmNsaWVudFg7XG4gICAgbW91c2UueSA9IGUuY2xpZW50WTtcbiAgfTtcblxuICBmdW5jdGlvbiBvbk1vdXNlRG93bihlKSB7XG4gICAgbW91c2Vkb3ducy5wdXNoKGUuYnV0dG9uKTtcbiAgICBtb3VzZWRvd25UaW1lc1tlLmJ1dHRvbl0gPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICBpZiAoIWFycmF5VXRpbHMuaW5jbHVkZXMobW91c2Vob2xkcywgZS5idXR0b24pKSB7XG4gICAgICBtb3VzZWhvbGRzLnB1c2goZS5idXR0b24pO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBvbk1vdXNlVXAoZSkge1xuICAgIGlmICghIW1vdXNlZG93blRpbWVzW2UuYnV0dG9uXSkge1xuICAgICAgdmFyIGRpZmYgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIG1vdXNlZG93blRpbWVzW2UuYnV0dG9uXTtcbiAgICAgIGlmIChkaWZmIDwgY2xpY2tUaW1lKSB7XG4gICAgICAgIG1vdXNlY2xpY2tzLnB1c2goZS5idXR0b24pO1xuICAgICAgfVxuICAgIH1cbiAgICBtb3VzZXVwcy5wdXNoKGUuYnV0dG9uKTtcbiAgICBhcnJheVV0aWxzLnJlbW92ZShtb3VzZWhvbGRzLCBlLmJ1dHRvbik7XG4gIH07XG5cbiAgZnVuY3Rpb24gb25LZXlEb3duKGUpIHtcbiAgICB2YXIga2V5ID0ga2V5Y29kZShlKTtcbiAgICBrZXlkb3ducy5wdXNoKGtleSk7XG4gICAgaWYgKCFhcnJheVV0aWxzLmluY2x1ZGVzKGtleWhvbGRzLCBrZXkpKSB7XG4gICAgICBrZXlob2xkcy5wdXNoKGtleSk7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIG9uS2V5VXAoZSkge1xuICAgIHZhciBrZXkgPSBrZXljb2RlKGUpO1xuICAgIGtleXVwcy5wdXNoKGtleSk7XG4gICAgYXJyYXlVdGlscy5yZW1vdmUoa2V5aG9sZHMsIGtleSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgbW91c2Vkb3ducyA9IFtdO1xuICAgIG1vdXNldXBzID0gW107XG4gICAgbW91c2Vtb3ZlID0gZmFsc2U7XG4gICAga2V5ZG93bnMgPSBbXTtcbiAgICBrZXl1cHMgPSBbXTtcbiAgICBtb3VzZWNsaWNrcyA9IFtdO1xuICB9XG5cbiAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBvbk1vdXNlRG93bik7XG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgb25Nb3VzZU1vdmUpO1xuICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBvbk1vdXNlVXApO1xuICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleURvd24pO1xuICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgb25LZXlVcCk7XG5cbiAgcmV0dXJuIHtcbiAgICBtb3VzZTogbW91c2UsXG5cbiAgICBtb3VzZURvd246IGZ1bmN0aW9uKGJ1dHRvbikge1xuICAgICAgaWYgKGJ1dHRvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBtb3VzZWRvd25zLmxlbmd0aCA+IDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gYXJyYXlVdGlscy5pbmNsdWRlcyhtb3VzZWRvd25zLCBidXR0b24pO1xuICAgIH0sXG5cbiAgICBtb3VzZVVwOiBmdW5jdGlvbihidXR0b24pIHtcbiAgICAgIGlmIChidXR0b24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gbW91c2V1cHMubGVuZ3RoID4gMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcnJheVV0aWxzLmluY2x1ZGVzKG1vdXNldXBzLCBidXR0b24pO1xuICAgIH0sXG5cbiAgICBtb3VzZUhvbGQ6IGZ1bmN0aW9uKGJ1dHRvbikge1xuICAgICAgaWYgKGJ1dHRvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBtb3VzZWhvbGRzLmxlbmd0aCA+IDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gYXJyYXlVdGlscy5pbmNsdWRlcyhtb3VzZWhvbGRzLCBidXR0b24pO1xuICAgIH0sXG5cbiAgICBtb3VzZUNsaWNrOiBmdW5jdGlvbihidXR0b24pIHtcbiAgICAgIGlmIChidXR0b24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gbW91c2VjbGlja3MubGVuZ3RoID4gMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcnJheVV0aWxzLmluY2x1ZGVzKG1vdXNlY2xpY2tzLCBidXR0b24pO1xuICAgIH0sXG5cbiAgICBrZXlEb3duOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4ga2V5ZG93bnMubGVuZ3RoID4gMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcnJheVV0aWxzLmluY2x1ZGVzKGtleWRvd25zLCBrZXkpO1xuICAgIH0sXG5cbiAgICBrZXlVcDogZnVuY3Rpb24oa2V5KSB7XG4gICAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGtleXVwcy5sZW5ndGggPiAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFycmF5VXRpbHMuaW5jbHVkZXMoa2V5dXBzLCBrZXkpO1xuICAgIH0sXG5cbiAgICBrZXlIb2xkOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4ga2V5aG9sZHMubGVuZ3RoID4gMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcnJheVV0aWxzLmluY2x1ZGVzKGtleWhvbGRzLCBrZXkpO1xuICAgIH0sXG5cbiAgICBtb3VzZU1vdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG1vdXNlbW92ZTtcbiAgICB9LFxuXG4gICAgbGF0ZVRpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgY2xlYXIoKTtcbiAgICB9LFxuXG4gICAgc2NyZWVuVG9WaWV3cG9ydDogZnVuY3Rpb24oc2NyZWVuKSB7XG4gICAgICB2YXIgdmlld3BvcnQgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICAgICAgdmlld3BvcnQueCA9IChzY3JlZW4ueCAvIHdpbmRvdy5pbm5lcldpZHRoKSAqIDIgLSAxO1xuICAgICAgdmlld3BvcnQueSA9IC0oc2NyZWVuLnkgLyB3aW5kb3cuaW5uZXJIZWlnaHQpICogMiArIDE7XG4gICAgICByZXR1cm4gdmlld3BvcnQ7XG4gICAgfVxuICB9O1xufTsiLCJ2YXIgU3RhdHMgPSByZXF1aXJlKCdzdGF0cy5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNjZW5lLCBjYW1lcmEsIGNvbnRhaW5lcikge1xuICB2YXIgcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlcigpO1xuICByZW5kZXJlci5zZXRDbGVhckNvbG9yKDB4MzMzMzMzKTtcbiAgcmVuZGVyZXIuc2V0U2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcblxuICBjb250YWluZXIgPSBjb250YWluZXIgfHwgZG9jdW1lbnQuYm9keTtcbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKHJlbmRlcmVyLmRvbUVsZW1lbnQpO1xuXG4gIHZhciByZW5kZXJlciwgY2FtZXJhO1xuICB2YXIgc3Nhb1Bhc3MsIGVmZmVjdENvbXBvc2VyO1xuXG4gIHZhciBzeXN0ZW0gPSB7fTtcbiAgc3lzdGVtLnJlbmRlcmVyID0gcmVuZGVyZXI7XG5cbiAgdmFyIHN0YXRzID0gbmV3IFN0YXRzKCk7XG4gIHN0YXRzLmRvbUVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICBzdGF0cy5kb21FbGVtZW50LnN0eWxlLnJpZ2h0ID0gJzBweCc7XG4gIHN0YXRzLmRvbUVsZW1lbnQuc3R5bGUuYm90dG9tID0gJzBweCc7XG5cbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzdGF0cy5kb21FbGVtZW50KTtcblxuICB2YXIgc3NhbyA9IHRydWU7XG5cbiAgdmFyIGFtYmllbnQgPSBuZXcgVEhSRUUuQW1iaWVudExpZ2h0KG5ldyBUSFJFRS5Db2xvcihcInJnYig2MCUsIDYwJSwgNjAlKVwiKSk7XG4gIHZhciBsaWdodCA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KDB4ZmZmZmZmLCAwLjYpO1xuICBsaWdodC5wb3NpdGlvbi5zZXQoMC44LCAxLCAwLjUpO1xuICBzY2VuZS5hZGQobGlnaHQpO1xuICBzY2VuZS5hZGQoYW1iaWVudCk7XG5cbiAgZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIpO1xuXG4gICAgc3RhdHMuYmVnaW4oKTtcblxuICAgIGlmIChzc2FvKSB7XG4gICAgICAvLyBSZW5kZXIgZGVwdGggaW50byBkZXB0aFJlbmRlclRhcmdldFxuICAgICAgc2NlbmUub3ZlcnJpZGVNYXRlcmlhbCA9IGRlcHRoTWF0ZXJpYWw7XG4gICAgICByZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSwgZGVwdGhSZW5kZXJUYXJnZXQsIHRydWUpO1xuXG4gICAgICAvLyBSZW5kZXIgcmVuZGVyUGFzcyBhbmQgU1NBTyBzaGFkZXJQYXNzXG4gICAgICBzY2VuZS5vdmVycmlkZU1hdGVyaWFsID0gbnVsbDtcbiAgICAgIGVmZmVjdENvbXBvc2VyLnJlbmRlcigpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7XG4gICAgfVxuXG5cbiAgICBzdGF0cy5lbmQoKTtcbiAgfTtcblxuICBmdW5jdGlvbiBvbldpbmRvd1Jlc2l6ZSgpIHtcbiAgICB2YXIgd2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICB2YXIgaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuXG4gICAgY2FtZXJhLmFzcGVjdCA9IHdpZHRoIC8gaGVpZ2h0O1xuICAgIGNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XG4gICAgcmVuZGVyZXIuc2V0U2l6ZSh3aWR0aCwgaGVpZ2h0KTtcblxuICAgIC8vIFJlc2l6ZSByZW5kZXJUYXJnZXRzXG4gICAgc3Nhb1Bhc3MudW5pZm9ybXNbJ3NpemUnXS52YWx1ZS5zZXQod2lkdGgsIGhlaWdodCk7XG5cbiAgICB2YXIgcGl4ZWxSYXRpbyA9IHJlbmRlcmVyLmdldFBpeGVsUmF0aW8oKTtcbiAgICB2YXIgbmV3V2lkdGggPSBNYXRoLmZsb29yKHdpZHRoIC8gcGl4ZWxSYXRpbykgfHwgMTtcbiAgICB2YXIgbmV3SGVpZ2h0ID0gTWF0aC5mbG9vcihoZWlnaHQgLyBwaXhlbFJhdGlvKSB8fCAxO1xuICAgIGRlcHRoUmVuZGVyVGFyZ2V0LnNldFNpemUobmV3V2lkdGgsIG5ld0hlaWdodCk7XG4gICAgZWZmZWN0Q29tcG9zZXIuc2V0U2l6ZShuZXdXaWR0aCwgbmV3SGVpZ2h0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGluaXRQb3N0cHJvY2Vzc2luZygpIHtcblxuICAgIC8vIFNldHVwIHJlbmRlciBwYXNzXG4gICAgdmFyIHJlbmRlclBhc3MgPSBuZXcgVEhSRUUuUmVuZGVyUGFzcyhzY2VuZSwgY2FtZXJhKTtcblxuICAgIC8vIFNldHVwIGRlcHRoIHBhc3NcbiAgICB2YXIgZGVwdGhTaGFkZXIgPSBUSFJFRS5TaGFkZXJMaWJbXCJkZXB0aFJHQkFcIl07XG4gICAgdmFyIGRlcHRoVW5pZm9ybXMgPSBUSFJFRS5Vbmlmb3Jtc1V0aWxzLmNsb25lKGRlcHRoU2hhZGVyLnVuaWZvcm1zKTtcblxuICAgIGRlcHRoTWF0ZXJpYWwgPSBuZXcgVEhSRUUuU2hhZGVyTWF0ZXJpYWwoe1xuICAgICAgZnJhZ21lbnRTaGFkZXI6IGRlcHRoU2hhZGVyLmZyYWdtZW50U2hhZGVyLFxuICAgICAgdmVydGV4U2hhZGVyOiBkZXB0aFNoYWRlci52ZXJ0ZXhTaGFkZXIsXG4gICAgICB1bmlmb3JtczogZGVwdGhVbmlmb3JtcyxcbiAgICAgIGJsZW5kaW5nOiBUSFJFRS5Ob0JsZW5kaW5nXG4gICAgfSk7XG5cbiAgICB2YXIgcGFycyA9IHtcbiAgICAgIG1pbkZpbHRlcjogVEhSRUUuTGluZWFyRmlsdGVyLFxuICAgICAgbWFnRmlsdGVyOiBUSFJFRS5MaW5lYXJGaWx0ZXJcbiAgICB9O1xuICAgIGRlcHRoUmVuZGVyVGFyZ2V0ID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyVGFyZ2V0KHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQsIHBhcnMpO1xuXG4gICAgLy8gU2V0dXAgU1NBTyBwYXNzXG4gICAgc3Nhb1Bhc3MgPSBuZXcgVEhSRUUuU2hhZGVyUGFzcyhUSFJFRS5TU0FPU2hhZGVyKTtcbiAgICBzc2FvUGFzcy5yZW5kZXJUb1NjcmVlbiA9IHRydWU7XG4gICAgLy9zc2FvUGFzcy51bmlmb3Jtc1sgXCJ0RGlmZnVzZVwiIF0udmFsdWUgd2lsbCBiZSBzZXQgYnkgU2hhZGVyUGFzc1xuICAgIHNzYW9QYXNzLnVuaWZvcm1zW1widERlcHRoXCJdLnZhbHVlID0gZGVwdGhSZW5kZXJUYXJnZXQ7XG4gICAgc3Nhb1Bhc3MudW5pZm9ybXNbJ3NpemUnXS52YWx1ZS5zZXQod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gICAgc3Nhb1Bhc3MudW5pZm9ybXNbJ2NhbWVyYU5lYXInXS52YWx1ZSA9IGNhbWVyYS5uZWFyO1xuICAgIHNzYW9QYXNzLnVuaWZvcm1zWydjYW1lcmFGYXInXS52YWx1ZSA9IGNhbWVyYS5mYXI7XG4gICAgc3Nhb1Bhc3MudW5pZm9ybXNbJ29ubHlBTyddLnZhbHVlID0gZmFsc2U7XG4gICAgc3Nhb1Bhc3MudW5pZm9ybXNbJ2FvQ2xhbXAnXS52YWx1ZSA9IDE7XG4gICAgc3Nhb1Bhc3MudW5pZm9ybXNbJ2x1bUluZmx1ZW5jZSddLnZhbHVlID0gMC41O1xuXG4gICAgLy8gQWRkIHBhc3MgdG8gZWZmZWN0IGNvbXBvc2VyXG4gICAgZWZmZWN0Q29tcG9zZXIgPSBuZXcgVEhSRUUuRWZmZWN0Q29tcG9zZXIocmVuZGVyZXIpO1xuICAgIGVmZmVjdENvbXBvc2VyLmFkZFBhc3MocmVuZGVyUGFzcyk7XG4gICAgZWZmZWN0Q29tcG9zZXIuYWRkUGFzcyhzc2FvUGFzcyk7XG4gIH1cblxuICAvLyBTZXQgdXAgcmVuZGVyIGxvb3BcbiAgaW5pdFBvc3Rwcm9jZXNzaW5nKCk7XG4gIHJlbmRlcigpO1xuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBvbldpbmRvd1Jlc2l6ZSwgZmFsc2UpO1xuXG4gIHJldHVybiBzeXN0ZW07XG59OyIsInZhciBhcnJheSA9IHtcbiAgaW5kZXhPZjogZnVuY3Rpb24oYXJyYXksIGVsZW1lbnQpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYXJyYXlbaV0gPT09IGVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIGk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAtMTtcbiAgfSxcblxuICBpbmNsdWRlczogZnVuY3Rpb24oYXJyYXksIGVsZW1lbnQpIHtcbiAgICByZXR1cm4gdGhpcy5pbmRleE9mKGFycmF5LCBlbGVtZW50KSAhPT0gLTE7XG4gIH0sXG5cbiAgcmVtb3ZlOiBmdW5jdGlvbihhcnJheSwgZWxlbWVudCkge1xuICAgIHZhciBpbmRleCA9IHRoaXMuaW5kZXhPZihhcnJheSwgZWxlbWVudCk7XG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgYXJyYXkuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gIH0sXG5cbiAgY2xvbmU6IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIGNvcHkgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb3B5W2ldID0gYXJyYXlbaV07XG4gICAgfVxuICAgIHJldHVybiBjb3B5O1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFycmF5OyIsInZhciBHcmF2aXR5ID0gZnVuY3Rpb24oZGlyLCBheGlzLCBwb3NpdGl2ZSkge1xuICB0aGlzLmRpciA9IGRpciB8fCBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICB0aGlzLmF4aXMgPSBheGlzIHx8ICcnO1xuICB0aGlzLnBvc2l0aXZlID0gcG9zaXRpdmUgfHwgJyc7XG5cbiAgdGhpcy5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgR3Jhdml0eSh0aGlzLmRpciwgdGhpcy5heGlzLCB0aGlzLnBvc2l0aXZlKTtcbiAgfTtcblxuICB0aGlzLmVxdWFscyA9IGZ1bmN0aW9uKGdyYXZpdHkpIHtcbiAgICByZXR1cm4gdGhpcy5kaXIuZXF1YWxzKGdyYXZpdHkuZGlyKTtcbiAgfTtcblxuICB0aGlzLmlzTm9uZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmRpci5sZW5ndGgoKSA9PT0gMDtcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR3Jhdml0eTsiLCJ2YXIgR3Jhdml0eSA9IHJlcXVpcmUoJy4vZ3Jhdml0eScpO1xuXG52YXIgZ3Jhdml0aWVzID0ge1xuICBub25lOiBuZXcgR3Jhdml0eSgpLFxuICByaWdodDogbmV3IEdyYXZpdHkobmV3IFRIUkVFLlZlY3RvcjMoMSwgMCwgMCkubm9ybWFsaXplKCksICd4JywgdHJ1ZSksXG4gIGxlZnQ6IG5ldyBHcmF2aXR5KG5ldyBUSFJFRS5WZWN0b3IzKC0xLCAwLCAwKS5ub3JtYWxpemUoKSwgJ3gnLCBmYWxzZSksXG4gIHRvcDogbmV3IEdyYXZpdHkobmV3IFRIUkVFLlZlY3RvcjMoMCwgMSwgMCkubm9ybWFsaXplKCksICd5JywgdHJ1ZSksXG4gIGJvdHRvbTogbmV3IEdyYXZpdHkobmV3IFRIUkVFLlZlY3RvcjMoMCwgLTEsIDApLm5vcm1hbGl6ZSgpLCAneScsIGZhbHNlKSxcbiAgZnJvbnQ6IG5ldyBHcmF2aXR5KG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDEpLm5vcm1hbGl6ZSgpLCAneicsIHRydWUpLFxuICBiYWNrOiBuZXcgR3Jhdml0eShuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSkubm9ybWFsaXplKCksICd6JywgZmFsc2UpXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0R3Jhdml0eTogZnVuY3Rpb24ocG9zaXRpb24pIHtcbiAgICB2YXIgbWluID0gMTtcbiAgICB2YXIgY2xvc2VzdCA9IG51bGw7XG4gICAgdmFyIGZvcmNlID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBmb3IgKHZhciBpZCBpbiBncmF2aXRpZXMpIHtcbiAgICAgIHZhciBncmF2aXR5ID0gZ3Jhdml0aWVzW2lkXTtcbiAgICAgIHZhciBkb3QgPSBncmF2aXR5LmRpci5jbG9uZSgpLmRvdChwb3NpdGlvbi5jbG9uZSgpLm5vcm1hbGl6ZSgpKTtcbiAgICAgIGlmIChkb3QgPCBtaW4pIHtcbiAgICAgICAgbWluID0gZG90O1xuICAgICAgICBjbG9zZXN0ID0gZ3Jhdml0eTtcbiAgICAgIH1cblxuICAgICAgaWYoZG90IDwgLSAwLjUpIHtcbiAgICAgICAgdmFyIHJhdGlvID0gLTAuNSAtIGRvdDtcbiAgICAgICAgZm9yY2UuYWRkKGdyYXZpdHkuZGlyLmNsb25lKCkubXVsdGlwbHlTY2FsYXIocmF0aW8pKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgZ3Jhdml0eSA9IGNsb3Nlc3QuY2xvbmUoKTtcbiAgICBncmF2aXR5LmZvcmNlRGlyID0gZm9yY2Uubm9ybWFsaXplKCk7XG4gICAgcmV0dXJuIGdyYXZpdHk7XG4gIH1cbn07IiwidmFyIGNvbXBpbGVNZXNoZXIgPSByZXF1aXJlKCdncmVlZHktbWVzaGVyJyk7XG52YXIgbmRhcnJheSA9IHJlcXVpcmUoJ25kYXJyYXknKTtcblxudmFyIG1lc2hlciA9IGNvbXBpbGVNZXNoZXIoe1xuICBleHRyYUFyZ3M6IDEsXG4gIG9yZGVyOiBbMCwgMV0sXG4gIGFwcGVuZDogZnVuY3Rpb24obG9feCwgbG9feSwgaGlfeCwgaGlfeSwgdmFsLCByZXN1bHQpIHtcbiAgICByZXN1bHQucHVzaChbXG4gICAgICBbbG9feCwgbG9feV0sXG4gICAgICBbaGlfeCwgaGlfeV1cbiAgICBdKVxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkYXRhLCBkaW0sIHZveGVsU2lkZVRleHR1cmVJZHMpIHtcbiAgdm94ZWxTaWRlVGV4dHVyZUlkcyA9IHZveGVsU2lkZVRleHR1cmVJZHMgfHwge307XG5cbiAgdmFyIHZlcnRpY2VzID0gW107XG4gIHZhciBzdXJmYWNlcyA9IFtdO1xuXG4gIHZhciB1LCB2LCBkaW1zRCwgZGltc1UsIGRpbXNWLCB0ZDAsIHRkMSwgZHYsIGZsaXA7XG5cbiAgLy8gSW50ZXJhdGUgdGhyb3VnaCBkaW1lbnNpb25zXG4gIGZvciAodmFyIGQgPSAwOyBkIDwgMzsgZCsrKSB7XG4gICAgdSA9IChkICsgMSkgJSAzO1xuICAgIHYgPSAoZCArIDIpICUgMztcbiAgICBkaW1zRCA9IGRpbVtkXTtcbiAgICBkaW1zVSA9IGRpbVt1XTtcbiAgICBkaW1zViA9IGRpbVt2XTtcbiAgICB0ZDAgPSBkICogMjtcbiAgICB0ZDEgPSBkICogMiArIDE7XG5cbiAgICAvLyBJbnRlcmF0ZSB0aHJvdWdoIFNsaWNlc1xuICAgIGZsaXAgPSBmYWxzZTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRpbXNEOyBpKyspIHtcbiAgICAgIHByb2Nlc3NTbGljZShpKTtcbiAgICB9XG5cblxuICAgIC8vIEludGVyYXRlIHRocm91Z2ggU2xpY2VzIGZyb20gb3RoZXIgZGlyXG4gICAgZmxpcCA9IHRydWU7XG4gICAgZm9yICh2YXIgaSA9IGRpbXNEIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHByb2Nlc3NTbGljZShpKTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gcHJvY2Vzc1NsaWNlKGkpIHtcbiAgICB2YXIgc2xpY2UgPSBuZGFycmF5KFtdLCBbZGltc1UsIGRpbXNWXSk7XG5cbiAgICB2YXIgczAgPSAwO1xuICAgIGR2ID0gZmxpcCA/IGkgOiBpICsgMTtcblxuICAgIC8vSW50ZXJhdGUgdGhyb3VnaCB1dlxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGltc1U7IGorKykge1xuICAgICAgdmFyIHMxID0gMDtcbiAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgZGltc1Y7IGsrKykge1xuICAgICAgICB2YXIgYiA9IGdldFZveGVsKGksIGosIGssIGQpO1xuICAgICAgICBpZiAoIWIpIHtcbiAgICAgICAgICBzbGljZS5zZXQoaiwgaywgMCk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGIxO1xuICAgICAgICBpZiAoZmxpcCkge1xuICAgICAgICAgIGIxID0gaSA9PT0gMCA/IDAgOiBnZXRWb3hlbChpIC0gMSwgaiwgaywgZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYjEgPSBpID09PSBkaW1zRCAtIDEgPyAwIDogZ2V0Vm94ZWwoaSArIDEsIGosIGssIGQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghIWIxKSB7XG4gICAgICAgICAgc2xpY2Uuc2V0KGosIGssIDApO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0ID0gZ2V0VGV4dHVyZUlkKGIsIGZsaXAgPyB0ZDAgOiB0ZDEpO1xuICAgICAgICBzbGljZS5zZXQoaiwgaywgdCk7XG4gICAgICAgIHMxKys7XG4gICAgICB9XG4gICAgICBzMCsrO1xuICAgIH1cblxuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICBtZXNoZXIoc2xpY2UsIHJlc3VsdCk7XG5cbiAgICBpZiAocmVzdWx0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAodmFyIGwgPSAwOyBsIDwgcmVzdWx0Lmxlbmd0aDsgbCsrKSB7XG4gICAgICB2YXIgZiA9IHJlc3VsdFtsXTtcbiAgICAgIHZhciBsbyA9IGZbMF07XG4gICAgICB2YXIgaGkgPSBmWzFdO1xuICAgICAgdmFyIHNpemV1ID0gaGlbMF0gLSBsb1swXTtcbiAgICAgIHZhciBzaXpldiA9IGhpWzFdIC0gbG9bMV07XG5cbiAgICAgIHZhciBmdXZzID0gW1xuICAgICAgICBbMCwgMF0sXG4gICAgICAgIFtzaXpldSwgMF0sXG4gICAgICAgIFtzaXpldSwgc2l6ZXZdLFxuICAgICAgICBbMCwgc2l6ZXZdXG4gICAgICBdO1xuXG4gICAgICB2YXIgYyA9IHNsaWNlLmdldChsb1swXSwgbG9bMV0pO1xuXG4gICAgICB2YXIgdjAgPSBbXTtcbiAgICAgIHZhciB2MSA9IFtdO1xuICAgICAgdmFyIHYyID0gW107XG4gICAgICB2YXIgdjMgPSBbXTtcblxuICAgICAgdjBbZF0gPSBkdjtcbiAgICAgIHYwW3VdID0gbG9bMF07XG4gICAgICB2MFt2XSA9IGxvWzFdO1xuXG4gICAgICB2MVtkXSA9IGR2O1xuICAgICAgdjFbdV0gPSBoaVswXTtcbiAgICAgIHYxW3ZdID0gbG9bMV07XG5cbiAgICAgIHYyW2RdID0gZHY7XG4gICAgICB2Mlt1XSA9IGhpWzBdO1xuICAgICAgdjJbdl0gPSBoaVsxXTtcblxuICAgICAgdjNbZF0gPSBkdjtcbiAgICAgIHYzW3VdID0gbG9bMF07XG4gICAgICB2M1t2XSA9IGhpWzFdO1xuXG4gICAgICB2YXIgdmluZGV4ID0gdmVydGljZXMubGVuZ3RoO1xuICAgICAgdmVydGljZXMucHVzaCh2MCwgdjEsIHYyLCB2Myk7XG4gICAgICBpZiAoZmxpcCkge1xuICAgICAgICBzdXJmYWNlcy5wdXNoKHtcbiAgICAgICAgICBmYWNlOiBbdmluZGV4ICsgMywgdmluZGV4ICsgMiwgdmluZGV4ICsgMSwgdmluZGV4LCBjXSxcbiAgICAgICAgICB1djogW2Z1dnNbM10sIGZ1dnNbMl0sIGZ1dnNbMV0sIGZ1dnNbMF1dXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3VyZmFjZXMucHVzaCh7XG4gICAgICAgICAgZmFjZTogW3ZpbmRleCwgdmluZGV4ICsgMSwgdmluZGV4ICsgMiwgdmluZGV4ICsgMywgY10sXG4gICAgICAgICAgdXY6IFtmdXZzWzBdLCBmdXZzWzFdLCBmdXZzWzJdLCBmdXZzWzNdXVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRWb3hlbChpLCBqLCBrLCBkKSB7XG4gICAgaWYgKGQgPT09IDApIHtcbiAgICAgIHJldHVybiBkYXRhKGksIGosIGspO1xuICAgICAgLy8gcmV0dXJuIGRhdGFbayArIChqICsgaSAqIGRpbVswXSkgKiBkaW1bMV1dO1xuICAgIH0gZWxzZSBpZiAoZCA9PT0gMSkge1xuICAgICAgcmV0dXJuIGRhdGEoaywgaSwgaik7XG4gICAgICAvLyByZXR1cm4gZGF0YVtqICsgKGkgKyBrICogZGltWzBdKSAqIGRpbVsxXV07XG4gICAgfSBlbHNlIGlmIChkID09PSAyKSB7XG4gICAgICByZXR1cm4gZGF0YShqLCBrLCBpKTtcbiAgICAgIC8vIHJldHVybiBkYXRhW2kgKyAoayArIGogKiBkaW1bMF0pICogZGltWzFdXTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0VGV4dHVyZUlkKGIsIHNpZGUpIHtcbiAgICBpZiAoIWIpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIHZhciBtYXAgPSB2b3hlbFNpZGVUZXh0dXJlSWRzW2JdO1xuICAgIGlmIChtYXAgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGI7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coc2lkZSk7XG4gICAgLy8gY29uc29sZS5sb2cobWFwW3NpZGVdIHx8IGIpO1xuICAgIHJldHVybiBtYXBbc2lkZV0gfHwgYjtcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIHZlcnRpY2VzOiB2ZXJ0aWNlcyxcbiAgICBzdXJmYWNlczogc3VyZmFjZXNcbiAgfVxufTsiLCJ2YXIgVEhSRUUgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snVEhSRUUnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ1RIUkVFJ10gOiBudWxsKTtcbnZhciBncmF2aXR5VXRpbHMgPSByZXF1aXJlKCcuL2dyYXZpdHl1dGlscycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICB2YXIgbWFwID0ge307XG4gIHZhciBjb2cgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICB2YXIgZ3Jhdml0eUFtb3VudCA9IDAuMDU7XG5cbiAgZnVuY3Rpb24gb25BdHRhY2gob2JqZWN0LCBjb21wb25lbnQpIHtcbiAgICBpZihjb21wb25lbnQudHlwZSA9PT0gJ3JpZ2lkQm9keScpIHtcbiAgICAgIG1hcFtjb21wb25lbnQuX2lkXSA9IGNvbXBvbmVudDtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gb25EZXR0YWNoKG9iamVjdCwgY29tcG9uZW50KSB7XG4gICAgaWYoY29tcG9uZW50LnR5cGUgPT09ICdyaWdpZEJvZHknKSB7XG4gICAgICBkZWxldGUgbWFwW2NvbXBvbmVudC5faWRdO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiB0aWNrKCkge1xuICAgIHZhciBib2RpZXMgPSBbXTtcbiAgICB2YXIgZml4dHVyZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpZCBpbiBtYXApIHtcbiAgICAgIHZhciBib2R5ID0gbWFwW2lkXTtcbiAgICAgIGlmIChib2R5LmlzRml4dHVyZSkge1xuICAgICAgICBmaXh0dXJlcy5wdXNoKGJvZHkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYm9kaWVzLnB1c2goYm9keSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBib2RpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciByaWdpZEJvZHkgPSBib2RpZXNbaV07XG5cbiAgICAgIC8vIEFwcGx5IGdyYXZpdHlcbiAgICAgIHZhciBncmF2aXR5ID0gZ3Jhdml0eVV0aWxzLmdldEdyYXZpdHkocmlnaWRCb2R5Lm9iamVjdC5wb3NpdGlvbik7XG4gICAgICByaWdpZEJvZHkuZ3Jhdml0eSA9IGdyYXZpdHk7XG5cbiAgICAgIGlmIChyaWdpZEJvZHkuZ3JvdW5kZWQpIHtcbiAgICAgICAgdmFyIGdyYXZpdHlGb3JjZSA9IGdyYXZpdHkuZGlyLmNsb25lKCkuc2V0TGVuZ3RoKGdyYXZpdHlBbW91bnQpO1xuICAgICAgICByaWdpZEJvZHkuYXBwbHlGb3JjZShncmF2aXR5Rm9yY2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGdyYXZpdHlGb3JjZSA9IGdyYXZpdHkuZm9yY2VEaXIuY2xvbmUoKS5zZXRMZW5ndGgoZ3Jhdml0eUFtb3VudCk7XG4gICAgICAgIHJpZ2lkQm9keS5hcHBseUZvcmNlKGdyYXZpdHlGb3JjZSk7XG4gICAgICB9XG5cblxuICAgICAgLy8gQXBwbHkgYWNjZWxlcmF0aW9uIHRvIHZlbG9jaXR5XG4gICAgICByaWdpZEJvZHkudmVsb2NpdHkuYWRkKHJpZ2lkQm9keS5hY2NlbGVyYXRpb24pO1xuICAgICAgcmlnaWRCb2R5LnZlbG9jaXR5Lm11bHRpcGx5U2NhbGFyKHJpZ2lkQm9keS5mcmljdGlvbik7XG5cbiAgICAgIHJpZ2lkQm9keS5ncm91bmRlZCA9IGZhbHNlO1xuXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGZpeHR1cmVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIHZhciBmaXh0dXJlID0gZml4dHVyZXNbal07XG5cbiAgICAgICAgdmFyIHZlbG9jaXRpZXMgPSB7XG4gICAgICAgICAgJ3gnOiBuZXcgVEhSRUUuVmVjdG9yMyhyaWdpZEJvZHkudmVsb2NpdHkueCwgMCwgMCksXG4gICAgICAgICAgJ3knOiBuZXcgVEhSRUUuVmVjdG9yMygwLCByaWdpZEJvZHkudmVsb2NpdHkueSwgMCksXG4gICAgICAgICAgJ3onOiBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCByaWdpZEJvZHkudmVsb2NpdHkueilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwb3NpdGlvbiA9IHJpZ2lkQm9keS5vYmplY3QucG9zaXRpb24uY2xvbmUoKTtcbiAgICAgICAgZm9yICh2YXIgYXhpcyBpbiB2ZWxvY2l0aWVzKSB7XG4gICAgICAgICAgdmFyIHYgPSB2ZWxvY2l0aWVzW2F4aXNdO1xuICAgICAgICAgIHZhciByYXljYXN0ZXIgPSBuZXcgVEhSRUUuUmF5Y2FzdGVyKFxuICAgICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgICB2LmNsb25lKCkubm9ybWFsaXplKCksXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgdi5sZW5ndGgoKSArIDAuNVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICB2YXIgaW50ZXJzZWN0cyA9IHJheWNhc3Rlci5pbnRlcnNlY3RPYmplY3QoZml4dHVyZS5vYmplY3QsIHRydWUpO1xuICAgICAgICAgIGlmIChpbnRlcnNlY3RzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHZhciBpbnRlcnNlY3QgPSBpbnRlcnNlY3RzWzBdO1xuICAgICAgICAgICAgdmFyIG1hZyA9IGludGVyc2VjdC5kaXN0YW5jZSAtIDAuNTtcbiAgICAgICAgICAgIHJpZ2lkQm9keS52ZWxvY2l0eVtheGlzXSA9IHJpZ2lkQm9keS52ZWxvY2l0eVtheGlzXSA+IDAgPyBtYWcgOiAtbWFnO1xuICAgICAgICAgICAgaWYgKGF4aXMgPT09IGdyYXZpdHkuYXhpcykge1xuICAgICAgICAgICAgICByaWdpZEJvZHkuZ3JvdW5kZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHBvc2l0aW9uLmFkZCh2KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBBcHBseSB2ZWxvY2l0eVxuICAgICAgcmlnaWRCb2R5Lm9iamVjdC5wb3NpdGlvbi5hZGQocmlnaWRCb2R5LnZlbG9jaXR5KTtcblxuICAgICAgLy8gQ2xlYXIgYWNjZWxlcmF0aW9uXG4gICAgICByaWdpZEJvZHkuYWNjZWxlcmF0aW9uLnNldCgwLCAwLCAwKTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIHBoeXNpY3MgPSB7XG4gICAgb25BdHRhY2g6IG9uQXR0YWNoLFxuICAgIG9uRGV0dGFjaDogb25EZXR0YWNoLFxuICAgIHRpY2s6IHRpY2ssXG4gICAgYXBwOiBudWxsXG4gIH07XG5cbiAgcmV0dXJuIHBoeXNpY3M7XG59OyIsIi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxudmFyIGlzQXJyYXkgPSByZXF1aXJlKCdpcy1hcnJheScpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTIgLy8gbm90IHVzZWQgYnkgdGhpcyBpbXBsZW1lbnRhdGlvblxuXG52YXIgcm9vdFBhcmVudCA9IHt9XG5cbi8qKlxuICogSWYgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYDpcbiAqICAgPT09IHRydWUgICAgVXNlIFVpbnQ4QXJyYXkgaW1wbGVtZW50YXRpb24gKGZhc3Rlc3QpXG4gKiAgID09PSBmYWxzZSAgIFVzZSBPYmplY3QgaW1wbGVtZW50YXRpb24gKG1vc3QgY29tcGF0aWJsZSwgZXZlbiBJRTYpXG4gKlxuICogQnJvd3NlcnMgdGhhdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBhcmUgSUUgMTArLCBGaXJlZm94IDQrLCBDaHJvbWUgNyssIFNhZmFyaSA1LjErLFxuICogT3BlcmEgMTEuNissIGlPUyA0LjIrLlxuICpcbiAqIER1ZSB0byB2YXJpb3VzIGJyb3dzZXIgYnVncywgc29tZXRpbWVzIHRoZSBPYmplY3QgaW1wbGVtZW50YXRpb24gd2lsbCBiZSB1c2VkIGV2ZW5cbiAqIHdoZW4gdGhlIGJyb3dzZXIgc3VwcG9ydHMgdHlwZWQgYXJyYXlzLlxuICpcbiAqIE5vdGU6XG4gKlxuICogICAtIEZpcmVmb3ggNC0yOSBsYWNrcyBzdXBwb3J0IGZvciBhZGRpbmcgbmV3IHByb3BlcnRpZXMgdG8gYFVpbnQ4QXJyYXlgIGluc3RhbmNlcyxcbiAqICAgICBTZWU6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NTQzOC5cbiAqXG4gKiAgIC0gU2FmYXJpIDUtNyBsYWNrcyBzdXBwb3J0IGZvciBjaGFuZ2luZyB0aGUgYE9iamVjdC5wcm90b3R5cGUuY29uc3RydWN0b3JgIHByb3BlcnR5XG4gKiAgICAgb24gb2JqZWN0cy5cbiAqXG4gKiAgIC0gQ2hyb21lIDktMTAgaXMgbWlzc2luZyB0aGUgYFR5cGVkQXJyYXkucHJvdG90eXBlLnN1YmFycmF5YCBmdW5jdGlvbi5cbiAqXG4gKiAgIC0gSUUxMCBoYXMgYSBicm9rZW4gYFR5cGVkQXJyYXkucHJvdG90eXBlLnN1YmFycmF5YCBmdW5jdGlvbiB3aGljaCByZXR1cm5zIGFycmF5cyBvZlxuICogICAgIGluY29ycmVjdCBsZW5ndGggaW4gc29tZSBzaXR1YXRpb25zLlxuXG4gKiBXZSBkZXRlY3QgdGhlc2UgYnVnZ3kgYnJvd3NlcnMgYW5kIHNldCBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgIHRvIGBmYWxzZWAgc28gdGhleVxuICogZ2V0IHRoZSBPYmplY3QgaW1wbGVtZW50YXRpb24sIHdoaWNoIGlzIHNsb3dlciBidXQgYmVoYXZlcyBjb3JyZWN0bHkuXG4gKi9cbkJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUID0gKGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gQmFyICgpIHt9XG4gIHRyeSB7XG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KDEpXG4gICAgYXJyLmZvbyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH1cbiAgICBhcnIuY29uc3RydWN0b3IgPSBCYXJcbiAgICByZXR1cm4gYXJyLmZvbygpID09PSA0MiAmJiAvLyB0eXBlZCBhcnJheSBpbnN0YW5jZXMgY2FuIGJlIGF1Z21lbnRlZFxuICAgICAgICBhcnIuY29uc3RydWN0b3IgPT09IEJhciAmJiAvLyBjb25zdHJ1Y3RvciBjYW4gYmUgc2V0XG4gICAgICAgIHR5cGVvZiBhcnIuc3ViYXJyYXkgPT09ICdmdW5jdGlvbicgJiYgLy8gY2hyb21lIDktMTAgbGFjayBgc3ViYXJyYXlgXG4gICAgICAgIGFyci5zdWJhcnJheSgxLCAxKS5ieXRlTGVuZ3RoID09PSAwIC8vIGllMTAgaGFzIGJyb2tlbiBgc3ViYXJyYXlgXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufSkoKVxuXG5mdW5jdGlvbiBrTWF4TGVuZ3RoICgpIHtcbiAgcmV0dXJuIEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUXG4gICAgPyAweDdmZmZmZmZmXG4gICAgOiAweDNmZmZmZmZmXG59XG5cbi8qKlxuICogQ2xhc3M6IEJ1ZmZlclxuICogPT09PT09PT09PT09PVxuICpcbiAqIFRoZSBCdWZmZXIgY29uc3RydWN0b3IgcmV0dXJucyBpbnN0YW5jZXMgb2YgYFVpbnQ4QXJyYXlgIHRoYXQgYXJlIGF1Z21lbnRlZFxuICogd2l0aCBmdW5jdGlvbiBwcm9wZXJ0aWVzIGZvciBhbGwgdGhlIG5vZGUgYEJ1ZmZlcmAgQVBJIGZ1bmN0aW9ucy4gV2UgdXNlXG4gKiBgVWludDhBcnJheWAgc28gdGhhdCBzcXVhcmUgYnJhY2tldCBub3RhdGlvbiB3b3JrcyBhcyBleHBlY3RlZCAtLSBpdCByZXR1cm5zXG4gKiBhIHNpbmdsZSBvY3RldC5cbiAqXG4gKiBCeSBhdWdtZW50aW5nIHRoZSBpbnN0YW5jZXMsIHdlIGNhbiBhdm9pZCBtb2RpZnlpbmcgdGhlIGBVaW50OEFycmF5YFxuICogcHJvdG90eXBlLlxuICovXG5mdW5jdGlvbiBCdWZmZXIgKGFyZykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQnVmZmVyKSkge1xuICAgIC8vIEF2b2lkIGdvaW5nIHRocm91Z2ggYW4gQXJndW1lbnRzQWRhcHRvclRyYW1wb2xpbmUgaW4gdGhlIGNvbW1vbiBjYXNlLlxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkgcmV0dXJuIG5ldyBCdWZmZXIoYXJnLCBhcmd1bWVudHNbMV0pXG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoYXJnKVxuICB9XG5cbiAgdGhpcy5sZW5ndGggPSAwXG4gIHRoaXMucGFyZW50ID0gdW5kZWZpbmVkXG5cbiAgLy8gQ29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykge1xuICAgIHJldHVybiBmcm9tTnVtYmVyKHRoaXMsIGFyZylcbiAgfVxuXG4gIC8vIFNsaWdodGx5IGxlc3MgY29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBmcm9tU3RyaW5nKHRoaXMsIGFyZywgYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiAndXRmOCcpXG4gIH1cblxuICAvLyBVbnVzdWFsLlxuICByZXR1cm4gZnJvbU9iamVjdCh0aGlzLCBhcmcpXG59XG5cbmZ1bmN0aW9uIGZyb21OdW1iZXIgKHRoYXQsIGxlbmd0aCkge1xuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoIDwgMCA/IDAgOiBjaGVja2VkKGxlbmd0aCkgfCAwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdGhhdFtpXSA9IDBcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbVN0cmluZyAodGhhdCwgc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJyB8fCBlbmNvZGluZyA9PT0gJycpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgLy8gQXNzdW1wdGlvbjogYnl0ZUxlbmd0aCgpIHJldHVybiB2YWx1ZSBpcyBhbHdheXMgPCBrTWF4TGVuZ3RoLlxuICB2YXIgbGVuZ3RoID0gYnl0ZUxlbmd0aChzdHJpbmcsIGVuY29kaW5nKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcblxuICB0aGF0LndyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21PYmplY3QgKHRoYXQsIG9iamVjdCkge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKG9iamVjdCkpIHJldHVybiBmcm9tQnVmZmVyKHRoYXQsIG9iamVjdClcblxuICBpZiAoaXNBcnJheShvYmplY3QpKSByZXR1cm4gZnJvbUFycmF5KHRoYXQsIG9iamVjdClcblxuICBpZiAob2JqZWN0ID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdtdXN0IHN0YXJ0IHdpdGggbnVtYmVyLCBidWZmZXIsIGFycmF5IG9yIHN0cmluZycpXG4gIH1cblxuICBpZiAodHlwZW9mIEFycmF5QnVmZmVyICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmIChvYmplY3QuYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgIHJldHVybiBmcm9tVHlwZWRBcnJheSh0aGF0LCBvYmplY3QpXG4gICAgfVxuICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgcmV0dXJuIGZyb21BcnJheUJ1ZmZlcih0aGF0LCBvYmplY3QpXG4gICAgfVxuICB9XG5cbiAgaWYgKG9iamVjdC5sZW5ndGgpIHJldHVybiBmcm9tQXJyYXlMaWtlKHRoYXQsIG9iamVjdClcblxuICByZXR1cm4gZnJvbUpzb25PYmplY3QodGhhdCwgb2JqZWN0KVxufVxuXG5mdW5jdGlvbiBmcm9tQnVmZmVyICh0aGF0LCBidWZmZXIpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYnVmZmVyLmxlbmd0aCkgfCAwXG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG4gIGJ1ZmZlci5jb3B5KHRoYXQsIDAsIDAsIGxlbmd0aClcbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5ICh0aGF0LCBhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuLy8gRHVwbGljYXRlIG9mIGZyb21BcnJheSgpIHRvIGtlZXAgZnJvbUFycmF5KCkgbW9ub21vcnBoaWMuXG5mdW5jdGlvbiBmcm9tVHlwZWRBcnJheSAodGhhdCwgYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcbiAgLy8gVHJ1bmNhdGluZyB0aGUgZWxlbWVudHMgaXMgcHJvYmFibHkgbm90IHdoYXQgcGVvcGxlIGV4cGVjdCBmcm9tIHR5cGVkXG4gIC8vIGFycmF5cyB3aXRoIEJZVEVTX1BFUl9FTEVNRU5UID4gMSBidXQgaXQncyBjb21wYXRpYmxlIHdpdGggdGhlIGJlaGF2aW9yXG4gIC8vIG9mIHRoZSBvbGQgQnVmZmVyIGNvbnN0cnVjdG9yLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5QnVmZmVyICh0aGF0LCBhcnJheSkge1xuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSwgZm9yIGJlc3QgcGVyZm9ybWFuY2VcbiAgICBhcnJheS5ieXRlTGVuZ3RoXG4gICAgdGhhdCA9IEJ1ZmZlci5fYXVnbWVudChuZXcgVWludDhBcnJheShhcnJheSkpXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBhbiBvYmplY3QgaW5zdGFuY2Ugb2YgdGhlIEJ1ZmZlciBjbGFzc1xuICAgIHRoYXQgPSBmcm9tVHlwZWRBcnJheSh0aGF0LCBuZXcgVWludDhBcnJheShhcnJheSkpXG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5TGlrZSAodGhhdCwgYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIHRoYXRbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbi8vIERlc2VyaWFsaXplIHsgdHlwZTogJ0J1ZmZlcicsIGRhdGE6IFsxLDIsMywuLi5dIH0gaW50byBhIEJ1ZmZlciBvYmplY3QuXG4vLyBSZXR1cm5zIGEgemVyby1sZW5ndGggYnVmZmVyIGZvciBpbnB1dHMgdGhhdCBkb24ndCBjb25mb3JtIHRvIHRoZSBzcGVjLlxuZnVuY3Rpb24gZnJvbUpzb25PYmplY3QgKHRoYXQsIG9iamVjdCkge1xuICB2YXIgYXJyYXlcbiAgdmFyIGxlbmd0aCA9IDBcblxuICBpZiAob2JqZWN0LnR5cGUgPT09ICdCdWZmZXInICYmIGlzQXJyYXkob2JqZWN0LmRhdGEpKSB7XG4gICAgYXJyYXkgPSBvYmplY3QuZGF0YVxuICAgIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgfVxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICB0aGF0W2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBhbGxvY2F0ZSAodGhhdCwgbGVuZ3RoKSB7XG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlLCBmb3IgYmVzdCBwZXJmb3JtYW5jZVxuICAgIHRoYXQgPSBCdWZmZXIuX2F1Z21lbnQobmV3IFVpbnQ4QXJyYXkobGVuZ3RoKSlcbiAgfSBlbHNlIHtcbiAgICAvLyBGYWxsYmFjazogUmV0dXJuIGFuIG9iamVjdCBpbnN0YW5jZSBvZiB0aGUgQnVmZmVyIGNsYXNzXG4gICAgdGhhdC5sZW5ndGggPSBsZW5ndGhcbiAgICB0aGF0Ll9pc0J1ZmZlciA9IHRydWVcbiAgfVxuXG4gIHZhciBmcm9tUG9vbCA9IGxlbmd0aCAhPT0gMCAmJiBsZW5ndGggPD0gQnVmZmVyLnBvb2xTaXplID4+PiAxXG4gIGlmIChmcm9tUG9vbCkgdGhhdC5wYXJlbnQgPSByb290UGFyZW50XG5cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gY2hlY2tlZCAobGVuZ3RoKSB7XG4gIC8vIE5vdGU6IGNhbm5vdCB1c2UgYGxlbmd0aCA8IGtNYXhMZW5ndGhgIGhlcmUgYmVjYXVzZSB0aGF0IGZhaWxzIHdoZW5cbiAgLy8gbGVuZ3RoIGlzIE5hTiAod2hpY2ggaXMgb3RoZXJ3aXNlIGNvZXJjZWQgdG8gemVyby4pXG4gIGlmIChsZW5ndGggPj0ga01heExlbmd0aCgpKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gYWxsb2NhdGUgQnVmZmVyIGxhcmdlciB0aGFuIG1heGltdW0gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ3NpemU6IDB4JyArIGtNYXhMZW5ndGgoKS50b1N0cmluZygxNikgKyAnIGJ5dGVzJylcbiAgfVxuICByZXR1cm4gbGVuZ3RoIHwgMFxufVxuXG5mdW5jdGlvbiBTbG93QnVmZmVyIChzdWJqZWN0LCBlbmNvZGluZykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgU2xvd0J1ZmZlcikpIHJldHVybiBuZXcgU2xvd0J1ZmZlcihzdWJqZWN0LCBlbmNvZGluZylcblxuICB2YXIgYnVmID0gbmV3IEJ1ZmZlcihzdWJqZWN0LCBlbmNvZGluZylcbiAgZGVsZXRlIGJ1Zi5wYXJlbnRcbiAgcmV0dXJuIGJ1ZlxufVxuXG5CdWZmZXIuaXNCdWZmZXIgPSBmdW5jdGlvbiBpc0J1ZmZlciAoYikge1xuICByZXR1cm4gISEoYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyKVxufVxuXG5CdWZmZXIuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKGEsIGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYSkgfHwgIUJ1ZmZlci5pc0J1ZmZlcihiKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyBtdXN0IGJlIEJ1ZmZlcnMnKVxuICB9XG5cbiAgaWYgKGEgPT09IGIpIHJldHVybiAwXG5cbiAgdmFyIHggPSBhLmxlbmd0aFxuICB2YXIgeSA9IGIubGVuZ3RoXG5cbiAgdmFyIGkgPSAwXG4gIHZhciBsZW4gPSBNYXRoLm1pbih4LCB5KVxuICB3aGlsZSAoaSA8IGxlbikge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSBicmVha1xuXG4gICAgKytpXG4gIH1cblxuICBpZiAoaSAhPT0gbGVuKSB7XG4gICAgeCA9IGFbaV1cbiAgICB5ID0gYltpXVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG5CdWZmZXIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIGlzRW5jb2RpbmcgKGVuY29kaW5nKSB7XG4gIHN3aXRjaCAoU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICBjYXNlICdyYXcnOlxuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5CdWZmZXIuY29uY2F0ID0gZnVuY3Rpb24gY29uY2F0IChsaXN0LCBsZW5ndGgpIHtcbiAgaWYgKCFpc0FycmF5KGxpc3QpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdsaXN0IGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXkgb2YgQnVmZmVycy4nKVxuXG4gIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBuZXcgQnVmZmVyKDApXG4gIH1cblxuICB2YXIgaVxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBsZW5ndGggPSAwXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxlbmd0aCArPSBsaXN0W2ldLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIHZhciBidWYgPSBuZXcgQnVmZmVyKGxlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaXRlbSA9IGxpc3RbaV1cbiAgICBpdGVtLmNvcHkoYnVmLCBwb3MpXG4gICAgcG9zICs9IGl0ZW0ubGVuZ3RoXG4gIH1cbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2Ygc3RyaW5nICE9PSAnc3RyaW5nJykgc3RyaW5nID0gJycgKyBzdHJpbmdcblxuICB2YXIgbGVuID0gc3RyaW5nLmxlbmd0aFxuICBpZiAobGVuID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIFVzZSBhIGZvciBsb29wIHRvIGF2b2lkIHJlY3Vyc2lvblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgIC8vIERlcHJlY2F0ZWRcbiAgICAgIGNhc2UgJ3Jhdyc6XG4gICAgICBjYXNlICdyYXdzJzpcbiAgICAgICAgcmV0dXJuIGxlblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIGxlbiAqIDJcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBsZW4gPj4+IDFcbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHJldHVybiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aCAvLyBhc3N1bWUgdXRmOFxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuQnVmZmVyLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5cbi8vIHByZS1zZXQgZm9yIHZhbHVlcyB0aGF0IG1heSBleGlzdCBpbiB0aGUgZnV0dXJlXG5CdWZmZXIucHJvdG90eXBlLmxlbmd0aCA9IHVuZGVmaW5lZFxuQnVmZmVyLnByb3RvdHlwZS5wYXJlbnQgPSB1bmRlZmluZWRcblxuZnVuY3Rpb24gc2xvd1RvU3RyaW5nIChlbmNvZGluZywgc3RhcnQsIGVuZCkge1xuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuXG4gIHN0YXJ0ID0gc3RhcnQgfCAwXG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkIHx8IGVuZCA9PT0gSW5maW5pdHkgPyB0aGlzLmxlbmd0aCA6IGVuZCB8IDBcblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAoZW5kIDw9IHN0YXJ0KSByZXR1cm4gJydcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBiaW5hcnlTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHV0ZjE2bGVTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoZW5jb2RpbmcgKyAnJykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoIHwgMFxuICBpZiAobGVuZ3RoID09PSAwKSByZXR1cm4gJydcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiB1dGY4U2xpY2UodGhpcywgMCwgbGVuZ3RoKVxuICByZXR1cm4gc2xvd1RvU3RyaW5nLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiBlcXVhbHMgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIHRydWVcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpID09PSAwXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uIGluc3BlY3QgKCkge1xuICB2YXIgc3RyID0gJydcbiAgdmFyIG1heCA9IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVNcbiAgaWYgKHRoaXMubGVuZ3RoID4gMCkge1xuICAgIHN0ciA9IHRoaXMudG9TdHJpbmcoJ2hleCcsIDAsIG1heCkubWF0Y2goLy57Mn0vZykuam9pbignICcpXG4gICAgaWYgKHRoaXMubGVuZ3RoID4gbWF4KSBzdHIgKz0gJyAuLi4gJ1xuICB9XG4gIHJldHVybiAnPEJ1ZmZlciAnICsgc3RyICsgJz4nXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIDBcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIGluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCkge1xuICBpZiAoYnl0ZU9mZnNldCA+IDB4N2ZmZmZmZmYpIGJ5dGVPZmZzZXQgPSAweDdmZmZmZmZmXG4gIGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAtMHg4MDAwMDAwMCkgYnl0ZU9mZnNldCA9IC0weDgwMDAwMDAwXG4gIGJ5dGVPZmZzZXQgPj49IDBcblxuICBpZiAodGhpcy5sZW5ndGggPT09IDApIHJldHVybiAtMVxuICBpZiAoYnl0ZU9mZnNldCA+PSB0aGlzLmxlbmd0aCkgcmV0dXJuIC0xXG5cbiAgLy8gTmVnYXRpdmUgb2Zmc2V0cyBzdGFydCBmcm9tIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlclxuICBpZiAoYnl0ZU9mZnNldCA8IDApIGJ5dGVPZmZzZXQgPSBNYXRoLm1heCh0aGlzLmxlbmd0aCArIGJ5dGVPZmZzZXQsIDApXG5cbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgaWYgKHZhbC5sZW5ndGggPT09IDApIHJldHVybiAtMSAvLyBzcGVjaWFsIGNhc2U6IGxvb2tpbmcgZm9yIGVtcHR5IHN0cmluZyBhbHdheXMgZmFpbHNcbiAgICByZXR1cm4gU3RyaW5nLnByb3RvdHlwZS5pbmRleE9mLmNhbGwodGhpcywgdmFsLCBieXRlT2Zmc2V0KVxuICB9XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsKSkge1xuICAgIHJldHVybiBhcnJheUluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0KVxuICB9XG4gIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCAmJiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKHRoaXMsIHZhbCwgYnl0ZU9mZnNldClcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZih0aGlzLCBbIHZhbCBdLCBieXRlT2Zmc2V0KVxuICB9XG5cbiAgZnVuY3Rpb24gYXJyYXlJbmRleE9mIChhcnIsIHZhbCwgYnl0ZU9mZnNldCkge1xuICAgIHZhciBmb3VuZEluZGV4ID0gLTFcbiAgICBmb3IgKHZhciBpID0gMDsgYnl0ZU9mZnNldCArIGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhcnJbYnl0ZU9mZnNldCArIGldID09PSB2YWxbZm91bmRJbmRleCA9PT0gLTEgPyAwIDogaSAtIGZvdW5kSW5kZXhdKSB7XG4gICAgICAgIGlmIChmb3VuZEluZGV4ID09PSAtMSkgZm91bmRJbmRleCA9IGlcbiAgICAgICAgaWYgKGkgLSBmb3VuZEluZGV4ICsgMSA9PT0gdmFsLmxlbmd0aCkgcmV0dXJuIGJ5dGVPZmZzZXQgKyBmb3VuZEluZGV4XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3VuZEluZGV4ID0gLTFcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xXG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKCd2YWwgbXVzdCBiZSBzdHJpbmcsIG51bWJlciBvciBCdWZmZXInKVxufVxuXG4vLyBgZ2V0YCBpcyBkZXByZWNhdGVkXG5CdWZmZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCAob2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuZ2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy5yZWFkVUludDgob2Zmc2V0KVxufVxuXG4vLyBgc2V0YCBpcyBkZXByZWNhdGVkXG5CdWZmZXIucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldCAodiwgb2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuc2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy53cml0ZVVJbnQ4KHYsIG9mZnNldClcbn1cblxuZnVuY3Rpb24gaGV4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSBidWYubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cblxuICAvLyBtdXN0IGJlIGFuIGV2ZW4gbnVtYmVyIG9mIGRpZ2l0c1xuICB2YXIgc3RyTGVuID0gc3RyaW5nLmxlbmd0aFxuICBpZiAoc3RyTGVuICUgMiAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGhleCBzdHJpbmcnKVxuXG4gIGlmIChsZW5ndGggPiBzdHJMZW4gLyAyKSB7XG4gICAgbGVuZ3RoID0gc3RyTGVuIC8gMlxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgcGFyc2VkID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGlmIChpc05hTihwYXJzZWQpKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaGV4IHN0cmluZycpXG4gICAgYnVmW29mZnNldCArIGldID0gcGFyc2VkXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gdXRmOFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiaW5hcnlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBhc2NpaVdyaXRlKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIHVjczJXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjE2bGVUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiB3cml0ZSAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZylcbiAgaWYgKG9mZnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBvZmZzZXRbLCBsZW5ndGhdWywgZW5jb2RpbmddKVxuICB9IGVsc2UgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gICAgaWYgKGlzRmluaXRlKGxlbmd0aCkpIHtcbiAgICAgIGxlbmd0aCA9IGxlbmd0aCB8IDBcbiAgICAgIGlmIChlbmNvZGluZyA9PT0gdW5kZWZpbmVkKSBlbmNvZGluZyA9ICd1dGY4J1xuICAgIH0gZWxzZSB7XG4gICAgICBlbmNvZGluZyA9IGxlbmd0aFxuICAgICAgbGVuZ3RoID0gdW5kZWZpbmVkXG4gICAgfVxuICAvLyBsZWdhY3kgd3JpdGUoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0LCBsZW5ndGgpIC0gcmVtb3ZlIGluIHYwLjEzXG4gIH0gZWxzZSB7XG4gICAgdmFyIHN3YXAgPSBlbmNvZGluZ1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgb2Zmc2V0ID0gbGVuZ3RoIHwgMFxuICAgIGxlbmd0aCA9IHN3YXBcbiAgfVxuXG4gIHZhciByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldFxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbGVuZ3RoID4gcmVtYWluaW5nKSBsZW5ndGggPSByZW1haW5pbmdcblxuICBpZiAoKHN0cmluZy5sZW5ndGggPiAwICYmIChsZW5ndGggPCAwIHx8IG9mZnNldCA8IDApKSB8fCBvZmZzZXQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdhdHRlbXB0IHRvIHdyaXRlIG91dHNpZGUgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gYmluYXJ5V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgLy8gV2FybmluZzogbWF4TGVuZ3RoIG5vdCB0YWtlbiBpbnRvIGFjY291bnQgaW4gYmFzZTY0V3JpdGVcbiAgICAgICAgcmV0dXJuIGJhc2U2NFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1Y3MyV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gdG9KU09OICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG5mdW5jdGlvbiBiYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gdXRmOFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuICB2YXIgcmVzID0gW11cblxuICB2YXIgaSA9IHN0YXJ0XG4gIHdoaWxlIChpIDwgZW5kKSB7XG4gICAgdmFyIGZpcnN0Qnl0ZSA9IGJ1ZltpXVxuICAgIHZhciBjb2RlUG9pbnQgPSBudWxsXG4gICAgdmFyIGJ5dGVzUGVyU2VxdWVuY2UgPSAoZmlyc3RCeXRlID4gMHhFRikgPyA0XG4gICAgICA6IChmaXJzdEJ5dGUgPiAweERGKSA/IDNcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4QkYpID8gMlxuICAgICAgOiAxXG5cbiAgICBpZiAoaSArIGJ5dGVzUGVyU2VxdWVuY2UgPD0gZW5kKSB7XG4gICAgICB2YXIgc2Vjb25kQnl0ZSwgdGhpcmRCeXRlLCBmb3VydGhCeXRlLCB0ZW1wQ29kZVBvaW50XG5cbiAgICAgIHN3aXRjaCAoYnl0ZXNQZXJTZXF1ZW5jZSkge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgaWYgKGZpcnN0Qnl0ZSA8IDB4ODApIHtcbiAgICAgICAgICAgIGNvZGVQb2ludCA9IGZpcnN0Qnl0ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweDFGKSA8PCAweDYgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0YpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHhDIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAodGhpcmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3RkYgJiYgKHRlbXBDb2RlUG9pbnQgPCAweEQ4MDAgfHwgdGVtcENvZGVQb2ludCA+IDB4REZGRikpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgZm91cnRoQnl0ZSA9IGJ1ZltpICsgM11cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKGZvdXJ0aEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4MTIgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4QyB8ICh0aGlyZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAoZm91cnRoQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4RkZGRiAmJiB0ZW1wQ29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29kZVBvaW50ID09PSBudWxsKSB7XG4gICAgICAvLyB3ZSBkaWQgbm90IGdlbmVyYXRlIGEgdmFsaWQgY29kZVBvaW50IHNvIGluc2VydCBhXG4gICAgICAvLyByZXBsYWNlbWVudCBjaGFyIChVK0ZGRkQpIGFuZCBhZHZhbmNlIG9ubHkgMSBieXRlXG4gICAgICBjb2RlUG9pbnQgPSAweEZGRkRcbiAgICAgIGJ5dGVzUGVyU2VxdWVuY2UgPSAxXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPiAweEZGRkYpIHtcbiAgICAgIC8vIGVuY29kZSB0byB1dGYxNiAoc3Vycm9nYXRlIHBhaXIgZGFuY2UpXG4gICAgICBjb2RlUG9pbnQgLT0gMHgxMDAwMFxuICAgICAgcmVzLnB1c2goY29kZVBvaW50ID4+PiAxMCAmIDB4M0ZGIHwgMHhEODAwKVxuICAgICAgY29kZVBvaW50ID0gMHhEQzAwIHwgY29kZVBvaW50ICYgMHgzRkZcbiAgICB9XG5cbiAgICByZXMucHVzaChjb2RlUG9pbnQpXG4gICAgaSArPSBieXRlc1BlclNlcXVlbmNlXG4gIH1cblxuICByZXR1cm4gZGVjb2RlQ29kZVBvaW50c0FycmF5KHJlcylcbn1cblxuLy8gQmFzZWQgb24gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjI3NDcyNzIvNjgwNzQyLCB0aGUgYnJvd3NlciB3aXRoXG4vLyB0aGUgbG93ZXN0IGxpbWl0IGlzIENocm9tZSwgd2l0aCAweDEwMDAwIGFyZ3MuXG4vLyBXZSBnbyAxIG1hZ25pdHVkZSBsZXNzLCBmb3Igc2FmZXR5XG52YXIgTUFYX0FSR1VNRU5UU19MRU5HVEggPSAweDEwMDBcblxuZnVuY3Rpb24gZGVjb2RlQ29kZVBvaW50c0FycmF5IChjb2RlUG9pbnRzKSB7XG4gIHZhciBsZW4gPSBjb2RlUG9pbnRzLmxlbmd0aFxuICBpZiAobGVuIDw9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjb2RlUG9pbnRzKSAvLyBhdm9pZCBleHRyYSBzbGljZSgpXG4gIH1cblxuICAvLyBEZWNvZGUgaW4gY2h1bmtzIHRvIGF2b2lkIFwiY2FsbCBzdGFjayBzaXplIGV4Y2VlZGVkXCIuXG4gIHZhciByZXMgPSAnJ1xuICB2YXIgaSA9IDBcbiAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShcbiAgICAgIFN0cmluZyxcbiAgICAgIGNvZGVQb2ludHMuc2xpY2UoaSwgaSArPSBNQVhfQVJHVU1FTlRTX0xFTkdUSClcbiAgICApXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSAmIDB4N0YpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBiaW5hcnlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBoZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBieXRlcyA9IGJ1Zi5zbGljZShzdGFydCwgZW5kKVxuICB2YXIgcmVzID0gJydcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgYnl0ZXNbaSArIDFdICogMjU2KVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uIHNsaWNlIChzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBzdGFydCA9IH5+c3RhcnRcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyBsZW4gOiB+fmVuZFxuXG4gIGlmIChzdGFydCA8IDApIHtcbiAgICBzdGFydCArPSBsZW5cbiAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgfSBlbHNlIGlmIChzdGFydCA+IGxlbikge1xuICAgIHN0YXJ0ID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgMCkge1xuICAgIGVuZCArPSBsZW5cbiAgICBpZiAoZW5kIDwgMCkgZW5kID0gMFxuICB9IGVsc2UgaWYgKGVuZCA+IGxlbikge1xuICAgIGVuZCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIHZhciBuZXdCdWZcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgbmV3QnVmID0gQnVmZmVyLl9hdWdtZW50KHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZCkpXG4gIH0gZWxzZSB7XG4gICAgdmFyIHNsaWNlTGVuID0gZW5kIC0gc3RhcnRcbiAgICBuZXdCdWYgPSBuZXcgQnVmZmVyKHNsaWNlTGVuLCB1bmRlZmluZWQpXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzbGljZUxlbjsgaSsrKSB7XG4gICAgICBuZXdCdWZbaV0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH1cblxuICBpZiAobmV3QnVmLmxlbmd0aCkgbmV3QnVmLnBhcmVudCA9IHRoaXMucGFyZW50IHx8IHRoaXNcblxuICByZXR1cm4gbmV3QnVmXG59XG5cbi8qXG4gKiBOZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IGJ1ZmZlciBpc24ndCB0cnlpbmcgdG8gd3JpdGUgb3V0IG9mIGJvdW5kcy5cbiAqL1xuZnVuY3Rpb24gY2hlY2tPZmZzZXQgKG9mZnNldCwgZXh0LCBsZW5ndGgpIHtcbiAgaWYgKChvZmZzZXQgJSAxKSAhPT0gMCB8fCBvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb2Zmc2V0IGlzIG5vdCB1aW50JylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RyeWluZyB0byBhY2Nlc3MgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50TEUgPSBmdW5jdGlvbiByZWFkVUludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50QkUgPSBmdW5jdGlvbiByZWFkVUludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuICB9XG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXVxuICB2YXIgbXVsID0gMVxuICB3aGlsZSAoYnl0ZUxlbmd0aCA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQ4ID0gZnVuY3Rpb24gcmVhZFVJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbiByZWFkVUludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkJFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDgpIHwgdGhpc1tvZmZzZXQgKyAxXVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAoKHRoaXNbb2Zmc2V0XSkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpKSArXG4gICAgICAodGhpc1tvZmZzZXQgKyAzXSAqIDB4MTAwMDAwMClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyQkUgPSBmdW5jdGlvbiByZWFkVUludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSAqIDB4MTAwMDAwMCkgK1xuICAgICgodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICB0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRMRSA9IGZ1bmN0aW9uIHJlYWRJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRCRSA9IGZ1bmN0aW9uIHJlYWRJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aFxuICB2YXIgbXVsID0gMVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWldXG4gIHdoaWxlIChpID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0taV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQ4ID0gZnVuY3Rpb24gcmVhZEludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgaWYgKCEodGhpc1tvZmZzZXRdICYgMHg4MCkpIHJldHVybiAodGhpc1tvZmZzZXRdKVxuICByZXR1cm4gKCgweGZmIC0gdGhpc1tvZmZzZXRdICsgMSkgKiAtMSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiByZWFkSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAxXSB8ICh0aGlzW29mZnNldF0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gcmVhZEludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDNdIDw8IDI0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkJFID0gZnVuY3Rpb24gcmVhZEludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCAyNCkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gcmVhZEZsb2F0TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gcmVhZEZsb2F0QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlTEUgPSBmdW5jdGlvbiByZWFkRG91YmxlTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDUyLCA4KVxufVxuXG5mdW5jdGlvbiBjaGVja0ludCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2J1ZmZlciBtdXN0IGJlIGEgQnVmZmVyIGluc3RhbmNlJylcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndmFsdWUgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlVUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCksIDApXG5cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlVUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCksIDApXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVVSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweGZmLCAwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB2YWx1ZSA9IE1hdGguZmxvb3IodmFsdWUpXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbmZ1bmN0aW9uIG9iamVjdFdyaXRlVUludDE2IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbikge1xuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZiArIHZhbHVlICsgMVxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGJ1Zi5sZW5ndGggLSBvZmZzZXQsIDIpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID0gKHZhbHVlICYgKDB4ZmYgPDwgKDggKiAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSkpKSA+Pj5cbiAgICAgIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpICogOFxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSB2YWx1ZVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbmZ1bmN0aW9uIG9iamVjdFdyaXRlVUludDMyIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbikge1xuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihidWYubGVuZ3RoIC0gb2Zmc2V0LCA0KTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9ICh2YWx1ZSA+Pj4gKGxpdHRsZUVuZGlhbiA/IGkgOiAzIC0gaSkgKiA4KSAmIDB4ZmZcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSB2YWx1ZVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSAwXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSB2YWx1ZSA8IDAgPyAxIDogMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50QkUgPSBmdW5jdGlvbiB3cml0ZUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IHZhbHVlIDwgMCA/IDEgOiAwXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDggPSBmdW5jdGlvbiB3cml0ZUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHg3ZiwgLTB4ODApXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHZhbHVlID0gTWF0aC5mbG9vcih2YWx1ZSlcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmICsgdmFsdWUgKyAxXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9IHZhbHVlXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSB2YWx1ZVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbmZ1bmN0aW9uIGNoZWNrSUVFRTc1NCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICh2YWx1ZSA+IG1heCB8fCB2YWx1ZSA8IG1pbikgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3ZhbHVlIGlzIG91dCBvZiBib3VuZHMnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuZnVuY3Rpb24gd3JpdGVGbG9hdCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA0LCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA4LCAxLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCwgLTEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxuICByZXR1cm4gb2Zmc2V0ICsgOFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIGNvcHkgKHRhcmdldCwgdGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kICYmIGVuZCAhPT0gMCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldFN0YXJ0ID49IHRhcmdldC5sZW5ndGgpIHRhcmdldFN0YXJ0ID0gdGFyZ2V0Lmxlbmd0aFxuICBpZiAoIXRhcmdldFN0YXJ0KSB0YXJnZXRTdGFydCA9IDBcbiAgaWYgKGVuZCA+IDAgJiYgZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm4gMFxuICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBGYXRhbCBlcnJvciBjb25kaXRpb25zXG4gIGlmICh0YXJnZXRTdGFydCA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIH1cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZVN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBpZiAoZW5kIDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgPCBlbmQgLSBzdGFydCkge1xuICAgIGVuZCA9IHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCArIHN0YXJ0XG4gIH1cblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcbiAgdmFyIGlcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHN0YXJ0IDwgdGFyZ2V0U3RhcnQgJiYgdGFyZ2V0U3RhcnQgPCBlbmQpIHtcbiAgICAvLyBkZXNjZW5kaW5nIGNvcHkgZnJvbSBlbmRcbiAgICBmb3IgKGkgPSBsZW4gLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSBpZiAobGVuIDwgMTAwMCB8fCAhQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBhc2NlbmRpbmcgY29weSBmcm9tIHN0YXJ0XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0YXJnZXQuX3NldCh0aGlzLnN1YmFycmF5KHN0YXJ0LCBzdGFydCArIGxlbiksIHRhcmdldFN0YXJ0KVxuICB9XG5cbiAgcmV0dXJuIGxlblxufVxuXG4vLyBmaWxsKHZhbHVlLCBzdGFydD0wLCBlbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uIGZpbGwgKHZhbHVlLCBzdGFydCwgZW5kKSB7XG4gIGlmICghdmFsdWUpIHZhbHVlID0gMFxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQpIGVuZCA9IHRoaXMubGVuZ3RoXG5cbiAgaWYgKGVuZCA8IHN0YXJ0KSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignZW5kIDwgc3RhcnQnKVxuXG4gIC8vIEZpbGwgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuXG4gIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3N0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBpZiAoZW5kIDwgMCB8fCBlbmQgPiB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2VuZCBvdXQgb2YgYm91bmRzJylcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIHRoaXNbaV0gPSB2YWx1ZVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgYnl0ZXMgPSB1dGY4VG9CeXRlcyh2YWx1ZS50b1N0cmluZygpKVxuICAgIHZhciBsZW4gPSBieXRlcy5sZW5ndGhcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gYnl0ZXNbaSAlIGxlbl1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgYEFycmF5QnVmZmVyYCB3aXRoIHRoZSAqY29waWVkKiBtZW1vcnkgb2YgdGhlIGJ1ZmZlciBpbnN0YW5jZS5cbiAqIEFkZGVkIGluIE5vZGUgMC4xMi4gT25seSBhdmFpbGFibGUgaW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0IEFycmF5QnVmZmVyLlxuICovXG5CdWZmZXIucHJvdG90eXBlLnRvQXJyYXlCdWZmZXIgPSBmdW5jdGlvbiB0b0FycmF5QnVmZmVyICgpIHtcbiAgaWYgKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgICAgcmV0dXJuIChuZXcgQnVmZmVyKHRoaXMpKS5idWZmZXJcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGJ1ZiA9IG5ldyBVaW50OEFycmF5KHRoaXMubGVuZ3RoKVxuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGJ1Zi5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgICBidWZbaV0gPSB0aGlzW2ldXG4gICAgICB9XG4gICAgICByZXR1cm4gYnVmLmJ1ZmZlclxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdCdWZmZXIudG9BcnJheUJ1ZmZlciBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlcicpXG4gIH1cbn1cblxuLy8gSEVMUEVSIEZVTkNUSU9OU1xuLy8gPT09PT09PT09PT09PT09PVxuXG52YXIgQlAgPSBCdWZmZXIucHJvdG90eXBlXG5cbi8qKlxuICogQXVnbWVudCBhIFVpbnQ4QXJyYXkgKmluc3RhbmNlKiAobm90IHRoZSBVaW50OEFycmF5IGNsYXNzISkgd2l0aCBCdWZmZXIgbWV0aG9kc1xuICovXG5CdWZmZXIuX2F1Z21lbnQgPSBmdW5jdGlvbiBfYXVnbWVudCAoYXJyKSB7XG4gIGFyci5jb25zdHJ1Y3RvciA9IEJ1ZmZlclxuICBhcnIuX2lzQnVmZmVyID0gdHJ1ZVxuXG4gIC8vIHNhdmUgcmVmZXJlbmNlIHRvIG9yaWdpbmFsIFVpbnQ4QXJyYXkgc2V0IG1ldGhvZCBiZWZvcmUgb3ZlcndyaXRpbmdcbiAgYXJyLl9zZXQgPSBhcnIuc2V0XG5cbiAgLy8gZGVwcmVjYXRlZFxuICBhcnIuZ2V0ID0gQlAuZ2V0XG4gIGFyci5zZXQgPSBCUC5zZXRcblxuICBhcnIud3JpdGUgPSBCUC53cml0ZVxuICBhcnIudG9TdHJpbmcgPSBCUC50b1N0cmluZ1xuICBhcnIudG9Mb2NhbGVTdHJpbmcgPSBCUC50b1N0cmluZ1xuICBhcnIudG9KU09OID0gQlAudG9KU09OXG4gIGFyci5lcXVhbHMgPSBCUC5lcXVhbHNcbiAgYXJyLmNvbXBhcmUgPSBCUC5jb21wYXJlXG4gIGFyci5pbmRleE9mID0gQlAuaW5kZXhPZlxuICBhcnIuY29weSA9IEJQLmNvcHlcbiAgYXJyLnNsaWNlID0gQlAuc2xpY2VcbiAgYXJyLnJlYWRVSW50TEUgPSBCUC5yZWFkVUludExFXG4gIGFyci5yZWFkVUludEJFID0gQlAucmVhZFVJbnRCRVxuICBhcnIucmVhZFVJbnQ4ID0gQlAucmVhZFVJbnQ4XG4gIGFyci5yZWFkVUludDE2TEUgPSBCUC5yZWFkVUludDE2TEVcbiAgYXJyLnJlYWRVSW50MTZCRSA9IEJQLnJlYWRVSW50MTZCRVxuICBhcnIucmVhZFVJbnQzMkxFID0gQlAucmVhZFVJbnQzMkxFXG4gIGFyci5yZWFkVUludDMyQkUgPSBCUC5yZWFkVUludDMyQkVcbiAgYXJyLnJlYWRJbnRMRSA9IEJQLnJlYWRJbnRMRVxuICBhcnIucmVhZEludEJFID0gQlAucmVhZEludEJFXG4gIGFyci5yZWFkSW50OCA9IEJQLnJlYWRJbnQ4XG4gIGFyci5yZWFkSW50MTZMRSA9IEJQLnJlYWRJbnQxNkxFXG4gIGFyci5yZWFkSW50MTZCRSA9IEJQLnJlYWRJbnQxNkJFXG4gIGFyci5yZWFkSW50MzJMRSA9IEJQLnJlYWRJbnQzMkxFXG4gIGFyci5yZWFkSW50MzJCRSA9IEJQLnJlYWRJbnQzMkJFXG4gIGFyci5yZWFkRmxvYXRMRSA9IEJQLnJlYWRGbG9hdExFXG4gIGFyci5yZWFkRmxvYXRCRSA9IEJQLnJlYWRGbG9hdEJFXG4gIGFyci5yZWFkRG91YmxlTEUgPSBCUC5yZWFkRG91YmxlTEVcbiAgYXJyLnJlYWREb3VibGVCRSA9IEJQLnJlYWREb3VibGVCRVxuICBhcnIud3JpdGVVSW50OCA9IEJQLndyaXRlVUludDhcbiAgYXJyLndyaXRlVUludExFID0gQlAud3JpdGVVSW50TEVcbiAgYXJyLndyaXRlVUludEJFID0gQlAud3JpdGVVSW50QkVcbiAgYXJyLndyaXRlVUludDE2TEUgPSBCUC53cml0ZVVJbnQxNkxFXG4gIGFyci53cml0ZVVJbnQxNkJFID0gQlAud3JpdGVVSW50MTZCRVxuICBhcnIud3JpdGVVSW50MzJMRSA9IEJQLndyaXRlVUludDMyTEVcbiAgYXJyLndyaXRlVUludDMyQkUgPSBCUC53cml0ZVVJbnQzMkJFXG4gIGFyci53cml0ZUludExFID0gQlAud3JpdGVJbnRMRVxuICBhcnIud3JpdGVJbnRCRSA9IEJQLndyaXRlSW50QkVcbiAgYXJyLndyaXRlSW50OCA9IEJQLndyaXRlSW50OFxuICBhcnIud3JpdGVJbnQxNkxFID0gQlAud3JpdGVJbnQxNkxFXG4gIGFyci53cml0ZUludDE2QkUgPSBCUC53cml0ZUludDE2QkVcbiAgYXJyLndyaXRlSW50MzJMRSA9IEJQLndyaXRlSW50MzJMRVxuICBhcnIud3JpdGVJbnQzMkJFID0gQlAud3JpdGVJbnQzMkJFXG4gIGFyci53cml0ZUZsb2F0TEUgPSBCUC53cml0ZUZsb2F0TEVcbiAgYXJyLndyaXRlRmxvYXRCRSA9IEJQLndyaXRlRmxvYXRCRVxuICBhcnIud3JpdGVEb3VibGVMRSA9IEJQLndyaXRlRG91YmxlTEVcbiAgYXJyLndyaXRlRG91YmxlQkUgPSBCUC53cml0ZURvdWJsZUJFXG4gIGFyci5maWxsID0gQlAuZmlsbFxuICBhcnIuaW5zcGVjdCA9IEJQLmluc3BlY3RcbiAgYXJyLnRvQXJyYXlCdWZmZXIgPSBCUC50b0FycmF5QnVmZmVyXG5cbiAgcmV0dXJuIGFyclxufVxuXG52YXIgSU5WQUxJRF9CQVNFNjRfUkUgPSAvW14rXFwvMC05QS1aYS16LV9dL2dcblxuZnVuY3Rpb24gYmFzZTY0Y2xlYW4gKHN0cikge1xuICAvLyBOb2RlIHN0cmlwcyBvdXQgaW52YWxpZCBjaGFyYWN0ZXJzIGxpa2UgXFxuIGFuZCBcXHQgZnJvbSB0aGUgc3RyaW5nLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgc3RyID0gc3RyaW5ndHJpbShzdHIpLnJlcGxhY2UoSU5WQUxJRF9CQVNFNjRfUkUsICcnKVxuICAvLyBOb2RlIGNvbnZlcnRzIHN0cmluZ3Mgd2l0aCBsZW5ndGggPCAyIHRvICcnXG4gIGlmIChzdHIubGVuZ3RoIDwgMikgcmV0dXJuICcnXG4gIC8vIE5vZGUgYWxsb3dzIGZvciBub24tcGFkZGVkIGJhc2U2NCBzdHJpbmdzIChtaXNzaW5nIHRyYWlsaW5nID09PSksIGJhc2U2NC1qcyBkb2VzIG5vdFxuICB3aGlsZSAoc3RyLmxlbmd0aCAlIDQgIT09IDApIHtcbiAgICBzdHIgPSBzdHIgKyAnPSdcbiAgfVxuICByZXR1cm4gc3RyXG59XG5cbmZ1bmN0aW9uIHN0cmluZ3RyaW0gKHN0cikge1xuICBpZiAoc3RyLnRyaW0pIHJldHVybiBzdHIudHJpbSgpXG4gIHJldHVybiBzdHIucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpXG59XG5cbmZ1bmN0aW9uIHRvSGV4IChuKSB7XG4gIGlmIChuIDwgMTYpIHJldHVybiAnMCcgKyBuLnRvU3RyaW5nKDE2KVxuICByZXR1cm4gbi50b1N0cmluZygxNilcbn1cblxuZnVuY3Rpb24gdXRmOFRvQnl0ZXMgKHN0cmluZywgdW5pdHMpIHtcbiAgdW5pdHMgPSB1bml0cyB8fCBJbmZpbml0eVxuICB2YXIgY29kZVBvaW50XG4gIHZhciBsZW5ndGggPSBzdHJpbmcubGVuZ3RoXG4gIHZhciBsZWFkU3Vycm9nYXRlID0gbnVsbFxuICB2YXIgYnl0ZXMgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBjb2RlUG9pbnQgPSBzdHJpbmcuY2hhckNvZGVBdChpKVxuXG4gICAgLy8gaXMgc3Vycm9nYXRlIGNvbXBvbmVudFxuICAgIGlmIChjb2RlUG9pbnQgPiAweEQ3RkYgJiYgY29kZVBvaW50IDwgMHhFMDAwKSB7XG4gICAgICAvLyBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCFsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAgIC8vIG5vIGxlYWQgeWV0XG4gICAgICAgIGlmIChjb2RlUG9pbnQgPiAweERCRkYpIHtcbiAgICAgICAgICAvLyB1bmV4cGVjdGVkIHRyYWlsXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfSBlbHNlIGlmIChpICsgMSA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgLy8gdW5wYWlyZWQgbGVhZFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YWxpZCBsZWFkXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyAyIGxlYWRzIGluIGEgcm93XG4gICAgICBpZiAoY29kZVBvaW50IDwgMHhEQzAwKSB7XG4gICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIHZhbGlkIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICBjb2RlUG9pbnQgPSBsZWFkU3Vycm9nYXRlIC0gMHhEODAwIDw8IDEwIHwgY29kZVBvaW50IC0gMHhEQzAwIHwgMHgxMDAwMFxuICAgIH0gZWxzZSBpZiAobGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgLy8gdmFsaWQgYm1wIGNoYXIsIGJ1dCBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgfVxuXG4gICAgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcblxuICAgIC8vIGVuY29kZSB1dGY4XG4gICAgaWYgKGNvZGVQb2ludCA8IDB4ODApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMSkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChjb2RlUG9pbnQpXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDgwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2IHwgMHhDMCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyB8IDB4RTAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDQpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDEyIHwgMHhGMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb2RlIHBvaW50JylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnl0ZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0ciwgdW5pdHMpIHtcbiAgdmFyIGMsIGhpLCBsb1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcblxuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KGJhc2U2NGNsZWFuKHN0cikpXG59XG5cbmZ1bmN0aW9uIGJsaXRCdWZmZXIgKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKSBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG4iLCJ2YXIgbG9va3VwID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nO1xuXG47KGZ1bmN0aW9uIChleHBvcnRzKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuICB2YXIgQXJyID0gKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJylcbiAgICA/IFVpbnQ4QXJyYXlcbiAgICA6IEFycmF5XG5cblx0dmFyIFBMVVMgICA9ICcrJy5jaGFyQ29kZUF0KDApXG5cdHZhciBTTEFTSCAgPSAnLycuY2hhckNvZGVBdCgwKVxuXHR2YXIgTlVNQkVSID0gJzAnLmNoYXJDb2RlQXQoMClcblx0dmFyIExPV0VSICA9ICdhJy5jaGFyQ29kZUF0KDApXG5cdHZhciBVUFBFUiAgPSAnQScuY2hhckNvZGVBdCgwKVxuXHR2YXIgUExVU19VUkxfU0FGRSA9ICctJy5jaGFyQ29kZUF0KDApXG5cdHZhciBTTEFTSF9VUkxfU0FGRSA9ICdfJy5jaGFyQ29kZUF0KDApXG5cblx0ZnVuY3Rpb24gZGVjb2RlIChlbHQpIHtcblx0XHR2YXIgY29kZSA9IGVsdC5jaGFyQ29kZUF0KDApXG5cdFx0aWYgKGNvZGUgPT09IFBMVVMgfHxcblx0XHQgICAgY29kZSA9PT0gUExVU19VUkxfU0FGRSlcblx0XHRcdHJldHVybiA2MiAvLyAnKydcblx0XHRpZiAoY29kZSA9PT0gU0xBU0ggfHxcblx0XHQgICAgY29kZSA9PT0gU0xBU0hfVVJMX1NBRkUpXG5cdFx0XHRyZXR1cm4gNjMgLy8gJy8nXG5cdFx0aWYgKGNvZGUgPCBOVU1CRVIpXG5cdFx0XHRyZXR1cm4gLTEgLy9ubyBtYXRjaFxuXHRcdGlmIChjb2RlIDwgTlVNQkVSICsgMTApXG5cdFx0XHRyZXR1cm4gY29kZSAtIE5VTUJFUiArIDI2ICsgMjZcblx0XHRpZiAoY29kZSA8IFVQUEVSICsgMjYpXG5cdFx0XHRyZXR1cm4gY29kZSAtIFVQUEVSXG5cdFx0aWYgKGNvZGUgPCBMT1dFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBMT1dFUiArIDI2XG5cdH1cblxuXHRmdW5jdGlvbiBiNjRUb0J5dGVBcnJheSAoYjY0KSB7XG5cdFx0dmFyIGksIGosIGwsIHRtcCwgcGxhY2VIb2xkZXJzLCBhcnJcblxuXHRcdGlmIChiNjQubGVuZ3RoICUgNCA+IDApIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdHJpbmcuIExlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNCcpXG5cdFx0fVxuXG5cdFx0Ly8gdGhlIG51bWJlciBvZiBlcXVhbCBzaWducyAocGxhY2UgaG9sZGVycylcblx0XHQvLyBpZiB0aGVyZSBhcmUgdHdvIHBsYWNlaG9sZGVycywgdGhhbiB0aGUgdHdvIGNoYXJhY3RlcnMgYmVmb3JlIGl0XG5cdFx0Ly8gcmVwcmVzZW50IG9uZSBieXRlXG5cdFx0Ly8gaWYgdGhlcmUgaXMgb25seSBvbmUsIHRoZW4gdGhlIHRocmVlIGNoYXJhY3RlcnMgYmVmb3JlIGl0IHJlcHJlc2VudCAyIGJ5dGVzXG5cdFx0Ly8gdGhpcyBpcyBqdXN0IGEgY2hlYXAgaGFjayB0byBub3QgZG8gaW5kZXhPZiB0d2ljZVxuXHRcdHZhciBsZW4gPSBiNjQubGVuZ3RoXG5cdFx0cGxhY2VIb2xkZXJzID0gJz0nID09PSBiNjQuY2hhckF0KGxlbiAtIDIpID8gMiA6ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAxKSA/IDEgOiAwXG5cblx0XHQvLyBiYXNlNjQgaXMgNC8zICsgdXAgdG8gdHdvIGNoYXJhY3RlcnMgb2YgdGhlIG9yaWdpbmFsIGRhdGFcblx0XHRhcnIgPSBuZXcgQXJyKGI2NC5sZW5ndGggKiAzIC8gNCAtIHBsYWNlSG9sZGVycylcblxuXHRcdC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcblx0XHRsID0gcGxhY2VIb2xkZXJzID4gMCA/IGI2NC5sZW5ndGggLSA0IDogYjY0Lmxlbmd0aFxuXG5cdFx0dmFyIEwgPSAwXG5cblx0XHRmdW5jdGlvbiBwdXNoICh2KSB7XG5cdFx0XHRhcnJbTCsrXSA9IHZcblx0XHR9XG5cblx0XHRmb3IgKGkgPSAwLCBqID0gMDsgaSA8IGw7IGkgKz0gNCwgaiArPSAzKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDE4KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpIDw8IDEyKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpIDw8IDYpIHwgZGVjb2RlKGI2NC5jaGFyQXQoaSArIDMpKVxuXHRcdFx0cHVzaCgodG1wICYgMHhGRjAwMDApID4+IDE2KVxuXHRcdFx0cHVzaCgodG1wICYgMHhGRjAwKSA+PiA4KVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdGlmIChwbGFjZUhvbGRlcnMgPT09IDIpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA+PiA0KVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH0gZWxzZSBpZiAocGxhY2VIb2xkZXJzID09PSAxKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDEwKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpIDw8IDQpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPj4gMilcblx0XHRcdHB1c2goKHRtcCA+PiA4KSAmIDB4RkYpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGFyclxuXHR9XG5cblx0ZnVuY3Rpb24gdWludDhUb0Jhc2U2NCAodWludDgpIHtcblx0XHR2YXIgaSxcblx0XHRcdGV4dHJhQnl0ZXMgPSB1aW50OC5sZW5ndGggJSAzLCAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuXHRcdFx0b3V0cHV0ID0gXCJcIixcblx0XHRcdHRlbXAsIGxlbmd0aFxuXG5cdFx0ZnVuY3Rpb24gZW5jb2RlIChudW0pIHtcblx0XHRcdHJldHVybiBsb29rdXAuY2hhckF0KG51bSlcblx0XHR9XG5cblx0XHRmdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQgKG51bSkge1xuXHRcdFx0cmV0dXJuIGVuY29kZShudW0gPj4gMTggJiAweDNGKSArIGVuY29kZShudW0gPj4gMTIgJiAweDNGKSArIGVuY29kZShudW0gPj4gNiAmIDB4M0YpICsgZW5jb2RlKG51bSAmIDB4M0YpXG5cdFx0fVxuXG5cdFx0Ly8gZ28gdGhyb3VnaCB0aGUgYXJyYXkgZXZlcnkgdGhyZWUgYnl0ZXMsIHdlJ2xsIGRlYWwgd2l0aCB0cmFpbGluZyBzdHVmZiBsYXRlclxuXHRcdGZvciAoaSA9IDAsIGxlbmd0aCA9IHVpbnQ4Lmxlbmd0aCAtIGV4dHJhQnl0ZXM7IGkgPCBsZW5ndGg7IGkgKz0gMykge1xuXHRcdFx0dGVtcCA9ICh1aW50OFtpXSA8PCAxNikgKyAodWludDhbaSArIDFdIDw8IDgpICsgKHVpbnQ4W2kgKyAyXSlcblx0XHRcdG91dHB1dCArPSB0cmlwbGV0VG9CYXNlNjQodGVtcClcblx0XHR9XG5cblx0XHQvLyBwYWQgdGhlIGVuZCB3aXRoIHplcm9zLCBidXQgbWFrZSBzdXJlIHRvIG5vdCBmb3JnZXQgdGhlIGV4dHJhIGJ5dGVzXG5cdFx0c3dpdGNoIChleHRyYUJ5dGVzKSB7XG5cdFx0XHRjYXNlIDE6XG5cdFx0XHRcdHRlbXAgPSB1aW50OFt1aW50OC5sZW5ndGggLSAxXVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMilcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA8PCA0KSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSAnPT0nXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHRjYXNlIDI6XG5cdFx0XHRcdHRlbXAgPSAodWludDhbdWludDgubGVuZ3RoIC0gMl0gPDwgOCkgKyAodWludDhbdWludDgubGVuZ3RoIC0gMV0pXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUodGVtcCA+PiAxMClcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA+PiA0KSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgMikgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz0nXG5cdFx0XHRcdGJyZWFrXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG91dHB1dFxuXHR9XG5cblx0ZXhwb3J0cy50b0J5dGVBcnJheSA9IGI2NFRvQnl0ZUFycmF5XG5cdGV4cG9ydHMuZnJvbUJ5dGVBcnJheSA9IHVpbnQ4VG9CYXNlNjRcbn0odHlwZW9mIGV4cG9ydHMgPT09ICd1bmRlZmluZWQnID8gKHRoaXMuYmFzZTY0anMgPSB7fSkgOiBleHBvcnRzKSlcbiIsImV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uIChidWZmZXIsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtXG4gIHZhciBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgbkJpdHMgPSAtN1xuICB2YXIgaSA9IGlzTEUgPyAobkJ5dGVzIC0gMSkgOiAwXG4gIHZhciBkID0gaXNMRSA/IC0xIDogMVxuICB2YXIgcyA9IGJ1ZmZlcltvZmZzZXQgKyBpXVxuXG4gIGkgKz0gZFxuXG4gIGUgPSBzICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIHMgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IGVMZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgZSA9IGUgKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBtID0gZSAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBlID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBtTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IG0gPSBtICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgaWYgKGUgPT09IDApIHtcbiAgICBlID0gMSAtIGVCaWFzXG4gIH0gZWxzZSBpZiAoZSA9PT0gZU1heCkge1xuICAgIHJldHVybiBtID8gTmFOIDogKChzID8gLTEgOiAxKSAqIEluZmluaXR5KVxuICB9IGVsc2Uge1xuICAgIG0gPSBtICsgTWF0aC5wb3coMiwgbUxlbilcbiAgICBlID0gZSAtIGVCaWFzXG4gIH1cbiAgcmV0dXJuIChzID8gLTEgOiAxKSAqIG0gKiBNYXRoLnBvdygyLCBlIC0gbUxlbilcbn1cblxuZXhwb3J0cy53cml0ZSA9IGZ1bmN0aW9uIChidWZmZXIsIHZhbHVlLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSwgY1xuICB2YXIgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIHJ0ID0gKG1MZW4gPT09IDIzID8gTWF0aC5wb3coMiwgLTI0KSAtIE1hdGgucG93KDIsIC03NykgOiAwKVxuICB2YXIgaSA9IGlzTEUgPyAwIDogKG5CeXRlcyAtIDEpXG4gIHZhciBkID0gaXNMRSA/IDEgOiAtMVxuICB2YXIgcyA9IHZhbHVlIDwgMCB8fCAodmFsdWUgPT09IDAgJiYgMSAvIHZhbHVlIDwgMCkgPyAxIDogMFxuXG4gIHZhbHVlID0gTWF0aC5hYnModmFsdWUpXG5cbiAgaWYgKGlzTmFOKHZhbHVlKSB8fCB2YWx1ZSA9PT0gSW5maW5pdHkpIHtcbiAgICBtID0gaXNOYU4odmFsdWUpID8gMSA6IDBcbiAgICBlID0gZU1heFxuICB9IGVsc2Uge1xuICAgIGUgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4yKVxuICAgIGlmICh2YWx1ZSAqIChjID0gTWF0aC5wb3coMiwgLWUpKSA8IDEpIHtcbiAgICAgIGUtLVxuICAgICAgYyAqPSAyXG4gICAgfVxuICAgIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgdmFsdWUgKz0gcnQgLyBjXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlICs9IHJ0ICogTWF0aC5wb3coMiwgMSAtIGVCaWFzKVxuICAgIH1cbiAgICBpZiAodmFsdWUgKiBjID49IDIpIHtcbiAgICAgIGUrK1xuICAgICAgYyAvPSAyXG4gICAgfVxuXG4gICAgaWYgKGUgKyBlQmlhcyA+PSBlTWF4KSB7XG4gICAgICBtID0gMFxuICAgICAgZSA9IGVNYXhcbiAgICB9IGVsc2UgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICBtID0gKHZhbHVlICogYyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSBlICsgZUJpYXNcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHZhbHVlICogTWF0aC5wb3coMiwgZUJpYXMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gMFxuICAgIH1cbiAgfVxuXG4gIGZvciAoOyBtTGVuID49IDg7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IG0gJiAweGZmLCBpICs9IGQsIG0gLz0gMjU2LCBtTGVuIC09IDgpIHt9XG5cbiAgZSA9IChlIDw8IG1MZW4pIHwgbVxuICBlTGVuICs9IG1MZW5cbiAgZm9yICg7IGVMZW4gPiAwOyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBlICYgMHhmZiwgaSArPSBkLCBlIC89IDI1NiwgZUxlbiAtPSA4KSB7fVxuXG4gIGJ1ZmZlcltvZmZzZXQgKyBpIC0gZF0gfD0gcyAqIDEyOFxufVxuIiwiXG4vKipcbiAqIGlzQXJyYXlcbiAqL1xuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG5cbi8qKlxuICogdG9TdHJpbmdcbiAqL1xuXG52YXIgc3RyID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuLyoqXG4gKiBXaGV0aGVyIG9yIG5vdCB0aGUgZ2l2ZW4gYHZhbGBcbiAqIGlzIGFuIGFycmF5LlxuICpcbiAqIGV4YW1wbGU6XG4gKlxuICogICAgICAgIGlzQXJyYXkoW10pO1xuICogICAgICAgIC8vID4gdHJ1ZVxuICogICAgICAgIGlzQXJyYXkoYXJndW1lbnRzKTtcbiAqICAgICAgICAvLyA+IGZhbHNlXG4gKiAgICAgICAgaXNBcnJheSgnJyk7XG4gKiAgICAgICAgLy8gPiBmYWxzZVxuICpcbiAqIEBwYXJhbSB7bWl4ZWR9IHZhbFxuICogQHJldHVybiB7Ym9vbH1cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlzQXJyYXkgfHwgZnVuY3Rpb24gKHZhbCkge1xuICByZXR1cm4gISEgdmFsICYmICdbb2JqZWN0IEFycmF5XScgPT0gc3RyLmNhbGwodmFsKTtcbn07XG4iXX0=
