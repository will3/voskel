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
    src: '/images/icons/download_light.png',
    srcActive: '/images/icons/download_dark.png',
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
    onPick: function(obj) {
      var button = obj.button;

      if (button === 'plus') {
        editor.createNew();
      } else if (button === 'minus') {
        editor.removeSelected();
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
},{"./cpr":37}],43:[function(require,module,exports){
var panel = require('./panel');

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
      src: '/images/icons/plus_light.png',
      srcActive: '/images/icons/plus_dark.png',
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY2J1ZmZlci9jYnVmZmVyLmpzIiwibm9kZV9tb2R1bGVzL2dyZWVkeS1tZXNoZXIvZ3JlZWR5LmpzIiwibm9kZV9tb2R1bGVzL2dyZWVkeS1tZXNoZXIvbm9kZV9tb2R1bGVzL2lvdGEtYXJyYXkvaW90YS5qcyIsIm5vZGVfbW9kdWxlcy9ncmVlZHktbWVzaGVyL25vZGVfbW9kdWxlcy90eXBlZGFycmF5LXBvb2wvbm9kZV9tb2R1bGVzL2JpdC10d2lkZGxlL3R3aWRkbGUuanMiLCJub2RlX21vZHVsZXMvZ3JlZWR5LW1lc2hlci9ub2RlX21vZHVsZXMvdHlwZWRhcnJheS1wb29sL25vZGVfbW9kdWxlcy9kdXAvZHVwLmpzIiwibm9kZV9tb2R1bGVzL2dyZWVkeS1tZXNoZXIvbm9kZV9tb2R1bGVzL3R5cGVkYXJyYXktcG9vbC9wb29sLmpzIiwibm9kZV9tb2R1bGVzL2dyZWVkeS1tZXNoZXIvbm9kZV9tb2R1bGVzL3VuaXEvdW5pcS5qcyIsIm5vZGVfbW9kdWxlcy9rZXljb2RlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL21pbmltaXN0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL25kYXJyYXkvbmRhcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9uZGFycmF5L25vZGVfbW9kdWxlcy9pcy1idWZmZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcG9pbnQtaW4tcG9seWdvbi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zdGF0cy5qcy9zcmMvU3RhdHMuanMiLCJzcmMvYXNzZW1ibGllcy9hZWRpdG9yLmpzIiwic3JjL2Fzc2VtYmxpZXMvYWdyb3VuZC5qcyIsInNyYy9hc3NlbWJsaWVzL2FwbGF5ZXIuanMiLCJzcmMvY29tcG9uZW50cy9ibG9ja3MuanMiLCJzcmMvY29tcG9uZW50cy9jaGFyYWN0ZXIuanMiLCJzcmMvY29tcG9uZW50cy9wbGF5ZXJDYW1lcmEuanMiLCJzcmMvY29tcG9uZW50cy9wbGF5ZXJjb250cm9sLmpzIiwic3JjL2NvbXBvbmVudHMvcmlnaWRib2R5LmpzIiwic3JjL2NvcmUvYi5qcyIsInNyYy9jb3JlL2V2ZW50cy5qcyIsInNyYy9kYXRhL2NvbmZpZy5qc29uIiwic3JjL2RhdGEvcGFsZXR0ZS5qc29uIiwic3JjL2VkaXRvci9jb21tYW5kcy9ibG9ja2NvbW1hbmQuanMiLCJzcmMvZWRpdG9yL2NvbW1hbmRzL29mZnNldGNvbW1hbmQuanMiLCJzcmMvZWRpdG9yL2NvbW1hbmRzL3NlbGVjdGNvbW1hbmQuanMiLCJzcmMvZWRpdG9yL2NvbW1hbmRzL3NldGNvbW1hbmQuanMiLCJzcmMvZWRpdG9yL2RyYWdjYW1lcmEuanMiLCJzcmMvZWRpdG9yL2VkaXRvci5qcyIsInNyYy9lZGl0b3IvZWRpdG9yY29uc29sZS5qcyIsInNyYy9lZGl0b3IvZWRpdG9ydG9vbHMuanMiLCJzcmMvZWRpdG9yL2d1aS9hcnJvd2Jhci5qcyIsInNyYy9lZGl0b3IvZ3VpL2NvbG9yYmFyLmpzIiwic3JjL2VkaXRvci9ndWkvY3ByLmpzIiwic3JjL2VkaXRvci9ndWkvZmlsZWJhci5qcyIsInNyYy9lZGl0b3IvZ3VpL3BhbmVsLmpzIiwic3JjL2VkaXRvci9ndWkvcG9wdXAuanMiLCJzcmMvZWRpdG9yL2d1aS9wcmVmYWJzYmFyLmpzIiwic3JjL2VkaXRvci9ndWkvcHJlZmFic3Rvb2xiYXIuanMiLCJzcmMvZWRpdG9yL2d1aS9wcm9wZXJ0eXBhbmVsLmpzIiwic3JjL2VkaXRvci9ndWkvdG9vbGJhci5qcyIsInNyYy9lZGl0b3IvdG9vbHMvY2FtZXJhdG9vbC5qcyIsInNyYy9lZGl0b3IvdG9vbHMvZmlsbHRvb2wuanMiLCJzcmMvZWRpdG9yL3Rvb2xzL3BlbnRvb2wuanMiLCJzcmMvZWRpdG9yL3Rvb2xzL3NhbXBsZXRvb2wuanMiLCJzcmMvZWRpdG9yL3Rvb2xzL3NlbGVjdHRvb2wuanMiLCJzcmMvbWFpbi5qcyIsInNyYy9zZXJ2aWNlcy9kZXZjb25zb2xlLmpzIiwic3JjL3NlcnZpY2VzL21hdGVyaWFscy5qcyIsInNyYy9zZXJ2aWNlcy9wcmVmYWJzZXJ2aWNlLmpzIiwic3JjL3NlcnZpY2VzL3N0YXRzLmpzIiwic3JjL3N5c3RlbXMvaW5wdXQuanMiLCJzcmMvc3lzdGVtcy9yZW5kZXJlci5qcyIsInNyYy91dGlscy9hcnJheXV0aWxzLmpzIiwic3JjL3ZveGVsL2dyYXZpdHkuanMiLCJzcmMvdm94ZWwvZ3Jhdml0eXV0aWxzLmpzIiwic3JjL3ZveGVsL21lc2hlci5qcyIsInNyYy92b3hlbC92b3hlbC5qcyIsIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvaW5kZXguanMiLCIuLi8uLi8uLi8uLi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9iYXNlNjQtanMvbGliL2I2NC5qcyIsIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvbm9kZV9tb2R1bGVzL2llZWU3NTQvaW5kZXguanMiLCIuLi8uLi8uLi8uLi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pcy1hcnJheS9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3JOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3ZWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNwSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQy9OQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM5cEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25SQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzdLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpIHtcblxuZnVuY3Rpb24gQ0J1ZmZlcigpIHtcblx0Ly8gaGFuZGxlIGNhc2VzIHdoZXJlIFwibmV3XCIga2V5d29yZCB3YXNuJ3QgdXNlZFxuXHRpZiAoISh0aGlzIGluc3RhbmNlb2YgQ0J1ZmZlcikpIHtcblx0XHQvLyBtdWx0aXBsZSBjb25kaXRpb25zIG5lZWQgdG8gYmUgY2hlY2tlZCB0byBwcm9wZXJseSBlbXVsYXRlIEFycmF5XG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxIHx8IHR5cGVvZiBhcmd1bWVudHNbMF0gIT09ICdudW1iZXInKSB7XG5cdFx0XHRyZXR1cm4gQ0J1ZmZlci5hcHBseShuZXcgQ0J1ZmZlcihhcmd1bWVudHMubGVuZ3RoKSwgYXJndW1lbnRzKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIG5ldyBDQnVmZmVyKGFyZ3VtZW50c1swXSk7XG5cdFx0fVxuXHR9XG5cdC8vIGlmIG5vIGFyZ3VtZW50cywgdGhlbiBub3RoaW5nIG5lZWRzIHRvIGJlIHNldFxuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcblx0dGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIEFyZ3VtZW50OiBZb3UgbXVzdCBwYXNzIGEgdmFsaWQgYnVmZmVyIGxlbmd0aCcpO1xuXHQvLyB0aGlzIGlzIHRoZSBzYW1lIGluIGVpdGhlciBzY2VuYXJpb1xuXHR0aGlzLnNpemUgPSB0aGlzLnN0YXJ0ID0gMDtcblx0Ly8gc2V0IHRvIGNhbGxiYWNrIGZuIGlmIGRhdGEgaXMgYWJvdXQgdG8gYmUgb3ZlcndyaXR0ZW5cblx0dGhpcy5vdmVyZmxvdyA9IG51bGw7XG5cdC8vIGVtdWxhdGUgQXJyYXkgYmFzZWQgb24gcGFzc2VkIGFyZ3VtZW50c1xuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEgfHwgdHlwZW9mIGFyZ3VtZW50c1swXSAhPT0gJ251bWJlcicpIHtcblx0XHR0aGlzLmRhdGEgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCk7XG5cdFx0dGhpcy5lbmQgPSAodGhpcy5sZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoKSAtIDE7XG5cdFx0dGhpcy5wdXNoLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdH0gZWxzZSB7XG5cdFx0dGhpcy5kYXRhID0gbmV3IEFycmF5KGFyZ3VtZW50c1swXSk7XG5cdFx0dGhpcy5lbmQgPSAodGhpcy5sZW5ndGggPSBhcmd1bWVudHNbMF0pIC0gMTtcblx0fVxuXHQvLyBuZWVkIHRvIGByZXR1cm4gdGhpc2Agc28gYHJldHVybiBDQnVmZmVyLmFwcGx5YCB3b3Jrc1xuXHRyZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gZGVmYXVsdENvbXBhcml0b3IoYSwgYikge1xuXHRyZXR1cm4gYSA9PSBiID8gMCA6IGEgPiBiID8gMSA6IC0xO1xufVxuXG5DQnVmZmVyLnByb3RvdHlwZSA9IHtcblx0Ly8gcHJvcGVybHkgc2V0IGNvbnN0cnVjdG9yXG5cdGNvbnN0cnVjdG9yIDogQ0J1ZmZlcixcblxuXHQvKiBtdXRhdG9yIG1ldGhvZHMgKi9cblx0Ly8gcG9wIGxhc3QgaXRlbVxuXHRwb3AgOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGl0ZW07XG5cdFx0aWYgKHRoaXMuc2l6ZSA9PT0gMCkgcmV0dXJuO1xuXHRcdGl0ZW0gPSB0aGlzLmRhdGFbdGhpcy5lbmRdO1xuXHRcdC8vIHJlbW92ZSB0aGUgcmVmZXJlbmNlIHRvIHRoZSBvYmplY3Qgc28gaXQgY2FuIGJlIGdhcmJhZ2UgY29sbGVjdGVkXG5cdFx0ZGVsZXRlIHRoaXMuZGF0YVt0aGlzLmVuZF07XG5cdFx0dGhpcy5lbmQgPSAodGhpcy5lbmQgLSAxICsgdGhpcy5sZW5ndGgpICUgdGhpcy5sZW5ndGg7XG5cdFx0dGhpcy5zaXplLS07XG5cdFx0cmV0dXJuIGl0ZW07XG5cdH0sXG5cdC8vIHB1c2ggaXRlbSB0byB0aGUgZW5kXG5cdHB1c2ggOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGkgPSAwO1xuXHRcdC8vIGNoZWNrIGlmIG92ZXJmbG93IGlzIHNldCwgYW5kIGlmIGRhdGEgaXMgYWJvdXQgdG8gYmUgb3ZlcndyaXR0ZW5cblx0XHRpZiAodGhpcy5vdmVyZmxvdyAmJiB0aGlzLnNpemUgKyBhcmd1bWVudHMubGVuZ3RoID4gdGhpcy5sZW5ndGgpIHtcblx0XHRcdC8vIGNhbGwgb3ZlcmZsb3cgZnVuY3Rpb24gYW5kIHNlbmQgZGF0YSB0aGF0J3MgYWJvdXQgdG8gYmUgb3ZlcndyaXR0ZW5cblx0XHRcdGZvciAoOyBpIDwgdGhpcy5zaXplICsgYXJndW1lbnRzLmxlbmd0aCAtIHRoaXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0dGhpcy5vdmVyZmxvdyh0aGlzLmRhdGFbKHRoaXMuZW5kICsgaSArIDEpICUgdGhpcy5sZW5ndGhdLCB0aGlzKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0Ly8gcHVzaCBpdGVtcyB0byB0aGUgZW5kLCB3cmFwcGluZyBhbmQgZXJhc2luZyBleGlzdGluZyBpdGVtc1xuXHRcdC8vIHVzaW5nIGFyZ3VtZW50cyB2YXJpYWJsZSBkaXJlY3RseSB0byByZWR1Y2UgZ2MgZm9vdHByaW50XG5cdFx0Zm9yIChpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dGhpcy5kYXRhWyh0aGlzLmVuZCArIGkgKyAxKSAlIHRoaXMubGVuZ3RoXSA9IGFyZ3VtZW50c1tpXTtcblx0XHR9XG5cdFx0Ly8gcmVjYWxjdWxhdGUgc2l6ZVxuXHRcdGlmICh0aGlzLnNpemUgPCB0aGlzLmxlbmd0aCkge1xuXHRcdFx0aWYgKHRoaXMuc2l6ZSArIGkgPiB0aGlzLmxlbmd0aCkgdGhpcy5zaXplID0gdGhpcy5sZW5ndGg7XG5cdFx0XHRlbHNlIHRoaXMuc2l6ZSArPSBpO1xuXHRcdH1cblx0XHQvLyByZWNhbGN1bGF0ZSBlbmRcblx0XHR0aGlzLmVuZCA9ICh0aGlzLmVuZCArIGkpICUgdGhpcy5sZW5ndGg7XG5cdFx0Ly8gcmVjYWxjdWxhdGUgc3RhcnRcblx0XHR0aGlzLnN0YXJ0ID0gKHRoaXMubGVuZ3RoICsgdGhpcy5lbmQgLSB0aGlzLnNpemUgKyAxKSAlIHRoaXMubGVuZ3RoO1xuXHRcdC8vIHJldHVybiBudW1iZXIgY3VycmVudCBudW1iZXIgb2YgaXRlbXMgaW4gQ0J1ZmZlclxuXHRcdHJldHVybiB0aGlzLnNpemU7XG5cdH0sXG5cdC8vIHJldmVyc2Ugb3JkZXIgb2YgdGhlIGJ1ZmZlclxuXHRyZXZlcnNlIDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpID0gMCxcblx0XHRcdHRtcDtcblx0XHRmb3IgKDsgaSA8IH5+KHRoaXMuc2l6ZSAvIDIpOyBpKyspIHtcblx0XHRcdHRtcCA9IHRoaXMuZGF0YVsodGhpcy5zdGFydCArIGkpICUgdGhpcy5sZW5ndGhdO1xuXHRcdFx0dGhpcy5kYXRhWyh0aGlzLnN0YXJ0ICsgaSkgJSB0aGlzLmxlbmd0aF0gPSB0aGlzLmRhdGFbKHRoaXMuc3RhcnQgKyAodGhpcy5zaXplIC0gaSAtIDEpKSAlIHRoaXMubGVuZ3RoXTtcblx0XHRcdHRoaXMuZGF0YVsodGhpcy5zdGFydCArICh0aGlzLnNpemUgLSBpIC0gMSkpICUgdGhpcy5sZW5ndGhdID0gdG1wO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0Ly8gcm90YXRlIGJ1ZmZlciB0byB0aGUgbGVmdCBieSBjbnRyLCBvciBieSAxXG5cdHJvdGF0ZUxlZnQgOiBmdW5jdGlvbiAoY250cikge1xuXHRcdGlmICh0eXBlb2YgY250ciA9PT0gJ3VuZGVmaW5lZCcpIGNudHIgPSAxO1xuXHRcdGlmICh0eXBlb2YgY250ciAhPT0gJ251bWJlcicpIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IG11c3QgYmUgYSBudW1iZXJcIik7XG5cdFx0d2hpbGUgKC0tY250ciA+PSAwKSB7XG5cdFx0XHR0aGlzLnB1c2godGhpcy5zaGlmdCgpKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdC8vIHJvdGF0ZSBidWZmZXIgdG8gdGhlIHJpZ2h0IGJ5IGNudHIsIG9yIGJ5IDFcblx0cm90YXRlUmlnaHQgOiBmdW5jdGlvbiAoY250cikge1xuXHRcdGlmICh0eXBlb2YgY250ciA9PT0gJ3VuZGVmaW5lZCcpIGNudHIgPSAxO1xuXHRcdGlmICh0eXBlb2YgY250ciAhPT0gJ251bWJlcicpIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IG11c3QgYmUgYSBudW1iZXJcIik7XG5cdFx0d2hpbGUgKC0tY250ciA+PSAwKSB7XG5cdFx0XHR0aGlzLnVuc2hpZnQodGhpcy5wb3AoKSk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHQvLyByZW1vdmUgYW5kIHJldHVybiBmaXJzdCBpdGVtXG5cdHNoaWZ0IDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpdGVtO1xuXHRcdC8vIGNoZWNrIGlmIHRoZXJlIGFyZSBhbnkgaXRlbXMgaW4gQ0J1ZmZcblx0XHRpZiAodGhpcy5zaXplID09PSAwKSByZXR1cm47XG5cdFx0Ly8gc3RvcmUgZmlyc3QgaXRlbSBmb3IgcmV0dXJuXG5cdFx0aXRlbSA9IHRoaXMuZGF0YVt0aGlzLnN0YXJ0XTtcblx0XHQvLyByZWNhbGN1bGF0ZSBzdGFydCBvZiBDQnVmZmVyXG5cdFx0dGhpcy5zdGFydCA9ICh0aGlzLnN0YXJ0ICsgMSkgJSB0aGlzLmxlbmd0aDtcblx0XHQvLyBkZWNyZW1lbnQgc2l6ZVxuXHRcdHRoaXMuc2l6ZS0tO1xuXHRcdHJldHVybiBpdGVtO1xuXHR9LFxuXHQvLyBzb3J0IGl0ZW1zXG5cdHNvcnQgOiBmdW5jdGlvbiAoZm4pIHtcblx0XHR0aGlzLmRhdGEuc29ydChmbiB8fCBkZWZhdWx0Q29tcGFyaXRvcik7XG5cdFx0dGhpcy5zdGFydCA9IDA7XG5cdFx0dGhpcy5lbmQgPSB0aGlzLnNpemUgLSAxO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHQvLyBhZGQgaXRlbSB0byBiZWdpbm5pbmcgb2YgYnVmZmVyXG5cdHVuc2hpZnQgOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGkgPSAwO1xuXHRcdC8vIGNoZWNrIGlmIG92ZXJmbG93IGlzIHNldCwgYW5kIGlmIGRhdGEgaXMgYWJvdXQgdG8gYmUgb3ZlcndyaXR0ZW5cblx0XHRpZiAodGhpcy5vdmVyZmxvdyAmJiB0aGlzLnNpemUgKyBhcmd1bWVudHMubGVuZ3RoID4gdGhpcy5sZW5ndGgpIHtcblx0XHRcdC8vIGNhbGwgb3ZlcmZsb3cgZnVuY3Rpb24gYW5kIHNlbmQgZGF0YSB0aGF0J3MgYWJvdXQgdG8gYmUgb3ZlcndyaXR0ZW5cblx0XHRcdGZvciAoOyBpIDwgdGhpcy5zaXplICsgYXJndW1lbnRzLmxlbmd0aCAtIHRoaXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0dGhpcy5vdmVyZmxvdyh0aGlzLmRhdGFbdGhpcy5lbmQgLSAoaSAlIHRoaXMubGVuZ3RoKV0sIHRoaXMpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRmb3IgKGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0aGlzLmRhdGFbKHRoaXMubGVuZ3RoICsgdGhpcy5zdGFydCAtIChpICUgdGhpcy5sZW5ndGgpIC0gMSkgJSB0aGlzLmxlbmd0aF0gPSBhcmd1bWVudHNbaV07XG5cdFx0fVxuXHRcdGlmICh0aGlzLmxlbmd0aCAtIHRoaXMuc2l6ZSAtIGkgPCAwKSB7XG5cdFx0XHR0aGlzLmVuZCArPSB0aGlzLmxlbmd0aCAtIHRoaXMuc2l6ZSAtIGk7XG5cdFx0XHRpZiAodGhpcy5lbmQgPCAwKSB0aGlzLmVuZCA9IHRoaXMubGVuZ3RoICsgKHRoaXMuZW5kICUgdGhpcy5sZW5ndGgpO1xuXHRcdH1cblx0XHRpZiAodGhpcy5zaXplIDwgdGhpcy5sZW5ndGgpIHtcblx0XHRcdGlmICh0aGlzLnNpemUgKyBpID4gdGhpcy5sZW5ndGgpIHRoaXMuc2l6ZSA9IHRoaXMubGVuZ3RoO1xuXHRcdFx0ZWxzZSB0aGlzLnNpemUgKz0gaTtcblx0XHR9XG5cdFx0dGhpcy5zdGFydCAtPSBhcmd1bWVudHMubGVuZ3RoO1xuXHRcdGlmICh0aGlzLnN0YXJ0IDwgMCkgdGhpcy5zdGFydCA9IHRoaXMubGVuZ3RoICsgKHRoaXMuc3RhcnQgJSB0aGlzLmxlbmd0aCk7XG5cdFx0cmV0dXJuIHRoaXMuc2l6ZTtcblx0fSxcblxuXHQvKiBhY2Nlc3NvciBtZXRob2RzICovXG5cdC8vIHJldHVybiBpbmRleCBvZiBmaXJzdCBtYXRjaGVkIGVsZW1lbnRcblx0aW5kZXhPZiA6IGZ1bmN0aW9uIChhcmcsIGlkeCkge1xuXHRcdGlmICghaWR4KSBpZHggPSAwO1xuXHRcdGZvciAoOyBpZHggPCB0aGlzLnNpemU7IGlkeCsrKSB7XG5cdFx0XHRpZiAodGhpcy5kYXRhWyh0aGlzLnN0YXJ0ICsgaWR4KSAlIHRoaXMubGVuZ3RoXSA9PT0gYXJnKSByZXR1cm4gaWR4O1xuXHRcdH1cblx0XHRyZXR1cm4gLTE7XG5cdH0sXG5cdC8vIHJldHVybiBsYXN0IGluZGV4IG9mIHRoZSBmaXJzdCBtYXRjaFxuXHRsYXN0SW5kZXhPZiA6IGZ1bmN0aW9uIChhcmcsIGlkeCkge1xuXHRcdGlmICghaWR4KSBpZHggPSB0aGlzLnNpemUgLSAxO1xuXHRcdGZvciAoOyBpZHggPj0gMDsgaWR4LS0pIHtcblx0XHRcdGlmICh0aGlzLmRhdGFbKHRoaXMuc3RhcnQgKyBpZHgpICUgdGhpcy5sZW5ndGhdID09PSBhcmcpIHJldHVybiBpZHg7XG5cdFx0fVxuXHRcdHJldHVybiAtMTtcblx0fSxcblxuXHQvLyByZXR1cm4gdGhlIGluZGV4IGFuIGl0ZW0gd291bGQgYmUgaW5zZXJ0ZWQgdG8gaWYgdGhpc1xuXHQvLyBpcyBhIHNvcnRlZCBjaXJjdWxhciBidWZmZXJcblx0c29ydGVkSW5kZXggOiBmdW5jdGlvbih2YWx1ZSwgY29tcGFyaXRvciwgY29udGV4dCkge1xuXHRcdGNvbXBhcml0b3IgPSBjb21wYXJpdG9yIHx8IGRlZmF1bHRDb21wYXJpdG9yO1xuXHRcdHZhciBsb3cgPSB0aGlzLnN0YXJ0LFxuXHRcdFx0aGlnaCA9IHRoaXMuc2l6ZSAtIDE7XG5cblx0XHQvLyBUcmlja3kgcGFydCBpcyBmaW5kaW5nIGlmIGl0cyBiZWZvcmUgb3IgYWZ0ZXIgdGhlIHBpdm90XG5cdFx0Ly8gd2UgY2FuIGdldCB0aGlzIGluZm8gYnkgY2hlY2tpbmcgaWYgdGhlIHRhcmdldCBpcyBsZXNzIHRoYW5cblx0XHQvLyB0aGUgbGFzdCBpdGVtLiBBZnRlciB0aGF0IGl0J3MganVzdCBhIHR5cGljYWwgYmluYXJ5IHNlYXJjaC5cblx0XHRpZiAobG93ICYmIGNvbXBhcml0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgdGhpcy5kYXRhW2hpZ2hdKSA+IDApIHtcblx0XHRcdGxvdyA9IDAsIGhpZ2ggPSB0aGlzLmVuZDtcblx0XHR9XG5cblx0XHR3aGlsZSAobG93IDwgaGlnaCkge1xuXHRcdCAgdmFyIG1pZCA9IChsb3cgKyBoaWdoKSA+Pj4gMTtcblx0XHQgIGlmIChjb21wYXJpdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIHRoaXMuZGF0YVttaWRdKSA+IDApIGxvdyA9IG1pZCArIDE7XG5cdFx0ICBlbHNlIGhpZ2ggPSBtaWQ7XG5cdFx0fVxuXHRcdC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzE4NjE4MjczLzE1MTc5MTlcblx0XHRyZXR1cm4gKCgobG93IC0gdGhpcy5zdGFydCkgJSB0aGlzLnNpemUpICsgdGhpcy5zaXplKSAlIHRoaXMuc2l6ZTtcblx0fSxcblxuXHQvKiBpdGVyYXRpb24gbWV0aG9kcyAqL1xuXHQvLyBjaGVjayBldmVyeSBpdGVtIGluIHRoZSBhcnJheSBhZ2FpbnN0IGEgdGVzdFxuXHRldmVyeSA6IGZ1bmN0aW9uIChjYWxsYmFjaywgY29udGV4dCkge1xuXHRcdHZhciBpID0gMDtcblx0XHRmb3IgKDsgaSA8IHRoaXMuc2l6ZTsgaSsrKSB7XG5cdFx0XHRpZiAoIWNhbGxiYWNrLmNhbGwoY29udGV4dCwgdGhpcy5kYXRhWyh0aGlzLnN0YXJ0ICsgaSkgJSB0aGlzLmxlbmd0aF0sIGksIHRoaXMpKVxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdHJldHVybiB0cnVlO1xuXHR9LFxuXHQvLyBsb29wIHRocm91Z2ggZWFjaCBpdGVtIGluIGJ1ZmZlclxuXHQvLyBUT0RPOiBmaWd1cmUgb3V0IGhvdyB0byBlbXVsYXRlIEFycmF5IHVzZSBiZXR0ZXJcblx0Zm9yRWFjaCA6IGZ1bmN0aW9uIChjYWxsYmFjaywgY29udGV4dCkge1xuXHRcdHZhciBpID0gMDtcblx0XHRmb3IgKDsgaSA8IHRoaXMuc2l6ZTsgaSsrKSB7XG5cdFx0XHRjYWxsYmFjay5jYWxsKGNvbnRleHQsIHRoaXMuZGF0YVsodGhpcy5zdGFydCArIGkpICUgdGhpcy5sZW5ndGhdLCBpLCB0aGlzKTtcblx0XHR9XG5cdH0sXG5cdC8vIGNoZWNrIGl0ZW1zIGFnYWlucyB0ZXN0IHVudGlsIG9uZSByZXR1cm5zIHRydWVcblx0Ly8gVE9ETzogZmlndXJlIG91dCBob3cgdG8gZW11bGRhdGUgQXJyYXkgdXNlIGJldHRlclxuXHRzb21lIDogZnVuY3Rpb24gKGNhbGxiYWNrLCBjb250ZXh0KSB7XG5cdFx0dmFyIGkgPSAwO1xuXHRcdGZvciAoOyBpIDwgdGhpcy5zaXplOyBpKyspIHtcblx0XHRcdGlmIChjYWxsYmFjay5jYWxsKGNvbnRleHQsIHRoaXMuZGF0YVsodGhpcy5zdGFydCArIGkpICUgdGhpcy5sZW5ndGhdLCBpLCB0aGlzKSlcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fSxcblx0Ly8gY2FsY3VsYXRlIHRoZSBhdmVyYWdlIHZhbHVlIG9mIGEgY2lyY3VsYXIgYnVmZmVyXG5cdGF2ZyA6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpcy5zaXplID09IDAgPyAwIDogKHRoaXMuc3VtKCkgLyB0aGlzLnNpemUpO1xuXHR9LFxuXHQvLyBsb29wIHRocm91Z2ggZWFjaCBpdGVtIGluIGJ1ZmZlciBhbmQgY2FsY3VsYXRlIHN1bVxuXHRzdW0gOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGluZGV4ID0gdGhpcy5zaXplO1xuXHRcdHZhciBzID0gMDtcblx0XHR3aGlsZSAoaW5kZXgtLSkgcyArPSB0aGlzLmRhdGFbaW5kZXhdO1xuXHRcdHJldHVybiBzO1xuXHR9LFxuXHQvLyBsb29wIHRocm91Z2ggZWFjaCBpdGVtIGluIGJ1ZmZlciBhbmQgY2FsY3VsYXRlIG1lZGlhblxuXHRtZWRpYW4gOiBmdW5jdGlvbiAoKSB7XG5cdFx0aWYgKHRoaXMuc2l6ZSA9PT0gMClcblx0XHRcdHJldHVybiAwO1xuXHRcdHZhciB2YWx1ZXMgPSB0aGlzLnNsaWNlKCkuc29ydChkZWZhdWx0Q29tcGFyaXRvcik7XG5cdFx0dmFyIGhhbGYgPSBNYXRoLmZsb29yKHZhbHVlcy5sZW5ndGggLyAyKTtcblx0XHRpZih2YWx1ZXMubGVuZ3RoICUgMilcblx0XHRcdHJldHVybiB2YWx1ZXNbaGFsZl07XG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuICh2YWx1ZXNbaGFsZi0xXSArIHZhbHVlc1toYWxmXSkgLyAyLjA7XG5cdH0sXG5cdC8qIHV0aWxpdHkgbWV0aG9kcyAqL1xuXHQvLyByZXNldCBwb2ludGVycyB0byBidWZmZXIgd2l0aCB6ZXJvIGl0ZW1zXG5cdC8vIG5vdGU6IHRoaXMgd2lsbCBub3QgcmVtb3ZlIHZhbHVlcyBpbiBjYnVmZmVyLCBzbyBpZiBmb3Igc2VjdXJpdHkgdmFsdWVzXG5cdC8vICAgICAgIG5lZWQgdG8gYmUgb3ZlcndyaXR0ZW4sIHJ1biBgLmZpbGwobnVsbCkuZW1wdHkoKWBcblx0ZW1wdHkgOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGkgPSAwO1xuXHRcdHRoaXMuc2l6ZSA9IHRoaXMuc3RhcnQgPSAwO1xuXHRcdHRoaXMuZW5kID0gdGhpcy5sZW5ndGggLSAxO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHQvLyBmaWxsIGFsbCBwbGFjZXMgd2l0aCBwYXNzZWQgdmFsdWUgb3IgZnVuY3Rpb25cblx0ZmlsbCA6IGZ1bmN0aW9uIChhcmcpIHtcblx0XHR2YXIgaSA9IDA7XG5cdFx0aWYgKHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdHdoaWxlKHRoaXMuZGF0YVtpXSA9IGFyZygpLCArK2kgPCB0aGlzLmxlbmd0aCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHdoaWxlKHRoaXMuZGF0YVtpXSA9IGFyZywgKytpIDwgdGhpcy5sZW5ndGgpO1xuXHRcdH1cblx0XHQvLyByZXBvc2l0aW9uIHN0YXJ0L2VuZFxuXHRcdHRoaXMuc3RhcnQgPSAwO1xuXHRcdHRoaXMuZW5kID0gdGhpcy5sZW5ndGggLSAxO1xuXHRcdHRoaXMuc2l6ZSA9IHRoaXMubGVuZ3RoO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHQvLyByZXR1cm4gZmlyc3QgaXRlbSBpbiBidWZmZXJcblx0Zmlyc3QgOiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuZGF0YVt0aGlzLnN0YXJ0XTtcblx0fSxcblx0Ly8gcmV0dXJuIGxhc3QgaXRlbSBpbiBidWZmZXJcblx0bGFzdCA6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpcy5kYXRhW3RoaXMuZW5kXTtcblx0fSxcblx0Ly8gcmV0dXJuIHNwZWNpZmljIGluZGV4IGluIGJ1ZmZlclxuXHRnZXQgOiBmdW5jdGlvbiAoYXJnKSB7XG5cdFx0cmV0dXJuIHRoaXMuZGF0YVsodGhpcy5zdGFydCArIGFyZykgJSB0aGlzLmxlbmd0aF07XG5cdH0sXG5cdGlzRnVsbCA6IGZ1bmN0aW9uIChhcmcpIHtcblx0XHRyZXR1cm4gdGhpcy5sZW5ndGggPT09IHRoaXMuc2l6ZTtcblx0fSxcblx0Ly8gc2V0IHZhbHVlIGF0IHNwZWNpZmllZCBpbmRleFxuXHRzZXQgOiBmdW5jdGlvbiAoaWR4LCBhcmcpIHtcblx0XHRyZXR1cm4gdGhpcy5kYXRhWyh0aGlzLnN0YXJ0ICsgaWR4KSAlIHRoaXMubGVuZ3RoXSA9IGFyZztcblx0fSxcblx0Ly8gcmV0dXJuIGNsZWFuIGFycmF5IG9mIHZhbHVlc1xuXHR0b0FycmF5IDogZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLnNsaWNlKCk7XG5cdH0sXG5cdC8vIHNsaWNlIHRoZSBidWZmZXIgdG8gYW4gYXJyYWF5XG5cdHNsaWNlIDogZnVuY3Rpb24gKHN0YXJ0LCBlbmQpIHtcblx0XHR2YXIgbGVuZ3RoID0gdGhpcy5zaXplO1xuXG5cdFx0c3RhcnQgPSArc3RhcnQgfHwgMDtcblxuXHRcdGlmIChzdGFydCA8IDApIHtcblx0XHRcdGlmIChzdGFydCA+PSBlbmQpXG5cdFx0XHRcdHJldHVybiBbXTtcblx0XHRcdHN0YXJ0ID0gKC1zdGFydCA+IGxlbmd0aCkgPyAwIDogbGVuZ3RoICsgc3RhcnQ7XG5cdFx0fVxuXG5cdFx0aWYgKGVuZCA9PSBudWxsIHx8IGVuZCA+IGxlbmd0aClcblx0XHRcdGVuZCA9IGxlbmd0aDtcblx0XHRlbHNlIGlmIChlbmQgPCAwKVxuXHRcdFx0ZW5kICs9IGxlbmd0aDtcblx0XHRlbHNlXG5cdFx0XHRlbmQgPSArZW5kIHx8IDA7XG5cblx0XHRsZW5ndGggPSBzdGFydCA8IGVuZCA/IGVuZCAtIHN0YXJ0IDogMDtcblxuXHRcdHZhciByZXN1bHQgPSBBcnJheShsZW5ndGgpO1xuXHRcdGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcblx0XHRcdHJlc3VsdFtpbmRleF0gPSB0aGlzLmRhdGFbKHRoaXMuc3RhcnQgKyBzdGFydCArIGluZGV4KSAlIHRoaXMubGVuZ3RoXTtcblx0XHR9XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxufTtcblxuaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSBtb2R1bGUuZXhwb3J0cyA9IENCdWZmZXI7XG5lbHNlIGdsb2JhbC5DQnVmZmVyID0gQ0J1ZmZlcjtcblxufSh0aGlzKSk7XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgcG9vbCA9IHJlcXVpcmUoXCJ0eXBlZGFycmF5LXBvb2xcIilcbnZhciB1bmlxID0gcmVxdWlyZShcInVuaXFcIilcbnZhciBpb3RhID0gcmVxdWlyZShcImlvdGEtYXJyYXlcIilcblxuZnVuY3Rpb24gZ2VuZXJhdGVNZXNoZXIob3JkZXIsIHNraXAsIG1lcmdlLCBhcHBlbmQsIG51bV9vcHRpb25zLCBvcHRpb25zLCB1c2VHZXR0ZXIpIHtcbiAgdmFyIGNvZGUgPSBbXVxuICB2YXIgZCA9IG9yZGVyLmxlbmd0aFxuICB2YXIgaSwgaiwga1xuICBcbiAgLy9CdWlsZCBhcmd1bWVudHMgZm9yIGFwcGVuZCBtYWNyb1xuICB2YXIgYXBwZW5kX2FyZ3MgPSBuZXcgQXJyYXkoMipkKzErbnVtX29wdGlvbnMpXG4gIGZvcihpPTA7IGk8ZDsgKytpKSB7XG4gICAgYXBwZW5kX2FyZ3NbaV0gPSBcImlcIitpXG4gIH1cbiAgZm9yKGk9MDsgaTxkOyArK2kpIHtcbiAgICBhcHBlbmRfYXJnc1tpK2RdID0gXCJqXCIraVxuICB9XG4gIGFwcGVuZF9hcmdzWzIqZF0gPSBcIm92YWxcIlxuICBcbiAgdmFyIG9wdF9hcmdzID0gbmV3IEFycmF5KG51bV9vcHRpb25zKVxuICBmb3IoaT0wOyBpPG51bV9vcHRpb25zOyArK2kpIHtcbiAgICBvcHRfYXJnc1tpXSA9IFwib3B0XCIraVxuICAgIGFwcGVuZF9hcmdzWzIqZCsxK2ldID0gXCJvcHRcIitpXG4gIH1cblxuICAvL1VucGFjayBzdHJpZGUgYW5kIHNoYXBlIGFycmF5cyBpbnRvIHZhcmlhYmxlc1xuICBjb2RlLnB1c2goXCJ2YXIgZGF0YT1hcnJheS5kYXRhLG9mZnNldD1hcnJheS5vZmZzZXQsc2hhcGU9YXJyYXkuc2hhcGUsc3RyaWRlPWFycmF5LnN0cmlkZVwiKVxuICBmb3IodmFyIGk9MDsgaTxkOyArK2kpIHtcbiAgICBjb2RlLnB1c2goW1widmFyIHN0cmlkZVwiLGksXCI9c3RyaWRlW1wiLG9yZGVyW2ldLFwiXXwwLHNoYXBlXCIsaSxcIj1zaGFwZVtcIixvcmRlcltpXSxcIl18MFwiXS5qb2luKFwiXCIpKVxuICAgIGlmKGkgPiAwKSB7XG4gICAgICBjb2RlLnB1c2goW1widmFyIGFzdGVwXCIsaSxcIj0oc3RyaWRlXCIsaSxcIi1zdHJpZGVcIixpLTEsXCIqc2hhcGVcIixpLTEsXCIpfDBcIl0uam9pbihcIlwiKSlcbiAgICB9IGVsc2Uge1xuICAgICAgY29kZS5wdXNoKFtcInZhciBhc3RlcFwiLGksXCI9c3RyaWRlXCIsaSxcInwwXCJdLmpvaW4oXCJcIikpXG4gICAgfVxuICAgIGlmKGkgPiAwKSB7XG4gICAgICBjb2RlLnB1c2goW1widmFyIHZzdGVwXCIsaSxcIj0odnN0ZXBcIixpLTEsXCIqc2hhcGVcIixpLTEsXCIpfDBcIl0uam9pbihcIlwiKSlcbiAgICB9IGVsc2Uge1xuICAgICAgY29kZS5wdXNoKFtcInZhciB2c3RlcFwiLGksXCI9MVwiXS5qb2luKFwiXCIpKVxuICAgIH1cbiAgICBjb2RlLnB1c2goW1widmFyIGlcIixpLFwiPTAsalwiLGksXCI9MCxrXCIsaSxcIj0wLHVzdGVwXCIsaSxcIj12c3RlcFwiLGksXCJ8MCxic3RlcFwiLGksXCI9YXN0ZXBcIixpLFwifDBcIl0uam9pbihcIlwiKSlcbiAgfVxuICBcbiAgLy9Jbml0aWFsaXplIHBvaW50ZXJzXG4gIGNvZGUucHVzaChcInZhciBhX3B0cj1vZmZzZXQ+Pj4wLGJfcHRyPTAsdV9wdHI9MCx2X3B0cj0wLGk9MCxkPTAsdmFsPTAsb3ZhbD0wXCIpXG4gIFxuICAvL0luaXRpYWxpemUgY291bnRcbiAgY29kZS5wdXNoKFwidmFyIGNvdW50PVwiICsgaW90YShkKS5tYXAoZnVuY3Rpb24oaSkgeyByZXR1cm4gXCJzaGFwZVwiK2l9KS5qb2luKFwiKlwiKSlcbiAgY29kZS5wdXNoKFwidmFyIHZpc2l0ZWQ9bWFsbG9jVWludDgoY291bnQpXCIpXG4gIFxuICAvL1plcm8gb3V0IHZpc2l0ZWQgbWFwXG4gIGNvZGUucHVzaChcImZvcig7aTxjb3VudDsrK2kpe3Zpc2l0ZWRbaV09MH1cIilcbiAgXG4gIC8vQmVnaW4gdHJhdmVyc2FsXG4gIGZvcihpPWQtMTsgaT49MDsgLS1pKSB7XG4gICAgY29kZS5wdXNoKFtcImZvcihpXCIsaSxcIj0wO2lcIixpLFwiPHNoYXBlXCIsaSxcIjsrK2lcIixpLFwiKXtcIl0uam9pbihcIlwiKSlcbiAgfVxuICBjb2RlLnB1c2goXCJpZighdmlzaXRlZFt2X3B0cl0pe1wiKVxuICBcbiAgICBpZih1c2VHZXR0ZXIpIHtcbiAgICAgIGNvZGUucHVzaChcInZhbD1kYXRhLmdldChhX3B0cilcIilcbiAgICB9IGVsc2Uge1xuICAgICAgY29kZS5wdXNoKFwidmFsPWRhdGFbYV9wdHJdXCIpXG4gICAgfVxuICBcbiAgICBpZihza2lwKSB7XG4gICAgICBjb2RlLnB1c2goXCJpZighc2tpcCh2YWwpKXtcIilcbiAgICB9IGVsc2Uge1xuICAgICAgY29kZS5wdXNoKFwiaWYodmFsIT09MCl7XCIpXG4gICAgfVxuICBcbiAgICAgIC8vU2F2ZSB2YWwgdG8gb3ZhbFxuICAgICAgY29kZS5wdXNoKFwib3ZhbCA9IHZhbFwiKVxuICBcbiAgICAgIC8vR2VuZXJhdGUgbWVyZ2luZyBjb2RlXG4gICAgICBmb3IoaT0wOyBpPGQ7ICsraSkge1xuICAgICAgICBjb2RlLnB1c2goXCJ1X3B0cj12X3B0cit2c3RlcFwiK2kpXG4gICAgICAgIGNvZGUucHVzaChcImJfcHRyPWFfcHRyK3N0cmlkZVwiK2kpXG4gICAgICAgIGNvZGUucHVzaChbXCJqXCIsaSxcIl9sb29wOiBmb3IoalwiLGksXCI9MStpXCIsaSxcIjtqXCIsaSxcIjxzaGFwZVwiLGksXCI7KytqXCIsaSxcIil7XCJdLmpvaW4oXCJcIikpXG4gICAgICAgIGZvcihqPWktMTsgaj49MDsgLS1qKSB7XG4gICAgICAgICAgY29kZS5wdXNoKFtcImZvcihrXCIsaixcIj1pXCIsaixcIjtrXCIsaixcIjxqXCIsaixcIjsrK2tcIixqLFwiKXtcIl0uam9pbihcIlwiKSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgICAvL0NoZWNrIGlmIHdlIGNhbiBtZXJnZSB0aGlzIHZveGVsXG4gICAgICAgICAgY29kZS5wdXNoKFwiaWYodmlzaXRlZFt1X3B0cl0pIHsgYnJlYWsgalwiK2krXCJfbG9vcDsgfVwiKVxuICAgICAgICBcbiAgICAgICAgICBpZih1c2VHZXR0ZXIpIHtcbiAgICAgICAgICAgIGNvZGUucHVzaChcInZhbD1kYXRhLmdldChiX3B0cilcIilcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29kZS5wdXNoKFwidmFsPWRhdGFbYl9wdHJdXCIpXG4gICAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgICBpZihza2lwICYmIG1lcmdlKSB7XG4gICAgICAgICAgICBjb2RlLnB1c2goXCJpZihza2lwKHZhbCkgfHwgIW1lcmdlKG92YWwsdmFsKSl7IGJyZWFrIGpcIitpK1wiX2xvb3A7IH1cIilcbiAgICAgICAgICB9IGVsc2UgaWYoc2tpcCkge1xuICAgICAgICAgICAgY29kZS5wdXNoKFwiaWYoc2tpcCh2YWwpIHx8IHZhbCAhPT0gb3ZhbCl7IGJyZWFrIGpcIitpK1wiX2xvb3A7IH1cIilcbiAgICAgICAgICB9IGVsc2UgaWYobWVyZ2UpIHtcbiAgICAgICAgICAgIGNvZGUucHVzaChcImlmKHZhbCA9PT0gMCB8fCAhbWVyZ2Uob3ZhbCx2YWwpKXsgYnJlYWsgalwiK2krXCJfbG9vcDsgfVwiKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb2RlLnB1c2goXCJpZih2YWwgPT09IDAgfHwgdmFsICE9PSBvdmFsKXsgYnJlYWsgalwiK2krXCJfbG9vcDsgfVwiKVxuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAvL0Nsb3NlIG9mZiBsb29wIGJvZGllc1xuICAgICAgICAgIGNvZGUucHVzaChcIisrdV9wdHJcIilcbiAgICAgICAgICBjb2RlLnB1c2goXCJiX3B0cis9c3RyaWRlMFwiKVxuICAgICAgICBjb2RlLnB1c2goXCJ9XCIpXG4gICAgICAgIFxuICAgICAgICBmb3Ioaj0xOyBqPD1pOyArK2opIHtcbiAgICAgICAgICBjb2RlLnB1c2goXCJ1X3B0cis9dXN0ZXBcIitqKVxuICAgICAgICAgIGNvZGUucHVzaChcImJfcHRyKz1ic3RlcFwiK2opXG4gICAgICAgICAgY29kZS5wdXNoKFwifVwiKVxuICAgICAgICB9XG4gICAgICAgIGlmKGkgPCBkLTEpIHtcbiAgICAgICAgICBjb2RlLnB1c2goXCJkPWpcIitpK1wiLWlcIitpKVxuICAgICAgICAgIGNvZGUucHVzaChbXCJ1c3RlcFwiLGkrMSxcIj0odnN0ZXBcIixpKzEsXCItdnN0ZXBcIixpLFwiKmQpfDBcIl0uam9pbihcIlwiKSlcbiAgICAgICAgICBjb2RlLnB1c2goW1wiYnN0ZXBcIixpKzEsXCI9KHN0cmlkZVwiLGkrMSxcIi1zdHJpZGVcIixpLFwiKmQpfDBcIl0uam9pbihcIlwiKSlcbiAgICAgICAgfVxuICAgICAgfVxuICBcbiAgICAgIC8vTWFyayBvZmYgdmlzaXRlZCB0YWJsZVxuICAgICAgY29kZS5wdXNoKFwidV9wdHI9dl9wdHJcIilcbiAgICAgIGZvcihpPWQtMTsgaT49MDsgLS1pKSB7XG4gICAgICAgIGNvZGUucHVzaChbXCJmb3Ioa1wiLGksXCI9aVwiLGksXCI7a1wiLGksXCI8alwiLGksXCI7KytrXCIsaSxcIil7XCJdLmpvaW4oXCJcIikpXG4gICAgICB9XG4gICAgICBjb2RlLnB1c2goXCJ2aXNpdGVkW3VfcHRyKytdPTFcIilcbiAgICAgIGNvZGUucHVzaChcIn1cIilcbiAgICAgIGZvcihpPTE7IGk8ZDsgKytpKSB7XG4gICAgICAgIGNvZGUucHVzaChcInVfcHRyKz11c3RlcFwiK2kpXG4gICAgICAgIGNvZGUucHVzaChcIn1cIilcbiAgICAgIH1cbiAgXG4gICAgICAvL0FwcGVuZCBjaHVuayB0byBtZXNoXG4gICAgICBjb2RlLnB1c2goXCJhcHBlbmQoXCIrIGFwcGVuZF9hcmdzLmpvaW4oXCIsXCIpKyBcIilcIilcbiAgICBcbiAgICBjb2RlLnB1c2goXCJ9XCIpXG4gIGNvZGUucHVzaChcIn1cIilcbiAgY29kZS5wdXNoKFwiKyt2X3B0clwiKVxuICBmb3IodmFyIGk9MDsgaTxkOyArK2kpIHtcbiAgICBjb2RlLnB1c2goXCJhX3B0cis9YXN0ZXBcIitpKVxuICAgIGNvZGUucHVzaChcIn1cIilcbiAgfVxuICBcbiAgY29kZS5wdXNoKFwiZnJlZVVpbnQ4KHZpc2l0ZWQpXCIpXG4gIFxuICBpZihvcHRpb25zLmRlYnVnKSB7XG4gICAgY29uc29sZS5sb2coXCJHRU5FUkFUSU5HIE1FU0hFUjpcIilcbiAgICBjb25zb2xlLmxvZyhjb2RlLmpvaW4oXCJcXG5cIikpXG4gIH1cbiAgXG4gIC8vQ29tcGlsZSBwcm9jZWR1cmVcbiAgdmFyIGFyZ3MgPSBbXCJhcHBlbmRcIiwgXCJtYWxsb2NVaW50OFwiLCBcImZyZWVVaW50OFwiXVxuICBpZihtZXJnZSkge1xuICAgIGFyZ3MudW5zaGlmdChcIm1lcmdlXCIpXG4gIH1cbiAgaWYoc2tpcCkge1xuICAgIGFyZ3MudW5zaGlmdChcInNraXBcIilcbiAgfVxuICBcbiAgLy9CdWlsZCB3cmFwcGVyXG4gIHZhciBsb2NhbF9hcmdzID0gW1wiYXJyYXlcIl0uY29uY2F0KG9wdF9hcmdzKVxuICB2YXIgZnVuY05hbWUgPSBbXCJncmVlZHlNZXNoZXJcIiwgZCwgXCJkX29yZFwiLCBvcmRlci5qb2luKFwic1wiKSAsIChza2lwID8gXCJza2lwXCIgOiBcIlwiKSAsIChtZXJnZSA/IFwibWVyZ2VcIiA6IFwiXCIpXS5qb2luKFwiXCIpXG4gIHZhciBnZW5fYm9keSA9IFtcIid1c2Ugc3RyaWN0JztmdW5jdGlvbiBcIiwgZnVuY05hbWUsIFwiKFwiLCBsb2NhbF9hcmdzLmpvaW4oXCIsXCIpLCBcIil7XCIsIGNvZGUuam9pbihcIlxcblwiKSwgXCJ9O3JldHVybiBcIiwgZnVuY05hbWVdLmpvaW4oXCJcIilcbiAgYXJncy5wdXNoKGdlbl9ib2R5KVxuICB2YXIgcHJvYyA9IEZ1bmN0aW9uLmFwcGx5KHVuZGVmaW5lZCwgYXJncylcbiAgXG4gIGlmKHNraXAgJiYgbWVyZ2UpIHtcbiAgICByZXR1cm4gcHJvYyhza2lwLCBtZXJnZSwgYXBwZW5kLCBwb29sLm1hbGxvY1VpbnQ4LCBwb29sLmZyZWVVaW50OClcbiAgfSBlbHNlIGlmKHNraXApIHtcbiAgICByZXR1cm4gcHJvYyhza2lwLCBhcHBlbmQsIHBvb2wubWFsbG9jVWludDgsIHBvb2wuZnJlZVVpbnQ4KVxuICB9IGVsc2UgaWYobWVyZ2UpIHtcbiAgICByZXR1cm4gcHJvYyhtZXJnZSwgYXBwZW5kLCBwb29sLm1hbGxvY1VpbnQ4LCBwb29sLmZyZWVVaW50OClcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcHJvYyhhcHBlbmQsIHBvb2wubWFsbG9jVWludDgsIHBvb2wuZnJlZVVpbnQ4KVxuICB9XG59XG5cbi8vVGhlIGFjdHVhbCBtZXNoIGNvbXBpbGVyXG5mdW5jdGlvbiBjb21waWxlTWVzaGVyKG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cbiAgaWYoIW9wdGlvbnMub3JkZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJncmVlZHktbWVzaGVyOiBNaXNzaW5nIG9yZGVyIGZpZWxkXCIpXG4gIH1cbiAgaWYoIW9wdGlvbnMuYXBwZW5kKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiZ3JlZWR5LW1lc2hlcjogTWlzc2luZyBhcHBlbmQgZmllbGRcIilcbiAgfVxuICByZXR1cm4gZ2VuZXJhdGVNZXNoZXIoXG4gICAgb3B0aW9ucy5vcmRlcixcbiAgICBvcHRpb25zLnNraXAsXG4gICAgb3B0aW9ucy5tZXJnZSxcbiAgICBvcHRpb25zLmFwcGVuZCxcbiAgICBvcHRpb25zLmV4dHJhQXJnc3wwLFxuICAgIG9wdGlvbnMsXG4gICAgISFvcHRpb25zLnVzZUdldHRlclxuICApXG59XG5tb2R1bGUuZXhwb3J0cyA9IGNvbXBpbGVNZXNoZXJcbiIsIlwidXNlIHN0cmljdFwiXG5cbmZ1bmN0aW9uIGlvdGEobikge1xuICB2YXIgcmVzdWx0ID0gbmV3IEFycmF5KG4pXG4gIGZvcih2YXIgaT0wOyBpPG47ICsraSkge1xuICAgIHJlc3VsdFtpXSA9IGlcbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaW90YSIsIi8qKlxuICogQml0IHR3aWRkbGluZyBoYWNrcyBmb3IgSmF2YVNjcmlwdC5cbiAqXG4gKiBBdXRob3I6IE1pa29sYSBMeXNlbmtvXG4gKlxuICogUG9ydGVkIGZyb20gU3RhbmZvcmQgYml0IHR3aWRkbGluZyBoYWNrIGxpYnJhcnk6XG4gKiAgICBodHRwOi8vZ3JhcGhpY3Muc3RhbmZvcmQuZWR1L35zZWFuZGVyL2JpdGhhY2tzLmh0bWxcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjsgXCJ1c2UgcmVzdHJpY3RcIjtcblxuLy9OdW1iZXIgb2YgYml0cyBpbiBhbiBpbnRlZ2VyXG52YXIgSU5UX0JJVFMgPSAzMjtcblxuLy9Db25zdGFudHNcbmV4cG9ydHMuSU5UX0JJVFMgID0gSU5UX0JJVFM7XG5leHBvcnRzLklOVF9NQVggICA9ICAweDdmZmZmZmZmO1xuZXhwb3J0cy5JTlRfTUlOICAgPSAtMTw8KElOVF9CSVRTLTEpO1xuXG4vL1JldHVybnMgLTEsIDAsICsxIGRlcGVuZGluZyBvbiBzaWduIG9mIHhcbmV4cG9ydHMuc2lnbiA9IGZ1bmN0aW9uKHYpIHtcbiAgcmV0dXJuICh2ID4gMCkgLSAodiA8IDApO1xufVxuXG4vL0NvbXB1dGVzIGFic29sdXRlIHZhbHVlIG9mIGludGVnZXJcbmV4cG9ydHMuYWJzID0gZnVuY3Rpb24odikge1xuICB2YXIgbWFzayA9IHYgPj4gKElOVF9CSVRTLTEpO1xuICByZXR1cm4gKHYgXiBtYXNrKSAtIG1hc2s7XG59XG5cbi8vQ29tcHV0ZXMgbWluaW11bSBvZiBpbnRlZ2VycyB4IGFuZCB5XG5leHBvcnRzLm1pbiA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgcmV0dXJuIHkgXiAoKHggXiB5KSAmIC0oeCA8IHkpKTtcbn1cblxuLy9Db21wdXRlcyBtYXhpbXVtIG9mIGludGVnZXJzIHggYW5kIHlcbmV4cG9ydHMubWF4ID0gZnVuY3Rpb24oeCwgeSkge1xuICByZXR1cm4geCBeICgoeCBeIHkpICYgLSh4IDwgeSkpO1xufVxuXG4vL0NoZWNrcyBpZiBhIG51bWJlciBpcyBhIHBvd2VyIG9mIHR3b1xuZXhwb3J0cy5pc1BvdzIgPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiAhKHYgJiAodi0xKSkgJiYgKCEhdik7XG59XG5cbi8vQ29tcHV0ZXMgbG9nIGJhc2UgMiBvZiB2XG5leHBvcnRzLmxvZzIgPSBmdW5jdGlvbih2KSB7XG4gIHZhciByLCBzaGlmdDtcbiAgciA9ICAgICAodiA+IDB4RkZGRikgPDwgNDsgdiA+Pj49IHI7XG4gIHNoaWZ0ID0gKHYgPiAweEZGICApIDw8IDM7IHYgPj4+PSBzaGlmdDsgciB8PSBzaGlmdDtcbiAgc2hpZnQgPSAodiA+IDB4RiAgICkgPDwgMjsgdiA+Pj49IHNoaWZ0OyByIHw9IHNoaWZ0O1xuICBzaGlmdCA9ICh2ID4gMHgzICAgKSA8PCAxOyB2ID4+Pj0gc2hpZnQ7IHIgfD0gc2hpZnQ7XG4gIHJldHVybiByIHwgKHYgPj4gMSk7XG59XG5cbi8vQ29tcHV0ZXMgbG9nIGJhc2UgMTAgb2YgdlxuZXhwb3J0cy5sb2cxMCA9IGZ1bmN0aW9uKHYpIHtcbiAgcmV0dXJuICAodiA+PSAxMDAwMDAwMDAwKSA/IDkgOiAodiA+PSAxMDAwMDAwMDApID8gOCA6ICh2ID49IDEwMDAwMDAwKSA/IDcgOlxuICAgICAgICAgICh2ID49IDEwMDAwMDApID8gNiA6ICh2ID49IDEwMDAwMCkgPyA1IDogKHYgPj0gMTAwMDApID8gNCA6XG4gICAgICAgICAgKHYgPj0gMTAwMCkgPyAzIDogKHYgPj0gMTAwKSA/IDIgOiAodiA+PSAxMCkgPyAxIDogMDtcbn1cblxuLy9Db3VudHMgbnVtYmVyIG9mIGJpdHNcbmV4cG9ydHMucG9wQ291bnQgPSBmdW5jdGlvbih2KSB7XG4gIHYgPSB2IC0gKCh2ID4+PiAxKSAmIDB4NTU1NTU1NTUpO1xuICB2ID0gKHYgJiAweDMzMzMzMzMzKSArICgodiA+Pj4gMikgJiAweDMzMzMzMzMzKTtcbiAgcmV0dXJuICgodiArICh2ID4+PiA0KSAmIDB4RjBGMEYwRikgKiAweDEwMTAxMDEpID4+PiAyNDtcbn1cblxuLy9Db3VudHMgbnVtYmVyIG9mIHRyYWlsaW5nIHplcm9zXG5mdW5jdGlvbiBjb3VudFRyYWlsaW5nWmVyb3Modikge1xuICB2YXIgYyA9IDMyO1xuICB2ICY9IC12O1xuICBpZiAodikgYy0tO1xuICBpZiAodiAmIDB4MDAwMEZGRkYpIGMgLT0gMTY7XG4gIGlmICh2ICYgMHgwMEZGMDBGRikgYyAtPSA4O1xuICBpZiAodiAmIDB4MEYwRjBGMEYpIGMgLT0gNDtcbiAgaWYgKHYgJiAweDMzMzMzMzMzKSBjIC09IDI7XG4gIGlmICh2ICYgMHg1NTU1NTU1NSkgYyAtPSAxO1xuICByZXR1cm4gYztcbn1cbmV4cG9ydHMuY291bnRUcmFpbGluZ1plcm9zID0gY291bnRUcmFpbGluZ1plcm9zO1xuXG4vL1JvdW5kcyB0byBuZXh0IHBvd2VyIG9mIDJcbmV4cG9ydHMubmV4dFBvdzIgPSBmdW5jdGlvbih2KSB7XG4gIHYgKz0gdiA9PT0gMDtcbiAgLS12O1xuICB2IHw9IHYgPj4+IDE7XG4gIHYgfD0gdiA+Pj4gMjtcbiAgdiB8PSB2ID4+PiA0O1xuICB2IHw9IHYgPj4+IDg7XG4gIHYgfD0gdiA+Pj4gMTY7XG4gIHJldHVybiB2ICsgMTtcbn1cblxuLy9Sb3VuZHMgZG93biB0byBwcmV2aW91cyBwb3dlciBvZiAyXG5leHBvcnRzLnByZXZQb3cyID0gZnVuY3Rpb24odikge1xuICB2IHw9IHYgPj4+IDE7XG4gIHYgfD0gdiA+Pj4gMjtcbiAgdiB8PSB2ID4+PiA0O1xuICB2IHw9IHYgPj4+IDg7XG4gIHYgfD0gdiA+Pj4gMTY7XG4gIHJldHVybiB2IC0gKHY+Pj4xKTtcbn1cblxuLy9Db21wdXRlcyBwYXJpdHkgb2Ygd29yZFxuZXhwb3J0cy5wYXJpdHkgPSBmdW5jdGlvbih2KSB7XG4gIHYgXj0gdiA+Pj4gMTY7XG4gIHYgXj0gdiA+Pj4gODtcbiAgdiBePSB2ID4+PiA0O1xuICB2ICY9IDB4ZjtcbiAgcmV0dXJuICgweDY5OTYgPj4+IHYpICYgMTtcbn1cblxudmFyIFJFVkVSU0VfVEFCTEUgPSBuZXcgQXJyYXkoMjU2KTtcblxuKGZ1bmN0aW9uKHRhYikge1xuICBmb3IodmFyIGk9MDsgaTwyNTY7ICsraSkge1xuICAgIHZhciB2ID0gaSwgciA9IGksIHMgPSA3O1xuICAgIGZvciAodiA+Pj49IDE7IHY7IHYgPj4+PSAxKSB7XG4gICAgICByIDw8PSAxO1xuICAgICAgciB8PSB2ICYgMTtcbiAgICAgIC0tcztcbiAgICB9XG4gICAgdGFiW2ldID0gKHIgPDwgcykgJiAweGZmO1xuICB9XG59KShSRVZFUlNFX1RBQkxFKTtcblxuLy9SZXZlcnNlIGJpdHMgaW4gYSAzMiBiaXQgd29yZFxuZXhwb3J0cy5yZXZlcnNlID0gZnVuY3Rpb24odikge1xuICByZXR1cm4gIChSRVZFUlNFX1RBQkxFWyB2ICAgICAgICAgJiAweGZmXSA8PCAyNCkgfFxuICAgICAgICAgIChSRVZFUlNFX1RBQkxFWyh2ID4+PiA4KSAgJiAweGZmXSA8PCAxNikgfFxuICAgICAgICAgIChSRVZFUlNFX1RBQkxFWyh2ID4+PiAxNikgJiAweGZmXSA8PCA4KSAgfFxuICAgICAgICAgICBSRVZFUlNFX1RBQkxFWyh2ID4+PiAyNCkgJiAweGZmXTtcbn1cblxuLy9JbnRlcmxlYXZlIGJpdHMgb2YgMiBjb29yZGluYXRlcyB3aXRoIDE2IGJpdHMuICBVc2VmdWwgZm9yIGZhc3QgcXVhZHRyZWUgY29kZXNcbmV4cG9ydHMuaW50ZXJsZWF2ZTIgPSBmdW5jdGlvbih4LCB5KSB7XG4gIHggJj0gMHhGRkZGO1xuICB4ID0gKHggfCAoeCA8PCA4KSkgJiAweDAwRkYwMEZGO1xuICB4ID0gKHggfCAoeCA8PCA0KSkgJiAweDBGMEYwRjBGO1xuICB4ID0gKHggfCAoeCA8PCAyKSkgJiAweDMzMzMzMzMzO1xuICB4ID0gKHggfCAoeCA8PCAxKSkgJiAweDU1NTU1NTU1O1xuXG4gIHkgJj0gMHhGRkZGO1xuICB5ID0gKHkgfCAoeSA8PCA4KSkgJiAweDAwRkYwMEZGO1xuICB5ID0gKHkgfCAoeSA8PCA0KSkgJiAweDBGMEYwRjBGO1xuICB5ID0gKHkgfCAoeSA8PCAyKSkgJiAweDMzMzMzMzMzO1xuICB5ID0gKHkgfCAoeSA8PCAxKSkgJiAweDU1NTU1NTU1O1xuXG4gIHJldHVybiB4IHwgKHkgPDwgMSk7XG59XG5cbi8vRXh0cmFjdHMgdGhlIG50aCBpbnRlcmxlYXZlZCBjb21wb25lbnRcbmV4cG9ydHMuZGVpbnRlcmxlYXZlMiA9IGZ1bmN0aW9uKHYsIG4pIHtcbiAgdiA9ICh2ID4+PiBuKSAmIDB4NTU1NTU1NTU7XG4gIHYgPSAodiB8ICh2ID4+PiAxKSkgICYgMHgzMzMzMzMzMztcbiAgdiA9ICh2IHwgKHYgPj4+IDIpKSAgJiAweDBGMEYwRjBGO1xuICB2ID0gKHYgfCAodiA+Pj4gNCkpICAmIDB4MDBGRjAwRkY7XG4gIHYgPSAodiB8ICh2ID4+PiAxNikpICYgMHgwMDBGRkZGO1xuICByZXR1cm4gKHYgPDwgMTYpID4+IDE2O1xufVxuXG5cbi8vSW50ZXJsZWF2ZSBiaXRzIG9mIDMgY29vcmRpbmF0ZXMsIGVhY2ggd2l0aCAxMCBiaXRzLiAgVXNlZnVsIGZvciBmYXN0IG9jdHJlZSBjb2Rlc1xuZXhwb3J0cy5pbnRlcmxlYXZlMyA9IGZ1bmN0aW9uKHgsIHksIHopIHtcbiAgeCAmPSAweDNGRjtcbiAgeCAgPSAoeCB8ICh4PDwxNikpICYgNDI3ODE5MDMzNTtcbiAgeCAgPSAoeCB8ICh4PDw4KSkgICYgMjUxNzE5Njk1O1xuICB4ICA9ICh4IHwgKHg8PDQpKSAgJiAzMjcyMzU2MDM1O1xuICB4ICA9ICh4IHwgKHg8PDIpKSAgJiAxMjI3MTMzNTEzO1xuXG4gIHkgJj0gMHgzRkY7XG4gIHkgID0gKHkgfCAoeTw8MTYpKSAmIDQyNzgxOTAzMzU7XG4gIHkgID0gKHkgfCAoeTw8OCkpICAmIDI1MTcxOTY5NTtcbiAgeSAgPSAoeSB8ICh5PDw0KSkgICYgMzI3MjM1NjAzNTtcbiAgeSAgPSAoeSB8ICh5PDwyKSkgICYgMTIyNzEzMzUxMztcbiAgeCB8PSAoeSA8PCAxKTtcbiAgXG4gIHogJj0gMHgzRkY7XG4gIHogID0gKHogfCAoejw8MTYpKSAmIDQyNzgxOTAzMzU7XG4gIHogID0gKHogfCAoejw8OCkpICAmIDI1MTcxOTY5NTtcbiAgeiAgPSAoeiB8ICh6PDw0KSkgICYgMzI3MjM1NjAzNTtcbiAgeiAgPSAoeiB8ICh6PDwyKSkgICYgMTIyNzEzMzUxMztcbiAgXG4gIHJldHVybiB4IHwgKHogPDwgMik7XG59XG5cbi8vRXh0cmFjdHMgbnRoIGludGVybGVhdmVkIGNvbXBvbmVudCBvZiBhIDMtdHVwbGVcbmV4cG9ydHMuZGVpbnRlcmxlYXZlMyA9IGZ1bmN0aW9uKHYsIG4pIHtcbiAgdiA9ICh2ID4+PiBuKSAgICAgICAmIDEyMjcxMzM1MTM7XG4gIHYgPSAodiB8ICh2Pj4+MikpICAgJiAzMjcyMzU2MDM1O1xuICB2ID0gKHYgfCAodj4+PjQpKSAgICYgMjUxNzE5Njk1O1xuICB2ID0gKHYgfCAodj4+PjgpKSAgICYgNDI3ODE5MDMzNTtcbiAgdiA9ICh2IHwgKHY+Pj4xNikpICAmIDB4M0ZGO1xuICByZXR1cm4gKHY8PDIyKT4+MjI7XG59XG5cbi8vQ29tcHV0ZXMgbmV4dCBjb21iaW5hdGlvbiBpbiBjb2xleGljb2dyYXBoaWMgb3JkZXIgKHRoaXMgaXMgbWlzdGFrZW5seSBjYWxsZWQgbmV4dFBlcm11dGF0aW9uIG9uIHRoZSBiaXQgdHdpZGRsaW5nIGhhY2tzIHBhZ2UpXG5leHBvcnRzLm5leHRDb21iaW5hdGlvbiA9IGZ1bmN0aW9uKHYpIHtcbiAgdmFyIHQgPSB2IHwgKHYgLSAxKTtcbiAgcmV0dXJuICh0ICsgMSkgfCAoKCh+dCAmIC1+dCkgLSAxKSA+Pj4gKGNvdW50VHJhaWxpbmdaZXJvcyh2KSArIDEpKTtcbn1cblxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuZnVuY3Rpb24gZHVwZV9hcnJheShjb3VudCwgdmFsdWUsIGkpIHtcbiAgdmFyIGMgPSBjb3VudFtpXXwwXG4gIGlmKGMgPD0gMCkge1xuICAgIHJldHVybiBbXVxuICB9XG4gIHZhciByZXN1bHQgPSBuZXcgQXJyYXkoYyksIGpcbiAgaWYoaSA9PT0gY291bnQubGVuZ3RoLTEpIHtcbiAgICBmb3Ioaj0wOyBqPGM7ICsraikge1xuICAgICAgcmVzdWx0W2pdID0gdmFsdWVcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZm9yKGo9MDsgajxjOyArK2opIHtcbiAgICAgIHJlc3VsdFtqXSA9IGR1cGVfYXJyYXkoY291bnQsIHZhbHVlLCBpKzEpXG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuZnVuY3Rpb24gZHVwZV9udW1iZXIoY291bnQsIHZhbHVlKSB7XG4gIHZhciByZXN1bHQsIGlcbiAgcmVzdWx0ID0gbmV3IEFycmF5KGNvdW50KVxuICBmb3IoaT0wOyBpPGNvdW50OyArK2kpIHtcbiAgICByZXN1bHRbaV0gPSB2YWx1ZVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuZnVuY3Rpb24gZHVwZShjb3VudCwgdmFsdWUpIHtcbiAgaWYodHlwZW9mIHZhbHVlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgdmFsdWUgPSAwXG4gIH1cbiAgc3dpdGNoKHR5cGVvZiBjb3VudCkge1xuICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICAgIGlmKGNvdW50ID4gMCkge1xuICAgICAgICByZXR1cm4gZHVwZV9udW1iZXIoY291bnR8MCwgdmFsdWUpXG4gICAgICB9XG4gICAgYnJlYWtcbiAgICBjYXNlIFwib2JqZWN0XCI6XG4gICAgICBpZih0eXBlb2YgKGNvdW50Lmxlbmd0aCkgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgcmV0dXJuIGR1cGVfYXJyYXkoY291bnQsIHZhbHVlLCAwKVxuICAgICAgfVxuICAgIGJyZWFrXG4gIH1cbiAgcmV0dXJuIFtdXG59XG5cbm1vZHVsZS5leHBvcnRzID0gZHVwZSIsIid1c2Ugc3RyaWN0J1xuXG52YXIgYml0cyA9IHJlcXVpcmUoJ2JpdC10d2lkZGxlJylcbnZhciBkdXAgPSByZXF1aXJlKCdkdXAnKVxuXG4vL0xlZ2FjeSBwb29sIHN1cHBvcnRcbmlmKCFnbG9iYWwuX19UWVBFREFSUkFZX1BPT0wpIHtcbiAgZ2xvYmFsLl9fVFlQRURBUlJBWV9QT09MID0ge1xuICAgICAgVUlOVDggICA6IGR1cChbMzIsIDBdKVxuICAgICwgVUlOVDE2ICA6IGR1cChbMzIsIDBdKVxuICAgICwgVUlOVDMyICA6IGR1cChbMzIsIDBdKVxuICAgICwgSU5UOCAgICA6IGR1cChbMzIsIDBdKVxuICAgICwgSU5UMTYgICA6IGR1cChbMzIsIDBdKVxuICAgICwgSU5UMzIgICA6IGR1cChbMzIsIDBdKVxuICAgICwgRkxPQVQgICA6IGR1cChbMzIsIDBdKVxuICAgICwgRE9VQkxFICA6IGR1cChbMzIsIDBdKVxuICAgICwgREFUQSAgICA6IGR1cChbMzIsIDBdKVxuICAgICwgVUlOVDhDICA6IGR1cChbMzIsIDBdKVxuICAgICwgQlVGRkVSICA6IGR1cChbMzIsIDBdKVxuICB9XG59XG5cbnZhciBoYXNVaW50OEMgPSAodHlwZW9mIFVpbnQ4Q2xhbXBlZEFycmF5KSAhPT0gJ3VuZGVmaW5lZCdcbnZhciBQT09MID0gZ2xvYmFsLl9fVFlQRURBUlJBWV9QT09MXG5cbi8vVXBncmFkZSBwb29sXG5pZighUE9PTC5VSU5UOEMpIHtcbiAgUE9PTC5VSU5UOEMgPSBkdXAoWzMyLCAwXSlcbn1cbmlmKCFQT09MLkJVRkZFUikge1xuICBQT09MLkJVRkZFUiA9IGR1cChbMzIsIDBdKVxufVxuXG4vL05ldyB0ZWNobmlxdWU6IE9ubHkgYWxsb2NhdGUgZnJvbSBBcnJheUJ1ZmZlclZpZXcgYW5kIEJ1ZmZlclxudmFyIERBVEEgICAgPSBQT09MLkRBVEFcbiAgLCBCVUZGRVIgID0gUE9PTC5CVUZGRVJcblxuZXhwb3J0cy5mcmVlID0gZnVuY3Rpb24gZnJlZShhcnJheSkge1xuICBpZihCdWZmZXIuaXNCdWZmZXIoYXJyYXkpKSB7XG4gICAgQlVGRkVSW2JpdHMubG9nMihhcnJheS5sZW5ndGgpXS5wdXNoKGFycmF5KVxuICB9IGVsc2Uge1xuICAgIGlmKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcnJheSkgIT09ICdbb2JqZWN0IEFycmF5QnVmZmVyXScpIHtcbiAgICAgIGFycmF5ID0gYXJyYXkuYnVmZmVyXG4gICAgfVxuICAgIGlmKCFhcnJheSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHZhciBuID0gYXJyYXkubGVuZ3RoIHx8IGFycmF5LmJ5dGVMZW5ndGhcbiAgICB2YXIgbG9nX24gPSBiaXRzLmxvZzIobil8MFxuICAgIERBVEFbbG9nX25dLnB1c2goYXJyYXkpXG4gIH1cbn1cblxuZnVuY3Rpb24gZnJlZUFycmF5QnVmZmVyKGJ1ZmZlcikge1xuICBpZighYnVmZmVyKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgdmFyIG4gPSBidWZmZXIubGVuZ3RoIHx8IGJ1ZmZlci5ieXRlTGVuZ3RoXG4gIHZhciBsb2dfbiA9IGJpdHMubG9nMihuKVxuICBEQVRBW2xvZ19uXS5wdXNoKGJ1ZmZlcilcbn1cblxuZnVuY3Rpb24gZnJlZVR5cGVkQXJyYXkoYXJyYXkpIHtcbiAgZnJlZUFycmF5QnVmZmVyKGFycmF5LmJ1ZmZlcilcbn1cblxuZXhwb3J0cy5mcmVlVWludDggPVxuZXhwb3J0cy5mcmVlVWludDE2ID1cbmV4cG9ydHMuZnJlZVVpbnQzMiA9XG5leHBvcnRzLmZyZWVJbnQ4ID1cbmV4cG9ydHMuZnJlZUludDE2ID1cbmV4cG9ydHMuZnJlZUludDMyID1cbmV4cG9ydHMuZnJlZUZsb2F0MzIgPSBcbmV4cG9ydHMuZnJlZUZsb2F0ID1cbmV4cG9ydHMuZnJlZUZsb2F0NjQgPSBcbmV4cG9ydHMuZnJlZURvdWJsZSA9IFxuZXhwb3J0cy5mcmVlVWludDhDbGFtcGVkID0gXG5leHBvcnRzLmZyZWVEYXRhVmlldyA9IGZyZWVUeXBlZEFycmF5XG5cbmV4cG9ydHMuZnJlZUFycmF5QnVmZmVyID0gZnJlZUFycmF5QnVmZmVyXG5cbmV4cG9ydHMuZnJlZUJ1ZmZlciA9IGZ1bmN0aW9uIGZyZWVCdWZmZXIoYXJyYXkpIHtcbiAgQlVGRkVSW2JpdHMubG9nMihhcnJheS5sZW5ndGgpXS5wdXNoKGFycmF5KVxufVxuXG5leHBvcnRzLm1hbGxvYyA9IGZ1bmN0aW9uIG1hbGxvYyhuLCBkdHlwZSkge1xuICBpZihkdHlwZSA9PT0gdW5kZWZpbmVkIHx8IGR0eXBlID09PSAnYXJyYXlidWZmZXInKSB7XG4gICAgcmV0dXJuIG1hbGxvY0FycmF5QnVmZmVyKG4pXG4gIH0gZWxzZSB7XG4gICAgc3dpdGNoKGR0eXBlKSB7XG4gICAgICBjYXNlICd1aW50OCc6XG4gICAgICAgIHJldHVybiBtYWxsb2NVaW50OChuKVxuICAgICAgY2FzZSAndWludDE2JzpcbiAgICAgICAgcmV0dXJuIG1hbGxvY1VpbnQxNihuKVxuICAgICAgY2FzZSAndWludDMyJzpcbiAgICAgICAgcmV0dXJuIG1hbGxvY1VpbnQzMihuKVxuICAgICAgY2FzZSAnaW50OCc6XG4gICAgICAgIHJldHVybiBtYWxsb2NJbnQ4KG4pXG4gICAgICBjYXNlICdpbnQxNic6XG4gICAgICAgIHJldHVybiBtYWxsb2NJbnQxNihuKVxuICAgICAgY2FzZSAnaW50MzInOlxuICAgICAgICByZXR1cm4gbWFsbG9jSW50MzIobilcbiAgICAgIGNhc2UgJ2Zsb2F0JzpcbiAgICAgIGNhc2UgJ2Zsb2F0MzInOlxuICAgICAgICByZXR1cm4gbWFsbG9jRmxvYXQobilcbiAgICAgIGNhc2UgJ2RvdWJsZSc6XG4gICAgICBjYXNlICdmbG9hdDY0JzpcbiAgICAgICAgcmV0dXJuIG1hbGxvY0RvdWJsZShuKVxuICAgICAgY2FzZSAndWludDhfY2xhbXBlZCc6XG4gICAgICAgIHJldHVybiBtYWxsb2NVaW50OENsYW1wZWQobilcbiAgICAgIGNhc2UgJ2J1ZmZlcic6XG4gICAgICAgIHJldHVybiBtYWxsb2NCdWZmZXIobilcbiAgICAgIGNhc2UgJ2RhdGEnOlxuICAgICAgY2FzZSAnZGF0YXZpZXcnOlxuICAgICAgICByZXR1cm4gbWFsbG9jRGF0YVZpZXcobilcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cblxuZnVuY3Rpb24gbWFsbG9jQXJyYXlCdWZmZXIobikge1xuICB2YXIgbiA9IGJpdHMubmV4dFBvdzIobilcbiAgdmFyIGxvZ19uID0gYml0cy5sb2cyKG4pXG4gIHZhciBkID0gREFUQVtsb2dfbl1cbiAgaWYoZC5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIGQucG9wKClcbiAgfVxuICByZXR1cm4gbmV3IEFycmF5QnVmZmVyKG4pXG59XG5leHBvcnRzLm1hbGxvY0FycmF5QnVmZmVyID0gbWFsbG9jQXJyYXlCdWZmZXJcblxuZnVuY3Rpb24gbWFsbG9jVWludDgobikge1xuICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkobWFsbG9jQXJyYXlCdWZmZXIobiksIDAsIG4pXG59XG5leHBvcnRzLm1hbGxvY1VpbnQ4ID0gbWFsbG9jVWludDhcblxuZnVuY3Rpb24gbWFsbG9jVWludDE2KG4pIHtcbiAgcmV0dXJuIG5ldyBVaW50MTZBcnJheShtYWxsb2NBcnJheUJ1ZmZlcigyKm4pLCAwLCBuKVxufVxuZXhwb3J0cy5tYWxsb2NVaW50MTYgPSBtYWxsb2NVaW50MTZcblxuZnVuY3Rpb24gbWFsbG9jVWludDMyKG4pIHtcbiAgcmV0dXJuIG5ldyBVaW50MzJBcnJheShtYWxsb2NBcnJheUJ1ZmZlcig0Km4pLCAwLCBuKVxufVxuZXhwb3J0cy5tYWxsb2NVaW50MzIgPSBtYWxsb2NVaW50MzJcblxuZnVuY3Rpb24gbWFsbG9jSW50OChuKSB7XG4gIHJldHVybiBuZXcgSW50OEFycmF5KG1hbGxvY0FycmF5QnVmZmVyKG4pLCAwLCBuKVxufVxuZXhwb3J0cy5tYWxsb2NJbnQ4ID0gbWFsbG9jSW50OFxuXG5mdW5jdGlvbiBtYWxsb2NJbnQxNihuKSB7XG4gIHJldHVybiBuZXcgSW50MTZBcnJheShtYWxsb2NBcnJheUJ1ZmZlcigyKm4pLCAwLCBuKVxufVxuZXhwb3J0cy5tYWxsb2NJbnQxNiA9IG1hbGxvY0ludDE2XG5cbmZ1bmN0aW9uIG1hbGxvY0ludDMyKG4pIHtcbiAgcmV0dXJuIG5ldyBJbnQzMkFycmF5KG1hbGxvY0FycmF5QnVmZmVyKDQqbiksIDAsIG4pXG59XG5leHBvcnRzLm1hbGxvY0ludDMyID0gbWFsbG9jSW50MzJcblxuZnVuY3Rpb24gbWFsbG9jRmxvYXQobikge1xuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShtYWxsb2NBcnJheUJ1ZmZlcig0Km4pLCAwLCBuKVxufVxuZXhwb3J0cy5tYWxsb2NGbG9hdDMyID0gZXhwb3J0cy5tYWxsb2NGbG9hdCA9IG1hbGxvY0Zsb2F0XG5cbmZ1bmN0aW9uIG1hbGxvY0RvdWJsZShuKSB7XG4gIHJldHVybiBuZXcgRmxvYXQ2NEFycmF5KG1hbGxvY0FycmF5QnVmZmVyKDgqbiksIDAsIG4pXG59XG5leHBvcnRzLm1hbGxvY0Zsb2F0NjQgPSBleHBvcnRzLm1hbGxvY0RvdWJsZSA9IG1hbGxvY0RvdWJsZVxuXG5mdW5jdGlvbiBtYWxsb2NVaW50OENsYW1wZWQobikge1xuICBpZihoYXNVaW50OEMpIHtcbiAgICByZXR1cm4gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KG1hbGxvY0FycmF5QnVmZmVyKG4pLCAwLCBuKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBtYWxsb2NVaW50OChuKVxuICB9XG59XG5leHBvcnRzLm1hbGxvY1VpbnQ4Q2xhbXBlZCA9IG1hbGxvY1VpbnQ4Q2xhbXBlZFxuXG5mdW5jdGlvbiBtYWxsb2NEYXRhVmlldyhuKSB7XG4gIHJldHVybiBuZXcgRGF0YVZpZXcobWFsbG9jQXJyYXlCdWZmZXIobiksIDAsIG4pXG59XG5leHBvcnRzLm1hbGxvY0RhdGFWaWV3ID0gbWFsbG9jRGF0YVZpZXdcblxuZnVuY3Rpb24gbWFsbG9jQnVmZmVyKG4pIHtcbiAgbiA9IGJpdHMubmV4dFBvdzIobilcbiAgdmFyIGxvZ19uID0gYml0cy5sb2cyKG4pXG4gIHZhciBjYWNoZSA9IEJVRkZFUltsb2dfbl1cbiAgaWYoY2FjaGUubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBjYWNoZS5wb3AoKVxuICB9XG4gIHJldHVybiBuZXcgQnVmZmVyKG4pXG59XG5leHBvcnRzLm1hbGxvY0J1ZmZlciA9IG1hbGxvY0J1ZmZlclxuXG5leHBvcnRzLmNsZWFyQ2FjaGUgPSBmdW5jdGlvbiBjbGVhckNhY2hlKCkge1xuICBmb3IodmFyIGk9MDsgaTwzMjsgKytpKSB7XG4gICAgUE9PTC5VSU5UOFtpXS5sZW5ndGggPSAwXG4gICAgUE9PTC5VSU5UMTZbaV0ubGVuZ3RoID0gMFxuICAgIFBPT0wuVUlOVDMyW2ldLmxlbmd0aCA9IDBcbiAgICBQT09MLklOVDhbaV0ubGVuZ3RoID0gMFxuICAgIFBPT0wuSU5UMTZbaV0ubGVuZ3RoID0gMFxuICAgIFBPT0wuSU5UMzJbaV0ubGVuZ3RoID0gMFxuICAgIFBPT0wuRkxPQVRbaV0ubGVuZ3RoID0gMFxuICAgIFBPT0wuRE9VQkxFW2ldLmxlbmd0aCA9IDBcbiAgICBQT09MLlVJTlQ4Q1tpXS5sZW5ndGggPSAwXG4gICAgREFUQVtpXS5sZW5ndGggPSAwXG4gICAgQlVGRkVSW2ldLmxlbmd0aCA9IDBcbiAgfVxufSIsIlwidXNlIHN0cmljdFwiXG5cbmZ1bmN0aW9uIHVuaXF1ZV9wcmVkKGxpc3QsIGNvbXBhcmUpIHtcbiAgdmFyIHB0ciA9IDFcbiAgICAsIGxlbiA9IGxpc3QubGVuZ3RoXG4gICAgLCBhPWxpc3RbMF0sIGI9bGlzdFswXVxuICBmb3IodmFyIGk9MTsgaTxsZW47ICsraSkge1xuICAgIGIgPSBhXG4gICAgYSA9IGxpc3RbaV1cbiAgICBpZihjb21wYXJlKGEsIGIpKSB7XG4gICAgICBpZihpID09PSBwdHIpIHtcbiAgICAgICAgcHRyKytcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICAgIGxpc3RbcHRyKytdID0gYVxuICAgIH1cbiAgfVxuICBsaXN0Lmxlbmd0aCA9IHB0clxuICByZXR1cm4gbGlzdFxufVxuXG5mdW5jdGlvbiB1bmlxdWVfZXEobGlzdCkge1xuICB2YXIgcHRyID0gMVxuICAgICwgbGVuID0gbGlzdC5sZW5ndGhcbiAgICAsIGE9bGlzdFswXSwgYiA9IGxpc3RbMF1cbiAgZm9yKHZhciBpPTE7IGk8bGVuOyArK2ksIGI9YSkge1xuICAgIGIgPSBhXG4gICAgYSA9IGxpc3RbaV1cbiAgICBpZihhICE9PSBiKSB7XG4gICAgICBpZihpID09PSBwdHIpIHtcbiAgICAgICAgcHRyKytcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICAgIGxpc3RbcHRyKytdID0gYVxuICAgIH1cbiAgfVxuICBsaXN0Lmxlbmd0aCA9IHB0clxuICByZXR1cm4gbGlzdFxufVxuXG5mdW5jdGlvbiB1bmlxdWUobGlzdCwgY29tcGFyZSwgc29ydGVkKSB7XG4gIGlmKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGxpc3RcbiAgfVxuICBpZihjb21wYXJlKSB7XG4gICAgaWYoIXNvcnRlZCkge1xuICAgICAgbGlzdC5zb3J0KGNvbXBhcmUpXG4gICAgfVxuICAgIHJldHVybiB1bmlxdWVfcHJlZChsaXN0LCBjb21wYXJlKVxuICB9XG4gIGlmKCFzb3J0ZWQpIHtcbiAgICBsaXN0LnNvcnQoKVxuICB9XG4gIHJldHVybiB1bmlxdWVfZXEobGlzdClcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB1bmlxdWVcbiIsIi8vIFNvdXJjZTogaHR0cDovL2pzZmlkZGxlLm5ldC92V3g4Vi9cbi8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNTYwMzE5NS9mdWxsLWxpc3Qtb2YtamF2YXNjcmlwdC1rZXljb2Rlc1xuXG5cblxuLyoqXG4gKiBDb25lbmllbmNlIG1ldGhvZCByZXR1cm5zIGNvcnJlc3BvbmRpbmcgdmFsdWUgZm9yIGdpdmVuIGtleU5hbWUgb3Iga2V5Q29kZS5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSBrZXlDb2RlIHtOdW1iZXJ9IG9yIGtleU5hbWUge1N0cmluZ31cbiAqIEByZXR1cm4ge01peGVkfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzZWFyY2hJbnB1dCkge1xuICAvLyBLZXlib2FyZCBFdmVudHNcbiAgaWYgKHNlYXJjaElucHV0ICYmICdvYmplY3QnID09PSB0eXBlb2Ygc2VhcmNoSW5wdXQpIHtcbiAgICB2YXIgaGFzS2V5Q29kZSA9IHNlYXJjaElucHV0LndoaWNoIHx8IHNlYXJjaElucHV0LmtleUNvZGUgfHwgc2VhcmNoSW5wdXQuY2hhckNvZGVcbiAgICBpZiAoaGFzS2V5Q29kZSkgc2VhcmNoSW5wdXQgPSBoYXNLZXlDb2RlXG4gIH1cblxuICAvLyBOdW1iZXJzXG4gIGlmICgnbnVtYmVyJyA9PT0gdHlwZW9mIHNlYXJjaElucHV0KSByZXR1cm4gbmFtZXNbc2VhcmNoSW5wdXRdXG5cbiAgLy8gRXZlcnl0aGluZyBlbHNlIChjYXN0IHRvIHN0cmluZylcbiAgdmFyIHNlYXJjaCA9IFN0cmluZyhzZWFyY2hJbnB1dClcblxuICAvLyBjaGVjayBjb2Rlc1xuICB2YXIgZm91bmROYW1lZEtleSA9IGNvZGVzW3NlYXJjaC50b0xvd2VyQ2FzZSgpXVxuICBpZiAoZm91bmROYW1lZEtleSkgcmV0dXJuIGZvdW5kTmFtZWRLZXlcblxuICAvLyBjaGVjayBhbGlhc2VzXG4gIHZhciBmb3VuZE5hbWVkS2V5ID0gYWxpYXNlc1tzZWFyY2gudG9Mb3dlckNhc2UoKV1cbiAgaWYgKGZvdW5kTmFtZWRLZXkpIHJldHVybiBmb3VuZE5hbWVkS2V5XG5cbiAgLy8gd2VpcmQgY2hhcmFjdGVyP1xuICBpZiAoc2VhcmNoLmxlbmd0aCA9PT0gMSkgcmV0dXJuIHNlYXJjaC5jaGFyQ29kZUF0KDApXG5cbiAgcmV0dXJuIHVuZGVmaW5lZFxufVxuXG4vKipcbiAqIEdldCBieSBuYW1lXG4gKlxuICogICBleHBvcnRzLmNvZGVbJ2VudGVyJ10gLy8gPT4gMTNcbiAqL1xuXG52YXIgY29kZXMgPSBleHBvcnRzLmNvZGUgPSBleHBvcnRzLmNvZGVzID0ge1xuICAnYmFja3NwYWNlJzogOCxcbiAgJ3RhYic6IDksXG4gICdlbnRlcic6IDEzLFxuICAnc2hpZnQnOiAxNixcbiAgJ2N0cmwnOiAxNyxcbiAgJ2FsdCc6IDE4LFxuICAncGF1c2UvYnJlYWsnOiAxOSxcbiAgJ2NhcHMgbG9jayc6IDIwLFxuICAnZXNjJzogMjcsXG4gICdzcGFjZSc6IDMyLFxuICAncGFnZSB1cCc6IDMzLFxuICAncGFnZSBkb3duJzogMzQsXG4gICdlbmQnOiAzNSxcbiAgJ2hvbWUnOiAzNixcbiAgJ2xlZnQnOiAzNyxcbiAgJ3VwJzogMzgsXG4gICdyaWdodCc6IDM5LFxuICAnZG93bic6IDQwLFxuICAnaW5zZXJ0JzogNDUsXG4gICdkZWxldGUnOiA0NixcbiAgJ2NvbW1hbmQnOiA5MSxcbiAgJ3JpZ2h0IGNsaWNrJzogOTMsXG4gICdudW1wYWQgKic6IDEwNixcbiAgJ251bXBhZCArJzogMTA3LFxuICAnbnVtcGFkIC0nOiAxMDksXG4gICdudW1wYWQgLic6IDExMCxcbiAgJ251bXBhZCAvJzogMTExLFxuICAnbnVtIGxvY2snOiAxNDQsXG4gICdzY3JvbGwgbG9jayc6IDE0NSxcbiAgJ215IGNvbXB1dGVyJzogMTgyLFxuICAnbXkgY2FsY3VsYXRvcic6IDE4MyxcbiAgJzsnOiAxODYsXG4gICc9JzogMTg3LFxuICAnLCc6IDE4OCxcbiAgJy0nOiAxODksXG4gICcuJzogMTkwLFxuICAnLyc6IDE5MSxcbiAgJ2AnOiAxOTIsXG4gICdbJzogMjE5LFxuICAnXFxcXCc6IDIyMCxcbiAgJ10nOiAyMjEsXG4gIFwiJ1wiOiAyMjIsXG59XG5cbi8vIEhlbHBlciBhbGlhc2VzXG5cbnZhciBhbGlhc2VzID0gZXhwb3J0cy5hbGlhc2VzID0ge1xuICAnd2luZG93cyc6IDkxLFxuICAn4oenJzogMTYsXG4gICfijKUnOiAxOCxcbiAgJ+KMgyc6IDE3LFxuICAn4oyYJzogOTEsXG4gICdjdGwnOiAxNyxcbiAgJ2NvbnRyb2wnOiAxNyxcbiAgJ29wdGlvbic6IDE4LFxuICAncGF1c2UnOiAxOSxcbiAgJ2JyZWFrJzogMTksXG4gICdjYXBzJzogMjAsXG4gICdyZXR1cm4nOiAxMyxcbiAgJ2VzY2FwZSc6IDI3LFxuICAnc3BjJzogMzIsXG4gICdwZ3VwJzogMzMsXG4gICdwZ2RuJzogMzMsXG4gICdpbnMnOiA0NSxcbiAgJ2RlbCc6IDQ2LFxuICAnY21kJzogOTFcbn1cblxuXG4vKiFcbiAqIFByb2dyYW1hdGljYWxseSBhZGQgdGhlIGZvbGxvd2luZ1xuICovXG5cbi8vIGxvd2VyIGNhc2UgY2hhcnNcbmZvciAoaSA9IDk3OyBpIDwgMTIzOyBpKyspIGNvZGVzW1N0cmluZy5mcm9tQ2hhckNvZGUoaSldID0gaSAtIDMyXG5cbi8vIG51bWJlcnNcbmZvciAodmFyIGkgPSA0ODsgaSA8IDU4OyBpKyspIGNvZGVzW2kgLSA0OF0gPSBpXG5cbi8vIGZ1bmN0aW9uIGtleXNcbmZvciAoaSA9IDE7IGkgPCAxMzsgaSsrKSBjb2Rlc1snZicraV0gPSBpICsgMTExXG5cbi8vIG51bXBhZCBrZXlzXG5mb3IgKGkgPSAwOyBpIDwgMTA7IGkrKykgY29kZXNbJ251bXBhZCAnK2ldID0gaSArIDk2XG5cbi8qKlxuICogR2V0IGJ5IGNvZGVcbiAqXG4gKiAgIGV4cG9ydHMubmFtZVsxM10gLy8gPT4gJ0VudGVyJ1xuICovXG5cbnZhciBuYW1lcyA9IGV4cG9ydHMubmFtZXMgPSBleHBvcnRzLnRpdGxlID0ge30gLy8gdGl0bGUgZm9yIGJhY2t3YXJkIGNvbXBhdFxuXG4vLyBDcmVhdGUgcmV2ZXJzZSBtYXBwaW5nXG5mb3IgKGkgaW4gY29kZXMpIG5hbWVzW2NvZGVzW2ldXSA9IGlcblxuLy8gQWRkIGFsaWFzZXNcbmZvciAodmFyIGFsaWFzIGluIGFsaWFzZXMpIHtcbiAgY29kZXNbYWxpYXNdID0gYWxpYXNlc1thbGlhc11cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFyZ3MsIG9wdHMpIHtcbiAgICBpZiAoIW9wdHMpIG9wdHMgPSB7fTtcbiAgICBcbiAgICB2YXIgZmxhZ3MgPSB7IGJvb2xzIDoge30sIHN0cmluZ3MgOiB7fSwgdW5rbm93bkZuOiBudWxsIH07XG5cbiAgICBpZiAodHlwZW9mIG9wdHNbJ3Vua25vd24nXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBmbGFncy51bmtub3duRm4gPSBvcHRzWyd1bmtub3duJ107XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvcHRzWydib29sZWFuJ10gPT09ICdib29sZWFuJyAmJiBvcHRzWydib29sZWFuJ10pIHtcbiAgICAgIGZsYWdzLmFsbEJvb2xzID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgW10uY29uY2F0KG9wdHNbJ2Jvb2xlYW4nXSkuZmlsdGVyKEJvb2xlYW4pLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgIGZsYWdzLmJvb2xzW2tleV0gPSB0cnVlO1xuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIHZhciBhbGlhc2VzID0ge307XG4gICAgT2JqZWN0LmtleXMob3B0cy5hbGlhcyB8fCB7fSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGFsaWFzZXNba2V5XSA9IFtdLmNvbmNhdChvcHRzLmFsaWFzW2tleV0pO1xuICAgICAgICBhbGlhc2VzW2tleV0uZm9yRWFjaChmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgYWxpYXNlc1t4XSA9IFtrZXldLmNvbmNhdChhbGlhc2VzW2tleV0uZmlsdGVyKGZ1bmN0aW9uICh5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHggIT09IHk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgW10uY29uY2F0KG9wdHMuc3RyaW5nKS5maWx0ZXIoQm9vbGVhbikuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGZsYWdzLnN0cmluZ3Nba2V5XSA9IHRydWU7XG4gICAgICAgIGlmIChhbGlhc2VzW2tleV0pIHtcbiAgICAgICAgICAgIGZsYWdzLnN0cmluZ3NbYWxpYXNlc1trZXldXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgfSk7XG5cbiAgICB2YXIgZGVmYXVsdHMgPSBvcHRzWydkZWZhdWx0J10gfHwge307XG4gICAgXG4gICAgdmFyIGFyZ3YgPSB7IF8gOiBbXSB9O1xuICAgIE9iamVjdC5rZXlzKGZsYWdzLmJvb2xzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgc2V0QXJnKGtleSwgZGVmYXVsdHNba2V5XSA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiBkZWZhdWx0c1trZXldKTtcbiAgICB9KTtcbiAgICBcbiAgICB2YXIgbm90RmxhZ3MgPSBbXTtcblxuICAgIGlmIChhcmdzLmluZGV4T2YoJy0tJykgIT09IC0xKSB7XG4gICAgICAgIG5vdEZsYWdzID0gYXJncy5zbGljZShhcmdzLmluZGV4T2YoJy0tJykrMSk7XG4gICAgICAgIGFyZ3MgPSBhcmdzLnNsaWNlKDAsIGFyZ3MuaW5kZXhPZignLS0nKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYXJnRGVmaW5lZChrZXksIGFyZykge1xuICAgICAgICByZXR1cm4gKGZsYWdzLmFsbEJvb2xzICYmIC9eLS1bXj1dKyQvLnRlc3QoYXJnKSkgfHxcbiAgICAgICAgICAgIGZsYWdzLnN0cmluZ3Nba2V5XSB8fCBmbGFncy5ib29sc1trZXldIHx8IGFsaWFzZXNba2V5XTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRBcmcgKGtleSwgdmFsLCBhcmcpIHtcbiAgICAgICAgaWYgKGFyZyAmJiBmbGFncy51bmtub3duRm4gJiYgIWFyZ0RlZmluZWQoa2V5LCBhcmcpKSB7XG4gICAgICAgICAgICBpZiAoZmxhZ3MudW5rbm93bkZuKGFyZykgPT09IGZhbHNlKSByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdmFsdWUgPSAhZmxhZ3Muc3RyaW5nc1trZXldICYmIGlzTnVtYmVyKHZhbClcbiAgICAgICAgICAgID8gTnVtYmVyKHZhbCkgOiB2YWxcbiAgICAgICAgO1xuICAgICAgICBzZXRLZXkoYXJndiwga2V5LnNwbGl0KCcuJyksIHZhbHVlKTtcbiAgICAgICAgXG4gICAgICAgIChhbGlhc2VzW2tleV0gfHwgW10pLmZvckVhY2goZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIHNldEtleShhcmd2LCB4LnNwbGl0KCcuJyksIHZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0S2V5IChvYmosIGtleXMsIHZhbHVlKSB7XG4gICAgICAgIHZhciBvID0gb2JqO1xuICAgICAgICBrZXlzLnNsaWNlKDAsLTEpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgaWYgKG9ba2V5XSA9PT0gdW5kZWZpbmVkKSBvW2tleV0gPSB7fTtcbiAgICAgICAgICAgIG8gPSBvW2tleV07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBrZXkgPSBrZXlzW2tleXMubGVuZ3RoIC0gMV07XG4gICAgICAgIGlmIChvW2tleV0gPT09IHVuZGVmaW5lZCB8fCBmbGFncy5ib29sc1trZXldIHx8IHR5cGVvZiBvW2tleV0gPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgb1trZXldID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvW2tleV0pKSB7XG4gICAgICAgICAgICBvW2tleV0ucHVzaCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBvW2tleV0gPSBbIG9ba2V5XSwgdmFsdWUgXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiBhbGlhc0lzQm9vbGVhbihrZXkpIHtcbiAgICAgIHJldHVybiBhbGlhc2VzW2tleV0uc29tZShmdW5jdGlvbiAoeCkge1xuICAgICAgICAgIHJldHVybiBmbGFncy5ib29sc1t4XTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgYXJnID0gYXJnc1tpXTtcbiAgICAgICAgXG4gICAgICAgIGlmICgvXi0tLis9Ly50ZXN0KGFyZykpIHtcbiAgICAgICAgICAgIC8vIFVzaW5nIFtcXHNcXFNdIGluc3RlYWQgb2YgLiBiZWNhdXNlIGpzIGRvZXNuJ3Qgc3VwcG9ydCB0aGVcbiAgICAgICAgICAgIC8vICdkb3RhbGwnIHJlZ2V4IG1vZGlmaWVyLiBTZWU6XG4gICAgICAgICAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xMDY4MzA4LzEzMjE2XG4gICAgICAgICAgICB2YXIgbSA9IGFyZy5tYXRjaCgvXi0tKFtePV0rKT0oW1xcc1xcU10qKSQvKTtcbiAgICAgICAgICAgIHZhciBrZXkgPSBtWzFdO1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gbVsyXTtcbiAgICAgICAgICAgIGlmIChmbGFncy5ib29sc1trZXldKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAhPT0gJ2ZhbHNlJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNldEFyZyhrZXksIHZhbHVlLCBhcmcpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKC9eLS1uby0uKy8udGVzdChhcmcpKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gYXJnLm1hdGNoKC9eLS1uby0oLispLylbMV07XG4gICAgICAgICAgICBzZXRBcmcoa2V5LCBmYWxzZSwgYXJnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICgvXi0tLisvLnRlc3QoYXJnKSkge1xuICAgICAgICAgICAgdmFyIGtleSA9IGFyZy5tYXRjaCgvXi0tKC4rKS8pWzFdO1xuICAgICAgICAgICAgdmFyIG5leHQgPSBhcmdzW2kgKyAxXTtcbiAgICAgICAgICAgIGlmIChuZXh0ICE9PSB1bmRlZmluZWQgJiYgIS9eLS8udGVzdChuZXh0KVxuICAgICAgICAgICAgJiYgIWZsYWdzLmJvb2xzW2tleV1cbiAgICAgICAgICAgICYmICFmbGFncy5hbGxCb29sc1xuICAgICAgICAgICAgJiYgKGFsaWFzZXNba2V5XSA/ICFhbGlhc0lzQm9vbGVhbihrZXkpIDogdHJ1ZSkpIHtcbiAgICAgICAgICAgICAgICBzZXRBcmcoa2V5LCBuZXh0LCBhcmcpO1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKC9eKHRydWV8ZmFsc2UpJC8udGVzdChuZXh0KSkge1xuICAgICAgICAgICAgICAgIHNldEFyZyhrZXksIG5leHQgPT09ICd0cnVlJywgYXJnKTtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZXRBcmcoa2V5LCBmbGFncy5zdHJpbmdzW2tleV0gPyAnJyA6IHRydWUsIGFyZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoL14tW14tXSsvLnRlc3QoYXJnKSkge1xuICAgICAgICAgICAgdmFyIGxldHRlcnMgPSBhcmcuc2xpY2UoMSwtMSkuc3BsaXQoJycpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgYnJva2VuID0gZmFsc2U7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGxldHRlcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dCA9IGFyZy5zbGljZShqKzIpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChuZXh0ID09PSAnLScpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0QXJnKGxldHRlcnNbal0sIG5leHQsIGFyZylcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICgvW0EtWmEtel0vLnRlc3QobGV0dGVyc1tqXSkgJiYgLz0vLnRlc3QobmV4dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0QXJnKGxldHRlcnNbal0sIG5leHQuc3BsaXQoJz0nKVsxXSwgYXJnKTtcbiAgICAgICAgICAgICAgICAgICAgYnJva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICgvW0EtWmEtel0vLnRlc3QobGV0dGVyc1tqXSlcbiAgICAgICAgICAgICAgICAmJiAvLT9cXGQrKFxcLlxcZCopPyhlLT9cXGQrKT8kLy50ZXN0KG5leHQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldEFyZyhsZXR0ZXJzW2pdLCBuZXh0LCBhcmcpO1xuICAgICAgICAgICAgICAgICAgICBicm9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKGxldHRlcnNbaisxXSAmJiBsZXR0ZXJzW2orMV0ubWF0Y2goL1xcVy8pKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldEFyZyhsZXR0ZXJzW2pdLCBhcmcuc2xpY2UoaisyKSwgYXJnKTtcbiAgICAgICAgICAgICAgICAgICAgYnJva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZXRBcmcobGV0dGVyc1tqXSwgZmxhZ3Muc3RyaW5nc1tsZXR0ZXJzW2pdXSA/ICcnIDogdHJ1ZSwgYXJnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBrZXkgPSBhcmcuc2xpY2UoLTEpWzBdO1xuICAgICAgICAgICAgaWYgKCFicm9rZW4gJiYga2V5ICE9PSAnLScpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJnc1tpKzFdICYmICEvXigtfC0tKVteLV0vLnRlc3QoYXJnc1tpKzFdKVxuICAgICAgICAgICAgICAgICYmICFmbGFncy5ib29sc1trZXldXG4gICAgICAgICAgICAgICAgJiYgKGFsaWFzZXNba2V5XSA/ICFhbGlhc0lzQm9vbGVhbihrZXkpIDogdHJ1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0QXJnKGtleSwgYXJnc1tpKzFdLCBhcmcpO1xuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGFyZ3NbaSsxXSAmJiAvdHJ1ZXxmYWxzZS8udGVzdChhcmdzW2krMV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldEFyZyhrZXksIGFyZ3NbaSsxXSA9PT0gJ3RydWUnLCBhcmcpO1xuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZXRBcmcoa2V5LCBmbGFncy5zdHJpbmdzW2tleV0gPyAnJyA6IHRydWUsIGFyZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFmbGFncy51bmtub3duRm4gfHwgZmxhZ3MudW5rbm93bkZuKGFyZykgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgYXJndi5fLnB1c2goXG4gICAgICAgICAgICAgICAgICAgIGZsYWdzLnN0cmluZ3NbJ18nXSB8fCAhaXNOdW1iZXIoYXJnKSA/IGFyZyA6IE51bWJlcihhcmcpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRzLnN0b3BFYXJseSkge1xuICAgICAgICAgICAgICAgIGFyZ3YuXy5wdXNoLmFwcGx5KGFyZ3YuXywgYXJncy5zbGljZShpICsgMSkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIE9iamVjdC5rZXlzKGRlZmF1bHRzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgaWYgKCFoYXNLZXkoYXJndiwga2V5LnNwbGl0KCcuJykpKSB7XG4gICAgICAgICAgICBzZXRLZXkoYXJndiwga2V5LnNwbGl0KCcuJyksIGRlZmF1bHRzW2tleV0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAoYWxpYXNlc1trZXldIHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgc2V0S2V5KGFyZ3YsIHguc3BsaXQoJy4nKSwgZGVmYXVsdHNba2V5XSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIFxuICAgIGlmIChvcHRzWyctLSddKSB7XG4gICAgICAgIGFyZ3ZbJy0tJ10gPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgbm90RmxhZ3MuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgIGFyZ3ZbJy0tJ10ucHVzaChrZXkpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIG5vdEZsYWdzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICBhcmd2Ll8ucHVzaChrZXkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXJndjtcbn07XG5cbmZ1bmN0aW9uIGhhc0tleSAob2JqLCBrZXlzKSB7XG4gICAgdmFyIG8gPSBvYmo7XG4gICAga2V5cy5zbGljZSgwLC0xKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgbyA9IChvW2tleV0gfHwge30pO1xuICAgIH0pO1xuXG4gICAgdmFyIGtleSA9IGtleXNba2V5cy5sZW5ndGggLSAxXTtcbiAgICByZXR1cm4ga2V5IGluIG87XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ID09PSAnbnVtYmVyJykgcmV0dXJuIHRydWU7XG4gICAgaWYgKC9eMHhbMC05YS1mXSskL2kudGVzdCh4KSkgcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIC9eWy0rXT8oPzpcXGQrKD86XFwuXFxkKik/fFxcLlxcZCspKGVbLStdP1xcZCspPyQvLnRlc3QoeCk7XG59XG5cbiIsInZhciBpb3RhID0gcmVxdWlyZShcImlvdGEtYXJyYXlcIilcbnZhciBpc0J1ZmZlciA9IHJlcXVpcmUoXCJpcy1idWZmZXJcIilcblxudmFyIGhhc1R5cGVkQXJyYXlzICA9ICgodHlwZW9mIEZsb2F0NjRBcnJheSkgIT09IFwidW5kZWZpbmVkXCIpXG5cbmZ1bmN0aW9uIGNvbXBhcmUxc3QoYSwgYikge1xuICByZXR1cm4gYVswXSAtIGJbMF1cbn1cblxuZnVuY3Rpb24gb3JkZXIoKSB7XG4gIHZhciBzdHJpZGUgPSB0aGlzLnN0cmlkZVxuICB2YXIgdGVybXMgPSBuZXcgQXJyYXkoc3RyaWRlLmxlbmd0aClcbiAgdmFyIGlcbiAgZm9yKGk9MDsgaTx0ZXJtcy5sZW5ndGg7ICsraSkge1xuICAgIHRlcm1zW2ldID0gW01hdGguYWJzKHN0cmlkZVtpXSksIGldXG4gIH1cbiAgdGVybXMuc29ydChjb21wYXJlMXN0KVxuICB2YXIgcmVzdWx0ID0gbmV3IEFycmF5KHRlcm1zLmxlbmd0aClcbiAgZm9yKGk9MDsgaTxyZXN1bHQubGVuZ3RoOyArK2kpIHtcbiAgICByZXN1bHRbaV0gPSB0ZXJtc1tpXVsxXVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuZnVuY3Rpb24gY29tcGlsZUNvbnN0cnVjdG9yKGR0eXBlLCBkaW1lbnNpb24pIHtcbiAgdmFyIGNsYXNzTmFtZSA9IFtcIlZpZXdcIiwgZGltZW5zaW9uLCBcImRcIiwgZHR5cGVdLmpvaW4oXCJcIilcbiAgaWYoZGltZW5zaW9uIDwgMCkge1xuICAgIGNsYXNzTmFtZSA9IFwiVmlld19OaWxcIiArIGR0eXBlXG4gIH1cbiAgdmFyIHVzZUdldHRlcnMgPSAoZHR5cGUgPT09IFwiZ2VuZXJpY1wiKVxuXG4gIGlmKGRpbWVuc2lvbiA9PT0gLTEpIHtcbiAgICAvL1NwZWNpYWwgY2FzZSBmb3IgdHJpdmlhbCBhcnJheXNcbiAgICB2YXIgY29kZSA9XG4gICAgICBcImZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIihhKXt0aGlzLmRhdGE9YTt9O1xcXG52YXIgcHJvdG89XCIrY2xhc3NOYW1lK1wiLnByb3RvdHlwZTtcXFxucHJvdG8uZHR5cGU9J1wiK2R0eXBlK1wiJztcXFxucHJvdG8uaW5kZXg9ZnVuY3Rpb24oKXtyZXR1cm4gLTF9O1xcXG5wcm90by5zaXplPTA7XFxcbnByb3RvLmRpbWVuc2lvbj0tMTtcXFxucHJvdG8uc2hhcGU9cHJvdG8uc3RyaWRlPXByb3RvLm9yZGVyPVtdO1xcXG5wcm90by5sbz1wcm90by5oaT1wcm90by50cmFuc3Bvc2U9cHJvdG8uc3RlcD1cXFxuZnVuY3Rpb24oKXtyZXR1cm4gbmV3IFwiK2NsYXNzTmFtZStcIih0aGlzLmRhdGEpO307XFxcbnByb3RvLmdldD1wcm90by5zZXQ9ZnVuY3Rpb24oKXt9O1xcXG5wcm90by5waWNrPWZ1bmN0aW9uKCl7cmV0dXJuIG51bGx9O1xcXG5yZXR1cm4gZnVuY3Rpb24gY29uc3RydWN0X1wiK2NsYXNzTmFtZStcIihhKXtyZXR1cm4gbmV3IFwiK2NsYXNzTmFtZStcIihhKTt9XCJcbiAgICB2YXIgcHJvY2VkdXJlID0gbmV3IEZ1bmN0aW9uKGNvZGUpXG4gICAgcmV0dXJuIHByb2NlZHVyZSgpXG4gIH0gZWxzZSBpZihkaW1lbnNpb24gPT09IDApIHtcbiAgICAvL1NwZWNpYWwgY2FzZSBmb3IgMGQgYXJyYXlzXG4gICAgdmFyIGNvZGUgPVxuICAgICAgXCJmdW5jdGlvbiBcIitjbGFzc05hbWUrXCIoYSxkKSB7XFxcbnRoaXMuZGF0YSA9IGE7XFxcbnRoaXMub2Zmc2V0ID0gZFxcXG59O1xcXG52YXIgcHJvdG89XCIrY2xhc3NOYW1lK1wiLnByb3RvdHlwZTtcXFxucHJvdG8uZHR5cGU9J1wiK2R0eXBlK1wiJztcXFxucHJvdG8uaW5kZXg9ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5vZmZzZXR9O1xcXG5wcm90by5kaW1lbnNpb249MDtcXFxucHJvdG8uc2l6ZT0xO1xcXG5wcm90by5zaGFwZT1cXFxucHJvdG8uc3RyaWRlPVxcXG5wcm90by5vcmRlcj1bXTtcXFxucHJvdG8ubG89XFxcbnByb3RvLmhpPVxcXG5wcm90by50cmFuc3Bvc2U9XFxcbnByb3RvLnN0ZXA9ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX2NvcHkoKSB7XFxcbnJldHVybiBuZXcgXCIrY2xhc3NOYW1lK1wiKHRoaXMuZGF0YSx0aGlzLm9mZnNldClcXFxufTtcXFxucHJvdG8ucGljaz1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfcGljaygpe1xcXG5yZXR1cm4gVHJpdmlhbEFycmF5KHRoaXMuZGF0YSk7XFxcbn07XFxcbnByb3RvLnZhbHVlT2Y9cHJvdG8uZ2V0PWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9nZXQoKXtcXFxucmV0dXJuIFwiKyh1c2VHZXR0ZXJzID8gXCJ0aGlzLmRhdGEuZ2V0KHRoaXMub2Zmc2V0KVwiIDogXCJ0aGlzLmRhdGFbdGhpcy5vZmZzZXRdXCIpK1xuXCJ9O1xcXG5wcm90by5zZXQ9ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX3NldCh2KXtcXFxucmV0dXJuIFwiKyh1c2VHZXR0ZXJzID8gXCJ0aGlzLmRhdGEuc2V0KHRoaXMub2Zmc2V0LHYpXCIgOiBcInRoaXMuZGF0YVt0aGlzLm9mZnNldF09dlwiKStcIlxcXG59O1xcXG5yZXR1cm4gZnVuY3Rpb24gY29uc3RydWN0X1wiK2NsYXNzTmFtZStcIihhLGIsYyxkKXtyZXR1cm4gbmV3IFwiK2NsYXNzTmFtZStcIihhLGQpfVwiXG4gICAgdmFyIHByb2NlZHVyZSA9IG5ldyBGdW5jdGlvbihcIlRyaXZpYWxBcnJheVwiLCBjb2RlKVxuICAgIHJldHVybiBwcm9jZWR1cmUoQ0FDSEVEX0NPTlNUUlVDVE9SU1tkdHlwZV1bMF0pXG4gIH1cblxuICB2YXIgY29kZSA9IFtcIid1c2Ugc3RyaWN0J1wiXVxuXG4gIC8vQ3JlYXRlIGNvbnN0cnVjdG9yIGZvciB2aWV3XG4gIHZhciBpbmRpY2VzID0gaW90YShkaW1lbnNpb24pXG4gIHZhciBhcmdzID0gaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkgeyByZXR1cm4gXCJpXCIraSB9KVxuICB2YXIgaW5kZXhfc3RyID0gXCJ0aGlzLm9mZnNldCtcIiArIGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgcmV0dXJuIFwidGhpcy5zdHJpZGVbXCIgKyBpICsgXCJdKmlcIiArIGlcbiAgICAgIH0pLmpvaW4oXCIrXCIpXG4gIHZhciBzaGFwZUFyZyA9IGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBcImJcIitpXG4gICAgfSkuam9pbihcIixcIilcbiAgdmFyIHN0cmlkZUFyZyA9IGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBcImNcIitpXG4gICAgfSkuam9pbihcIixcIilcbiAgY29kZS5wdXNoKFxuICAgIFwiZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiKGEsXCIgKyBzaGFwZUFyZyArIFwiLFwiICsgc3RyaWRlQXJnICsgXCIsZCl7dGhpcy5kYXRhPWFcIixcbiAgICAgIFwidGhpcy5zaGFwZT1bXCIgKyBzaGFwZUFyZyArIFwiXVwiLFxuICAgICAgXCJ0aGlzLnN0cmlkZT1bXCIgKyBzdHJpZGVBcmcgKyBcIl1cIixcbiAgICAgIFwidGhpcy5vZmZzZXQ9ZHwwfVwiLFxuICAgIFwidmFyIHByb3RvPVwiK2NsYXNzTmFtZStcIi5wcm90b3R5cGVcIixcbiAgICBcInByb3RvLmR0eXBlPSdcIitkdHlwZStcIidcIixcbiAgICBcInByb3RvLmRpbWVuc2lvbj1cIitkaW1lbnNpb24pXG5cbiAgLy92aWV3LnNpemU6XG4gIGNvZGUucHVzaChcIk9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywnc2l6ZScse2dldDpmdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfc2l6ZSgpe1xcXG5yZXR1cm4gXCIraW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkgeyByZXR1cm4gXCJ0aGlzLnNoYXBlW1wiK2krXCJdXCIgfSkuam9pbihcIipcIiksXG5cIn19KVwiKVxuXG4gIC8vdmlldy5vcmRlcjpcbiAgaWYoZGltZW5zaW9uID09PSAxKSB7XG4gICAgY29kZS5wdXNoKFwicHJvdG8ub3JkZXI9WzBdXCIpXG4gIH0gZWxzZSB7XG4gICAgY29kZS5wdXNoKFwiT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCdvcmRlcicse2dldDpcIilcbiAgICBpZihkaW1lbnNpb24gPCA0KSB7XG4gICAgICBjb2RlLnB1c2goXCJmdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfb3JkZXIoKXtcIilcbiAgICAgIGlmKGRpbWVuc2lvbiA9PT0gMikge1xuICAgICAgICBjb2RlLnB1c2goXCJyZXR1cm4gKE1hdGguYWJzKHRoaXMuc3RyaWRlWzBdKT5NYXRoLmFicyh0aGlzLnN0cmlkZVsxXSkpP1sxLDBdOlswLDFdfX0pXCIpXG4gICAgICB9IGVsc2UgaWYoZGltZW5zaW9uID09PSAzKSB7XG4gICAgICAgIGNvZGUucHVzaChcblwidmFyIHMwPU1hdGguYWJzKHRoaXMuc3RyaWRlWzBdKSxzMT1NYXRoLmFicyh0aGlzLnN0cmlkZVsxXSksczI9TWF0aC5hYnModGhpcy5zdHJpZGVbMl0pO1xcXG5pZihzMD5zMSl7XFxcbmlmKHMxPnMyKXtcXFxucmV0dXJuIFsyLDEsMF07XFxcbn1lbHNlIGlmKHMwPnMyKXtcXFxucmV0dXJuIFsxLDIsMF07XFxcbn1lbHNle1xcXG5yZXR1cm4gWzEsMCwyXTtcXFxufVxcXG59ZWxzZSBpZihzMD5zMil7XFxcbnJldHVybiBbMiwwLDFdO1xcXG59ZWxzZSBpZihzMj5zMSl7XFxcbnJldHVybiBbMCwxLDJdO1xcXG59ZWxzZXtcXFxucmV0dXJuIFswLDIsMV07XFxcbn19fSlcIilcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29kZS5wdXNoKFwiT1JERVJ9KVwiKVxuICAgIH1cbiAgfVxuXG4gIC8vdmlldy5zZXQoaTAsIC4uLiwgdik6XG4gIGNvZGUucHVzaChcblwicHJvdG8uc2V0PWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9zZXQoXCIrYXJncy5qb2luKFwiLFwiKStcIix2KXtcIilcbiAgaWYodXNlR2V0dGVycykge1xuICAgIGNvZGUucHVzaChcInJldHVybiB0aGlzLmRhdGEuc2V0KFwiK2luZGV4X3N0citcIix2KX1cIilcbiAgfSBlbHNlIHtcbiAgICBjb2RlLnB1c2goXCJyZXR1cm4gdGhpcy5kYXRhW1wiK2luZGV4X3N0citcIl09dn1cIilcbiAgfVxuXG4gIC8vdmlldy5nZXQoaTAsIC4uLik6XG4gIGNvZGUucHVzaChcInByb3RvLmdldD1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfZ2V0KFwiK2FyZ3Muam9pbihcIixcIikrXCIpe1wiKVxuICBpZih1c2VHZXR0ZXJzKSB7XG4gICAgY29kZS5wdXNoKFwicmV0dXJuIHRoaXMuZGF0YS5nZXQoXCIraW5kZXhfc3RyK1wiKX1cIilcbiAgfSBlbHNlIHtcbiAgICBjb2RlLnB1c2goXCJyZXR1cm4gdGhpcy5kYXRhW1wiK2luZGV4X3N0citcIl19XCIpXG4gIH1cblxuICAvL3ZpZXcuaW5kZXg6XG4gIGNvZGUucHVzaChcbiAgICBcInByb3RvLmluZGV4PWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9pbmRleChcIiwgYXJncy5qb2luKCksIFwiKXtyZXR1cm4gXCIraW5kZXhfc3RyK1wifVwiKVxuXG4gIC8vdmlldy5oaSgpOlxuICBjb2RlLnB1c2goXCJwcm90by5oaT1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfaGkoXCIrYXJncy5qb2luKFwiLFwiKStcIil7cmV0dXJuIG5ldyBcIitjbGFzc05hbWUrXCIodGhpcy5kYXRhLFwiK1xuICAgIGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBbXCIodHlwZW9mIGlcIixpLFwiIT09J251bWJlcid8fGlcIixpLFwiPDApP3RoaXMuc2hhcGVbXCIsIGksIFwiXTppXCIsIGksXCJ8MFwiXS5qb2luKFwiXCIpXG4gICAgfSkuam9pbihcIixcIikrXCIsXCIrXG4gICAgaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFwidGhpcy5zdHJpZGVbXCIraSArIFwiXVwiXG4gICAgfSkuam9pbihcIixcIikrXCIsdGhpcy5vZmZzZXQpfVwiKVxuXG4gIC8vdmlldy5sbygpOlxuICB2YXIgYV92YXJzID0gaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkgeyByZXR1cm4gXCJhXCIraStcIj10aGlzLnNoYXBlW1wiK2krXCJdXCIgfSlcbiAgdmFyIGNfdmFycyA9IGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHsgcmV0dXJuIFwiY1wiK2krXCI9dGhpcy5zdHJpZGVbXCIraStcIl1cIiB9KVxuICBjb2RlLnB1c2goXCJwcm90by5sbz1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfbG8oXCIrYXJncy5qb2luKFwiLFwiKStcIil7dmFyIGI9dGhpcy5vZmZzZXQsZD0wLFwiK2FfdmFycy5qb2luKFwiLFwiKStcIixcIitjX3ZhcnMuam9pbihcIixcIikpXG4gIGZvcih2YXIgaT0wOyBpPGRpbWVuc2lvbjsgKytpKSB7XG4gICAgY29kZS5wdXNoKFxuXCJpZih0eXBlb2YgaVwiK2krXCI9PT0nbnVtYmVyJyYmaVwiK2krXCI+PTApe1xcXG5kPWlcIitpK1wifDA7XFxcbmIrPWNcIitpK1wiKmQ7XFxcbmFcIitpK1wiLT1kfVwiKVxuICB9XG4gIGNvZGUucHVzaChcInJldHVybiBuZXcgXCIrY2xhc3NOYW1lK1wiKHRoaXMuZGF0YSxcIitcbiAgICBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gXCJhXCIraVxuICAgIH0pLmpvaW4oXCIsXCIpK1wiLFwiK1xuICAgIGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBcImNcIitpXG4gICAgfSkuam9pbihcIixcIikrXCIsYil9XCIpXG5cbiAgLy92aWV3LnN0ZXAoKTpcbiAgY29kZS5wdXNoKFwicHJvdG8uc3RlcD1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfc3RlcChcIithcmdzLmpvaW4oXCIsXCIpK1wiKXt2YXIgXCIrXG4gICAgaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFwiYVwiK2krXCI9dGhpcy5zaGFwZVtcIitpK1wiXVwiXG4gICAgfSkuam9pbihcIixcIikrXCIsXCIrXG4gICAgaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFwiYlwiK2krXCI9dGhpcy5zdHJpZGVbXCIraStcIl1cIlxuICAgIH0pLmpvaW4oXCIsXCIpK1wiLGM9dGhpcy5vZmZzZXQsZD0wLGNlaWw9TWF0aC5jZWlsXCIpXG4gIGZvcih2YXIgaT0wOyBpPGRpbWVuc2lvbjsgKytpKSB7XG4gICAgY29kZS5wdXNoKFxuXCJpZih0eXBlb2YgaVwiK2krXCI9PT0nbnVtYmVyJyl7XFxcbmQ9aVwiK2krXCJ8MDtcXFxuaWYoZDwwKXtcXFxuYys9YlwiK2krXCIqKGFcIitpK1wiLTEpO1xcXG5hXCIraStcIj1jZWlsKC1hXCIraStcIi9kKVxcXG59ZWxzZXtcXFxuYVwiK2krXCI9Y2VpbChhXCIraStcIi9kKVxcXG59XFxcbmJcIitpK1wiKj1kXFxcbn1cIilcbiAgfVxuICBjb2RlLnB1c2goXCJyZXR1cm4gbmV3IFwiK2NsYXNzTmFtZStcIih0aGlzLmRhdGEsXCIrXG4gICAgaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFwiYVwiICsgaVxuICAgIH0pLmpvaW4oXCIsXCIpK1wiLFwiK1xuICAgIGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBcImJcIiArIGlcbiAgICB9KS5qb2luKFwiLFwiKStcIixjKX1cIilcblxuICAvL3ZpZXcudHJhbnNwb3NlKCk6XG4gIHZhciB0U2hhcGUgPSBuZXcgQXJyYXkoZGltZW5zaW9uKVxuICB2YXIgdFN0cmlkZSA9IG5ldyBBcnJheShkaW1lbnNpb24pXG4gIGZvcih2YXIgaT0wOyBpPGRpbWVuc2lvbjsgKytpKSB7XG4gICAgdFNoYXBlW2ldID0gXCJhW2lcIitpK1wiXVwiXG4gICAgdFN0cmlkZVtpXSA9IFwiYltpXCIraStcIl1cIlxuICB9XG4gIGNvZGUucHVzaChcInByb3RvLnRyYW5zcG9zZT1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfdHJhbnNwb3NlKFwiK2FyZ3MrXCIpe1wiK1xuICAgIGFyZ3MubWFwKGZ1bmN0aW9uKG4saWR4KSB7IHJldHVybiBuICsgXCI9KFwiICsgbiArIFwiPT09dW5kZWZpbmVkP1wiICsgaWR4ICsgXCI6XCIgKyBuICsgXCJ8MClcIn0pLmpvaW4oXCI7XCIpLFxuICAgIFwidmFyIGE9dGhpcy5zaGFwZSxiPXRoaXMuc3RyaWRlO3JldHVybiBuZXcgXCIrY2xhc3NOYW1lK1wiKHRoaXMuZGF0YSxcIit0U2hhcGUuam9pbihcIixcIikrXCIsXCIrdFN0cmlkZS5qb2luKFwiLFwiKStcIix0aGlzLm9mZnNldCl9XCIpXG5cbiAgLy92aWV3LnBpY2soKTpcbiAgY29kZS5wdXNoKFwicHJvdG8ucGljaz1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfcGljayhcIithcmdzK1wiKXt2YXIgYT1bXSxiPVtdLGM9dGhpcy5vZmZzZXRcIilcbiAgZm9yKHZhciBpPTA7IGk8ZGltZW5zaW9uOyArK2kpIHtcbiAgICBjb2RlLnB1c2goXCJpZih0eXBlb2YgaVwiK2krXCI9PT0nbnVtYmVyJyYmaVwiK2krXCI+PTApe2M9KGMrdGhpcy5zdHJpZGVbXCIraStcIl0qaVwiK2krXCIpfDB9ZWxzZXthLnB1c2godGhpcy5zaGFwZVtcIitpK1wiXSk7Yi5wdXNoKHRoaXMuc3RyaWRlW1wiK2krXCJdKX1cIilcbiAgfVxuICBjb2RlLnB1c2goXCJ2YXIgY3Rvcj1DVE9SX0xJU1RbYS5sZW5ndGgrMV07cmV0dXJuIGN0b3IodGhpcy5kYXRhLGEsYixjKX1cIilcblxuICAvL0FkZCByZXR1cm4gc3RhdGVtZW50XG4gIGNvZGUucHVzaChcInJldHVybiBmdW5jdGlvbiBjb25zdHJ1Y3RfXCIrY2xhc3NOYW1lK1wiKGRhdGEsc2hhcGUsc3RyaWRlLG9mZnNldCl7cmV0dXJuIG5ldyBcIitjbGFzc05hbWUrXCIoZGF0YSxcIitcbiAgICBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gXCJzaGFwZVtcIitpK1wiXVwiXG4gICAgfSkuam9pbihcIixcIikrXCIsXCIrXG4gICAgaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFwic3RyaWRlW1wiK2krXCJdXCJcbiAgICB9KS5qb2luKFwiLFwiKStcIixvZmZzZXQpfVwiKVxuXG4gIC8vQ29tcGlsZSBwcm9jZWR1cmVcbiAgdmFyIHByb2NlZHVyZSA9IG5ldyBGdW5jdGlvbihcIkNUT1JfTElTVFwiLCBcIk9SREVSXCIsIGNvZGUuam9pbihcIlxcblwiKSlcbiAgcmV0dXJuIHByb2NlZHVyZShDQUNIRURfQ09OU1RSVUNUT1JTW2R0eXBlXSwgb3JkZXIpXG59XG5cbmZ1bmN0aW9uIGFycmF5RFR5cGUoZGF0YSkge1xuICBpZihpc0J1ZmZlcihkYXRhKSkge1xuICAgIHJldHVybiBcImJ1ZmZlclwiXG4gIH1cbiAgaWYoaGFzVHlwZWRBcnJheXMpIHtcbiAgICBzd2l0Y2goT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGRhdGEpKSB7XG4gICAgICBjYXNlIFwiW29iamVjdCBGbG9hdDY0QXJyYXldXCI6XG4gICAgICAgIHJldHVybiBcImZsb2F0NjRcIlxuICAgICAgY2FzZSBcIltvYmplY3QgRmxvYXQzMkFycmF5XVwiOlxuICAgICAgICByZXR1cm4gXCJmbG9hdDMyXCJcbiAgICAgIGNhc2UgXCJbb2JqZWN0IEludDhBcnJheV1cIjpcbiAgICAgICAgcmV0dXJuIFwiaW50OFwiXG4gICAgICBjYXNlIFwiW29iamVjdCBJbnQxNkFycmF5XVwiOlxuICAgICAgICByZXR1cm4gXCJpbnQxNlwiXG4gICAgICBjYXNlIFwiW29iamVjdCBJbnQzMkFycmF5XVwiOlxuICAgICAgICByZXR1cm4gXCJpbnQzMlwiXG4gICAgICBjYXNlIFwiW29iamVjdCBVaW50OEFycmF5XVwiOlxuICAgICAgICByZXR1cm4gXCJ1aW50OFwiXG4gICAgICBjYXNlIFwiW29iamVjdCBVaW50MTZBcnJheV1cIjpcbiAgICAgICAgcmV0dXJuIFwidWludDE2XCJcbiAgICAgIGNhc2UgXCJbb2JqZWN0IFVpbnQzMkFycmF5XVwiOlxuICAgICAgICByZXR1cm4gXCJ1aW50MzJcIlxuICAgICAgY2FzZSBcIltvYmplY3QgVWludDhDbGFtcGVkQXJyYXldXCI6XG4gICAgICAgIHJldHVybiBcInVpbnQ4X2NsYW1wZWRcIlxuICAgIH1cbiAgfVxuICBpZihBcnJheS5pc0FycmF5KGRhdGEpKSB7XG4gICAgcmV0dXJuIFwiYXJyYXlcIlxuICB9XG4gIHJldHVybiBcImdlbmVyaWNcIlxufVxuXG52YXIgQ0FDSEVEX0NPTlNUUlVDVE9SUyA9IHtcbiAgXCJmbG9hdDMyXCI6W10sXG4gIFwiZmxvYXQ2NFwiOltdLFxuICBcImludDhcIjpbXSxcbiAgXCJpbnQxNlwiOltdLFxuICBcImludDMyXCI6W10sXG4gIFwidWludDhcIjpbXSxcbiAgXCJ1aW50MTZcIjpbXSxcbiAgXCJ1aW50MzJcIjpbXSxcbiAgXCJhcnJheVwiOltdLFxuICBcInVpbnQ4X2NsYW1wZWRcIjpbXSxcbiAgXCJidWZmZXJcIjpbXSxcbiAgXCJnZW5lcmljXCI6W11cbn1cblxuOyhmdW5jdGlvbigpIHtcbiAgZm9yKHZhciBpZCBpbiBDQUNIRURfQ09OU1RSVUNUT1JTKSB7XG4gICAgQ0FDSEVEX0NPTlNUUlVDVE9SU1tpZF0ucHVzaChjb21waWxlQ29uc3RydWN0b3IoaWQsIC0xKSlcbiAgfVxufSk7XG5cbmZ1bmN0aW9uIHdyYXBwZWROREFycmF5Q3RvcihkYXRhLCBzaGFwZSwgc3RyaWRlLCBvZmZzZXQpIHtcbiAgaWYoZGF0YSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdmFyIGN0b3IgPSBDQUNIRURfQ09OU1RSVUNUT1JTLmFycmF5WzBdXG4gICAgcmV0dXJuIGN0b3IoW10pXG4gIH0gZWxzZSBpZih0eXBlb2YgZGF0YSA9PT0gXCJudW1iZXJcIikge1xuICAgIGRhdGEgPSBbZGF0YV1cbiAgfVxuICBpZihzaGFwZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgc2hhcGUgPSBbIGRhdGEubGVuZ3RoIF1cbiAgfVxuICB2YXIgZCA9IHNoYXBlLmxlbmd0aFxuICBpZihzdHJpZGUgPT09IHVuZGVmaW5lZCkge1xuICAgIHN0cmlkZSA9IG5ldyBBcnJheShkKVxuICAgIGZvcih2YXIgaT1kLTEsIHN6PTE7IGk+PTA7IC0taSkge1xuICAgICAgc3RyaWRlW2ldID0gc3pcbiAgICAgIHN6ICo9IHNoYXBlW2ldXG4gICAgfVxuICB9XG4gIGlmKG9mZnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgb2Zmc2V0ID0gMFxuICAgIGZvcih2YXIgaT0wOyBpPGQ7ICsraSkge1xuICAgICAgaWYoc3RyaWRlW2ldIDwgMCkge1xuICAgICAgICBvZmZzZXQgLT0gKHNoYXBlW2ldLTEpKnN0cmlkZVtpXVxuICAgICAgfVxuICAgIH1cbiAgfVxuICB2YXIgZHR5cGUgPSBhcnJheURUeXBlKGRhdGEpXG4gIHZhciBjdG9yX2xpc3QgPSBDQUNIRURfQ09OU1RSVUNUT1JTW2R0eXBlXVxuICB3aGlsZShjdG9yX2xpc3QubGVuZ3RoIDw9IGQrMSkge1xuICAgIGN0b3JfbGlzdC5wdXNoKGNvbXBpbGVDb25zdHJ1Y3RvcihkdHlwZSwgY3Rvcl9saXN0Lmxlbmd0aC0xKSlcbiAgfVxuICB2YXIgY3RvciA9IGN0b3JfbGlzdFtkKzFdXG4gIHJldHVybiBjdG9yKGRhdGEsIHNoYXBlLCBzdHJpZGUsIG9mZnNldClcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB3cmFwcGVkTkRBcnJheUN0b3JcbiIsIi8qKlxuICogRGV0ZXJtaW5lIGlmIGFuIG9iamVjdCBpcyBCdWZmZXJcbiAqXG4gKiBBdXRob3I6ICAgRmVyb3NzIEFib3VraGFkaWplaCA8ZmVyb3NzQGZlcm9zcy5vcmc+IDxodHRwOi8vZmVyb3NzLm9yZz5cbiAqIExpY2Vuc2U6ICBNSVRcbiAqXG4gKiBgbnBtIGluc3RhbGwgaXMtYnVmZmVyYFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gISEob2JqICE9IG51bGwgJiZcbiAgICAob2JqLl9pc0J1ZmZlciB8fCAvLyBGb3IgU2FmYXJpIDUtNyAobWlzc2luZyBPYmplY3QucHJvdG90eXBlLmNvbnN0cnVjdG9yKVxuICAgICAgKG9iai5jb25zdHJ1Y3RvciAmJlxuICAgICAgdHlwZW9mIG9iai5jb25zdHJ1Y3Rvci5pc0J1ZmZlciA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgb2JqLmNvbnN0cnVjdG9yLmlzQnVmZmVyKG9iaikpXG4gICAgKSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBvaW50LCB2cykge1xuICAgIC8vIHJheS1jYXN0aW5nIGFsZ29yaXRobSBiYXNlZCBvblxuICAgIC8vIGh0dHA6Ly93d3cuZWNzZS5ycGkuZWR1L0hvbWVwYWdlcy93cmYvUmVzZWFyY2gvU2hvcnRfTm90ZXMvcG5wb2x5Lmh0bWxcbiAgICBcbiAgICB2YXIgeCA9IHBvaW50WzBdLCB5ID0gcG9pbnRbMV07XG4gICAgXG4gICAgdmFyIGluc2lkZSA9IGZhbHNlO1xuICAgIGZvciAodmFyIGkgPSAwLCBqID0gdnMubGVuZ3RoIC0gMTsgaSA8IHZzLmxlbmd0aDsgaiA9IGkrKykge1xuICAgICAgICB2YXIgeGkgPSB2c1tpXVswXSwgeWkgPSB2c1tpXVsxXTtcbiAgICAgICAgdmFyIHhqID0gdnNbal1bMF0sIHlqID0gdnNbal1bMV07XG4gICAgICAgIFxuICAgICAgICB2YXIgaW50ZXJzZWN0ID0gKCh5aSA+IHkpICE9ICh5aiA+IHkpKVxuICAgICAgICAgICAgJiYgKHggPCAoeGogLSB4aSkgKiAoeSAtIHlpKSAvICh5aiAtIHlpKSArIHhpKTtcbiAgICAgICAgaWYgKGludGVyc2VjdCkgaW5zaWRlID0gIWluc2lkZTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGluc2lkZTtcbn07XG4iLCIvKipcbiAqIEBhdXRob3IgbXJkb29iIC8gaHR0cDovL21yZG9vYi5jb20vXG4gKi9cblxudmFyIFN0YXRzID0gZnVuY3Rpb24gKCkge1xuXG5cdHZhciBzdGFydFRpbWUgPSBEYXRlLm5vdygpLCBwcmV2VGltZSA9IHN0YXJ0VGltZTtcblx0dmFyIG1zID0gMCwgbXNNaW4gPSBJbmZpbml0eSwgbXNNYXggPSAwO1xuXHR2YXIgZnBzID0gMCwgZnBzTWluID0gSW5maW5pdHksIGZwc01heCA9IDA7XG5cdHZhciBmcmFtZXMgPSAwLCBtb2RlID0gMDtcblxuXHR2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0Y29udGFpbmVyLmlkID0gJ3N0YXRzJztcblx0Y29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoICdtb3VzZWRvd24nLCBmdW5jdGlvbiAoIGV2ZW50ICkgeyBldmVudC5wcmV2ZW50RGVmYXVsdCgpOyBzZXRNb2RlKCArKyBtb2RlICUgMiApIH0sIGZhbHNlICk7XG5cdGNvbnRhaW5lci5zdHlsZS5jc3NUZXh0ID0gJ3dpZHRoOjgwcHg7b3BhY2l0eTowLjk7Y3Vyc29yOnBvaW50ZXInO1xuXG5cdHZhciBmcHNEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuXHRmcHNEaXYuaWQgPSAnZnBzJztcblx0ZnBzRGl2LnN0eWxlLmNzc1RleHQgPSAncGFkZGluZzowIDAgM3B4IDNweDt0ZXh0LWFsaWduOmxlZnQ7YmFja2dyb3VuZC1jb2xvcjojMDAyJztcblx0Y29udGFpbmVyLmFwcGVuZENoaWxkKCBmcHNEaXYgKTtcblxuXHR2YXIgZnBzVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG5cdGZwc1RleHQuaWQgPSAnZnBzVGV4dCc7XG5cdGZwc1RleHQuc3R5bGUuY3NzVGV4dCA9ICdjb2xvcjojMGZmO2ZvbnQtZmFtaWx5OkhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmO2ZvbnQtc2l6ZTo5cHg7Zm9udC13ZWlnaHQ6Ym9sZDtsaW5lLWhlaWdodDoxNXB4Jztcblx0ZnBzVGV4dC5pbm5lckhUTUwgPSAnRlBTJztcblx0ZnBzRGl2LmFwcGVuZENoaWxkKCBmcHNUZXh0ICk7XG5cblx0dmFyIGZwc0dyYXBoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0ZnBzR3JhcGguaWQgPSAnZnBzR3JhcGgnO1xuXHRmcHNHcmFwaC5zdHlsZS5jc3NUZXh0ID0gJ3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjc0cHg7aGVpZ2h0OjMwcHg7YmFja2dyb3VuZC1jb2xvcjojMGZmJztcblx0ZnBzRGl2LmFwcGVuZENoaWxkKCBmcHNHcmFwaCApO1xuXG5cdHdoaWxlICggZnBzR3JhcGguY2hpbGRyZW4ubGVuZ3RoIDwgNzQgKSB7XG5cblx0XHR2YXIgYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ3NwYW4nICk7XG5cdFx0YmFyLnN0eWxlLmNzc1RleHQgPSAnd2lkdGg6MXB4O2hlaWdodDozMHB4O2Zsb2F0OmxlZnQ7YmFja2dyb3VuZC1jb2xvcjojMTEzJztcblx0XHRmcHNHcmFwaC5hcHBlbmRDaGlsZCggYmFyICk7XG5cblx0fVxuXG5cdHZhciBtc0RpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG5cdG1zRGl2LmlkID0gJ21zJztcblx0bXNEaXYuc3R5bGUuY3NzVGV4dCA9ICdwYWRkaW5nOjAgMCAzcHggM3B4O3RleHQtYWxpZ246bGVmdDtiYWNrZ3JvdW5kLWNvbG9yOiMwMjA7ZGlzcGxheTpub25lJztcblx0Y29udGFpbmVyLmFwcGVuZENoaWxkKCBtc0RpdiApO1xuXG5cdHZhciBtc1RleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuXHRtc1RleHQuaWQgPSAnbXNUZXh0Jztcblx0bXNUZXh0LnN0eWxlLmNzc1RleHQgPSAnY29sb3I6IzBmMDtmb250LWZhbWlseTpIZWx2ZXRpY2EsQXJpYWwsc2Fucy1zZXJpZjtmb250LXNpemU6OXB4O2ZvbnQtd2VpZ2h0OmJvbGQ7bGluZS1oZWlnaHQ6MTVweCc7XG5cdG1zVGV4dC5pbm5lckhUTUwgPSAnTVMnO1xuXHRtc0Rpdi5hcHBlbmRDaGlsZCggbXNUZXh0ICk7XG5cblx0dmFyIG1zR3JhcGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuXHRtc0dyYXBoLmlkID0gJ21zR3JhcGgnO1xuXHRtc0dyYXBoLnN0eWxlLmNzc1RleHQgPSAncG9zaXRpb246cmVsYXRpdmU7d2lkdGg6NzRweDtoZWlnaHQ6MzBweDtiYWNrZ3JvdW5kLWNvbG9yOiMwZjAnO1xuXHRtc0Rpdi5hcHBlbmRDaGlsZCggbXNHcmFwaCApO1xuXG5cdHdoaWxlICggbXNHcmFwaC5jaGlsZHJlbi5sZW5ndGggPCA3NCApIHtcblxuXHRcdHZhciBiYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnc3BhbicgKTtcblx0XHRiYXIuc3R5bGUuY3NzVGV4dCA9ICd3aWR0aDoxcHg7aGVpZ2h0OjMwcHg7ZmxvYXQ6bGVmdDtiYWNrZ3JvdW5kLWNvbG9yOiMxMzEnO1xuXHRcdG1zR3JhcGguYXBwZW5kQ2hpbGQoIGJhciApO1xuXG5cdH1cblxuXHR2YXIgc2V0TW9kZSA9IGZ1bmN0aW9uICggdmFsdWUgKSB7XG5cblx0XHRtb2RlID0gdmFsdWU7XG5cblx0XHRzd2l0Y2ggKCBtb2RlICkge1xuXG5cdFx0XHRjYXNlIDA6XG5cdFx0XHRcdGZwc0Rpdi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblx0XHRcdFx0bXNEaXYuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIDE6XG5cdFx0XHRcdGZwc0Rpdi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXHRcdFx0XHRtc0Rpdi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXG5cdH07XG5cblx0dmFyIHVwZGF0ZUdyYXBoID0gZnVuY3Rpb24gKCBkb20sIHZhbHVlICkge1xuXG5cdFx0dmFyIGNoaWxkID0gZG9tLmFwcGVuZENoaWxkKCBkb20uZmlyc3RDaGlsZCApO1xuXHRcdGNoaWxkLnN0eWxlLmhlaWdodCA9IHZhbHVlICsgJ3B4JztcblxuXHR9O1xuXG5cdHJldHVybiB7XG5cblx0XHRSRVZJU0lPTjogMTIsXG5cblx0XHRkb21FbGVtZW50OiBjb250YWluZXIsXG5cblx0XHRzZXRNb2RlOiBzZXRNb2RlLFxuXG5cdFx0YmVnaW46IGZ1bmN0aW9uICgpIHtcblxuXHRcdFx0c3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcblxuXHRcdH0sXG5cblx0XHRlbmQ6IGZ1bmN0aW9uICgpIHtcblxuXHRcdFx0dmFyIHRpbWUgPSBEYXRlLm5vdygpO1xuXG5cdFx0XHRtcyA9IHRpbWUgLSBzdGFydFRpbWU7XG5cdFx0XHRtc01pbiA9IE1hdGgubWluKCBtc01pbiwgbXMgKTtcblx0XHRcdG1zTWF4ID0gTWF0aC5tYXgoIG1zTWF4LCBtcyApO1xuXG5cdFx0XHRtc1RleHQudGV4dENvbnRlbnQgPSBtcyArICcgTVMgKCcgKyBtc01pbiArICctJyArIG1zTWF4ICsgJyknO1xuXHRcdFx0dXBkYXRlR3JhcGgoIG1zR3JhcGgsIE1hdGgubWluKCAzMCwgMzAgLSAoIG1zIC8gMjAwICkgKiAzMCApICk7XG5cblx0XHRcdGZyYW1lcyArKztcblxuXHRcdFx0aWYgKCB0aW1lID4gcHJldlRpbWUgKyAxMDAwICkge1xuXG5cdFx0XHRcdGZwcyA9IE1hdGgucm91bmQoICggZnJhbWVzICogMTAwMCApIC8gKCB0aW1lIC0gcHJldlRpbWUgKSApO1xuXHRcdFx0XHRmcHNNaW4gPSBNYXRoLm1pbiggZnBzTWluLCBmcHMgKTtcblx0XHRcdFx0ZnBzTWF4ID0gTWF0aC5tYXgoIGZwc01heCwgZnBzICk7XG5cblx0XHRcdFx0ZnBzVGV4dC50ZXh0Q29udGVudCA9IGZwcyArICcgRlBTICgnICsgZnBzTWluICsgJy0nICsgZnBzTWF4ICsgJyknO1xuXHRcdFx0XHR1cGRhdGVHcmFwaCggZnBzR3JhcGgsIE1hdGgubWluKCAzMCwgMzAgLSAoIGZwcyAvIDEwMCApICogMzAgKSApO1xuXG5cdFx0XHRcdHByZXZUaW1lID0gdGltZTtcblx0XHRcdFx0ZnJhbWVzID0gMDtcblxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdGltZTtcblxuXHRcdH0sXG5cblx0XHR1cGRhdGU6IGZ1bmN0aW9uICgpIHtcblxuXHRcdFx0c3RhcnRUaW1lID0gdGhpcy5lbmQoKTtcblxuXHRcdH1cblxuXHR9XG5cbn07XG5cbmlmICggdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgKSB7XG5cblx0bW9kdWxlLmV4cG9ydHMgPSBTdGF0cztcblxufSIsInZhciBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydUSFJFRSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnVEhSRUUnXSA6IG51bGwpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFwcCkge1xuICB2YXIgc2NlbmUgPSBhcHAuZ2V0KCdzY2VuZScpO1xuXG4gIHZhciBvYmplY3QgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcblxuICB2YXIgZWRpdG9yID0gYXBwLmF0dGFjaChvYmplY3QsIHJlcXVpcmUoJy4uL2VkaXRvci9lZGl0b3InKSk7XG5cbiAgc2NlbmUuYWRkKG9iamVjdCk7XG5cbiAgcmV0dXJuIG9iamVjdDtcbn07IiwidmFyIG5kYXJyYXkgPSByZXF1aXJlKCduZGFycmF5Jyk7XG52YXIgVEhSRUUgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snVEhSRUUnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ1RIUkVFJ10gOiBudWxsKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcHApIHtcbiAgdmFyIHNjZW5lID0gYXBwLmdldCgnc2NlbmUnKTtcbiAgdmFyIGNhbWVyYSA9IGFwcC5nZXQoJ2NhbWVyYScpO1xuXG4gIHZhciBvYmplY3QgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcbiAgdmFyIGJsb2NrcyA9IGFwcC5hdHRhY2gob2JqZWN0LCByZXF1aXJlKCcuLi9jb21wb25lbnRzL2Jsb2NrcycpKTtcblxuICB2YXIgZGltID0gWzMyLCAzMiwgMzJdO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZGltWzBdOyBpKyspIHtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGRpbVsxXTsgaisrKSB7XG4gICAgICBmb3IgKHZhciBrID0gMDsgayA8IGRpbVsyXTsgaysrKSB7XG4gICAgICAgIGJsb2Nrcy5zZXQoaSwgaiwgaywgMSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYmxvY2tzLm9mZnNldC5zZXQoLTE2LCAtMTYsIC0xNik7XG4gIGJsb2Nrcy51cGRhdGVNZXNoKCk7XG5cbiAgdmFyIHJpZ2lkQm9keSA9IGFwcC5hdHRhY2gob2JqZWN0LCByZXF1aXJlKCcuLi9jb21wb25lbnRzL3JpZ2lkYm9keScpKTtcbiAgcmlnaWRCb2R5LmNvbGxpc2lvbk9iamVjdCA9IGJsb2Nrcy5vYmplY3Q7XG4gIHJpZ2lkQm9keS5pc0ZpeHR1cmUgPSB0cnVlO1xuICBcbiAgc2NlbmUuYWRkKG9iamVjdCk7XG59OyIsInZhciBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydUSFJFRSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnVEhSRUUnXSA6IG51bGwpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFwcCkge1xuICB2YXIgc2NlbmUgPSBhcHAuZ2V0KCdzY2VuZScpO1xuXG4gIHZhciBvYmplY3QgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcbiAgdmFyIGNoYXJhY3RlciA9IGFwcC5hdHRhY2gob2JqZWN0LCByZXF1aXJlKCcuLi9jb21wb25lbnRzL2NoYXJhY3RlcicpKTtcbiAgdmFyIHJpZ2lkQm9keSA9IGFwcC5hdHRhY2gob2JqZWN0LCByZXF1aXJlKCcuLi9jb21wb25lbnRzL3JpZ2lkYm9keScpKTtcbiAgcmlnaWRCb2R5Lm1hc3MgPSAxO1xuICB2YXIgcGxheWVyQ29udHJvbCA9IGFwcC5hdHRhY2gob2JqZWN0LCByZXF1aXJlKCcuLi9jb21wb25lbnRzL3BsYXllcmNvbnRyb2wnKSk7XG5cbiAgY2hhcmFjdGVyLnJpZ2lkQm9keSA9IHJpZ2lkQm9keTtcbiAgcGxheWVyQ29udHJvbC5jaGFyYWN0ZXIgPSBjaGFyYWN0ZXI7XG4gIHBsYXllckNvbnRyb2wucmlnaWRCb2R5ID0gcmlnaWRCb2R5O1xuXG4gIHNjZW5lLmFkZChvYmplY3QpO1xuXG4gIG9iamVjdC5wb3NpdGlvbi5zZXQoMCwgNDAsIDApO1xuXG4gIHJldHVybiBvYmplY3Q7XG59OyIsInZhciBuZGFycmF5ID0gcmVxdWlyZSgnbmRhcnJheScpO1xudmFyIG1lc2hlciA9IHJlcXVpcmUoJy4uL3ZveGVsL21lc2hlcicpO1xudmFyIGFycmF5VXRpbHMgPSByZXF1aXJlKCcuLi91dGlscy9hcnJheXV0aWxzJyk7XG5cbnZhciBCbG9ja3MgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgdGhpcy5vYmplY3QgPSBvYmplY3Q7XG4gIHRoaXMudHlwZSA9ICdibG9ja3MnO1xuXG4gIHRoaXMuZGltID0gWzE2LCAxNiwgMTZdO1xuICB0aGlzLmNodW5rID0gbmRhcnJheShbXSwgdGhpcy5kaW0pO1xuXG4gIHRoaXMubWVzaCA9IG51bGw7XG4gIHRoaXMub2JqID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gIHRoaXMubWF0ZXJpYWwgPSBuZXcgVEhSRUUuTXVsdGlNYXRlcmlhbCgpO1xuXG4gIHRoaXMuZGlydHkgPSBmYWxzZTtcbiAgdGhpcy5kaW1OZWVkc1VwZGF0ZSA9IGZhbHNlO1xuXG4gIHRoaXMub2JqZWN0LmFkZCh0aGlzLm9iaik7XG5cbiAgdGhpcy5wYWxldHRlID0gW251bGxdO1xuXG4gIHRoaXMudXNlckRhdGEgPSB7fTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24oeCwgeSwgeiwgYikge1xuICB0aGlzLmNodW5rLnNldCh4LCB5LCB6LCBiKTtcbiAgdGhpcy5kaXJ0eSA9IHRydWU7XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLnNldEF0Q29vcmQgPSBmdW5jdGlvbihjb29yZCwgYikge1xuICB0aGlzLnNldChjb29yZC54LCBjb29yZC55LCBjb29yZC56LCBiKTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oeCwgeSwgeikge1xuICByZXR1cm4gdGhpcy5jaHVuay5nZXQoeCwgeSwgeik7XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLmdldEF0Q29vcmQgPSBmdW5jdGlvbihjb29yZCkge1xuICByZXR1cm4gdGhpcy5nZXQoY29vcmQueCwgY29vcmQueSwgY29vcmQueik7XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLnBvaW50VG9Db29yZCA9IGZ1bmN0aW9uKHBvaW50KSB7XG4gIHJldHVybiBuZXcgVEhSRUUuVmVjdG9yMyhwb2ludC54IC0gMC41LCBwb2ludC55IC0gMC41LCBwb2ludC56IC0gMC41KTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuY29vcmRUb1BvaW50ID0gZnVuY3Rpb24oY29vcmQpIHtcbiAgcmV0dXJuIG5ldyBUSFJFRS5WZWN0b3IzKGNvb3JkLngsIGNvb3JkLnksIGNvb3JkLnopO1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmRpbU5lZWRzVXBkYXRlKSB7XG4gICAgdGhpcy5fdXBkYXRlRGltKCk7XG4gICAgdGhpcy5kaW1OZWVkc1VwZGF0ZSA9IGZhbHNlO1xuICB9XG5cbiAgdGhpcy51cGRhdGVNZXNoKCk7XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuY2h1bmsgPSBuZGFycmF5KFtdLCB0aGlzLmRpbSk7XG4gIHRoaXMub2JqLnJlbW92ZSh0aGlzLm1lc2gpO1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS5zZXREaW0gPSBmdW5jdGlvbih2YWx1ZSkge1xuICB0aGlzLmRpbSA9IHZhbHVlO1xuICB0aGlzLmRpbU5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgdGhpcy5kaXJ0eSA9IHRydWU7XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLnZpc2l0ID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgdmFyIHNoYXBlID0gdGhpcy5jaHVuay5zaGFwZTtcbiAgdmFyIGRhdGEgPSB0aGlzLmNodW5rLmRhdGE7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc2hhcGVbMF07IGkrKykge1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgc2hhcGVbMV07IGorKykge1xuICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBzaGFwZVsyXTsgaysrKSB7XG4gICAgICAgIHZhciBiID0gdGhpcy5jaHVuay5nZXQoaSwgaiwgayk7XG4gICAgICAgIGlmICghIWIpIHtcbiAgICAgICAgICBjYWxsYmFjayhpLCBqLCBrLCBiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuQmxvY2tzLnByb3RvdHlwZS5nZXRBbGxDb29yZHMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGNvb3JkcyA9IFtdO1xuICB0aGlzLnZpc2l0KGZ1bmN0aW9uKGksIGosIGspIHtcbiAgICBjb29yZHMucHVzaChuZXcgVEhSRUUuVmVjdG9yMyhpLCBqLCBrKSk7XG4gIH0pO1xuICByZXR1cm4gY29vcmRzO1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS5wcmludCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnZpc2l0KGZ1bmN0aW9uKGksIGosIGssIGIpIHtcbiAgICBjb25zb2xlLmxvZyhbaSwgaiwga10uam9pbignLCcpLCBiKTtcbiAgfSk7XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLnNlcmlhbGl6ZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIGRpbTogdGhpcy5kaW0sXG4gICAgY2h1bmtEYXRhOiBhcnJheVV0aWxzLmNsb25lKHRoaXMuY2h1bmsuZGF0YSksXG4gICAgcGFsZXR0ZTogdGhpcy5wYWxldHRlLFxuICAgIHVzZXJEYXRhOiB0aGlzLnVzZXJEYXRhXG4gIH07XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLmRlc2VyaWFsaXplID0gZnVuY3Rpb24oanNvbikge1xuICB0aGlzLmRpbSA9IGpzb24uZGltO1xuICB0aGlzLmNodW5rID0gbmRhcnJheShbXSwgdGhpcy5kaW0pO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGpzb24uY2h1bmtEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgdGhpcy5jaHVuay5kYXRhW2ldID0ganNvbi5jaHVua0RhdGFbaV07XG4gIH1cblxuICB0aGlzLnBhbGV0dGUgPSBqc29uLnBhbGV0dGU7XG5cbiAgdGhpcy51cGRhdGVNYXRlcmlhbCgpO1xuXG4gIHRoaXMuZGltTmVlZHNVcGRhdGUgPSB0cnVlO1xuICB0aGlzLmRpcnR5ID0gdHJ1ZTtcblxuICB0aGlzLnVzZXJEYXRhID0ganNvbi51c2VyRGF0YTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUudXBkYXRlTWVzaCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5kaXJ0eSkge1xuICAgIHRoaXMuX3VwZGF0ZU1lc2goKTtcbiAgICB0aGlzLmRpcnR5ID0gZmFsc2U7XG4gIH1cbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuX3VwZGF0ZU1lc2ggPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMubWVzaCAhPSBudWxsKSB7XG4gICAgdGhpcy5vYmoucmVtb3ZlKHRoaXMubWVzaCk7XG4gIH1cblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciBkaW0gPSB0aGlzLmRpbTtcblxuICB2YXIgcmVzdWx0ID0gbWVzaGVyKGZ1bmN0aW9uKGksIGosIGspIHtcbiAgICByZXR1cm4gc2VsZi5nZXQoaSwgaiwgayk7XG4gIH0sIGRpbSk7XG5cbiAgdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkdlb21ldHJ5KCk7XG5cbiAgcmVzdWx0LnZlcnRpY2VzLmZvckVhY2goZnVuY3Rpb24odikge1xuICAgIHZhciB2ZXJ0aWNlID0gbmV3IFRIUkVFLlZlY3RvcjMoXG4gICAgICB2WzBdLCB2WzFdLCB2WzJdXG4gICAgKTtcbiAgICBnZW9tZXRyeS52ZXJ0aWNlcy5wdXNoKHZlcnRpY2UpO1xuICB9KTtcblxuICByZXN1bHQuc3VyZmFjZXMuZm9yRWFjaChmdW5jdGlvbihzdXJmYWNlKSB7XG4gICAgdmFyIGYgPSBzdXJmYWNlLmZhY2U7XG4gICAgdmFyIHV2ID0gc3VyZmFjZS51djtcbiAgICB2YXIgYyA9IGZbNF07XG5cbiAgICB2YXIgZmFjZSA9IG5ldyBUSFJFRS5GYWNlMyhmWzBdLCBmWzFdLCBmWzJdKTtcbiAgICBnZW9tZXRyeS5mYWNlcy5wdXNoKGZhY2UpO1xuICAgIGdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF0ucHVzaChbdXZbMF0sIHV2WzFdLCB1dlsyXV0pO1xuICAgIGZhY2UubWF0ZXJpYWxJbmRleCA9IGMgLSAxO1xuXG4gICAgZmFjZSA9IG5ldyBUSFJFRS5GYWNlMyhmWzJdLCBmWzNdLCBmWzBdKTtcbiAgICBnZW9tZXRyeS5mYWNlcy5wdXNoKGZhY2UpO1xuICAgIGdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF0ucHVzaChbdXZbMl0sIHV2WzNdLCB1dlswXV0pO1xuICAgIGZhY2UubWF0ZXJpYWxJbmRleCA9IGMgLSAxO1xuICB9KTtcblxuICBnZW9tZXRyeS5jb21wdXRlRmFjZU5vcm1hbHMoKTtcblxuICB0aGlzLm1lc2ggPSBuZXcgVEhSRUUuTWVzaChnZW9tZXRyeSwgdGhpcy5tYXRlcmlhbCk7XG4gIHRoaXMub2JqLmFkZCh0aGlzLm1lc2gpO1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS5fdXBkYXRlRGltID0gZnVuY3Rpb24oKSB7XG4gIHZhciBuZXdDaHVuayA9IG5kYXJyYXkoW10sIHRoaXMuZGltKTtcbiAgdmFyIHNoYXBlID0gdGhpcy5jaHVuay5zaGFwZTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHNoYXBlWzBdOyBpKyspIHtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IHNoYXBlWzFdOyBqKyspIHtcbiAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgc2hhcGVbMl07IGsrKykge1xuICAgICAgICB2YXIgYiA9IHRoaXMuY2h1bmsuZ2V0KGksIGosIGspO1xuICAgICAgICBpZiAoISFiKSB7XG4gICAgICAgICAgbmV3Q2h1bmsuc2V0KGksIGosIGssIGIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdGhpcy5jaHVuayA9IG5ld0NodW5rO1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS5nZXRPckFkZENvbG9ySW5kZXggPSBmdW5jdGlvbihjb2xvcikge1xuICAvLyBudWxsLCAwLCBmYWxzZSwgdW5kZWZpbmVkXG4gIGlmICghY29sb3IpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIHZhciBpbmRleCA9IGFycmF5VXRpbHMuaW5kZXhPZih0aGlzLnBhbGV0dGUsIGNvbG9yKTtcbiAgaWYgKGluZGV4ID09IC0xKSB7XG4gICAgdGhpcy5wYWxldHRlLnB1c2goY29sb3IpO1xuICAgIGluZGV4ID0gdGhpcy5wYWxldHRlLmxlbmd0aCAtIDE7XG4gICAgdmFyIG1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwoe1xuICAgICAgY29sb3I6IG5ldyBUSFJFRS5Db2xvcih0aGlzLnBhbGV0dGVbaW5kZXhdKVxuICAgIH0pO1xuICAgIHRoaXMubWF0ZXJpYWwubWF0ZXJpYWxzLnB1c2gobWF0ZXJpYWwpO1xuICAgIHJldHVybiB0aGlzLnBhbGV0dGUubGVuZ3RoIC0gMTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUudXBkYXRlTWF0ZXJpYWwgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5tYXRlcmlhbCA9IG5ldyBUSFJFRS5NdWx0aU1hdGVyaWFsKCk7XG4gIGZvciAodmFyIGkgPSAxOyBpIDwgdGhpcy5wYWxldHRlLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIG1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwoe1xuICAgICAgY29sb3I6IG5ldyBUSFJFRS5Db2xvcih0aGlzLnBhbGV0dGVbaV0pXG4gICAgfSk7XG4gICAgdGhpcy5tYXRlcmlhbC5tYXRlcmlhbHMucHVzaChtYXRlcmlhbCk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQmxvY2tzOyIsInZhciBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydUSFJFRSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnVEhSRUUnXSA6IG51bGwpO1xuXG52YXIgQ2hhcmFjdGVyID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gIHRoaXMub2JqZWN0ID0gb2JqZWN0O1xuXG4gIHRoaXMuZ2VvbWV0cnkgPSBuZXcgVEhSRUUuQm94R2VvbWV0cnkoMSwgMSwgMSk7XG4gIHRoaXMubWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgIGNvbG9yOiAweGZmMDAwMFxuICB9KTtcblxuICB0aGlzLm1lc2ggPSBuZXcgVEhSRUUuTWVzaCh0aGlzLmdlb21ldHJ5LCB0aGlzLm1hdGVyaWFsKTtcbiAgdGhpcy5vYmplY3QuYWRkKHRoaXMubWVzaCk7XG5cbiAgdGhpcy5tb3ZlU3BlZWQgPSAwLjU7XG4gIHRoaXMuanVtcFNwZWVkID0gMC44O1xuICB0aGlzLmp1bXBpbmcgPSBmYWxzZTtcbn07XG5cbkNoYXJhY3Rlci5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmdyYXZpdHkgPSB0aGlzLnJpZ2lkQm9keS5ncmF2aXR5O1xuICBpZiAodGhpcy5qdW1waW5nICYmIHRoaXMucmlnaWRCb2R5Lmdyb3VuZGVkKSB7XG4gICAgdGhpcy5qdW1waW5nID0gZmFsc2U7XG4gIH1cbn07XG5cbkNoYXJhY3Rlci5wcm90b3R5cGUubW92ZSA9IGZ1bmN0aW9uKGZvcndhcmQsIGFtb3VudCkge1xuICB2YXIgZ3Jhdml0eSA9IHRoaXMucmlnaWRCb2R5LmdyYXZpdHk7XG4gIGlmIChncmF2aXR5ID09IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKHRoaXMucmlnaWRCb2R5Lmdyb3VuZGVkIHx8IHRoaXMuanVtcGluZykge1xuICAgIHZhciB2ZXJ0aWNhbFNwZWVkID0gdGhpcy5yaWdpZEJvZHkudmVsb2NpdHkuY2xvbmUoKS5wcm9qZWN0T25WZWN0b3IoZ3Jhdml0eS5kaXIpO1xuICAgIHZhciBmb3J3YXJkU3BlZWQgPSBmb3J3YXJkLmNsb25lKCkuc2V0TGVuZ3RoKGFtb3VudCAqIHRoaXMubW92ZVNwZWVkKTtcbiAgICB0aGlzLnJpZ2lkQm9keS52ZWxvY2l0eS5jb3B5KHZlcnRpY2FsU3BlZWQuYWRkKGZvcndhcmRTcGVlZCkpO1xuICB9XG59O1xuXG5DaGFyYWN0ZXIucHJvdG90eXBlLmp1bXAgPSBmdW5jdGlvbihhbW91bnQpIHtcbiAgdmFyIGdyYXZpdHkgPSB0aGlzLnJpZ2lkQm9keS5ncmF2aXR5O1xuICBpZiAoZ3Jhdml0eSA9PSBudWxsKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICh0aGlzLnJpZ2lkQm9keS5ncm91bmRlZCkge1xuICAgIHRoaXMuanVtcGluZyA9IHRydWU7XG4gICAgdGhpcy5yaWdpZEJvZHkudmVsb2NpdHkuY29weShncmF2aXR5LmRpci5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKC10aGlzLmp1bXBTcGVlZCkpO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENoYXJhY3RlcjsiLCJ2YXIgUGxheWVyQ2FtZXJhID0gZnVuY3Rpb24oY2FtZXJhLCBhcHApIHtcbiAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XG4gIHRoaXMuYXBwID0gYXBwO1xuXG4gIHRoaXMuY2FtZXJhVGlsdCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbUV1bGVyKFxuICAgIG5ldyBUSFJFRS5FdWxlcigtTWF0aC5QSSAvIDQsIE1hdGguUEkgLyA0LCAwLCAnWVhaJykpO1xuXG4gIHRoaXMuY2FtZXJhUXVhdCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG4gIHRoaXMuY2FtZXJhUXVhdEZpbmFsID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblxuICB0aGlzLmRpc3RhbmNlID0gMTAwO1xuICB0aGlzLnRhcmdldCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gIHRoaXMucXVhdGVybmlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG59O1xuXG5QbGF5ZXJDYW1lcmEuJGluamVjdCA9IFsnYXBwJ107XG5cblBsYXllckNhbWVyYS5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGxheWVyID0gYXBwLmdldCgncGxheWVyJyk7XG4gIGlmIChwbGF5ZXIgPT0gbnVsbCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciByaWdpZEJvZHkgPSBhcHAuZ2V0Q29tcG9uZW50KHBsYXllciwgJ3JpZ2lkQm9keScpO1xuXG4gIHZhciBncmF2aXR5RGlyO1xuICBpZiAocmlnaWRCb2R5Lmdyb3VuZGVkKSB7XG4gICAgZ3Jhdml0eURpciA9IHJpZ2lkQm9keS5ncmF2aXR5LmRpci5jbG9uZSgpO1xuICB9IGVsc2Uge1xuICAgIGdyYXZpdHlEaXIgPSByaWdpZEJvZHkuZ3Jhdml0eS5mb3JjZURpci5jbG9uZSgpO1xuICB9XG5cbiAgaWYgKGdyYXZpdHlEaXIubGVuZ3RoKCkgPT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBhID0gZ3Jhdml0eURpci5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKC0xKTtcblxuICB2YXIgZGlmZiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbVVuaXRWZWN0b3JzKFxuICAgIG5ldyBUSFJFRS5WZWN0b3IzKDAsIDEsIDApLmFwcGx5UXVhdGVybmlvbih0aGlzLmNhbWVyYVF1YXQpLFxuICAgIGFcbiAgKTtcblxuICB0aGlzLmNhbWVyYVF1YXQubXVsdGlwbHlRdWF0ZXJuaW9ucyhkaWZmLCB0aGlzLmNhbWVyYVF1YXQpO1xuICB0aGlzLmNhbWVyYVF1YXRGaW5hbCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkubXVsdGlwbHlRdWF0ZXJuaW9ucyhcbiAgICB0aGlzLmNhbWVyYVF1YXQsXG4gICAgdGhpcy5jYW1lcmFUaWx0KTtcblxuICB0aGlzLnF1YXRlcm5pb24uc2xlcnAodGhpcy5jYW1lcmFRdWF0RmluYWwsIDAuMSk7XG5cbiAgbGFzdEdyYXZpdHkgPSBncmF2aXR5RGlyO1xuXG4gIHRoaXMudXBkYXRlQ2FtZXJhKCk7XG59O1xuXG5QbGF5ZXJDYW1lcmEucHJvdG90eXBlLnVwZGF0ZUNhbWVyYSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZGlmZiA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDEpXG4gICAgLmFwcGx5UXVhdGVybmlvbih0aGlzLnF1YXRlcm5pb24pXG4gICAgLnNldExlbmd0aCh0aGlzLmRpc3RhbmNlKTtcbiAgdmFyIHBvcyA9IHRoaXMudGFyZ2V0LmNsb25lKClcbiAgICAuYWRkKGRpZmYpO1xuICBjYW1lcmEucG9zaXRpb24uY29weShwb3MpO1xuXG4gIHZhciB1cCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDEsIDApLmFwcGx5UXVhdGVybmlvbih0aGlzLnF1YXRlcm5pb24pO1xuICBjYW1lcmEudXAuY29weSh1cCk7XG4gIGNhbWVyYS5sb29rQXQodGhpcy50YXJnZXQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQbGF5ZXJDYW1lcmE7IiwidmFyIFBsYXllckNvbnRyb2wgPSBmdW5jdGlvbihvYmplY3QsIGFwcCwgaW5wdXQsIGNhbWVyYSkge1xuICB0aGlzLm9iamVjdCA9IG9iamVjdDtcbiAgdGhpcy5pbnB1dCA9IGlucHV0O1xuICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcblxuICB0aGlzLmNoYXJhY3RlciA9IG51bGw7XG4gIHRoaXMucmlnaWRCb2R5ID0gbnVsbDtcbn07XG5cblBsYXllckNvbnRyb2wuJGluamVjdCA9IFsnaW5wdXQnLCAnY2FtZXJhJ107XG5cblBsYXllckNvbnRyb2wucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGZvcndhcmRBbW91bnQgPSAwO1xuICBpZiAodGhpcy5pbnB1dC5rZXlIb2xkKCd3JykpIGZvcndhcmRBbW91bnQgKz0gMTtcbiAgaWYgKHRoaXMuaW5wdXQua2V5SG9sZCgncycpKSBmb3J3YXJkQW1vdW50IC09IDE7XG5cbiAgdmFyIHJpZ2h0QW1vdW50ID0gMDtcbiAgaWYgKHRoaXMuaW5wdXQua2V5SG9sZCgnZCcpKSByaWdodEFtb3VudCArPSAxO1xuICBpZiAodGhpcy5pbnB1dC5rZXlIb2xkKCdhJykpIHJpZ2h0QW1vdW50IC09IDE7XG5cbiAgdmFyIGdyYXZpdHkgPSB0aGlzLnJpZ2lkQm9keS5ncmF2aXR5O1xuXG4gIGlmIChncmF2aXR5ICE9IG51bGwpIHtcbiAgICB2YXIgbm9ybWFsID0gZ3Jhdml0eS5kaXIuY2xvbmUoKS5tdWx0aXBseVNjYWxhcigtMSk7XG5cbiAgICB2YXIgdXAgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAxLCAwKS5hcHBseVF1YXRlcm5pb24odGhpcy5jYW1lcmEucXVhdGVybmlvbik7XG4gICAgdmFyIHJpZ2h0ID0gbmV3IFRIUkVFLlZlY3RvcjMoMSwgMCwgMCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMuY2FtZXJhLnF1YXRlcm5pb24pO1xuXG4gICAgdmFyIG1vdmUgPSB1cC5tdWx0aXBseVNjYWxhcihmb3J3YXJkQW1vdW50KS5hZGQocmlnaHQubXVsdGlwbHlTY2FsYXIocmlnaHRBbW91bnQpKTtcbiAgICBtb3ZlLnByb2plY3RPblBsYW5lKG5vcm1hbCk7XG4gICAgbW92ZS5zZXRMZW5ndGgoMSk7XG5cbiAgICB0aGlzLmNoYXJhY3Rlci5tb3ZlKG1vdmUsIDEpO1xuXG4gICAgaWYgKHRoaXMuaW5wdXQua2V5RG93bignc3BhY2UnKSkge1xuICAgICAgdGhpcy5jaGFyYWN0ZXIuanVtcCgpO1xuICAgIH1cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQbGF5ZXJDb250cm9sOyIsInZhciBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydUSFJFRSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnVEhSRUUnXSA6IG51bGwpO1xuXG52YXIgUmlnaWRCb2R5ID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gIHRoaXMub2JqZWN0ID0gb2JqZWN0O1xuICBcbiAgdGhpcy52ZWxvY2l0eSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gIFxuICB0aGlzLmFjY2VsZXJhdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gIFxuICB0aGlzLnR5cGUgPSAncmlnaWRCb2R5JztcbiAgXG4gIHRoaXMuZnJpY3Rpb24gPSAwLjk4O1xuXG4gIC8vIDAgbWFzcyBtZWFucyBpbW1vdmFibGVcbiAgdGhpcy5tYXNzID0gMDtcbiAgXG4gIHRoaXMuZ3Jhdml0eSA9IG51bGw7XG5cbiAgdGhpcy5jb2xsaXNpb25PYmplY3QgPSBudWxsO1xufTtcblxuUmlnaWRCb2R5LnByb3RvdHlwZS5hcHBseUZvcmNlID0gZnVuY3Rpb24oZm9yY2UpIHtcbiAgdGhpcy5hY2NlbGVyYXRpb24uYWRkKGZvcmNlLmNsb25lKCkubXVsdGlwbHlTY2FsYXIoMSAvIHRoaXMubWFzcykpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSaWdpZEJvZHk7IiwidmFyIGV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5cbnZhciBpZENvdW50ID0gMDtcblxuZnVuY3Rpb24gZ2V0TmV4dElkKCkge1xuICByZXR1cm4gaWRDb3VudCsrO1xufVxuXG52YXIgRW5naW5lID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuZW50aXR5TWFwID0ge307XG4gIHRoaXMubG9va3VwID0ge307XG4gIHRoaXMuZnJhbWVSYXRlID0gNjAuMDtcbiAgdGhpcy5zeXN0ZW1zID0gW107XG4gIHRoaXMuYmluZGluZ3MgPSB7fTtcbn07XG5cbkVuZ2luZS5wcm90b3R5cGUuYXR0YWNoID0gZnVuY3Rpb24ob2JqZWN0LCBmYWN0b3J5KSB7XG4gIHZhciBhcmdzID0gW29iamVjdF07XG4gIHZhciBjb21wb25lbnQ7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICBpZiAodHlwZW9mIGZhY3RvcnkgPT09ICdmdW5jdGlvbicpIHtcbiAgICBpZiAoZmFjdG9yeS4kaW5qZWN0ICE9IG51bGwpIHtcbiAgICAgIGZhY3RvcnkuJGluamVjdC5mb3JFYWNoKGZ1bmN0aW9uKGRlcCkge1xuICAgICAgICBhcmdzLnB1c2goc2VsZi5yZXNvbHZlKGRlcCkpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGNvbXBvbmVudCA9IG5ldyhGdW5jdGlvbi5wcm90b3R5cGUuYmluZC5hcHBseShmYWN0b3J5LCBbbnVsbF0uY29uY2F0KGFyZ3MpKSk7XG4gIH0gZWxzZSB7XG4gICAgY29tcG9uZW50ID0gZmFjdG9yeTtcbiAgfVxuXG4gIGlmIChjb21wb25lbnQgIT0gbnVsbCkge1xuICAgIGNvbXBvbmVudC5vYmplY3QgPSBvYmplY3Q7XG5cbiAgICBpZiAob2JqZWN0Ll9pZCA9PSBudWxsKSB7XG4gICAgICBvYmplY3QuX2lkID0gZ2V0TmV4dElkKCk7XG4gICAgICB0aGlzLmxvb2t1cFtvYmplY3QuX2lkXSA9IG9iamVjdDtcbiAgICB9XG5cbiAgICBpZiAoY29tcG9uZW50Ll9pZCA9PSBudWxsKSB7XG4gICAgICBjb21wb25lbnQuX2lkID0gZ2V0TmV4dElkKCk7XG4gICAgICB0aGlzLmxvb2t1cFtjb21wb25lbnQuX2lkXSA9IGNvbXBvbmVudDtcbiAgICB9XG5cbiAgICB2YXIgY29tcG9uZW50cyA9IHRoaXMuZW50aXR5TWFwW29iamVjdC5faWRdO1xuICAgIGlmIChjb21wb25lbnRzID09IG51bGwpIGNvbXBvbmVudHMgPSB0aGlzLmVudGl0eU1hcFtvYmplY3QuX2lkXSA9IHt9O1xuICAgIGNvbXBvbmVudHNbY29tcG9uZW50Ll9pZF0gPSBjb21wb25lbnQ7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3lzdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHN5c3RlbSA9IHRoaXMuc3lzdGVtc1tpXTtcbiAgICAgIGlmIChzeXN0ZW0ub25BdHRhY2ggIT0gbnVsbCkgc3lzdGVtLm9uQXR0YWNoKG9iamVjdCwgY29tcG9uZW50KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY29tcG9uZW50O1xufTtcblxuRW5naW5lLnByb3RvdHlwZS51c2UgPSBmdW5jdGlvbih0eXBlLCBzeXN0ZW0pIHtcbiAgdmFyIGhhc1R5cGUgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZyc7XG4gIGlmICghaGFzVHlwZSkge1xuICAgIHN5c3RlbSA9IHR5cGU7XG4gIH1cblxuICBpZiAoc3lzdGVtICE9IG51bGwpIHtcbiAgICB0aGlzLnN5c3RlbXMucHVzaChzeXN0ZW0pO1xuICAgIGlmIChoYXNUeXBlKSB7XG4gICAgICB0aGlzLnZhbHVlKHR5cGUsIHN5c3RlbSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHN5c3RlbTtcbn07XG5cbkVuZ2luZS5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmVtaXQoJ2JlZm9yZVRpY2snKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3lzdGVtcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBzeXN0ZW0gPSB0aGlzLnN5c3RlbXNbaV07XG4gICAgaWYgKHN5c3RlbS50aWNrICE9IG51bGwpIHN5c3RlbS50aWNrKCk7XG4gIH1cblxuICBmb3IgKHZhciBpIGluIHRoaXMuZW50aXR5TWFwKSB7XG4gICAgdmFyIGNvbXBvbmVudHMgPSB0aGlzLmVudGl0eU1hcFtpXTtcbiAgICBmb3IgKHZhciBqIGluIGNvbXBvbmVudHMpIHtcbiAgICAgIHZhciBjb21wb25lbnQgPSBjb21wb25lbnRzW2pdO1xuICAgICAgaWYgKGNvbXBvbmVudC50aWNrICE9IG51bGwpIGNvbXBvbmVudC50aWNrKCk7XG4gICAgfVxuICB9XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN5c3RlbXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgc3lzdGVtID0gdGhpcy5zeXN0ZW1zW2ldO1xuICAgIGlmIChzeXN0ZW0ubGF0ZVRpY2sgIT0gbnVsbCkgc3lzdGVtLmxhdGVUaWNrKCk7XG4gIH1cblxuICB0aGlzLmVtaXQoJ2FmdGVyVGljaycpO1xufTtcblxuRW5naW5lLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciBpbnRlcnZhbCA9IGZ1bmN0aW9uKCkge1xuICAgIHNlbGYudGljaygpO1xuICAgIHNldFRpbWVvdXQoaW50ZXJ2YWwsIDEwMDAgLyB0aGlzLmZyYW1lUmF0ZSk7XG4gIH1cbiAgaW50ZXJ2YWwoKTtcbn07XG5cbkVuZ2luZS5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbih0eXBlLCBvYmplY3QpIHtcbiAgdGhpcy5iaW5kaW5nc1t0eXBlXSA9IHtcbiAgICB2YWx1ZTogb2JqZWN0XG4gIH07XG59O1xuXG5FbmdpbmUucHJvdG90eXBlLnJlc29sdmUgPSBmdW5jdGlvbih0eXBlLCBjb250ZXh0KSB7XG4gIHZhciBiaW5kaW5nID0gdGhpcy5iaW5kaW5nc1t0eXBlXTtcbiAgaWYgKGJpbmRpbmcgPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBFcnJvcignYmluZGluZyBmb3IgdHlwZSAnICsgdHlwZSArICcgbm90IGZvdW5kJyk7XG4gIH1cblxuICBpZiAoYmluZGluZy5mYWN0b3J5ICE9IG51bGwpIHtcbiAgICByZXR1cm4gYmluZGluZy5mYWN0b3J5KGNvbnRleHQpO1xuICB9XG5cbiAgaWYgKGJpbmRpbmcudmFsdWUgIT0gbnVsbCkge1xuICAgIHJldHVybiBiaW5kaW5nLnZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn07XG5cbkVuZ2luZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24odHlwZSwgY29udGV4dCkge1xuICByZXR1cm4gdGhpcy5yZXNvbHZlKHR5cGUsIGNvbnRleHQpO1xufTtcblxuRW5naW5lLnByb3RvdHlwZS5nZXRDb21wb25lbnQgPSBmdW5jdGlvbihvYmplY3QsIHR5cGUpIHtcbiAgdmFyIGNvbXBvbmVudHMgPSB0aGlzLmVudGl0eU1hcFtvYmplY3QuX2lkXTtcbiAgZm9yICh2YXIgaWQgaW4gY29tcG9uZW50cykge1xuICAgIGlmIChjb21wb25lbnRzW2lkXS50eXBlID09PSB0eXBlKSB7XG4gICAgICByZXR1cm4gY29tcG9uZW50c1tpZF07XG4gICAgfVxuICB9XG59O1xuXG5FbmdpbmUucHJvdG90eXBlLmxvYWRBc3NlbWJseSA9IGZ1bmN0aW9uKGFzc2VtYmx5KSB7XG4gIHJldHVybiBhc3NlbWJseSh0aGlzKTtcbn07XG5cbmV2ZW50cy5wcm90b3R5cGUuYXBwbHkoRW5naW5lLnByb3RvdHlwZSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgRW5naW5lKCk7XG59OyIsInZhciBFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fbGlzdGVuZXJzID0ge307XG59O1xuXG5FdmVudHMucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbihldmVudCwgb2JqZWN0KSB7XG4gIHZhciBjYWxsYmFja3MgPSB0aGlzLl9saXN0ZW5lcnNbZXZlbnRdO1xuICBpZiAoY2FsbGJhY2tzID09IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgY2FsbGJhY2sgPSBjYWxsYmFja3NbaV07XG4gICAgY2FsbGJhY2sob2JqZWN0KTtcbiAgfVxufTtcblxuRXZlbnRzLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKGV2ZW50LCBjYWxsYmFjaykge1xuICB2YXIgY2FsbGJhY2tzID0gdGhpcy5fbGlzdGVuZXJzW2V2ZW50XTtcbiAgaWYgKGNhbGxiYWNrcyA9PSBudWxsKSB7XG4gICAgY2FsbGJhY2tzID0gdGhpcy5fbGlzdGVuZXJzW2V2ZW50XSA9IFtdO1xuICB9XG4gIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbn07XG5cbkV2ZW50cy5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24oZXZlbnQsIGNhbGxiYWNrKSB7XG4gIHZhciBjYWxsYmFja3MgPSB0aGlzLl9saXN0ZW5lcnNbZXZlbnRdO1xuICBpZiAoY2FsbGJhY2tzID09IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgYXJyYXlVdGlscy5yZW1vdmUoY2FsbGJhY2tzLCBjYWxsYmFjayk7XG59O1xuXG5FdmVudHMucHJvdG90eXBlLmFwcGx5ID0gZnVuY3Rpb24ob2JqKSB7XG4gIG9iai5lbWl0ID0gdGhpcy5lbWl0O1xuICBvYmoub24gPSB0aGlzLm9uO1xuICBvYmoub2ZmID0gdGhpcy5vZmY7XG4gIG9iai5fbGlzdGVuZXJzID0ge307XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50czsiLCJtb2R1bGUuZXhwb3J0cz17XG59IiwibW9kdWxlLmV4cG9ydHM9W1xuICBcIiM3QzdDN0NcIixcbiAgXCIjMDAwMEZDXCIsXG4gIFwiIzAwMDBCQ1wiLFxuICBcIiM0NDI4QkNcIixcbiAgXCIjOTQwMDg0XCIsXG4gIFwiI0E4MDAyMFwiLFxuICBcIiNBODEwMDBcIixcbiAgXCIjODgxNDAwXCIsXG4gIFwiIzUwMzAwMFwiLFxuICBcIiMwMDc4MDBcIixcbiAgXCIjMDA2ODAwXCIsXG4gIFwiIzAwNTgwMFwiLFxuICBcIiMwMDQwNThcIixcbiAgXCIjMDAwMDAwXCIsXG5cbiAgXCIjQkNCQ0JDXCIsXG4gIFwiIzAwNzhGOFwiLFxuICBcIiMwMDU4RjhcIixcbiAgXCIjNjg0NEZDXCIsXG4gIFwiI0Q4MDBDQ1wiLFxuICBcIiNFNDAwNThcIixcbiAgXCIjRjgzODAwXCIsXG4gIFwiI0U0NUMxMFwiLFxuICBcIiNBQzdDMDBcIixcbiAgXCIjMDBCODAwXCIsXG4gIFwiIzAwQTgwMFwiLFxuICBcIiMwMEE4NDRcIixcbiAgXCIjMDA4ODg4XCIsIHtcbiAgICBcInNyY1wiOiBcIi9pbWFnZXMvY2xlYXIucG5nXCIsXG4gICAgXCJpc0NsZWFyQ29sb3JcIjogdHJ1ZVxuICB9LFxuXG4gIFwiI0Y4RjhGOFwiLFxuICBcIiMzQ0JDRkNcIixcbiAgXCIjNjg4OEZDXCIsXG4gIFwiIzk4NzhGOFwiLFxuICBcIiNGODc4RjhcIixcbiAgXCIjRjg1ODk4XCIsXG4gIFwiI0Y4Nzg1OFwiLFxuICBcIiNGQ0EwNDRcIixcbiAgXCIjRjhCODAwXCIsXG4gIFwiI0I4RjgxOFwiLFxuICBcIiM1OEQ4NTRcIixcbiAgXCIjNThGODk4XCIsXG4gIFwiIzAwRThEOFwiLFxuICBcIiM3ODc4NzhcIixcblxuICBcIiNGQ0ZDRkNcIixcbiAgXCIjQTRFNEZDXCIsXG4gIFwiI0I4QjhGOFwiLFxuICBcIiNEOEI4RjhcIixcbiAgXCIjRjhCOEY4XCIsXG4gIFwiI0Y4QTRDMFwiLFxuICBcIiNGMEQwQjBcIixcbiAgXCIjRkNFMEE4XCIsXG4gIFwiI0Y4RDg3OFwiLFxuICBcIiNEOEY4NzhcIixcbiAgXCIjQjhGOEI4XCIsXG4gIFwiI0I4RjhEOFwiLFxuICBcIiMwMEZDRkNcIixcbiAgXCIjRjhEOEY4XCIsXG5dIiwidmFyIEJsb2NrQ29tbWFuZCA9IGZ1bmN0aW9uKGJsb2Nrcykge1xuICB0aGlzLmJsb2NrcyA9IGJsb2NrcztcblxuICB0aGlzLnN1YkNvbW1hbmRzID0gW107XG5cbiAgdGhpcy5kZWx0YXMgPSBbXTtcbn07XG5cbkJsb2NrQ29tbWFuZC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24oY29vcmQsIHZhbHVlKSB7XG4gIHRoaXMuc3ViQ29tbWFuZHMucHVzaCh7XG4gICAgY29vcmQ6IGNvb3JkLFxuICAgIHZhbHVlOiB2YWx1ZVxuICB9KTtcbn07XG5cbkJsb2NrQ29tbWFuZC5wcm90b3R5cGUuc2V0QXRDb29yZHMgPSBmdW5jdGlvbihjb29yZHMsIHZhbHVlKSB7XG4gIHRoaXMuc3ViQ29tbWFuZHMucHVzaCh7XG4gICAgY29vcmRzOiBjb29yZHMsXG4gICAgdmFsdWU6IHZhbHVlXG4gIH0pO1xufTtcblxuQmxvY2tDb21tYW5kLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbigpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN1YkNvbW1hbmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHN1YkNvbW1hbmQgPSB0aGlzLnN1YkNvbW1hbmRzW2ldO1xuICAgIHZhciB2YWx1ZSA9IHN1YkNvbW1hbmQudmFsdWU7XG4gICAgdmFyIGNvb3JkcyA9IHN1YkNvbW1hbmQuY29vcmRzIHx8IFtzdWJDb21tYW5kLmNvb3JkXTtcblxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgY29vcmRzLmxlbmd0aDsgaisrKSB7XG4gICAgICB2YXIgY29vcmQgPSBjb29yZHNbal07XG4gICAgICB2YXIgcHJldmlvdXNWYWx1ZSA9IHRoaXMuYmxvY2tzLmdldEF0Q29vcmQoY29vcmQpO1xuICAgICAgdGhpcy5kZWx0YXMucHVzaCh7XG4gICAgICAgIGNvb3JkOiBjb29yZCxcbiAgICAgICAgcHJldmlvdXNWYWx1ZTogcHJldmlvdXNWYWx1ZVxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuYmxvY2tzLnNldEF0Q29vcmQoY29vcmQsIHZhbHVlKTtcbiAgICB9XG4gIH1cbn07XG5cbkJsb2NrQ29tbWFuZC5wcm90b3R5cGUudW5kbyA9IGZ1bmN0aW9uKCkge1xuICBmb3IgKHZhciBpID0gdGhpcy5kZWx0YXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgZGVsdGEgPSB0aGlzLmRlbHRhc1tpXTtcbiAgICB0aGlzLmJsb2Nrcy5zZXRBdENvb3JkKGRlbHRhLmNvb3JkLCBkZWx0YS5wcmV2aW91c1ZhbHVlKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCbG9ja0NvbW1hbmQ7IiwidmFyIEJsb2NrQ29tbWFuZCA9IHJlcXVpcmUoJy4vYmxvY2tjb21tYW5kJyk7XG52YXIgYXJyYXlVdGlscyA9IHJlcXVpcmUoJy4uLy4uL3V0aWxzL2FycmF5dXRpbHMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlZGl0b3IsIGJsb2NrcywgY29vcmRzLCBvZmZzZXQpIHtcbiAgdmFyIGNvbW1hbmQgPSBuZXcgQmxvY2tDb21tYW5kKGVkaXRvci5ibG9ja3MpO1xuXG4gIHZhciB0b0FkZCA9IFtdO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY29vcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGNvb3JkID0gY29vcmRzW2ldO1xuICAgIHZhciB2YWx1ZSA9IGJsb2Nrcy5nZXRBdENvb3JkKGNvb3JkKTtcblxuICAgIC8vIFJlbW92ZVxuICAgIGNvbW1hbmQuc2V0KGNvb3Jkc1tpXSwgdW5kZWZpbmVkKTtcblxuICAgIHRvQWRkLnB1c2goe1xuICAgICAgY29vcmQ6IG5vcm1hbGl6ZUNvb3JkKG5ldyBUSFJFRS5WZWN0b3IzKCkuYWRkVmVjdG9ycyhjb29yZCwgb2Zmc2V0KSwgYmxvY2tzLmRpbSksXG4gICAgICB2YWx1ZTogdmFsdWVcbiAgICB9KTtcbiAgfVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdG9BZGQubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgYWRkID0gdG9BZGRbaV07XG5cbiAgICAvLyBBZGRcbiAgICBjb21tYW5kLnNldChhZGQuY29vcmQsIGFkZC52YWx1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBub3JtYWxpemVDb29yZChjb29yZCwgZGltKSB7XG4gICAgcmV0dXJuIG5ldyBUSFJFRS5WZWN0b3IzKFxuICAgICAgKGNvb3JkLnggKyBkaW1bMF0pICUgZGltWzBdLFxuICAgICAgKGNvb3JkLnkgKyBkaW1bMV0pICUgZGltWzFdLFxuICAgICAgKGNvb3JkLnogKyBkaW1bMl0pICUgZGltWzJdXG4gICAgKTtcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIHNlbGVjdGlvbkNvcHk6IG51bGwsXG4gICAgcnVuOiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbW1hbmQucnVuKCk7XG4gICAgICB0aGlzLnNlbGVjdGlvbkNvcHkgPSBhcnJheVV0aWxzLmNsb25lKGVkaXRvci5zZWxlY3Rpb25zKTtcblxuICAgICAgaWYgKGVkaXRvci5zZWxlY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gT2Zmc2V0IHNlbGVjdGlvblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVkaXRvci5zZWxlY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFyIG5vcm1hbGl6ZWQgPSBub3JtYWxpemVDb29yZChuZXcgVEhSRUUuVmVjdG9yMygpLmFkZFZlY3RvcnMoZWRpdG9yLnNlbGVjdGlvbnNbaV0sIG9mZnNldCksIGJsb2Nrcy5kaW0pO1xuICAgICAgICAgIGVkaXRvci5zZWxlY3Rpb25zW2ldID0gbm9ybWFsaXplZDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgdW5kbzogZnVuY3Rpb24oKSB7XG4gICAgICBjb21tYW5kLnVuZG8oKTtcblxuICAgICAgaWYgKGVkaXRvci5zZWxlY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gT2Zmc2V0IHNlbGVjdGlvblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVkaXRvci5zZWxlY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFyIG5vcm1hbGl6ZWQgPSBub3JtYWxpemVDb29yZChuZXcgVEhSRUUuVmVjdG9yMygpLnN1YlZlY3RvcnMoZWRpdG9yLnNlbGVjdGlvbnNbaV0sIG9mZnNldCksIGJsb2Nrcy5kaW0pO1xuICAgICAgICAgIGVkaXRvci5zZWxlY3Rpb25zW2ldID0gbm9ybWFsaXplZDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufTsiLCJ2YXIgYXJyYXlVdGlscyA9IHJlcXVpcmUoJy4uLy4uL3V0aWxzL2FycmF5dXRpbHMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlZGl0b3IsIHNlbGVjdGlvbnMpIHtcbiAgdmFyIG9yaWdpbmFsU2VsZWN0aW9ucyA9IG51bGw7XG4gIHJldHVybiB7XG4gICAgcnVuOiBmdW5jdGlvbigpIHtcbiAgICAgIG9yaWdpbmFsU2VsZWN0aW9ucyA9IGFycmF5VXRpbHMuY2xvbmUoZWRpdG9yLnNlbGVjdGlvbnMpO1xuICAgICAgZWRpdG9yLnNlbGVjdGlvbnMgPSBzZWxlY3Rpb25zO1xuICAgIH0sXG5cbiAgICB1bmRvOiBmdW5jdGlvbigpIHtcbiAgICAgIGVkaXRvci5zZWxlY3Rpb25zID0gb3JpZ2luYWxTZWxlY3Rpb25zO1xuICAgIH1cbiAgfTtcbn07IiwidmFyIEJsb2NrQ29tbWFuZCA9IHJlcXVpcmUoJy4vYmxvY2tjb21tYW5kJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYmxvY2tzLCBjb29yZHMsIHZhbHVlKSB7XG4gIHZhciBjb21tYW5kID0gbmV3IEJsb2NrQ29tbWFuZChibG9ja3MpO1xuICBjb21tYW5kLnNldEF0Q29vcmRzKGNvb3JkcywgdmFsdWUpO1xuXG4gIHJldHVybiBjb21tYW5kO1xufTsiLCJ2YXIgVEhSRUUgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snVEhSRUUnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ1RIUkVFJ10gOiBudWxsKTtcblxudmFyIERyYWdDYW1lcmEgPSBmdW5jdGlvbihjYW1lcmEsIGlucHV0KSB7XG4gIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuICB0aGlzLmlucHV0ID0gaW5wdXQ7XG5cbiAgdGhpcy5yb3RhdGlvbiA9IG5ldyBUSFJFRS5FdWxlcigtTWF0aC5QSSAvIDQsIE1hdGguUEkgLyA0LCAwLCAnWVhaJyk7XG4gIHRoaXMubGFzdE1vdXNlID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcbiAgdGhpcy5tb3VzZVNwZWVkWCA9IDAuMDE7XG4gIHRoaXMubW91c2VTcGVlZFkgPSAwLjAxO1xuICB0aGlzLm1vdXNlS2V5U3BlZWRYID0gMC4wMztcbiAgdGhpcy5tb3VzZUtleVNwZWVkWSA9IDAuMDM7XG4gIHRoaXMudW5pdFZlY3RvciA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDEpO1xuICB0aGlzLmRpc3RhbmNlID0gNTA7XG4gIHRoaXMudGFyZ2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMCk7XG4gIHRoaXMubWF4UGl0Y2ggPSBNYXRoLlBJIC8gMiAtIDAuMDE7XG4gIHRoaXMubWluUGl0Y2ggPSAtTWF0aC5QSSAvIDIgKyAwLjAxO1xuICB0aGlzLnpvb21SYXRlID0gMS4xO1xuXG4gIHRoaXMudXBkYXRlQ2FtZXJhKCk7XG5cbiAgdGhpcy5sb2NrID0gZmFsc2U7XG59O1xuXG5EcmFnQ2FtZXJhLiRpbmplY3QgPSBbJ2lucHV0J107XG5cbkRyYWdDYW1lcmEucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wcm9jZXNzSW5wdXQoKTtcblxuICB0aGlzLnVwZGF0ZUNhbWVyYSgpO1xufTtcblxuRHJhZ0NhbWVyYS5wcm90b3R5cGUucHJvY2Vzc0lucHV0ID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmlucHV0Lm1vdXNlSG9sZCgpKSB7XG4gICAgaWYgKCF0aGlzLmxvY2spIHtcbiAgICAgIHZhciBkaWZmID0gbmV3IFRIUkVFLlZlY3RvcjIoKS5zdWJWZWN0b3JzKHRoaXMuaW5wdXQubW91c2UsIHRoaXMubGFzdE1vdXNlKTtcbiAgICAgIHRoaXMucm90YXRpb24ueSArPSBkaWZmLnggKiB0aGlzLm1vdXNlU3BlZWRZO1xuICAgICAgdGhpcy5yb3RhdGlvbi54ICs9IGRpZmYueSAqIHRoaXMubW91c2VTcGVlZFg7XG5cbiAgICAgIGlmICh0aGlzLnJvdGF0aW9uLnggPCB0aGlzLm1pblBpdGNoKSB0aGlzLnJvdGF0aW9uLnggPSB0aGlzLm1pblBpdGNoO1xuICAgICAgaWYgKHRoaXMucm90YXRpb24ueCA+IHRoaXMubWF4UGl0Y2gpIHRoaXMucm90YXRpb24ueCA9IHRoaXMubWF4UGl0Y2g7XG4gICAgfVxuICB9XG5cbiAgdmFyIHJvdGF0ZVJpZ2h0ID0gMDtcbiAgdmFyIHJvdGF0ZVVwID0gMDtcbiAgaWYgKHRoaXMuaW5wdXQua2V5SG9sZCgncmlnaHQnKSkge1xuICAgIHJvdGF0ZVJpZ2h0Kys7XG4gIH1cbiAgaWYgKHRoaXMuaW5wdXQua2V5SG9sZCgnbGVmdCcpKSB7XG4gICAgcm90YXRlUmlnaHQtLTtcbiAgfVxuICBpZiAodGhpcy5pbnB1dC5rZXlIb2xkKCd1cCcpKSB7XG4gICAgcm90YXRlVXArKztcbiAgfVxuICBpZiAodGhpcy5pbnB1dC5rZXlIb2xkKCdkb3duJykpIHtcbiAgICByb3RhdGVVcC0tO1xuICB9XG5cbiAgdGhpcy5yb3RhdGlvbi54ICs9IHJvdGF0ZVVwICogdGhpcy5tb3VzZUtleVNwZWVkWDtcbiAgdGhpcy5yb3RhdGlvbi55IC09IHJvdGF0ZVJpZ2h0ICogdGhpcy5tb3VzZUtleVNwZWVkWTtcblxuICB0aGlzLmxhc3RNb3VzZS5jb3B5KHRoaXMuaW5wdXQubW91c2UpO1xuXG4gIGlmICh0aGlzLmlucHV0LmtleVVwKCc9JykpIHtcbiAgICB0aGlzLmRpc3RhbmNlIC89IHRoaXMuem9vbVJhdGU7XG4gIH0gZWxzZSBpZiAodGhpcy5pbnB1dC5rZXlVcCgnLScpKSB7XG4gICAgdGhpcy5kaXN0YW5jZSAqPSB0aGlzLnpvb21SYXRlO1xuICB9XG59O1xuXG5EcmFnQ2FtZXJhLnByb3RvdHlwZS51cGRhdGVDYW1lcmEgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBvc2l0aW9uID0gdGhpcy51bml0VmVjdG9yLmNsb25lKCkuYXBwbHlFdWxlcih0aGlzLnJvdGF0aW9uKS5zZXRMZW5ndGgodGhpcy5kaXN0YW5jZSkuYWRkKHRoaXMudGFyZ2V0KTtcbiAgdGhpcy5jYW1lcmEucG9zaXRpb24uY29weShwb3NpdGlvbik7XG4gIHRoaXMuY2FtZXJhLmxvb2tBdCh0aGlzLnRhcmdldCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyYWdDYW1lcmE7IiwidmFyIFRIUkVFID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ1RIUkVFJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydUSFJFRSddIDogbnVsbCk7XG52YXIgQ0J1ZmZlciA9IHJlcXVpcmUoJ2NidWZmZXInKTtcbnZhciBibG9ja3NDb21wb25lbnQgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL2Jsb2NrcycpO1xudmFyIGRyYWdDYW1lcmFDb21wb25lbnQgPSByZXF1aXJlKCcuL2RyYWdjYW1lcmEnKTtcbnZhciBlZGl0b3JDb25zb2xlID0gcmVxdWlyZSgnLi9lZGl0b3Jjb25zb2xlJyk7XG52YXIgRWRpdG9yVG9vbHMgPSByZXF1aXJlKCcuL2VkaXRvcnRvb2xzJyk7XG52YXIgT2Zmc2V0Q29tbWFuZCA9IHJlcXVpcmUoJy4vY29tbWFuZHMvb2Zmc2V0Y29tbWFuZCcpO1xudmFyIEJsb2NrcyA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvYmxvY2tzJyk7XG52YXIgYXJyYXlVdGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzL2FycmF5dXRpbHMnKTtcblxudmFyIHRvb2xCYXIgPSByZXF1aXJlKCcuL2d1aS90b29sYmFyJyk7XG52YXIgYXJyb3dCYXIgPSByZXF1aXJlKCcuL2d1aS9hcnJvd2JhcicpO1xudmFyIGZpbGVCYXIgPSByZXF1aXJlKCcuL2d1aS9maWxlYmFyJyk7XG52YXIgcHJlZmFic0JhciA9IHJlcXVpcmUoJy4vZ3VpL3ByZWZhYnNiYXInKTtcbnZhciBwcmVmYWJzVG9vbEJhciA9IHJlcXVpcmUoJy4vZ3VpL3ByZWZhYnN0b29sYmFyJyk7XG52YXIgY29sb3JCYXIgPSByZXF1aXJlKCcuL2d1aS9jb2xvcmJhcicpO1xudmFyIHByb3BlcnR5UGFuZWwgPSByZXF1aXJlKCcuL2d1aS9wcm9wZXJ0eXBhbmVsJyk7XG5cbnZhciBQZW5Ub29sID0gcmVxdWlyZSgnLi90b29scy9wZW50b29sJyk7XG52YXIgU2FtcGxlVG9vbCA9IHJlcXVpcmUoJy4vdG9vbHMvc2FtcGxldG9vbCcpO1xudmFyIFNlbGVjdFRvb2wgPSByZXF1aXJlKCcuL3Rvb2xzL3NlbGVjdHRvb2wnKTtcbnZhciBDYW1lcmFUb29sID0gcmVxdWlyZSgnLi90b29scy9jYW1lcmF0b29sJyk7XG52YXIgRmlsbFRvb2wgPSByZXF1aXJlKCcuL3Rvb2xzL2ZpbGx0b29sJyk7XG5cbnZhciBFZGl0b3IgPSBmdW5jdGlvbihvYmplY3QsIGFwcCwgaW5wdXQsIGNhbWVyYSwgZGV2Q29uc29sZSwgY29uZmlnLCBwYWxldHRlLCBjYW52YXMsIHByZWZhYlNlcnZpY2UpIHtcblxuICB0aGlzLm9iamVjdCA9IG9iamVjdDtcblxuICB0aGlzLmFwcCA9IGFwcDtcblxuICB0aGlzLmlucHV0ID0gaW5wdXQ7XG5cbiAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XG5cbiAgdGhpcy5kZXZDb25zb2xlID0gZGV2Q29uc29sZTtcblxuICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcblxuICB0aGlzLnBhbGV0dGUgPSBwYWxldHRlO1xuXG4gIHRoaXMuY2FudmFzID0gY2FudmFzO1xuXG4gIHRoaXMucHJlZmFiU2VydmljZSA9IHByZWZhYlNlcnZpY2U7XG5cbiAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICB0aGlzLmJsb2NrcyA9IG51bGw7XG5cbiAgdGhpcy5kcmFnQ2FtZXJhID0gbnVsbDtcblxuICB0aGlzLm9iakdyb3VuZCA9IG51bGw7XG5cbiAgdGhpcy5vYmpCb3VuZGluZ0JveCA9IG51bGw7XG5cbiAgdGhpcy5fc3RhcnRlZCA9IGZhbHNlO1xuXG4gIHRoaXMubWF0ZXJpYWxzID0gW107XG5cbiAgdGhpcy5zZWxlY3RlZENvbG9yID0gbnVsbDtcblxuICB0aGlzLnVuZG9zID0gQ0J1ZmZlcigyMDApO1xuXG4gIHRoaXMucmVkb3MgPSBDQnVmZmVyKDIwMCk7XG5cbiAgdGhpcy5jb2xvckJhciA9IG51bGw7XG5cbiAgdGhpcy5wcmVmYWJzQmFyID0gbnVsbDtcblxuICB0aGlzLnByZWZhYlRvb2xiYXIgPSBudWxsO1xuXG4gIHRoaXMudG9vbEJhciA9IG51bGw7XG5cbiAgdGhpcy5hcnJvd0JhciA9IG51bGw7XG5cbiAgdGhpcy5maWxlQmFyID0gbnVsbDtcblxuICB0aGlzLnRvb2xOYW1lcyA9IFtFZGl0b3JUb29scy5QZW4sIEVkaXRvclRvb2xzLlNhbXBsZSwgRWRpdG9yVG9vbHMuU2VsZWN0LCBFZGl0b3JUb29scy5DYW1lcmEsIEVkaXRvclRvb2xzLkZpbGxdO1xuXG4gIHRoaXMudG9vbE5hbWUgPSBFZGl0b3JUb29scy5QZW47XG5cbiAgdGhpcy50b29sID0gbnVsbDtcblxuICB0aGlzLnNlbGVjdGlvbnMgPSBbXTtcblxuICB0aGlzLnJlZmxlY3RYID0gZmFsc2U7XG5cbiAgdGhpcy5yZWZsZWN0WSA9IGZhbHNlO1xuXG4gIHRoaXMucmVmbGVjdFogPSBmYWxzZTtcblxuICAvLyBsb2FkZWQgc2F2ZXNcbiAgdGhpcy5wcmVmYWJzID0gW107XG5cbiAgdGhpcy5zY3JlZW5zaG90UmVuZGVyZXIgPSBudWxsO1xuXG4gIC8vIENvcHkgb2YgYmxvY2sgb2JqZWN0XG4gIHRoaXMubGFzdEJsb2NrcyA9IG51bGw7XG5cbiAgdGhpcy5vYmpIaWdobGlnaHQgPSBudWxsO1xuXG4gIHRoaXMuc24gPSAwLjAwMDE7XG5cbiAgdGhpcy5oaWdobGlnaHRDb29yZCA9IG51bGw7XG5cbiAgdGhpcy5kb3dubG9hZEVsZW1lbnQgPSBudWxsO1xuXG4gIHRoaXMuZWRpdExvY2sgPSBmYWxzZTtcblxuICB0aGlzLmNhbWVyYUxvY2sgPSBmYWxzZTtcblxuICB0aGlzLnByb3BlcnR5UGFuZWwgPSBudWxsO1xuXG4gIHRoaXMucHJlZmFiSW5kZXggPSAwO1xufTtcblxuRWRpdG9yLiRpbmplY3QgPSBbJ2FwcCcsICdpbnB1dCcsICdjYW1lcmEnLCAnZGV2Q29uc29sZScsICdjb25maWcnLCAncGFsZXR0ZScsICdjYW52YXMnLCAncHJlZmFiU2VydmljZSddO1xuXG5FZGl0b3IucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gIGVkaXRvckNvbnNvbGUodGhpcywgdGhpcy5kZXZDb25zb2xlKTtcblxuICB0aGlzLnByZWZhYnMgPSB0aGlzLnByZWZhYlNlcnZpY2UubG9hZCgpO1xuXG4gIHRoaXMuYmxvY2tzID0gdGhpcy5hcHAuYXR0YWNoKHRoaXMub2JqZWN0LCBibG9ja3NDb21wb25lbnQpO1xuXG4gIHRoaXMuZHJhZ0NhbWVyYSA9IHRoaXMuYXBwLmF0dGFjaCh0aGlzLmNhbWVyYSwgZHJhZ0NhbWVyYUNvbXBvbmVudCk7XG5cbiAgdGhpcy51cGRhdGVUb29sKCk7XG5cbiAgdGhpcy51cGRhdGVNYXRlcmlhbCh0aGlzLmJsb2Nrcyk7XG5cbiAgdGhpcy5zZWxlY3RlZENvbG9yID0gdGhpcy5wYWxldHRlWzBdO1xuXG4gIC8vIFNldCB1cCBHVUlcbiAgdGhpcy50b29sQmFyID0gdG9vbEJhcih0aGlzKTtcbiAgdGhpcy5hcnJvd0JhciA9IGFycm93QmFyKHRoaXMpO1xuICB0aGlzLmZpbGVCYXIgPSBmaWxlQmFyKHRoaXMpO1xuICB0aGlzLmNvbG9yQmFyID0gY29sb3JCYXIodGhpcyk7XG4gIHRoaXMucHJlZmFic0JhciA9IHByZWZhYnNCYXIodGhpcyk7XG4gIHRoaXMucHJlZmFic1Rvb2xiYXIgPSBwcmVmYWJzVG9vbEJhcih0aGlzKTtcbiAgdGhpcy5wcm9wZXJ0eVBhbmVsID0gcHJvcGVydHlQYW5lbCh0aGlzKTtcblxuICBpZiAodGhpcy5wcmVmYWJzLmxlbmd0aCA9PT0gMCkge1xuICAgIHRoaXMucHJlZmFicy5wdXNoKHRoaXMuYmxvY2tzLnNlcmlhbGl6ZSgpKTtcbiAgfVxuXG4gIHRoaXMubG9hZCh0aGlzLnByZWZhYnNbMF0pO1xuICB0aGlzLnVwZGF0ZVNjcmVlbnNob3RzKCk7XG5cbiAgdGhpcy5jb2xvckJhci5oaWdobGlnaHQoMCk7XG4gIHRoaXMucHJlZmFic0Jhci5oaWdobGlnaHQoMCk7XG4gIHRoaXMudG9vbEJhci5oaWdobGlnaHQoMCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnNldFRvb2wgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBpbmRleCA9IGFycmF5VXRpbHMuaW5kZXhPZih0aGlzLnRvb2xOYW1lcywgbmFtZSk7XG4gIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLnRvb2xCYXIuaGlnaGxpZ2h0KGluZGV4KTtcbiAgdGhpcy50b29sTmFtZSA9IG5hbWU7XG4gIHRoaXMudXBkYXRlVG9vbCgpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oKSB7XG4gIGlmICghdGhpcy5fc3RhcnRlZCkge1xuICAgIHRoaXMuc3RhcnQoKTtcbiAgICB0aGlzLl9zdGFydGVkID0gdHJ1ZTtcbiAgfVxuXG4gIHRoaXMuY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG5cbiAgdmFyIGhhc0ludGVyc2VjdCA9IHRoaXMuZ2V0Q29vcmRBYm92ZSgpICE9IG51bGw7XG5cbiAgaWYgKCFoYXNJbnRlcnNlY3QgJiYgdGhpcy5pbnB1dC5tb3VzZURvd24oKSkge1xuICAgIHRoaXMuZWRpdExvY2sgPSB0cnVlO1xuICB9XG5cbiAgaWYgKGhhc0ludGVyc2VjdCAmJiB0aGlzLmlucHV0Lm1vdXNlRG93bigpKSB7XG4gICAgdGhpcy5jYW1lcmFMb2NrID0gdHJ1ZTtcbiAgfVxuXG4gIGlmICh0aGlzLmlucHV0Lm1vdXNlVXAoKSkge1xuICAgIHRoaXMuZWRpdExvY2sgPSBmYWxzZTtcbiAgICB0aGlzLmNhbWVyYUxvY2sgPSBmYWxzZTtcbiAgfVxuXG4gIGlmICh0aGlzLnRvb2xOYW1lID09PSBFZGl0b3JUb29scy5TZWxlY3QgfHwgdGhpcy50b29sTmFtZSA9PT0gRWRpdG9yVG9vbHMuU2FtcGxlKSB7XG4gICAgdGhpcy5jYW1lcmFMb2NrID0gdHJ1ZTtcbiAgfSBlbHNlIGlmICh0aGlzLnRvb2xOYW1lID09PSBFZGl0b3JUb29scy5DYW1lcmEpIHtcbiAgICB0aGlzLmNhbWVyYUxvY2sgPSBmYWxzZTtcbiAgfVxuXG4gIHRoaXMuZHJhZ0NhbWVyYS5sb2NrID0gdGhpcy5jYW1lcmFMb2NrO1xuXG4gIHRoaXMudG9vbC50aWNrKCk7XG5cbiAgdGhpcy51cGRhdGVIaWdobGlnaHQodGhpcy5oaWdobGlnaHRDb29yZCk7XG5cbiAgdGhpcy5kcmF3U2VsZWN0aW9uKCk7XG5cbiAgdmFyIG9mZnNldENvb3JkID0gbnVsbDtcbiAgaWYgKHRoaXMuaW5wdXQua2V5RG93bignZicpKSB7XG4gICAgb2Zmc2V0Q29vcmQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAtMSwgMCk7XG4gIH1cbiAgaWYgKHRoaXMuaW5wdXQua2V5RG93bigncicpKSB7XG4gICAgb2Zmc2V0Q29vcmQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAxLCAwKTtcbiAgfVxuICBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCdhJykpIHtcbiAgICBvZmZzZXRDb29yZCA9IG5ldyBUSFJFRS5WZWN0b3IzKC0xLCAwLCAwKTtcbiAgfVxuICBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCdkJykpIHtcbiAgICBvZmZzZXRDb29yZCA9IG5ldyBUSFJFRS5WZWN0b3IzKDEsIDAsIDApO1xuICB9XG4gIGlmICh0aGlzLmlucHV0LmtleURvd24oJ3cnKSkge1xuICAgIG9mZnNldENvb3JkID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTEpO1xuICB9XG4gIGlmICh0aGlzLmlucHV0LmtleURvd24oJ3MnKSkge1xuICAgIG9mZnNldENvb3JkID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMSk7XG4gIH1cblxuICBpZiAob2Zmc2V0Q29vcmQgIT0gbnVsbCkge1xuICAgIHRoaXMuYXBwbHlPZmZzZXQob2Zmc2V0Q29vcmQpO1xuICB9XG5cbiAgaWYgKHRoaXMuaW5wdXQua2V5SG9sZCgnY29tbWFuZCcpICYmIHRoaXMuaW5wdXQua2V5SG9sZCgnc2hpZnQnKSkge1xuICAgIGlmICh0aGlzLmlucHV0LmtleURvd24oJ3onKSkge1xuICAgICAgdGhpcy5yZWRvKCk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHRoaXMuaW5wdXQua2V5SG9sZCgnY29tbWFuZCcpKSB7XG4gICAgaWYgKHRoaXMuaW5wdXQua2V5RG93bigneicpKSB7XG4gICAgICB0aGlzLnVuZG8oKTtcbiAgICB9XG4gIH1cblxuICBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCcxJykpIHtcbiAgICB0aGlzLnNldFRvb2wodGhpcy50b29sTmFtZXNbMF0pO1xuICB9IGVsc2UgaWYgKHRoaXMuaW5wdXQua2V5RG93bignMicpKSB7XG4gICAgdGhpcy5zZXRUb29sKHRoaXMudG9vbE5hbWVzWzFdKTtcbiAgfSBlbHNlIGlmICh0aGlzLmlucHV0LmtleURvd24oJzMnKSkge1xuICAgIHRoaXMuc2V0VG9vbCh0aGlzLnRvb2xOYW1lc1syXSk7XG4gIH0gZWxzZSBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCc0JykpIHtcbiAgICB0aGlzLnNldFRvb2wodGhpcy50b29sTmFtZXNbM10pO1xuICB9IGVsc2UgaWYgKHRoaXMuaW5wdXQua2V5RG93bignNScpKSB7XG4gICAgdGhpcy5zZXRUb29sKHRoaXMudG9vbE5hbWVzWzRdKTtcbiAgfVxufTtcblxuRWRpdG9yLnByb3RvdHlwZS51bmRvID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjb21tYW5kID0gdGhpcy51bmRvcy5sYXN0KCk7XG4gIGlmIChjb21tYW5kID09IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29tbWFuZC51bmRvKCk7XG4gIHRoaXMudW5kb3MucG9wKCk7XG4gIHRoaXMucmVkb3MucHVzaChjb21tYW5kKTtcbiAgdGhpcy51cGRhdGVDdXJyZW50U2NyZWVuc2hvdCgpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5yZWRvID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjb21tYW5kID0gdGhpcy5yZWRvcy5sYXN0KCk7XG4gIGlmIChjb21tYW5kID09IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29tbWFuZC5ydW4oKTtcbiAgdGhpcy5yZWRvcy5wb3AoKTtcbiAgdGhpcy51bmRvcy5wdXNoKGNvbW1hbmQpO1xuICB0aGlzLnVwZGF0ZUN1cnJlbnRTY3JlZW5zaG90KCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnJ1bkNvbW1hbmQgPSBmdW5jdGlvbihjb21tYW5kKSB7XG4gIGNvbW1hbmQucnVuKCk7XG4gIHRoaXMudW5kb3MucHVzaChjb21tYW5kKTtcbiAgdGhpcy5yZWRvcyA9IENCdWZmZXIoMjAwKTtcbiAgdGhpcy51cGRhdGVDdXJyZW50U2NyZWVuc2hvdCgpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS51cGRhdGVDdXJyZW50U2NyZWVuc2hvdCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaW5kZXggPSB0aGlzLnByZWZhYkluZGV4O1xuICB0aGlzLnByZWZhYnNbaW5kZXhdID0gdGhpcy5ibG9ja3Muc2VyaWFsaXplKCk7XG4gIHRoaXMudXBkYXRlU2NyZWVuc2hvdEF0SW5kZXgoaW5kZXgpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS51cGRhdGVTY3JlZW5zaG90cyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnByZWZhYnNCYXIuY2xlYXIoKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucHJlZmFicy5sZW5ndGg7IGkrKykge1xuICAgIHRoaXMudXBkYXRlU2NyZWVuc2hvdEF0SW5kZXgoaSk7XG4gIH1cbn07XG5cbkVkaXRvci5wcm90b3R5cGUudXBkYXRlU2NyZWVuc2hvdEF0SW5kZXggPSBmdW5jdGlvbihpbmRleCkge1xuICB2YXIgcHJlZmFiID0gdGhpcy5wcmVmYWJzW2luZGV4XTtcbiAgdmFyIGltZ0RhdGEgPSB0aGlzLnNjcmVlbnNob3QocHJlZmFiKTtcblxuICB0aGlzLnByZWZhYnNCYXIuc2V0KGluZGV4LCB7XG4gICAgaW1nRGF0YTogaW1nRGF0YSxcbiAgICBpbmRleDogaW5kZXhcbiAgfSk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnVwZGF0ZU1hdGVyaWFsID0gZnVuY3Rpb24oYmxvY2tzKSB7XG4gIHZhciBtYXRlcmlhbHMgPSBibG9ja3MubWF0ZXJpYWwubWF0ZXJpYWxzO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubWF0ZXJpYWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgbWF0ZXJpYWxzW2ldID0gdGhpcy5tYXRlcmlhbHNbaV07XG4gIH1cbn07XG5cbkVkaXRvci5wcm90b3R5cGUudXBkYXRlU2l6ZSA9IGZ1bmN0aW9uKHNpemUpIHtcbiAgdGhpcy5ibG9ja3Muc2V0RGltKFtzaXplWzBdLCBzaXplWzFdLCBzaXplWzJdXSk7XG4gIHRoaXMuYmxvY2tzLm9iai5wb3NpdGlvbi5zZXQoLXNpemVbMF0gLyAyLCAtc2l6ZVsxXSAvIDIsIC1zaXplWzJdIC8gMik7XG4gIHRoaXMudXBkYXRlR3JvdW5kKHNpemUpO1xuICB0aGlzLnVwZGF0ZUJvdW5kaW5nQm94KHNpemUpO1xuXG4gIC8vIE1heCBmcm9tIDMgbnVtYmVyc1xuICB2YXIgbWF4U2l6ZSA9IE1hdGgubWF4KHNpemVbMF0sIHNpemVbMV0sIHNpemVbMl0pO1xuICB0aGlzLmRyYWdDYW1lcmEuZGlzdGFuY2UgPSAyICogKG1heFNpemUpO1xuICB0aGlzLnVwZGF0ZUN1cnJlbnRQcmVmYWIoKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUudXBkYXRlR3JvdW5kID0gZnVuY3Rpb24oc2l6ZSkge1xuICBpZiAodGhpcy5vYmpHcm91bmQgIT0gbnVsbCkge1xuICAgIHRoaXMub2JqZWN0LnJlbW92ZSh0aGlzLm9iakdyb3VuZCk7XG4gIH1cblxuICB2YXIgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuR2VvbWV0cnkoKTtcbiAgZ2VvbWV0cnkudmVydGljZXMucHVzaChcbiAgICBuZXcgVEhSRUUuVmVjdG9yMygtc2l6ZVswXSAvIDIsIC1zaXplWzFdIC8gMiwgLXNpemVbMl0gLyAyKSxcbiAgICBuZXcgVEhSRUUuVmVjdG9yMyhzaXplWzBdIC8gMiwgLXNpemVbMV0gLyAyLCAtc2l6ZVsyXSAvIDIpLFxuICAgIG5ldyBUSFJFRS5WZWN0b3IzKHNpemVbMF0gLyAyLCAtc2l6ZVsxXSAvIDIsIHNpemVbMl0gLyAyKSxcbiAgICBuZXcgVEhSRUUuVmVjdG9yMygtc2l6ZVswXSAvIDIsIC1zaXplWzFdIC8gMiwgc2l6ZVsyXSAvIDIpXG4gICk7XG4gIGdlb21ldHJ5LmZhY2VzLnB1c2goXG4gICAgbmV3IFRIUkVFLkZhY2UzKDIsIDEsIDApLFxuICAgIG5ldyBUSFJFRS5GYWNlMygwLCAzLCAyKVxuICApO1xuICBnZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdLnB1c2goXG4gICAgW1xuICAgICAgbmV3IFRIUkVFLlZlY3RvcjIoMCwgMCksXG4gICAgICBuZXcgVEhSRUUuVmVjdG9yMihzaXplWzJdIC8gMiwgMCksXG4gICAgICBuZXcgVEhSRUUuVmVjdG9yMihzaXplWzJdIC8gMiwgc2l6ZVswXSAvIDIpXG4gICAgXSwgW1xuICAgICAgbmV3IFRIUkVFLlZlY3RvcjIoc2l6ZVsyXSAvIDIsIHNpemVbMF0gLyAyKSxcbiAgICAgIG5ldyBUSFJFRS5WZWN0b3IyKDAsIHNpemVbMF0gLyAyKSxcbiAgICAgIG5ldyBUSFJFRS5WZWN0b3IyKDAsIDApXG4gICAgXVxuICApO1xuICB2YXIgbWF0ZXJpYWwgPSBtYXRlcmlhbHNbJ3BsYWNlaG9sZGVyJ107XG4gIHRoaXMub2JqR3JvdW5kID0gbmV3IFRIUkVFLk1lc2goZ2VvbWV0cnksIG1hdGVyaWFsKTtcbiAgdGhpcy5vYmplY3QuYWRkKHRoaXMub2JqR3JvdW5kKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUudXBkYXRlQm91bmRpbmdCb3ggPSBmdW5jdGlvbihzaXplKSB7XG4gIGlmICh0aGlzLm9iakJvdW5kaW5nQm94ICE9IG51bGwpIHtcbiAgICB0aGlzLm9iamVjdC5yZW1vdmUodGhpcy5vYmpCb3VuZGluZ0JveCk7XG4gIH1cblxuICB2YXIgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuR2VvbWV0cnkoKTtcblxuICB2YXIgYSA9IG5ldyBUSFJFRS5WZWN0b3IzKC1zaXplWzBdIC8gMiwgLXNpemVbMV0gLyAyLCAtc2l6ZVsyXSAvIDIpO1xuICB2YXIgYiA9IG5ldyBUSFJFRS5WZWN0b3IzKHNpemVbMF0gLyAyLCAtc2l6ZVsxXSAvIDIsIC1zaXplWzJdIC8gMik7XG4gIHZhciBjID0gbmV3IFRIUkVFLlZlY3RvcjMoc2l6ZVswXSAvIDIsIC1zaXplWzFdIC8gMiwgc2l6ZVsyXSAvIDIpO1xuICB2YXIgZCA9IG5ldyBUSFJFRS5WZWN0b3IzKC1zaXplWzBdIC8gMiwgLXNpemVbMV0gLyAyLCBzaXplWzJdIC8gMik7XG5cbiAgdmFyIGUgPSBuZXcgVEhSRUUuVmVjdG9yMygtc2l6ZVswXSAvIDIsIHNpemVbMV0gLyAyLCAtc2l6ZVsyXSAvIDIpO1xuICB2YXIgZiA9IG5ldyBUSFJFRS5WZWN0b3IzKHNpemVbMF0gLyAyLCBzaXplWzFdIC8gMiwgLXNpemVbMl0gLyAyKTtcbiAgdmFyIGcgPSBuZXcgVEhSRUUuVmVjdG9yMyhzaXplWzBdIC8gMiwgc2l6ZVsxXSAvIDIsIHNpemVbMl0gLyAyKTtcbiAgdmFyIGggPSBuZXcgVEhSRUUuVmVjdG9yMygtc2l6ZVswXSAvIDIsIHNpemVbMV0gLyAyLCBzaXplWzJdIC8gMik7XG5cbiAgZ2VvbWV0cnkudmVydGljZXMucHVzaChhLCBlLCBiLCBmLCBjLCBnLCBkLCBoLCBlLCBmLCBmLCBnLCBnLCBoLCBoLCBlKTtcblxuICB2YXIgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTGluZUJhc2ljTWF0ZXJpYWwoe1xuICAgIGNvbG9yOiAweGZmZmZmZixcbiAgICB0cmFuc3BhcmVudDogdHJ1ZSxcbiAgICBvcGFjaXR5OiAwLjVcbiAgfSk7XG4gIHRoaXMub2JqQm91bmRpbmdCb3ggPSBuZXcgVEhSRUUuTGluZVNlZ21lbnRzKGdlb21ldHJ5LCBtYXRlcmlhbCk7XG4gIHRoaXMub2JqZWN0LmFkZCh0aGlzLm9iakJvdW5kaW5nQm94KTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUudXBkYXRlVG9vbCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy50b29sICE9IG51bGwpIHtcbiAgICBpZiAodGhpcy50b29sLmRpc3Bvc2UgIT0gbnVsbCkge1xuICAgICAgdGhpcy50b29sLmRpc3Bvc2UoKTtcbiAgICB9XG4gIH1cblxuICBpZiAodGhpcy50b29sTmFtZSA9PT0gRWRpdG9yVG9vbHMuUGVuKSB7XG4gICAgdGhpcy50b29sID0gbmV3IFBlblRvb2wodGhpcyk7XG4gIH0gZWxzZSBpZiAodGhpcy50b29sTmFtZSA9PT0gRWRpdG9yVG9vbHMuU2FtcGxlKSB7XG4gICAgdGhpcy50b29sID0gbmV3IFNhbXBsZVRvb2wodGhpcyk7XG4gIH0gZWxzZSBpZiAodGhpcy50b29sTmFtZSA9PT0gRWRpdG9yVG9vbHMuU2VsZWN0KSB7XG4gICAgdGhpcy50b29sID0gbmV3IFNlbGVjdFRvb2wodGhpcyk7XG4gIH0gZWxzZSBpZiAodGhpcy50b29sTmFtZSA9PT0gRWRpdG9yVG9vbHMuQ2FtZXJhKSB7XG4gICAgdGhpcy50b29sID0gbmV3IENhbWVyYVRvb2wodGhpcyk7XG4gIH0gZWxzZSBpZiAodGhpcy50b29sTmFtZSA9PT0gRWRpdG9yVG9vbHMuRmlsbCkge1xuICAgIHRoaXMudG9vbCA9IG5ldyBGaWxsVG9vbCh0aGlzKTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBtYWtlIHRvb2wgbmFtZWQ6ICcgKyB0aGlzLnRvb2xOYW1lKTtcbiAgfVxuXG4gIGlmICh0aGlzLnRvb2wuc3RhcnQgIT0gbnVsbCkge1xuICAgIHRoaXMudG9vbC5zdGFydCgpO1xuICB9XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLmRyYXdTZWxlY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGJsb2NrcyA9IHRoaXMuYmxvY2tzO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2VsZWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBjb29yZCA9IHRoaXMuc2VsZWN0aW9uc1tpXTtcbiAgICBjb29yZCA9IGNvb3JkLmNsb25lKCkuYWRkKG5ldyBUSFJFRS5WZWN0b3IzKDAuNSwgMC41LCAwLjUpKTtcbiAgICB2YXIgbG9jYWxQb2ludCA9IGJsb2Nrcy5jb29yZFRvUG9pbnQoY29vcmQpO1xuICAgIHZhciB3b3JsZFBvaW50ID0gYmxvY2tzLm9iai5sb2NhbFRvV29ybGQobG9jYWxQb2ludCk7XG4gICAgdmFyIHZlY3RvciA9IHdvcmxkUG9pbnQucHJvamVjdCh0aGlzLmNhbWVyYSk7XG4gICAgdmVjdG9yLnggPSBNYXRoLnJvdW5kKCh2ZWN0b3IueCArIDEpICogY2FudmFzLndpZHRoIC8gMik7XG4gICAgdmVjdG9yLnkgPSBNYXRoLnJvdW5kKCgtdmVjdG9yLnkgKyAxKSAqIGNhbnZhcy5oZWlnaHQgLyAyKTtcblxuICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSAnI2ZmZmZmZic7XG4gICAgdGhpcy5jb250ZXh0LmZpbGxSZWN0KHZlY3Rvci54LCB2ZWN0b3IueSwgMSwgMSk7XG4gIH1cbn07XG5cbkVkaXRvci5wcm90b3R5cGUuY3JlYXRlTmV3ID0gZnVuY3Rpb24oaW5kZXgpIHtcbiAgaW5kZXggPSBpbmRleCB8fCB0aGlzLnByZWZhYnMubGVuZ3RoO1xuXG4gIHRoaXMuYmxvY2tzLmNsZWFyKCk7XG4gIHZhciBwcmVmYWIgPSB0aGlzLmJsb2Nrcy5zZXJpYWxpemUoKTtcbiAgdGhpcy5wcmVmYWJzLnNwbGljZShpbmRleCwgMCwgcHJlZmFiKTtcbiAgdGhpcy51cGRhdGVTY3JlZW5zaG90QXRJbmRleChpbmRleCk7XG4gIHRoaXMucHJlZmFiSW5kZXggPSBpbmRleDtcbiAgdGhpcy5wcmVmYWJzQmFyLmhpZ2hsaWdodChpbmRleCk7XG4gIHRoaXMudXBkYXRlUHJvcGVydHlQYW5lbCgpO1xuICB0aGlzLnVwZGF0ZUxhc3RCbG9ja3MoKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUucmVtb3ZlU2VsZWN0ZWQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wcmVmYWJzLnNwbGljZSh0aGlzLnByZWZhYkluZGV4LCAxKTtcblxuICBpZiAodGhpcy5wcmVmYWJzLmxlbmd0aCA9PT0gMCkge1xuICAgIHRoaXMuYmxvY2tzLmNsZWFyKCk7XG4gICAgdGhpcy5wcmVmYWJzLnB1c2godGhpcy5ibG9ja3Muc2VyaWFsaXplKCkpO1xuICAgIHRoaXMudXBkYXRlUHJvcGVydHlQYW5lbCgpO1xuICB9XG5cbiAgaWYgKHRoaXMucHJlZmFiSW5kZXggPiB0aGlzLnByZWZhYnMubGVuZ3RoIC0gMSkge1xuICAgIHRoaXMucHJlZmFiSW5kZXggPSB0aGlzLnByZWZhYnMubGVuZ3RoIC0gMTtcbiAgICB0aGlzLnByZWZhYnNCYXIuaGlnaGxpZ2h0KHRoaXMucHJlZmFiSW5kZXgpO1xuICAgIHRoaXMuYmxvY2tzLmRlc2VyaWFsaXplKHRoaXMucHJlZmFic1t0aGlzLnByZWZhYkluZGV4XSk7XG4gICAgdGhpcy51cGRhdGVQcm9wZXJ0eVBhbmVsKCk7XG4gIH1cblxuICB0aGlzLnVwZGF0ZVNjcmVlbnNob3RzKCk7XG4gIHRoaXMudXBkYXRlTGFzdEJsb2NrcygpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5jcmVhdGVDbG9uZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcHJlZmFiID0gdGhpcy5ibG9ja3Muc2VyaWFsaXplKCk7XG4gIHRoaXMuY3JlYXRlTmV3KHRoaXMucHJlZmFiSW5kZXggKyAxKTtcbiAgdGhpcy5ibG9ja3MuZGVzZXJpYWxpemUocHJlZmFiKTtcbiAgdGhpcy51cGRhdGVDdXJyZW50UHJlZmFiKCk7XG5cbiAgdGhpcy51cGRhdGVTY3JlZW5zaG90cygpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5zY3JlZW5zaG90ID0gZnVuY3Rpb24oZGF0YSkge1xuICBpZiAodGhpcy5zY3JlZW5zaG90UmVuZGVyZXIgPT0gbnVsbCkge1xuICAgIHRoaXMuc2NyZWVuc2hvdFJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoe1xuICAgICAgYWxwaGE6IHRydWVcbiAgICB9KTtcbiAgICB0aGlzLnNjcmVlbnNob3RSZW5kZXJlci5zZXRDbGVhckNvbG9yKDB4ZmZmZmZmLCAwLjApO1xuICB9XG5cbiAgdmFyIHJlbmRlcmVyID0gdGhpcy5zY3JlZW5zaG90UmVuZGVyZXI7XG5cbiAgdmFyIHdpZHRoID0gMTAwO1xuICB2YXIgaGVpZ2h0ID0gMTAwO1xuICByZW5kZXJlci5zZXRTaXplKHdpZHRoLCBoZWlnaHQpO1xuXG4gIHZhciBvYmplY3QgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcbiAgdmFyIGJsb2NrcyA9IG5ldyBCbG9ja3Mob2JqZWN0KTtcbiAgYmxvY2tzLmRlc2VyaWFsaXplKGRhdGEpO1xuICBibG9ja3MudGljaygpO1xuXG4gIHZhciBkaW0gPSBibG9ja3MuZGltO1xuXG4gIGJsb2Nrcy5vYmoucG9zaXRpb24uc2V0KC1kaW1bMF0gLyAyLCAtZGltWzFdIC8gMiwgLWRpbVsyXSAvIDIpO1xuXG4gIHZhciBvYmplY3RDbG9uZSA9IG9iamVjdC5jbG9uZSgpO1xuICB2YXIgc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKTtcbiAgc2NlbmUuYWRkKG9iamVjdENsb25lKTtcblxuICB2YXIgYW1iaWVudCA9IG5ldyBUSFJFRS5BbWJpZW50TGlnaHQobmV3IFRIUkVFLkNvbG9yKFwicmdiKDYwJSwgNjAlLCA2MCUpXCIpKTtcbiAgdmFyIGxpZ2h0ID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoMHhmZmZmZmYsIDAuNik7XG4gIGxpZ2h0LnBvc2l0aW9uLnNldCgwLjgsIDEsIDAuNSk7XG4gIHNjZW5lLmFkZChsaWdodCk7XG4gIHNjZW5lLmFkZChhbWJpZW50KTtcblxuICB2YXIgbWF4U2l6ZSA9IE1hdGgubWF4KGRpbVswXSwgZGltWzFdLCBkaW1bMl0pICogMjtcblxuICB2YXIgY2FtZXJhID0gbmV3IFRIUkVFLk9ydGhvZ3JhcGhpY0NhbWVyYShtYXhTaXplIC8gLTIsIG1heFNpemUgLyAyLCBtYXhTaXplIC8gMiwgbWF4U2l6ZSAvIC0yLCAwLjEsIDEwMDApO1xuICBjYW1lcmEucG9zaXRpb24uc2V0KDAsIDAsIDEwKTtcblxuICB2YXIgY2FtZXJhUG9zaXRpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCBtYXhTaXplKVxuICAgIC5hcHBseUV1bGVyKG5ldyBUSFJFRS5FdWxlcigtTWF0aC5QSSAvIDQsIDAsIDAsICdZWFonKSlcbiAgY2FtZXJhLnBvc2l0aW9uLmNvcHkoY2FtZXJhUG9zaXRpb24pO1xuICBjYW1lcmEubG9va0F0KG5ldyBUSFJFRS5WZWN0b3IzKCkpO1xuXG4gIHJlbmRlcmVyLnJlbmRlcihzY2VuZSwgY2FtZXJhKTtcbiAgaW1nRGF0YSA9IHJlbmRlcmVyLmRvbUVsZW1lbnQudG9EYXRhVVJMKCk7XG5cbiAgcmVuZGVyZXIuZGlzcG9zZSgpO1xuXG4gIHJldHVybiBpbWdEYXRhO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5sb2FkID0gZnVuY3Rpb24oZGF0YSkge1xuICB0aGlzLmJsb2Nrcy5kZXNlcmlhbGl6ZShkYXRhKTtcblxuICB0aGlzLnVwZGF0ZVNpemUodGhpcy5ibG9ja3MuZGltKTtcblxuICB0aGlzLnVwZGF0ZUxhc3RCbG9ja3MoKTtcblxuICB0aGlzLnVwZGF0ZVByb3BlcnR5UGFuZWwoKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUudXBkYXRlUHJvcGVydHlQYW5lbCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcHJlZmFiID0gdGhpcy5nZXRTZWxlY3RlZFByZWZhYigpO1xuXG4gIHRoaXMucHJvcGVydHlQYW5lbC5jb250cm9sbGVyc1snbmFtZSddLnNldFZhbHVlKHByZWZhYi51c2VyRGF0YS5uYW1lIHx8ICd1bm5hbWVkJyk7XG5cbiAgdmFyIGRpbSA9IHByZWZhYi5kaW07XG4gIHZhciBmb3JtYXR0ZWRTaXplID0gZGltLmpvaW4oJyAnKTtcbiAgdGhpcy5wcm9wZXJ0eVBhbmVsLmNvbnRyb2xsZXJzWydzaXplJ10uc2V0VmFsdWUoZm9ybWF0dGVkU2l6ZSk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucHJlZmFiU2VydmljZS5yZXNldCgpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5zYXZlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucHJlZmFiU2VydmljZS5zYXZlKHRoaXMucHJlZmFicyk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnVwZGF0ZUxhc3RCbG9ja3MgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5ibG9ja3MudXBkYXRlTWVzaCgpO1xuICB0aGlzLmxhc3RCbG9ja3MgPSB0aGlzLmJsb2Nrcy5vYmouY2xvbmUoKTtcbiAgdGhpcy5sYXN0QmxvY2tzLnVwZGF0ZU1hdHJpeFdvcmxkKCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLmdldENvb3JkQWJvdmUgPSBmdW5jdGlvbihwb2ludCkge1xuICBwb2ludCA9IHBvaW50IHx8IHRoaXMuaW5wdXQubW91c2U7XG4gIHZhciBvYmplY3RzID0gW107XG4gIGlmICh0aGlzLmxhc3RCbG9ja3MgIT0gbnVsbCkgb2JqZWN0cy5wdXNoKHRoaXMubGFzdEJsb2Nrcyk7XG4gIGlmICh0aGlzLm9iakdyb3VuZCAhPSBudWxsKSBvYmplY3RzLnB1c2godGhpcy5vYmpHcm91bmQpO1xuICByZXR1cm4gdGhpcy5nZXRDb29yZChvYmplY3RzLCBwb2ludCwgLXRoaXMuc24pO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5nZXRDb29yZEJlbG93ID0gZnVuY3Rpb24ocG9pbnQpIHtcbiAgcG9pbnQgPSBwb2ludCB8fCB0aGlzLmlucHV0Lm1vdXNlO1xuICB2YXIgb2JqZWN0cyA9IFtdO1xuICBpZiAodGhpcy5sYXN0QmxvY2tzICE9IG51bGwpIG9iamVjdHMucHVzaCh0aGlzLmxhc3RCbG9ja3MpO1xuICB2YXIgY29vcmQgPSB0aGlzLmdldENvb3JkKG9iamVjdHMsIHBvaW50LCB0aGlzLnNuKTtcblxuICBpZiAoY29vcmQgPT0gbnVsbCAmJiB0aGlzLm9iakdyb3VuZCAhPSBudWxsKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Q29vcmQoW3RoaXMub2JqR3JvdW5kXSwgcG9pbnQsIC10aGlzLnNuKTtcbiAgfVxuXG4gIHJldHVybiBjb29yZDtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUuZ2V0Q29vcmQgPSBmdW5jdGlvbihvYmplY3RzLCBhdFBvaW50LCBkZWx0YSkge1xuICB2YXIgdmlld3BvcnQgPSB0aGlzLmlucHV0LnNjcmVlblRvVmlld3BvcnQoYXRQb2ludCk7XG4gIHZhciByYXljYXN0ZXIgPSBuZXcgVEhSRUUuUmF5Y2FzdGVyKCk7XG4gIHJheWNhc3Rlci5zZXRGcm9tQ2FtZXJhKHZpZXdwb3J0LCB0aGlzLmNhbWVyYSk7XG4gIHZhciBpbnRlcnNlY3RzID0gcmF5Y2FzdGVyLmludGVyc2VjdE9iamVjdHMob2JqZWN0cywgdHJ1ZSk7XG5cbiAgaWYgKGludGVyc2VjdHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHZhciBpbnRlcnNlY3QgPSBpbnRlcnNlY3RzWzBdO1xuXG4gIHZhciBwb2ludCA9IGludGVyc2VjdC5wb2ludDtcbiAgdmFyIGRpZmYgPSBwb2ludC5jbG9uZSgpLnN1Yih0aGlzLmNhbWVyYS5wb3NpdGlvbik7XG4gIGRpZmYgPSBkaWZmLnNldExlbmd0aChkaWZmLmxlbmd0aCgpICsgKGRlbHRhIHx8IDApKTtcbiAgcG9pbnQgPSB0aGlzLmNhbWVyYS5wb3NpdGlvbi5jbG9uZSgpLmFkZChkaWZmKTtcblxuICB2YXIgbG9jYWxQb2ludCA9IHRoaXMuYmxvY2tzLm9iai53b3JsZFRvTG9jYWwocG9pbnQpO1xuICB2YXIgY29vcmQgPSB0aGlzLmJsb2Nrcy5wb2ludFRvQ29vcmQobG9jYWxQb2ludCk7XG4gIGNvb3JkID0gbmV3IFRIUkVFLlZlY3RvcjMoXG4gICAgTWF0aC5yb3VuZChjb29yZC54KSxcbiAgICBNYXRoLnJvdW5kKGNvb3JkLnkpLFxuICAgIE1hdGgucm91bmQoY29vcmQueilcbiAgKTtcblxuICByZXR1cm4gY29vcmQ7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnVwZGF0ZUhpZ2hsaWdodCA9IGZ1bmN0aW9uKGNvb3JkKSB7XG4gIGlmICh0aGlzLm9iakhpZ2hsaWdodCA9PSBudWxsKSB7XG4gICAgdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkJveEdlb21ldHJ5KDEsIDEsIDEpO1xuICAgIHZhciBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCgpO1xuICAgIHZhciBtZXNoID0gbmV3IFRIUkVFLk1lc2goZ2VvbWV0cnksIG1hdGVyaWFsKTtcbiAgICB2YXIgd2lyZWZyYW1lID0gbmV3IFRIUkVFLkVkZ2VzSGVscGVyKG1lc2gsIDB4ZmZmZmZmKTtcbiAgICB0aGlzLm9iakhpZ2hsaWdodCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICAgIHRoaXMub2JqSGlnaGxpZ2h0LmFkZCh3aXJlZnJhbWUpO1xuICAgIHRoaXMub2JqZWN0LmFkZCh0aGlzLm9iakhpZ2hsaWdodCk7XG4gIH1cblxuICBpZiAoY29vcmQgPT0gbnVsbCkge1xuICAgIHRoaXMub2JqSGlnaGxpZ2h0LnZpc2libGUgPSBmYWxzZTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb29yZCA9IGNvb3JkLmNsb25lKCkuYWRkKG5ldyBUSFJFRS5WZWN0b3IzKDAuNSwgMC41LCAwLjUpKTtcbiAgdGhpcy5vYmpIaWdobGlnaHQudmlzaWJsZSA9IHRydWU7XG4gIHZhciBsb2NhbFBvaW50ID0gdGhpcy5ibG9ja3MuY29vcmRUb1BvaW50KGNvb3JkKTtcbiAgdmFyIHdvcmxkUG9pbnQgPSB0aGlzLmJsb2Nrcy5vYmoubG9jYWxUb1dvcmxkKGxvY2FsUG9pbnQpO1xuICB0aGlzLm9iakhpZ2hsaWdodC5wb3NpdGlvbi5jb3B5KHdvcmxkUG9pbnQpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5zZXRTZWxlY3RlZENvbG9yID0gZnVuY3Rpb24oY29sb3IpIHtcbiAgdmFyIGluZGV4ID0gYXJyYXlVdGlscy5pbmRleE9mKHRoaXMucGFsZXR0ZSwgZnVuY3Rpb24oYykge1xuICAgIHJldHVybiBjb2xvciA9PT0gYyB8fCAoY29sb3IgPT0gbnVsbCAmJiBjLmlzQ2xlYXJDb2xvcik7XG4gIH0pO1xuXG4gIGlmIChpbmRleCA9PSAtMSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMuc2VsZWN0ZWRDb2xvciA9IGNvbG9yO1xuICB0aGlzLmNvbG9yQmFyLmhpZ2hsaWdodChpbmRleCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLmFwcGx5T2Zmc2V0ID0gZnVuY3Rpb24ob2Zmc2V0KSB7XG4gIHZhciBzZWxlY3RlZENvb3JkcztcbiAgaWYgKHRoaXMuc2VsZWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgc2VsZWN0ZWRDb29yZHMgPSB0aGlzLnNlbGVjdGlvbnM7XG4gIH0gZWxzZSB7XG4gICAgc2VsZWN0ZWRDb29yZHMgPSB0aGlzLmJsb2Nrcy5nZXRBbGxDb29yZHMoKTtcbiAgfVxuXG4gIHRoaXMucnVuQ29tbWFuZChuZXcgT2Zmc2V0Q29tbWFuZCh0aGlzLCB0aGlzLmJsb2Nrcywgc2VsZWN0ZWRDb29yZHMsIG9mZnNldCkpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5kb3dubG9hZEpTT04gPSBmdW5jdGlvbihqc29uLCBuYW1lKSB7XG4gIG5hbWUgPSBuYW1lIHx8ICdibG9ja3MnO1xuICB2YXIgZGF0YVN0ciA9IFwiZGF0YTp0ZXh0L2pzb247Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShqc29uKSk7XG4gIGlmICh0aGlzLmRvd25sb2FkRWxlbWVudCA9PSBudWxsKSB7XG4gICAgdGhpcy5kb3dubG9hZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgdGhpcy5kb3dubG9hZEVsZW1lbnQuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5kb3dubG9hZEVsZW1lbnQpO1xuICB9XG4gIHRoaXMuZG93bmxvYWRFbGVtZW50LnNldEF0dHJpYnV0ZShcImhyZWZcIiwgZGF0YVN0cik7XG4gIHRoaXMuZG93bmxvYWRFbGVtZW50LnNldEF0dHJpYnV0ZShcImRvd25sb2FkXCIsIG5hbWUgKyAnLmpzb24nKTtcbiAgdGhpcy5kb3dubG9hZEVsZW1lbnQuY2xpY2soKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUuc2VyaWFsaXplID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmJsb2Nrcy5zZXJpYWxpemUoKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUuZ2V0U2VsZWN0ZWRQcmVmYWIgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMucHJlZmFic1t0aGlzLnByZWZhYkluZGV4XTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUudXBkYXRlQ3VycmVudFByZWZhYiA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnByZWZhYnNbdGhpcy5wcmVmYWJJbmRleF0gPSB0aGlzLmJsb2Nrcy5zZXJpYWxpemUoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yOyIsInZhciBFZGl0b3IgPSByZXF1aXJlKCcuL2VkaXRvcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVkaXRvciwgZGV2Q29uc29sZSkge1xuXG4gIGRldkNvbnNvbGUuY29tbWFuZHNbJ3NpemUnXSA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICB2YXIgZGVmYXVsdFNpemUgPSBlZGl0b3IuY29uZmlnWydlZGl0b3JfZGVmYXVsdF9zaXplJ107XG4gICAgdmFyIHggPSBhcmdzLl9bMF0gfHwgZGVmYXVsdFNpemVbMF07XG4gICAgdmFyIHkgPSBhcmdzLl9bMV0gfHwgYXJncy5fWzBdIHx8IGRlZmF1bHRTaXplWzFdO1xuICAgIHZhciB6ID0gYXJncy5fWzJdIHx8IGFyZ3MuX1swXSB8fCBkZWZhdWx0U2l6ZVsyXTtcblxuICAgIGVkaXRvci51cGRhdGVTaXplKFt4LCB5LCB6XSk7XG4gIH07XG5cbiAgZGV2Q29uc29sZS5jb21tYW5kc1snb2Zmc2V0J10gPSBmdW5jdGlvbihhcmdzKSB7XG4gICAgdmFyIHggPSBhcmdzLl9bMF0gfHwgMDtcbiAgICB2YXIgeSA9IGFyZ3MuX1sxXSB8fCAwO1xuICAgIHZhciB6ID0gYXJncy5fWzJdIHx8IDA7XG5cbiAgICBlZGl0b3IuYmxvY2tzLnNldE9mZnNldChuZXcgVEhSRUUuVmVjdG9yMyh4LCB5LCB6KSk7XG4gIH07XG5cbiAgZGV2Q29uc29sZS5jb21tYW5kc1snbmV3J10gPSBmdW5jdGlvbihhcmdzKSB7XG4gICAgZWRpdG9yLmNyZWF0ZU5ldygpO1xuICB9O1xuXG4gIGRldkNvbnNvbGUuY29tbWFuZHNbJ21pcnJvciddID0gZnVuY3Rpb24oYXJncykge1xuICAgIGlmIChhcmdzLl8ubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3BsZWFzZSBzcGVjaWZ5IHggeSB6IG9yIG5vbmUnKTtcbiAgICB9XG5cbiAgICBpZiAoYXJncy5fLmxlbmd0aCA9PT0gMSkge1xuICAgICAgaWYgKGFyZ3MuX1swXSA9PT0gJ25vbmUnKSB7XG4gICAgICAgIGVkaXRvci5yZWZsZWN0WCA9IGVkaXRvci5yZWZsZWN0WSA9IGVkaXRvci5yZWZsZWN0WiA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGVkaXRvci5yZWZsZWN0WCA9IGVkaXRvci5yZWZsZWN0WSA9IGVkaXRvci5yZWZsZWN0WiA9IGZhbHNlO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5fLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgYXJnID0gYXJncy5fW2ldO1xuICAgICAgaWYgKGFyZyA9PT0gJ3gnKSB7XG4gICAgICAgIGVkaXRvci5yZWZsZWN0WCA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGFyZyA9PT0gJ3knKSB7XG4gICAgICAgIGVkaXRvci5yZWZsZWN0WSA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGFyZyA9PT0gJ3onKSB7XG4gICAgICAgIGVkaXRvci5yZWZsZWN0WiA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Vua25vd24gb3B0aW9uOiAnICsgYXJnKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgZGV2Q29uc29sZS5jb21tYW5kc1sncmVzZXQnXSA9IGZ1bmN0aW9uKCkge1xuICAgIGVkaXRvci5yZXNldCgpO1xuICB9O1xuXG4gIGRldkNvbnNvbGUuY29tbWFuZHNbJ3NhdmUnXSA9IGZ1bmN0aW9uKCkge1xuICAgIGVkaXRvci5zYXZlKCk7XG4gIH07XG59IiwidmFyIEVkaXRvclRvb2xzID0ge1xuICBQZW46ICdQZW4nLFxuICBTZWxlY3Q6ICdTZWxlY3QnLFxuICBTYW1wbGU6ICdTYW1wbGUnLFxuICBDYW1lcmE6ICdDYW1lcmEnLFxuICBGaWxsOiAnRmlsbCdcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yVG9vbHM7IiwidmFyIGNwciA9IHJlcXVpcmUoJy4vY3ByJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWRpdG9yKSB7XG4gIHZhciBkYXRhID0gW3tcbiAgICBzcmM6ICcvaW1hZ2VzL2ljb25zL2Fycm93MV9saWdodC5wbmcnLFxuICAgIHNyY0FjdGl2ZTogJy9pbWFnZXMvaWNvbnMvYXJyb3cxX2RhcmsucG5nJyxcbiAgICBpbmRleDogMCxcbiAgICB0b29sdGlwOiAnbW92ZSByaWdodCAoRCknXG4gIH0sIHtcbiAgICBzcmM6ICcvaW1hZ2VzL2ljb25zL2Fycm93Ml9saWdodC5wbmcnLFxuICAgIHNyY0FjdGl2ZTogJy9pbWFnZXMvaWNvbnMvYXJyb3cyX2RhcmsucG5nJyxcbiAgICBpbmRleDogMSxcbiAgICB0b29sdGlwOiAnbW92ZSBsZWZ0IChBKSdcbiAgfSwge1xuICAgIHNyYzogJy9pbWFnZXMvaWNvbnMvYXJyb3czX2xpZ2h0LnBuZycsXG4gICAgc3JjQWN0aXZlOiAnL2ltYWdlcy9pY29ucy9hcnJvdzNfZGFyay5wbmcnLFxuICAgIGluZGV4OiAyLFxuICAgIHRvb2x0aXA6ICdtb3ZlIGZyb250IChXKSdcbiAgfSwge1xuICAgIHNyYzogJy9pbWFnZXMvaWNvbnMvYXJyb3c0X2xpZ2h0LnBuZycsXG4gICAgc3JjQWN0aXZlOiAnL2ltYWdlcy9pY29ucy9hcnJvdzRfZGFyay5wbmcnLFxuICAgIGluZGV4OiAzLFxuICAgIHRvb2x0aXA6ICdtb3ZlIGJhY2sgKFMpJ1xuICB9LCB7XG4gICAgc3JjOiAnL2ltYWdlcy9pY29ucy9hcnJvdzVfbGlnaHQucG5nJyxcbiAgICBzcmNBY3RpdmU6ICcvaW1hZ2VzL2ljb25zL2Fycm93NV9kYXJrLnBuZycsXG4gICAgaW5kZXg6IDQsXG4gICAgdG9vbHRpcDogJ21vdmUgdXAgKFIpJ1xuICB9LCB7XG4gICAgc3JjOiAnL2ltYWdlcy9pY29ucy9hcnJvdzZfbGlnaHQucG5nJyxcbiAgICBzcmNBY3RpdmU6ICcvaW1hZ2VzL2ljb25zL2Fycm93Nl9kYXJrLnBuZycsXG4gICAgaW5kZXg6IDUsXG4gICAgdG9vbHRpcDogJ21vdmUgZG93biAoRiknXG4gIH1dO1xuXG4gIHZhciBiYXIgPSBjcHIoe1xuICAgIGRhdGE6IGRhdGEsXG4gICAgYmxvY2tXaWR0aDogMzIsXG4gICAgYmxvY2tIZWlnaHQ6IDMyLFxuICAgIGhpZGVIaWdobGlnaHQ6IHRydWUsXG4gICAgY3VzdG9tUGxhY2VtZW50OiB0cnVlLFxuICAgIHNob3dUb29sdGlwOiB0cnVlLFxuICAgIG9uUGljazogZnVuY3Rpb24ob2JqKSB7XG4gICAgICB2YXIgaW5kZXggPSBvYmouaW5kZXg7XG5cbiAgICAgIHZhciBvZmZzZXQgPSBudWxsO1xuICAgICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICAgIG9mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKDEsIDAsIDApO1xuICAgICAgfSBlbHNlIGlmIChpbmRleCA9PT0gMSkge1xuICAgICAgICBvZmZzZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygtMSwgMCwgMCk7XG4gICAgICB9IGVsc2UgaWYgKGluZGV4ID09PSAyKSB7XG4gICAgICAgIG9mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKTtcbiAgICAgIH0gZWxzZSBpZiAoaW5kZXggPT09IDMpIHtcbiAgICAgICAgb2Zmc2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMSk7XG4gICAgICB9IGVsc2UgaWYgKGluZGV4ID09PSA0KSB7XG4gICAgICAgIG9mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDEsIDApO1xuICAgICAgfSBlbHNlIGlmIChpbmRleCA9PT0gNSkge1xuICAgICAgICBvZmZzZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAtMSwgMCk7XG4gICAgICB9XG5cbiAgICAgIGVkaXRvci5hcHBseU9mZnNldChvZmZzZXQpO1xuICAgIH0sXG4gICAgaXNCdXR0b246IHRydWVcbiAgfSk7XG5cbiAgdmFyIGd1aSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdndWknKTtcbiAgZ3VpLmFwcGVuZENoaWxkKGJhci5kb21FbGVtZW50KTtcblxuICBiYXIuZG9tRWxlbWVudC5jbGFzc0xpc3QuYWRkKCd0b29sYmFyJyk7XG4gIGJhci5kb21FbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgYmFyLmRvbUVsZW1lbnQuc3R5bGUudG9wID0gJzcwcHgnO1xuICBiYXIuZG9tRWxlbWVudC5zdHlsZS5sZWZ0ID0gJzIwcHgnO1xufTsiLCJ2YXIgY3ByID0gcmVxdWlyZSgnLi9jcHInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlZGl0b3IpIHtcbiAgdmFyIGJhciA9IGNwcih7XG4gICAgZGF0YTogZWRpdG9yLnBhbGV0dGUsXG4gICAgb25QaWNrOiBmdW5jdGlvbihjb2xvcikge1xuICAgICAgZWRpdG9yLnNlbGVjdGVkQ29sb3IgPSBjb2xvci5pc0NsZWFyQ29sb3IgPyBudWxsIDogY29sb3I7XG4gICAgfSxcbiAgICBjdXN0b21QbGFjZW1lbnQ6IHRydWVcbiAgfSk7XG5cbiAgdmFyIGd1aSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdndWknKTtcbiAgZ3VpLmFwcGVuZENoaWxkKGJhci5kb21FbGVtZW50KTtcblxuICBiYXIuZG9tRWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIGJhci5kb21FbGVtZW50LnN0eWxlLmxlZnQgPSAnMjBweCc7XG4gIGJhci5kb21FbGVtZW50LnN0eWxlLmJvdHRvbSA9ICcyMHB4JztcblxuICByZXR1cm4gYmFyO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgb3B0cyA9IG9wdHMgfHwge307XG4gIHZhciBkYXRhVG9Mb2FkID0gb3B0cy5kYXRhIHx8IFtdO1xuICB2YXIgb25QaWNrID0gb3B0cy5vblBpY2sgfHwgZnVuY3Rpb24oKSB7fTtcbiAgdmFyIG9uSG92ZXIgPSBvcHRzLm9uSG92ZXIgfHwgZnVuY3Rpb24oKSB7fTtcbiAgdmFyIG9uTGVhdmUgPSBvcHRzLm9uTGVhdmUgfHwgZnVuY3Rpb24oKSB7fTtcbiAgdmFyIGN1c3RvbVBsYWNlbWVudCA9IG9wdHMuY3VzdG9tUGxhY2VtZW50IHx8IGZhbHNlO1xuICB2YXIgc2hvd1Rvb2x0aXAgPSBvcHRzLnNob3dUb29sdGlwIHx8IGZhbHNlO1xuICB2YXIgcGFkZGluZ1JpZ2h0ID0gb3B0cy5wYWRkaW5nUmlnaHQgfHwgMDtcbiAgdmFyIGJsb2NrV2lkdGggPSBvcHRzLmJsb2NrV2lkdGggfHwgMjA7XG4gIHZhciBibG9ja0hlaWdodCA9IG9wdHMuYmxvY2tIZWlnaHQgfHwgMjA7XG4gIHZhciBjb2x1bW5zID0gb3B0cy5jb2x1bW5zIHx8IDE0O1xuICB2YXIgaXNCdXR0b24gPSBvcHRzLmlzQnV0dG9uIHx8IGZhbHNlO1xuICB2YXIgc2tpbkJsb2NrID0gb3B0cy5za2luQmxvY2sgfHwgZnVuY3Rpb24oKSB7fTtcbiAgdmFyIHN0aWNreVNlbGVjdGlvbiA9IG9wdHMuc3RpY2t5U2VsZWN0aW9uIHx8IGZhbHNlO1xuXG4gIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgY29udGFpbmVyLmNsYXNzTmFtZSA9ICdjcHInO1xuXG4gIHZhciBtb3VzZWRvd25MaXN0ZW5lcnMgPSBbXTtcbiAgdmFyIG1vdXNldXBMaXN0ZW5lcnMgPSBbXTtcbiAgdmFyIGJsb2NrcyA9IFtdO1xuICB2YXIgZGF0YSA9IFtdO1xuICB2YXIgaGlnaGxpZ2h0RGl2ID0gbnVsbDtcbiAgdmFyIHNlbGVjdGVkSW5kZXggPSAtMTtcblxuICBpZiAoc2hvd1Rvb2x0aXApIHtcbiAgICB2YXIgdG9vbHRpcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRvb2x0aXAuY2xhc3NOYW1lID0gJ3Rvb2x0aXAnO1xuXG4gICAgdG9vbHRpcC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgdG9vbHRpcC5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRvb2x0aXApO1xuICB9XG5cbiAgaWYgKCFjdXN0b21QbGFjZW1lbnQpIHtcbiAgICBjb250YWluZXIuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIGNvbnRhaW5lci5zdHlsZS5sZWZ0ID0gJzIwcHgnO1xuICAgIGNvbnRhaW5lci5zdHlsZS5ib3R0b20gPSAnMjBweCc7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuICB9XG5cbiAgY29udGFpbmVyLm9uZm9jdXMgPSBmdW5jdGlvbigpIHtcbiAgICBjb250YWluZXIuc3R5bGVbJ291dGxpbmUnXSA9ICdub25lJztcbiAgfTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGFUb0xvYWQubGVuZ3RoOyBpKyspIHtcbiAgICBhZGQoZGF0YVRvTG9hZFtpXSk7XG4gIH1cblxuICB1cGRhdGVDb250YWluZXIoKTtcblxuICBmdW5jdGlvbiBnZXRSb3coaW5kZXgpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcihpbmRleCAvIGNvbHVtbnMpO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGdldENvbHVtbihpbmRleCkge1xuICAgIHJldHVybiBpbmRleCAlIGNvbHVtbnM7XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0Um93cygpIHtcbiAgICByZXR1cm4gTWF0aC5jZWlsKGRhdGEubGVuZ3RoIC8gY29sdW1ucyk7XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0SW5kZXgocm93LCBjb2x1bW4pIHtcbiAgICByZXR1cm4gcm93ICogY29sdW1ucyArIGNvbHVtbjtcbiAgfTtcblxuICBmdW5jdGlvbiByZW1vdmUoaW5kZXgpIHtcbiAgICBjb250YWluZXIucmVtb3ZlQ2hpbGQoYmxvY2tzW2luZGV4XSk7XG4gICAgYmxvY2tzW2luZGV4XS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBtb3VzZWRvd25MaXN0ZW5lcnNbaW5kZXhdKTtcbiAgICBibG9ja3NbaW5kZXhdLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBtb3VzZXVwTGlzdGVuZXJzW2luZGV4XSk7XG5cbiAgICBtb3VzZWRvd25MaXN0ZW5lcnNbaW5kZXhdID0gdW5kZWZpbmVkO1xuICAgIG1vdXNldXBMaXN0ZW5lcnNbaW5kZXhdID0gdW5kZWZpbmVkO1xuICAgIGJsb2Nrc1tpbmRleF0gPSB1bmRlZmluZWQ7XG4gICAgZGF0YVtpbmRleF0gPSB1bmRlZmluZWQ7XG4gIH07XG5cbiAgZnVuY3Rpb24gc2V0KGluZGV4LCBvYmopIHtcbiAgICBpZiAoZGF0YVtpbmRleF0gIT0gbnVsbCkge1xuICAgICAgcmVtb3ZlKGluZGV4KTtcbiAgICB9O1xuXG4gICAgdmFyIHJvdyA9IGdldFJvdyhpbmRleCk7XG4gICAgdmFyIGNvbHVtbiA9IGdldENvbHVtbihpbmRleCk7XG5cbiAgICB2YXIgZWxlbWVudDtcbiAgICBpZiAob2JqLmltZ0RhdGEgIT0gbnVsbCkge1xuICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICAgICAgZWxlbWVudC5zcmMgPSBvYmouaW1nRGF0YTtcbiAgICB9IGVsc2UgaWYgKG9iai5zcmMgIT0gbnVsbCkge1xuICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICAgICAgZWxlbWVudC5zcmMgPSBvYmouc3JjO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgY29sb3IgPSBvYmo7XG4gICAgICBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBlbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yO1xuICAgIH1cblxuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gJ2Jsb2NrIGJveC1zaXppbmcnO1xuICAgIGlmIChpc0J1dHRvbikge1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdidXR0b24nKTtcbiAgICB9XG5cbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgcG9zaXRpb24oZWxlbWVudCwgcm93LCBjb2x1bW4pO1xuXG4gICAgYmxvY2tzW2luZGV4XSA9IGVsZW1lbnQ7XG4gICAgZGF0YVtpbmRleF0gPSBvYmo7XG5cbiAgICB1cGRhdGVDb250YWluZXIoKTtcblxuICAgIHNraW5CbG9jayhlbGVtZW50KTtcblxuICAgIHZhciBvbk1vdXNlRG93biA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGhpZ2hsaWdodChpbmRleCwgdHJ1ZSk7XG4gICAgICBvblBpY2sob2JqLCBpbmRleCk7XG4gICAgfTtcblxuICAgIHZhciBvbk1vdXNlVXAgPSBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoaXNCdXR0b24gJiYgIXN0aWNreVNlbGVjdGlvbikge1xuICAgICAgICBoaWdobGlnaHQoaW5kZXgsIGZhbHNlKTtcbiAgICAgIH0gXG4gICAgfTtcblxuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgb25Nb3VzZURvd24pO1xuXG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgb25Nb3VzZVVwKTtcblxuICAgIG1vdXNlZG93bkxpc3RlbmVyc1tpbmRleF0gPSBvbk1vdXNlRG93bjtcbiAgICBtb3VzZXVwTGlzdGVuZXJzW2luZGV4XSA9IG9uTW91c2VVcDtcbiAgfTtcblxuICBmdW5jdGlvbiBhZGQob2JqKSB7XG4gICAgdmFyIGluZGV4ID0gYmxvY2tzLmxlbmd0aDtcbiAgICBzZXQoaW5kZXgsIG9iaik7XG4gIH07XG5cbiAgZnVuY3Rpb24gcG9zaXRpb24oZWxlbWVudCwgcm93LCBjb2x1bW4pIHtcbiAgICBlbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBlbGVtZW50LnN0eWxlLmxlZnQgPSBjb2x1bW4gKiAoYmxvY2tXaWR0aCArIHBhZGRpbmdSaWdodCkgKyAncHgnO1xuICAgIGVsZW1lbnQuc3R5bGUudG9wID0gcm93ICogYmxvY2tIZWlnaHQgKyAncHgnO1xuICAgIGVsZW1lbnQuc3R5bGUud2lkdGggPSBibG9ja1dpZHRoICsgJ3B4JztcbiAgICBlbGVtZW50LnN0eWxlLmhlaWdodCA9IGJsb2NrSGVpZ2h0ICsgJ3B4JztcbiAgfTtcblxuICBmdW5jdGlvbiB1cGRhdGVDb250YWluZXIoKSB7XG4gICAgdmFyIG51bWJlck9mQ29sdW1ucyA9IGRhdGEubGVuZ3RoID4gY29sdW1ucyA/IGNvbHVtbnMgOiBkYXRhLmxlbmd0aDtcbiAgICBjb250YWluZXIuc3R5bGUud2lkdGggPSBudW1iZXJPZkNvbHVtbnMgKiAoYmxvY2tXaWR0aCArIHBhZGRpbmdSaWdodCkgKyAncHgnO1xuICAgIGNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBnZXRSb3dzKCkgKiBibG9ja0hlaWdodCArICdweCc7XG4gIH07XG5cbiAgZnVuY3Rpb24gaGlnaGxpZ2h0KGluZGV4LCB2YWx1ZSkge1xuICAgIHZhbHVlID0gdmFsdWUgPT09IHVuZGVmaW5lZCA/IHRydWUgOiB2YWx1ZTtcblxuICAgIHZhciBlbGVtZW50ID0gYmxvY2tzW2luZGV4XTtcblxuICAgIGlmIChlbGVtZW50ID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgb2JqID0gZGF0YVtpbmRleF07XG5cbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIGlmIChpc0J1dHRvbikge1xuICAgICAgICAvLyB1biBoaWdobGlnaHQgbGFzdCBlbGVtZW50IGlmIHN0aWNreSBzZWxlY3Rpb25cbiAgICAgICAgaWYgKHN0aWNreVNlbGVjdGlvbiAmJiBzZWxlY3RlZEluZGV4ICE9IGluZGV4KSB7XG4gICAgICAgICAgaGlnaGxpZ2h0KHNlbGVjdGVkSW5kZXgsIGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnc2VsZWN0ZWQnKTtcbiAgICAgICAgaWYgKG9iai5zcmNBY3RpdmUgIT0gbnVsbCkgZWxlbWVudC5zcmMgPSBvYmouc3JjQWN0aXZlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHJvdyA9IGdldFJvdyhpbmRleCk7XG4gICAgICAgIHZhciBjb2x1bW4gPSBnZXRDb2x1bW4oaW5kZXgpO1xuICAgICAgICBpZiAoaGlnaGxpZ2h0RGl2ID09IG51bGwpIHtcbiAgICAgICAgICBoaWdobGlnaHREaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICBoaWdobGlnaHREaXYuY2xhc3NOYW1lID0gJ2hpZ2hsaWdodCc7XG4gICAgICAgICAgaGlnaGxpZ2h0RGl2LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgICBoaWdobGlnaHREaXYuc3R5bGUud2lkdGggPSBibG9ja1dpZHRoICsgJ3B4JztcbiAgICAgICAgICBoaWdobGlnaHREaXYuc3R5bGUuaGVpZ2h0ID0gYmxvY2tIZWlnaHQgKyAncHgnO1xuICAgICAgICAgIGhpZ2hsaWdodERpdi5zdHlsZS56SW5kZXggPSAxO1xuICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChoaWdobGlnaHREaXYpO1xuICAgICAgICB9XG5cbiAgICAgICAgaGlnaGxpZ2h0RGl2LnN0eWxlLmxlZnQgPSBjb2x1bW4gKiAoYmxvY2tXaWR0aCArIHBhZGRpbmdSaWdodCkgLSAxICsgJ3B4JztcbiAgICAgICAgaGlnaGxpZ2h0RGl2LnN0eWxlLnRvcCA9IHJvdyAqIGJsb2NrSGVpZ2h0IC0gMSArICdweCc7XG4gICAgICB9XG5cbiAgICAgIHNlbGVjdGVkSW5kZXggPSBpbmRleDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGlzQnV0dG9uKSB7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWN0ZWQnKTtcbiAgICAgICAgZWxlbWVudC5zcmMgPSBvYmouc3JjO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlbW92ZShpKTtcbiAgICB9XG5cbiAgICBkYXRhID0gW107XG4gIH07XG5cbiAgZnVuY3Rpb24gaXNEZXNjZW5kYW50KHBhcmVudCwgY2hpbGQpIHtcbiAgICBpZiAoY2hpbGQgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBub2RlID0gY2hpbGQucGFyZW50Tm9kZTtcbiAgICB3aGlsZSAobm9kZSAhPSBudWxsKSB7XG4gICAgICBpZiAobm9kZSA9PSBwYXJlbnQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICB2YXIgbW91c2UgPSBudWxsO1xuICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZnVuY3Rpb24oZSkge1xuICAgIG1vdXNlID0gZTtcbiAgICB2YXIgbW91c2VYID0gZS5wYWdlWCAtIGNvbnRhaW5lci5vZmZzZXRMZWZ0O1xuICAgIHZhciBtb3VzZVkgPSBlLnBhZ2VZIC0gY29udGFpbmVyLm9mZnNldFRvcDtcbiAgICB2YXIgcm93ID0gTWF0aC5mbG9vcihtb3VzZVkgLyBibG9ja0hlaWdodCk7XG4gICAgdmFyIGNvbHVtbiA9IE1hdGguZmxvb3IobW91c2VYIC8gYmxvY2tXaWR0aCk7XG4gICAgdmFyIGluZGV4ID0gZ2V0SW5kZXgocm93LCBjb2x1bW4pO1xuXG4gICAgaWYgKGRhdGFbaW5kZXhdID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgb2JqID0gZGF0YVtpbmRleF07XG4gICAgb25Ib3ZlcihvYmosIGluZGV4KTtcblxuICAgIGlmIChzaG93VG9vbHRpcCAmJiBvYmoudG9vbHRpcCAhPSBudWxsKSB7XG4gICAgICB0b29sdGlwLnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG4gICAgICB0b29sdGlwLnN0eWxlLmxlZnQgPSBtb3VzZVggKyAyICsgJ3B4JztcbiAgICAgIHRvb2x0aXAuc3R5bGUudG9wID0gbW91c2VZICsgMiArICdweCc7XG4gICAgICBpZiAodG9vbHRpcC5pbm5lckhUTUwgIT09IG9iai50b29sdGlwKSB7XG4gICAgICAgIHRvb2x0aXAuaW5uZXJIVE1MID0gb2JqLnRvb2x0aXA7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoIWlzRGVzY2VuZGFudChjb250YWluZXIsIGUudG9FbGVtZW50KSkge1xuICAgICAgb25MZWF2ZShlKTtcblxuICAgICAgaWYgKHNob3dUb29sdGlwKSB7XG4gICAgICAgIHRvb2x0aXAuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICBoaWdobGlnaHQ6IGhpZ2hsaWdodCxcbiAgICBhZGQ6IGFkZCxcbiAgICBzZXQ6IHNldCxcbiAgICBjbGVhcjogY2xlYXIsXG4gICAgZGF0YTogZGF0YSxcbiAgICBkb21FbGVtZW50OiBjb250YWluZXIsXG4gICAgZ2V0IHNlbGVjdGVkSW5kZXgoKSB7XG4gICAgICByZXR1cm4gc2VsZWN0ZWRJbmRleDtcbiAgICB9LFxuICAgIGdldCBtb3VzZSgpIHtcbiAgICAgIHJldHVybiBtb3VzZTtcbiAgICB9LFxuICAgIGdldCB0b29sdGlwKCkge1xuICAgICAgcmV0dXJuIHRvb2x0aXA7XG4gICAgfVxuICB9XG59OyIsInZhciBjcHIgPSByZXF1aXJlKCcuL2NwcicpO1xudmFyIHBvcHVwID0gcmVxdWlyZSgnLi9wb3B1cCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVkaXRvcikge1xuICAvLyBkb3dubG9hZC5wbmdcbiAgdmFyIGRhdGEgPSBbe1xuICAgIHNyYzogJy9pbWFnZXMvaWNvbnMvZG93bmxvYWRfbGlnaHQucG5nJyxcbiAgICBzcmNBY3RpdmU6ICcvaW1hZ2VzL2ljb25zL2Rvd25sb2FkX2RhcmsucG5nJyxcbiAgICBidXR0b246ICdkb3dubG9hZCdcbiAgfV07XG5cbiAgdmFyIGJhciA9IGNwcih7XG4gICAgZGF0YTogZGF0YSxcbiAgICBjdXN0b21QbGFjZW1lbnQ6IHRydWUsXG4gICAgYmxvY2tXaWR0aDogMzIsXG4gICAgYmxvY2tIZWlnaHQ6IDMyLFxuICAgIGhpZGVIaWdobGlnaHQ6IHRydWUsXG4gICAgb25QaWNrOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHZhciBidXR0b24gPSBvYmouYnV0dG9uO1xuXG4gICAgICBpZiAoYnV0dG9uID09PSAnZG93bmxvYWQnKSB7XG4gICAgICAgIGVkaXRvci5kb3dubG9hZEpTT04oZWRpdG9yLnNlcmlhbGl6ZSgpLCAnYmxvY2tzJyk7XG4gICAgICB9XG4gICAgfSxcbiAgICBpc0J1dHRvbjogdHJ1ZVxuICB9KTtcblxuICB2YXIgZ3VpID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2d1aScpO1xuICBndWkuYXBwZW5kQ2hpbGQoYmFyLmRvbUVsZW1lbnQpO1xuXG4gIGJhci5kb21FbGVtZW50LmNsYXNzTGlzdC5hZGQoJ3Rvb2xiYXInKTtcblxuICBiYXIuZG9tRWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIGJhci5kb21FbGVtZW50LnN0eWxlLmxlZnQgPSAyMCArICdweCc7XG4gIGJhci5kb21FbGVtZW50LnN0eWxlLnRvcCA9IDEyMCArICdweCc7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGF0YSwgb3B0cykge1xuICB2YXIgY3VzdG9tUGxhY2VtZW50ID0gb3B0cy5jdXN0b21QbGFjZW1lbnQgfHwgZmFsc2U7XG5cbiAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gIGNvbnRhaW5lci5jbGFzc05hbWUgPSAncGFuZWwnO1xuXG4gIGlmICghY3VzdG9tUGxhY2VtZW50KSB7XG4gICAgY29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBjb250YWluZXIuc3R5bGUucmlnaHQgPSA0MCArICdweCc7XG4gICAgY29udGFpbmVyLnN0eWxlLnRvcCA9IDIwICsgJ3B4JztcbiAgICBjb250YWluZXIuc3R5bGUud2lkdGggPSAyMDAgKyAncHgnO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgfVxuXG4gIHZhciBwYW5lbCA9IHt9O1xuICBwYW5lbC5jb250cm9sbGVycyA9IHt9O1xuICBwYW5lbC5kb21FbGVtZW50ID0gY29udGFpbmVyO1xuXG4gIHZhciBjb250cm9sbGVycyA9IHtcbiAgICAnY2hlY2tMaXN0JzogY2hlY2tMaXN0Q29udHJvbGxlclxuICB9O1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgIHZhciBpdGVtID0gZGF0YVtpXTtcblxuICAgIHZhciBmYWN0b3J5ID0gY29udHJvbGxlcnNbaXRlbS50eXBlXSB8fCB2YWx1ZUNvbnRyb2xsZXI7XG4gICAgdmFyIGNvbnRyb2xsZXIgPSBmYWN0b3J5KGl0ZW0pO1xuICAgIHBhbmVsLmNvbnRyb2xsZXJzW2l0ZW0udGl0bGVdID0gY29udHJvbGxlcjtcblxuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjb250cm9sbGVyLmVsZW1lbnQpO1xuICB9XG5cbiAgcmV0dXJuIHBhbmVsO1xufTtcblxudmFyIHZhbHVlQ29udHJvbGxlciA9IGZ1bmN0aW9uKGl0ZW0pIHtcblxuICB2YXIgb25DaGFuZ2UgPSBpdGVtLm9uQ2hhbmdlIHx8IGZ1bmN0aW9uKCkge307XG4gIHZhciBvbkZpbmlzaEVkaXRpbmcgPSBpdGVtLm9uRmluaXNoRWRpdGluZyB8fCBmdW5jdGlvbigpIHt9O1xuXG4gIHZhciBzZWN0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VjdGlvbicpO1xuICBzZWN0aW9uLmNsYXNzTmFtZSA9ICdzZWN0aW9uJztcblxuICB2YXIgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGl0bGUuaW5uZXJIVE1MID0gaXRlbS50aXRsZTtcbiAgdGl0bGUuY2xhc3NOYW1lID0gJ3RpdGxlJztcbiAgc2VjdGlvbi5hcHBlbmRDaGlsZCh0aXRsZSk7XG5cbiAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgaW5wdXQudHlwZSA9ICd0ZXh0JztcbiAgaW5wdXQudmFsdWUgPSBpdGVtLnZhbHVlO1xuICBpbnB1dC5jbGFzc05hbWUgPSAndGV4dC1maWVsZCc7XG5cbiAgc2VjdGlvbi5hcHBlbmRDaGlsZChpbnB1dCk7XG5cbiAgdmFyIGlucHV0TGlzdGVuZXIgPSBmdW5jdGlvbigpIHtcbiAgICBvbkNoYW5nZShpbnB1dC52YWx1ZSk7XG4gIH07XG5cbiAgdmFyIGtleWRvd25MaXN0ZW5lciA9IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgaW5wdXQuYmx1cigpO1xuICAgIH1cbiAgfTtcblxuICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGlucHV0TGlzdGVuZXIpO1xuICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywga2V5ZG93bkxpc3RlbmVyKTtcblxuICBmdW5jdGlvbiBzZXRWYWx1ZSh2YWx1ZSkge1xuICAgIGlucHV0LnZhbHVlID0gdmFsdWU7XG4gIH07XG5cbiAgZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICBpbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyKCdpbnB1dCcsIGlucHV0TGlzdGVuZXIpO1xuICAgIGlucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBrZXlkb3duTGlzdGVuZXIpO1xuICB9O1xuXG4gIGlucHV0Lm9uYmx1ciA9IGZ1bmN0aW9uKCkge1xuICAgIG9uRmluaXNoRWRpdGluZyhpbnB1dC52YWx1ZSwgaW5wdXQpO1xuICB9O1xuXG4gIHJldHVybiB7XG4gICAgZWxlbWVudDogc2VjdGlvbixcbiAgICBzZXRWYWx1ZTogc2V0VmFsdWUsXG4gICAgc2V0IG9uQ2hhbmdlKHZhbHVlKSB7XG4gICAgICBvbkNoYW5nZSA9IHZhbHVlO1xuICAgIH0sXG4gICAgZGlzcG9zZTogZGlzcG9zZVxuICB9XG59O1xuXG52YXIgY2hlY2tMaXN0Q29udHJvbGxlciA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgdmFyIG9uQ2hhbmdlID0gaXRlbS5vbkNoYW5nZSB8fCBmdW5jdGlvbigpIHt9O1xuXG4gIHZhciBzZWN0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VjdGlvbicpO1xuICBzZWN0aW9uLmNsYXNzTmFtZSA9ICdzZWN0aW9uJztcblxuICB2YXIgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGl0bGUuaW5uZXJIVE1MID0gaXRlbS50aXRsZTtcbiAgdGl0bGUuY2xhc3NOYW1lID0gJ3RpdGxlJztcbiAgc2VjdGlvbi5hcHBlbmRDaGlsZCh0aXRsZSk7XG5cbiAgdmFyIG9wdGlvbnMgPSBpdGVtLm9wdGlvbnM7XG5cbiAgdmFyIGJ1dHRvbnMgPSBbXTtcblxuICB2YXIgb25DbGljayA9IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGJ1dHRvbiA9IGJ1dHRvbnNbaW5kZXhdO1xuXG4gICAgICBidXR0b24uY2xhc3NMaXN0LnRvZ2dsZSgnc2VsZWN0ZWQnKTtcblxuICAgICAgb25DaGFuZ2UoZ2V0U2VsZWN0ZWRPcHRpb25zKCkpO1xuICAgIH07XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0U2VsZWN0ZWRPcHRpb25zKCkge1xuICAgIHZhciBzZWxlY3Rpb24gPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1dHRvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChidXR0b25zW2ldLmNsYXNzTGlzdC5jb250YWlucygnc2VsZWN0ZWQnKSkge1xuICAgICAgICBzZWxlY3Rpb24ucHVzaChvcHRpb25zW2ldKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2VsZWN0aW9uO1xuICB9O1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBvcHRpb24gPSBvcHRpb25zW2ldO1xuICAgIHZhciBidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICBidXR0b24uY2xhc3NOYW1lID0gJ3NlZ21lbnRlZC1idXR0b24nO1xuICAgIGJ1dHRvbi5pbm5lckhUTUwgPSBvcHRpb247XG4gICAgc2VjdGlvbi5hcHBlbmRDaGlsZChidXR0b24pO1xuXG4gICAgaWYgKGkgPT09IG9wdGlvbnMubGVuZ3RoIC0gMSkge1xuICAgICAgYnV0dG9uLnN0eWxlWydib3JkZXItcmlnaHQtc3R5bGUnXSA9ICcycHggc29saWQgIzAwMCc7XG4gICAgfVxuXG4gICAgYnV0dG9uLm9uY2xpY2sgPSBvbkNsaWNrKGkpO1xuXG4gICAgYnV0dG9ucy5wdXNoKGJ1dHRvbik7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGVsZW1lbnQ6IHNlY3Rpb25cbiAgfVxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgcHJvbXB0OiBmdW5jdGlvbih0ZXh0LCBidXR0b25zLCBjYWxsYmFjaykge1xuICAgIHZhciBiYWNrZ3JvdW5kID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgYmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAncmdiYSgwLDAsMCwwLjgpJ1xuICAgIGJhY2tncm91bmQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIGJhY2tncm91bmQuc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gICAgYmFja2dyb3VuZC5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChiYWNrZ3JvdW5kKTtcblxuICAgIHZhciBjb250YWluZXJXaWR0aCA9IDIwMDtcbiAgICB2YXIgY29udGFpbmVySGVpZ2h0ID0gMjAwO1xuICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb250YWluZXIuY2xhc3NOYW1lID0gJ3Byb21wdCc7XG4gICAgY29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBjb250YWluZXIuc3R5bGUud2lkdGggPSBjb250YWluZXJXaWR0aCArICdweCc7XG4gICAgY29udGFpbmVyLnN0eWxlLmhlaWdodCA9IGNvbnRhaW5lckhlaWdodCArICdweCc7XG5cbiAgICBiYWNrZ3JvdW5kLmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XG5cbiAgICB1cGRhdGVMYXlvdXQoKTtcblxuICAgIGZ1bmN0aW9uIG9uV2luZG93UmVzaXplKCkge1xuICAgICAgdXBkYXRlTGF5b3V0KCk7XG4gICAgfTtcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBvbldpbmRvd1Jlc2l6ZSk7XG5cbiAgICB2YXIgcXVlc3Rpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMicpO1xuICAgIHF1ZXN0aW9uLmlubmVySFRNTCA9IHRleHQ7XG4gICAgcXVlc3Rpb24uc3R5bGUuZm9udEZhbWlseSA9ICcnXG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHF1ZXN0aW9uKTtcblxuICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgaW5wdXQudHlwZSA9ICd0ZXh0JztcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuXG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2JyJykpO1xuXG4gICAgZnVuY3Rpb24gb25DbGljayhpbmRleCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmFsaWQgPSBjYWxsYmFjayhpbnB1dC52YWx1ZSwgaW5kZXgpO1xuICAgICAgICBpZiAodmFsaWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHZhbGlkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWxpZCkge1xuICAgICAgICAgIGRpc21pc3MoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1dHRvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBidXR0b25UZXh0ID0gYnV0dG9uc1tpXTtcbiAgICAgIHZhciBidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAgIGJ1dHRvbi5pbm5lckhUTUwgPSBidXR0b25UZXh0O1xuICAgICAgYnV0dG9uLm9uY2xpY2sgPSBvbkNsaWNrKGkpO1xuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGJ1dHRvbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdXBkYXRlTGF5b3V0KCkge1xuICAgICAgY29udGFpbmVyLnN0eWxlLmxlZnQgPSAod2luZG93LmlubmVyV2lkdGggLSBjb250YWluZXJXaWR0aCkgLyAyICsgJ3B4JztcbiAgICAgIGNvbnRhaW5lci5zdHlsZS50b3AgPSAod2luZG93LmlubmVySGVpZ2h0IC0gY29udGFpbmVySGVpZ2h0KSAvIDIgKyAncHgnO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBkaXNtaXNzKCkge1xuICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChiYWNrZ3JvdW5kKTtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCBvbldpbmRvd1Jlc2l6ZSk7XG4gICAgfVxuXG4gICAgaW5wdXQuZm9jdXMoKTtcblxuICAgIHZhciBwcm9tcHQgPSB7XG4gICAgICBkaXNtaXNzOiBkaXNtaXNzXG4gICAgfTtcblxuICAgIHJldHVybiBwcm9tcHQ7XG4gIH1cbn0iLCJ2YXIgY3ByID0gcmVxdWlyZSgnLi9jcHInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlZGl0b3IpIHtcbiAgdmFyIGJhciA9IGNwcih7XG4gICAgb25QaWNrOiBmdW5jdGlvbihvYmosIGluZGV4KSB7XG4gICAgICBlZGl0b3IucHJlZmFiSW5kZXggPSBpbmRleDtcbiAgICAgIGVkaXRvci5sb2FkKGVkaXRvci5wcmVmYWJzW2luZGV4XSk7XG4gICAgfSxcbiAgICBibG9ja1dpZHRoOiA0OCxcbiAgICBibG9ja0hlaWdodDogNDgsXG4gICAgY3VzdG9tUGxhY2VtZW50OiB0cnVlXG4gIH0pO1xuXG4gIHZhciBndWkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ3VpJyk7XG4gIGd1aS5hcHBlbmRDaGlsZChiYXIuZG9tRWxlbWVudCk7XG5cbiAgYmFyLmRvbUVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICBiYXIuZG9tRWxlbWVudC5zdHlsZS5sZWZ0ID0gJzIwcHgnO1xuICBiYXIuZG9tRWxlbWVudC5zdHlsZS5ib3R0b20gPSAnMTIwcHgnO1xuXG4gIHJldHVybiBiYXI7XG59OyIsInZhciBjcHIgPSByZXF1aXJlKCcuL2NwcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVkaXRvcikge1xuICB2YXIgaW5wdXQgPSBlZGl0b3IuaW5wdXQ7XG4gIHZhciBkYXRhID0gW3tcbiAgICBidXR0b246ICdwbHVzJyxcbiAgICBzcmM6ICcvaW1hZ2VzL2ljb25zL3BsdXNfbGlnaHQucG5nJyxcbiAgICBzcmNBY3RpdmU6ICcvaW1hZ2VzL2ljb25zL3BsdXNfZGFyay5wbmcnLFxuICAgIHRvb2x0aXA6ICdDcmVhdGUgbmV3J1xuICB9LCB7XG4gICAgYnV0dG9uOiAnbWludXMnLFxuICAgIHNyYzogJy9pbWFnZXMvaWNvbnMvbWludXNfbGlnaHQucG5nJyxcbiAgICBzcmNBY3RpdmU6ICcvaW1hZ2VzL2ljb25zL21pbnVzX2RhcmsucG5nJyxcbiAgICB0b29sdGlwOiAnUmVtb3ZlIHNlbGVjdGVkJ1xuICB9LCB7XG4gICAgYnV0dG9uOiAnY2xvbmUnLFxuICAgIHNyYzogJy9pbWFnZXMvaWNvbnMvY2xvbmVfbGlnaHQucG5nJyxcbiAgICBzcmNBY3RpdmU6ICcvaW1hZ2VzL2ljb25zL2Nsb25lX2RhcmsucG5nJyxcbiAgICB0b29sdGlwOiAnQ2xvbmUgc2VsZWN0ZWQnXG4gIH1dO1xuXG4gIHZhciBiYXIgPSBjcHIoe1xuICAgIGRhdGE6IGRhdGEsXG4gICAgYmxvY2tXaWR0aDogMzIsXG4gICAgYmxvY2tIZWlnaHQ6IDMyLFxuICAgIGRpc2FibGVIaWdobGlnaHQ6IHRydWUsXG4gICAgb25QaWNrOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHZhciBidXR0b24gPSBvYmouYnV0dG9uO1xuXG4gICAgICBpZiAoYnV0dG9uID09PSAncGx1cycpIHtcbiAgICAgICAgZWRpdG9yLmNyZWF0ZU5ldygpO1xuICAgICAgfSBlbHNlIGlmIChidXR0b24gPT09ICdtaW51cycpIHtcbiAgICAgICAgZWRpdG9yLnJlbW92ZVNlbGVjdGVkKCk7XG4gICAgICB9IGVsc2UgaWYgKGJ1dHRvbiA9PT0gJ2Nsb25lJykge1xuICAgICAgICBlZGl0b3IuY3JlYXRlQ2xvbmUoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGN1c3RvbVBsYWNlbWVudDogdHJ1ZSxcbiAgICBpc0J1dHRvbjogdHJ1ZVxuICB9KTtcblxuICB2YXIgZ3VpID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2d1aScpO1xuICBndWkuYXBwZW5kQ2hpbGQoYmFyLmRvbUVsZW1lbnQpO1xuXG4gIGJhci5kb21FbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgYmFyLmRvbUVsZW1lbnQuc3R5bGUubGVmdCA9ICcyMHB4JztcbiAgYmFyLmRvbUVsZW1lbnQuc3R5bGUuYm90dG9tID0gJzE4MHB4Jztcbn07IiwidmFyIHBhbmVsID0gcmVxdWlyZSgnLi9wYW5lbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVkaXRvcikge1xuICB2YXIgZGF0YSA9IFt7XG4gICAgdGl0bGU6ICduYW1lJyxcbiAgICB2YWx1ZTogJycsXG4gICAgb25DaGFuZ2U6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBlZGl0b3IuZ2V0U2VsZWN0ZWRQcmVmYWIoKS51c2VyRGF0YS5uYW1lID0gdmFsdWU7XG4gICAgfVxuICB9LCB7XG4gICAgdGl0bGU6ICdzaXplJyxcbiAgICB2YWx1ZTogJycsXG4gICAgb25GaW5pc2hFZGl0aW5nOiBmdW5jdGlvbih2YWx1ZSwgaW5wdXQpIHtcbiAgICAgIHZhciByZWcgPSAvXihcXGR7MSwyfSkgKFxcZHsxLDJ9KSAoXFxkezEsMn0pJC9nXG4gICAgICB2YXIgbWF0Y2hlcyA9IHJlZy5leGVjKHZhbHVlKTtcblxuICAgICAgaWYgKG1hdGNoZXMgPT0gbnVsbCkge1xuICAgICAgICBlZGl0b3IudXBkYXRlUHJvcGVydHlQYW5lbCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGVkaXRvci51cGRhdGVTaXplKFtwYXJzZUludChtYXRjaGVzWzFdKSwgcGFyc2VJbnQobWF0Y2hlc1syXSksIHBhcnNlSW50KG1hdGNoZXNbM10pXSk7XG4gICAgfVxuICB9LCB7XG4gICAgdGl0bGU6ICdtaXJyb3InLFxuICAgIHR5cGU6ICdjaGVja0xpc3QnLFxuICAgIG9wdGlvbnM6IFsneCcsICd5JywgJ3onXSxcbiAgICBvbkNoYW5nZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgZWRpdG9yLnJlZmxlY3RYID0gZWRpdG9yLnJlZmxlY3RZID0gZWRpdG9yLnJlZmxlY3RaID0gZmFsc2U7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKG9wdGlvbnNbaV0gPT09ICd4Jykge1xuICAgICAgICAgIGVkaXRvci5yZWZsZWN0WCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9uc1tpXSA9PT0gJ3knKSB7XG4gICAgICAgICAgZWRpdG9yLnJlZmxlY3RZID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zW2ldID09PSAneicpIHtcbiAgICAgICAgICBlZGl0b3IucmVmbGVjdFogPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XTtcblxuICB2YXIgcHJvcGVydHlQYW5lbCA9IHBhbmVsKGRhdGEsIHtcbiAgICBjdXN0b21QbGFjZW1lbnQ6IHRydWVcbiAgfSk7XG5cbiAgcHJvcGVydHlQYW5lbC5kb21FbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgcHJvcGVydHlQYW5lbC5kb21FbGVtZW50LnN0eWxlLnJpZ2h0ID0gNDAgKyAncHgnO1xuICBwcm9wZXJ0eVBhbmVsLmRvbUVsZW1lbnQuc3R5bGUudG9wID0gMjAgKyAncHgnO1xuICBwcm9wZXJ0eVBhbmVsLmRvbUVsZW1lbnQuc3R5bGUud2lkdGggPSAyMDAgKyAncHgnO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ3VpJykuYXBwZW5kQ2hpbGQocHJvcGVydHlQYW5lbC5kb21FbGVtZW50KTtcblxuICByZXR1cm4gcHJvcGVydHlQYW5lbDtcbn07IiwidmFyIGNwciA9IHJlcXVpcmUoJy4vY3ByJyk7XG52YXIgRWRpdG9yVG9vbHMgPSByZXF1aXJlKCcuLi9lZGl0b3J0b29scycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVkaXRvcikge1xuICB2YXIgYmFyID0gY3ByKHtcbiAgICBkYXRhOiBbe1xuICAgICAgc3JjOiAnL2ltYWdlcy9pY29ucy9wbHVzX2xpZ2h0LnBuZycsXG4gICAgICBzcmNBY3RpdmU6ICcvaW1hZ2VzL2ljb25zL3BsdXNfZGFyay5wbmcnLFxuICAgICAgdG9vbG5hbWU6IEVkaXRvclRvb2xzLlBlbixcbiAgICAgIHRvb2x0aXA6ICdwZW4gdG9vbCAoMSknXG4gICAgfSwge1xuICAgICAgc3JjOiAnL2ltYWdlcy9pY29ucy9zYW1wbGVyX2xpZ2h0LnBuZycsXG4gICAgICBzcmNBY3RpdmU6ICcvaW1hZ2VzL2ljb25zL3NhbXBsZXJfZGFyay5wbmcnLFxuICAgICAgdG9vbG5hbWU6IEVkaXRvclRvb2xzLlNhbXBsZSxcbiAgICAgIHRvb2x0aXA6ICdzYW1wbGUgdG9vbCAoMiknXG4gICAgfSwge1xuICAgICAgc3JjOiAnL2ltYWdlcy9pY29ucy9sYXNzb19saWdodC5wbmcnLFxuICAgICAgc3JjQWN0aXZlOiAnL2ltYWdlcy9pY29ucy9sYXNzb19kYXJrLnBuZycsXG4gICAgICB0b29sbmFtZTogRWRpdG9yVG9vbHMuU2VsZWN0LFxuICAgICAgdG9vbHRpcDogJ2xhc3NvIHRvb2wgKDMpJ1xuICAgIH0sIHtcbiAgICAgIHNyYzogJy9pbWFnZXMvaWNvbnMvY2FtZXJhX2xpZ2h0LnBuZycsXG4gICAgICBzcmNBY3RpdmU6ICcvaW1hZ2VzL2ljb25zL2NhbWVyYV9kYXJrLnBuZycsXG4gICAgICB0b29sbmFtZTogRWRpdG9yVG9vbHMuQ2FtZXJhLFxuICAgICAgdG9vbHRpcDogJ2NhbWVyYSB0b29sICg0IG9yIGRyYWcgZW1wdHkgc3BhY2UpJ1xuICAgIH0sIHtcbiAgICAgIHNyYzogJy9pbWFnZXMvaWNvbnMvZmlsbF9saWdodC5wbmcnLFxuICAgICAgc3JjQWN0aXZlOiAnL2ltYWdlcy9pY29ucy9maWxsX2RhcmsucG5nJyxcbiAgICAgIHRvb2xuYW1lOiBFZGl0b3JUb29scy5GaWxsLFxuICAgICAgdG9vbHRpcDogJ2Jsb2NrIHRvb2wgKDUpIChkcmFnIGFuZCBkcm9wIGJldHdlZW4gdHdvIHBvaW50cyknXG4gICAgfV0sXG4gICAgYmxvY2tXaWR0aDogMzIsXG4gICAgYmxvY2tIZWlnaHQ6IDMyLFxuICAgIG9uUGljazogZnVuY3Rpb24ob2JqKSB7XG4gICAgICBlZGl0b3IudG9vbE5hbWUgPSBvYmoudG9vbG5hbWU7XG4gICAgICBlZGl0b3IudXBkYXRlVG9vbCgpO1xuICAgIH0sXG4gICAgY3VzdG9tUGxhY2VtZW50OiB0cnVlLFxuICAgIHNob3dUb29sdGlwOiB0cnVlLFxuICAgIGhpZGVIaWdobGlnaHQ6IHRydWUsXG4gICAgaXNCdXR0b246IHRydWUsXG4gICAgc3RpY2t5U2VsZWN0aW9uOiB0cnVlXG4gIH0pO1xuXG4gIHZhciBndWkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ3VpJyk7XG4gIGd1aS5hcHBlbmRDaGlsZChiYXIuZG9tRWxlbWVudCk7XG5cbiAgYmFyLmRvbUVsZW1lbnQuY2xhc3NMaXN0LmFkZCgndG9vbGJhcicpO1xuXG4gIGJhci5kb21FbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgYmFyLmRvbUVsZW1lbnQuc3R5bGUudG9wID0gMjAgKyAncHgnO1xuICBiYXIuZG9tRWxlbWVudC5zdHlsZS5sZWZ0ID0gMjAgKyAncHgnO1xuXG4gIHJldHVybiBiYXI7XG59OyIsInZhciBDYW1lcmFUb29sID0gZnVuY3Rpb24oKSB7XG5cbn07XG5cbkNhbWVyYVRvb2wucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcblx0XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhbWVyYVRvb2w7IiwidmFyIFNldENvbW1hbmQgPSByZXF1aXJlKCcuLi9jb21tYW5kcy9zZXRjb21tYW5kJyk7XG5cbnZhciBGaWxsVG9vbCA9IGZ1bmN0aW9uKGVkaXRvcikge1xuICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcbiAgdGhpcy5pbnB1dCA9IHRoaXMuZWRpdG9yLmlucHV0O1xuICB0aGlzLmJsb2Nrc0NvcHkgPSBudWxsO1xuICB0aGlzLnN0YXJ0Q29vcmQgPSBudWxsO1xuICB0aGlzLmVuZENvb3JkID0gbnVsbDtcbn07XG5cbkZpbGxUb29sLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmVkaXRvci51cGRhdGVMYXN0QmxvY2tzKCk7XG59O1xuXG5GaWxsVG9vbC5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY29vcmRBYm92ZSA9IHRoaXMuZWRpdG9yLmdldENvb3JkQWJvdmUoKTtcbiAgdmFyIGNvb3JkQmVsb3cgPSB0aGlzLmVkaXRvci5nZXRDb29yZEJlbG93KCk7XG4gIHZhciBzaG91bGRVcGRhdGUgPSBmYWxzZTtcblxuICB2YXIgaXNSZW1vdmUgPSB0aGlzLmlucHV0Lm1vdXNlSG9sZCgyKSB8fCB0aGlzLmlucHV0Lm1vdXNlVXAoMik7XG5cbiAgdGhpcy5lZGl0b3IuaGlnaGxpZ2h0Q29vcmQgPSB0aGlzLmVkaXRvci5zZWxlY3RlZENvbG9yID09IG51bGwgPyBjb29yZEJlbG93IDogY29vcmRBYm92ZTtcblxuICB2YXIgY29vcmQgPSAoaXNSZW1vdmUgfHwgdGhpcy5lZGl0b3Iuc2VsZWN0ZWRDb2xvciA9PSBudWxsKSA/IGNvb3JkQmVsb3cgOiBjb29yZEFib3ZlO1xuXG4gIGlmICh0aGlzLmlucHV0Lm1vdXNlRG93bigpICYmIGNvb3JkICE9IG51bGwpIHtcbiAgICB0aGlzLmJsb2Nrc0NvcHkgPSB0aGlzLmVkaXRvci5ibG9ja3Muc2VyaWFsaXplKCk7XG4gICAgaWYgKHRoaXMuc3RhcnRDb29yZCA9PSBudWxsKSB7XG4gICAgICB0aGlzLnN0YXJ0Q29vcmQgPSBjb29yZDtcbiAgICAgIHRoaXMuZW5kQ29vcmQgPSBjb29yZDtcbiAgICAgIHNob3VsZFVwZGF0ZSA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKHRoaXMuc3RhcnRDb29yZCAhPSBudWxsICYmIGNvb3JkICE9IG51bGwpIHtcbiAgICBpZiAodGhpcy5lbmRDb29yZCA9PSBudWxsIHx8ICF0aGlzLmVuZENvb3JkLmVxdWFscyhjb29yZCkpIHtcbiAgICAgIHRoaXMuZW5kQ29vcmQgPSBjb29yZDtcbiAgICAgIHNob3VsZFVwZGF0ZSA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgdmFyIGluZGV4ID0gaXNSZW1vdmUgPyAwIDpcbiAgICB0aGlzLmVkaXRvci5ibG9ja3MuZ2V0T3JBZGRDb2xvckluZGV4KHRoaXMuZWRpdG9yLnNlbGVjdGVkQ29sb3IpO1xuXG4gIGlmICh0aGlzLnN0YXJ0Q29vcmQgIT0gbnVsbCAmJiB0aGlzLmVuZENvb3JkICE9IG51bGwgJiYgc2hvdWxkVXBkYXRlKSB7XG4gICAgdGhpcy5lZGl0b3IuYmxvY2tzLmRlc2VyaWFsaXplKHRoaXMuYmxvY2tzQ29weSk7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5sb29wQ29vcmRzKHRoaXMuc3RhcnRDb29yZCwgdGhpcy5lbmRDb29yZCwgZnVuY3Rpb24oaSwgaiwgaykge1xuICAgICAgc2VsZi5lZGl0b3IuYmxvY2tzLnNldChpLCBqLCBrLCBpbmRleCk7XG4gICAgfSk7XG4gIH1cblxuICBpZiAodGhpcy5pbnB1dC5tb3VzZVVwKCkgJiYgdGhpcy5ibG9ja3NDb3B5ICE9IG51bGwpIHtcbiAgICB0aGlzLmVkaXRvci5ibG9ja3MuZGVzZXJpYWxpemUodGhpcy5ibG9ja3NDb3B5KTtcblxuICAgIHZhciBjb29yZHMgPSBbXTtcblxuICAgIHRoaXMubG9vcENvb3Jkcyh0aGlzLnN0YXJ0Q29vcmQsIHRoaXMuZW5kQ29vcmQsIGZ1bmN0aW9uKGksIGosIGspIHtcbiAgICAgIGNvb3Jkcy5wdXNoKG5ldyBUSFJFRS5WZWN0b3IzKGksIGosIGspKTtcbiAgICB9KTtcblxuICAgIHZhciBjb21tYW5kID0gbmV3IFNldENvbW1hbmQodGhpcy5lZGl0b3IuYmxvY2tzLCBjb29yZHMsIGluZGV4KTtcbiAgICB0aGlzLmVkaXRvci5ydW5Db21tYW5kKGNvbW1hbmQpO1xuICAgIHRoaXMuZWRpdG9yLnVwZGF0ZUxhc3RCbG9ja3MoKTtcblxuICAgIHRoaXMuc3RhcnRDb29yZCA9IG51bGw7XG4gICAgdGhpcy5lbmRDb29yZCA9IG51bGw7XG4gICAgdGhpcy5ibG9ja3NDb3B5ID0gbnVsbDtcbiAgfVxufTtcblxuRmlsbFRvb2wucHJvdG90eXBlLmxvb3BDb29yZHMgPSBmdW5jdGlvbihzdGFydENvb3JkLCBlbmRDb29yZCwgY2FsbGJhY2spIHtcbiAgdmFyIG1pbiA9IG5ldyBUSFJFRS5WZWN0b3IzKFxuICAgIE1hdGgubWluKHN0YXJ0Q29vcmQueCwgZW5kQ29vcmQueCksXG4gICAgTWF0aC5taW4oc3RhcnRDb29yZC55LCBlbmRDb29yZC55KSxcbiAgICBNYXRoLm1pbihzdGFydENvb3JkLnosIGVuZENvb3JkLnopXG4gICk7XG5cbiAgdmFyIG1heCA9IG5ldyBUSFJFRS5WZWN0b3IzKFxuICAgIE1hdGgubWF4KHN0YXJ0Q29vcmQueCwgZW5kQ29vcmQueCksXG4gICAgTWF0aC5tYXgoc3RhcnRDb29yZC55LCBlbmRDb29yZC55KSxcbiAgICBNYXRoLm1heChzdGFydENvb3JkLnosIGVuZENvb3JkLnopXG4gICk7XG5cbiAgZm9yICh2YXIgaSA9IG1pbi54OyBpIDw9IG1heC54OyBpKyspIHtcbiAgICBmb3IgKHZhciBqID0gbWluLnk7IGogPD0gbWF4Lnk7IGorKykge1xuICAgICAgZm9yICh2YXIgayA9IG1pbi56OyBrIDw9IG1heC56OyBrKyspIHtcbiAgICAgICAgY2FsbGJhY2soaSwgaiwgayk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGxUb29sOyIsInZhciBTZXRDb21tYW5kID0gcmVxdWlyZSgnLi4vY29tbWFuZHMvc2V0Y29tbWFuZCcpO1xuXG52YXIgUGVuVG9vbCA9IGZ1bmN0aW9uKGVkaXRvcikge1xuXG4gIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xuXG4gIHRoaXMuY2FtZXJhID0gdGhpcy5lZGl0b3IuY2FtZXJhO1xuXG4gIHRoaXMuaW5wdXQgPSB0aGlzLmVkaXRvci5pbnB1dDtcblxuICB0aGlzLmJsb2NrcyA9IHRoaXMuZWRpdG9yLmJsb2NrcztcblxuICB0aGlzLm9iamVjdCA9IHRoaXMuZWRpdG9yLm9iamVjdDtcblxuICB0aGlzLmxhc3RNb3VzZSA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG5cbiAgdGhpcy5tb3VzZVNhbXBsZUludGVydmFsID0gNDtcbn07XG5cblBlblRvb2wucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuZWRpdG9yLmVkaXRMb2NrKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIFxuICB2YXIgaXNDbGVhckNvbG9yID0gdGhpcy5lZGl0b3Iuc2VsZWN0ZWRDb2xvciA9PSBudWxsO1xuXG4gIHRoaXMuZWRpdG9yLmhpZ2hsaWdodENvb3JkID0gaXNDbGVhckNvbG9yID9cbiAgICB0aGlzLmVkaXRvci5nZXRDb29yZEJlbG93KCkgOlxuICAgIHRoaXMuZWRpdG9yLmdldENvb3JkQWJvdmUoKTtcblxuICBpZiAodGhpcy5pbnB1dC5tb3VzZURvd24oKSB8fCB0aGlzLmlucHV0Lm1vdXNlVXAoKSkge1xuICAgIHRoaXMuZWRpdG9yLnVwZGF0ZUxhc3RCbG9ja3MoKTtcbiAgfVxuXG4gIGlmICh0aGlzLmlucHV0Lm1vdXNlRG93bigwKSkge1xuICAgIHRoaXMub25DbGljayhpc0NsZWFyQ29sb3IpO1xuICB9IGVsc2UgaWYgKHRoaXMuaW5wdXQubW91c2VEb3duKDIpKSB7XG4gICAgdGhpcy5vbkNsaWNrKHRydWUpO1xuICB9XG5cbiAgaWYgKHRoaXMuaW5wdXQubW91c2VIb2xkKDApICYmIHRoaXMuaW5wdXQubW91c2VNb3ZlKCkpIHtcbiAgICB0aGlzLm9uRHJhZyhpc0NsZWFyQ29sb3IpO1xuICB9IGVsc2UgaWYgKHRoaXMuaW5wdXQubW91c2VIb2xkKDIpICYmIHRoaXMuaW5wdXQubW91c2VNb3ZlKCkpIHtcbiAgICB0aGlzLm9uRHJhZyh0cnVlKTtcbiAgfVxuXG4gIHRoaXMubGFzdE1vdXNlID0gdGhpcy5pbnB1dC5tb3VzZS5jbG9uZSgpO1xufTtcblxuUGVuVG9vbC5wcm90b3R5cGUub25DbGljayA9IGZ1bmN0aW9uKGlzQ2xlYXIpIHtcbiAgdmFyIGNvbG9yID0gaXNDbGVhciA/IG51bGwgOiB0aGlzLmVkaXRvci5zZWxlY3RlZENvbG9yO1xuICB2YXIgc2VsZWN0ZWRJbmRleCA9IHRoaXMuYmxvY2tzLmdldE9yQWRkQ29sb3JJbmRleChjb2xvcik7XG5cbiAgdmFyIGNvb3JkID0gaXNDbGVhciA/XG4gICAgdGhpcy5lZGl0b3IuZ2V0Q29vcmRCZWxvdygpIDpcbiAgICB0aGlzLmVkaXRvci5nZXRDb29yZEFib3ZlKCk7XG5cbiAgaWYgKCEhY29vcmQpIHtcbiAgICBpZiAodGhpcy5ibG9ja3MuZ2V0QXRDb29yZChjb29yZCkgIT09IHNlbGVjdGVkSW5kZXgpIHtcbiAgICAgIHRoaXMuZWRpdG9yLnJ1bkNvbW1hbmQobmV3IFNldENvbW1hbmQodGhpcy5ibG9ja3MsIHRoaXMucmVmbGVjdENvb3JkcyhbY29vcmRdKSwgc2VsZWN0ZWRJbmRleCkpO1xuICAgICAgdGhpcy5lZGl0b3IudXBkYXRlTGFzdEJsb2NrcygpO1xuICAgIH1cbiAgfVxufTtcblxuUGVuVG9vbC5wcm90b3R5cGUub25EcmFnID0gZnVuY3Rpb24oaXNDbGVhcikge1xuICB2YXIgY29sb3IgPSBpc0NsZWFyID8gbnVsbCA6IHRoaXMuZWRpdG9yLnNlbGVjdGVkQ29sb3I7XG4gIHZhciBzZWxlY3RlZEluZGV4ID0gdGhpcy5ibG9ja3MuZ2V0T3JBZGRDb2xvckluZGV4KGNvbG9yKTtcblxuICB2YXIgcG9pbnRzID0gdGhpcy5nZXRNb3VzZVBvaW50cyh0aGlzLmxhc3RNb3VzZSwgdGhpcy5pbnB1dC5tb3VzZSwgdGhpcy5tb3VzZVNhbXBsZUludGVydmFsKTtcbiAgdmFyIGNvb3JkcyA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBjb29yZCA9IGlzQ2xlYXIgP1xuICAgICAgdGhpcy5lZGl0b3IuZ2V0Q29vcmRCZWxvdyhwb2ludHNbaV0pIDpcbiAgICAgIHRoaXMuZWRpdG9yLmdldENvb3JkQWJvdmUocG9pbnRzW2ldKTtcblxuICAgIGlmICghIWNvb3JkKSB7XG4gICAgICBpZiAodGhpcy5ibG9ja3MuZ2V0QXRDb29yZChjb29yZCkgIT09IHNlbGVjdGVkSW5kZXgpIHtcbiAgICAgICAgY29vcmRzLnB1c2goY29vcmQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvb3JkcyA9IHVuaXF1ZUNvb3Jkcyhjb29yZHMpO1xuICBpZiAoY29vcmRzLmxlbmd0aCA+IDApIHtcbiAgICB0aGlzLmVkaXRvci5ydW5Db21tYW5kKG5ldyBTZXRDb21tYW5kKHRoaXMuYmxvY2tzLCB0aGlzLnJlZmxlY3RDb29yZHMoY29vcmRzKSwgc2VsZWN0ZWRJbmRleCkpO1xuICB9XG59O1xuXG4vLyBSZWZsZWN0IGNvb3JkcyB3aXRoIGVkaXRvciBzZXR0aW5nc1xuUGVuVG9vbC5wcm90b3R5cGUucmVmbGVjdENvb3JkcyA9IGZ1bmN0aW9uKGNvb3Jkcykge1xuICBpZiAoIXRoaXMuZWRpdG9yLnJlZmxlY3RYICYmICF0aGlzLmVkaXRvci5yZWZsZWN0WSAmJiAhdGhpcy5lZGl0b3IucmVmbGVjdFopIHtcbiAgICByZXR1cm4gY29vcmRzO1xuICB9XG5cbiAgdmFyIGRpbSA9IHRoaXMuYmxvY2tzLmRpbTtcbiAgdmFyIHBpdm90ID0gW1xuICAgIE1hdGgucm91bmQoKGRpbVswXSAtIDEpIC8gMiksXG4gICAgTWF0aC5yb3VuZCgoZGltWzFdIC0gMSkgLyAyKSxcbiAgICBNYXRoLnJvdW5kKChkaW1bMl0gLSAxKSAvIDIpXG4gIF07XG5cbiAgaWYgKHRoaXMuZWRpdG9yLnJlZmxlY3RYKSB7XG4gICAgdmFyIHJlZmxlY3RlZCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29vcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgciA9IGNvb3Jkc1tpXS5jbG9uZSgpO1xuICAgICAgci54ID0gcGl2b3RbMF0gKyBwaXZvdFswXSAtIHIueDtcbiAgICAgIHJlZmxlY3RlZC5wdXNoKHIpO1xuICAgIH1cbiAgICBjb29yZHMgPSBjb29yZHMuY29uY2F0KHJlZmxlY3RlZCk7XG4gIH1cblxuICBpZiAodGhpcy5lZGl0b3IucmVmbGVjdFkpIHtcbiAgICB2YXIgcmVmbGVjdGVkID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciByID0gY29vcmRzW2ldLmNsb25lKCk7XG4gICAgICByLnkgPSBwaXZvdFsxXSArIHBpdm90WzFdIC0gci55O1xuICAgICAgcmVmbGVjdGVkLnB1c2gocik7XG4gICAgfVxuICAgIGNvb3JkcyA9IGNvb3Jkcy5jb25jYXQocmVmbGVjdGVkKTtcbiAgfVxuXG4gIGlmICh0aGlzLmVkaXRvci5yZWZsZWN0Wikge1xuICAgIHZhciByZWZsZWN0ZWQgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHIgPSBjb29yZHNbaV0uY2xvbmUoKTtcbiAgICAgIHIueiA9IHBpdm90WzJdICsgcGl2b3RbMl0gLSByLno7XG4gICAgICByZWZsZWN0ZWQucHVzaChyKTtcbiAgICB9XG4gICAgY29vcmRzID0gY29vcmRzLmNvbmNhdChyZWZsZWN0ZWQpO1xuICB9XG5cbiAgcmV0dXJuIGNvb3Jkcztcbn07XG5cblBlblRvb2wucHJvdG90eXBlLmdldE1vdXNlUG9pbnRzID0gZnVuY3Rpb24oZnJvbSwgdG8sIG1heERpcykge1xuICB2YXIgZGlzdGFuY2UgPSBuZXcgVEhSRUUuVmVjdG9yMigpLnN1YlZlY3RvcnModG8sIGZyb20pLmxlbmd0aCgpO1xuXG4gIHZhciBpbnRlcnZhbCA9IE1hdGguY2VpbChkaXN0YW5jZSAvIG1heERpcyk7XG4gIHZhciBzdGVwID0gbmV3IFRIUkVFLlZlY3RvcjIoKS5zdWJWZWN0b3JzKHRvLCBmcm9tKS5zZXRMZW5ndGgoZGlzdGFuY2UgLyBpbnRlcnZhbCk7XG5cbiAgdmFyIGxpc3QgPSBbXTtcbiAgdmFyIHN0YXJ0ID0gZnJvbS5jbG9uZSgpO1xuICBsaXN0LnB1c2goc3RhcnQpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGludGVydmFsOyBpKyspIHtcbiAgICBzdGFydC5hZGQoc3RlcCk7XG4gICAgbGlzdC5wdXNoKHN0YXJ0LmNsb25lKCkpO1xuICB9XG4gIHJldHVybiBsaXN0O1xufTtcblxuZnVuY3Rpb24gdW5pcXVlQ29vcmRzKGNvb3Jkcykge1xuICB2YXIgbWFwID0ge307XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY29vcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgbWFwW2Nvb3Jkc1tpXS50b0FycmF5KCkuam9pbignLCcpXSA9IGNvb3Jkc1tpXTtcbiAgfVxuICB2YXIgbGlzdCA9IFtdO1xuICBmb3IgKHZhciBpZCBpbiBtYXApIHtcbiAgICBsaXN0LnB1c2gobWFwW2lkXSk7XG4gIH1cbiAgcmV0dXJuIGxpc3Q7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBlblRvb2w7IiwidmFyIEVkaXRvclRvb2xzID0gcmVxdWlyZSgnLi4vZWRpdG9ydG9vbHMnKTtcblxudmFyIFNhbXBsZVRvb2wgPSBmdW5jdGlvbihlZGl0b3IpIHtcbiAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XG4gIHRoaXMuaW5wdXQgPSB0aGlzLmVkaXRvci5pbnB1dDtcbiAgdGhpcy5ibG9ja3MgPSB0aGlzLmVkaXRvci5ibG9ja3M7XG59O1xuXG5TYW1wbGVUb29sLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuZWRpdG9yLmhpZ2hsaWdodENvb3JkID0gdGhpcy5lZGl0b3IuZ2V0Q29vcmRCZWxvdygpO1xuXG4gIGlmICh0aGlzLmlucHV0Lm1vdXNlRG93bigpKSB7XG4gICAgdmFyIGNvb3JkID0gdGhpcy5lZGl0b3IuZ2V0Q29vcmRCZWxvdygpO1xuXG4gICAgdmFyIGNvbG9yID0gbnVsbDtcbiAgICBpZiAoY29vcmQgIT0gbnVsbCkge1xuICAgICAgdmFyIGluZGV4ID0gdGhpcy5ibG9ja3MuZ2V0QXRDb29yZChjb29yZCk7XG4gICAgICB2YXIgY29sb3IgPSB0aGlzLmJsb2Nrcy5wYWxldHRlW2luZGV4XTtcbiAgICAgIHRoaXMuZWRpdG9yLnNldFNlbGVjdGVkQ29sb3IoY29sb3IpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWRpdG9yLnNldFNlbGVjdGVkQ29sb3IobnVsbCk7XG4gICAgfVxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNhbXBsZVRvb2w7IiwidmFyIGluc2lkZSA9IHJlcXVpcmUoJ3BvaW50LWluLXBvbHlnb24nKTtcbnZhciBTZWxlY3RDb21tYW5kID0gcmVxdWlyZSgnLi4vY29tbWFuZHMvc2VsZWN0Y29tbWFuZCcpO1xuXG52YXIgU2VsZWN0VG9vbCA9IGZ1bmN0aW9uKGVkaXRvcikge1xuICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcbiAgdGhpcy5pbnB1dCA9IHRoaXMuZWRpdG9yLmlucHV0O1xuICB0aGlzLmJsb2NrcyA9IHRoaXMuZWRpdG9yLmJsb2NrcztcbiAgdGhpcy5jYW1lcmEgPSB0aGlzLmVkaXRvci5jYW1lcmE7XG5cbiAgdGhpcy5kaXZTZWxlY3Rpb25Cb3ggPSBudWxsO1xuXG4gIHRoaXMuY2FudmFzID0gZWRpdG9yLmNhbnZhcztcbiAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICB0aGlzLnBvaW50cyA9IFtdO1xuICB0aGlzLm1pbkRpc3RhbmNlID0gMjtcbn07XG5cblNlbGVjdFRvb2wucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcblxuICBpZiAodGhpcy5pbnB1dC5tb3VzZUhvbGQoMCkpIHtcbiAgICB2YXIgbW91c2UgPSB0aGlzLmlucHV0Lm1vdXNlLmNsb25lKCk7XG4gICAgaWYgKHRoaXMucG9pbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5wb2ludHMucHVzaChtb3VzZS50b0FycmF5KCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbGFzdE1vdXNlID0gbmV3IFRIUkVFLlZlY3RvcjIoKS5mcm9tQXJyYXkodGhpcy5wb2ludHNbdGhpcy5wb2ludHMubGVuZ3RoIC0gMV0pO1xuICAgICAgdmFyIGRpc3RhbmNlID0gbGFzdE1vdXNlLmRpc3RhbmNlVG8obW91c2UpO1xuICAgICAgaWYgKGRpc3RhbmNlID4gdGhpcy5taW5EaXN0YW5jZSkge1xuICAgICAgICB0aGlzLnBvaW50cy5wdXNoKG1vdXNlLnRvQXJyYXkoKSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICh0aGlzLnBvaW50cy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLnVwZGF0ZVNlbGVjdGlvbigpO1xuICAgIH1cbiAgICB0aGlzLnBvaW50cyA9IFtdO1xuICB9XG5cbiAgdGhpcy5kcmF3TGFzc28oKTtcbn07XG5cblNlbGVjdFRvb2wucHJvdG90eXBlLmRyYXdMYXNzbyA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5wb2ludHMubGVuZ3RoIDwgMikge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMuY29udGV4dC5saW5lV2lkdGggPSAnMSc7XG4gIHRoaXMuY29udGV4dC5zZXRMaW5lRGFzaChbM10pO1xuICB0aGlzLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSAnI2ZmZmZmZic7XG4gIHRoaXMuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBwb2ludCA9IHRoaXMucG9pbnRzW2ldO1xuICAgIGlmIChpID09PSAwKSB7XG4gICAgICB0aGlzLmNvbnRleHQubW92ZVRvKHBvaW50WzBdLCBwb2ludFsxXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY29udGV4dC5saW5lVG8ocG9pbnRbMF0sIHBvaW50WzFdKTtcbiAgICB9XG4gIH1cbiAgdGhpcy5jb250ZXh0LnN0cm9rZSgpO1xufTtcblxuU2VsZWN0VG9vbC5wcm90b3R5cGUudXBkYXRlU2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gIHZhciBibG9ja3MgPSB0aGlzLmJsb2NrcztcbiAgdmFyIGNhbWVyYSA9IHRoaXMuY2FtZXJhO1xuICB2YXIgY2FudmFzID0gdGhpcy5jYW52YXM7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB2YXIgc2NyZWVuUG9pbnRzID0gW107XG4gIHRoaXMuYmxvY2tzLnZpc2l0KGZ1bmN0aW9uKGksIGosIGssIGIpIHtcbiAgICB2YXIgY29vcmQgPSBuZXcgVEhSRUUuVmVjdG9yMyhpICsgMC41LCBqICsgMC41LCBrICsgMC41KTtcbiAgICB2YXIgbG9jYWxQb2ludCA9IGJsb2Nrcy5jb29yZFRvUG9pbnQoY29vcmQpO1xuICAgIHZhciB3b3JsZFBvaW50ID0gYmxvY2tzLm9iai5sb2NhbFRvV29ybGQobG9jYWxQb2ludCk7XG4gICAgdmFyIHZlY3RvciA9IHdvcmxkUG9pbnQucHJvamVjdChjYW1lcmEpO1xuICAgIHZlY3Rvci54ID0gTWF0aC5yb3VuZCgodmVjdG9yLnggKyAxKSAqIGNhbnZhcy53aWR0aCAvIDIpO1xuICAgIHZlY3Rvci55ID0gTWF0aC5yb3VuZCgoLXZlY3Rvci55ICsgMSkgKiBjYW52YXMuaGVpZ2h0IC8gMik7XG5cbiAgICBzY3JlZW5Qb2ludHMucHVzaCh7XG4gICAgICBzY3JlZW46IFt2ZWN0b3IueCwgdmVjdG9yLnldLFxuICAgICAgY29vcmQ6IG5ldyBUSFJFRS5WZWN0b3IzKGksIGosIGspXG4gICAgfSk7XG4gIH0pO1xuXG4gIHZhciBzZWxlY3Rpb25zID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc2NyZWVuUG9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHNjcmVlbiA9IHNjcmVlblBvaW50c1tpXS5zY3JlZW47XG4gICAgLy8gVGVzdCBwb2ludCBpbiBwb2x5Z29uXG4gICAgaWYgKGluc2lkZShzY3JlZW4sIHRoaXMucG9pbnRzKSkge1xuICAgICAgc2VsZWN0aW9ucy5wdXNoKHNjcmVlblBvaW50c1tpXS5jb29yZCk7XG4gICAgfVxuICB9XG5cbiAgdGhpcy5lZGl0b3IucnVuQ29tbWFuZChuZXcgU2VsZWN0Q29tbWFuZCh0aGlzLmVkaXRvciwgc2VsZWN0aW9ucykpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZWxlY3RUb29sOyIsInZhciBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydUSFJFRSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnVEhSRUUnXSA6IG51bGwpO1xudmFyIGIgPSByZXF1aXJlKCcuL2NvcmUvYicpO1xudmFyIHN0YXRzID0gcmVxdWlyZSgnLi9zZXJ2aWNlcy9zdGF0cycpO1xuXG52YXIgYXBwID0gYignbWFpbicpO1xuXG52YXIgc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKTtcbnZhciBjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoNjAsIHdpbmRvdy5pbm5lcldpZHRoIC8gd2luZG93LmlubmVySGVpZ2h0LCAwLjEsIDEwMDApO1xuXG4vLyBSZWdzaXRlciB2YWx1ZXNcbmFwcC52YWx1ZSgnYXBwJywgYXBwKTtcbmFwcC52YWx1ZSgnc2NlbmUnLCBzY2VuZSk7XG5hcHAudmFsdWUoJ2NhbWVyYScsIGNhbWVyYSk7XG5hcHAudmFsdWUoJ2NvbmZpZycsIHJlcXVpcmUoJy4vZGF0YS9jb25maWcuanNvbicpKTtcbmFwcC52YWx1ZSgncGFsZXR0ZScsIHJlcXVpcmUoJy4vZGF0YS9wYWxldHRlLmpzb24nKSk7XG5hcHAudmFsdWUoJ21hdGVyaWFscycsIHJlcXVpcmUoJy4vc2VydmljZXMvbWF0ZXJpYWxzJykpO1xuYXBwLnZhbHVlKCdjYW52YXMnLCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FudmFzJykpO1xuXG52YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbnRhaW5lcicpO1xuYXBwLnVzZShyZXF1aXJlKCcuL3N5c3RlbXMvcmVuZGVyZXInKShzY2VuZSwgY2FtZXJhLCBjb250YWluZXIpKTtcbmFwcC51c2UoJ2lucHV0JywgcmVxdWlyZSgnLi9zeXN0ZW1zL2lucHV0JykoY29udGFpbmVyKSk7XG5hcHAudXNlKHJlcXVpcmUoJy4vdm94ZWwvdm94ZWwnKSgpKTtcblxudmFyIGRldkNvbnNvbGUgPSByZXF1aXJlKCcuL3NlcnZpY2VzL2RldmNvbnNvbGUnKSh7XG4gIG9uYmx1cjogZnVuY3Rpb24oKSB7XG4gICAgY29udGFpbmVyLmZvY3VzKCk7XG4gIH1cbn0pO1xuYXBwLnZhbHVlKCdkZXZDb25zb2xlJywgZGV2Q29uc29sZSk7XG5cbnZhciBwcmVmYWJTZXJ2aWNlID0gcmVxdWlyZSgnLi9zZXJ2aWNlcy9wcmVmYWJzZXJ2aWNlJykoKTtcbmFwcC52YWx1ZSgncHJlZmFiU2VydmljZScsIHByZWZhYlNlcnZpY2UpO1xuXG5zdGF0cyhhcHApO1xuXG4vLyBBdHRhY2ggY2FtZXJhIGNvbnRyb2xcbmZ1bmN0aW9uIGxvYWRHYW1lKCkge1xuICBhcHAuYXR0YWNoKGNhbWVyYSwgcmVxdWlyZSgnLi9jb21wb25lbnRzL3BsYXllckNhbWVyYScpKTtcblxuICBhcHAubG9hZEFzc2VtYmx5KHJlcXVpcmUoJy4vYXNzZW1ibGllcy9hZ3JvdW5kJykpO1xuXG4gIHZhciBwbGF5ZXIgPSBhcHAubG9hZEFzc2VtYmx5KHJlcXVpcmUoJy4vYXNzZW1ibGllcy9hcGxheWVyJykpO1xuICBhcHAudmFsdWUoJ3BsYXllcicsIHBsYXllcik7XG59O1xuXG5mdW5jdGlvbiBsb2FkRWRpdG9yKCkge1xuICBhcHAubG9hZEFzc2VtYmx5KHJlcXVpcmUoJy4vYXNzZW1ibGllcy9hZWRpdG9yJykpO1xufVxuXG5sb2FkRWRpdG9yKCk7XG5cbmFwcC5zdGFydCgpO1xuXG52YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbnZhcycpO1xuYXBwLm9uKCdiZWZvcmVUaWNrJywgZnVuY3Rpb24oKSB7XG4gIGlmIChjYW52YXMud2lkdGggIT09IHdpbmRvdy5pbm5lcldpZHRoKSB7XG4gICAgY2FudmFzLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gIH1cbiAgaWYgKGNhbnZhcy5oZWlnaHQgIT09IHdpbmRvdy5pbm5lckhlaWdodCkge1xuICAgIGNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gIH1cbn0pOyIsInZhciBwYXJzZUFyZ3MgPSByZXF1aXJlKCdtaW5pbWlzdCcpO1xudmFyIGtleWNvZGUgPSByZXF1aXJlKCdrZXljb2RlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0cykge1xuICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgdmFyIG9uZm9jdXMgPSBvcHRzLm9uZm9jdXMgfHwgbnVsbDtcbiAgdmFyIG9uYmx1ciA9IG9wdHMub25ibHVyIHx8IG51bGw7XG4gIHZhciBjb21tYW5kcyA9IG9wdHMuY29tbWFuZHMgfHwge307XG5cbiAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGRpdik7XG4gIGRpdi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIGRpdi5zdHlsZS5sZWZ0ID0gJzBweCc7XG4gIGRpdi5zdHlsZS50b3AgPSAnMHB4JztcbiAgZGl2LnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICBkaXYuc3R5bGUuaGVpZ2h0ID0gJzEyMHB4JztcbiAgZGl2LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICdyZ2JhKDAsIDAsIDAsIDAuNSknO1xuXG4gIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIGlucHV0LnR5cGUgPSAndGV4dCc7XG4gIGlucHV0LmNsYXNzTmFtZSA9ICdjb25zb2xlLWlucHV0JztcbiAgaW5wdXQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICBpbnB1dC5zdHlsZS5sZWZ0ID0gJzBweCc7XG4gIGlucHV0LnN0eWxlLnRvcCA9ICcwcHgnO1xuICBpbnB1dC5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgaW5wdXQuc3R5bGUuaGVpZ2h0ID0gJzIwcHgnO1xuICBpbnB1dC5zdHlsZVsnYmFja2dyb3VuZC1jb2xvciddID0gJ3RyYW5zcGFyZW50JztcbiAgaW5wdXQuc3R5bGVbJ2JvcmRlciddID0gJzBweCBzb2xpZCc7XG4gIGlucHV0LnNwZWxsY2hlY2sgPSBmYWxzZTtcbiAgaW5wdXQuc3R5bGUuY29sb3IgPSAnI0ZGRkZGRic7XG4gIGlucHV0LnN0eWxlLmZvbnRTaXplID0gJzE2cHgnO1xuICBpbnB1dC5zdHlsZS5wYWRkaW5nID0gJzJweCAycHggMHB4IDJweCc7XG4gIGlucHV0LnZhbHVlID0gJz4gJztcblxuICBkaXYuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuXG4gIHZhciB0ZXh0U3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgdGV4dFNwYW4uY2xhc3NOYW1lID0gJ2NvbnNvbGUtc3Bhbic7XG4gIHRleHRTcGFuLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgdGV4dFNwYW4uc3R5bGUubGVmdCA9ICcwcHgnO1xuICB0ZXh0U3Bhbi5zdHlsZS50b3AgPSAnMjBweCc7XG4gIHRleHRTcGFuLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICB0ZXh0U3Bhbi5zdHlsZS5oZWlnaHQgPSAnMTAwcHgnO1xuICB0ZXh0U3Bhbi5zdHlsZS5jb2xvciA9ICcjRkZGRkZGJztcbiAgdGV4dFNwYW4uc3R5bGUuZm9udFNpemUgPSAnMTZweCc7XG4gIHRleHRTcGFuLnN0eWxlLnBhZGRpbmcgPSAnMHB4IDJweCAycHggMnB4JztcblxuICBkaXYuYXBwZW5kQ2hpbGQodGV4dFNwYW4pO1xuXG4gIC8vIFJlbW92ZSBvdXRsaW5lIG9uIGZvY3VzXG4gIGlucHV0Lm9uZm9jdXMgPSBmdW5jdGlvbigpIHtcbiAgICBpbnB1dC5zdHlsZVsnb3V0bGluZSddID0gJ25vbmUnO1xuICB9O1xuXG4gIGlucHV0Lm9ua2V5cHJlc3MgPSBmdW5jdGlvbihlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgIG9uRW50ZXJQcmVzc2VkKCk7XG4gICAgfVxuICAgIG9uSW5wdXRDaGFuZ2VkKGUpO1xuICB9O1xuXG4gIGlucHV0Lm9ua2V5dXAgPSBmdW5jdGlvbihlKSB7XG4gICAgb25JbnB1dENoYW5nZWQoZSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gb25JbnB1dENoYW5nZWQoZSkge1xuICAgIGlmIChpbnB1dC52YWx1ZS5sZW5ndGggPCAyKSB7XG4gICAgICBpbnB1dC52YWx1ZSA9ICc+ICc7XG4gICAgfVxuICB9O1xuXG4gIHZhciBsaW5lcyA9IFtdO1xuICB2YXIgaGlzdG9yeUxlbmd0aCA9IDEwMDtcbiAgdmFyIG51bWJlck9mTGluZXMgPSA1O1xuXG4gIGZ1bmN0aW9uIG9uRW50ZXJQcmVzc2VkKCkge1xuICAgIHZhciBsaW5lID0gaW5wdXQudmFsdWU7XG4gICAgYWRkTG9nKGxpbmUpO1xuICAgIGxpbmUgPSBsaW5lLnN1YnN0cmluZygyKTtcbiAgICBsaW5lID0gbGluZS50cmltKCk7XG4gICAgdmFyIGluZGV4ID0gbGluZS5pbmRleE9mKCcgJyk7XG4gICAgdmFyIGNvbW1hbmROYW1lID0gaW5kZXggPT09IC0xID8gbGluZSA6IGxpbmUuc3Vic3RyaW5nKDAsIGluZGV4KTtcbiAgICB2YXIgYXJncyA9IGluZGV4ID09PSAtMSA/ICcnIDogbGluZS5zdWJzdHJpbmcoaW5kZXggKyAxKTtcblxuICAgIHZhciBjb21tYW5kID0gY29tbWFuZHNbY29tbWFuZE5hbWVdO1xuICAgIGlmIChjb21tYW5kID09IG51bGwpIHtcbiAgICAgIGFkZEVycm9yKGNvbW1hbmROYW1lICsgJzogY29tbWFuZCBub3QgZm91bmQnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IGNvbW1hbmQocGFyc2VBcmdzKGFyZ3Muc3BsaXQoJyAnKSkpO1xuICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBhZGRMb2cocmVzdWx0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhpZGUoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBhZGRFcnJvcihlcnIpO1xuICAgICAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaW5wdXQudmFsdWUgPSAnJztcbiAgfTtcblxuICBmdW5jdGlvbiBhZGRMb2cobGluZSkge1xuICAgIGFkZExpbmUobGluZSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gYWRkRXJyb3IobGluZSkge1xuICAgIGFkZExpbmUobGluZSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gYWRkTGluZShsaW5lKSB7XG4gICAgbGluZXMucHVzaChsaW5lKTtcbiAgICBpZiAobGluZXMubGVuZ3RoID4gaGlzdG9yeUxlbmd0aCkge1xuICAgICAgbGluZXMucG9wKCk7XG4gICAgfVxuICAgIHVwZGF0ZUxpbmVzKCk7XG4gIH07XG5cbiAgZnVuY3Rpb24gdXBkYXRlTGluZXMoKSB7XG4gICAgdmFyIHRleHQgPSAnJztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bWJlck9mTGluZXM7IGkrKykge1xuICAgICAgdmFyIGxpbmUgPSBsaW5lc1tsaW5lcy5sZW5ndGggLSAxIC0gaV07XG4gICAgICBsaW5lID0gbGluZSB8fCAnJztcbiAgICAgIHRleHQgKz0gbGluZTtcbiAgICAgIHRleHQgKz0gXCI8YnIgLz5cIjtcbiAgICB9XG5cbiAgICB0ZXh0U3Bhbi5pbm5lckhUTUwgPSB0ZXh0O1xuICB9O1xuXG4gIGZ1bmN0aW9uIGhpZGUoKSB7XG4gICAgZGl2LmhpZGRlbiA9IHRydWU7XG4gICAgaW5wdXQuYmx1cigpO1xuICAgIGlmIChvbmJsdXIgIT0gbnVsbCkge1xuICAgICAgb25ibHVyKCk7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIHNob3coKSB7XG4gICAgZGl2LmhpZGRlbiA9IGZhbHNlO1xuICAgIGlucHV0LnZhbHVlID0gaW5wdXQudmFsdWUuc3BsaXQoJ2AnKS5qb2luKCcnKTtcbiAgICBpbnB1dC5mb2N1cygpO1xuICAgIGlmIChvbmZvY3VzICE9IG51bGwpIHtcbiAgICAgIG9uZm9jdXMoKTtcbiAgICB9XG4gIH07XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZnVuY3Rpb24oZSkge1xuICAgIHZhciBrZXkgPSBrZXljb2RlKGUpO1xuICAgIGlmIChrZXkgPT09ICdgJykge1xuICAgICAgaWYgKGRpdi5oaWRkZW4pIHtcbiAgICAgICAgc2hvdygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaGlkZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgLy8gSGlkZGVuIGJ5IGRlZmF1bHRcbiAgZGl2LmhpZGRlbiA9IHRydWU7XG5cbiAgZnVuY3Rpb24gbG9hZENvbW1hbmRzKHZhbHVlKSB7XG4gICAgZm9yICh2YXIgaSBpbiB2YWx1ZSkge1xuICAgICAgY29tbWFuZHNbaV0gPSB2YWx1ZVtpXTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBjb21tYW5kczogY29tbWFuZHMsXG4gICAgbG9hZENvbW1hbmRzOiBsb2FkQ29tbWFuZHNcbiAgfTtcbn07IiwidmFyIFRIUkVFID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ1RIUkVFJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydUSFJFRSddIDogbnVsbCk7XG5cbnZhciB0ZXh0dXJlTG9hZGVyID0gbmV3IFRIUkVFLlRleHR1cmVMb2FkZXIoKTtcblxuZnVuY3Rpb24gbG9hZExhbWJlcnRNYXRlcmlhbChzb3VyY2UpIHtcbiAgdmFyIHRleHR1cmUgPSB0ZXh0dXJlTG9hZGVyLmxvYWQoc291cmNlKTtcbiAgdGV4dHVyZS53cmFwUyA9IFRIUkVFLlJlcGVhdFdyYXBwaW5nO1xuICB0ZXh0dXJlLndyYXBUID0gVEhSRUUuUmVwZWF0V3JhcHBpbmc7XG5cbiAgcmV0dXJuIG5ldyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsKHtcbiAgICBtYXA6IHRleHR1cmVcbiAgfSk7XG59O1xuXG5mdW5jdGlvbiBsb2FkQmFzaWNNYXRlcmlhbChzb3VyY2UpIHtcbiAgdmFyIHRleHR1cmUgPSB0ZXh0dXJlTG9hZGVyLmxvYWQoc291cmNlKTtcbiAgdGV4dHVyZS53cmFwUyA9IFRIUkVFLlJlcGVhdFdyYXBwaW5nO1xuICB0ZXh0dXJlLndyYXBUID0gVEhSRUUuUmVwZWF0V3JhcHBpbmc7XG5cbiAgdGV4dHVyZS5tYWdGaWx0ZXIgPSBUSFJFRS5OZWFyZXN0RmlsdGVyO1xuICBcbiAgcmV0dXJuIG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgbWFwOiB0ZXh0dXJlXG4gIH0pO1xufTtcblxubWF0ZXJpYWxzID0ge1xuICAncGxhY2Vob2xkZXInOiBsb2FkQmFzaWNNYXRlcmlhbCgnaW1hZ2VzL3BsYWNlaG9sZGVyLnBuZycpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gbWF0ZXJpYWxzOyIsInZhciBQcmVmYWJTZXJ2aWNlID0gZnVuY3Rpb24oKSB7fTtcblxuUHJlZmFiU2VydmljZS5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uKCkge1xuICB0cnkge1xuICAgIHZhciBzYXZlcyA9IEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKCdiX3NhdmVzJykgfHwgW10pO1xuICAgIHJldHVybiBzYXZlcztcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG59O1xuXG5QcmVmYWJTZXJ2aWNlLnByb3RvdHlwZS5zYXZlID0gZnVuY3Rpb24oZGF0YSkge1xuICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2Jfc2F2ZXMnLCBKU09OLnN0cmluZ2lmeShkYXRhKSk7XG59O1xuXG5QcmVmYWJTZXJ2aWNlLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uKCkge1xuICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2Jfc2F2ZXMnLCAnJyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFByZWZhYlNlcnZpY2UoKTtcbn07IiwidmFyIFN0YXRzID0gcmVxdWlyZSgnc3RhdHMuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcHApIHtcbiAgYXBwLm9uKCdiZWZvcmVUaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgc3RhdHMuYmVnaW4oKTtcbiAgfSk7XG5cbiAgYXBwLm9uKCdhZnRlclRpY2snLCBmdW5jdGlvbigpIHtcbiAgICBzdGF0cy5lbmQoKTtcbiAgfSk7XG5cbiAgdmFyIHN0YXRzID0gbmV3IFN0YXRzKCk7XG4gIHN0YXRzLmRvbUVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICBzdGF0cy5kb21FbGVtZW50LnN0eWxlLnJpZ2h0ID0gJzBweCc7XG4gIHN0YXRzLmRvbUVsZW1lbnQuc3R5bGUuYm90dG9tID0gJzUwcHgnO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHN0YXRzLmRvbUVsZW1lbnQpO1xuXG4gIHJldHVybiBzdGF0cy5kb21FbGVtZW50O1xufTsiLCJ2YXIgYXJyYXlVdGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzL2FycmF5dXRpbHMnKTtcbnZhciBrZXljb2RlID0gcmVxdWlyZSgna2V5Y29kZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgdmFyIG1vdXNlID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcbiAgdmFyIG1vdXNlZG93bnMgPSBbXTtcbiAgdmFyIG1vdXNldXBzID0gW107XG4gIHZhciBtb3VzZW1vdmUgPSBmYWxzZTtcbiAgdmFyIG1vdXNlaG9sZHMgPSBbXTtcbiAgdmFyIGtleWRvd25zID0gW107XG4gIHZhciBrZXl1cHMgPSBbXTtcbiAgdmFyIGtleWhvbGRzID0gW107XG4gIHZhciBtb3VzZWRvd25UaW1lcyA9IHt9O1xuICB2YXIgY2xpY2tUaW1lID0gMTUwO1xuICB2YXIgbW91c2VjbGlja3MgPSBbXTtcblxuICBlbGVtZW50LmZvY3VzKCk7XG5cbiAgZnVuY3Rpb24gb25Nb3VzZU1vdmUoZSkge1xuICAgIG1vdXNlbW92ZSA9IHRydWU7XG4gICAgbW91c2UueCA9IGUuY2xpZW50WDtcbiAgICBtb3VzZS55ID0gZS5jbGllbnRZO1xuICB9O1xuXG4gIGZ1bmN0aW9uIG9uTW91c2VEb3duKGUpIHtcbiAgICBtb3VzZWRvd25zLnB1c2goZS5idXR0b24pO1xuICAgIG1vdXNlZG93blRpbWVzW2UuYnV0dG9uXSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIGlmICghYXJyYXlVdGlscy5pbmNsdWRlcyhtb3VzZWhvbGRzLCBlLmJ1dHRvbikpIHtcbiAgICAgIG1vdXNlaG9sZHMucHVzaChlLmJ1dHRvbik7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIG9uTW91c2VVcChlKSB7XG4gICAgaWYgKCEhbW91c2Vkb3duVGltZXNbZS5idXR0b25dKSB7XG4gICAgICB2YXIgZGlmZiA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gbW91c2Vkb3duVGltZXNbZS5idXR0b25dO1xuICAgICAgaWYgKGRpZmYgPCBjbGlja1RpbWUpIHtcbiAgICAgICAgbW91c2VjbGlja3MucHVzaChlLmJ1dHRvbik7XG4gICAgICB9XG4gICAgfVxuICAgIG1vdXNldXBzLnB1c2goZS5idXR0b24pO1xuICAgIGFycmF5VXRpbHMucmVtb3ZlKG1vdXNlaG9sZHMsIGUuYnV0dG9uKTtcbiAgfTtcblxuICBmdW5jdGlvbiBvbktleURvd24oZSkge1xuICAgIHZhciBrZXkgPSBrZXljb2RlKGUpO1xuICAgIGtleWRvd25zLnB1c2goa2V5KTtcbiAgICBpZiAoIWFycmF5VXRpbHMuaW5jbHVkZXMoa2V5aG9sZHMsIGtleSkpIHtcbiAgICAgIGtleWhvbGRzLnB1c2goa2V5KTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gb25LZXlVcChlKSB7XG4gICAgdmFyIGtleSA9IGtleWNvZGUoZSk7XG4gICAga2V5dXBzLnB1c2goa2V5KTtcbiAgICBhcnJheVV0aWxzLnJlbW92ZShrZXlob2xkcywga2V5KTtcbiAgfTtcblxuICBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICBtb3VzZWRvd25zID0gW107XG4gICAgbW91c2V1cHMgPSBbXTtcbiAgICBtb3VzZW1vdmUgPSBmYWxzZTtcbiAgICBrZXlkb3ducyA9IFtdO1xuICAgIGtleXVwcyA9IFtdO1xuICAgIG1vdXNlY2xpY2tzID0gW107XG4gIH1cblxuICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIG9uTW91c2VEb3duKTtcbiAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSk7XG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIG9uTW91c2VVcCk7XG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9uS2V5RG93bik7XG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBvbktleVVwKTtcblxuICByZXR1cm4ge1xuICAgIG1vdXNlOiBtb3VzZSxcblxuICAgIG1vdXNlRG93bjogZnVuY3Rpb24oYnV0dG9uKSB7XG4gICAgICBpZiAoYnV0dG9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIG1vdXNlZG93bnMubGVuZ3RoID4gMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcnJheVV0aWxzLmluY2x1ZGVzKG1vdXNlZG93bnMsIGJ1dHRvbik7XG4gICAgfSxcblxuICAgIG1vdXNlVXA6IGZ1bmN0aW9uKGJ1dHRvbikge1xuICAgICAgaWYgKGJ1dHRvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBtb3VzZXVwcy5sZW5ndGggPiAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFycmF5VXRpbHMuaW5jbHVkZXMobW91c2V1cHMsIGJ1dHRvbik7XG4gICAgfSxcblxuICAgIG1vdXNlSG9sZDogZnVuY3Rpb24oYnV0dG9uKSB7XG4gICAgICBpZiAoYnV0dG9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIG1vdXNlaG9sZHMubGVuZ3RoID4gMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcnJheVV0aWxzLmluY2x1ZGVzKG1vdXNlaG9sZHMsIGJ1dHRvbik7XG4gICAgfSxcblxuICAgIG1vdXNlQ2xpY2s6IGZ1bmN0aW9uKGJ1dHRvbikge1xuICAgICAgaWYgKGJ1dHRvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBtb3VzZWNsaWNrcy5sZW5ndGggPiAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFycmF5VXRpbHMuaW5jbHVkZXMobW91c2VjbGlja3MsIGJ1dHRvbik7XG4gICAgfSxcblxuICAgIGtleURvd246IGZ1bmN0aW9uKGtleSkge1xuICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBrZXlkb3ducy5sZW5ndGggPiAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFycmF5VXRpbHMuaW5jbHVkZXMoa2V5ZG93bnMsIGtleSk7XG4gICAgfSxcblxuICAgIGtleVVwOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4ga2V5dXBzLmxlbmd0aCA+IDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gYXJyYXlVdGlscy5pbmNsdWRlcyhrZXl1cHMsIGtleSk7XG4gICAgfSxcblxuICAgIGtleUhvbGQ6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBrZXlob2xkcy5sZW5ndGggPiAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFycmF5VXRpbHMuaW5jbHVkZXMoa2V5aG9sZHMsIGtleSk7XG4gICAgfSxcblxuICAgIG1vdXNlTW92ZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbW91c2Vtb3ZlO1xuICAgIH0sXG5cbiAgICBsYXRlVGljazogZnVuY3Rpb24oKSB7XG4gICAgICBjbGVhcigpO1xuICAgIH0sXG5cbiAgICBzY3JlZW5Ub1ZpZXdwb3J0OiBmdW5jdGlvbihzY3JlZW4pIHtcbiAgICAgIHZhciB2aWV3cG9ydCA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gICAgICB2aWV3cG9ydC54ID0gKHNjcmVlbi54IC8gd2luZG93LmlubmVyV2lkdGgpICogMiAtIDE7XG4gICAgICB2aWV3cG9ydC55ID0gLShzY3JlZW4ueSAvIHdpbmRvdy5pbm5lckhlaWdodCkgKiAyICsgMTtcbiAgICAgIHJldHVybiB2aWV3cG9ydDtcbiAgICB9XG4gIH07XG59OyIsInZhciBTdGF0cyA9IHJlcXVpcmUoJ3N0YXRzLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2NlbmUsIGNhbWVyYSwgY29udGFpbmVyKSB7XG4gIHZhciByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKCk7XG4gIHJlbmRlcmVyLnNldENsZWFyQ29sb3IoMHgyMjIyMjIpO1xuICByZW5kZXJlci5zZXRTaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpO1xuXG4gIGNvbnRhaW5lciA9IGNvbnRhaW5lciB8fCBkb2N1bWVudC5ib2R5O1xuICBjb250YWluZXIuYXBwZW5kQ2hpbGQocmVuZGVyZXIuZG9tRWxlbWVudCk7XG5cbiAgdmFyIHJlbmRlcmVyLCBjYW1lcmE7XG4gIHZhciBzc2FvUGFzcywgZWZmZWN0Q29tcG9zZXI7XG5cbiAgdmFyIHN5c3RlbSA9IHt9O1xuICBzeXN0ZW0ucmVuZGVyZXIgPSByZW5kZXJlcjtcblxuICB2YXIgc3RhdHMgPSBuZXcgU3RhdHMoKTtcbiAgc3RhdHMuZG9tRWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIHN0YXRzLmRvbUVsZW1lbnQuc3R5bGUucmlnaHQgPSAnMHB4JztcbiAgc3RhdHMuZG9tRWxlbWVudC5zdHlsZS5ib3R0b20gPSAnMHB4JztcblxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHN0YXRzLmRvbUVsZW1lbnQpO1xuXG4gIHZhciBzc2FvID0gdHJ1ZTtcblxuICB2YXIgYW1iaWVudCA9IG5ldyBUSFJFRS5BbWJpZW50TGlnaHQobmV3IFRIUkVFLkNvbG9yKFwicmdiKDYwJSwgNjAlLCA2MCUpXCIpKTtcbiAgdmFyIGxpZ2h0ID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoMHhmZmZmZmYsIDAuNik7XG4gIGxpZ2h0LnBvc2l0aW9uLnNldCgwLjgsIDEsIDAuNSk7XG4gIHNjZW5lLmFkZChsaWdodCk7XG4gIHNjZW5lLmFkZChhbWJpZW50KTtcblxuICBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlbmRlcik7XG5cbiAgICBzdGF0cy5iZWdpbigpO1xuXG4gICAgaWYgKHNzYW8pIHtcbiAgICAgIC8vIFJlbmRlciBkZXB0aCBpbnRvIGRlcHRoUmVuZGVyVGFyZ2V0XG4gICAgICBzY2VuZS5vdmVycmlkZU1hdGVyaWFsID0gZGVwdGhNYXRlcmlhbDtcbiAgICAgIHJlbmRlcmVyLnJlbmRlcihzY2VuZSwgY2FtZXJhLCBkZXB0aFJlbmRlclRhcmdldCwgdHJ1ZSk7XG5cbiAgICAgIC8vIFJlbmRlciByZW5kZXJQYXNzIGFuZCBTU0FPIHNoYWRlclBhc3NcbiAgICAgIHNjZW5lLm92ZXJyaWRlTWF0ZXJpYWwgPSBudWxsO1xuICAgICAgZWZmZWN0Q29tcG9zZXIucmVuZGVyKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbmRlcmVyLnJlbmRlcihzY2VuZSwgY2FtZXJhKTtcbiAgICB9XG5cblxuICAgIHN0YXRzLmVuZCgpO1xuICB9O1xuXG4gIGZ1bmN0aW9uIG9uV2luZG93UmVzaXplKCkge1xuICAgIHZhciB3aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIHZhciBoZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG5cbiAgICBjYW1lcmEuYXNwZWN0ID0gd2lkdGggLyBoZWlnaHQ7XG4gICAgY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcbiAgICByZW5kZXJlci5zZXRTaXplKHdpZHRoLCBoZWlnaHQpO1xuXG4gICAgLy8gUmVzaXplIHJlbmRlclRhcmdldHNcbiAgICBzc2FvUGFzcy51bmlmb3Jtc1snc2l6ZSddLnZhbHVlLnNldCh3aWR0aCwgaGVpZ2h0KTtcblxuICAgIHZhciBwaXhlbFJhdGlvID0gcmVuZGVyZXIuZ2V0UGl4ZWxSYXRpbygpO1xuICAgIHZhciBuZXdXaWR0aCA9IE1hdGguZmxvb3Iod2lkdGggLyBwaXhlbFJhdGlvKSB8fCAxO1xuICAgIHZhciBuZXdIZWlnaHQgPSBNYXRoLmZsb29yKGhlaWdodCAvIHBpeGVsUmF0aW8pIHx8IDE7XG4gICAgZGVwdGhSZW5kZXJUYXJnZXQuc2V0U2l6ZShuZXdXaWR0aCwgbmV3SGVpZ2h0KTtcbiAgICBlZmZlY3RDb21wb3Nlci5zZXRTaXplKG5ld1dpZHRoLCBuZXdIZWlnaHQpO1xuICB9XG5cbiAgZnVuY3Rpb24gaW5pdFBvc3Rwcm9jZXNzaW5nKCkge1xuXG4gICAgLy8gU2V0dXAgcmVuZGVyIHBhc3NcbiAgICB2YXIgcmVuZGVyUGFzcyA9IG5ldyBUSFJFRS5SZW5kZXJQYXNzKHNjZW5lLCBjYW1lcmEpO1xuXG4gICAgLy8gU2V0dXAgZGVwdGggcGFzc1xuICAgIHZhciBkZXB0aFNoYWRlciA9IFRIUkVFLlNoYWRlckxpYltcImRlcHRoUkdCQVwiXTtcbiAgICB2YXIgZGVwdGhVbmlmb3JtcyA9IFRIUkVFLlVuaWZvcm1zVXRpbHMuY2xvbmUoZGVwdGhTaGFkZXIudW5pZm9ybXMpO1xuXG4gICAgZGVwdGhNYXRlcmlhbCA9IG5ldyBUSFJFRS5TaGFkZXJNYXRlcmlhbCh7XG4gICAgICBmcmFnbWVudFNoYWRlcjogZGVwdGhTaGFkZXIuZnJhZ21lbnRTaGFkZXIsXG4gICAgICB2ZXJ0ZXhTaGFkZXI6IGRlcHRoU2hhZGVyLnZlcnRleFNoYWRlcixcbiAgICAgIHVuaWZvcm1zOiBkZXB0aFVuaWZvcm1zLFxuICAgICAgYmxlbmRpbmc6IFRIUkVFLk5vQmxlbmRpbmdcbiAgICB9KTtcblxuICAgIHZhciBwYXJzID0ge1xuICAgICAgbWluRmlsdGVyOiBUSFJFRS5MaW5lYXJGaWx0ZXIsXG4gICAgICBtYWdGaWx0ZXI6IFRIUkVFLkxpbmVhckZpbHRlclxuICAgIH07XG4gICAgZGVwdGhSZW5kZXJUYXJnZXQgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJUYXJnZXQod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCwgcGFycyk7XG5cbiAgICAvLyBTZXR1cCBTU0FPIHBhc3NcbiAgICBzc2FvUGFzcyA9IG5ldyBUSFJFRS5TaGFkZXJQYXNzKFRIUkVFLlNTQU9TaGFkZXIpO1xuICAgIHNzYW9QYXNzLnJlbmRlclRvU2NyZWVuID0gdHJ1ZTtcbiAgICAvL3NzYW9QYXNzLnVuaWZvcm1zWyBcInREaWZmdXNlXCIgXS52YWx1ZSB3aWxsIGJlIHNldCBieSBTaGFkZXJQYXNzXG4gICAgc3Nhb1Bhc3MudW5pZm9ybXNbXCJ0RGVwdGhcIl0udmFsdWUgPSBkZXB0aFJlbmRlclRhcmdldDtcbiAgICBzc2FvUGFzcy51bmlmb3Jtc1snc2l6ZSddLnZhbHVlLnNldCh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgICBzc2FvUGFzcy51bmlmb3Jtc1snY2FtZXJhTmVhciddLnZhbHVlID0gY2FtZXJhLm5lYXI7XG4gICAgc3Nhb1Bhc3MudW5pZm9ybXNbJ2NhbWVyYUZhciddLnZhbHVlID0gY2FtZXJhLmZhcjtcbiAgICBzc2FvUGFzcy51bmlmb3Jtc1snb25seUFPJ10udmFsdWUgPSBmYWxzZTtcbiAgICBzc2FvUGFzcy51bmlmb3Jtc1snYW9DbGFtcCddLnZhbHVlID0gMTtcbiAgICBzc2FvUGFzcy51bmlmb3Jtc1snbHVtSW5mbHVlbmNlJ10udmFsdWUgPSAwLjU7XG5cbiAgICAvLyBBZGQgcGFzcyB0byBlZmZlY3QgY29tcG9zZXJcbiAgICBlZmZlY3RDb21wb3NlciA9IG5ldyBUSFJFRS5FZmZlY3RDb21wb3NlcihyZW5kZXJlcik7XG4gICAgZWZmZWN0Q29tcG9zZXIuYWRkUGFzcyhyZW5kZXJQYXNzKTtcbiAgICBlZmZlY3RDb21wb3Nlci5hZGRQYXNzKHNzYW9QYXNzKTtcbiAgfVxuXG4gIC8vIFNldCB1cCByZW5kZXIgbG9vcFxuICBpbml0UG9zdHByb2Nlc3NpbmcoKTtcbiAgcmVuZGVyKCk7XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIG9uV2luZG93UmVzaXplLCBmYWxzZSk7XG5cbiAgcmV0dXJuIHN5c3RlbTtcbn07IiwidmFyIGFycmF5ID0ge1xuICBpbmRleE9mOiBmdW5jdGlvbihhcnJheSwgZWxlbWVudCkge1xuICAgIHZhciBwcmVkaWNhdGUgPSB0eXBlb2YgZWxlbWVudCA9PT0gJ2Z1bmN0aW9uJyA/IGVsZW1lbnQgOiBmdW5jdGlvbih2KSB7XG4gICAgICByZXR1cm4gdiA9PT0gZWxlbWVudDtcbiAgICB9O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHByZWRpY2F0ZShhcnJheVtpXSkpIHtcbiAgICAgICAgcmV0dXJuIGk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAtMTtcbiAgfSxcblxuICBpbmNsdWRlczogZnVuY3Rpb24oYXJyYXksIGVsZW1lbnQpIHtcbiAgICByZXR1cm4gdGhpcy5pbmRleE9mKGFycmF5LCBlbGVtZW50KSAhPT0gLTE7XG4gIH0sXG5cbiAgcmVtb3ZlOiBmdW5jdGlvbihhcnJheSwgZWxlbWVudCkge1xuICAgIHZhciBpbmRleCA9IHRoaXMuaW5kZXhPZihhcnJheSwgZWxlbWVudCk7XG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgYXJyYXkuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gIH0sXG5cbiAgY2xvbmU6IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIGNvcHkgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb3B5W2ldID0gYXJyYXlbaV07XG4gICAgfVxuICAgIHJldHVybiBjb3B5O1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFycmF5OyIsInZhciBHcmF2aXR5ID0gZnVuY3Rpb24oZGlyLCBheGlzLCBwb3NpdGl2ZSkge1xuICB0aGlzLmRpciA9IGRpciB8fCBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICB0aGlzLmF4aXMgPSBheGlzIHx8ICcnO1xuICB0aGlzLnBvc2l0aXZlID0gcG9zaXRpdmUgfHwgJyc7XG5cbiAgdGhpcy5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgR3Jhdml0eSh0aGlzLmRpciwgdGhpcy5heGlzLCB0aGlzLnBvc2l0aXZlKTtcbiAgfTtcblxuICB0aGlzLmVxdWFscyA9IGZ1bmN0aW9uKGdyYXZpdHkpIHtcbiAgICByZXR1cm4gdGhpcy5kaXIuZXF1YWxzKGdyYXZpdHkuZGlyKTtcbiAgfTtcblxuICB0aGlzLmlzTm9uZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmRpci5sZW5ndGgoKSA9PT0gMDtcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR3Jhdml0eTsiLCJ2YXIgR3Jhdml0eSA9IHJlcXVpcmUoJy4vZ3Jhdml0eScpO1xuXG52YXIgZ3Jhdml0aWVzID0ge1xuICBub25lOiBuZXcgR3Jhdml0eSgpLFxuICByaWdodDogbmV3IEdyYXZpdHkobmV3IFRIUkVFLlZlY3RvcjMoMSwgMCwgMCkubm9ybWFsaXplKCksICd4JywgdHJ1ZSksXG4gIGxlZnQ6IG5ldyBHcmF2aXR5KG5ldyBUSFJFRS5WZWN0b3IzKC0xLCAwLCAwKS5ub3JtYWxpemUoKSwgJ3gnLCBmYWxzZSksXG4gIHRvcDogbmV3IEdyYXZpdHkobmV3IFRIUkVFLlZlY3RvcjMoMCwgMSwgMCkubm9ybWFsaXplKCksICd5JywgdHJ1ZSksXG4gIGJvdHRvbTogbmV3IEdyYXZpdHkobmV3IFRIUkVFLlZlY3RvcjMoMCwgLTEsIDApLm5vcm1hbGl6ZSgpLCAneScsIGZhbHNlKSxcbiAgZnJvbnQ6IG5ldyBHcmF2aXR5KG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDEpLm5vcm1hbGl6ZSgpLCAneicsIHRydWUpLFxuICBiYWNrOiBuZXcgR3Jhdml0eShuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSkubm9ybWFsaXplKCksICd6JywgZmFsc2UpXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0R3Jhdml0eTogZnVuY3Rpb24ocG9zaXRpb24pIHtcbiAgICB2YXIgbWluID0gMTtcbiAgICB2YXIgY2xvc2VzdCA9IG51bGw7XG4gICAgdmFyIGZvcmNlID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBmb3IgKHZhciBpZCBpbiBncmF2aXRpZXMpIHtcbiAgICAgIHZhciBncmF2aXR5ID0gZ3Jhdml0aWVzW2lkXTtcbiAgICAgIHZhciBkb3QgPSBncmF2aXR5LmRpci5jbG9uZSgpLmRvdChwb3NpdGlvbi5jbG9uZSgpLm5vcm1hbGl6ZSgpKTtcbiAgICAgIGlmIChkb3QgPCBtaW4pIHtcbiAgICAgICAgbWluID0gZG90O1xuICAgICAgICBjbG9zZXN0ID0gZ3Jhdml0eTtcbiAgICAgIH1cblxuICAgICAgaWYoZG90IDwgLSAwLjUpIHtcbiAgICAgICAgdmFyIHJhdGlvID0gLTAuNSAtIGRvdDtcbiAgICAgICAgZm9yY2UuYWRkKGdyYXZpdHkuZGlyLmNsb25lKCkubXVsdGlwbHlTY2FsYXIocmF0aW8pKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgZ3Jhdml0eSA9IGNsb3Nlc3QuY2xvbmUoKTtcbiAgICBncmF2aXR5LmZvcmNlRGlyID0gZm9yY2Uubm9ybWFsaXplKCk7XG4gICAgcmV0dXJuIGdyYXZpdHk7XG4gIH1cbn07IiwidmFyIGNvbXBpbGVNZXNoZXIgPSByZXF1aXJlKCdncmVlZHktbWVzaGVyJyk7XG52YXIgbmRhcnJheSA9IHJlcXVpcmUoJ25kYXJyYXknKTtcblxudmFyIG1lc2hlciA9IGNvbXBpbGVNZXNoZXIoe1xuICBleHRyYUFyZ3M6IDEsXG4gIG9yZGVyOiBbMCwgMV0sXG4gIGFwcGVuZDogZnVuY3Rpb24obG9feCwgbG9feSwgaGlfeCwgaGlfeSwgdmFsLCByZXN1bHQpIHtcbiAgICByZXN1bHQucHVzaChbXG4gICAgICBbbG9feCwgbG9feV0sXG4gICAgICBbaGlfeCwgaGlfeV1cbiAgICBdKVxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkYXRhLCBkaW0sIHZveGVsU2lkZVRleHR1cmVJZHMpIHtcbiAgdm94ZWxTaWRlVGV4dHVyZUlkcyA9IHZveGVsU2lkZVRleHR1cmVJZHMgfHwge307XG5cbiAgdmFyIHZlcnRpY2VzID0gW107XG4gIHZhciBzdXJmYWNlcyA9IFtdO1xuXG4gIHZhciB1LCB2LCBkaW1zRCwgZGltc1UsIGRpbXNWLCB0ZDAsIHRkMSwgZHYsIGZsaXA7XG5cbiAgLy8gSW50ZXJhdGUgdGhyb3VnaCBkaW1lbnNpb25zXG4gIGZvciAodmFyIGQgPSAwOyBkIDwgMzsgZCsrKSB7XG4gICAgdSA9IChkICsgMSkgJSAzO1xuICAgIHYgPSAoZCArIDIpICUgMztcbiAgICBkaW1zRCA9IGRpbVtkXTtcbiAgICBkaW1zVSA9IGRpbVt1XTtcbiAgICBkaW1zViA9IGRpbVt2XTtcbiAgICB0ZDAgPSBkICogMjtcbiAgICB0ZDEgPSBkICogMiArIDE7XG5cbiAgICAvLyBJbnRlcmF0ZSB0aHJvdWdoIFNsaWNlc1xuICAgIGZsaXAgPSBmYWxzZTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRpbXNEOyBpKyspIHtcbiAgICAgIHByb2Nlc3NTbGljZShpKTtcbiAgICB9XG5cblxuICAgIC8vIEludGVyYXRlIHRocm91Z2ggU2xpY2VzIGZyb20gb3RoZXIgZGlyXG4gICAgZmxpcCA9IHRydWU7XG4gICAgZm9yICh2YXIgaSA9IGRpbXNEIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHByb2Nlc3NTbGljZShpKTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gcHJvY2Vzc1NsaWNlKGkpIHtcbiAgICB2YXIgc2xpY2UgPSBuZGFycmF5KFtdLCBbZGltc1UsIGRpbXNWXSk7XG5cbiAgICB2YXIgczAgPSAwO1xuICAgIGR2ID0gZmxpcCA/IGkgOiBpICsgMTtcblxuICAgIC8vSW50ZXJhdGUgdGhyb3VnaCB1dlxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGltc1U7IGorKykge1xuICAgICAgdmFyIHMxID0gMDtcbiAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgZGltc1Y7IGsrKykge1xuICAgICAgICB2YXIgYiA9IGdldFZveGVsKGksIGosIGssIGQpO1xuICAgICAgICBpZiAoIWIpIHtcbiAgICAgICAgICBzbGljZS5zZXQoaiwgaywgMCk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGIxO1xuICAgICAgICBpZiAoZmxpcCkge1xuICAgICAgICAgIGIxID0gaSA9PT0gMCA/IDAgOiBnZXRWb3hlbChpIC0gMSwgaiwgaywgZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYjEgPSBpID09PSBkaW1zRCAtIDEgPyAwIDogZ2V0Vm94ZWwoaSArIDEsIGosIGssIGQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghIWIxKSB7XG4gICAgICAgICAgc2xpY2Uuc2V0KGosIGssIDApO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0ID0gZ2V0VGV4dHVyZUlkKGIsIGZsaXAgPyB0ZDAgOiB0ZDEpO1xuICAgICAgICBzbGljZS5zZXQoaiwgaywgdCk7XG4gICAgICAgIHMxKys7XG4gICAgICB9XG4gICAgICBzMCsrO1xuICAgIH1cblxuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICBtZXNoZXIoc2xpY2UsIHJlc3VsdCk7XG5cbiAgICBpZiAocmVzdWx0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAodmFyIGwgPSAwOyBsIDwgcmVzdWx0Lmxlbmd0aDsgbCsrKSB7XG4gICAgICB2YXIgZiA9IHJlc3VsdFtsXTtcbiAgICAgIHZhciBsbyA9IGZbMF07XG4gICAgICB2YXIgaGkgPSBmWzFdO1xuICAgICAgdmFyIHNpemV1ID0gaGlbMF0gLSBsb1swXTtcbiAgICAgIHZhciBzaXpldiA9IGhpWzFdIC0gbG9bMV07XG5cbiAgICAgIHZhciBmdXZzID0gW1xuICAgICAgICBbMCwgMF0sXG4gICAgICAgIFtzaXpldSwgMF0sXG4gICAgICAgIFtzaXpldSwgc2l6ZXZdLFxuICAgICAgICBbMCwgc2l6ZXZdXG4gICAgICBdO1xuXG4gICAgICB2YXIgYyA9IHNsaWNlLmdldChsb1swXSwgbG9bMV0pO1xuXG4gICAgICB2YXIgdjAgPSBbXTtcbiAgICAgIHZhciB2MSA9IFtdO1xuICAgICAgdmFyIHYyID0gW107XG4gICAgICB2YXIgdjMgPSBbXTtcblxuICAgICAgdjBbZF0gPSBkdjtcbiAgICAgIHYwW3VdID0gbG9bMF07XG4gICAgICB2MFt2XSA9IGxvWzFdO1xuXG4gICAgICB2MVtkXSA9IGR2O1xuICAgICAgdjFbdV0gPSBoaVswXTtcbiAgICAgIHYxW3ZdID0gbG9bMV07XG5cbiAgICAgIHYyW2RdID0gZHY7XG4gICAgICB2Mlt1XSA9IGhpWzBdO1xuICAgICAgdjJbdl0gPSBoaVsxXTtcblxuICAgICAgdjNbZF0gPSBkdjtcbiAgICAgIHYzW3VdID0gbG9bMF07XG4gICAgICB2M1t2XSA9IGhpWzFdO1xuXG4gICAgICB2YXIgdmluZGV4ID0gdmVydGljZXMubGVuZ3RoO1xuICAgICAgdmVydGljZXMucHVzaCh2MCwgdjEsIHYyLCB2Myk7XG4gICAgICBpZiAoZmxpcCkge1xuICAgICAgICBzdXJmYWNlcy5wdXNoKHtcbiAgICAgICAgICBmYWNlOiBbdmluZGV4ICsgMywgdmluZGV4ICsgMiwgdmluZGV4ICsgMSwgdmluZGV4LCBjXSxcbiAgICAgICAgICB1djogW2Z1dnNbM10sIGZ1dnNbMl0sIGZ1dnNbMV0sIGZ1dnNbMF1dXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3VyZmFjZXMucHVzaCh7XG4gICAgICAgICAgZmFjZTogW3ZpbmRleCwgdmluZGV4ICsgMSwgdmluZGV4ICsgMiwgdmluZGV4ICsgMywgY10sXG4gICAgICAgICAgdXY6IFtmdXZzWzBdLCBmdXZzWzFdLCBmdXZzWzJdLCBmdXZzWzNdXVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRWb3hlbChpLCBqLCBrLCBkKSB7XG4gICAgaWYgKGQgPT09IDApIHtcbiAgICAgIHJldHVybiBkYXRhKGksIGosIGspO1xuICAgICAgLy8gcmV0dXJuIGRhdGFbayArIChqICsgaSAqIGRpbVswXSkgKiBkaW1bMV1dO1xuICAgIH0gZWxzZSBpZiAoZCA9PT0gMSkge1xuICAgICAgcmV0dXJuIGRhdGEoaywgaSwgaik7XG4gICAgICAvLyByZXR1cm4gZGF0YVtqICsgKGkgKyBrICogZGltWzBdKSAqIGRpbVsxXV07XG4gICAgfSBlbHNlIGlmIChkID09PSAyKSB7XG4gICAgICByZXR1cm4gZGF0YShqLCBrLCBpKTtcbiAgICAgIC8vIHJldHVybiBkYXRhW2kgKyAoayArIGogKiBkaW1bMF0pICogZGltWzFdXTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0VGV4dHVyZUlkKGIsIHNpZGUpIHtcbiAgICBpZiAoIWIpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIHZhciBtYXAgPSB2b3hlbFNpZGVUZXh0dXJlSWRzW2JdO1xuICAgIGlmIChtYXAgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGI7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coc2lkZSk7XG4gICAgLy8gY29uc29sZS5sb2cobWFwW3NpZGVdIHx8IGIpO1xuICAgIHJldHVybiBtYXBbc2lkZV0gfHwgYjtcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIHZlcnRpY2VzOiB2ZXJ0aWNlcyxcbiAgICBzdXJmYWNlczogc3VyZmFjZXNcbiAgfVxufTsiLCJ2YXIgVEhSRUUgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snVEhSRUUnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ1RIUkVFJ10gOiBudWxsKTtcbnZhciBncmF2aXR5VXRpbHMgPSByZXF1aXJlKCcuL2dyYXZpdHl1dGlscycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICB2YXIgbWFwID0ge307XG4gIHZhciBjb2cgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICB2YXIgZ3Jhdml0eUFtb3VudCA9IDAuMDU7XG5cbiAgZnVuY3Rpb24gb25BdHRhY2gob2JqZWN0LCBjb21wb25lbnQpIHtcbiAgICBpZihjb21wb25lbnQudHlwZSA9PT0gJ3JpZ2lkQm9keScpIHtcbiAgICAgIG1hcFtjb21wb25lbnQuX2lkXSA9IGNvbXBvbmVudDtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gb25EZXR0YWNoKG9iamVjdCwgY29tcG9uZW50KSB7XG4gICAgaWYoY29tcG9uZW50LnR5cGUgPT09ICdyaWdpZEJvZHknKSB7XG4gICAgICBkZWxldGUgbWFwW2NvbXBvbmVudC5faWRdO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiB0aWNrKCkge1xuICAgIHZhciBib2RpZXMgPSBbXTtcbiAgICB2YXIgZml4dHVyZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpZCBpbiBtYXApIHtcbiAgICAgIHZhciBib2R5ID0gbWFwW2lkXTtcbiAgICAgIGlmIChib2R5LmlzRml4dHVyZSkge1xuICAgICAgICBmaXh0dXJlcy5wdXNoKGJvZHkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYm9kaWVzLnB1c2goYm9keSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBib2RpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciByaWdpZEJvZHkgPSBib2RpZXNbaV07XG5cbiAgICAgIC8vIEFwcGx5IGdyYXZpdHlcbiAgICAgIHZhciBncmF2aXR5ID0gZ3Jhdml0eVV0aWxzLmdldEdyYXZpdHkocmlnaWRCb2R5Lm9iamVjdC5wb3NpdGlvbik7XG4gICAgICByaWdpZEJvZHkuZ3Jhdml0eSA9IGdyYXZpdHk7XG5cbiAgICAgIGlmIChyaWdpZEJvZHkuZ3JvdW5kZWQpIHtcbiAgICAgICAgdmFyIGdyYXZpdHlGb3JjZSA9IGdyYXZpdHkuZGlyLmNsb25lKCkuc2V0TGVuZ3RoKGdyYXZpdHlBbW91bnQpO1xuICAgICAgICByaWdpZEJvZHkuYXBwbHlGb3JjZShncmF2aXR5Rm9yY2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGdyYXZpdHlGb3JjZSA9IGdyYXZpdHkuZm9yY2VEaXIuY2xvbmUoKS5zZXRMZW5ndGgoZ3Jhdml0eUFtb3VudCk7XG4gICAgICAgIHJpZ2lkQm9keS5hcHBseUZvcmNlKGdyYXZpdHlGb3JjZSk7XG4gICAgICB9XG5cblxuICAgICAgLy8gQXBwbHkgYWNjZWxlcmF0aW9uIHRvIHZlbG9jaXR5XG4gICAgICByaWdpZEJvZHkudmVsb2NpdHkuYWRkKHJpZ2lkQm9keS5hY2NlbGVyYXRpb24pO1xuICAgICAgcmlnaWRCb2R5LnZlbG9jaXR5Lm11bHRpcGx5U2NhbGFyKHJpZ2lkQm9keS5mcmljdGlvbik7XG5cbiAgICAgIHJpZ2lkQm9keS5ncm91bmRlZCA9IGZhbHNlO1xuXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGZpeHR1cmVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIHZhciBmaXh0dXJlID0gZml4dHVyZXNbal07XG5cbiAgICAgICAgdmFyIHZlbG9jaXRpZXMgPSB7XG4gICAgICAgICAgJ3gnOiBuZXcgVEhSRUUuVmVjdG9yMyhyaWdpZEJvZHkudmVsb2NpdHkueCwgMCwgMCksXG4gICAgICAgICAgJ3knOiBuZXcgVEhSRUUuVmVjdG9yMygwLCByaWdpZEJvZHkudmVsb2NpdHkueSwgMCksXG4gICAgICAgICAgJ3onOiBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCByaWdpZEJvZHkudmVsb2NpdHkueilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwb3NpdGlvbiA9IHJpZ2lkQm9keS5vYmplY3QucG9zaXRpb24uY2xvbmUoKTtcbiAgICAgICAgZm9yICh2YXIgYXhpcyBpbiB2ZWxvY2l0aWVzKSB7XG4gICAgICAgICAgdmFyIHYgPSB2ZWxvY2l0aWVzW2F4aXNdO1xuICAgICAgICAgIHZhciByYXljYXN0ZXIgPSBuZXcgVEhSRUUuUmF5Y2FzdGVyKFxuICAgICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgICB2LmNsb25lKCkubm9ybWFsaXplKCksXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgdi5sZW5ndGgoKSArIDAuNVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICB2YXIgaW50ZXJzZWN0cyA9IHJheWNhc3Rlci5pbnRlcnNlY3RPYmplY3QoZml4dHVyZS5vYmplY3QsIHRydWUpO1xuICAgICAgICAgIGlmIChpbnRlcnNlY3RzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHZhciBpbnRlcnNlY3QgPSBpbnRlcnNlY3RzWzBdO1xuICAgICAgICAgICAgdmFyIG1hZyA9IGludGVyc2VjdC5kaXN0YW5jZSAtIDAuNTtcbiAgICAgICAgICAgIHJpZ2lkQm9keS52ZWxvY2l0eVtheGlzXSA9IHJpZ2lkQm9keS52ZWxvY2l0eVtheGlzXSA+IDAgPyBtYWcgOiAtbWFnO1xuICAgICAgICAgICAgaWYgKGF4aXMgPT09IGdyYXZpdHkuYXhpcykge1xuICAgICAgICAgICAgICByaWdpZEJvZHkuZ3JvdW5kZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHBvc2l0aW9uLmFkZCh2KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBBcHBseSB2ZWxvY2l0eVxuICAgICAgcmlnaWRCb2R5Lm9iamVjdC5wb3NpdGlvbi5hZGQocmlnaWRCb2R5LnZlbG9jaXR5KTtcblxuICAgICAgLy8gQ2xlYXIgYWNjZWxlcmF0aW9uXG4gICAgICByaWdpZEJvZHkuYWNjZWxlcmF0aW9uLnNldCgwLCAwLCAwKTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIHBoeXNpY3MgPSB7XG4gICAgb25BdHRhY2g6IG9uQXR0YWNoLFxuICAgIG9uRGV0dGFjaDogb25EZXR0YWNoLFxuICAgIHRpY2s6IHRpY2ssXG4gICAgYXBwOiBudWxsXG4gIH07XG5cbiAgcmV0dXJuIHBoeXNpY3M7XG59OyIsIi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxudmFyIGlzQXJyYXkgPSByZXF1aXJlKCdpcy1hcnJheScpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTIgLy8gbm90IHVzZWQgYnkgdGhpcyBpbXBsZW1lbnRhdGlvblxuXG52YXIgcm9vdFBhcmVudCA9IHt9XG5cbi8qKlxuICogSWYgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYDpcbiAqICAgPT09IHRydWUgICAgVXNlIFVpbnQ4QXJyYXkgaW1wbGVtZW50YXRpb24gKGZhc3Rlc3QpXG4gKiAgID09PSBmYWxzZSAgIFVzZSBPYmplY3QgaW1wbGVtZW50YXRpb24gKG1vc3QgY29tcGF0aWJsZSwgZXZlbiBJRTYpXG4gKlxuICogQnJvd3NlcnMgdGhhdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBhcmUgSUUgMTArLCBGaXJlZm94IDQrLCBDaHJvbWUgNyssIFNhZmFyaSA1LjErLFxuICogT3BlcmEgMTEuNissIGlPUyA0LjIrLlxuICpcbiAqIER1ZSB0byB2YXJpb3VzIGJyb3dzZXIgYnVncywgc29tZXRpbWVzIHRoZSBPYmplY3QgaW1wbGVtZW50YXRpb24gd2lsbCBiZSB1c2VkIGV2ZW5cbiAqIHdoZW4gdGhlIGJyb3dzZXIgc3VwcG9ydHMgdHlwZWQgYXJyYXlzLlxuICpcbiAqIE5vdGU6XG4gKlxuICogICAtIEZpcmVmb3ggNC0yOSBsYWNrcyBzdXBwb3J0IGZvciBhZGRpbmcgbmV3IHByb3BlcnRpZXMgdG8gYFVpbnQ4QXJyYXlgIGluc3RhbmNlcyxcbiAqICAgICBTZWU6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NTQzOC5cbiAqXG4gKiAgIC0gU2FmYXJpIDUtNyBsYWNrcyBzdXBwb3J0IGZvciBjaGFuZ2luZyB0aGUgYE9iamVjdC5wcm90b3R5cGUuY29uc3RydWN0b3JgIHByb3BlcnR5XG4gKiAgICAgb24gb2JqZWN0cy5cbiAqXG4gKiAgIC0gQ2hyb21lIDktMTAgaXMgbWlzc2luZyB0aGUgYFR5cGVkQXJyYXkucHJvdG90eXBlLnN1YmFycmF5YCBmdW5jdGlvbi5cbiAqXG4gKiAgIC0gSUUxMCBoYXMgYSBicm9rZW4gYFR5cGVkQXJyYXkucHJvdG90eXBlLnN1YmFycmF5YCBmdW5jdGlvbiB3aGljaCByZXR1cm5zIGFycmF5cyBvZlxuICogICAgIGluY29ycmVjdCBsZW5ndGggaW4gc29tZSBzaXR1YXRpb25zLlxuXG4gKiBXZSBkZXRlY3QgdGhlc2UgYnVnZ3kgYnJvd3NlcnMgYW5kIHNldCBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgIHRvIGBmYWxzZWAgc28gdGhleVxuICogZ2V0IHRoZSBPYmplY3QgaW1wbGVtZW50YXRpb24sIHdoaWNoIGlzIHNsb3dlciBidXQgYmVoYXZlcyBjb3JyZWN0bHkuXG4gKi9cbkJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUID0gKGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gQmFyICgpIHt9XG4gIHRyeSB7XG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KDEpXG4gICAgYXJyLmZvbyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH1cbiAgICBhcnIuY29uc3RydWN0b3IgPSBCYXJcbiAgICByZXR1cm4gYXJyLmZvbygpID09PSA0MiAmJiAvLyB0eXBlZCBhcnJheSBpbnN0YW5jZXMgY2FuIGJlIGF1Z21lbnRlZFxuICAgICAgICBhcnIuY29uc3RydWN0b3IgPT09IEJhciAmJiAvLyBjb25zdHJ1Y3RvciBjYW4gYmUgc2V0XG4gICAgICAgIHR5cGVvZiBhcnIuc3ViYXJyYXkgPT09ICdmdW5jdGlvbicgJiYgLy8gY2hyb21lIDktMTAgbGFjayBgc3ViYXJyYXlgXG4gICAgICAgIGFyci5zdWJhcnJheSgxLCAxKS5ieXRlTGVuZ3RoID09PSAwIC8vIGllMTAgaGFzIGJyb2tlbiBgc3ViYXJyYXlgXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufSkoKVxuXG5mdW5jdGlvbiBrTWF4TGVuZ3RoICgpIHtcbiAgcmV0dXJuIEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUXG4gICAgPyAweDdmZmZmZmZmXG4gICAgOiAweDNmZmZmZmZmXG59XG5cbi8qKlxuICogQ2xhc3M6IEJ1ZmZlclxuICogPT09PT09PT09PT09PVxuICpcbiAqIFRoZSBCdWZmZXIgY29uc3RydWN0b3IgcmV0dXJucyBpbnN0YW5jZXMgb2YgYFVpbnQ4QXJyYXlgIHRoYXQgYXJlIGF1Z21lbnRlZFxuICogd2l0aCBmdW5jdGlvbiBwcm9wZXJ0aWVzIGZvciBhbGwgdGhlIG5vZGUgYEJ1ZmZlcmAgQVBJIGZ1bmN0aW9ucy4gV2UgdXNlXG4gKiBgVWludDhBcnJheWAgc28gdGhhdCBzcXVhcmUgYnJhY2tldCBub3RhdGlvbiB3b3JrcyBhcyBleHBlY3RlZCAtLSBpdCByZXR1cm5zXG4gKiBhIHNpbmdsZSBvY3RldC5cbiAqXG4gKiBCeSBhdWdtZW50aW5nIHRoZSBpbnN0YW5jZXMsIHdlIGNhbiBhdm9pZCBtb2RpZnlpbmcgdGhlIGBVaW50OEFycmF5YFxuICogcHJvdG90eXBlLlxuICovXG5mdW5jdGlvbiBCdWZmZXIgKGFyZykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQnVmZmVyKSkge1xuICAgIC8vIEF2b2lkIGdvaW5nIHRocm91Z2ggYW4gQXJndW1lbnRzQWRhcHRvclRyYW1wb2xpbmUgaW4gdGhlIGNvbW1vbiBjYXNlLlxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkgcmV0dXJuIG5ldyBCdWZmZXIoYXJnLCBhcmd1bWVudHNbMV0pXG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoYXJnKVxuICB9XG5cbiAgdGhpcy5sZW5ndGggPSAwXG4gIHRoaXMucGFyZW50ID0gdW5kZWZpbmVkXG5cbiAgLy8gQ29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykge1xuICAgIHJldHVybiBmcm9tTnVtYmVyKHRoaXMsIGFyZylcbiAgfVxuXG4gIC8vIFNsaWdodGx5IGxlc3MgY29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBmcm9tU3RyaW5nKHRoaXMsIGFyZywgYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiAndXRmOCcpXG4gIH1cblxuICAvLyBVbnVzdWFsLlxuICByZXR1cm4gZnJvbU9iamVjdCh0aGlzLCBhcmcpXG59XG5cbmZ1bmN0aW9uIGZyb21OdW1iZXIgKHRoYXQsIGxlbmd0aCkge1xuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoIDwgMCA/IDAgOiBjaGVja2VkKGxlbmd0aCkgfCAwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdGhhdFtpXSA9IDBcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbVN0cmluZyAodGhhdCwgc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJyB8fCBlbmNvZGluZyA9PT0gJycpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgLy8gQXNzdW1wdGlvbjogYnl0ZUxlbmd0aCgpIHJldHVybiB2YWx1ZSBpcyBhbHdheXMgPCBrTWF4TGVuZ3RoLlxuICB2YXIgbGVuZ3RoID0gYnl0ZUxlbmd0aChzdHJpbmcsIGVuY29kaW5nKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcblxuICB0aGF0LndyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21PYmplY3QgKHRoYXQsIG9iamVjdCkge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKG9iamVjdCkpIHJldHVybiBmcm9tQnVmZmVyKHRoYXQsIG9iamVjdClcblxuICBpZiAoaXNBcnJheShvYmplY3QpKSByZXR1cm4gZnJvbUFycmF5KHRoYXQsIG9iamVjdClcblxuICBpZiAob2JqZWN0ID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdtdXN0IHN0YXJ0IHdpdGggbnVtYmVyLCBidWZmZXIsIGFycmF5IG9yIHN0cmluZycpXG4gIH1cblxuICBpZiAodHlwZW9mIEFycmF5QnVmZmVyICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmIChvYmplY3QuYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgIHJldHVybiBmcm9tVHlwZWRBcnJheSh0aGF0LCBvYmplY3QpXG4gICAgfVxuICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgcmV0dXJuIGZyb21BcnJheUJ1ZmZlcih0aGF0LCBvYmplY3QpXG4gICAgfVxuICB9XG5cbiAgaWYgKG9iamVjdC5sZW5ndGgpIHJldHVybiBmcm9tQXJyYXlMaWtlKHRoYXQsIG9iamVjdClcblxuICByZXR1cm4gZnJvbUpzb25PYmplY3QodGhhdCwgb2JqZWN0KVxufVxuXG5mdW5jdGlvbiBmcm9tQnVmZmVyICh0aGF0LCBidWZmZXIpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYnVmZmVyLmxlbmd0aCkgfCAwXG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG4gIGJ1ZmZlci5jb3B5KHRoYXQsIDAsIDAsIGxlbmd0aClcbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5ICh0aGF0LCBhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuLy8gRHVwbGljYXRlIG9mIGZyb21BcnJheSgpIHRvIGtlZXAgZnJvbUFycmF5KCkgbW9ub21vcnBoaWMuXG5mdW5jdGlvbiBmcm9tVHlwZWRBcnJheSAodGhhdCwgYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcbiAgLy8gVHJ1bmNhdGluZyB0aGUgZWxlbWVudHMgaXMgcHJvYmFibHkgbm90IHdoYXQgcGVvcGxlIGV4cGVjdCBmcm9tIHR5cGVkXG4gIC8vIGFycmF5cyB3aXRoIEJZVEVTX1BFUl9FTEVNRU5UID4gMSBidXQgaXQncyBjb21wYXRpYmxlIHdpdGggdGhlIGJlaGF2aW9yXG4gIC8vIG9mIHRoZSBvbGQgQnVmZmVyIGNvbnN0cnVjdG9yLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5QnVmZmVyICh0aGF0LCBhcnJheSkge1xuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSwgZm9yIGJlc3QgcGVyZm9ybWFuY2VcbiAgICBhcnJheS5ieXRlTGVuZ3RoXG4gICAgdGhhdCA9IEJ1ZmZlci5fYXVnbWVudChuZXcgVWludDhBcnJheShhcnJheSkpXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBhbiBvYmplY3QgaW5zdGFuY2Ugb2YgdGhlIEJ1ZmZlciBjbGFzc1xuICAgIHRoYXQgPSBmcm9tVHlwZWRBcnJheSh0aGF0LCBuZXcgVWludDhBcnJheShhcnJheSkpXG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5TGlrZSAodGhhdCwgYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIHRoYXRbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbi8vIERlc2VyaWFsaXplIHsgdHlwZTogJ0J1ZmZlcicsIGRhdGE6IFsxLDIsMywuLi5dIH0gaW50byBhIEJ1ZmZlciBvYmplY3QuXG4vLyBSZXR1cm5zIGEgemVyby1sZW5ndGggYnVmZmVyIGZvciBpbnB1dHMgdGhhdCBkb24ndCBjb25mb3JtIHRvIHRoZSBzcGVjLlxuZnVuY3Rpb24gZnJvbUpzb25PYmplY3QgKHRoYXQsIG9iamVjdCkge1xuICB2YXIgYXJyYXlcbiAgdmFyIGxlbmd0aCA9IDBcblxuICBpZiAob2JqZWN0LnR5cGUgPT09ICdCdWZmZXInICYmIGlzQXJyYXkob2JqZWN0LmRhdGEpKSB7XG4gICAgYXJyYXkgPSBvYmplY3QuZGF0YVxuICAgIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgfVxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICB0aGF0W2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBhbGxvY2F0ZSAodGhhdCwgbGVuZ3RoKSB7XG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlLCBmb3IgYmVzdCBwZXJmb3JtYW5jZVxuICAgIHRoYXQgPSBCdWZmZXIuX2F1Z21lbnQobmV3IFVpbnQ4QXJyYXkobGVuZ3RoKSlcbiAgfSBlbHNlIHtcbiAgICAvLyBGYWxsYmFjazogUmV0dXJuIGFuIG9iamVjdCBpbnN0YW5jZSBvZiB0aGUgQnVmZmVyIGNsYXNzXG4gICAgdGhhdC5sZW5ndGggPSBsZW5ndGhcbiAgICB0aGF0Ll9pc0J1ZmZlciA9IHRydWVcbiAgfVxuXG4gIHZhciBmcm9tUG9vbCA9IGxlbmd0aCAhPT0gMCAmJiBsZW5ndGggPD0gQnVmZmVyLnBvb2xTaXplID4+PiAxXG4gIGlmIChmcm9tUG9vbCkgdGhhdC5wYXJlbnQgPSByb290UGFyZW50XG5cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gY2hlY2tlZCAobGVuZ3RoKSB7XG4gIC8vIE5vdGU6IGNhbm5vdCB1c2UgYGxlbmd0aCA8IGtNYXhMZW5ndGhgIGhlcmUgYmVjYXVzZSB0aGF0IGZhaWxzIHdoZW5cbiAgLy8gbGVuZ3RoIGlzIE5hTiAod2hpY2ggaXMgb3RoZXJ3aXNlIGNvZXJjZWQgdG8gemVyby4pXG4gIGlmIChsZW5ndGggPj0ga01heExlbmd0aCgpKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gYWxsb2NhdGUgQnVmZmVyIGxhcmdlciB0aGFuIG1heGltdW0gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ3NpemU6IDB4JyArIGtNYXhMZW5ndGgoKS50b1N0cmluZygxNikgKyAnIGJ5dGVzJylcbiAgfVxuICByZXR1cm4gbGVuZ3RoIHwgMFxufVxuXG5mdW5jdGlvbiBTbG93QnVmZmVyIChzdWJqZWN0LCBlbmNvZGluZykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgU2xvd0J1ZmZlcikpIHJldHVybiBuZXcgU2xvd0J1ZmZlcihzdWJqZWN0LCBlbmNvZGluZylcblxuICB2YXIgYnVmID0gbmV3IEJ1ZmZlcihzdWJqZWN0LCBlbmNvZGluZylcbiAgZGVsZXRlIGJ1Zi5wYXJlbnRcbiAgcmV0dXJuIGJ1ZlxufVxuXG5CdWZmZXIuaXNCdWZmZXIgPSBmdW5jdGlvbiBpc0J1ZmZlciAoYikge1xuICByZXR1cm4gISEoYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyKVxufVxuXG5CdWZmZXIuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKGEsIGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYSkgfHwgIUJ1ZmZlci5pc0J1ZmZlcihiKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyBtdXN0IGJlIEJ1ZmZlcnMnKVxuICB9XG5cbiAgaWYgKGEgPT09IGIpIHJldHVybiAwXG5cbiAgdmFyIHggPSBhLmxlbmd0aFxuICB2YXIgeSA9IGIubGVuZ3RoXG5cbiAgdmFyIGkgPSAwXG4gIHZhciBsZW4gPSBNYXRoLm1pbih4LCB5KVxuICB3aGlsZSAoaSA8IGxlbikge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSBicmVha1xuXG4gICAgKytpXG4gIH1cblxuICBpZiAoaSAhPT0gbGVuKSB7XG4gICAgeCA9IGFbaV1cbiAgICB5ID0gYltpXVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG5CdWZmZXIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIGlzRW5jb2RpbmcgKGVuY29kaW5nKSB7XG4gIHN3aXRjaCAoU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICBjYXNlICdyYXcnOlxuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5CdWZmZXIuY29uY2F0ID0gZnVuY3Rpb24gY29uY2F0IChsaXN0LCBsZW5ndGgpIHtcbiAgaWYgKCFpc0FycmF5KGxpc3QpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdsaXN0IGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXkgb2YgQnVmZmVycy4nKVxuXG4gIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBuZXcgQnVmZmVyKDApXG4gIH1cblxuICB2YXIgaVxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBsZW5ndGggPSAwXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxlbmd0aCArPSBsaXN0W2ldLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIHZhciBidWYgPSBuZXcgQnVmZmVyKGxlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaXRlbSA9IGxpc3RbaV1cbiAgICBpdGVtLmNvcHkoYnVmLCBwb3MpXG4gICAgcG9zICs9IGl0ZW0ubGVuZ3RoXG4gIH1cbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2Ygc3RyaW5nICE9PSAnc3RyaW5nJykgc3RyaW5nID0gJycgKyBzdHJpbmdcblxuICB2YXIgbGVuID0gc3RyaW5nLmxlbmd0aFxuICBpZiAobGVuID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIFVzZSBhIGZvciBsb29wIHRvIGF2b2lkIHJlY3Vyc2lvblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgIC8vIERlcHJlY2F0ZWRcbiAgICAgIGNhc2UgJ3Jhdyc6XG4gICAgICBjYXNlICdyYXdzJzpcbiAgICAgICAgcmV0dXJuIGxlblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIGxlbiAqIDJcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBsZW4gPj4+IDFcbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHJldHVybiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aCAvLyBhc3N1bWUgdXRmOFxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuQnVmZmVyLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5cbi8vIHByZS1zZXQgZm9yIHZhbHVlcyB0aGF0IG1heSBleGlzdCBpbiB0aGUgZnV0dXJlXG5CdWZmZXIucHJvdG90eXBlLmxlbmd0aCA9IHVuZGVmaW5lZFxuQnVmZmVyLnByb3RvdHlwZS5wYXJlbnQgPSB1bmRlZmluZWRcblxuZnVuY3Rpb24gc2xvd1RvU3RyaW5nIChlbmNvZGluZywgc3RhcnQsIGVuZCkge1xuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuXG4gIHN0YXJ0ID0gc3RhcnQgfCAwXG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkIHx8IGVuZCA9PT0gSW5maW5pdHkgPyB0aGlzLmxlbmd0aCA6IGVuZCB8IDBcblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAoZW5kIDw9IHN0YXJ0KSByZXR1cm4gJydcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBiaW5hcnlTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHV0ZjE2bGVTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoZW5jb2RpbmcgKyAnJykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoIHwgMFxuICBpZiAobGVuZ3RoID09PSAwKSByZXR1cm4gJydcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiB1dGY4U2xpY2UodGhpcywgMCwgbGVuZ3RoKVxuICByZXR1cm4gc2xvd1RvU3RyaW5nLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiBlcXVhbHMgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIHRydWVcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpID09PSAwXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uIGluc3BlY3QgKCkge1xuICB2YXIgc3RyID0gJydcbiAgdmFyIG1heCA9IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVNcbiAgaWYgKHRoaXMubGVuZ3RoID4gMCkge1xuICAgIHN0ciA9IHRoaXMudG9TdHJpbmcoJ2hleCcsIDAsIG1heCkubWF0Y2goLy57Mn0vZykuam9pbignICcpXG4gICAgaWYgKHRoaXMubGVuZ3RoID4gbWF4KSBzdHIgKz0gJyAuLi4gJ1xuICB9XG4gIHJldHVybiAnPEJ1ZmZlciAnICsgc3RyICsgJz4nXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIDBcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIGluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCkge1xuICBpZiAoYnl0ZU9mZnNldCA+IDB4N2ZmZmZmZmYpIGJ5dGVPZmZzZXQgPSAweDdmZmZmZmZmXG4gIGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAtMHg4MDAwMDAwMCkgYnl0ZU9mZnNldCA9IC0weDgwMDAwMDAwXG4gIGJ5dGVPZmZzZXQgPj49IDBcblxuICBpZiAodGhpcy5sZW5ndGggPT09IDApIHJldHVybiAtMVxuICBpZiAoYnl0ZU9mZnNldCA+PSB0aGlzLmxlbmd0aCkgcmV0dXJuIC0xXG5cbiAgLy8gTmVnYXRpdmUgb2Zmc2V0cyBzdGFydCBmcm9tIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlclxuICBpZiAoYnl0ZU9mZnNldCA8IDApIGJ5dGVPZmZzZXQgPSBNYXRoLm1heCh0aGlzLmxlbmd0aCArIGJ5dGVPZmZzZXQsIDApXG5cbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgaWYgKHZhbC5sZW5ndGggPT09IDApIHJldHVybiAtMSAvLyBzcGVjaWFsIGNhc2U6IGxvb2tpbmcgZm9yIGVtcHR5IHN0cmluZyBhbHdheXMgZmFpbHNcbiAgICByZXR1cm4gU3RyaW5nLnByb3RvdHlwZS5pbmRleE9mLmNhbGwodGhpcywgdmFsLCBieXRlT2Zmc2V0KVxuICB9XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsKSkge1xuICAgIHJldHVybiBhcnJheUluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0KVxuICB9XG4gIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCAmJiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKHRoaXMsIHZhbCwgYnl0ZU9mZnNldClcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZih0aGlzLCBbIHZhbCBdLCBieXRlT2Zmc2V0KVxuICB9XG5cbiAgZnVuY3Rpb24gYXJyYXlJbmRleE9mIChhcnIsIHZhbCwgYnl0ZU9mZnNldCkge1xuICAgIHZhciBmb3VuZEluZGV4ID0gLTFcbiAgICBmb3IgKHZhciBpID0gMDsgYnl0ZU9mZnNldCArIGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhcnJbYnl0ZU9mZnNldCArIGldID09PSB2YWxbZm91bmRJbmRleCA9PT0gLTEgPyAwIDogaSAtIGZvdW5kSW5kZXhdKSB7XG4gICAgICAgIGlmIChmb3VuZEluZGV4ID09PSAtMSkgZm91bmRJbmRleCA9IGlcbiAgICAgICAgaWYgKGkgLSBmb3VuZEluZGV4ICsgMSA9PT0gdmFsLmxlbmd0aCkgcmV0dXJuIGJ5dGVPZmZzZXQgKyBmb3VuZEluZGV4XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3VuZEluZGV4ID0gLTFcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xXG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKCd2YWwgbXVzdCBiZSBzdHJpbmcsIG51bWJlciBvciBCdWZmZXInKVxufVxuXG4vLyBgZ2V0YCBpcyBkZXByZWNhdGVkXG5CdWZmZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCAob2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuZ2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy5yZWFkVUludDgob2Zmc2V0KVxufVxuXG4vLyBgc2V0YCBpcyBkZXByZWNhdGVkXG5CdWZmZXIucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldCAodiwgb2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuc2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy53cml0ZVVJbnQ4KHYsIG9mZnNldClcbn1cblxuZnVuY3Rpb24gaGV4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSBidWYubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cblxuICAvLyBtdXN0IGJlIGFuIGV2ZW4gbnVtYmVyIG9mIGRpZ2l0c1xuICB2YXIgc3RyTGVuID0gc3RyaW5nLmxlbmd0aFxuICBpZiAoc3RyTGVuICUgMiAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGhleCBzdHJpbmcnKVxuXG4gIGlmIChsZW5ndGggPiBzdHJMZW4gLyAyKSB7XG4gICAgbGVuZ3RoID0gc3RyTGVuIC8gMlxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgcGFyc2VkID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGlmIChpc05hTihwYXJzZWQpKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaGV4IHN0cmluZycpXG4gICAgYnVmW29mZnNldCArIGldID0gcGFyc2VkXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gdXRmOFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiaW5hcnlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBhc2NpaVdyaXRlKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIHVjczJXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjE2bGVUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiB3cml0ZSAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZylcbiAgaWYgKG9mZnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBvZmZzZXRbLCBsZW5ndGhdWywgZW5jb2RpbmddKVxuICB9IGVsc2UgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gICAgaWYgKGlzRmluaXRlKGxlbmd0aCkpIHtcbiAgICAgIGxlbmd0aCA9IGxlbmd0aCB8IDBcbiAgICAgIGlmIChlbmNvZGluZyA9PT0gdW5kZWZpbmVkKSBlbmNvZGluZyA9ICd1dGY4J1xuICAgIH0gZWxzZSB7XG4gICAgICBlbmNvZGluZyA9IGxlbmd0aFxuICAgICAgbGVuZ3RoID0gdW5kZWZpbmVkXG4gICAgfVxuICAvLyBsZWdhY3kgd3JpdGUoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0LCBsZW5ndGgpIC0gcmVtb3ZlIGluIHYwLjEzXG4gIH0gZWxzZSB7XG4gICAgdmFyIHN3YXAgPSBlbmNvZGluZ1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgb2Zmc2V0ID0gbGVuZ3RoIHwgMFxuICAgIGxlbmd0aCA9IHN3YXBcbiAgfVxuXG4gIHZhciByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldFxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbGVuZ3RoID4gcmVtYWluaW5nKSBsZW5ndGggPSByZW1haW5pbmdcblxuICBpZiAoKHN0cmluZy5sZW5ndGggPiAwICYmIChsZW5ndGggPCAwIHx8IG9mZnNldCA8IDApKSB8fCBvZmZzZXQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdhdHRlbXB0IHRvIHdyaXRlIG91dHNpZGUgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gYmluYXJ5V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgLy8gV2FybmluZzogbWF4TGVuZ3RoIG5vdCB0YWtlbiBpbnRvIGFjY291bnQgaW4gYmFzZTY0V3JpdGVcbiAgICAgICAgcmV0dXJuIGJhc2U2NFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1Y3MyV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gdG9KU09OICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG5mdW5jdGlvbiBiYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gdXRmOFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuICB2YXIgcmVzID0gW11cblxuICB2YXIgaSA9IHN0YXJ0XG4gIHdoaWxlIChpIDwgZW5kKSB7XG4gICAgdmFyIGZpcnN0Qnl0ZSA9IGJ1ZltpXVxuICAgIHZhciBjb2RlUG9pbnQgPSBudWxsXG4gICAgdmFyIGJ5dGVzUGVyU2VxdWVuY2UgPSAoZmlyc3RCeXRlID4gMHhFRikgPyA0XG4gICAgICA6IChmaXJzdEJ5dGUgPiAweERGKSA/IDNcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4QkYpID8gMlxuICAgICAgOiAxXG5cbiAgICBpZiAoaSArIGJ5dGVzUGVyU2VxdWVuY2UgPD0gZW5kKSB7XG4gICAgICB2YXIgc2Vjb25kQnl0ZSwgdGhpcmRCeXRlLCBmb3VydGhCeXRlLCB0ZW1wQ29kZVBvaW50XG5cbiAgICAgIHN3aXRjaCAoYnl0ZXNQZXJTZXF1ZW5jZSkge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgaWYgKGZpcnN0Qnl0ZSA8IDB4ODApIHtcbiAgICAgICAgICAgIGNvZGVQb2ludCA9IGZpcnN0Qnl0ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweDFGKSA8PCAweDYgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0YpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHhDIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAodGhpcmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3RkYgJiYgKHRlbXBDb2RlUG9pbnQgPCAweEQ4MDAgfHwgdGVtcENvZGVQb2ludCA+IDB4REZGRikpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgZm91cnRoQnl0ZSA9IGJ1ZltpICsgM11cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKGZvdXJ0aEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4MTIgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4QyB8ICh0aGlyZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAoZm91cnRoQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4RkZGRiAmJiB0ZW1wQ29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29kZVBvaW50ID09PSBudWxsKSB7XG4gICAgICAvLyB3ZSBkaWQgbm90IGdlbmVyYXRlIGEgdmFsaWQgY29kZVBvaW50IHNvIGluc2VydCBhXG4gICAgICAvLyByZXBsYWNlbWVudCBjaGFyIChVK0ZGRkQpIGFuZCBhZHZhbmNlIG9ubHkgMSBieXRlXG4gICAgICBjb2RlUG9pbnQgPSAweEZGRkRcbiAgICAgIGJ5dGVzUGVyU2VxdWVuY2UgPSAxXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPiAweEZGRkYpIHtcbiAgICAgIC8vIGVuY29kZSB0byB1dGYxNiAoc3Vycm9nYXRlIHBhaXIgZGFuY2UpXG4gICAgICBjb2RlUG9pbnQgLT0gMHgxMDAwMFxuICAgICAgcmVzLnB1c2goY29kZVBvaW50ID4+PiAxMCAmIDB4M0ZGIHwgMHhEODAwKVxuICAgICAgY29kZVBvaW50ID0gMHhEQzAwIHwgY29kZVBvaW50ICYgMHgzRkZcbiAgICB9XG5cbiAgICByZXMucHVzaChjb2RlUG9pbnQpXG4gICAgaSArPSBieXRlc1BlclNlcXVlbmNlXG4gIH1cblxuICByZXR1cm4gZGVjb2RlQ29kZVBvaW50c0FycmF5KHJlcylcbn1cblxuLy8gQmFzZWQgb24gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjI3NDcyNzIvNjgwNzQyLCB0aGUgYnJvd3NlciB3aXRoXG4vLyB0aGUgbG93ZXN0IGxpbWl0IGlzIENocm9tZSwgd2l0aCAweDEwMDAwIGFyZ3MuXG4vLyBXZSBnbyAxIG1hZ25pdHVkZSBsZXNzLCBmb3Igc2FmZXR5XG52YXIgTUFYX0FSR1VNRU5UU19MRU5HVEggPSAweDEwMDBcblxuZnVuY3Rpb24gZGVjb2RlQ29kZVBvaW50c0FycmF5IChjb2RlUG9pbnRzKSB7XG4gIHZhciBsZW4gPSBjb2RlUG9pbnRzLmxlbmd0aFxuICBpZiAobGVuIDw9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjb2RlUG9pbnRzKSAvLyBhdm9pZCBleHRyYSBzbGljZSgpXG4gIH1cblxuICAvLyBEZWNvZGUgaW4gY2h1bmtzIHRvIGF2b2lkIFwiY2FsbCBzdGFjayBzaXplIGV4Y2VlZGVkXCIuXG4gIHZhciByZXMgPSAnJ1xuICB2YXIgaSA9IDBcbiAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShcbiAgICAgIFN0cmluZyxcbiAgICAgIGNvZGVQb2ludHMuc2xpY2UoaSwgaSArPSBNQVhfQVJHVU1FTlRTX0xFTkdUSClcbiAgICApXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSAmIDB4N0YpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBiaW5hcnlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBoZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBieXRlcyA9IGJ1Zi5zbGljZShzdGFydCwgZW5kKVxuICB2YXIgcmVzID0gJydcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgYnl0ZXNbaSArIDFdICogMjU2KVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uIHNsaWNlIChzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBzdGFydCA9IH5+c3RhcnRcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyBsZW4gOiB+fmVuZFxuXG4gIGlmIChzdGFydCA8IDApIHtcbiAgICBzdGFydCArPSBsZW5cbiAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgfSBlbHNlIGlmIChzdGFydCA+IGxlbikge1xuICAgIHN0YXJ0ID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgMCkge1xuICAgIGVuZCArPSBsZW5cbiAgICBpZiAoZW5kIDwgMCkgZW5kID0gMFxuICB9IGVsc2UgaWYgKGVuZCA+IGxlbikge1xuICAgIGVuZCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIHZhciBuZXdCdWZcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgbmV3QnVmID0gQnVmZmVyLl9hdWdtZW50KHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZCkpXG4gIH0gZWxzZSB7XG4gICAgdmFyIHNsaWNlTGVuID0gZW5kIC0gc3RhcnRcbiAgICBuZXdCdWYgPSBuZXcgQnVmZmVyKHNsaWNlTGVuLCB1bmRlZmluZWQpXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzbGljZUxlbjsgaSsrKSB7XG4gICAgICBuZXdCdWZbaV0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH1cblxuICBpZiAobmV3QnVmLmxlbmd0aCkgbmV3QnVmLnBhcmVudCA9IHRoaXMucGFyZW50IHx8IHRoaXNcblxuICByZXR1cm4gbmV3QnVmXG59XG5cbi8qXG4gKiBOZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IGJ1ZmZlciBpc24ndCB0cnlpbmcgdG8gd3JpdGUgb3V0IG9mIGJvdW5kcy5cbiAqL1xuZnVuY3Rpb24gY2hlY2tPZmZzZXQgKG9mZnNldCwgZXh0LCBsZW5ndGgpIHtcbiAgaWYgKChvZmZzZXQgJSAxKSAhPT0gMCB8fCBvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb2Zmc2V0IGlzIG5vdCB1aW50JylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RyeWluZyB0byBhY2Nlc3MgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50TEUgPSBmdW5jdGlvbiByZWFkVUludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50QkUgPSBmdW5jdGlvbiByZWFkVUludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuICB9XG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXVxuICB2YXIgbXVsID0gMVxuICB3aGlsZSAoYnl0ZUxlbmd0aCA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQ4ID0gZnVuY3Rpb24gcmVhZFVJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbiByZWFkVUludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkJFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDgpIHwgdGhpc1tvZmZzZXQgKyAxXVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAoKHRoaXNbb2Zmc2V0XSkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpKSArXG4gICAgICAodGhpc1tvZmZzZXQgKyAzXSAqIDB4MTAwMDAwMClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyQkUgPSBmdW5jdGlvbiByZWFkVUludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSAqIDB4MTAwMDAwMCkgK1xuICAgICgodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICB0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRMRSA9IGZ1bmN0aW9uIHJlYWRJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRCRSA9IGZ1bmN0aW9uIHJlYWRJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aFxuICB2YXIgbXVsID0gMVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWldXG4gIHdoaWxlIChpID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0taV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQ4ID0gZnVuY3Rpb24gcmVhZEludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgaWYgKCEodGhpc1tvZmZzZXRdICYgMHg4MCkpIHJldHVybiAodGhpc1tvZmZzZXRdKVxuICByZXR1cm4gKCgweGZmIC0gdGhpc1tvZmZzZXRdICsgMSkgKiAtMSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiByZWFkSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAxXSB8ICh0aGlzW29mZnNldF0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gcmVhZEludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDNdIDw8IDI0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkJFID0gZnVuY3Rpb24gcmVhZEludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCAyNCkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gcmVhZEZsb2F0TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gcmVhZEZsb2F0QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlTEUgPSBmdW5jdGlvbiByZWFkRG91YmxlTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDUyLCA4KVxufVxuXG5mdW5jdGlvbiBjaGVja0ludCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2J1ZmZlciBtdXN0IGJlIGEgQnVmZmVyIGluc3RhbmNlJylcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndmFsdWUgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlVUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCksIDApXG5cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlVUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCksIDApXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVVSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweGZmLCAwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB2YWx1ZSA9IE1hdGguZmxvb3IodmFsdWUpXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbmZ1bmN0aW9uIG9iamVjdFdyaXRlVUludDE2IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbikge1xuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZiArIHZhbHVlICsgMVxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGJ1Zi5sZW5ndGggLSBvZmZzZXQsIDIpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID0gKHZhbHVlICYgKDB4ZmYgPDwgKDggKiAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSkpKSA+Pj5cbiAgICAgIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpICogOFxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSB2YWx1ZVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbmZ1bmN0aW9uIG9iamVjdFdyaXRlVUludDMyIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbikge1xuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihidWYubGVuZ3RoIC0gb2Zmc2V0LCA0KTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9ICh2YWx1ZSA+Pj4gKGxpdHRsZUVuZGlhbiA/IGkgOiAzIC0gaSkgKiA4KSAmIDB4ZmZcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSB2YWx1ZVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSAwXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSB2YWx1ZSA8IDAgPyAxIDogMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50QkUgPSBmdW5jdGlvbiB3cml0ZUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IHZhbHVlIDwgMCA/IDEgOiAwXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDggPSBmdW5jdGlvbiB3cml0ZUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHg3ZiwgLTB4ODApXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHZhbHVlID0gTWF0aC5mbG9vcih2YWx1ZSlcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmICsgdmFsdWUgKyAxXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9IHZhbHVlXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSB2YWx1ZVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbmZ1bmN0aW9uIGNoZWNrSUVFRTc1NCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICh2YWx1ZSA+IG1heCB8fCB2YWx1ZSA8IG1pbikgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3ZhbHVlIGlzIG91dCBvZiBib3VuZHMnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuZnVuY3Rpb24gd3JpdGVGbG9hdCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA0LCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA4LCAxLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCwgLTEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxuICByZXR1cm4gb2Zmc2V0ICsgOFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIGNvcHkgKHRhcmdldCwgdGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kICYmIGVuZCAhPT0gMCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldFN0YXJ0ID49IHRhcmdldC5sZW5ndGgpIHRhcmdldFN0YXJ0ID0gdGFyZ2V0Lmxlbmd0aFxuICBpZiAoIXRhcmdldFN0YXJ0KSB0YXJnZXRTdGFydCA9IDBcbiAgaWYgKGVuZCA+IDAgJiYgZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm4gMFxuICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBGYXRhbCBlcnJvciBjb25kaXRpb25zXG4gIGlmICh0YXJnZXRTdGFydCA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIH1cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZVN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBpZiAoZW5kIDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgPCBlbmQgLSBzdGFydCkge1xuICAgIGVuZCA9IHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCArIHN0YXJ0XG4gIH1cblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcbiAgdmFyIGlcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHN0YXJ0IDwgdGFyZ2V0U3RhcnQgJiYgdGFyZ2V0U3RhcnQgPCBlbmQpIHtcbiAgICAvLyBkZXNjZW5kaW5nIGNvcHkgZnJvbSBlbmRcbiAgICBmb3IgKGkgPSBsZW4gLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSBpZiAobGVuIDwgMTAwMCB8fCAhQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBhc2NlbmRpbmcgY29weSBmcm9tIHN0YXJ0XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0YXJnZXQuX3NldCh0aGlzLnN1YmFycmF5KHN0YXJ0LCBzdGFydCArIGxlbiksIHRhcmdldFN0YXJ0KVxuICB9XG5cbiAgcmV0dXJuIGxlblxufVxuXG4vLyBmaWxsKHZhbHVlLCBzdGFydD0wLCBlbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uIGZpbGwgKHZhbHVlLCBzdGFydCwgZW5kKSB7XG4gIGlmICghdmFsdWUpIHZhbHVlID0gMFxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQpIGVuZCA9IHRoaXMubGVuZ3RoXG5cbiAgaWYgKGVuZCA8IHN0YXJ0KSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignZW5kIDwgc3RhcnQnKVxuXG4gIC8vIEZpbGwgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuXG4gIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3N0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBpZiAoZW5kIDwgMCB8fCBlbmQgPiB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2VuZCBvdXQgb2YgYm91bmRzJylcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIHRoaXNbaV0gPSB2YWx1ZVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgYnl0ZXMgPSB1dGY4VG9CeXRlcyh2YWx1ZS50b1N0cmluZygpKVxuICAgIHZhciBsZW4gPSBieXRlcy5sZW5ndGhcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gYnl0ZXNbaSAlIGxlbl1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgYEFycmF5QnVmZmVyYCB3aXRoIHRoZSAqY29waWVkKiBtZW1vcnkgb2YgdGhlIGJ1ZmZlciBpbnN0YW5jZS5cbiAqIEFkZGVkIGluIE5vZGUgMC4xMi4gT25seSBhdmFpbGFibGUgaW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0IEFycmF5QnVmZmVyLlxuICovXG5CdWZmZXIucHJvdG90eXBlLnRvQXJyYXlCdWZmZXIgPSBmdW5jdGlvbiB0b0FycmF5QnVmZmVyICgpIHtcbiAgaWYgKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgICAgcmV0dXJuIChuZXcgQnVmZmVyKHRoaXMpKS5idWZmZXJcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGJ1ZiA9IG5ldyBVaW50OEFycmF5KHRoaXMubGVuZ3RoKVxuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGJ1Zi5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgICBidWZbaV0gPSB0aGlzW2ldXG4gICAgICB9XG4gICAgICByZXR1cm4gYnVmLmJ1ZmZlclxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdCdWZmZXIudG9BcnJheUJ1ZmZlciBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlcicpXG4gIH1cbn1cblxuLy8gSEVMUEVSIEZVTkNUSU9OU1xuLy8gPT09PT09PT09PT09PT09PVxuXG52YXIgQlAgPSBCdWZmZXIucHJvdG90eXBlXG5cbi8qKlxuICogQXVnbWVudCBhIFVpbnQ4QXJyYXkgKmluc3RhbmNlKiAobm90IHRoZSBVaW50OEFycmF5IGNsYXNzISkgd2l0aCBCdWZmZXIgbWV0aG9kc1xuICovXG5CdWZmZXIuX2F1Z21lbnQgPSBmdW5jdGlvbiBfYXVnbWVudCAoYXJyKSB7XG4gIGFyci5jb25zdHJ1Y3RvciA9IEJ1ZmZlclxuICBhcnIuX2lzQnVmZmVyID0gdHJ1ZVxuXG4gIC8vIHNhdmUgcmVmZXJlbmNlIHRvIG9yaWdpbmFsIFVpbnQ4QXJyYXkgc2V0IG1ldGhvZCBiZWZvcmUgb3ZlcndyaXRpbmdcbiAgYXJyLl9zZXQgPSBhcnIuc2V0XG5cbiAgLy8gZGVwcmVjYXRlZFxuICBhcnIuZ2V0ID0gQlAuZ2V0XG4gIGFyci5zZXQgPSBCUC5zZXRcblxuICBhcnIud3JpdGUgPSBCUC53cml0ZVxuICBhcnIudG9TdHJpbmcgPSBCUC50b1N0cmluZ1xuICBhcnIudG9Mb2NhbGVTdHJpbmcgPSBCUC50b1N0cmluZ1xuICBhcnIudG9KU09OID0gQlAudG9KU09OXG4gIGFyci5lcXVhbHMgPSBCUC5lcXVhbHNcbiAgYXJyLmNvbXBhcmUgPSBCUC5jb21wYXJlXG4gIGFyci5pbmRleE9mID0gQlAuaW5kZXhPZlxuICBhcnIuY29weSA9IEJQLmNvcHlcbiAgYXJyLnNsaWNlID0gQlAuc2xpY2VcbiAgYXJyLnJlYWRVSW50TEUgPSBCUC5yZWFkVUludExFXG4gIGFyci5yZWFkVUludEJFID0gQlAucmVhZFVJbnRCRVxuICBhcnIucmVhZFVJbnQ4ID0gQlAucmVhZFVJbnQ4XG4gIGFyci5yZWFkVUludDE2TEUgPSBCUC5yZWFkVUludDE2TEVcbiAgYXJyLnJlYWRVSW50MTZCRSA9IEJQLnJlYWRVSW50MTZCRVxuICBhcnIucmVhZFVJbnQzMkxFID0gQlAucmVhZFVJbnQzMkxFXG4gIGFyci5yZWFkVUludDMyQkUgPSBCUC5yZWFkVUludDMyQkVcbiAgYXJyLnJlYWRJbnRMRSA9IEJQLnJlYWRJbnRMRVxuICBhcnIucmVhZEludEJFID0gQlAucmVhZEludEJFXG4gIGFyci5yZWFkSW50OCA9IEJQLnJlYWRJbnQ4XG4gIGFyci5yZWFkSW50MTZMRSA9IEJQLnJlYWRJbnQxNkxFXG4gIGFyci5yZWFkSW50MTZCRSA9IEJQLnJlYWRJbnQxNkJFXG4gIGFyci5yZWFkSW50MzJMRSA9IEJQLnJlYWRJbnQzMkxFXG4gIGFyci5yZWFkSW50MzJCRSA9IEJQLnJlYWRJbnQzMkJFXG4gIGFyci5yZWFkRmxvYXRMRSA9IEJQLnJlYWRGbG9hdExFXG4gIGFyci5yZWFkRmxvYXRCRSA9IEJQLnJlYWRGbG9hdEJFXG4gIGFyci5yZWFkRG91YmxlTEUgPSBCUC5yZWFkRG91YmxlTEVcbiAgYXJyLnJlYWREb3VibGVCRSA9IEJQLnJlYWREb3VibGVCRVxuICBhcnIud3JpdGVVSW50OCA9IEJQLndyaXRlVUludDhcbiAgYXJyLndyaXRlVUludExFID0gQlAud3JpdGVVSW50TEVcbiAgYXJyLndyaXRlVUludEJFID0gQlAud3JpdGVVSW50QkVcbiAgYXJyLndyaXRlVUludDE2TEUgPSBCUC53cml0ZVVJbnQxNkxFXG4gIGFyci53cml0ZVVJbnQxNkJFID0gQlAud3JpdGVVSW50MTZCRVxuICBhcnIud3JpdGVVSW50MzJMRSA9IEJQLndyaXRlVUludDMyTEVcbiAgYXJyLndyaXRlVUludDMyQkUgPSBCUC53cml0ZVVJbnQzMkJFXG4gIGFyci53cml0ZUludExFID0gQlAud3JpdGVJbnRMRVxuICBhcnIud3JpdGVJbnRCRSA9IEJQLndyaXRlSW50QkVcbiAgYXJyLndyaXRlSW50OCA9IEJQLndyaXRlSW50OFxuICBhcnIud3JpdGVJbnQxNkxFID0gQlAud3JpdGVJbnQxNkxFXG4gIGFyci53cml0ZUludDE2QkUgPSBCUC53cml0ZUludDE2QkVcbiAgYXJyLndyaXRlSW50MzJMRSA9IEJQLndyaXRlSW50MzJMRVxuICBhcnIud3JpdGVJbnQzMkJFID0gQlAud3JpdGVJbnQzMkJFXG4gIGFyci53cml0ZUZsb2F0TEUgPSBCUC53cml0ZUZsb2F0TEVcbiAgYXJyLndyaXRlRmxvYXRCRSA9IEJQLndyaXRlRmxvYXRCRVxuICBhcnIud3JpdGVEb3VibGVMRSA9IEJQLndyaXRlRG91YmxlTEVcbiAgYXJyLndyaXRlRG91YmxlQkUgPSBCUC53cml0ZURvdWJsZUJFXG4gIGFyci5maWxsID0gQlAuZmlsbFxuICBhcnIuaW5zcGVjdCA9IEJQLmluc3BlY3RcbiAgYXJyLnRvQXJyYXlCdWZmZXIgPSBCUC50b0FycmF5QnVmZmVyXG5cbiAgcmV0dXJuIGFyclxufVxuXG52YXIgSU5WQUxJRF9CQVNFNjRfUkUgPSAvW14rXFwvMC05QS1aYS16LV9dL2dcblxuZnVuY3Rpb24gYmFzZTY0Y2xlYW4gKHN0cikge1xuICAvLyBOb2RlIHN0cmlwcyBvdXQgaW52YWxpZCBjaGFyYWN0ZXJzIGxpa2UgXFxuIGFuZCBcXHQgZnJvbSB0aGUgc3RyaW5nLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgc3RyID0gc3RyaW5ndHJpbShzdHIpLnJlcGxhY2UoSU5WQUxJRF9CQVNFNjRfUkUsICcnKVxuICAvLyBOb2RlIGNvbnZlcnRzIHN0cmluZ3Mgd2l0aCBsZW5ndGggPCAyIHRvICcnXG4gIGlmIChzdHIubGVuZ3RoIDwgMikgcmV0dXJuICcnXG4gIC8vIE5vZGUgYWxsb3dzIGZvciBub24tcGFkZGVkIGJhc2U2NCBzdHJpbmdzIChtaXNzaW5nIHRyYWlsaW5nID09PSksIGJhc2U2NC1qcyBkb2VzIG5vdFxuICB3aGlsZSAoc3RyLmxlbmd0aCAlIDQgIT09IDApIHtcbiAgICBzdHIgPSBzdHIgKyAnPSdcbiAgfVxuICByZXR1cm4gc3RyXG59XG5cbmZ1bmN0aW9uIHN0cmluZ3RyaW0gKHN0cikge1xuICBpZiAoc3RyLnRyaW0pIHJldHVybiBzdHIudHJpbSgpXG4gIHJldHVybiBzdHIucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpXG59XG5cbmZ1bmN0aW9uIHRvSGV4IChuKSB7XG4gIGlmIChuIDwgMTYpIHJldHVybiAnMCcgKyBuLnRvU3RyaW5nKDE2KVxuICByZXR1cm4gbi50b1N0cmluZygxNilcbn1cblxuZnVuY3Rpb24gdXRmOFRvQnl0ZXMgKHN0cmluZywgdW5pdHMpIHtcbiAgdW5pdHMgPSB1bml0cyB8fCBJbmZpbml0eVxuICB2YXIgY29kZVBvaW50XG4gIHZhciBsZW5ndGggPSBzdHJpbmcubGVuZ3RoXG4gIHZhciBsZWFkU3Vycm9nYXRlID0gbnVsbFxuICB2YXIgYnl0ZXMgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBjb2RlUG9pbnQgPSBzdHJpbmcuY2hhckNvZGVBdChpKVxuXG4gICAgLy8gaXMgc3Vycm9nYXRlIGNvbXBvbmVudFxuICAgIGlmIChjb2RlUG9pbnQgPiAweEQ3RkYgJiYgY29kZVBvaW50IDwgMHhFMDAwKSB7XG4gICAgICAvLyBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCFsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAgIC8vIG5vIGxlYWQgeWV0XG4gICAgICAgIGlmIChjb2RlUG9pbnQgPiAweERCRkYpIHtcbiAgICAgICAgICAvLyB1bmV4cGVjdGVkIHRyYWlsXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfSBlbHNlIGlmIChpICsgMSA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgLy8gdW5wYWlyZWQgbGVhZFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YWxpZCBsZWFkXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyAyIGxlYWRzIGluIGEgcm93XG4gICAgICBpZiAoY29kZVBvaW50IDwgMHhEQzAwKSB7XG4gICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIHZhbGlkIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICBjb2RlUG9pbnQgPSBsZWFkU3Vycm9nYXRlIC0gMHhEODAwIDw8IDEwIHwgY29kZVBvaW50IC0gMHhEQzAwIHwgMHgxMDAwMFxuICAgIH0gZWxzZSBpZiAobGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgLy8gdmFsaWQgYm1wIGNoYXIsIGJ1dCBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgfVxuXG4gICAgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcblxuICAgIC8vIGVuY29kZSB1dGY4XG4gICAgaWYgKGNvZGVQb2ludCA8IDB4ODApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMSkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChjb2RlUG9pbnQpXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDgwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2IHwgMHhDMCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyB8IDB4RTAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDQpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDEyIHwgMHhGMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb2RlIHBvaW50JylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnl0ZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0ciwgdW5pdHMpIHtcbiAgdmFyIGMsIGhpLCBsb1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcblxuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KGJhc2U2NGNsZWFuKHN0cikpXG59XG5cbmZ1bmN0aW9uIGJsaXRCdWZmZXIgKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKSBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG4iLCJ2YXIgbG9va3VwID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nO1xuXG47KGZ1bmN0aW9uIChleHBvcnRzKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuICB2YXIgQXJyID0gKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJylcbiAgICA/IFVpbnQ4QXJyYXlcbiAgICA6IEFycmF5XG5cblx0dmFyIFBMVVMgICA9ICcrJy5jaGFyQ29kZUF0KDApXG5cdHZhciBTTEFTSCAgPSAnLycuY2hhckNvZGVBdCgwKVxuXHR2YXIgTlVNQkVSID0gJzAnLmNoYXJDb2RlQXQoMClcblx0dmFyIExPV0VSICA9ICdhJy5jaGFyQ29kZUF0KDApXG5cdHZhciBVUFBFUiAgPSAnQScuY2hhckNvZGVBdCgwKVxuXHR2YXIgUExVU19VUkxfU0FGRSA9ICctJy5jaGFyQ29kZUF0KDApXG5cdHZhciBTTEFTSF9VUkxfU0FGRSA9ICdfJy5jaGFyQ29kZUF0KDApXG5cblx0ZnVuY3Rpb24gZGVjb2RlIChlbHQpIHtcblx0XHR2YXIgY29kZSA9IGVsdC5jaGFyQ29kZUF0KDApXG5cdFx0aWYgKGNvZGUgPT09IFBMVVMgfHxcblx0XHQgICAgY29kZSA9PT0gUExVU19VUkxfU0FGRSlcblx0XHRcdHJldHVybiA2MiAvLyAnKydcblx0XHRpZiAoY29kZSA9PT0gU0xBU0ggfHxcblx0XHQgICAgY29kZSA9PT0gU0xBU0hfVVJMX1NBRkUpXG5cdFx0XHRyZXR1cm4gNjMgLy8gJy8nXG5cdFx0aWYgKGNvZGUgPCBOVU1CRVIpXG5cdFx0XHRyZXR1cm4gLTEgLy9ubyBtYXRjaFxuXHRcdGlmIChjb2RlIDwgTlVNQkVSICsgMTApXG5cdFx0XHRyZXR1cm4gY29kZSAtIE5VTUJFUiArIDI2ICsgMjZcblx0XHRpZiAoY29kZSA8IFVQUEVSICsgMjYpXG5cdFx0XHRyZXR1cm4gY29kZSAtIFVQUEVSXG5cdFx0aWYgKGNvZGUgPCBMT1dFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBMT1dFUiArIDI2XG5cdH1cblxuXHRmdW5jdGlvbiBiNjRUb0J5dGVBcnJheSAoYjY0KSB7XG5cdFx0dmFyIGksIGosIGwsIHRtcCwgcGxhY2VIb2xkZXJzLCBhcnJcblxuXHRcdGlmIChiNjQubGVuZ3RoICUgNCA+IDApIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdHJpbmcuIExlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNCcpXG5cdFx0fVxuXG5cdFx0Ly8gdGhlIG51bWJlciBvZiBlcXVhbCBzaWducyAocGxhY2UgaG9sZGVycylcblx0XHQvLyBpZiB0aGVyZSBhcmUgdHdvIHBsYWNlaG9sZGVycywgdGhhbiB0aGUgdHdvIGNoYXJhY3RlcnMgYmVmb3JlIGl0XG5cdFx0Ly8gcmVwcmVzZW50IG9uZSBieXRlXG5cdFx0Ly8gaWYgdGhlcmUgaXMgb25seSBvbmUsIHRoZW4gdGhlIHRocmVlIGNoYXJhY3RlcnMgYmVmb3JlIGl0IHJlcHJlc2VudCAyIGJ5dGVzXG5cdFx0Ly8gdGhpcyBpcyBqdXN0IGEgY2hlYXAgaGFjayB0byBub3QgZG8gaW5kZXhPZiB0d2ljZVxuXHRcdHZhciBsZW4gPSBiNjQubGVuZ3RoXG5cdFx0cGxhY2VIb2xkZXJzID0gJz0nID09PSBiNjQuY2hhckF0KGxlbiAtIDIpID8gMiA6ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAxKSA/IDEgOiAwXG5cblx0XHQvLyBiYXNlNjQgaXMgNC8zICsgdXAgdG8gdHdvIGNoYXJhY3RlcnMgb2YgdGhlIG9yaWdpbmFsIGRhdGFcblx0XHRhcnIgPSBuZXcgQXJyKGI2NC5sZW5ndGggKiAzIC8gNCAtIHBsYWNlSG9sZGVycylcblxuXHRcdC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcblx0XHRsID0gcGxhY2VIb2xkZXJzID4gMCA/IGI2NC5sZW5ndGggLSA0IDogYjY0Lmxlbmd0aFxuXG5cdFx0dmFyIEwgPSAwXG5cblx0XHRmdW5jdGlvbiBwdXNoICh2KSB7XG5cdFx0XHRhcnJbTCsrXSA9IHZcblx0XHR9XG5cblx0XHRmb3IgKGkgPSAwLCBqID0gMDsgaSA8IGw7IGkgKz0gNCwgaiArPSAzKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDE4KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpIDw8IDEyKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpIDw8IDYpIHwgZGVjb2RlKGI2NC5jaGFyQXQoaSArIDMpKVxuXHRcdFx0cHVzaCgodG1wICYgMHhGRjAwMDApID4+IDE2KVxuXHRcdFx0cHVzaCgodG1wICYgMHhGRjAwKSA+PiA4KVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdGlmIChwbGFjZUhvbGRlcnMgPT09IDIpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA+PiA0KVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH0gZWxzZSBpZiAocGxhY2VIb2xkZXJzID09PSAxKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDEwKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpIDw8IDQpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPj4gMilcblx0XHRcdHB1c2goKHRtcCA+PiA4KSAmIDB4RkYpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGFyclxuXHR9XG5cblx0ZnVuY3Rpb24gdWludDhUb0Jhc2U2NCAodWludDgpIHtcblx0XHR2YXIgaSxcblx0XHRcdGV4dHJhQnl0ZXMgPSB1aW50OC5sZW5ndGggJSAzLCAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuXHRcdFx0b3V0cHV0ID0gXCJcIixcblx0XHRcdHRlbXAsIGxlbmd0aFxuXG5cdFx0ZnVuY3Rpb24gZW5jb2RlIChudW0pIHtcblx0XHRcdHJldHVybiBsb29rdXAuY2hhckF0KG51bSlcblx0XHR9XG5cblx0XHRmdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQgKG51bSkge1xuXHRcdFx0cmV0dXJuIGVuY29kZShudW0gPj4gMTggJiAweDNGKSArIGVuY29kZShudW0gPj4gMTIgJiAweDNGKSArIGVuY29kZShudW0gPj4gNiAmIDB4M0YpICsgZW5jb2RlKG51bSAmIDB4M0YpXG5cdFx0fVxuXG5cdFx0Ly8gZ28gdGhyb3VnaCB0aGUgYXJyYXkgZXZlcnkgdGhyZWUgYnl0ZXMsIHdlJ2xsIGRlYWwgd2l0aCB0cmFpbGluZyBzdHVmZiBsYXRlclxuXHRcdGZvciAoaSA9IDAsIGxlbmd0aCA9IHVpbnQ4Lmxlbmd0aCAtIGV4dHJhQnl0ZXM7IGkgPCBsZW5ndGg7IGkgKz0gMykge1xuXHRcdFx0dGVtcCA9ICh1aW50OFtpXSA8PCAxNikgKyAodWludDhbaSArIDFdIDw8IDgpICsgKHVpbnQ4W2kgKyAyXSlcblx0XHRcdG91dHB1dCArPSB0cmlwbGV0VG9CYXNlNjQodGVtcClcblx0XHR9XG5cblx0XHQvLyBwYWQgdGhlIGVuZCB3aXRoIHplcm9zLCBidXQgbWFrZSBzdXJlIHRvIG5vdCBmb3JnZXQgdGhlIGV4dHJhIGJ5dGVzXG5cdFx0c3dpdGNoIChleHRyYUJ5dGVzKSB7XG5cdFx0XHRjYXNlIDE6XG5cdFx0XHRcdHRlbXAgPSB1aW50OFt1aW50OC5sZW5ndGggLSAxXVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMilcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA8PCA0KSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSAnPT0nXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHRjYXNlIDI6XG5cdFx0XHRcdHRlbXAgPSAodWludDhbdWludDgubGVuZ3RoIC0gMl0gPDwgOCkgKyAodWludDhbdWludDgubGVuZ3RoIC0gMV0pXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUodGVtcCA+PiAxMClcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA+PiA0KSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgMikgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz0nXG5cdFx0XHRcdGJyZWFrXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG91dHB1dFxuXHR9XG5cblx0ZXhwb3J0cy50b0J5dGVBcnJheSA9IGI2NFRvQnl0ZUFycmF5XG5cdGV4cG9ydHMuZnJvbUJ5dGVBcnJheSA9IHVpbnQ4VG9CYXNlNjRcbn0odHlwZW9mIGV4cG9ydHMgPT09ICd1bmRlZmluZWQnID8gKHRoaXMuYmFzZTY0anMgPSB7fSkgOiBleHBvcnRzKSlcbiIsImV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uIChidWZmZXIsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtXG4gIHZhciBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgbkJpdHMgPSAtN1xuICB2YXIgaSA9IGlzTEUgPyAobkJ5dGVzIC0gMSkgOiAwXG4gIHZhciBkID0gaXNMRSA/IC0xIDogMVxuICB2YXIgcyA9IGJ1ZmZlcltvZmZzZXQgKyBpXVxuXG4gIGkgKz0gZFxuXG4gIGUgPSBzICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIHMgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IGVMZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgZSA9IGUgKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBtID0gZSAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBlID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBtTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IG0gPSBtICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgaWYgKGUgPT09IDApIHtcbiAgICBlID0gMSAtIGVCaWFzXG4gIH0gZWxzZSBpZiAoZSA9PT0gZU1heCkge1xuICAgIHJldHVybiBtID8gTmFOIDogKChzID8gLTEgOiAxKSAqIEluZmluaXR5KVxuICB9IGVsc2Uge1xuICAgIG0gPSBtICsgTWF0aC5wb3coMiwgbUxlbilcbiAgICBlID0gZSAtIGVCaWFzXG4gIH1cbiAgcmV0dXJuIChzID8gLTEgOiAxKSAqIG0gKiBNYXRoLnBvdygyLCBlIC0gbUxlbilcbn1cblxuZXhwb3J0cy53cml0ZSA9IGZ1bmN0aW9uIChidWZmZXIsIHZhbHVlLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSwgY1xuICB2YXIgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIHJ0ID0gKG1MZW4gPT09IDIzID8gTWF0aC5wb3coMiwgLTI0KSAtIE1hdGgucG93KDIsIC03NykgOiAwKVxuICB2YXIgaSA9IGlzTEUgPyAwIDogKG5CeXRlcyAtIDEpXG4gIHZhciBkID0gaXNMRSA/IDEgOiAtMVxuICB2YXIgcyA9IHZhbHVlIDwgMCB8fCAodmFsdWUgPT09IDAgJiYgMSAvIHZhbHVlIDwgMCkgPyAxIDogMFxuXG4gIHZhbHVlID0gTWF0aC5hYnModmFsdWUpXG5cbiAgaWYgKGlzTmFOKHZhbHVlKSB8fCB2YWx1ZSA9PT0gSW5maW5pdHkpIHtcbiAgICBtID0gaXNOYU4odmFsdWUpID8gMSA6IDBcbiAgICBlID0gZU1heFxuICB9IGVsc2Uge1xuICAgIGUgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4yKVxuICAgIGlmICh2YWx1ZSAqIChjID0gTWF0aC5wb3coMiwgLWUpKSA8IDEpIHtcbiAgICAgIGUtLVxuICAgICAgYyAqPSAyXG4gICAgfVxuICAgIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgdmFsdWUgKz0gcnQgLyBjXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlICs9IHJ0ICogTWF0aC5wb3coMiwgMSAtIGVCaWFzKVxuICAgIH1cbiAgICBpZiAodmFsdWUgKiBjID49IDIpIHtcbiAgICAgIGUrK1xuICAgICAgYyAvPSAyXG4gICAgfVxuXG4gICAgaWYgKGUgKyBlQmlhcyA+PSBlTWF4KSB7XG4gICAgICBtID0gMFxuICAgICAgZSA9IGVNYXhcbiAgICB9IGVsc2UgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICBtID0gKHZhbHVlICogYyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSBlICsgZUJpYXNcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHZhbHVlICogTWF0aC5wb3coMiwgZUJpYXMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gMFxuICAgIH1cbiAgfVxuXG4gIGZvciAoOyBtTGVuID49IDg7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IG0gJiAweGZmLCBpICs9IGQsIG0gLz0gMjU2LCBtTGVuIC09IDgpIHt9XG5cbiAgZSA9IChlIDw8IG1MZW4pIHwgbVxuICBlTGVuICs9IG1MZW5cbiAgZm9yICg7IGVMZW4gPiAwOyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBlICYgMHhmZiwgaSArPSBkLCBlIC89IDI1NiwgZUxlbiAtPSA4KSB7fVxuXG4gIGJ1ZmZlcltvZmZzZXQgKyBpIC0gZF0gfD0gcyAqIDEyOFxufVxuIiwiXG4vKipcbiAqIGlzQXJyYXlcbiAqL1xuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG5cbi8qKlxuICogdG9TdHJpbmdcbiAqL1xuXG52YXIgc3RyID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuLyoqXG4gKiBXaGV0aGVyIG9yIG5vdCB0aGUgZ2l2ZW4gYHZhbGBcbiAqIGlzIGFuIGFycmF5LlxuICpcbiAqIGV4YW1wbGU6XG4gKlxuICogICAgICAgIGlzQXJyYXkoW10pO1xuICogICAgICAgIC8vID4gdHJ1ZVxuICogICAgICAgIGlzQXJyYXkoYXJndW1lbnRzKTtcbiAqICAgICAgICAvLyA+IGZhbHNlXG4gKiAgICAgICAgaXNBcnJheSgnJyk7XG4gKiAgICAgICAgLy8gPiBmYWxzZVxuICpcbiAqIEBwYXJhbSB7bWl4ZWR9IHZhbFxuICogQHJldHVybiB7Ym9vbH1cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlzQXJyYXkgfHwgZnVuY3Rpb24gKHZhbCkge1xuICByZXR1cm4gISEgdmFsICYmICdbb2JqZWN0IEFycmF5XScgPT0gc3RyLmNhbGwodmFsKTtcbn07XG4iXX0=
