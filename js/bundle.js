(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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


},{}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
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

},{"iota-array":5,"typedarray-pool":11,"uniq":12}],5:[function(require,module,exports){
"use strict"

function iota(n) {
  var result = new Array(n)
  for(var i=0; i<n; ++i) {
    result[i] = i
  }
  return result
}

module.exports = iota
},{}],6:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],7:[function(require,module,exports){
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
  'left command': 91,
  'right command': 93,
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
  'pgdn': 34,
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

},{}],8:[function(require,module,exports){
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


},{}],9:[function(require,module,exports){
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

},{"iota-array":5,"is-buffer":6}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{"bit-twiddle":1,"buffer":59,"dup":3}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{"../editor/editor":30}],14:[function(require,module,exports){
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

},{"../components/blocks":16,"../components/rigidbody":20,"ndarray":9}],15:[function(require,module,exports){
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

},{"../components/character":17,"../components/playercontrol":19,"../components/rigidbody":20}],16:[function(require,module,exports){
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
    c = c.value || c;

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
},{"../utils/arrayutils":54,"../voxel/mesher":57,"ndarray":9}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
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
},{}],19:[function(require,module,exports){
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
},{}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){
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
},{"./events":22}],22:[function(require,module,exports){
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
},{}],23:[function(require,module,exports){
module.exports={
}
},{}],24:[function(require,module,exports){
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
},{}],25:[function(require,module,exports){
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
},{}],26:[function(require,module,exports){
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
},{"../../utils/arrayutils":54,"./blockcommand":25}],27:[function(require,module,exports){
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
},{"../../utils/arrayutils":54}],28:[function(require,module,exports){
var BlockCommand = require('./blockcommand');

module.exports = function(blocks, coords, value) {
  var command = new BlockCommand(blocks);
  command.setAtCoords(coords, value);

  return command;
};
},{"./blockcommand":25}],29:[function(require,module,exports){
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

},{}],30:[function(require,module,exports){
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

var VERSION = '1.0';
var KEY_SAVE = 'save';

var Editor = function(object, app, input, camera, devConsole, config, palette, canvas, cache) {

  this.object = object;

  this.app = app;

  this.input = input;

  this.camera = camera;

  this.devConsole = devConsole;

  this.config = config;

  this.palette = palette;

  this.canvas = canvas;

  this.cache = cache;

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
  this.lastTool = this.toolName;

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

  this.lastTool = null;
};

Editor.$inject = ['app', 'input', 'camera', 'devConsole', 'config', 'palette', 'canvas', 'cache'];

Editor.prototype.start = function() {
  editorConsole(this, this.devConsole);

  this.selectedColor = this.palette[0];

  var save = this.cache.get(KEY_SAVE);
  if (save != null) {
    if (save.version !== VERSION) {
      // Migrate
    } else {
      this.prefabs = save.prefabs || [];  
      this.selectedColor = save.selectedColor;
    }
  }

  this.blocks = this.app.attach(this.object, blocksComponent);

  this.dragCamera = this.app.attach(this.camera, dragCameraComponent);

  this.updateTool();

  this.updateMaterial(this.blocks);

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

  this.setSelectedColor(this.selectedColor);
  this.prefabsBar.highlight(0);
  this.toolBar.highlight(0);
};

Editor.prototype.load = function(data) {
  this.blocks.deserialize(data);

  this.updateSize(this.blocks.dim);

  this.updateLastBlocks();

  this.updatePropertyPanel();
};

Editor.prototype.setTool = function(name) {
  var index = arrayUtils.indexOf(this.toolNames, name);
  if (index === -1) {
    return;
  }

  this.toolBar.highlight(index);
  this.lastTool = this.toolName;
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
  this.save();
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

Editor.prototype.updatePropertyPanel = function() {
  var prefab = this.getSelectedPrefab();

  this.propertyPanel.controllers['name'].setValue(prefab.userData.name || 'unnamed');

  var dim = prefab.dim;
  var formattedSize = dim.join(' ');
  this.propertyPanel.controllers['size'].setValue(formattedSize);
};

Editor.prototype.save = function() {
  var save = {
    version: VERSION,
    prefabs: this.prefabs,
    selectedColor: this.selectedColor
  };

  this.cache.set(KEY_SAVE, save);

  return save;
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

Editor.prototype.downloadJSON = function() {
  var json = this.save();

  var name = this.getSelectedPrefab().userData.name;

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

Editor.prototype.getSelectedPrefab = function() {
  return this.prefabs[this.prefabIndex];
};

Editor.prototype.updateCurrentPrefab = function() {
  this.prefabs[this.prefabIndex] = this.blocks.serialize();
};

Editor.prototype.setLastTool = function() {
  this.setTool(this.lastTool);
};

module.exports = Editor;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../components/blocks":16,"../utils/arrayutils":54,"./commands/offsetcommand":26,"./dragcamera":29,"./editorconsole":31,"./editortools":32,"./gui/arrowbar":33,"./gui/colorbar":34,"./gui/filebar":36,"./gui/prefabsbar":39,"./gui/prefabstoolbar":40,"./gui/propertypanel":41,"./gui/toolbar":42,"./tools/cameratool":43,"./tools/filltool":44,"./tools/pentool":45,"./tools/sampletool":46,"./tools/selecttool":47,"cbuffer":2}],31:[function(require,module,exports){
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
},{"./editor":30}],32:[function(require,module,exports){
var EditorTools = {
  Pen: 'Pen',
  Select: 'Select',
  Sample: 'Sample',
  Camera: 'Camera',
  Fill: 'Fill'
};

module.exports = EditorTools;
},{}],33:[function(require,module,exports){
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
},{"./cpr":35}],34:[function(require,module,exports){
var cpr = require('./cpr');

module.exports = function(editor) {
  var bar = cpr({
    data: editor.palette,
    onPick: function(color) {
      editor.selectedColor = color.isClearColor ? null : color;
      editor.save();
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
},{"./cpr":35}],35:[function(require,module,exports){
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
},{}],36:[function(require,module,exports){
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
    tooltip: 'Save'
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
        editor.downloadJSON();
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
},{"./cpr":35,"./popup":38}],37:[function(require,module,exports){
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
},{}],38:[function(require,module,exports){
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
},{}],39:[function(require,module,exports){
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
},{"./cpr":35}],40:[function(require,module,exports){
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
},{"./cpr":35,"./popup":38}],41:[function(require,module,exports){
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
},{"./panel":37}],42:[function(require,module,exports){
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
      editor.setTool(obj.toolname);
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
},{"../editortools":32,"./cpr":35}],43:[function(require,module,exports){
var CameraTool = function() {

};

CameraTool.prototype.tick = function() {
	
};

module.exports = CameraTool;
},{}],44:[function(require,module,exports){
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
},{"../commands/setcommand":28}],45:[function(require,module,exports){
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
},{"../commands/setcommand":28}],46:[function(require,module,exports){
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
      this.editor.setLastTool();
    } else {
      this.editor.setSelectedColor(null);
      this.editor.setLastTool();
    }
  }
};

module.exports = SampleTool;
},{"../editortools":32}],47:[function(require,module,exports){
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
},{"../commands/selectcommand":27,"point-in-polygon":10}],48:[function(require,module,exports){
(function (global){
var THREE = (typeof window !== "undefined" ? window['THREE'] : typeof global !== "undefined" ? global['THREE'] : null);
var b = require('./core/b');
// var stats = require('./services/stats');

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

var cache = require('./services/cache')();
app.value('cache', cache);

// stats(app);

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

},{"./assemblies/aeditor":13,"./assemblies/aground":14,"./assemblies/aplayer":15,"./components/playerCamera":18,"./core/b":21,"./data/config.json":23,"./data/palette.json":24,"./services/cache":49,"./services/devconsole":50,"./services/materials":51,"./systems/input":52,"./systems/renderer":53,"./voxel/voxel":58}],49:[function(require,module,exports){
var Cache = function() {};

Cache.prototype.get = function(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key));
  } catch (err) {
    return null;
  }
};

Cache.prototype.set = function(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
};

module.exports = function() {
  return new Cache();
};
},{}],50:[function(require,module,exports){
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
},{"keycode":7,"minimist":8}],51:[function(require,module,exports){
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

},{}],52:[function(require,module,exports){
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
},{"../utils/arrayutils":54,"keycode":7}],53:[function(require,module,exports){
// var Stats = require('stats.js');

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

  // var stats = new Stats();
  // stats.domElement.style.position = 'absolute';
  // stats.domElement.style.right = '0px';
  // stats.domElement.style.bottom = '0px';

  // document.body.appendChild(stats.domElement);

  var ssao = true;

  var ambient = new THREE.AmbientLight(new THREE.Color("rgb(60%, 60%, 60%)"));
  var light = new THREE.DirectionalLight(0xffffff, 0.6);
  light.position.set(0.8, 1, 0.5);
  scene.add(light);
  scene.add(ambient);

  function render() {
    requestAnimationFrame(render);

    // stats.begin();

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

    // stats.end();
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
},{}],54:[function(require,module,exports){
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
},{}],55:[function(require,module,exports){
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
},{}],56:[function(require,module,exports){
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
},{"./gravity":55}],57:[function(require,module,exports){
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
},{"greedy-mesher":4,"ndarray":9}],58:[function(require,module,exports){
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

},{"./gravityutils":56}],59:[function(require,module,exports){
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

},{"base64-js":60,"ieee754":61,"is-array":62}],60:[function(require,module,exports){
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

},{}],61:[function(require,module,exports){
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

},{}],62:[function(require,module,exports){

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

},{}]},{},[48])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYml0LXR3aWRkbGUvdHdpZGRsZS5qcyIsIm5vZGVfbW9kdWxlcy9jYnVmZmVyL2NidWZmZXIuanMiLCJub2RlX21vZHVsZXMvZHVwL2R1cC5qcyIsIm5vZGVfbW9kdWxlcy9ncmVlZHktbWVzaGVyL2dyZWVkeS5qcyIsIm5vZGVfbW9kdWxlcy9pb3RhLWFycmF5L2lvdGEuanMiLCJub2RlX21vZHVsZXMvaXMtYnVmZmVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2tleWNvZGUvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbWluaW1pc3QvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbmRhcnJheS9uZGFycmF5LmpzIiwibm9kZV9tb2R1bGVzL3BvaW50LWluLXBvbHlnb24vaW5kZXguanMiLCJub2RlX21vZHVsZXMvdHlwZWRhcnJheS1wb29sL3Bvb2wuanMiLCJub2RlX21vZHVsZXMvdW5pcS91bmlxLmpzIiwic3JjL2Fzc2VtYmxpZXMvYWVkaXRvci5qcyIsInNyYy9hc3NlbWJsaWVzL2Fncm91bmQuanMiLCJzcmMvYXNzZW1ibGllcy9hcGxheWVyLmpzIiwic3JjL2NvbXBvbmVudHMvYmxvY2tzLmpzIiwic3JjL2NvbXBvbmVudHMvY2hhcmFjdGVyLmpzIiwic3JjL2NvbXBvbmVudHMvcGxheWVyQ2FtZXJhLmpzIiwic3JjL2NvbXBvbmVudHMvcGxheWVyY29udHJvbC5qcyIsInNyYy9jb21wb25lbnRzL3JpZ2lkYm9keS5qcyIsInNyYy9jb3JlL2IuanMiLCJzcmMvY29yZS9ldmVudHMuanMiLCJzcmMvZGF0YS9jb25maWcuanNvbiIsInNyYy9kYXRhL3BhbGV0dGUuanNvbiIsInNyYy9lZGl0b3IvY29tbWFuZHMvYmxvY2tjb21tYW5kLmpzIiwic3JjL2VkaXRvci9jb21tYW5kcy9vZmZzZXRjb21tYW5kLmpzIiwic3JjL2VkaXRvci9jb21tYW5kcy9zZWxlY3Rjb21tYW5kLmpzIiwic3JjL2VkaXRvci9jb21tYW5kcy9zZXRjb21tYW5kLmpzIiwic3JjL2VkaXRvci9kcmFnY2FtZXJhLmpzIiwic3JjL2VkaXRvci9lZGl0b3IuanMiLCJzcmMvZWRpdG9yL2VkaXRvcmNvbnNvbGUuanMiLCJzcmMvZWRpdG9yL2VkaXRvcnRvb2xzLmpzIiwic3JjL2VkaXRvci9ndWkvYXJyb3diYXIuanMiLCJzcmMvZWRpdG9yL2d1aS9jb2xvcmJhci5qcyIsInNyYy9lZGl0b3IvZ3VpL2Nwci5qcyIsInNyYy9lZGl0b3IvZ3VpL2ZpbGViYXIuanMiLCJzcmMvZWRpdG9yL2d1aS9wYW5lbC5qcyIsInNyYy9lZGl0b3IvZ3VpL3BvcHVwLmpzIiwic3JjL2VkaXRvci9ndWkvcHJlZmFic2Jhci5qcyIsInNyYy9lZGl0b3IvZ3VpL3ByZWZhYnN0b29sYmFyLmpzIiwic3JjL2VkaXRvci9ndWkvcHJvcGVydHlwYW5lbC5qcyIsInNyYy9lZGl0b3IvZ3VpL3Rvb2xiYXIuanMiLCJzcmMvZWRpdG9yL3Rvb2xzL2NhbWVyYXRvb2wuanMiLCJzcmMvZWRpdG9yL3Rvb2xzL2ZpbGx0b29sLmpzIiwic3JjL2VkaXRvci90b29scy9wZW50b29sLmpzIiwic3JjL2VkaXRvci90b29scy9zYW1wbGV0b29sLmpzIiwic3JjL2VkaXRvci90b29scy9zZWxlY3R0b29sLmpzIiwic3JjL21haW4uanMiLCJzcmMvc2VydmljZXMvY2FjaGUuanMiLCJzcmMvc2VydmljZXMvZGV2Y29uc29sZS5qcyIsInNyYy9zZXJ2aWNlcy9tYXRlcmlhbHMuanMiLCJzcmMvc3lzdGVtcy9pbnB1dC5qcyIsInNyYy9zeXN0ZW1zL3JlbmRlcmVyLmpzIiwic3JjL3V0aWxzL2FycmF5dXRpbHMuanMiLCJzcmMvdm94ZWwvZ3Jhdml0eS5qcyIsInNyYy92b3hlbC9ncmF2aXR5dXRpbHMuanMiLCJzcmMvdm94ZWwvbWVzaGVyLmpzIiwic3JjL3ZveGVsL3ZveGVsLmpzIiwiLi4vLi4vLi4vLi4vdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9pbmRleC5qcyIsIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvbm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9saWIvYjY0LmpzIiwiLi4vLi4vLi4vLi4vdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaWVlZTc1NC9pbmRleC5qcyIsIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvbm9kZV9tb2R1bGVzL2lzLWFycmF5L2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDck1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDck5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDaE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdnJCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25SQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzdLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzFLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3L0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIEJpdCB0d2lkZGxpbmcgaGFja3MgZm9yIEphdmFTY3JpcHQuXG4gKlxuICogQXV0aG9yOiBNaWtvbGEgTHlzZW5rb1xuICpcbiAqIFBvcnRlZCBmcm9tIFN0YW5mb3JkIGJpdCB0d2lkZGxpbmcgaGFjayBsaWJyYXJ5OlxuICogICAgaHR0cDovL2dyYXBoaWNzLnN0YW5mb3JkLmVkdS9+c2VhbmRlci9iaXRoYWNrcy5odG1sXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7IFwidXNlIHJlc3RyaWN0XCI7XG5cbi8vTnVtYmVyIG9mIGJpdHMgaW4gYW4gaW50ZWdlclxudmFyIElOVF9CSVRTID0gMzI7XG5cbi8vQ29uc3RhbnRzXG5leHBvcnRzLklOVF9CSVRTICA9IElOVF9CSVRTO1xuZXhwb3J0cy5JTlRfTUFYICAgPSAgMHg3ZmZmZmZmZjtcbmV4cG9ydHMuSU5UX01JTiAgID0gLTE8PChJTlRfQklUUy0xKTtcblxuLy9SZXR1cm5zIC0xLCAwLCArMSBkZXBlbmRpbmcgb24gc2lnbiBvZiB4XG5leHBvcnRzLnNpZ24gPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiAodiA+IDApIC0gKHYgPCAwKTtcbn1cblxuLy9Db21wdXRlcyBhYnNvbHV0ZSB2YWx1ZSBvZiBpbnRlZ2VyXG5leHBvcnRzLmFicyA9IGZ1bmN0aW9uKHYpIHtcbiAgdmFyIG1hc2sgPSB2ID4+IChJTlRfQklUUy0xKTtcbiAgcmV0dXJuICh2IF4gbWFzaykgLSBtYXNrO1xufVxuXG4vL0NvbXB1dGVzIG1pbmltdW0gb2YgaW50ZWdlcnMgeCBhbmQgeVxuZXhwb3J0cy5taW4gPSBmdW5jdGlvbih4LCB5KSB7XG4gIHJldHVybiB5IF4gKCh4IF4geSkgJiAtKHggPCB5KSk7XG59XG5cbi8vQ29tcHV0ZXMgbWF4aW11bSBvZiBpbnRlZ2VycyB4IGFuZCB5XG5leHBvcnRzLm1heCA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgcmV0dXJuIHggXiAoKHggXiB5KSAmIC0oeCA8IHkpKTtcbn1cblxuLy9DaGVja3MgaWYgYSBudW1iZXIgaXMgYSBwb3dlciBvZiB0d29cbmV4cG9ydHMuaXNQb3cyID0gZnVuY3Rpb24odikge1xuICByZXR1cm4gISh2ICYgKHYtMSkpICYmICghIXYpO1xufVxuXG4vL0NvbXB1dGVzIGxvZyBiYXNlIDIgb2YgdlxuZXhwb3J0cy5sb2cyID0gZnVuY3Rpb24odikge1xuICB2YXIgciwgc2hpZnQ7XG4gIHIgPSAgICAgKHYgPiAweEZGRkYpIDw8IDQ7IHYgPj4+PSByO1xuICBzaGlmdCA9ICh2ID4gMHhGRiAgKSA8PCAzOyB2ID4+Pj0gc2hpZnQ7IHIgfD0gc2hpZnQ7XG4gIHNoaWZ0ID0gKHYgPiAweEYgICApIDw8IDI7IHYgPj4+PSBzaGlmdDsgciB8PSBzaGlmdDtcbiAgc2hpZnQgPSAodiA+IDB4MyAgICkgPDwgMTsgdiA+Pj49IHNoaWZ0OyByIHw9IHNoaWZ0O1xuICByZXR1cm4gciB8ICh2ID4+IDEpO1xufVxuXG4vL0NvbXB1dGVzIGxvZyBiYXNlIDEwIG9mIHZcbmV4cG9ydHMubG9nMTAgPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiAgKHYgPj0gMTAwMDAwMDAwMCkgPyA5IDogKHYgPj0gMTAwMDAwMDAwKSA/IDggOiAodiA+PSAxMDAwMDAwMCkgPyA3IDpcbiAgICAgICAgICAodiA+PSAxMDAwMDAwKSA/IDYgOiAodiA+PSAxMDAwMDApID8gNSA6ICh2ID49IDEwMDAwKSA/IDQgOlxuICAgICAgICAgICh2ID49IDEwMDApID8gMyA6ICh2ID49IDEwMCkgPyAyIDogKHYgPj0gMTApID8gMSA6IDA7XG59XG5cbi8vQ291bnRzIG51bWJlciBvZiBiaXRzXG5leHBvcnRzLnBvcENvdW50ID0gZnVuY3Rpb24odikge1xuICB2ID0gdiAtICgodiA+Pj4gMSkgJiAweDU1NTU1NTU1KTtcbiAgdiA9ICh2ICYgMHgzMzMzMzMzMykgKyAoKHYgPj4+IDIpICYgMHgzMzMzMzMzMyk7XG4gIHJldHVybiAoKHYgKyAodiA+Pj4gNCkgJiAweEYwRjBGMEYpICogMHgxMDEwMTAxKSA+Pj4gMjQ7XG59XG5cbi8vQ291bnRzIG51bWJlciBvZiB0cmFpbGluZyB6ZXJvc1xuZnVuY3Rpb24gY291bnRUcmFpbGluZ1plcm9zKHYpIHtcbiAgdmFyIGMgPSAzMjtcbiAgdiAmPSAtdjtcbiAgaWYgKHYpIGMtLTtcbiAgaWYgKHYgJiAweDAwMDBGRkZGKSBjIC09IDE2O1xuICBpZiAodiAmIDB4MDBGRjAwRkYpIGMgLT0gODtcbiAgaWYgKHYgJiAweDBGMEYwRjBGKSBjIC09IDQ7XG4gIGlmICh2ICYgMHgzMzMzMzMzMykgYyAtPSAyO1xuICBpZiAodiAmIDB4NTU1NTU1NTUpIGMgLT0gMTtcbiAgcmV0dXJuIGM7XG59XG5leHBvcnRzLmNvdW50VHJhaWxpbmdaZXJvcyA9IGNvdW50VHJhaWxpbmdaZXJvcztcblxuLy9Sb3VuZHMgdG8gbmV4dCBwb3dlciBvZiAyXG5leHBvcnRzLm5leHRQb3cyID0gZnVuY3Rpb24odikge1xuICB2ICs9IHYgPT09IDA7XG4gIC0tdjtcbiAgdiB8PSB2ID4+PiAxO1xuICB2IHw9IHYgPj4+IDI7XG4gIHYgfD0gdiA+Pj4gNDtcbiAgdiB8PSB2ID4+PiA4O1xuICB2IHw9IHYgPj4+IDE2O1xuICByZXR1cm4gdiArIDE7XG59XG5cbi8vUm91bmRzIGRvd24gdG8gcHJldmlvdXMgcG93ZXIgb2YgMlxuZXhwb3J0cy5wcmV2UG93MiA9IGZ1bmN0aW9uKHYpIHtcbiAgdiB8PSB2ID4+PiAxO1xuICB2IHw9IHYgPj4+IDI7XG4gIHYgfD0gdiA+Pj4gNDtcbiAgdiB8PSB2ID4+PiA4O1xuICB2IHw9IHYgPj4+IDE2O1xuICByZXR1cm4gdiAtICh2Pj4+MSk7XG59XG5cbi8vQ29tcHV0ZXMgcGFyaXR5IG9mIHdvcmRcbmV4cG9ydHMucGFyaXR5ID0gZnVuY3Rpb24odikge1xuICB2IF49IHYgPj4+IDE2O1xuICB2IF49IHYgPj4+IDg7XG4gIHYgXj0gdiA+Pj4gNDtcbiAgdiAmPSAweGY7XG4gIHJldHVybiAoMHg2OTk2ID4+PiB2KSAmIDE7XG59XG5cbnZhciBSRVZFUlNFX1RBQkxFID0gbmV3IEFycmF5KDI1Nik7XG5cbihmdW5jdGlvbih0YWIpIHtcbiAgZm9yKHZhciBpPTA7IGk8MjU2OyArK2kpIHtcbiAgICB2YXIgdiA9IGksIHIgPSBpLCBzID0gNztcbiAgICBmb3IgKHYgPj4+PSAxOyB2OyB2ID4+Pj0gMSkge1xuICAgICAgciA8PD0gMTtcbiAgICAgIHIgfD0gdiAmIDE7XG4gICAgICAtLXM7XG4gICAgfVxuICAgIHRhYltpXSA9IChyIDw8IHMpICYgMHhmZjtcbiAgfVxufSkoUkVWRVJTRV9UQUJMRSk7XG5cbi8vUmV2ZXJzZSBiaXRzIGluIGEgMzIgYml0IHdvcmRcbmV4cG9ydHMucmV2ZXJzZSA9IGZ1bmN0aW9uKHYpIHtcbiAgcmV0dXJuICAoUkVWRVJTRV9UQUJMRVsgdiAgICAgICAgICYgMHhmZl0gPDwgMjQpIHxcbiAgICAgICAgICAoUkVWRVJTRV9UQUJMRVsodiA+Pj4gOCkgICYgMHhmZl0gPDwgMTYpIHxcbiAgICAgICAgICAoUkVWRVJTRV9UQUJMRVsodiA+Pj4gMTYpICYgMHhmZl0gPDwgOCkgIHxcbiAgICAgICAgICAgUkVWRVJTRV9UQUJMRVsodiA+Pj4gMjQpICYgMHhmZl07XG59XG5cbi8vSW50ZXJsZWF2ZSBiaXRzIG9mIDIgY29vcmRpbmF0ZXMgd2l0aCAxNiBiaXRzLiAgVXNlZnVsIGZvciBmYXN0IHF1YWR0cmVlIGNvZGVzXG5leHBvcnRzLmludGVybGVhdmUyID0gZnVuY3Rpb24oeCwgeSkge1xuICB4ICY9IDB4RkZGRjtcbiAgeCA9ICh4IHwgKHggPDwgOCkpICYgMHgwMEZGMDBGRjtcbiAgeCA9ICh4IHwgKHggPDwgNCkpICYgMHgwRjBGMEYwRjtcbiAgeCA9ICh4IHwgKHggPDwgMikpICYgMHgzMzMzMzMzMztcbiAgeCA9ICh4IHwgKHggPDwgMSkpICYgMHg1NTU1NTU1NTtcblxuICB5ICY9IDB4RkZGRjtcbiAgeSA9ICh5IHwgKHkgPDwgOCkpICYgMHgwMEZGMDBGRjtcbiAgeSA9ICh5IHwgKHkgPDwgNCkpICYgMHgwRjBGMEYwRjtcbiAgeSA9ICh5IHwgKHkgPDwgMikpICYgMHgzMzMzMzMzMztcbiAgeSA9ICh5IHwgKHkgPDwgMSkpICYgMHg1NTU1NTU1NTtcblxuICByZXR1cm4geCB8ICh5IDw8IDEpO1xufVxuXG4vL0V4dHJhY3RzIHRoZSBudGggaW50ZXJsZWF2ZWQgY29tcG9uZW50XG5leHBvcnRzLmRlaW50ZXJsZWF2ZTIgPSBmdW5jdGlvbih2LCBuKSB7XG4gIHYgPSAodiA+Pj4gbikgJiAweDU1NTU1NTU1O1xuICB2ID0gKHYgfCAodiA+Pj4gMSkpICAmIDB4MzMzMzMzMzM7XG4gIHYgPSAodiB8ICh2ID4+PiAyKSkgICYgMHgwRjBGMEYwRjtcbiAgdiA9ICh2IHwgKHYgPj4+IDQpKSAgJiAweDAwRkYwMEZGO1xuICB2ID0gKHYgfCAodiA+Pj4gMTYpKSAmIDB4MDAwRkZGRjtcbiAgcmV0dXJuICh2IDw8IDE2KSA+PiAxNjtcbn1cblxuXG4vL0ludGVybGVhdmUgYml0cyBvZiAzIGNvb3JkaW5hdGVzLCBlYWNoIHdpdGggMTAgYml0cy4gIFVzZWZ1bCBmb3IgZmFzdCBvY3RyZWUgY29kZXNcbmV4cG9ydHMuaW50ZXJsZWF2ZTMgPSBmdW5jdGlvbih4LCB5LCB6KSB7XG4gIHggJj0gMHgzRkY7XG4gIHggID0gKHggfCAoeDw8MTYpKSAmIDQyNzgxOTAzMzU7XG4gIHggID0gKHggfCAoeDw8OCkpICAmIDI1MTcxOTY5NTtcbiAgeCAgPSAoeCB8ICh4PDw0KSkgICYgMzI3MjM1NjAzNTtcbiAgeCAgPSAoeCB8ICh4PDwyKSkgICYgMTIyNzEzMzUxMztcblxuICB5ICY9IDB4M0ZGO1xuICB5ICA9ICh5IHwgKHk8PDE2KSkgJiA0Mjc4MTkwMzM1O1xuICB5ICA9ICh5IHwgKHk8PDgpKSAgJiAyNTE3MTk2OTU7XG4gIHkgID0gKHkgfCAoeTw8NCkpICAmIDMyNzIzNTYwMzU7XG4gIHkgID0gKHkgfCAoeTw8MikpICAmIDEyMjcxMzM1MTM7XG4gIHggfD0gKHkgPDwgMSk7XG4gIFxuICB6ICY9IDB4M0ZGO1xuICB6ICA9ICh6IHwgKHo8PDE2KSkgJiA0Mjc4MTkwMzM1O1xuICB6ICA9ICh6IHwgKHo8PDgpKSAgJiAyNTE3MTk2OTU7XG4gIHogID0gKHogfCAoejw8NCkpICAmIDMyNzIzNTYwMzU7XG4gIHogID0gKHogfCAoejw8MikpICAmIDEyMjcxMzM1MTM7XG4gIFxuICByZXR1cm4geCB8ICh6IDw8IDIpO1xufVxuXG4vL0V4dHJhY3RzIG50aCBpbnRlcmxlYXZlZCBjb21wb25lbnQgb2YgYSAzLXR1cGxlXG5leHBvcnRzLmRlaW50ZXJsZWF2ZTMgPSBmdW5jdGlvbih2LCBuKSB7XG4gIHYgPSAodiA+Pj4gbikgICAgICAgJiAxMjI3MTMzNTEzO1xuICB2ID0gKHYgfCAodj4+PjIpKSAgICYgMzI3MjM1NjAzNTtcbiAgdiA9ICh2IHwgKHY+Pj40KSkgICAmIDI1MTcxOTY5NTtcbiAgdiA9ICh2IHwgKHY+Pj44KSkgICAmIDQyNzgxOTAzMzU7XG4gIHYgPSAodiB8ICh2Pj4+MTYpKSAgJiAweDNGRjtcbiAgcmV0dXJuICh2PDwyMik+PjIyO1xufVxuXG4vL0NvbXB1dGVzIG5leHQgY29tYmluYXRpb24gaW4gY29sZXhpY29ncmFwaGljIG9yZGVyICh0aGlzIGlzIG1pc3Rha2VubHkgY2FsbGVkIG5leHRQZXJtdXRhdGlvbiBvbiB0aGUgYml0IHR3aWRkbGluZyBoYWNrcyBwYWdlKVxuZXhwb3J0cy5uZXh0Q29tYmluYXRpb24gPSBmdW5jdGlvbih2KSB7XG4gIHZhciB0ID0gdiB8ICh2IC0gMSk7XG4gIHJldHVybiAodCArIDEpIHwgKCgofnQgJiAtfnQpIC0gMSkgPj4+IChjb3VudFRyYWlsaW5nWmVyb3ModikgKyAxKSk7XG59XG5cbiIsIihmdW5jdGlvbiAoZ2xvYmFsKSB7XG5cbmZ1bmN0aW9uIENCdWZmZXIoKSB7XG5cdC8vIGhhbmRsZSBjYXNlcyB3aGVyZSBcIm5ld1wiIGtleXdvcmQgd2Fzbid0IHVzZWRcblx0aWYgKCEodGhpcyBpbnN0YW5jZW9mIENCdWZmZXIpKSB7XG5cdFx0Ly8gbXVsdGlwbGUgY29uZGl0aW9ucyBuZWVkIHRvIGJlIGNoZWNrZWQgdG8gcHJvcGVybHkgZW11bGF0ZSBBcnJheVxuXHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSB8fCB0eXBlb2YgYXJndW1lbnRzWzBdICE9PSAnbnVtYmVyJykge1xuXHRcdFx0cmV0dXJuIENCdWZmZXIuYXBwbHkobmV3IENCdWZmZXIoYXJndW1lbnRzLmxlbmd0aCksIGFyZ3VtZW50cyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBuZXcgQ0J1ZmZlcihhcmd1bWVudHNbMF0pO1xuXHRcdH1cblx0fVxuXHQvLyBpZiBubyBhcmd1bWVudHMsIHRoZW4gbm90aGluZyBuZWVkcyB0byBiZSBzZXRcblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG5cdHRocm93IG5ldyBFcnJvcignTWlzc2luZyBBcmd1bWVudDogWW91IG11c3QgcGFzcyBhIHZhbGlkIGJ1ZmZlciBsZW5ndGgnKTtcblx0Ly8gdGhpcyBpcyB0aGUgc2FtZSBpbiBlaXRoZXIgc2NlbmFyaW9cblx0dGhpcy5zaXplID0gdGhpcy5zdGFydCA9IDA7XG5cdC8vIHNldCB0byBjYWxsYmFjayBmbiBpZiBkYXRhIGlzIGFib3V0IHRvIGJlIG92ZXJ3cml0dGVuXG5cdHRoaXMub3ZlcmZsb3cgPSBudWxsO1xuXHQvLyBlbXVsYXRlIEFycmF5IGJhc2VkIG9uIHBhc3NlZCBhcmd1bWVudHNcblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxIHx8IHR5cGVvZiBhcmd1bWVudHNbMF0gIT09ICdudW1iZXInKSB7XG5cdFx0dGhpcy5kYXRhID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGgpO1xuXHRcdHRoaXMuZW5kID0gKHRoaXMubGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aCkgLSAxO1xuXHRcdHRoaXMucHVzaC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHR9IGVsc2Uge1xuXHRcdHRoaXMuZGF0YSA9IG5ldyBBcnJheShhcmd1bWVudHNbMF0pO1xuXHRcdHRoaXMuZW5kID0gKHRoaXMubGVuZ3RoID0gYXJndW1lbnRzWzBdKSAtIDE7XG5cdH1cblx0Ly8gbmVlZCB0byBgcmV0dXJuIHRoaXNgIHNvIGByZXR1cm4gQ0J1ZmZlci5hcHBseWAgd29ya3Ncblx0cmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRDb21wYXJpdG9yKGEsIGIpIHtcblx0cmV0dXJuIGEgPT0gYiA/IDAgOiBhID4gYiA/IDEgOiAtMTtcbn1cblxuQ0J1ZmZlci5wcm90b3R5cGUgPSB7XG5cdC8vIHByb3Blcmx5IHNldCBjb25zdHJ1Y3RvclxuXHRjb25zdHJ1Y3RvciA6IENCdWZmZXIsXG5cblx0LyogbXV0YXRvciBtZXRob2RzICovXG5cdC8vIHBvcCBsYXN0IGl0ZW1cblx0cG9wIDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpdGVtO1xuXHRcdGlmICh0aGlzLnNpemUgPT09IDApIHJldHVybjtcblx0XHRpdGVtID0gdGhpcy5kYXRhW3RoaXMuZW5kXTtcblx0XHQvLyByZW1vdmUgdGhlIHJlZmVyZW5jZSB0byB0aGUgb2JqZWN0IHNvIGl0IGNhbiBiZSBnYXJiYWdlIGNvbGxlY3RlZFxuXHRcdGRlbGV0ZSB0aGlzLmRhdGFbdGhpcy5lbmRdO1xuXHRcdHRoaXMuZW5kID0gKHRoaXMuZW5kIC0gMSArIHRoaXMubGVuZ3RoKSAlIHRoaXMubGVuZ3RoO1xuXHRcdHRoaXMuc2l6ZS0tO1xuXHRcdHJldHVybiBpdGVtO1xuXHR9LFxuXHQvLyBwdXNoIGl0ZW0gdG8gdGhlIGVuZFxuXHRwdXNoIDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpID0gMDtcblx0XHQvLyBjaGVjayBpZiBvdmVyZmxvdyBpcyBzZXQsIGFuZCBpZiBkYXRhIGlzIGFib3V0IHRvIGJlIG92ZXJ3cml0dGVuXG5cdFx0aWYgKHRoaXMub3ZlcmZsb3cgJiYgdGhpcy5zaXplICsgYXJndW1lbnRzLmxlbmd0aCA+IHRoaXMubGVuZ3RoKSB7XG5cdFx0XHQvLyBjYWxsIG92ZXJmbG93IGZ1bmN0aW9uIGFuZCBzZW5kIGRhdGEgdGhhdCdzIGFib3V0IHRvIGJlIG92ZXJ3cml0dGVuXG5cdFx0XHRmb3IgKDsgaSA8IHRoaXMuc2l6ZSArIGFyZ3VtZW50cy5sZW5ndGggLSB0aGlzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHRoaXMub3ZlcmZsb3codGhpcy5kYXRhWyh0aGlzLmVuZCArIGkgKyAxKSAlIHRoaXMubGVuZ3RoXSwgdGhpcyk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vIHB1c2ggaXRlbXMgdG8gdGhlIGVuZCwgd3JhcHBpbmcgYW5kIGVyYXNpbmcgZXhpc3RpbmcgaXRlbXNcblx0XHQvLyB1c2luZyBhcmd1bWVudHMgdmFyaWFibGUgZGlyZWN0bHkgdG8gcmVkdWNlIGdjIGZvb3RwcmludFxuXHRcdGZvciAoaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHRoaXMuZGF0YVsodGhpcy5lbmQgKyBpICsgMSkgJSB0aGlzLmxlbmd0aF0gPSBhcmd1bWVudHNbaV07XG5cdFx0fVxuXHRcdC8vIHJlY2FsY3VsYXRlIHNpemVcblx0XHRpZiAodGhpcy5zaXplIDwgdGhpcy5sZW5ndGgpIHtcblx0XHRcdGlmICh0aGlzLnNpemUgKyBpID4gdGhpcy5sZW5ndGgpIHRoaXMuc2l6ZSA9IHRoaXMubGVuZ3RoO1xuXHRcdFx0ZWxzZSB0aGlzLnNpemUgKz0gaTtcblx0XHR9XG5cdFx0Ly8gcmVjYWxjdWxhdGUgZW5kXG5cdFx0dGhpcy5lbmQgPSAodGhpcy5lbmQgKyBpKSAlIHRoaXMubGVuZ3RoO1xuXHRcdC8vIHJlY2FsY3VsYXRlIHN0YXJ0XG5cdFx0dGhpcy5zdGFydCA9ICh0aGlzLmxlbmd0aCArIHRoaXMuZW5kIC0gdGhpcy5zaXplICsgMSkgJSB0aGlzLmxlbmd0aDtcblx0XHQvLyByZXR1cm4gbnVtYmVyIGN1cnJlbnQgbnVtYmVyIG9mIGl0ZW1zIGluIENCdWZmZXJcblx0XHRyZXR1cm4gdGhpcy5zaXplO1xuXHR9LFxuXHQvLyByZXZlcnNlIG9yZGVyIG9mIHRoZSBidWZmZXJcblx0cmV2ZXJzZSA6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgaSA9IDAsXG5cdFx0XHR0bXA7XG5cdFx0Zm9yICg7IGkgPCB+fih0aGlzLnNpemUgLyAyKTsgaSsrKSB7XG5cdFx0XHR0bXAgPSB0aGlzLmRhdGFbKHRoaXMuc3RhcnQgKyBpKSAlIHRoaXMubGVuZ3RoXTtcblx0XHRcdHRoaXMuZGF0YVsodGhpcy5zdGFydCArIGkpICUgdGhpcy5sZW5ndGhdID0gdGhpcy5kYXRhWyh0aGlzLnN0YXJ0ICsgKHRoaXMuc2l6ZSAtIGkgLSAxKSkgJSB0aGlzLmxlbmd0aF07XG5cdFx0XHR0aGlzLmRhdGFbKHRoaXMuc3RhcnQgKyAodGhpcy5zaXplIC0gaSAtIDEpKSAlIHRoaXMubGVuZ3RoXSA9IHRtcDtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdC8vIHJvdGF0ZSBidWZmZXIgdG8gdGhlIGxlZnQgYnkgY250ciwgb3IgYnkgMVxuXHRyb3RhdGVMZWZ0IDogZnVuY3Rpb24gKGNudHIpIHtcblx0XHRpZiAodHlwZW9mIGNudHIgPT09ICd1bmRlZmluZWQnKSBjbnRyID0gMTtcblx0XHRpZiAodHlwZW9mIGNudHIgIT09ICdudW1iZXInKSB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCBtdXN0IGJlIGEgbnVtYmVyXCIpO1xuXHRcdHdoaWxlICgtLWNudHIgPj0gMCkge1xuXHRcdFx0dGhpcy5wdXNoKHRoaXMuc2hpZnQoKSk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHQvLyByb3RhdGUgYnVmZmVyIHRvIHRoZSByaWdodCBieSBjbnRyLCBvciBieSAxXG5cdHJvdGF0ZVJpZ2h0IDogZnVuY3Rpb24gKGNudHIpIHtcblx0XHRpZiAodHlwZW9mIGNudHIgPT09ICd1bmRlZmluZWQnKSBjbnRyID0gMTtcblx0XHRpZiAodHlwZW9mIGNudHIgIT09ICdudW1iZXInKSB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCBtdXN0IGJlIGEgbnVtYmVyXCIpO1xuXHRcdHdoaWxlICgtLWNudHIgPj0gMCkge1xuXHRcdFx0dGhpcy51bnNoaWZ0KHRoaXMucG9wKCkpO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0Ly8gcmVtb3ZlIGFuZCByZXR1cm4gZmlyc3QgaXRlbVxuXHRzaGlmdCA6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgaXRlbTtcblx0XHQvLyBjaGVjayBpZiB0aGVyZSBhcmUgYW55IGl0ZW1zIGluIENCdWZmXG5cdFx0aWYgKHRoaXMuc2l6ZSA9PT0gMCkgcmV0dXJuO1xuXHRcdC8vIHN0b3JlIGZpcnN0IGl0ZW0gZm9yIHJldHVyblxuXHRcdGl0ZW0gPSB0aGlzLmRhdGFbdGhpcy5zdGFydF07XG5cdFx0Ly8gcmVjYWxjdWxhdGUgc3RhcnQgb2YgQ0J1ZmZlclxuXHRcdHRoaXMuc3RhcnQgPSAodGhpcy5zdGFydCArIDEpICUgdGhpcy5sZW5ndGg7XG5cdFx0Ly8gZGVjcmVtZW50IHNpemVcblx0XHR0aGlzLnNpemUtLTtcblx0XHRyZXR1cm4gaXRlbTtcblx0fSxcblx0Ly8gc29ydCBpdGVtc1xuXHRzb3J0IDogZnVuY3Rpb24gKGZuKSB7XG5cdFx0dGhpcy5kYXRhLnNvcnQoZm4gfHwgZGVmYXVsdENvbXBhcml0b3IpO1xuXHRcdHRoaXMuc3RhcnQgPSAwO1xuXHRcdHRoaXMuZW5kID0gdGhpcy5zaXplIC0gMTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0Ly8gYWRkIGl0ZW0gdG8gYmVnaW5uaW5nIG9mIGJ1ZmZlclxuXHR1bnNoaWZ0IDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpID0gMDtcblx0XHQvLyBjaGVjayBpZiBvdmVyZmxvdyBpcyBzZXQsIGFuZCBpZiBkYXRhIGlzIGFib3V0IHRvIGJlIG92ZXJ3cml0dGVuXG5cdFx0aWYgKHRoaXMub3ZlcmZsb3cgJiYgdGhpcy5zaXplICsgYXJndW1lbnRzLmxlbmd0aCA+IHRoaXMubGVuZ3RoKSB7XG5cdFx0XHQvLyBjYWxsIG92ZXJmbG93IGZ1bmN0aW9uIGFuZCBzZW5kIGRhdGEgdGhhdCdzIGFib3V0IHRvIGJlIG92ZXJ3cml0dGVuXG5cdFx0XHRmb3IgKDsgaSA8IHRoaXMuc2l6ZSArIGFyZ3VtZW50cy5sZW5ndGggLSB0aGlzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHRoaXMub3ZlcmZsb3codGhpcy5kYXRhW3RoaXMuZW5kIC0gKGkgJSB0aGlzLmxlbmd0aCldLCB0aGlzKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0Zm9yIChpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dGhpcy5kYXRhWyh0aGlzLmxlbmd0aCArIHRoaXMuc3RhcnQgLSAoaSAlIHRoaXMubGVuZ3RoKSAtIDEpICUgdGhpcy5sZW5ndGhdID0gYXJndW1lbnRzW2ldO1xuXHRcdH1cblx0XHRpZiAodGhpcy5sZW5ndGggLSB0aGlzLnNpemUgLSBpIDwgMCkge1xuXHRcdFx0dGhpcy5lbmQgKz0gdGhpcy5sZW5ndGggLSB0aGlzLnNpemUgLSBpO1xuXHRcdFx0aWYgKHRoaXMuZW5kIDwgMCkgdGhpcy5lbmQgPSB0aGlzLmxlbmd0aCArICh0aGlzLmVuZCAlIHRoaXMubGVuZ3RoKTtcblx0XHR9XG5cdFx0aWYgKHRoaXMuc2l6ZSA8IHRoaXMubGVuZ3RoKSB7XG5cdFx0XHRpZiAodGhpcy5zaXplICsgaSA+IHRoaXMubGVuZ3RoKSB0aGlzLnNpemUgPSB0aGlzLmxlbmd0aDtcblx0XHRcdGVsc2UgdGhpcy5zaXplICs9IGk7XG5cdFx0fVxuXHRcdHRoaXMuc3RhcnQgLT0gYXJndW1lbnRzLmxlbmd0aDtcblx0XHRpZiAodGhpcy5zdGFydCA8IDApIHRoaXMuc3RhcnQgPSB0aGlzLmxlbmd0aCArICh0aGlzLnN0YXJ0ICUgdGhpcy5sZW5ndGgpO1xuXHRcdHJldHVybiB0aGlzLnNpemU7XG5cdH0sXG5cblx0LyogYWNjZXNzb3IgbWV0aG9kcyAqL1xuXHQvLyByZXR1cm4gaW5kZXggb2YgZmlyc3QgbWF0Y2hlZCBlbGVtZW50XG5cdGluZGV4T2YgOiBmdW5jdGlvbiAoYXJnLCBpZHgpIHtcblx0XHRpZiAoIWlkeCkgaWR4ID0gMDtcblx0XHRmb3IgKDsgaWR4IDwgdGhpcy5zaXplOyBpZHgrKykge1xuXHRcdFx0aWYgKHRoaXMuZGF0YVsodGhpcy5zdGFydCArIGlkeCkgJSB0aGlzLmxlbmd0aF0gPT09IGFyZykgcmV0dXJuIGlkeDtcblx0XHR9XG5cdFx0cmV0dXJuIC0xO1xuXHR9LFxuXHQvLyByZXR1cm4gbGFzdCBpbmRleCBvZiB0aGUgZmlyc3QgbWF0Y2hcblx0bGFzdEluZGV4T2YgOiBmdW5jdGlvbiAoYXJnLCBpZHgpIHtcblx0XHRpZiAoIWlkeCkgaWR4ID0gdGhpcy5zaXplIC0gMTtcblx0XHRmb3IgKDsgaWR4ID49IDA7IGlkeC0tKSB7XG5cdFx0XHRpZiAodGhpcy5kYXRhWyh0aGlzLnN0YXJ0ICsgaWR4KSAlIHRoaXMubGVuZ3RoXSA9PT0gYXJnKSByZXR1cm4gaWR4O1xuXHRcdH1cblx0XHRyZXR1cm4gLTE7XG5cdH0sXG5cblx0Ly8gcmV0dXJuIHRoZSBpbmRleCBhbiBpdGVtIHdvdWxkIGJlIGluc2VydGVkIHRvIGlmIHRoaXNcblx0Ly8gaXMgYSBzb3J0ZWQgY2lyY3VsYXIgYnVmZmVyXG5cdHNvcnRlZEluZGV4IDogZnVuY3Rpb24odmFsdWUsIGNvbXBhcml0b3IsIGNvbnRleHQpIHtcblx0XHRjb21wYXJpdG9yID0gY29tcGFyaXRvciB8fCBkZWZhdWx0Q29tcGFyaXRvcjtcblx0XHR2YXIgbG93ID0gdGhpcy5zdGFydCxcblx0XHRcdGhpZ2ggPSB0aGlzLnNpemUgLSAxO1xuXG5cdFx0Ly8gVHJpY2t5IHBhcnQgaXMgZmluZGluZyBpZiBpdHMgYmVmb3JlIG9yIGFmdGVyIHRoZSBwaXZvdFxuXHRcdC8vIHdlIGNhbiBnZXQgdGhpcyBpbmZvIGJ5IGNoZWNraW5nIGlmIHRoZSB0YXJnZXQgaXMgbGVzcyB0aGFuXG5cdFx0Ly8gdGhlIGxhc3QgaXRlbS4gQWZ0ZXIgdGhhdCBpdCdzIGp1c3QgYSB0eXBpY2FsIGJpbmFyeSBzZWFyY2guXG5cdFx0aWYgKGxvdyAmJiBjb21wYXJpdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIHRoaXMuZGF0YVtoaWdoXSkgPiAwKSB7XG5cdFx0XHRsb3cgPSAwLCBoaWdoID0gdGhpcy5lbmQ7XG5cdFx0fVxuXG5cdFx0d2hpbGUgKGxvdyA8IGhpZ2gpIHtcblx0XHQgIHZhciBtaWQgPSAobG93ICsgaGlnaCkgPj4+IDE7XG5cdFx0ICBpZiAoY29tcGFyaXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCB0aGlzLmRhdGFbbWlkXSkgPiAwKSBsb3cgPSBtaWQgKyAxO1xuXHRcdCAgZWxzZSBoaWdoID0gbWlkO1xuXHRcdH1cblx0XHQvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xODYxODI3My8xNTE3OTE5XG5cdFx0cmV0dXJuICgoKGxvdyAtIHRoaXMuc3RhcnQpICUgdGhpcy5zaXplKSArIHRoaXMuc2l6ZSkgJSB0aGlzLnNpemU7XG5cdH0sXG5cblx0LyogaXRlcmF0aW9uIG1ldGhvZHMgKi9cblx0Ly8gY2hlY2sgZXZlcnkgaXRlbSBpbiB0aGUgYXJyYXkgYWdhaW5zdCBhIHRlc3Rcblx0ZXZlcnkgOiBmdW5jdGlvbiAoY2FsbGJhY2ssIGNvbnRleHQpIHtcblx0XHR2YXIgaSA9IDA7XG5cdFx0Zm9yICg7IGkgPCB0aGlzLnNpemU7IGkrKykge1xuXHRcdFx0aWYgKCFjYWxsYmFjay5jYWxsKGNvbnRleHQsIHRoaXMuZGF0YVsodGhpcy5zdGFydCArIGkpICUgdGhpcy5sZW5ndGhdLCBpLCB0aGlzKSlcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSxcblx0Ly8gbG9vcCB0aHJvdWdoIGVhY2ggaXRlbSBpbiBidWZmZXJcblx0Ly8gVE9ETzogZmlndXJlIG91dCBob3cgdG8gZW11bGF0ZSBBcnJheSB1c2UgYmV0dGVyXG5cdGZvckVhY2ggOiBmdW5jdGlvbiAoY2FsbGJhY2ssIGNvbnRleHQpIHtcblx0XHR2YXIgaSA9IDA7XG5cdFx0Zm9yICg7IGkgPCB0aGlzLnNpemU7IGkrKykge1xuXHRcdFx0Y2FsbGJhY2suY2FsbChjb250ZXh0LCB0aGlzLmRhdGFbKHRoaXMuc3RhcnQgKyBpKSAlIHRoaXMubGVuZ3RoXSwgaSwgdGhpcyk7XG5cdFx0fVxuXHR9LFxuXHQvLyBjaGVjayBpdGVtcyBhZ2FpbnMgdGVzdCB1bnRpbCBvbmUgcmV0dXJucyB0cnVlXG5cdC8vIFRPRE86IGZpZ3VyZSBvdXQgaG93IHRvIGVtdWxkYXRlIEFycmF5IHVzZSBiZXR0ZXJcblx0c29tZSA6IGZ1bmN0aW9uIChjYWxsYmFjaywgY29udGV4dCkge1xuXHRcdHZhciBpID0gMDtcblx0XHRmb3IgKDsgaSA8IHRoaXMuc2l6ZTsgaSsrKSB7XG5cdFx0XHRpZiAoY2FsbGJhY2suY2FsbChjb250ZXh0LCB0aGlzLmRhdGFbKHRoaXMuc3RhcnQgKyBpKSAlIHRoaXMubGVuZ3RoXSwgaSwgdGhpcykpXG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0sXG5cdC8vIGNhbGN1bGF0ZSB0aGUgYXZlcmFnZSB2YWx1ZSBvZiBhIGNpcmN1bGFyIGJ1ZmZlclxuXHRhdmcgOiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuc2l6ZSA9PSAwID8gMCA6ICh0aGlzLnN1bSgpIC8gdGhpcy5zaXplKTtcblx0fSxcblx0Ly8gbG9vcCB0aHJvdWdoIGVhY2ggaXRlbSBpbiBidWZmZXIgYW5kIGNhbGN1bGF0ZSBzdW1cblx0c3VtIDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpbmRleCA9IHRoaXMuc2l6ZTtcblx0XHR2YXIgcyA9IDA7XG5cdFx0d2hpbGUgKGluZGV4LS0pIHMgKz0gdGhpcy5kYXRhW2luZGV4XTtcblx0XHRyZXR1cm4gcztcblx0fSxcblx0Ly8gbG9vcCB0aHJvdWdoIGVhY2ggaXRlbSBpbiBidWZmZXIgYW5kIGNhbGN1bGF0ZSBtZWRpYW5cblx0bWVkaWFuIDogZnVuY3Rpb24gKCkge1xuXHRcdGlmICh0aGlzLnNpemUgPT09IDApXG5cdFx0XHRyZXR1cm4gMDtcblx0XHR2YXIgdmFsdWVzID0gdGhpcy5zbGljZSgpLnNvcnQoZGVmYXVsdENvbXBhcml0b3IpO1xuXHRcdHZhciBoYWxmID0gTWF0aC5mbG9vcih2YWx1ZXMubGVuZ3RoIC8gMik7XG5cdFx0aWYodmFsdWVzLmxlbmd0aCAlIDIpXG5cdFx0XHRyZXR1cm4gdmFsdWVzW2hhbGZdO1xuXHRcdGVsc2Vcblx0XHRcdHJldHVybiAodmFsdWVzW2hhbGYtMV0gKyB2YWx1ZXNbaGFsZl0pIC8gMi4wO1xuXHR9LFxuXHQvKiB1dGlsaXR5IG1ldGhvZHMgKi9cblx0Ly8gcmVzZXQgcG9pbnRlcnMgdG8gYnVmZmVyIHdpdGggemVybyBpdGVtc1xuXHQvLyBub3RlOiB0aGlzIHdpbGwgbm90IHJlbW92ZSB2YWx1ZXMgaW4gY2J1ZmZlciwgc28gaWYgZm9yIHNlY3VyaXR5IHZhbHVlc1xuXHQvLyAgICAgICBuZWVkIHRvIGJlIG92ZXJ3cml0dGVuLCBydW4gYC5maWxsKG51bGwpLmVtcHR5KClgXG5cdGVtcHR5IDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpID0gMDtcblx0XHR0aGlzLnNpemUgPSB0aGlzLnN0YXJ0ID0gMDtcblx0XHR0aGlzLmVuZCA9IHRoaXMubGVuZ3RoIC0gMTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0Ly8gZmlsbCBhbGwgcGxhY2VzIHdpdGggcGFzc2VkIHZhbHVlIG9yIGZ1bmN0aW9uXG5cdGZpbGwgOiBmdW5jdGlvbiAoYXJnKSB7XG5cdFx0dmFyIGkgPSAwO1xuXHRcdGlmICh0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHR3aGlsZSh0aGlzLmRhdGFbaV0gPSBhcmcoKSwgKytpIDwgdGhpcy5sZW5ndGgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR3aGlsZSh0aGlzLmRhdGFbaV0gPSBhcmcsICsraSA8IHRoaXMubGVuZ3RoKTtcblx0XHR9XG5cdFx0Ly8gcmVwb3NpdGlvbiBzdGFydC9lbmRcblx0XHR0aGlzLnN0YXJ0ID0gMDtcblx0XHR0aGlzLmVuZCA9IHRoaXMubGVuZ3RoIC0gMTtcblx0XHR0aGlzLnNpemUgPSB0aGlzLmxlbmd0aDtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0Ly8gcmV0dXJuIGZpcnN0IGl0ZW0gaW4gYnVmZmVyXG5cdGZpcnN0IDogZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLmRhdGFbdGhpcy5zdGFydF07XG5cdH0sXG5cdC8vIHJldHVybiBsYXN0IGl0ZW0gaW4gYnVmZmVyXG5cdGxhc3QgOiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuZGF0YVt0aGlzLmVuZF07XG5cdH0sXG5cdC8vIHJldHVybiBzcGVjaWZpYyBpbmRleCBpbiBidWZmZXJcblx0Z2V0IDogZnVuY3Rpb24gKGFyZykge1xuXHRcdHJldHVybiB0aGlzLmRhdGFbKHRoaXMuc3RhcnQgKyBhcmcpICUgdGhpcy5sZW5ndGhdO1xuXHR9LFxuXHRpc0Z1bGwgOiBmdW5jdGlvbiAoYXJnKSB7XG5cdFx0cmV0dXJuIHRoaXMubGVuZ3RoID09PSB0aGlzLnNpemU7XG5cdH0sXG5cdC8vIHNldCB2YWx1ZSBhdCBzcGVjaWZpZWQgaW5kZXhcblx0c2V0IDogZnVuY3Rpb24gKGlkeCwgYXJnKSB7XG5cdFx0cmV0dXJuIHRoaXMuZGF0YVsodGhpcy5zdGFydCArIGlkeCkgJSB0aGlzLmxlbmd0aF0gPSBhcmc7XG5cdH0sXG5cdC8vIHJldHVybiBjbGVhbiBhcnJheSBvZiB2YWx1ZXNcblx0dG9BcnJheSA6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpcy5zbGljZSgpO1xuXHR9LFxuXHQvLyBzbGljZSB0aGUgYnVmZmVyIHRvIGFuIGFycmFheVxuXHRzbGljZSA6IGZ1bmN0aW9uIChzdGFydCwgZW5kKSB7XG5cdFx0dmFyIGxlbmd0aCA9IHRoaXMuc2l6ZTtcblxuXHRcdHN0YXJ0ID0gK3N0YXJ0IHx8IDA7XG5cblx0XHRpZiAoc3RhcnQgPCAwKSB7XG5cdFx0XHRpZiAoc3RhcnQgPj0gZW5kKVxuXHRcdFx0XHRyZXR1cm4gW107XG5cdFx0XHRzdGFydCA9ICgtc3RhcnQgPiBsZW5ndGgpID8gMCA6IGxlbmd0aCArIHN0YXJ0O1xuXHRcdH1cblxuXHRcdGlmIChlbmQgPT0gbnVsbCB8fCBlbmQgPiBsZW5ndGgpXG5cdFx0XHRlbmQgPSBsZW5ndGg7XG5cdFx0ZWxzZSBpZiAoZW5kIDwgMClcblx0XHRcdGVuZCArPSBsZW5ndGg7XG5cdFx0ZWxzZVxuXHRcdFx0ZW5kID0gK2VuZCB8fCAwO1xuXG5cdFx0bGVuZ3RoID0gc3RhcnQgPCBlbmQgPyBlbmQgLSBzdGFydCA6IDA7XG5cblx0XHR2YXIgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKTtcblx0XHRmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG5cdFx0XHRyZXN1bHRbaW5kZXhdID0gdGhpcy5kYXRhWyh0aGlzLnN0YXJ0ICsgc3RhcnQgKyBpbmRleCkgJSB0aGlzLmxlbmd0aF07XG5cdFx0fVxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH1cbn07XG5cbmlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykgbW9kdWxlLmV4cG9ydHMgPSBDQnVmZmVyO1xuZWxzZSBnbG9iYWwuQ0J1ZmZlciA9IENCdWZmZXI7XG5cbn0odGhpcykpO1xuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuZnVuY3Rpb24gZHVwZV9hcnJheShjb3VudCwgdmFsdWUsIGkpIHtcbiAgdmFyIGMgPSBjb3VudFtpXXwwXG4gIGlmKGMgPD0gMCkge1xuICAgIHJldHVybiBbXVxuICB9XG4gIHZhciByZXN1bHQgPSBuZXcgQXJyYXkoYyksIGpcbiAgaWYoaSA9PT0gY291bnQubGVuZ3RoLTEpIHtcbiAgICBmb3Ioaj0wOyBqPGM7ICsraikge1xuICAgICAgcmVzdWx0W2pdID0gdmFsdWVcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZm9yKGo9MDsgajxjOyArK2opIHtcbiAgICAgIHJlc3VsdFtqXSA9IGR1cGVfYXJyYXkoY291bnQsIHZhbHVlLCBpKzEpXG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuZnVuY3Rpb24gZHVwZV9udW1iZXIoY291bnQsIHZhbHVlKSB7XG4gIHZhciByZXN1bHQsIGlcbiAgcmVzdWx0ID0gbmV3IEFycmF5KGNvdW50KVxuICBmb3IoaT0wOyBpPGNvdW50OyArK2kpIHtcbiAgICByZXN1bHRbaV0gPSB2YWx1ZVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuZnVuY3Rpb24gZHVwZShjb3VudCwgdmFsdWUpIHtcbiAgaWYodHlwZW9mIHZhbHVlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgdmFsdWUgPSAwXG4gIH1cbiAgc3dpdGNoKHR5cGVvZiBjb3VudCkge1xuICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICAgIGlmKGNvdW50ID4gMCkge1xuICAgICAgICByZXR1cm4gZHVwZV9udW1iZXIoY291bnR8MCwgdmFsdWUpXG4gICAgICB9XG4gICAgYnJlYWtcbiAgICBjYXNlIFwib2JqZWN0XCI6XG4gICAgICBpZih0eXBlb2YgKGNvdW50Lmxlbmd0aCkgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgcmV0dXJuIGR1cGVfYXJyYXkoY291bnQsIHZhbHVlLCAwKVxuICAgICAgfVxuICAgIGJyZWFrXG4gIH1cbiAgcmV0dXJuIFtdXG59XG5cbm1vZHVsZS5leHBvcnRzID0gZHVwZSIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBwb29sID0gcmVxdWlyZShcInR5cGVkYXJyYXktcG9vbFwiKVxudmFyIHVuaXEgPSByZXF1aXJlKFwidW5pcVwiKVxudmFyIGlvdGEgPSByZXF1aXJlKFwiaW90YS1hcnJheVwiKVxuXG5mdW5jdGlvbiBnZW5lcmF0ZU1lc2hlcihvcmRlciwgc2tpcCwgbWVyZ2UsIGFwcGVuZCwgbnVtX29wdGlvbnMsIG9wdGlvbnMsIHVzZUdldHRlcikge1xuICB2YXIgY29kZSA9IFtdXG4gIHZhciBkID0gb3JkZXIubGVuZ3RoXG4gIHZhciBpLCBqLCBrXG4gIFxuICAvL0J1aWxkIGFyZ3VtZW50cyBmb3IgYXBwZW5kIG1hY3JvXG4gIHZhciBhcHBlbmRfYXJncyA9IG5ldyBBcnJheSgyKmQrMStudW1fb3B0aW9ucylcbiAgZm9yKGk9MDsgaTxkOyArK2kpIHtcbiAgICBhcHBlbmRfYXJnc1tpXSA9IFwiaVwiK2lcbiAgfVxuICBmb3IoaT0wOyBpPGQ7ICsraSkge1xuICAgIGFwcGVuZF9hcmdzW2krZF0gPSBcImpcIitpXG4gIH1cbiAgYXBwZW5kX2FyZ3NbMipkXSA9IFwib3ZhbFwiXG4gIFxuICB2YXIgb3B0X2FyZ3MgPSBuZXcgQXJyYXkobnVtX29wdGlvbnMpXG4gIGZvcihpPTA7IGk8bnVtX29wdGlvbnM7ICsraSkge1xuICAgIG9wdF9hcmdzW2ldID0gXCJvcHRcIitpXG4gICAgYXBwZW5kX2FyZ3NbMipkKzEraV0gPSBcIm9wdFwiK2lcbiAgfVxuXG4gIC8vVW5wYWNrIHN0cmlkZSBhbmQgc2hhcGUgYXJyYXlzIGludG8gdmFyaWFibGVzXG4gIGNvZGUucHVzaChcInZhciBkYXRhPWFycmF5LmRhdGEsb2Zmc2V0PWFycmF5Lm9mZnNldCxzaGFwZT1hcnJheS5zaGFwZSxzdHJpZGU9YXJyYXkuc3RyaWRlXCIpXG4gIGZvcih2YXIgaT0wOyBpPGQ7ICsraSkge1xuICAgIGNvZGUucHVzaChbXCJ2YXIgc3RyaWRlXCIsaSxcIj1zdHJpZGVbXCIsb3JkZXJbaV0sXCJdfDAsc2hhcGVcIixpLFwiPXNoYXBlW1wiLG9yZGVyW2ldLFwiXXwwXCJdLmpvaW4oXCJcIikpXG4gICAgaWYoaSA+IDApIHtcbiAgICAgIGNvZGUucHVzaChbXCJ2YXIgYXN0ZXBcIixpLFwiPShzdHJpZGVcIixpLFwiLXN0cmlkZVwiLGktMSxcIipzaGFwZVwiLGktMSxcIil8MFwiXS5qb2luKFwiXCIpKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb2RlLnB1c2goW1widmFyIGFzdGVwXCIsaSxcIj1zdHJpZGVcIixpLFwifDBcIl0uam9pbihcIlwiKSlcbiAgICB9XG4gICAgaWYoaSA+IDApIHtcbiAgICAgIGNvZGUucHVzaChbXCJ2YXIgdnN0ZXBcIixpLFwiPSh2c3RlcFwiLGktMSxcIipzaGFwZVwiLGktMSxcIil8MFwiXS5qb2luKFwiXCIpKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb2RlLnB1c2goW1widmFyIHZzdGVwXCIsaSxcIj0xXCJdLmpvaW4oXCJcIikpXG4gICAgfVxuICAgIGNvZGUucHVzaChbXCJ2YXIgaVwiLGksXCI9MCxqXCIsaSxcIj0wLGtcIixpLFwiPTAsdXN0ZXBcIixpLFwiPXZzdGVwXCIsaSxcInwwLGJzdGVwXCIsaSxcIj1hc3RlcFwiLGksXCJ8MFwiXS5qb2luKFwiXCIpKVxuICB9XG4gIFxuICAvL0luaXRpYWxpemUgcG9pbnRlcnNcbiAgY29kZS5wdXNoKFwidmFyIGFfcHRyPW9mZnNldD4+PjAsYl9wdHI9MCx1X3B0cj0wLHZfcHRyPTAsaT0wLGQ9MCx2YWw9MCxvdmFsPTBcIilcbiAgXG4gIC8vSW5pdGlhbGl6ZSBjb3VudFxuICBjb2RlLnB1c2goXCJ2YXIgY291bnQ9XCIgKyBpb3RhKGQpLm1hcChmdW5jdGlvbihpKSB7IHJldHVybiBcInNoYXBlXCIraX0pLmpvaW4oXCIqXCIpKVxuICBjb2RlLnB1c2goXCJ2YXIgdmlzaXRlZD1tYWxsb2NVaW50OChjb3VudClcIilcbiAgXG4gIC8vWmVybyBvdXQgdmlzaXRlZCBtYXBcbiAgY29kZS5wdXNoKFwiZm9yKDtpPGNvdW50OysraSl7dmlzaXRlZFtpXT0wfVwiKVxuICBcbiAgLy9CZWdpbiB0cmF2ZXJzYWxcbiAgZm9yKGk9ZC0xOyBpPj0wOyAtLWkpIHtcbiAgICBjb2RlLnB1c2goW1wiZm9yKGlcIixpLFwiPTA7aVwiLGksXCI8c2hhcGVcIixpLFwiOysraVwiLGksXCIpe1wiXS5qb2luKFwiXCIpKVxuICB9XG4gIGNvZGUucHVzaChcImlmKCF2aXNpdGVkW3ZfcHRyXSl7XCIpXG4gIFxuICAgIGlmKHVzZUdldHRlcikge1xuICAgICAgY29kZS5wdXNoKFwidmFsPWRhdGEuZ2V0KGFfcHRyKVwiKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb2RlLnB1c2goXCJ2YWw9ZGF0YVthX3B0cl1cIilcbiAgICB9XG4gIFxuICAgIGlmKHNraXApIHtcbiAgICAgIGNvZGUucHVzaChcImlmKCFza2lwKHZhbCkpe1wiKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb2RlLnB1c2goXCJpZih2YWwhPT0wKXtcIilcbiAgICB9XG4gIFxuICAgICAgLy9TYXZlIHZhbCB0byBvdmFsXG4gICAgICBjb2RlLnB1c2goXCJvdmFsID0gdmFsXCIpXG4gIFxuICAgICAgLy9HZW5lcmF0ZSBtZXJnaW5nIGNvZGVcbiAgICAgIGZvcihpPTA7IGk8ZDsgKytpKSB7XG4gICAgICAgIGNvZGUucHVzaChcInVfcHRyPXZfcHRyK3ZzdGVwXCIraSlcbiAgICAgICAgY29kZS5wdXNoKFwiYl9wdHI9YV9wdHIrc3RyaWRlXCIraSlcbiAgICAgICAgY29kZS5wdXNoKFtcImpcIixpLFwiX2xvb3A6IGZvcihqXCIsaSxcIj0xK2lcIixpLFwiO2pcIixpLFwiPHNoYXBlXCIsaSxcIjsrK2pcIixpLFwiKXtcIl0uam9pbihcIlwiKSlcbiAgICAgICAgZm9yKGo9aS0xOyBqPj0wOyAtLWopIHtcbiAgICAgICAgICBjb2RlLnB1c2goW1wiZm9yKGtcIixqLFwiPWlcIixqLFwiO2tcIixqLFwiPGpcIixqLFwiOysra1wiLGosXCIpe1wiXS5qb2luKFwiXCIpKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAgIC8vQ2hlY2sgaWYgd2UgY2FuIG1lcmdlIHRoaXMgdm94ZWxcbiAgICAgICAgICBjb2RlLnB1c2goXCJpZih2aXNpdGVkW3VfcHRyXSkgeyBicmVhayBqXCIraStcIl9sb29wOyB9XCIpXG4gICAgICAgIFxuICAgICAgICAgIGlmKHVzZUdldHRlcikge1xuICAgICAgICAgICAgY29kZS5wdXNoKFwidmFsPWRhdGEuZ2V0KGJfcHRyKVwiKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb2RlLnB1c2goXCJ2YWw9ZGF0YVtiX3B0cl1cIilcbiAgICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAgIGlmKHNraXAgJiYgbWVyZ2UpIHtcbiAgICAgICAgICAgIGNvZGUucHVzaChcImlmKHNraXAodmFsKSB8fCAhbWVyZ2Uob3ZhbCx2YWwpKXsgYnJlYWsgalwiK2krXCJfbG9vcDsgfVwiKVxuICAgICAgICAgIH0gZWxzZSBpZihza2lwKSB7XG4gICAgICAgICAgICBjb2RlLnB1c2goXCJpZihza2lwKHZhbCkgfHwgdmFsICE9PSBvdmFsKXsgYnJlYWsgalwiK2krXCJfbG9vcDsgfVwiKVxuICAgICAgICAgIH0gZWxzZSBpZihtZXJnZSkge1xuICAgICAgICAgICAgY29kZS5wdXNoKFwiaWYodmFsID09PSAwIHx8ICFtZXJnZShvdmFsLHZhbCkpeyBicmVhayBqXCIraStcIl9sb29wOyB9XCIpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvZGUucHVzaChcImlmKHZhbCA9PT0gMCB8fCB2YWwgIT09IG92YWwpeyBicmVhayBqXCIraStcIl9sb29wOyB9XCIpXG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vQ2xvc2Ugb2ZmIGxvb3AgYm9kaWVzXG4gICAgICAgICAgY29kZS5wdXNoKFwiKyt1X3B0clwiKVxuICAgICAgICAgIGNvZGUucHVzaChcImJfcHRyKz1zdHJpZGUwXCIpXG4gICAgICAgIGNvZGUucHVzaChcIn1cIilcbiAgICAgICAgXG4gICAgICAgIGZvcihqPTE7IGo8PWk7ICsraikge1xuICAgICAgICAgIGNvZGUucHVzaChcInVfcHRyKz11c3RlcFwiK2opXG4gICAgICAgICAgY29kZS5wdXNoKFwiYl9wdHIrPWJzdGVwXCIrailcbiAgICAgICAgICBjb2RlLnB1c2goXCJ9XCIpXG4gICAgICAgIH1cbiAgICAgICAgaWYoaSA8IGQtMSkge1xuICAgICAgICAgIGNvZGUucHVzaChcImQ9alwiK2krXCItaVwiK2kpXG4gICAgICAgICAgY29kZS5wdXNoKFtcInVzdGVwXCIsaSsxLFwiPSh2c3RlcFwiLGkrMSxcIi12c3RlcFwiLGksXCIqZCl8MFwiXS5qb2luKFwiXCIpKVxuICAgICAgICAgIGNvZGUucHVzaChbXCJic3RlcFwiLGkrMSxcIj0oc3RyaWRlXCIsaSsxLFwiLXN0cmlkZVwiLGksXCIqZCl8MFwiXS5qb2luKFwiXCIpKVxuICAgICAgICB9XG4gICAgICB9XG4gIFxuICAgICAgLy9NYXJrIG9mZiB2aXNpdGVkIHRhYmxlXG4gICAgICBjb2RlLnB1c2goXCJ1X3B0cj12X3B0clwiKVxuICAgICAgZm9yKGk9ZC0xOyBpPj0wOyAtLWkpIHtcbiAgICAgICAgY29kZS5wdXNoKFtcImZvcihrXCIsaSxcIj1pXCIsaSxcIjtrXCIsaSxcIjxqXCIsaSxcIjsrK2tcIixpLFwiKXtcIl0uam9pbihcIlwiKSlcbiAgICAgIH1cbiAgICAgIGNvZGUucHVzaChcInZpc2l0ZWRbdV9wdHIrK109MVwiKVxuICAgICAgY29kZS5wdXNoKFwifVwiKVxuICAgICAgZm9yKGk9MTsgaTxkOyArK2kpIHtcbiAgICAgICAgY29kZS5wdXNoKFwidV9wdHIrPXVzdGVwXCIraSlcbiAgICAgICAgY29kZS5wdXNoKFwifVwiKVxuICAgICAgfVxuICBcbiAgICAgIC8vQXBwZW5kIGNodW5rIHRvIG1lc2hcbiAgICAgIGNvZGUucHVzaChcImFwcGVuZChcIisgYXBwZW5kX2FyZ3Muam9pbihcIixcIikrIFwiKVwiKVxuICAgIFxuICAgIGNvZGUucHVzaChcIn1cIilcbiAgY29kZS5wdXNoKFwifVwiKVxuICBjb2RlLnB1c2goXCIrK3ZfcHRyXCIpXG4gIGZvcih2YXIgaT0wOyBpPGQ7ICsraSkge1xuICAgIGNvZGUucHVzaChcImFfcHRyKz1hc3RlcFwiK2kpXG4gICAgY29kZS5wdXNoKFwifVwiKVxuICB9XG4gIFxuICBjb2RlLnB1c2goXCJmcmVlVWludDgodmlzaXRlZClcIilcbiAgXG4gIGlmKG9wdGlvbnMuZGVidWcpIHtcbiAgICBjb25zb2xlLmxvZyhcIkdFTkVSQVRJTkcgTUVTSEVSOlwiKVxuICAgIGNvbnNvbGUubG9nKGNvZGUuam9pbihcIlxcblwiKSlcbiAgfVxuICBcbiAgLy9Db21waWxlIHByb2NlZHVyZVxuICB2YXIgYXJncyA9IFtcImFwcGVuZFwiLCBcIm1hbGxvY1VpbnQ4XCIsIFwiZnJlZVVpbnQ4XCJdXG4gIGlmKG1lcmdlKSB7XG4gICAgYXJncy51bnNoaWZ0KFwibWVyZ2VcIilcbiAgfVxuICBpZihza2lwKSB7XG4gICAgYXJncy51bnNoaWZ0KFwic2tpcFwiKVxuICB9XG4gIFxuICAvL0J1aWxkIHdyYXBwZXJcbiAgdmFyIGxvY2FsX2FyZ3MgPSBbXCJhcnJheVwiXS5jb25jYXQob3B0X2FyZ3MpXG4gIHZhciBmdW5jTmFtZSA9IFtcImdyZWVkeU1lc2hlclwiLCBkLCBcImRfb3JkXCIsIG9yZGVyLmpvaW4oXCJzXCIpICwgKHNraXAgPyBcInNraXBcIiA6IFwiXCIpICwgKG1lcmdlID8gXCJtZXJnZVwiIDogXCJcIildLmpvaW4oXCJcIilcbiAgdmFyIGdlbl9ib2R5ID0gW1wiJ3VzZSBzdHJpY3QnO2Z1bmN0aW9uIFwiLCBmdW5jTmFtZSwgXCIoXCIsIGxvY2FsX2FyZ3Muam9pbihcIixcIiksIFwiKXtcIiwgY29kZS5qb2luKFwiXFxuXCIpLCBcIn07cmV0dXJuIFwiLCBmdW5jTmFtZV0uam9pbihcIlwiKVxuICBhcmdzLnB1c2goZ2VuX2JvZHkpXG4gIHZhciBwcm9jID0gRnVuY3Rpb24uYXBwbHkodW5kZWZpbmVkLCBhcmdzKVxuICBcbiAgaWYoc2tpcCAmJiBtZXJnZSkge1xuICAgIHJldHVybiBwcm9jKHNraXAsIG1lcmdlLCBhcHBlbmQsIHBvb2wubWFsbG9jVWludDgsIHBvb2wuZnJlZVVpbnQ4KVxuICB9IGVsc2UgaWYoc2tpcCkge1xuICAgIHJldHVybiBwcm9jKHNraXAsIGFwcGVuZCwgcG9vbC5tYWxsb2NVaW50OCwgcG9vbC5mcmVlVWludDgpXG4gIH0gZWxzZSBpZihtZXJnZSkge1xuICAgIHJldHVybiBwcm9jKG1lcmdlLCBhcHBlbmQsIHBvb2wubWFsbG9jVWludDgsIHBvb2wuZnJlZVVpbnQ4KVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBwcm9jKGFwcGVuZCwgcG9vbC5tYWxsb2NVaW50OCwgcG9vbC5mcmVlVWludDgpXG4gIH1cbn1cblxuLy9UaGUgYWN0dWFsIG1lc2ggY29tcGlsZXJcbmZ1bmN0aW9uIGNvbXBpbGVNZXNoZXIob3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICBpZighb3B0aW9ucy5vcmRlcikge1xuICAgIHRocm93IG5ldyBFcnJvcihcImdyZWVkeS1tZXNoZXI6IE1pc3Npbmcgb3JkZXIgZmllbGRcIilcbiAgfVxuICBpZighb3B0aW9ucy5hcHBlbmQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJncmVlZHktbWVzaGVyOiBNaXNzaW5nIGFwcGVuZCBmaWVsZFwiKVxuICB9XG4gIHJldHVybiBnZW5lcmF0ZU1lc2hlcihcbiAgICBvcHRpb25zLm9yZGVyLFxuICAgIG9wdGlvbnMuc2tpcCxcbiAgICBvcHRpb25zLm1lcmdlLFxuICAgIG9wdGlvbnMuYXBwZW5kLFxuICAgIG9wdGlvbnMuZXh0cmFBcmdzfDAsXG4gICAgb3B0aW9ucyxcbiAgICAhIW9wdGlvbnMudXNlR2V0dGVyXG4gIClcbn1cbm1vZHVsZS5leHBvcnRzID0gY29tcGlsZU1lc2hlclxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuZnVuY3Rpb24gaW90YShuKSB7XG4gIHZhciByZXN1bHQgPSBuZXcgQXJyYXkobilcbiAgZm9yKHZhciBpPTA7IGk8bjsgKytpKSB7XG4gICAgcmVzdWx0W2ldID0gaVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpb3RhIiwiLyohXG4gKiBEZXRlcm1pbmUgaWYgYW4gb2JqZWN0IGlzIGEgQnVmZmVyXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cblxuLy8gVGhlIF9pc0J1ZmZlciBjaGVjayBpcyBmb3IgU2FmYXJpIDUtNyBzdXBwb3J0LCBiZWNhdXNlIGl0J3MgbWlzc2luZ1xuLy8gT2JqZWN0LnByb3RvdHlwZS5jb25zdHJ1Y3Rvci4gUmVtb3ZlIHRoaXMgZXZlbnR1YWxseVxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiBvYmogIT0gbnVsbCAmJiAoaXNCdWZmZXIob2JqKSB8fCBpc1Nsb3dCdWZmZXIob2JqKSB8fCAhIW9iai5faXNCdWZmZXIpXG59XG5cbmZ1bmN0aW9uIGlzQnVmZmVyIChvYmopIHtcbiAgcmV0dXJuICEhb2JqLmNvbnN0cnVjdG9yICYmIHR5cGVvZiBvYmouY29uc3RydWN0b3IuaXNCdWZmZXIgPT09ICdmdW5jdGlvbicgJiYgb2JqLmNvbnN0cnVjdG9yLmlzQnVmZmVyKG9iailcbn1cblxuLy8gRm9yIE5vZGUgdjAuMTAgc3VwcG9ydC4gUmVtb3ZlIHRoaXMgZXZlbnR1YWxseS5cbmZ1bmN0aW9uIGlzU2xvd0J1ZmZlciAob2JqKSB7XG4gIHJldHVybiB0eXBlb2Ygb2JqLnJlYWRGbG9hdExFID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBvYmouc2xpY2UgPT09ICdmdW5jdGlvbicgJiYgaXNCdWZmZXIob2JqLnNsaWNlKDAsIDApKVxufVxuIiwiLy8gU291cmNlOiBodHRwOi8vanNmaWRkbGUubmV0L3ZXeDhWL1xuLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy81NjAzMTk1L2Z1bGwtbGlzdC1vZi1qYXZhc2NyaXB0LWtleWNvZGVzXG5cbi8qKlxuICogQ29uZW5pZW5jZSBtZXRob2QgcmV0dXJucyBjb3JyZXNwb25kaW5nIHZhbHVlIGZvciBnaXZlbiBrZXlOYW1lIG9yIGtleUNvZGUuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0ga2V5Q29kZSB7TnVtYmVyfSBvciBrZXlOYW1lIHtTdHJpbmd9XG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VhcmNoSW5wdXQpIHtcbiAgLy8gS2V5Ym9hcmQgRXZlbnRzXG4gIGlmIChzZWFyY2hJbnB1dCAmJiAnb2JqZWN0JyA9PT0gdHlwZW9mIHNlYXJjaElucHV0KSB7XG4gICAgdmFyIGhhc0tleUNvZGUgPSBzZWFyY2hJbnB1dC53aGljaCB8fCBzZWFyY2hJbnB1dC5rZXlDb2RlIHx8IHNlYXJjaElucHV0LmNoYXJDb2RlXG4gICAgaWYgKGhhc0tleUNvZGUpIHNlYXJjaElucHV0ID0gaGFzS2V5Q29kZVxuICB9XG5cbiAgLy8gTnVtYmVyc1xuICBpZiAoJ251bWJlcicgPT09IHR5cGVvZiBzZWFyY2hJbnB1dCkgcmV0dXJuIG5hbWVzW3NlYXJjaElucHV0XVxuXG4gIC8vIEV2ZXJ5dGhpbmcgZWxzZSAoY2FzdCB0byBzdHJpbmcpXG4gIHZhciBzZWFyY2ggPSBTdHJpbmcoc2VhcmNoSW5wdXQpXG5cbiAgLy8gY2hlY2sgY29kZXNcbiAgdmFyIGZvdW5kTmFtZWRLZXkgPSBjb2Rlc1tzZWFyY2gudG9Mb3dlckNhc2UoKV1cbiAgaWYgKGZvdW5kTmFtZWRLZXkpIHJldHVybiBmb3VuZE5hbWVkS2V5XG5cbiAgLy8gY2hlY2sgYWxpYXNlc1xuICB2YXIgZm91bmROYW1lZEtleSA9IGFsaWFzZXNbc2VhcmNoLnRvTG93ZXJDYXNlKCldXG4gIGlmIChmb3VuZE5hbWVkS2V5KSByZXR1cm4gZm91bmROYW1lZEtleVxuXG4gIC8vIHdlaXJkIGNoYXJhY3Rlcj9cbiAgaWYgKHNlYXJjaC5sZW5ndGggPT09IDEpIHJldHVybiBzZWFyY2guY2hhckNvZGVBdCgwKVxuXG4gIHJldHVybiB1bmRlZmluZWRcbn1cblxuLyoqXG4gKiBHZXQgYnkgbmFtZVxuICpcbiAqICAgZXhwb3J0cy5jb2RlWydlbnRlciddIC8vID0+IDEzXG4gKi9cblxudmFyIGNvZGVzID0gZXhwb3J0cy5jb2RlID0gZXhwb3J0cy5jb2RlcyA9IHtcbiAgJ2JhY2tzcGFjZSc6IDgsXG4gICd0YWInOiA5LFxuICAnZW50ZXInOiAxMyxcbiAgJ3NoaWZ0JzogMTYsXG4gICdjdHJsJzogMTcsXG4gICdhbHQnOiAxOCxcbiAgJ3BhdXNlL2JyZWFrJzogMTksXG4gICdjYXBzIGxvY2snOiAyMCxcbiAgJ2VzYyc6IDI3LFxuICAnc3BhY2UnOiAzMixcbiAgJ3BhZ2UgdXAnOiAzMyxcbiAgJ3BhZ2UgZG93bic6IDM0LFxuICAnZW5kJzogMzUsXG4gICdob21lJzogMzYsXG4gICdsZWZ0JzogMzcsXG4gICd1cCc6IDM4LFxuICAncmlnaHQnOiAzOSxcbiAgJ2Rvd24nOiA0MCxcbiAgJ2luc2VydCc6IDQ1LFxuICAnZGVsZXRlJzogNDYsXG4gICdjb21tYW5kJzogOTEsXG4gICdsZWZ0IGNvbW1hbmQnOiA5MSxcbiAgJ3JpZ2h0IGNvbW1hbmQnOiA5MyxcbiAgJ251bXBhZCAqJzogMTA2LFxuICAnbnVtcGFkICsnOiAxMDcsXG4gICdudW1wYWQgLSc6IDEwOSxcbiAgJ251bXBhZCAuJzogMTEwLFxuICAnbnVtcGFkIC8nOiAxMTEsXG4gICdudW0gbG9jayc6IDE0NCxcbiAgJ3Njcm9sbCBsb2NrJzogMTQ1LFxuICAnbXkgY29tcHV0ZXInOiAxODIsXG4gICdteSBjYWxjdWxhdG9yJzogMTgzLFxuICAnOyc6IDE4NixcbiAgJz0nOiAxODcsXG4gICcsJzogMTg4LFxuICAnLSc6IDE4OSxcbiAgJy4nOiAxOTAsXG4gICcvJzogMTkxLFxuICAnYCc6IDE5MixcbiAgJ1snOiAyMTksXG4gICdcXFxcJzogMjIwLFxuICAnXSc6IDIyMSxcbiAgXCInXCI6IDIyMlxufVxuXG4vLyBIZWxwZXIgYWxpYXNlc1xuXG52YXIgYWxpYXNlcyA9IGV4cG9ydHMuYWxpYXNlcyA9IHtcbiAgJ3dpbmRvd3MnOiA5MSxcbiAgJ+KHpyc6IDE2LFxuICAn4oylJzogMTgsXG4gICfijIMnOiAxNyxcbiAgJ+KMmCc6IDkxLFxuICAnY3RsJzogMTcsXG4gICdjb250cm9sJzogMTcsXG4gICdvcHRpb24nOiAxOCxcbiAgJ3BhdXNlJzogMTksXG4gICdicmVhayc6IDE5LFxuICAnY2Fwcyc6IDIwLFxuICAncmV0dXJuJzogMTMsXG4gICdlc2NhcGUnOiAyNyxcbiAgJ3NwYyc6IDMyLFxuICAncGd1cCc6IDMzLFxuICAncGdkbic6IDM0LFxuICAnaW5zJzogNDUsXG4gICdkZWwnOiA0NixcbiAgJ2NtZCc6IDkxXG59XG5cblxuLyohXG4gKiBQcm9ncmFtYXRpY2FsbHkgYWRkIHRoZSBmb2xsb3dpbmdcbiAqL1xuXG4vLyBsb3dlciBjYXNlIGNoYXJzXG5mb3IgKGkgPSA5NzsgaSA8IDEyMzsgaSsrKSBjb2Rlc1tTdHJpbmcuZnJvbUNoYXJDb2RlKGkpXSA9IGkgLSAzMlxuXG4vLyBudW1iZXJzXG5mb3IgKHZhciBpID0gNDg7IGkgPCA1ODsgaSsrKSBjb2Rlc1tpIC0gNDhdID0gaVxuXG4vLyBmdW5jdGlvbiBrZXlzXG5mb3IgKGkgPSAxOyBpIDwgMTM7IGkrKykgY29kZXNbJ2YnK2ldID0gaSArIDExMVxuXG4vLyBudW1wYWQga2V5c1xuZm9yIChpID0gMDsgaSA8IDEwOyBpKyspIGNvZGVzWydudW1wYWQgJytpXSA9IGkgKyA5NlxuXG4vKipcbiAqIEdldCBieSBjb2RlXG4gKlxuICogICBleHBvcnRzLm5hbWVbMTNdIC8vID0+ICdFbnRlcidcbiAqL1xuXG52YXIgbmFtZXMgPSBleHBvcnRzLm5hbWVzID0gZXhwb3J0cy50aXRsZSA9IHt9IC8vIHRpdGxlIGZvciBiYWNrd2FyZCBjb21wYXRcblxuLy8gQ3JlYXRlIHJldmVyc2UgbWFwcGluZ1xuZm9yIChpIGluIGNvZGVzKSBuYW1lc1tjb2Rlc1tpXV0gPSBpXG5cbi8vIEFkZCBhbGlhc2VzXG5mb3IgKHZhciBhbGlhcyBpbiBhbGlhc2VzKSB7XG4gIGNvZGVzW2FsaWFzXSA9IGFsaWFzZXNbYWxpYXNdXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhcmdzLCBvcHRzKSB7XG4gICAgaWYgKCFvcHRzKSBvcHRzID0ge307XG4gICAgXG4gICAgdmFyIGZsYWdzID0geyBib29scyA6IHt9LCBzdHJpbmdzIDoge30sIHVua25vd25GbjogbnVsbCB9O1xuXG4gICAgaWYgKHR5cGVvZiBvcHRzWyd1bmtub3duJ10gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZmxhZ3MudW5rbm93bkZuID0gb3B0c1sndW5rbm93biddO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0c1snYm9vbGVhbiddID09PSAnYm9vbGVhbicgJiYgb3B0c1snYm9vbGVhbiddKSB7XG4gICAgICBmbGFncy5hbGxCb29scyA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIFtdLmNvbmNhdChvcHRzWydib29sZWFuJ10pLmZpbHRlcihCb29sZWFuKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICBmbGFncy5ib29sc1trZXldID0gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICB2YXIgYWxpYXNlcyA9IHt9O1xuICAgIE9iamVjdC5rZXlzKG9wdHMuYWxpYXMgfHwge30pLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBhbGlhc2VzW2tleV0gPSBbXS5jb25jYXQob3B0cy5hbGlhc1trZXldKTtcbiAgICAgICAgYWxpYXNlc1trZXldLmZvckVhY2goZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIGFsaWFzZXNbeF0gPSBba2V5XS5jb25jYXQoYWxpYXNlc1trZXldLmZpbHRlcihmdW5jdGlvbiAoeSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4ICE9PSB5O1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIFtdLmNvbmNhdChvcHRzLnN0cmluZykuZmlsdGVyKEJvb2xlYW4pLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBmbGFncy5zdHJpbmdzW2tleV0gPSB0cnVlO1xuICAgICAgICBpZiAoYWxpYXNlc1trZXldKSB7XG4gICAgICAgICAgICBmbGFncy5zdHJpbmdzW2FsaWFzZXNba2V5XV0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgIH0pO1xuXG4gICAgdmFyIGRlZmF1bHRzID0gb3B0c1snZGVmYXVsdCddIHx8IHt9O1xuICAgIFxuICAgIHZhciBhcmd2ID0geyBfIDogW10gfTtcbiAgICBPYmplY3Qua2V5cyhmbGFncy5ib29scykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHNldEFyZyhrZXksIGRlZmF1bHRzW2tleV0gPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogZGVmYXVsdHNba2V5XSk7XG4gICAgfSk7XG4gICAgXG4gICAgdmFyIG5vdEZsYWdzID0gW107XG5cbiAgICBpZiAoYXJncy5pbmRleE9mKCctLScpICE9PSAtMSkge1xuICAgICAgICBub3RGbGFncyA9IGFyZ3Muc2xpY2UoYXJncy5pbmRleE9mKCctLScpKzEpO1xuICAgICAgICBhcmdzID0gYXJncy5zbGljZSgwLCBhcmdzLmluZGV4T2YoJy0tJykpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFyZ0RlZmluZWQoa2V5LCBhcmcpIHtcbiAgICAgICAgcmV0dXJuIChmbGFncy5hbGxCb29scyAmJiAvXi0tW149XSskLy50ZXN0KGFyZykpIHx8XG4gICAgICAgICAgICBmbGFncy5zdHJpbmdzW2tleV0gfHwgZmxhZ3MuYm9vbHNba2V5XSB8fCBhbGlhc2VzW2tleV07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0QXJnIChrZXksIHZhbCwgYXJnKSB7XG4gICAgICAgIGlmIChhcmcgJiYgZmxhZ3MudW5rbm93bkZuICYmICFhcmdEZWZpbmVkKGtleSwgYXJnKSkge1xuICAgICAgICAgICAgaWYgKGZsYWdzLnVua25vd25GbihhcmcpID09PSBmYWxzZSkgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHZhbHVlID0gIWZsYWdzLnN0cmluZ3Nba2V5XSAmJiBpc051bWJlcih2YWwpXG4gICAgICAgICAgICA/IE51bWJlcih2YWwpIDogdmFsXG4gICAgICAgIDtcbiAgICAgICAgc2V0S2V5KGFyZ3YsIGtleS5zcGxpdCgnLicpLCB2YWx1ZSk7XG4gICAgICAgIFxuICAgICAgICAoYWxpYXNlc1trZXldIHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICBzZXRLZXkoYXJndiwgeC5zcGxpdCgnLicpLCB2YWx1ZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldEtleSAob2JqLCBrZXlzLCB2YWx1ZSkge1xuICAgICAgICB2YXIgbyA9IG9iajtcbiAgICAgICAga2V5cy5zbGljZSgwLC0xKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIGlmIChvW2tleV0gPT09IHVuZGVmaW5lZCkgb1trZXldID0ge307XG4gICAgICAgICAgICBvID0gb1trZXldO1xuICAgICAgICB9KTtcblxuICAgICAgICB2YXIga2V5ID0ga2V5c1trZXlzLmxlbmd0aCAtIDFdO1xuICAgICAgICBpZiAob1trZXldID09PSB1bmRlZmluZWQgfHwgZmxhZ3MuYm9vbHNba2V5XSB8fCB0eXBlb2Ygb1trZXldID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIG9ba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob1trZXldKSkge1xuICAgICAgICAgICAgb1trZXldLnB1c2godmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgb1trZXldID0gWyBvW2tleV0sIHZhbHVlIF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgZnVuY3Rpb24gYWxpYXNJc0Jvb2xlYW4oa2V5KSB7XG4gICAgICByZXR1cm4gYWxpYXNlc1trZXldLnNvbWUoZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICByZXR1cm4gZmxhZ3MuYm9vbHNbeF07XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGFyZyA9IGFyZ3NbaV07XG4gICAgICAgIFxuICAgICAgICBpZiAoL14tLS4rPS8udGVzdChhcmcpKSB7XG4gICAgICAgICAgICAvLyBVc2luZyBbXFxzXFxTXSBpbnN0ZWFkIG9mIC4gYmVjYXVzZSBqcyBkb2Vzbid0IHN1cHBvcnQgdGhlXG4gICAgICAgICAgICAvLyAnZG90YWxsJyByZWdleCBtb2RpZmllci4gU2VlOlxuICAgICAgICAgICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTA2ODMwOC8xMzIxNlxuICAgICAgICAgICAgdmFyIG0gPSBhcmcubWF0Y2goL14tLShbXj1dKyk9KFtcXHNcXFNdKikkLyk7XG4gICAgICAgICAgICB2YXIga2V5ID0gbVsxXTtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IG1bMl07XG4gICAgICAgICAgICBpZiAoZmxhZ3MuYm9vbHNba2V5XSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgIT09ICdmYWxzZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZXRBcmcoa2V5LCB2YWx1ZSwgYXJnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICgvXi0tbm8tLisvLnRlc3QoYXJnKSkge1xuICAgICAgICAgICAgdmFyIGtleSA9IGFyZy5tYXRjaCgvXi0tbm8tKC4rKS8pWzFdO1xuICAgICAgICAgICAgc2V0QXJnKGtleSwgZmFsc2UsIGFyZyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoL14tLS4rLy50ZXN0KGFyZykpIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBhcmcubWF0Y2goL14tLSguKykvKVsxXTtcbiAgICAgICAgICAgIHZhciBuZXh0ID0gYXJnc1tpICsgMV07XG4gICAgICAgICAgICBpZiAobmV4dCAhPT0gdW5kZWZpbmVkICYmICEvXi0vLnRlc3QobmV4dClcbiAgICAgICAgICAgICYmICFmbGFncy5ib29sc1trZXldXG4gICAgICAgICAgICAmJiAhZmxhZ3MuYWxsQm9vbHNcbiAgICAgICAgICAgICYmIChhbGlhc2VzW2tleV0gPyAhYWxpYXNJc0Jvb2xlYW4oa2V5KSA6IHRydWUpKSB7XG4gICAgICAgICAgICAgICAgc2V0QXJnKGtleSwgbmV4dCwgYXJnKTtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICgvXih0cnVlfGZhbHNlKSQvLnRlc3QobmV4dCkpIHtcbiAgICAgICAgICAgICAgICBzZXRBcmcoa2V5LCBuZXh0ID09PSAndHJ1ZScsIGFyZyk7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2V0QXJnKGtleSwgZmxhZ3Muc3RyaW5nc1trZXldID8gJycgOiB0cnVlLCBhcmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKC9eLVteLV0rLy50ZXN0KGFyZykpIHtcbiAgICAgICAgICAgIHZhciBsZXR0ZXJzID0gYXJnLnNsaWNlKDEsLTEpLnNwbGl0KCcnKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGJyb2tlbiA9IGZhbHNlO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBsZXR0ZXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHQgPSBhcmcuc2xpY2UoaisyKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAobmV4dCA9PT0gJy0nKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldEFyZyhsZXR0ZXJzW2pdLCBuZXh0LCBhcmcpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoL1tBLVphLXpdLy50ZXN0KGxldHRlcnNbal0pICYmIC89Ly50ZXN0KG5leHQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldEFyZyhsZXR0ZXJzW2pdLCBuZXh0LnNwbGl0KCc9JylbMV0sIGFyZyk7XG4gICAgICAgICAgICAgICAgICAgIGJyb2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoL1tBLVphLXpdLy50ZXN0KGxldHRlcnNbal0pXG4gICAgICAgICAgICAgICAgJiYgLy0/XFxkKyhcXC5cXGQqKT8oZS0/XFxkKyk/JC8udGVzdChuZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICBzZXRBcmcobGV0dGVyc1tqXSwgbmV4dCwgYXJnKTtcbiAgICAgICAgICAgICAgICAgICAgYnJva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChsZXR0ZXJzW2orMV0gJiYgbGV0dGVyc1tqKzFdLm1hdGNoKC9cXFcvKSkge1xuICAgICAgICAgICAgICAgICAgICBzZXRBcmcobGV0dGVyc1tqXSwgYXJnLnNsaWNlKGorMiksIGFyZyk7XG4gICAgICAgICAgICAgICAgICAgIGJyb2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0QXJnKGxldHRlcnNbal0sIGZsYWdzLnN0cmluZ3NbbGV0dGVyc1tqXV0gPyAnJyA6IHRydWUsIGFyZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIga2V5ID0gYXJnLnNsaWNlKC0xKVswXTtcbiAgICAgICAgICAgIGlmICghYnJva2VuICYmIGtleSAhPT0gJy0nKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3NbaSsxXSAmJiAhL14oLXwtLSlbXi1dLy50ZXN0KGFyZ3NbaSsxXSlcbiAgICAgICAgICAgICAgICAmJiAhZmxhZ3MuYm9vbHNba2V5XVxuICAgICAgICAgICAgICAgICYmIChhbGlhc2VzW2tleV0gPyAhYWxpYXNJc0Jvb2xlYW4oa2V5KSA6IHRydWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldEFyZyhrZXksIGFyZ3NbaSsxXSwgYXJnKTtcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChhcmdzW2krMV0gJiYgL3RydWV8ZmFsc2UvLnRlc3QoYXJnc1tpKzFdKSkge1xuICAgICAgICAgICAgICAgICAgICBzZXRBcmcoa2V5LCBhcmdzW2krMV0gPT09ICd0cnVlJywgYXJnKTtcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0QXJnKGtleSwgZmxhZ3Muc3RyaW5nc1trZXldID8gJycgOiB0cnVlLCBhcmcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICghZmxhZ3MudW5rbm93bkZuIHx8IGZsYWdzLnVua25vd25GbihhcmcpICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGFyZ3YuXy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICBmbGFncy5zdHJpbmdzWydfJ10gfHwgIWlzTnVtYmVyKGFyZykgPyBhcmcgOiBOdW1iZXIoYXJnKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob3B0cy5zdG9wRWFybHkpIHtcbiAgICAgICAgICAgICAgICBhcmd2Ll8ucHVzaC5hcHBseShhcmd2Ll8sIGFyZ3Muc2xpY2UoaSArIDEpKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBPYmplY3Qua2V5cyhkZWZhdWx0cykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGlmICghaGFzS2V5KGFyZ3YsIGtleS5zcGxpdCgnLicpKSkge1xuICAgICAgICAgICAgc2V0S2V5KGFyZ3YsIGtleS5zcGxpdCgnLicpLCBkZWZhdWx0c1trZXldKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgKGFsaWFzZXNba2V5XSB8fCBbXSkuZm9yRWFjaChmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgICAgIHNldEtleShhcmd2LCB4LnNwbGl0KCcuJyksIGRlZmF1bHRzW2tleV0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBcbiAgICBpZiAob3B0c1snLS0nXSkge1xuICAgICAgICBhcmd2WyctLSddID0gbmV3IEFycmF5KCk7XG4gICAgICAgIG5vdEZsYWdzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICBhcmd2WyctLSddLnB1c2goa2V5KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBub3RGbGFncy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgYXJndi5fLnB1c2goa2V5KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFyZ3Y7XG59O1xuXG5mdW5jdGlvbiBoYXNLZXkgKG9iaiwga2V5cykge1xuICAgIHZhciBvID0gb2JqO1xuICAgIGtleXMuc2xpY2UoMCwtMSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIG8gPSAob1trZXldIHx8IHt9KTtcbiAgICB9KTtcblxuICAgIHZhciBrZXkgPSBrZXlzW2tleXMubGVuZ3RoIC0gMV07XG4gICAgcmV0dXJuIGtleSBpbiBvO1xufVxuXG5mdW5jdGlvbiBpc051bWJlciAoeCkge1xuICAgIGlmICh0eXBlb2YgeCA9PT0gJ251bWJlcicpIHJldHVybiB0cnVlO1xuICAgIGlmICgvXjB4WzAtOWEtZl0rJC9pLnRlc3QoeCkpIHJldHVybiB0cnVlO1xuICAgIHJldHVybiAvXlstK10/KD86XFxkKyg/OlxcLlxcZCopP3xcXC5cXGQrKShlWy0rXT9cXGQrKT8kLy50ZXN0KHgpO1xufVxuXG4iLCJ2YXIgaW90YSA9IHJlcXVpcmUoXCJpb3RhLWFycmF5XCIpXG52YXIgaXNCdWZmZXIgPSByZXF1aXJlKFwiaXMtYnVmZmVyXCIpXG5cbnZhciBoYXNUeXBlZEFycmF5cyAgPSAoKHR5cGVvZiBGbG9hdDY0QXJyYXkpICE9PSBcInVuZGVmaW5lZFwiKVxuXG5mdW5jdGlvbiBjb21wYXJlMXN0KGEsIGIpIHtcbiAgcmV0dXJuIGFbMF0gLSBiWzBdXG59XG5cbmZ1bmN0aW9uIG9yZGVyKCkge1xuICB2YXIgc3RyaWRlID0gdGhpcy5zdHJpZGVcbiAgdmFyIHRlcm1zID0gbmV3IEFycmF5KHN0cmlkZS5sZW5ndGgpXG4gIHZhciBpXG4gIGZvcihpPTA7IGk8dGVybXMubGVuZ3RoOyArK2kpIHtcbiAgICB0ZXJtc1tpXSA9IFtNYXRoLmFicyhzdHJpZGVbaV0pLCBpXVxuICB9XG4gIHRlcm1zLnNvcnQoY29tcGFyZTFzdClcbiAgdmFyIHJlc3VsdCA9IG5ldyBBcnJheSh0ZXJtcy5sZW5ndGgpXG4gIGZvcihpPTA7IGk8cmVzdWx0Lmxlbmd0aDsgKytpKSB7XG4gICAgcmVzdWx0W2ldID0gdGVybXNbaV1bMV1cbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIGNvbXBpbGVDb25zdHJ1Y3RvcihkdHlwZSwgZGltZW5zaW9uKSB7XG4gIHZhciBjbGFzc05hbWUgPSBbXCJWaWV3XCIsIGRpbWVuc2lvbiwgXCJkXCIsIGR0eXBlXS5qb2luKFwiXCIpXG4gIGlmKGRpbWVuc2lvbiA8IDApIHtcbiAgICBjbGFzc05hbWUgPSBcIlZpZXdfTmlsXCIgKyBkdHlwZVxuICB9XG4gIHZhciB1c2VHZXR0ZXJzID0gKGR0eXBlID09PSBcImdlbmVyaWNcIilcblxuICBpZihkaW1lbnNpb24gPT09IC0xKSB7XG4gICAgLy9TcGVjaWFsIGNhc2UgZm9yIHRyaXZpYWwgYXJyYXlzXG4gICAgdmFyIGNvZGUgPVxuICAgICAgXCJmdW5jdGlvbiBcIitjbGFzc05hbWUrXCIoYSl7dGhpcy5kYXRhPWE7fTtcXFxudmFyIHByb3RvPVwiK2NsYXNzTmFtZStcIi5wcm90b3R5cGU7XFxcbnByb3RvLmR0eXBlPSdcIitkdHlwZStcIic7XFxcbnByb3RvLmluZGV4PWZ1bmN0aW9uKCl7cmV0dXJuIC0xfTtcXFxucHJvdG8uc2l6ZT0wO1xcXG5wcm90by5kaW1lbnNpb249LTE7XFxcbnByb3RvLnNoYXBlPXByb3RvLnN0cmlkZT1wcm90by5vcmRlcj1bXTtcXFxucHJvdG8ubG89cHJvdG8uaGk9cHJvdG8udHJhbnNwb3NlPXByb3RvLnN0ZXA9XFxcbmZ1bmN0aW9uKCl7cmV0dXJuIG5ldyBcIitjbGFzc05hbWUrXCIodGhpcy5kYXRhKTt9O1xcXG5wcm90by5nZXQ9cHJvdG8uc2V0PWZ1bmN0aW9uKCl7fTtcXFxucHJvdG8ucGljaz1mdW5jdGlvbigpe3JldHVybiBudWxsfTtcXFxucmV0dXJuIGZ1bmN0aW9uIGNvbnN0cnVjdF9cIitjbGFzc05hbWUrXCIoYSl7cmV0dXJuIG5ldyBcIitjbGFzc05hbWUrXCIoYSk7fVwiXG4gICAgdmFyIHByb2NlZHVyZSA9IG5ldyBGdW5jdGlvbihjb2RlKVxuICAgIHJldHVybiBwcm9jZWR1cmUoKVxuICB9IGVsc2UgaWYoZGltZW5zaW9uID09PSAwKSB7XG4gICAgLy9TcGVjaWFsIGNhc2UgZm9yIDBkIGFycmF5c1xuICAgIHZhciBjb2RlID1cbiAgICAgIFwiZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiKGEsZCkge1xcXG50aGlzLmRhdGEgPSBhO1xcXG50aGlzLm9mZnNldCA9IGRcXFxufTtcXFxudmFyIHByb3RvPVwiK2NsYXNzTmFtZStcIi5wcm90b3R5cGU7XFxcbnByb3RvLmR0eXBlPSdcIitkdHlwZStcIic7XFxcbnByb3RvLmluZGV4PWZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMub2Zmc2V0fTtcXFxucHJvdG8uZGltZW5zaW9uPTA7XFxcbnByb3RvLnNpemU9MTtcXFxucHJvdG8uc2hhcGU9XFxcbnByb3RvLnN0cmlkZT1cXFxucHJvdG8ub3JkZXI9W107XFxcbnByb3RvLmxvPVxcXG5wcm90by5oaT1cXFxucHJvdG8udHJhbnNwb3NlPVxcXG5wcm90by5zdGVwPWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9jb3B5KCkge1xcXG5yZXR1cm4gbmV3IFwiK2NsYXNzTmFtZStcIih0aGlzLmRhdGEsdGhpcy5vZmZzZXQpXFxcbn07XFxcbnByb3RvLnBpY2s9ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX3BpY2soKXtcXFxucmV0dXJuIFRyaXZpYWxBcnJheSh0aGlzLmRhdGEpO1xcXG59O1xcXG5wcm90by52YWx1ZU9mPXByb3RvLmdldD1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfZ2V0KCl7XFxcbnJldHVybiBcIisodXNlR2V0dGVycyA/IFwidGhpcy5kYXRhLmdldCh0aGlzLm9mZnNldClcIiA6IFwidGhpcy5kYXRhW3RoaXMub2Zmc2V0XVwiKStcblwifTtcXFxucHJvdG8uc2V0PWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9zZXQodil7XFxcbnJldHVybiBcIisodXNlR2V0dGVycyA/IFwidGhpcy5kYXRhLnNldCh0aGlzLm9mZnNldCx2KVwiIDogXCJ0aGlzLmRhdGFbdGhpcy5vZmZzZXRdPXZcIikrXCJcXFxufTtcXFxucmV0dXJuIGZ1bmN0aW9uIGNvbnN0cnVjdF9cIitjbGFzc05hbWUrXCIoYSxiLGMsZCl7cmV0dXJuIG5ldyBcIitjbGFzc05hbWUrXCIoYSxkKX1cIlxuICAgIHZhciBwcm9jZWR1cmUgPSBuZXcgRnVuY3Rpb24oXCJUcml2aWFsQXJyYXlcIiwgY29kZSlcbiAgICByZXR1cm4gcHJvY2VkdXJlKENBQ0hFRF9DT05TVFJVQ1RPUlNbZHR5cGVdWzBdKVxuICB9XG5cbiAgdmFyIGNvZGUgPSBbXCIndXNlIHN0cmljdCdcIl1cblxuICAvL0NyZWF0ZSBjb25zdHJ1Y3RvciBmb3Igdmlld1xuICB2YXIgaW5kaWNlcyA9IGlvdGEoZGltZW5zaW9uKVxuICB2YXIgYXJncyA9IGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHsgcmV0dXJuIFwiaVwiK2kgfSlcbiAgdmFyIGluZGV4X3N0ciA9IFwidGhpcy5vZmZzZXQrXCIgKyBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICAgIHJldHVybiBcInRoaXMuc3RyaWRlW1wiICsgaSArIFwiXSppXCIgKyBpXG4gICAgICB9KS5qb2luKFwiK1wiKVxuICB2YXIgc2hhcGVBcmcgPSBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gXCJiXCIraVxuICAgIH0pLmpvaW4oXCIsXCIpXG4gIHZhciBzdHJpZGVBcmcgPSBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gXCJjXCIraVxuICAgIH0pLmpvaW4oXCIsXCIpXG4gIGNvZGUucHVzaChcbiAgICBcImZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIihhLFwiICsgc2hhcGVBcmcgKyBcIixcIiArIHN0cmlkZUFyZyArIFwiLGQpe3RoaXMuZGF0YT1hXCIsXG4gICAgICBcInRoaXMuc2hhcGU9W1wiICsgc2hhcGVBcmcgKyBcIl1cIixcbiAgICAgIFwidGhpcy5zdHJpZGU9W1wiICsgc3RyaWRlQXJnICsgXCJdXCIsXG4gICAgICBcInRoaXMub2Zmc2V0PWR8MH1cIixcbiAgICBcInZhciBwcm90bz1cIitjbGFzc05hbWUrXCIucHJvdG90eXBlXCIsXG4gICAgXCJwcm90by5kdHlwZT0nXCIrZHR5cGUrXCInXCIsXG4gICAgXCJwcm90by5kaW1lbnNpb249XCIrZGltZW5zaW9uKVxuXG4gIC8vdmlldy5zaXplOlxuICBjb2RlLnB1c2goXCJPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sJ3NpemUnLHtnZXQ6ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX3NpemUoKXtcXFxucmV0dXJuIFwiK2luZGljZXMubWFwKGZ1bmN0aW9uKGkpIHsgcmV0dXJuIFwidGhpcy5zaGFwZVtcIitpK1wiXVwiIH0pLmpvaW4oXCIqXCIpLFxuXCJ9fSlcIilcblxuICAvL3ZpZXcub3JkZXI6XG4gIGlmKGRpbWVuc2lvbiA9PT0gMSkge1xuICAgIGNvZGUucHVzaChcInByb3RvLm9yZGVyPVswXVwiKVxuICB9IGVsc2Uge1xuICAgIGNvZGUucHVzaChcIk9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywnb3JkZXInLHtnZXQ6XCIpXG4gICAgaWYoZGltZW5zaW9uIDwgNCkge1xuICAgICAgY29kZS5wdXNoKFwiZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX29yZGVyKCl7XCIpXG4gICAgICBpZihkaW1lbnNpb24gPT09IDIpIHtcbiAgICAgICAgY29kZS5wdXNoKFwicmV0dXJuIChNYXRoLmFicyh0aGlzLnN0cmlkZVswXSk+TWF0aC5hYnModGhpcy5zdHJpZGVbMV0pKT9bMSwwXTpbMCwxXX19KVwiKVxuICAgICAgfSBlbHNlIGlmKGRpbWVuc2lvbiA9PT0gMykge1xuICAgICAgICBjb2RlLnB1c2goXG5cInZhciBzMD1NYXRoLmFicyh0aGlzLnN0cmlkZVswXSksczE9TWF0aC5hYnModGhpcy5zdHJpZGVbMV0pLHMyPU1hdGguYWJzKHRoaXMuc3RyaWRlWzJdKTtcXFxuaWYoczA+czEpe1xcXG5pZihzMT5zMil7XFxcbnJldHVybiBbMiwxLDBdO1xcXG59ZWxzZSBpZihzMD5zMil7XFxcbnJldHVybiBbMSwyLDBdO1xcXG59ZWxzZXtcXFxucmV0dXJuIFsxLDAsMl07XFxcbn1cXFxufWVsc2UgaWYoczA+czIpe1xcXG5yZXR1cm4gWzIsMCwxXTtcXFxufWVsc2UgaWYoczI+czEpe1xcXG5yZXR1cm4gWzAsMSwyXTtcXFxufWVsc2V7XFxcbnJldHVybiBbMCwyLDFdO1xcXG59fX0pXCIpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZGUucHVzaChcIk9SREVSfSlcIilcbiAgICB9XG4gIH1cblxuICAvL3ZpZXcuc2V0KGkwLCAuLi4sIHYpOlxuICBjb2RlLnB1c2goXG5cInByb3RvLnNldD1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfc2V0KFwiK2FyZ3Muam9pbihcIixcIikrXCIsdil7XCIpXG4gIGlmKHVzZUdldHRlcnMpIHtcbiAgICBjb2RlLnB1c2goXCJyZXR1cm4gdGhpcy5kYXRhLnNldChcIitpbmRleF9zdHIrXCIsdil9XCIpXG4gIH0gZWxzZSB7XG4gICAgY29kZS5wdXNoKFwicmV0dXJuIHRoaXMuZGF0YVtcIitpbmRleF9zdHIrXCJdPXZ9XCIpXG4gIH1cblxuICAvL3ZpZXcuZ2V0KGkwLCAuLi4pOlxuICBjb2RlLnB1c2goXCJwcm90by5nZXQ9ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX2dldChcIithcmdzLmpvaW4oXCIsXCIpK1wiKXtcIilcbiAgaWYodXNlR2V0dGVycykge1xuICAgIGNvZGUucHVzaChcInJldHVybiB0aGlzLmRhdGEuZ2V0KFwiK2luZGV4X3N0citcIil9XCIpXG4gIH0gZWxzZSB7XG4gICAgY29kZS5wdXNoKFwicmV0dXJuIHRoaXMuZGF0YVtcIitpbmRleF9zdHIrXCJdfVwiKVxuICB9XG5cbiAgLy92aWV3LmluZGV4OlxuICBjb2RlLnB1c2goXG4gICAgXCJwcm90by5pbmRleD1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfaW5kZXgoXCIsIGFyZ3Muam9pbigpLCBcIil7cmV0dXJuIFwiK2luZGV4X3N0citcIn1cIilcblxuICAvL3ZpZXcuaGkoKTpcbiAgY29kZS5wdXNoKFwicHJvdG8uaGk9ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX2hpKFwiK2FyZ3Muam9pbihcIixcIikrXCIpe3JldHVybiBuZXcgXCIrY2xhc3NOYW1lK1wiKHRoaXMuZGF0YSxcIitcbiAgICBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gW1wiKHR5cGVvZiBpXCIsaSxcIiE9PSdudW1iZXInfHxpXCIsaSxcIjwwKT90aGlzLnNoYXBlW1wiLCBpLCBcIl06aVwiLCBpLFwifDBcIl0uam9pbihcIlwiKVxuICAgIH0pLmpvaW4oXCIsXCIpK1wiLFwiK1xuICAgIGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBcInRoaXMuc3RyaWRlW1wiK2kgKyBcIl1cIlxuICAgIH0pLmpvaW4oXCIsXCIpK1wiLHRoaXMub2Zmc2V0KX1cIilcblxuICAvL3ZpZXcubG8oKTpcbiAgdmFyIGFfdmFycyA9IGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHsgcmV0dXJuIFwiYVwiK2krXCI9dGhpcy5zaGFwZVtcIitpK1wiXVwiIH0pXG4gIHZhciBjX3ZhcnMgPSBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7IHJldHVybiBcImNcIitpK1wiPXRoaXMuc3RyaWRlW1wiK2krXCJdXCIgfSlcbiAgY29kZS5wdXNoKFwicHJvdG8ubG89ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX2xvKFwiK2FyZ3Muam9pbihcIixcIikrXCIpe3ZhciBiPXRoaXMub2Zmc2V0LGQ9MCxcIithX3ZhcnMuam9pbihcIixcIikrXCIsXCIrY192YXJzLmpvaW4oXCIsXCIpKVxuICBmb3IodmFyIGk9MDsgaTxkaW1lbnNpb247ICsraSkge1xuICAgIGNvZGUucHVzaChcblwiaWYodHlwZW9mIGlcIitpK1wiPT09J251bWJlcicmJmlcIitpK1wiPj0wKXtcXFxuZD1pXCIraStcInwwO1xcXG5iKz1jXCIraStcIipkO1xcXG5hXCIraStcIi09ZH1cIilcbiAgfVxuICBjb2RlLnB1c2goXCJyZXR1cm4gbmV3IFwiK2NsYXNzTmFtZStcIih0aGlzLmRhdGEsXCIrXG4gICAgaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFwiYVwiK2lcbiAgICB9KS5qb2luKFwiLFwiKStcIixcIitcbiAgICBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gXCJjXCIraVxuICAgIH0pLmpvaW4oXCIsXCIpK1wiLGIpfVwiKVxuXG4gIC8vdmlldy5zdGVwKCk6XG4gIGNvZGUucHVzaChcInByb3RvLnN0ZXA9ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX3N0ZXAoXCIrYXJncy5qb2luKFwiLFwiKStcIil7dmFyIFwiK1xuICAgIGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBcImFcIitpK1wiPXRoaXMuc2hhcGVbXCIraStcIl1cIlxuICAgIH0pLmpvaW4oXCIsXCIpK1wiLFwiK1xuICAgIGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBcImJcIitpK1wiPXRoaXMuc3RyaWRlW1wiK2krXCJdXCJcbiAgICB9KS5qb2luKFwiLFwiKStcIixjPXRoaXMub2Zmc2V0LGQ9MCxjZWlsPU1hdGguY2VpbFwiKVxuICBmb3IodmFyIGk9MDsgaTxkaW1lbnNpb247ICsraSkge1xuICAgIGNvZGUucHVzaChcblwiaWYodHlwZW9mIGlcIitpK1wiPT09J251bWJlcicpe1xcXG5kPWlcIitpK1wifDA7XFxcbmlmKGQ8MCl7XFxcbmMrPWJcIitpK1wiKihhXCIraStcIi0xKTtcXFxuYVwiK2krXCI9Y2VpbCgtYVwiK2krXCIvZClcXFxufWVsc2V7XFxcbmFcIitpK1wiPWNlaWwoYVwiK2krXCIvZClcXFxufVxcXG5iXCIraStcIio9ZFxcXG59XCIpXG4gIH1cbiAgY29kZS5wdXNoKFwicmV0dXJuIG5ldyBcIitjbGFzc05hbWUrXCIodGhpcy5kYXRhLFwiK1xuICAgIGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBcImFcIiArIGlcbiAgICB9KS5qb2luKFwiLFwiKStcIixcIitcbiAgICBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gXCJiXCIgKyBpXG4gICAgfSkuam9pbihcIixcIikrXCIsYyl9XCIpXG5cbiAgLy92aWV3LnRyYW5zcG9zZSgpOlxuICB2YXIgdFNoYXBlID0gbmV3IEFycmF5KGRpbWVuc2lvbilcbiAgdmFyIHRTdHJpZGUgPSBuZXcgQXJyYXkoZGltZW5zaW9uKVxuICBmb3IodmFyIGk9MDsgaTxkaW1lbnNpb247ICsraSkge1xuICAgIHRTaGFwZVtpXSA9IFwiYVtpXCIraStcIl1cIlxuICAgIHRTdHJpZGVbaV0gPSBcImJbaVwiK2krXCJdXCJcbiAgfVxuICBjb2RlLnB1c2goXCJwcm90by50cmFuc3Bvc2U9ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX3RyYW5zcG9zZShcIithcmdzK1wiKXtcIitcbiAgICBhcmdzLm1hcChmdW5jdGlvbihuLGlkeCkgeyByZXR1cm4gbiArIFwiPShcIiArIG4gKyBcIj09PXVuZGVmaW5lZD9cIiArIGlkeCArIFwiOlwiICsgbiArIFwifDApXCJ9KS5qb2luKFwiO1wiKSxcbiAgICBcInZhciBhPXRoaXMuc2hhcGUsYj10aGlzLnN0cmlkZTtyZXR1cm4gbmV3IFwiK2NsYXNzTmFtZStcIih0aGlzLmRhdGEsXCIrdFNoYXBlLmpvaW4oXCIsXCIpK1wiLFwiK3RTdHJpZGUuam9pbihcIixcIikrXCIsdGhpcy5vZmZzZXQpfVwiKVxuXG4gIC8vdmlldy5waWNrKCk6XG4gIGNvZGUucHVzaChcInByb3RvLnBpY2s9ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX3BpY2soXCIrYXJncytcIil7dmFyIGE9W10sYj1bXSxjPXRoaXMub2Zmc2V0XCIpXG4gIGZvcih2YXIgaT0wOyBpPGRpbWVuc2lvbjsgKytpKSB7XG4gICAgY29kZS5wdXNoKFwiaWYodHlwZW9mIGlcIitpK1wiPT09J251bWJlcicmJmlcIitpK1wiPj0wKXtjPShjK3RoaXMuc3RyaWRlW1wiK2krXCJdKmlcIitpK1wiKXwwfWVsc2V7YS5wdXNoKHRoaXMuc2hhcGVbXCIraStcIl0pO2IucHVzaCh0aGlzLnN0cmlkZVtcIitpK1wiXSl9XCIpXG4gIH1cbiAgY29kZS5wdXNoKFwidmFyIGN0b3I9Q1RPUl9MSVNUW2EubGVuZ3RoKzFdO3JldHVybiBjdG9yKHRoaXMuZGF0YSxhLGIsYyl9XCIpXG5cbiAgLy9BZGQgcmV0dXJuIHN0YXRlbWVudFxuICBjb2RlLnB1c2goXCJyZXR1cm4gZnVuY3Rpb24gY29uc3RydWN0X1wiK2NsYXNzTmFtZStcIihkYXRhLHNoYXBlLHN0cmlkZSxvZmZzZXQpe3JldHVybiBuZXcgXCIrY2xhc3NOYW1lK1wiKGRhdGEsXCIrXG4gICAgaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFwic2hhcGVbXCIraStcIl1cIlxuICAgIH0pLmpvaW4oXCIsXCIpK1wiLFwiK1xuICAgIGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBcInN0cmlkZVtcIitpK1wiXVwiXG4gICAgfSkuam9pbihcIixcIikrXCIsb2Zmc2V0KX1cIilcblxuICAvL0NvbXBpbGUgcHJvY2VkdXJlXG4gIHZhciBwcm9jZWR1cmUgPSBuZXcgRnVuY3Rpb24oXCJDVE9SX0xJU1RcIiwgXCJPUkRFUlwiLCBjb2RlLmpvaW4oXCJcXG5cIikpXG4gIHJldHVybiBwcm9jZWR1cmUoQ0FDSEVEX0NPTlNUUlVDVE9SU1tkdHlwZV0sIG9yZGVyKVxufVxuXG5mdW5jdGlvbiBhcnJheURUeXBlKGRhdGEpIHtcbiAgaWYoaXNCdWZmZXIoZGF0YSkpIHtcbiAgICByZXR1cm4gXCJidWZmZXJcIlxuICB9XG4gIGlmKGhhc1R5cGVkQXJyYXlzKSB7XG4gICAgc3dpdGNoKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChkYXRhKSkge1xuICAgICAgY2FzZSBcIltvYmplY3QgRmxvYXQ2NEFycmF5XVwiOlxuICAgICAgICByZXR1cm4gXCJmbG9hdDY0XCJcbiAgICAgIGNhc2UgXCJbb2JqZWN0IEZsb2F0MzJBcnJheV1cIjpcbiAgICAgICAgcmV0dXJuIFwiZmxvYXQzMlwiXG4gICAgICBjYXNlIFwiW29iamVjdCBJbnQ4QXJyYXldXCI6XG4gICAgICAgIHJldHVybiBcImludDhcIlxuICAgICAgY2FzZSBcIltvYmplY3QgSW50MTZBcnJheV1cIjpcbiAgICAgICAgcmV0dXJuIFwiaW50MTZcIlxuICAgICAgY2FzZSBcIltvYmplY3QgSW50MzJBcnJheV1cIjpcbiAgICAgICAgcmV0dXJuIFwiaW50MzJcIlxuICAgICAgY2FzZSBcIltvYmplY3QgVWludDhBcnJheV1cIjpcbiAgICAgICAgcmV0dXJuIFwidWludDhcIlxuICAgICAgY2FzZSBcIltvYmplY3QgVWludDE2QXJyYXldXCI6XG4gICAgICAgIHJldHVybiBcInVpbnQxNlwiXG4gICAgICBjYXNlIFwiW29iamVjdCBVaW50MzJBcnJheV1cIjpcbiAgICAgICAgcmV0dXJuIFwidWludDMyXCJcbiAgICAgIGNhc2UgXCJbb2JqZWN0IFVpbnQ4Q2xhbXBlZEFycmF5XVwiOlxuICAgICAgICByZXR1cm4gXCJ1aW50OF9jbGFtcGVkXCJcbiAgICB9XG4gIH1cbiAgaWYoQXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgIHJldHVybiBcImFycmF5XCJcbiAgfVxuICByZXR1cm4gXCJnZW5lcmljXCJcbn1cblxudmFyIENBQ0hFRF9DT05TVFJVQ1RPUlMgPSB7XG4gIFwiZmxvYXQzMlwiOltdLFxuICBcImZsb2F0NjRcIjpbXSxcbiAgXCJpbnQ4XCI6W10sXG4gIFwiaW50MTZcIjpbXSxcbiAgXCJpbnQzMlwiOltdLFxuICBcInVpbnQ4XCI6W10sXG4gIFwidWludDE2XCI6W10sXG4gIFwidWludDMyXCI6W10sXG4gIFwiYXJyYXlcIjpbXSxcbiAgXCJ1aW50OF9jbGFtcGVkXCI6W10sXG4gIFwiYnVmZmVyXCI6W10sXG4gIFwiZ2VuZXJpY1wiOltdXG59XG5cbjsoZnVuY3Rpb24oKSB7XG4gIGZvcih2YXIgaWQgaW4gQ0FDSEVEX0NPTlNUUlVDVE9SUykge1xuICAgIENBQ0hFRF9DT05TVFJVQ1RPUlNbaWRdLnB1c2goY29tcGlsZUNvbnN0cnVjdG9yKGlkLCAtMSkpXG4gIH1cbn0pO1xuXG5mdW5jdGlvbiB3cmFwcGVkTkRBcnJheUN0b3IoZGF0YSwgc2hhcGUsIHN0cmlkZSwgb2Zmc2V0KSB7XG4gIGlmKGRhdGEgPT09IHVuZGVmaW5lZCkge1xuICAgIHZhciBjdG9yID0gQ0FDSEVEX0NPTlNUUlVDVE9SUy5hcnJheVswXVxuICAgIHJldHVybiBjdG9yKFtdKVxuICB9IGVsc2UgaWYodHlwZW9mIGRhdGEgPT09IFwibnVtYmVyXCIpIHtcbiAgICBkYXRhID0gW2RhdGFdXG4gIH1cbiAgaWYoc2hhcGUgPT09IHVuZGVmaW5lZCkge1xuICAgIHNoYXBlID0gWyBkYXRhLmxlbmd0aCBdXG4gIH1cbiAgdmFyIGQgPSBzaGFwZS5sZW5ndGhcbiAgaWYoc3RyaWRlID09PSB1bmRlZmluZWQpIHtcbiAgICBzdHJpZGUgPSBuZXcgQXJyYXkoZClcbiAgICBmb3IodmFyIGk9ZC0xLCBzej0xOyBpPj0wOyAtLWkpIHtcbiAgICAgIHN0cmlkZVtpXSA9IHN6XG4gICAgICBzeiAqPSBzaGFwZVtpXVxuICAgIH1cbiAgfVxuICBpZihvZmZzZXQgPT09IHVuZGVmaW5lZCkge1xuICAgIG9mZnNldCA9IDBcbiAgICBmb3IodmFyIGk9MDsgaTxkOyArK2kpIHtcbiAgICAgIGlmKHN0cmlkZVtpXSA8IDApIHtcbiAgICAgICAgb2Zmc2V0IC09IChzaGFwZVtpXS0xKSpzdHJpZGVbaV1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgdmFyIGR0eXBlID0gYXJyYXlEVHlwZShkYXRhKVxuICB2YXIgY3Rvcl9saXN0ID0gQ0FDSEVEX0NPTlNUUlVDVE9SU1tkdHlwZV1cbiAgd2hpbGUoY3Rvcl9saXN0Lmxlbmd0aCA8PSBkKzEpIHtcbiAgICBjdG9yX2xpc3QucHVzaChjb21waWxlQ29uc3RydWN0b3IoZHR5cGUsIGN0b3JfbGlzdC5sZW5ndGgtMSkpXG4gIH1cbiAgdmFyIGN0b3IgPSBjdG9yX2xpc3RbZCsxXVxuICByZXR1cm4gY3RvcihkYXRhLCBzaGFwZSwgc3RyaWRlLCBvZmZzZXQpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gd3JhcHBlZE5EQXJyYXlDdG9yXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwb2ludCwgdnMpIHtcbiAgICAvLyByYXktY2FzdGluZyBhbGdvcml0aG0gYmFzZWQgb25cbiAgICAvLyBodHRwOi8vd3d3LmVjc2UucnBpLmVkdS9Ib21lcGFnZXMvd3JmL1Jlc2VhcmNoL1Nob3J0X05vdGVzL3BucG9seS5odG1sXG4gICAgXG4gICAgdmFyIHggPSBwb2ludFswXSwgeSA9IHBvaW50WzFdO1xuICAgIFxuICAgIHZhciBpbnNpZGUgPSBmYWxzZTtcbiAgICBmb3IgKHZhciBpID0gMCwgaiA9IHZzLmxlbmd0aCAtIDE7IGkgPCB2cy5sZW5ndGg7IGogPSBpKyspIHtcbiAgICAgICAgdmFyIHhpID0gdnNbaV1bMF0sIHlpID0gdnNbaV1bMV07XG4gICAgICAgIHZhciB4aiA9IHZzW2pdWzBdLCB5aiA9IHZzW2pdWzFdO1xuICAgICAgICBcbiAgICAgICAgdmFyIGludGVyc2VjdCA9ICgoeWkgPiB5KSAhPSAoeWogPiB5KSlcbiAgICAgICAgICAgICYmICh4IDwgKHhqIC0geGkpICogKHkgLSB5aSkgLyAoeWogLSB5aSkgKyB4aSk7XG4gICAgICAgIGlmIChpbnRlcnNlY3QpIGluc2lkZSA9ICFpbnNpZGU7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBpbnNpZGU7XG59O1xuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBiaXRzID0gcmVxdWlyZSgnYml0LXR3aWRkbGUnKVxudmFyIGR1cCA9IHJlcXVpcmUoJ2R1cCcpXG5cbi8vTGVnYWN5IHBvb2wgc3VwcG9ydFxuaWYoIWdsb2JhbC5fX1RZUEVEQVJSQVlfUE9PTCkge1xuICBnbG9iYWwuX19UWVBFREFSUkFZX1BPT0wgPSB7XG4gICAgICBVSU5UOCAgIDogZHVwKFszMiwgMF0pXG4gICAgLCBVSU5UMTYgIDogZHVwKFszMiwgMF0pXG4gICAgLCBVSU5UMzIgIDogZHVwKFszMiwgMF0pXG4gICAgLCBJTlQ4ICAgIDogZHVwKFszMiwgMF0pXG4gICAgLCBJTlQxNiAgIDogZHVwKFszMiwgMF0pXG4gICAgLCBJTlQzMiAgIDogZHVwKFszMiwgMF0pXG4gICAgLCBGTE9BVCAgIDogZHVwKFszMiwgMF0pXG4gICAgLCBET1VCTEUgIDogZHVwKFszMiwgMF0pXG4gICAgLCBEQVRBICAgIDogZHVwKFszMiwgMF0pXG4gICAgLCBVSU5UOEMgIDogZHVwKFszMiwgMF0pXG4gICAgLCBCVUZGRVIgIDogZHVwKFszMiwgMF0pXG4gIH1cbn1cblxudmFyIGhhc1VpbnQ4QyA9ICh0eXBlb2YgVWludDhDbGFtcGVkQXJyYXkpICE9PSAndW5kZWZpbmVkJ1xudmFyIFBPT0wgPSBnbG9iYWwuX19UWVBFREFSUkFZX1BPT0xcblxuLy9VcGdyYWRlIHBvb2xcbmlmKCFQT09MLlVJTlQ4Qykge1xuICBQT09MLlVJTlQ4QyA9IGR1cChbMzIsIDBdKVxufVxuaWYoIVBPT0wuQlVGRkVSKSB7XG4gIFBPT0wuQlVGRkVSID0gZHVwKFszMiwgMF0pXG59XG5cbi8vTmV3IHRlY2huaXF1ZTogT25seSBhbGxvY2F0ZSBmcm9tIEFycmF5QnVmZmVyVmlldyBhbmQgQnVmZmVyXG52YXIgREFUQSAgICA9IFBPT0wuREFUQVxuICAsIEJVRkZFUiAgPSBQT09MLkJVRkZFUlxuXG5leHBvcnRzLmZyZWUgPSBmdW5jdGlvbiBmcmVlKGFycmF5KSB7XG4gIGlmKEJ1ZmZlci5pc0J1ZmZlcihhcnJheSkpIHtcbiAgICBCVUZGRVJbYml0cy5sb2cyKGFycmF5Lmxlbmd0aCldLnB1c2goYXJyYXkpXG4gIH0gZWxzZSB7XG4gICAgaWYoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFycmF5KSAhPT0gJ1tvYmplY3QgQXJyYXlCdWZmZXJdJykge1xuICAgICAgYXJyYXkgPSBhcnJheS5idWZmZXJcbiAgICB9XG4gICAgaWYoIWFycmF5KSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdmFyIG4gPSBhcnJheS5sZW5ndGggfHwgYXJyYXkuYnl0ZUxlbmd0aFxuICAgIHZhciBsb2dfbiA9IGJpdHMubG9nMihuKXwwXG4gICAgREFUQVtsb2dfbl0ucHVzaChhcnJheSlcbiAgfVxufVxuXG5mdW5jdGlvbiBmcmVlQXJyYXlCdWZmZXIoYnVmZmVyKSB7XG4gIGlmKCFidWZmZXIpIHtcbiAgICByZXR1cm5cbiAgfVxuICB2YXIgbiA9IGJ1ZmZlci5sZW5ndGggfHwgYnVmZmVyLmJ5dGVMZW5ndGhcbiAgdmFyIGxvZ19uID0gYml0cy5sb2cyKG4pXG4gIERBVEFbbG9nX25dLnB1c2goYnVmZmVyKVxufVxuXG5mdW5jdGlvbiBmcmVlVHlwZWRBcnJheShhcnJheSkge1xuICBmcmVlQXJyYXlCdWZmZXIoYXJyYXkuYnVmZmVyKVxufVxuXG5leHBvcnRzLmZyZWVVaW50OCA9XG5leHBvcnRzLmZyZWVVaW50MTYgPVxuZXhwb3J0cy5mcmVlVWludDMyID1cbmV4cG9ydHMuZnJlZUludDggPVxuZXhwb3J0cy5mcmVlSW50MTYgPVxuZXhwb3J0cy5mcmVlSW50MzIgPVxuZXhwb3J0cy5mcmVlRmxvYXQzMiA9IFxuZXhwb3J0cy5mcmVlRmxvYXQgPVxuZXhwb3J0cy5mcmVlRmxvYXQ2NCA9IFxuZXhwb3J0cy5mcmVlRG91YmxlID0gXG5leHBvcnRzLmZyZWVVaW50OENsYW1wZWQgPSBcbmV4cG9ydHMuZnJlZURhdGFWaWV3ID0gZnJlZVR5cGVkQXJyYXlcblxuZXhwb3J0cy5mcmVlQXJyYXlCdWZmZXIgPSBmcmVlQXJyYXlCdWZmZXJcblxuZXhwb3J0cy5mcmVlQnVmZmVyID0gZnVuY3Rpb24gZnJlZUJ1ZmZlcihhcnJheSkge1xuICBCVUZGRVJbYml0cy5sb2cyKGFycmF5Lmxlbmd0aCldLnB1c2goYXJyYXkpXG59XG5cbmV4cG9ydHMubWFsbG9jID0gZnVuY3Rpb24gbWFsbG9jKG4sIGR0eXBlKSB7XG4gIGlmKGR0eXBlID09PSB1bmRlZmluZWQgfHwgZHR5cGUgPT09ICdhcnJheWJ1ZmZlcicpIHtcbiAgICByZXR1cm4gbWFsbG9jQXJyYXlCdWZmZXIobilcbiAgfSBlbHNlIHtcbiAgICBzd2l0Y2goZHR5cGUpIHtcbiAgICAgIGNhc2UgJ3VpbnQ4JzpcbiAgICAgICAgcmV0dXJuIG1hbGxvY1VpbnQ4KG4pXG4gICAgICBjYXNlICd1aW50MTYnOlxuICAgICAgICByZXR1cm4gbWFsbG9jVWludDE2KG4pXG4gICAgICBjYXNlICd1aW50MzInOlxuICAgICAgICByZXR1cm4gbWFsbG9jVWludDMyKG4pXG4gICAgICBjYXNlICdpbnQ4JzpcbiAgICAgICAgcmV0dXJuIG1hbGxvY0ludDgobilcbiAgICAgIGNhc2UgJ2ludDE2JzpcbiAgICAgICAgcmV0dXJuIG1hbGxvY0ludDE2KG4pXG4gICAgICBjYXNlICdpbnQzMic6XG4gICAgICAgIHJldHVybiBtYWxsb2NJbnQzMihuKVxuICAgICAgY2FzZSAnZmxvYXQnOlxuICAgICAgY2FzZSAnZmxvYXQzMic6XG4gICAgICAgIHJldHVybiBtYWxsb2NGbG9hdChuKVxuICAgICAgY2FzZSAnZG91YmxlJzpcbiAgICAgIGNhc2UgJ2Zsb2F0NjQnOlxuICAgICAgICByZXR1cm4gbWFsbG9jRG91YmxlKG4pXG4gICAgICBjYXNlICd1aW50OF9jbGFtcGVkJzpcbiAgICAgICAgcmV0dXJuIG1hbGxvY1VpbnQ4Q2xhbXBlZChuKVxuICAgICAgY2FzZSAnYnVmZmVyJzpcbiAgICAgICAgcmV0dXJuIG1hbGxvY0J1ZmZlcihuKVxuICAgICAgY2FzZSAnZGF0YSc6XG4gICAgICBjYXNlICdkYXRhdmlldyc6XG4gICAgICAgIHJldHVybiBtYWxsb2NEYXRhVmlldyhuKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbFxufVxuXG5mdW5jdGlvbiBtYWxsb2NBcnJheUJ1ZmZlcihuKSB7XG4gIHZhciBuID0gYml0cy5uZXh0UG93MihuKVxuICB2YXIgbG9nX24gPSBiaXRzLmxvZzIobilcbiAgdmFyIGQgPSBEQVRBW2xvZ19uXVxuICBpZihkLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gZC5wb3AoKVxuICB9XG4gIHJldHVybiBuZXcgQXJyYXlCdWZmZXIobilcbn1cbmV4cG9ydHMubWFsbG9jQXJyYXlCdWZmZXIgPSBtYWxsb2NBcnJheUJ1ZmZlclxuXG5mdW5jdGlvbiBtYWxsb2NVaW50OChuKSB7XG4gIHJldHVybiBuZXcgVWludDhBcnJheShtYWxsb2NBcnJheUJ1ZmZlcihuKSwgMCwgbilcbn1cbmV4cG9ydHMubWFsbG9jVWludDggPSBtYWxsb2NVaW50OFxuXG5mdW5jdGlvbiBtYWxsb2NVaW50MTYobikge1xuICByZXR1cm4gbmV3IFVpbnQxNkFycmF5KG1hbGxvY0FycmF5QnVmZmVyKDIqbiksIDAsIG4pXG59XG5leHBvcnRzLm1hbGxvY1VpbnQxNiA9IG1hbGxvY1VpbnQxNlxuXG5mdW5jdGlvbiBtYWxsb2NVaW50MzIobikge1xuICByZXR1cm4gbmV3IFVpbnQzMkFycmF5KG1hbGxvY0FycmF5QnVmZmVyKDQqbiksIDAsIG4pXG59XG5leHBvcnRzLm1hbGxvY1VpbnQzMiA9IG1hbGxvY1VpbnQzMlxuXG5mdW5jdGlvbiBtYWxsb2NJbnQ4KG4pIHtcbiAgcmV0dXJuIG5ldyBJbnQ4QXJyYXkobWFsbG9jQXJyYXlCdWZmZXIobiksIDAsIG4pXG59XG5leHBvcnRzLm1hbGxvY0ludDggPSBtYWxsb2NJbnQ4XG5cbmZ1bmN0aW9uIG1hbGxvY0ludDE2KG4pIHtcbiAgcmV0dXJuIG5ldyBJbnQxNkFycmF5KG1hbGxvY0FycmF5QnVmZmVyKDIqbiksIDAsIG4pXG59XG5leHBvcnRzLm1hbGxvY0ludDE2ID0gbWFsbG9jSW50MTZcblxuZnVuY3Rpb24gbWFsbG9jSW50MzIobikge1xuICByZXR1cm4gbmV3IEludDMyQXJyYXkobWFsbG9jQXJyYXlCdWZmZXIoNCpuKSwgMCwgbilcbn1cbmV4cG9ydHMubWFsbG9jSW50MzIgPSBtYWxsb2NJbnQzMlxuXG5mdW5jdGlvbiBtYWxsb2NGbG9hdChuKSB7XG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KG1hbGxvY0FycmF5QnVmZmVyKDQqbiksIDAsIG4pXG59XG5leHBvcnRzLm1hbGxvY0Zsb2F0MzIgPSBleHBvcnRzLm1hbGxvY0Zsb2F0ID0gbWFsbG9jRmxvYXRcblxuZnVuY3Rpb24gbWFsbG9jRG91YmxlKG4pIHtcbiAgcmV0dXJuIG5ldyBGbG9hdDY0QXJyYXkobWFsbG9jQXJyYXlCdWZmZXIoOCpuKSwgMCwgbilcbn1cbmV4cG9ydHMubWFsbG9jRmxvYXQ2NCA9IGV4cG9ydHMubWFsbG9jRG91YmxlID0gbWFsbG9jRG91YmxlXG5cbmZ1bmN0aW9uIG1hbGxvY1VpbnQ4Q2xhbXBlZChuKSB7XG4gIGlmKGhhc1VpbnQ4Qykge1xuICAgIHJldHVybiBuZXcgVWludDhDbGFtcGVkQXJyYXkobWFsbG9jQXJyYXlCdWZmZXIobiksIDAsIG4pXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG1hbGxvY1VpbnQ4KG4pXG4gIH1cbn1cbmV4cG9ydHMubWFsbG9jVWludDhDbGFtcGVkID0gbWFsbG9jVWludDhDbGFtcGVkXG5cbmZ1bmN0aW9uIG1hbGxvY0RhdGFWaWV3KG4pIHtcbiAgcmV0dXJuIG5ldyBEYXRhVmlldyhtYWxsb2NBcnJheUJ1ZmZlcihuKSwgMCwgbilcbn1cbmV4cG9ydHMubWFsbG9jRGF0YVZpZXcgPSBtYWxsb2NEYXRhVmlld1xuXG5mdW5jdGlvbiBtYWxsb2NCdWZmZXIobikge1xuICBuID0gYml0cy5uZXh0UG93MihuKVxuICB2YXIgbG9nX24gPSBiaXRzLmxvZzIobilcbiAgdmFyIGNhY2hlID0gQlVGRkVSW2xvZ19uXVxuICBpZihjYWNoZS5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIGNhY2hlLnBvcCgpXG4gIH1cbiAgcmV0dXJuIG5ldyBCdWZmZXIobilcbn1cbmV4cG9ydHMubWFsbG9jQnVmZmVyID0gbWFsbG9jQnVmZmVyXG5cbmV4cG9ydHMuY2xlYXJDYWNoZSA9IGZ1bmN0aW9uIGNsZWFyQ2FjaGUoKSB7XG4gIGZvcih2YXIgaT0wOyBpPDMyOyArK2kpIHtcbiAgICBQT09MLlVJTlQ4W2ldLmxlbmd0aCA9IDBcbiAgICBQT09MLlVJTlQxNltpXS5sZW5ndGggPSAwXG4gICAgUE9PTC5VSU5UMzJbaV0ubGVuZ3RoID0gMFxuICAgIFBPT0wuSU5UOFtpXS5sZW5ndGggPSAwXG4gICAgUE9PTC5JTlQxNltpXS5sZW5ndGggPSAwXG4gICAgUE9PTC5JTlQzMltpXS5sZW5ndGggPSAwXG4gICAgUE9PTC5GTE9BVFtpXS5sZW5ndGggPSAwXG4gICAgUE9PTC5ET1VCTEVbaV0ubGVuZ3RoID0gMFxuICAgIFBPT0wuVUlOVDhDW2ldLmxlbmd0aCA9IDBcbiAgICBEQVRBW2ldLmxlbmd0aCA9IDBcbiAgICBCVUZGRVJbaV0ubGVuZ3RoID0gMFxuICB9XG59IiwiXCJ1c2Ugc3RyaWN0XCJcblxuZnVuY3Rpb24gdW5pcXVlX3ByZWQobGlzdCwgY29tcGFyZSkge1xuICB2YXIgcHRyID0gMVxuICAgICwgbGVuID0gbGlzdC5sZW5ndGhcbiAgICAsIGE9bGlzdFswXSwgYj1saXN0WzBdXG4gIGZvcih2YXIgaT0xOyBpPGxlbjsgKytpKSB7XG4gICAgYiA9IGFcbiAgICBhID0gbGlzdFtpXVxuICAgIGlmKGNvbXBhcmUoYSwgYikpIHtcbiAgICAgIGlmKGkgPT09IHB0cikge1xuICAgICAgICBwdHIrK1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuICAgICAgbGlzdFtwdHIrK10gPSBhXG4gICAgfVxuICB9XG4gIGxpc3QubGVuZ3RoID0gcHRyXG4gIHJldHVybiBsaXN0XG59XG5cbmZ1bmN0aW9uIHVuaXF1ZV9lcShsaXN0KSB7XG4gIHZhciBwdHIgPSAxXG4gICAgLCBsZW4gPSBsaXN0Lmxlbmd0aFxuICAgICwgYT1saXN0WzBdLCBiID0gbGlzdFswXVxuICBmb3IodmFyIGk9MTsgaTxsZW47ICsraSwgYj1hKSB7XG4gICAgYiA9IGFcbiAgICBhID0gbGlzdFtpXVxuICAgIGlmKGEgIT09IGIpIHtcbiAgICAgIGlmKGkgPT09IHB0cikge1xuICAgICAgICBwdHIrK1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuICAgICAgbGlzdFtwdHIrK10gPSBhXG4gICAgfVxuICB9XG4gIGxpc3QubGVuZ3RoID0gcHRyXG4gIHJldHVybiBsaXN0XG59XG5cbmZ1bmN0aW9uIHVuaXF1ZShsaXN0LCBjb21wYXJlLCBzb3J0ZWQpIHtcbiAgaWYobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbGlzdFxuICB9XG4gIGlmKGNvbXBhcmUpIHtcbiAgICBpZighc29ydGVkKSB7XG4gICAgICBsaXN0LnNvcnQoY29tcGFyZSlcbiAgICB9XG4gICAgcmV0dXJuIHVuaXF1ZV9wcmVkKGxpc3QsIGNvbXBhcmUpXG4gIH1cbiAgaWYoIXNvcnRlZCkge1xuICAgIGxpc3Quc29ydCgpXG4gIH1cbiAgcmV0dXJuIHVuaXF1ZV9lcShsaXN0KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHVuaXF1ZVxuIiwidmFyIFRIUkVFID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ1RIUkVFJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydUSFJFRSddIDogbnVsbCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXBwKSB7XG4gIHZhciBzY2VuZSA9IGFwcC5nZXQoJ3NjZW5lJyk7XG5cbiAgdmFyIG9iamVjdCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuXG4gIHZhciBlZGl0b3IgPSBhcHAuYXR0YWNoKG9iamVjdCwgcmVxdWlyZSgnLi4vZWRpdG9yL2VkaXRvcicpKTtcblxuICBzY2VuZS5hZGQob2JqZWN0KTtcblxuICByZXR1cm4gb2JqZWN0O1xufTsiLCJ2YXIgbmRhcnJheSA9IHJlcXVpcmUoJ25kYXJyYXknKTtcbnZhciBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydUSFJFRSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnVEhSRUUnXSA6IG51bGwpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFwcCkge1xuICB2YXIgc2NlbmUgPSBhcHAuZ2V0KCdzY2VuZScpO1xuICB2YXIgY2FtZXJhID0gYXBwLmdldCgnY2FtZXJhJyk7XG5cbiAgdmFyIG9iamVjdCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICB2YXIgYmxvY2tzID0gYXBwLmF0dGFjaChvYmplY3QsIHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvYmxvY2tzJykpO1xuXG4gIHZhciBkaW0gPSBbMzIsIDMyLCAzMl07XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBkaW1bMF07IGkrKykge1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGltWzFdOyBqKyspIHtcbiAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgZGltWzJdOyBrKyspIHtcbiAgICAgICAgYmxvY2tzLnNldChpLCBqLCBrLCAxKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBibG9ja3Mub2Zmc2V0LnNldCgtMTYsIC0xNiwgLTE2KTtcbiAgYmxvY2tzLnVwZGF0ZU1lc2goKTtcblxuICB2YXIgcmlnaWRCb2R5ID0gYXBwLmF0dGFjaChvYmplY3QsIHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvcmlnaWRib2R5JykpO1xuICByaWdpZEJvZHkuY29sbGlzaW9uT2JqZWN0ID0gYmxvY2tzLm9iamVjdDtcbiAgcmlnaWRCb2R5LmlzRml4dHVyZSA9IHRydWU7XG4gIFxuICBzY2VuZS5hZGQob2JqZWN0KTtcbn07IiwidmFyIFRIUkVFID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ1RIUkVFJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydUSFJFRSddIDogbnVsbCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXBwKSB7XG4gIHZhciBzY2VuZSA9IGFwcC5nZXQoJ3NjZW5lJyk7XG5cbiAgdmFyIG9iamVjdCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICB2YXIgY2hhcmFjdGVyID0gYXBwLmF0dGFjaChvYmplY3QsIHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvY2hhcmFjdGVyJykpO1xuICB2YXIgcmlnaWRCb2R5ID0gYXBwLmF0dGFjaChvYmplY3QsIHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvcmlnaWRib2R5JykpO1xuICByaWdpZEJvZHkubWFzcyA9IDE7XG4gIHZhciBwbGF5ZXJDb250cm9sID0gYXBwLmF0dGFjaChvYmplY3QsIHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvcGxheWVyY29udHJvbCcpKTtcblxuICBjaGFyYWN0ZXIucmlnaWRCb2R5ID0gcmlnaWRCb2R5O1xuICBwbGF5ZXJDb250cm9sLmNoYXJhY3RlciA9IGNoYXJhY3RlcjtcbiAgcGxheWVyQ29udHJvbC5yaWdpZEJvZHkgPSByaWdpZEJvZHk7XG5cbiAgc2NlbmUuYWRkKG9iamVjdCk7XG5cbiAgb2JqZWN0LnBvc2l0aW9uLnNldCgwLCA0MCwgMCk7XG5cbiAgcmV0dXJuIG9iamVjdDtcbn07IiwidmFyIG5kYXJyYXkgPSByZXF1aXJlKCduZGFycmF5Jyk7XG52YXIgbWVzaGVyID0gcmVxdWlyZSgnLi4vdm94ZWwvbWVzaGVyJyk7XG52YXIgYXJyYXlVdGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzL2FycmF5dXRpbHMnKTtcblxudmFyIEJsb2NrcyA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICB0aGlzLm9iamVjdCA9IG9iamVjdDtcbiAgdGhpcy50eXBlID0gJ2Jsb2Nrcyc7XG5cbiAgdGhpcy5kaW0gPSBbMTYsIDE2LCAxNl07XG4gIHRoaXMuY2h1bmsgPSBuZGFycmF5KFtdLCB0aGlzLmRpbSk7XG5cbiAgdGhpcy5tZXNoID0gbnVsbDtcbiAgdGhpcy5vYmogPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcbiAgdGhpcy5tYXRlcmlhbCA9IG5ldyBUSFJFRS5NdWx0aU1hdGVyaWFsKCk7XG5cbiAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xuICB0aGlzLmRpbU5lZWRzVXBkYXRlID0gZmFsc2U7XG5cbiAgdGhpcy5vYmplY3QuYWRkKHRoaXMub2JqKTtcblxuICB0aGlzLnBhbGV0dGUgPSBbbnVsbF07XG5cbiAgdGhpcy51c2VyRGF0YSA9IHt9O1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbih4LCB5LCB6LCBiKSB7XG4gIHRoaXMuY2h1bmsuc2V0KHgsIHksIHosIGIpO1xuICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuc2V0QXRDb29yZCA9IGZ1bmN0aW9uKGNvb3JkLCBiKSB7XG4gIHRoaXMuc2V0KGNvb3JkLngsIGNvb3JkLnksIGNvb3JkLnosIGIpO1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbih4LCB5LCB6KSB7XG4gIHJldHVybiB0aGlzLmNodW5rLmdldCh4LCB5LCB6KTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuZ2V0QXRDb29yZCA9IGZ1bmN0aW9uKGNvb3JkKSB7XG4gIHJldHVybiB0aGlzLmdldChjb29yZC54LCBjb29yZC55LCBjb29yZC56KTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUucG9pbnRUb0Nvb3JkID0gZnVuY3Rpb24ocG9pbnQpIHtcbiAgcmV0dXJuIG5ldyBUSFJFRS5WZWN0b3IzKHBvaW50LnggLSAwLjUsIHBvaW50LnkgLSAwLjUsIHBvaW50LnogLSAwLjUpO1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS5jb29yZFRvUG9pbnQgPSBmdW5jdGlvbihjb29yZCkge1xuICByZXR1cm4gbmV3IFRIUkVFLlZlY3RvcjMoY29vcmQueCwgY29vcmQueSwgY29vcmQueik7XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuZGltTmVlZHNVcGRhdGUpIHtcbiAgICB0aGlzLl91cGRhdGVEaW0oKTtcbiAgICB0aGlzLmRpbU5lZWRzVXBkYXRlID0gZmFsc2U7XG4gIH1cblxuICB0aGlzLnVwZGF0ZU1lc2goKTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5jaHVuayA9IG5kYXJyYXkoW10sIHRoaXMuZGltKTtcbiAgdGhpcy5vYmoucmVtb3ZlKHRoaXMubWVzaCk7XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLnNldERpbSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHRoaXMuZGltID0gdmFsdWU7XG4gIHRoaXMuZGltTmVlZHNVcGRhdGUgPSB0cnVlO1xuICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUudmlzaXQgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICB2YXIgc2hhcGUgPSB0aGlzLmNodW5rLnNoYXBlO1xuICB2YXIgZGF0YSA9IHRoaXMuY2h1bmsuZGF0YTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaGFwZVswXTsgaSsrKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBzaGFwZVsxXTsgaisrKSB7XG4gICAgICBmb3IgKHZhciBrID0gMDsgayA8IHNoYXBlWzJdOyBrKyspIHtcbiAgICAgICAgdmFyIGIgPSB0aGlzLmNodW5rLmdldChpLCBqLCBrKTtcbiAgICAgICAgaWYgKCEhYikge1xuICAgICAgICAgIGNhbGxiYWNrKGksIGosIGssIGIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLmdldEFsbENvb3JkcyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY29vcmRzID0gW107XG4gIHRoaXMudmlzaXQoZnVuY3Rpb24oaSwgaiwgaykge1xuICAgIGNvb3Jkcy5wdXNoKG5ldyBUSFJFRS5WZWN0b3IzKGksIGosIGspKTtcbiAgfSk7XG4gIHJldHVybiBjb29yZHM7XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLnByaW50ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMudmlzaXQoZnVuY3Rpb24oaSwgaiwgaywgYikge1xuICAgIGNvbnNvbGUubG9nKFtpLCBqLCBrXS5qb2luKCcsJyksIGIpO1xuICB9KTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuc2VyaWFsaXplID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgZGltOiB0aGlzLmRpbSxcbiAgICBjaHVua0RhdGE6IGFycmF5VXRpbHMuY2xvbmUodGhpcy5jaHVuay5kYXRhKSxcbiAgICBwYWxldHRlOiB0aGlzLnBhbGV0dGUsXG4gICAgdXNlckRhdGE6IHRoaXMudXNlckRhdGFcbiAgfTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuZGVzZXJpYWxpemUgPSBmdW5jdGlvbihqc29uKSB7XG4gIHRoaXMuZGltID0ganNvbi5kaW07XG4gIHRoaXMuY2h1bmsgPSBuZGFycmF5KFtdLCB0aGlzLmRpbSk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwganNvbi5jaHVua0RhdGEubGVuZ3RoOyBpKyspIHtcbiAgICB0aGlzLmNodW5rLmRhdGFbaV0gPSBqc29uLmNodW5rRGF0YVtpXTtcbiAgfVxuXG4gIHRoaXMucGFsZXR0ZSA9IGpzb24ucGFsZXR0ZTtcblxuICB0aGlzLnVwZGF0ZU1hdGVyaWFsKCk7XG5cbiAgdGhpcy5kaW1OZWVkc1VwZGF0ZSA9IHRydWU7XG4gIHRoaXMuZGlydHkgPSB0cnVlO1xuXG4gIHRoaXMudXNlckRhdGEgPSBqc29uLnVzZXJEYXRhO1xufTtcblxuQmxvY2tzLnByb3RvdHlwZS51cGRhdGVNZXNoID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmRpcnR5KSB7XG4gICAgdGhpcy5fdXBkYXRlTWVzaCgpO1xuICAgIHRoaXMuZGlydHkgPSBmYWxzZTtcbiAgfVxufTtcblxuQmxvY2tzLnByb3RvdHlwZS5fdXBkYXRlTWVzaCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5tZXNoICE9IG51bGwpIHtcbiAgICB0aGlzLm9iai5yZW1vdmUodGhpcy5tZXNoKTtcbiAgfVxuXG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIGRpbSA9IHRoaXMuZGltO1xuXG4gIHZhciByZXN1bHQgPSBtZXNoZXIoZnVuY3Rpb24oaSwgaiwgaykge1xuICAgIHJldHVybiBzZWxmLmdldChpLCBqLCBrKTtcbiAgfSwgZGltKTtcblxuICB2YXIgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuR2VvbWV0cnkoKTtcblxuICByZXN1bHQudmVydGljZXMuZm9yRWFjaChmdW5jdGlvbih2KSB7XG4gICAgdmFyIHZlcnRpY2UgPSBuZXcgVEhSRUUuVmVjdG9yMyhcbiAgICAgIHZbMF0sIHZbMV0sIHZbMl1cbiAgICApO1xuICAgIGdlb21ldHJ5LnZlcnRpY2VzLnB1c2godmVydGljZSk7XG4gIH0pO1xuXG4gIHJlc3VsdC5zdXJmYWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHN1cmZhY2UpIHtcbiAgICB2YXIgZiA9IHN1cmZhY2UuZmFjZTtcbiAgICB2YXIgdXYgPSBzdXJmYWNlLnV2O1xuICAgIHZhciBjID0gZls0XTtcbiAgICBjID0gYy52YWx1ZSB8fCBjO1xuXG4gICAgdmFyIGZhY2UgPSBuZXcgVEhSRUUuRmFjZTMoZlswXSwgZlsxXSwgZlsyXSk7XG4gICAgZ2VvbWV0cnkuZmFjZXMucHVzaChmYWNlKTtcbiAgICBnZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdLnB1c2goW3V2WzBdLCB1dlsxXSwgdXZbMl1dKTtcbiAgICBmYWNlLm1hdGVyaWFsSW5kZXggPSBjIC0gMTtcblxuICAgIGZhY2UgPSBuZXcgVEhSRUUuRmFjZTMoZlsyXSwgZlszXSwgZlswXSk7XG4gICAgZ2VvbWV0cnkuZmFjZXMucHVzaChmYWNlKTtcbiAgICBnZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdLnB1c2goW3V2WzJdLCB1dlszXSwgdXZbMF1dKTtcbiAgICBmYWNlLm1hdGVyaWFsSW5kZXggPSBjIC0gMTtcbiAgfSk7XG5cbiAgZ2VvbWV0cnkuY29tcHV0ZUZhY2VOb3JtYWxzKCk7XG5cbiAgdGhpcy5tZXNoID0gbmV3IFRIUkVFLk1lc2goZ2VvbWV0cnksIHRoaXMubWF0ZXJpYWwpO1xuICB0aGlzLm9iai5hZGQodGhpcy5tZXNoKTtcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuX3VwZGF0ZURpbSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbmV3Q2h1bmsgPSBuZGFycmF5KFtdLCB0aGlzLmRpbSk7XG4gIHZhciBzaGFwZSA9IHRoaXMuY2h1bmsuc2hhcGU7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaGFwZVswXTsgaSsrKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBzaGFwZVsxXTsgaisrKSB7XG4gICAgICBmb3IgKHZhciBrID0gMDsgayA8IHNoYXBlWzJdOyBrKyspIHtcbiAgICAgICAgdmFyIGIgPSB0aGlzLmNodW5rLmdldChpLCBqLCBrKTtcbiAgICAgICAgaWYgKCEhYikge1xuICAgICAgICAgIG5ld0NodW5rLnNldChpLCBqLCBrLCBiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHRoaXMuY2h1bmsgPSBuZXdDaHVuaztcbn07XG5cbkJsb2Nrcy5wcm90b3R5cGUuZ2V0T3JBZGRDb2xvckluZGV4ID0gZnVuY3Rpb24oY29sb3IpIHtcbiAgLy8gbnVsbCwgMCwgZmFsc2UsIHVuZGVmaW5lZFxuICBpZiAoIWNvbG9yKSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICB2YXIgaW5kZXggPSBhcnJheVV0aWxzLmluZGV4T2YodGhpcy5wYWxldHRlLCBjb2xvcik7XG4gIGlmIChpbmRleCA9PSAtMSkge1xuICAgIHRoaXMucGFsZXR0ZS5wdXNoKGNvbG9yKTtcbiAgICBpbmRleCA9IHRoaXMucGFsZXR0ZS5sZW5ndGggLSAxO1xuICAgIHZhciBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsKHtcbiAgICAgIGNvbG9yOiBuZXcgVEhSRUUuQ29sb3IodGhpcy5wYWxldHRlW2luZGV4XSlcbiAgICB9KTtcbiAgICB0aGlzLm1hdGVyaWFsLm1hdGVyaWFscy5wdXNoKG1hdGVyaWFsKTtcbiAgICByZXR1cm4gdGhpcy5wYWxldHRlLmxlbmd0aCAtIDE7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGluZGV4O1xuICB9XG59O1xuXG5CbG9ja3MucHJvdG90eXBlLnVwZGF0ZU1hdGVyaWFsID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMubWF0ZXJpYWwgPSBuZXcgVEhSRUUuTXVsdGlNYXRlcmlhbCgpO1xuICBmb3IgKHZhciBpID0gMTsgaSA8IHRoaXMucGFsZXR0ZS5sZW5ndGg7IGkrKykge1xuICAgIHZhciBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsKHtcbiAgICAgIGNvbG9yOiBuZXcgVEhSRUUuQ29sb3IodGhpcy5wYWxldHRlW2ldKVxuICAgIH0pO1xuICAgIHRoaXMubWF0ZXJpYWwubWF0ZXJpYWxzLnB1c2gobWF0ZXJpYWwpO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJsb2NrczsiLCJ2YXIgVEhSRUUgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snVEhSRUUnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ1RIUkVFJ10gOiBudWxsKTtcblxudmFyIENoYXJhY3RlciA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICB0aGlzLm9iamVjdCA9IG9iamVjdDtcblxuICB0aGlzLmdlb21ldHJ5ID0gbmV3IFRIUkVFLkJveEdlb21ldHJ5KDEsIDEsIDEpO1xuICB0aGlzLm1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICBjb2xvcjogMHhmZjAwMDBcbiAgfSk7XG5cbiAgdGhpcy5tZXNoID0gbmV3IFRIUkVFLk1lc2godGhpcy5nZW9tZXRyeSwgdGhpcy5tYXRlcmlhbCk7XG4gIHRoaXMub2JqZWN0LmFkZCh0aGlzLm1lc2gpO1xuXG4gIHRoaXMubW92ZVNwZWVkID0gMC41O1xuICB0aGlzLmp1bXBTcGVlZCA9IDAuODtcbiAgdGhpcy5qdW1waW5nID0gZmFsc2U7XG59O1xuXG5DaGFyYWN0ZXIucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5ncmF2aXR5ID0gdGhpcy5yaWdpZEJvZHkuZ3Jhdml0eTtcbiAgaWYgKHRoaXMuanVtcGluZyAmJiB0aGlzLnJpZ2lkQm9keS5ncm91bmRlZCkge1xuICAgIHRoaXMuanVtcGluZyA9IGZhbHNlO1xuICB9XG59O1xuXG5DaGFyYWN0ZXIucHJvdG90eXBlLm1vdmUgPSBmdW5jdGlvbihmb3J3YXJkLCBhbW91bnQpIHtcbiAgdmFyIGdyYXZpdHkgPSB0aGlzLnJpZ2lkQm9keS5ncmF2aXR5O1xuICBpZiAoZ3Jhdml0eSA9PSBudWxsKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICh0aGlzLnJpZ2lkQm9keS5ncm91bmRlZCB8fCB0aGlzLmp1bXBpbmcpIHtcbiAgICB2YXIgdmVydGljYWxTcGVlZCA9IHRoaXMucmlnaWRCb2R5LnZlbG9jaXR5LmNsb25lKCkucHJvamVjdE9uVmVjdG9yKGdyYXZpdHkuZGlyKTtcbiAgICB2YXIgZm9yd2FyZFNwZWVkID0gZm9yd2FyZC5jbG9uZSgpLnNldExlbmd0aChhbW91bnQgKiB0aGlzLm1vdmVTcGVlZCk7XG4gICAgdGhpcy5yaWdpZEJvZHkudmVsb2NpdHkuY29weSh2ZXJ0aWNhbFNwZWVkLmFkZChmb3J3YXJkU3BlZWQpKTtcbiAgfVxufTtcblxuQ2hhcmFjdGVyLnByb3RvdHlwZS5qdW1wID0gZnVuY3Rpb24oYW1vdW50KSB7XG4gIHZhciBncmF2aXR5ID0gdGhpcy5yaWdpZEJvZHkuZ3Jhdml0eTtcbiAgaWYgKGdyYXZpdHkgPT0gbnVsbCkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAodGhpcy5yaWdpZEJvZHkuZ3JvdW5kZWQpIHtcbiAgICB0aGlzLmp1bXBpbmcgPSB0cnVlO1xuICAgIHRoaXMucmlnaWRCb2R5LnZlbG9jaXR5LmNvcHkoZ3Jhdml0eS5kaXIuY2xvbmUoKS5tdWx0aXBseVNjYWxhcigtdGhpcy5qdW1wU3BlZWQpKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDaGFyYWN0ZXI7IiwidmFyIFBsYXllckNhbWVyYSA9IGZ1bmN0aW9uKGNhbWVyYSwgYXBwKSB7XG4gIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuICB0aGlzLmFwcCA9IGFwcDtcblxuICB0aGlzLmNhbWVyYVRpbHQgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21FdWxlcihcbiAgICBuZXcgVEhSRUUuRXVsZXIoLU1hdGguUEkgLyA0LCBNYXRoLlBJIC8gNCwgMCwgJ1lYWicpKTtcblxuICB0aGlzLmNhbWVyYVF1YXQgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICB0aGlzLmNhbWVyYVF1YXRGaW5hbCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbiAgdGhpcy5kaXN0YW5jZSA9IDEwMDtcbiAgdGhpcy50YXJnZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICB0aGlzLnF1YXRlcm5pb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xufTtcblxuUGxheWVyQ2FtZXJhLiRpbmplY3QgPSBbJ2FwcCddO1xuXG5QbGF5ZXJDYW1lcmEucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBsYXllciA9IGFwcC5nZXQoJ3BsYXllcicpO1xuICBpZiAocGxheWVyID09IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgcmlnaWRCb2R5ID0gYXBwLmdldENvbXBvbmVudChwbGF5ZXIsICdyaWdpZEJvZHknKTtcblxuICB2YXIgZ3Jhdml0eURpcjtcbiAgaWYgKHJpZ2lkQm9keS5ncm91bmRlZCkge1xuICAgIGdyYXZpdHlEaXIgPSByaWdpZEJvZHkuZ3Jhdml0eS5kaXIuY2xvbmUoKTtcbiAgfSBlbHNlIHtcbiAgICBncmF2aXR5RGlyID0gcmlnaWRCb2R5LmdyYXZpdHkuZm9yY2VEaXIuY2xvbmUoKTtcbiAgfVxuXG4gIGlmIChncmF2aXR5RGlyLmxlbmd0aCgpID09IDApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgYSA9IGdyYXZpdHlEaXIuY2xvbmUoKS5tdWx0aXBseVNjYWxhcigtMSk7XG5cbiAgdmFyIGRpZmYgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21Vbml0VmVjdG9ycyhcbiAgICBuZXcgVEhSRUUuVmVjdG9yMygwLCAxLCAwKS5hcHBseVF1YXRlcm5pb24odGhpcy5jYW1lcmFRdWF0KSxcbiAgICBhXG4gICk7XG5cbiAgdGhpcy5jYW1lcmFRdWF0Lm11bHRpcGx5UXVhdGVybmlvbnMoZGlmZiwgdGhpcy5jYW1lcmFRdWF0KTtcbiAgdGhpcy5jYW1lcmFRdWF0RmluYWwgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLm11bHRpcGx5UXVhdGVybmlvbnMoXG4gICAgdGhpcy5jYW1lcmFRdWF0LFxuICAgIHRoaXMuY2FtZXJhVGlsdCk7XG5cbiAgdGhpcy5xdWF0ZXJuaW9uLnNsZXJwKHRoaXMuY2FtZXJhUXVhdEZpbmFsLCAwLjEpO1xuXG4gIGxhc3RHcmF2aXR5ID0gZ3Jhdml0eURpcjtcblxuICB0aGlzLnVwZGF0ZUNhbWVyYSgpO1xufTtcblxuUGxheWVyQ2FtZXJhLnByb3RvdHlwZS51cGRhdGVDYW1lcmEgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGRpZmYgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAxKVxuICAgIC5hcHBseVF1YXRlcm5pb24odGhpcy5xdWF0ZXJuaW9uKVxuICAgIC5zZXRMZW5ndGgodGhpcy5kaXN0YW5jZSk7XG4gIHZhciBwb3MgPSB0aGlzLnRhcmdldC5jbG9uZSgpXG4gICAgLmFkZChkaWZmKTtcbiAgY2FtZXJhLnBvc2l0aW9uLmNvcHkocG9zKTtcblxuICB2YXIgdXAgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAxLCAwKS5hcHBseVF1YXRlcm5pb24odGhpcy5xdWF0ZXJuaW9uKTtcbiAgY2FtZXJhLnVwLmNvcHkodXApO1xuICBjYW1lcmEubG9va0F0KHRoaXMudGFyZ2V0KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUGxheWVyQ2FtZXJhOyIsInZhciBQbGF5ZXJDb250cm9sID0gZnVuY3Rpb24ob2JqZWN0LCBhcHAsIGlucHV0LCBjYW1lcmEpIHtcbiAgdGhpcy5vYmplY3QgPSBvYmplY3Q7XG4gIHRoaXMuaW5wdXQgPSBpbnB1dDtcbiAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XG5cbiAgdGhpcy5jaGFyYWN0ZXIgPSBudWxsO1xuICB0aGlzLnJpZ2lkQm9keSA9IG51bGw7XG59O1xuXG5QbGF5ZXJDb250cm9sLiRpbmplY3QgPSBbJ2lucHV0JywgJ2NhbWVyYSddO1xuXG5QbGF5ZXJDb250cm9sLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oKSB7XG4gIHZhciBmb3J3YXJkQW1vdW50ID0gMDtcbiAgaWYgKHRoaXMuaW5wdXQua2V5SG9sZCgndycpKSBmb3J3YXJkQW1vdW50ICs9IDE7XG4gIGlmICh0aGlzLmlucHV0LmtleUhvbGQoJ3MnKSkgZm9yd2FyZEFtb3VudCAtPSAxO1xuXG4gIHZhciByaWdodEFtb3VudCA9IDA7XG4gIGlmICh0aGlzLmlucHV0LmtleUhvbGQoJ2QnKSkgcmlnaHRBbW91bnQgKz0gMTtcbiAgaWYgKHRoaXMuaW5wdXQua2V5SG9sZCgnYScpKSByaWdodEFtb3VudCAtPSAxO1xuXG4gIHZhciBncmF2aXR5ID0gdGhpcy5yaWdpZEJvZHkuZ3Jhdml0eTtcblxuICBpZiAoZ3Jhdml0eSAhPSBudWxsKSB7XG4gICAgdmFyIG5vcm1hbCA9IGdyYXZpdHkuZGlyLmNsb25lKCkubXVsdGlwbHlTY2FsYXIoLTEpO1xuXG4gICAgdmFyIHVwID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMSwgMCkuYXBwbHlRdWF0ZXJuaW9uKHRoaXMuY2FtZXJhLnF1YXRlcm5pb24pO1xuICAgIHZhciByaWdodCA9IG5ldyBUSFJFRS5WZWN0b3IzKDEsIDAsIDApLmFwcGx5UXVhdGVybmlvbih0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uKTtcblxuICAgIHZhciBtb3ZlID0gdXAubXVsdGlwbHlTY2FsYXIoZm9yd2FyZEFtb3VudCkuYWRkKHJpZ2h0Lm11bHRpcGx5U2NhbGFyKHJpZ2h0QW1vdW50KSk7XG4gICAgbW92ZS5wcm9qZWN0T25QbGFuZShub3JtYWwpO1xuICAgIG1vdmUuc2V0TGVuZ3RoKDEpO1xuXG4gICAgdGhpcy5jaGFyYWN0ZXIubW92ZShtb3ZlLCAxKTtcblxuICAgIGlmICh0aGlzLmlucHV0LmtleURvd24oJ3NwYWNlJykpIHtcbiAgICAgIHRoaXMuY2hhcmFjdGVyLmp1bXAoKTtcbiAgICB9XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUGxheWVyQ29udHJvbDsiLCJ2YXIgVEhSRUUgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snVEhSRUUnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ1RIUkVFJ10gOiBudWxsKTtcblxudmFyIFJpZ2lkQm9keSA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICB0aGlzLm9iamVjdCA9IG9iamVjdDtcbiAgXG4gIHRoaXMudmVsb2NpdHkgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICBcbiAgdGhpcy5hY2NlbGVyYXRpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICBcbiAgdGhpcy50eXBlID0gJ3JpZ2lkQm9keSc7XG4gIFxuICB0aGlzLmZyaWN0aW9uID0gMC45ODtcblxuICAvLyAwIG1hc3MgbWVhbnMgaW1tb3ZhYmxlXG4gIHRoaXMubWFzcyA9IDA7XG4gIFxuICB0aGlzLmdyYXZpdHkgPSBudWxsO1xuXG4gIHRoaXMuY29sbGlzaW9uT2JqZWN0ID0gbnVsbDtcbn07XG5cblJpZ2lkQm9keS5wcm90b3R5cGUuYXBwbHlGb3JjZSA9IGZ1bmN0aW9uKGZvcmNlKSB7XG4gIHRoaXMuYWNjZWxlcmF0aW9uLmFkZChmb3JjZS5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKDEgLyB0aGlzLm1hc3MpKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmlnaWRCb2R5OyIsInZhciBldmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xuXG52YXIgaWRDb3VudCA9IDA7XG5cbmZ1bmN0aW9uIGdldE5leHRJZCgpIHtcbiAgcmV0dXJuIGlkQ291bnQrKztcbn1cblxudmFyIEVuZ2luZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmVudGl0eU1hcCA9IHt9O1xuICB0aGlzLmxvb2t1cCA9IHt9O1xuICB0aGlzLmZyYW1lUmF0ZSA9IDYwLjA7XG4gIHRoaXMuc3lzdGVtcyA9IFtdO1xuICB0aGlzLmJpbmRpbmdzID0ge307XG59O1xuXG5FbmdpbmUucHJvdG90eXBlLmF0dGFjaCA9IGZ1bmN0aW9uKG9iamVjdCwgZmFjdG9yeSkge1xuICB2YXIgYXJncyA9IFtvYmplY3RdO1xuICB2YXIgY29tcG9uZW50O1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgaWYgKHR5cGVvZiBmYWN0b3J5ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaWYgKGZhY3RvcnkuJGluamVjdCAhPSBudWxsKSB7XG4gICAgICBmYWN0b3J5LiRpbmplY3QuZm9yRWFjaChmdW5jdGlvbihkZXApIHtcbiAgICAgICAgYXJncy5wdXNoKHNlbGYucmVzb2x2ZShkZXApKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBjb21wb25lbnQgPSBuZXcoRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQuYXBwbHkoZmFjdG9yeSwgW251bGxdLmNvbmNhdChhcmdzKSkpO1xuICB9IGVsc2Uge1xuICAgIGNvbXBvbmVudCA9IGZhY3Rvcnk7XG4gIH1cblxuICBpZiAoY29tcG9uZW50ICE9IG51bGwpIHtcbiAgICBjb21wb25lbnQub2JqZWN0ID0gb2JqZWN0O1xuXG4gICAgaWYgKG9iamVjdC5faWQgPT0gbnVsbCkge1xuICAgICAgb2JqZWN0Ll9pZCA9IGdldE5leHRJZCgpO1xuICAgICAgdGhpcy5sb29rdXBbb2JqZWN0Ll9pZF0gPSBvYmplY3Q7XG4gICAgfVxuXG4gICAgaWYgKGNvbXBvbmVudC5faWQgPT0gbnVsbCkge1xuICAgICAgY29tcG9uZW50Ll9pZCA9IGdldE5leHRJZCgpO1xuICAgICAgdGhpcy5sb29rdXBbY29tcG9uZW50Ll9pZF0gPSBjb21wb25lbnQ7XG4gICAgfVxuXG4gICAgdmFyIGNvbXBvbmVudHMgPSB0aGlzLmVudGl0eU1hcFtvYmplY3QuX2lkXTtcbiAgICBpZiAoY29tcG9uZW50cyA9PSBudWxsKSBjb21wb25lbnRzID0gdGhpcy5lbnRpdHlNYXBbb2JqZWN0Ll9pZF0gPSB7fTtcbiAgICBjb21wb25lbnRzW2NvbXBvbmVudC5faWRdID0gY29tcG9uZW50O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN5c3RlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBzeXN0ZW0gPSB0aGlzLnN5c3RlbXNbaV07XG4gICAgICBpZiAoc3lzdGVtLm9uQXR0YWNoICE9IG51bGwpIHN5c3RlbS5vbkF0dGFjaChvYmplY3QsIGNvbXBvbmVudCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvbXBvbmVudDtcbn07XG5cbkVuZ2luZS5wcm90b3R5cGUudXNlID0gZnVuY3Rpb24odHlwZSwgc3lzdGVtKSB7XG4gIHZhciBoYXNUeXBlID0gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnO1xuICBpZiAoIWhhc1R5cGUpIHtcbiAgICBzeXN0ZW0gPSB0eXBlO1xuICB9XG5cbiAgaWYgKHN5c3RlbSAhPSBudWxsKSB7XG4gICAgdGhpcy5zeXN0ZW1zLnB1c2goc3lzdGVtKTtcbiAgICBpZiAoaGFzVHlwZSkge1xuICAgICAgdGhpcy52YWx1ZSh0eXBlLCBzeXN0ZW0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzeXN0ZW07XG59O1xuXG5FbmdpbmUucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5lbWl0KCdiZWZvcmVUaWNrJyk7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN5c3RlbXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgc3lzdGVtID0gdGhpcy5zeXN0ZW1zW2ldO1xuICAgIGlmIChzeXN0ZW0udGljayAhPSBudWxsKSBzeXN0ZW0udGljaygpO1xuICB9XG5cbiAgZm9yICh2YXIgaSBpbiB0aGlzLmVudGl0eU1hcCkge1xuICAgIHZhciBjb21wb25lbnRzID0gdGhpcy5lbnRpdHlNYXBbaV07XG4gICAgZm9yICh2YXIgaiBpbiBjb21wb25lbnRzKSB7XG4gICAgICB2YXIgY29tcG9uZW50ID0gY29tcG9uZW50c1tqXTtcbiAgICAgIGlmIChjb21wb25lbnQudGljayAhPSBudWxsKSBjb21wb25lbnQudGljaygpO1xuICAgIH1cbiAgfVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zeXN0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHN5c3RlbSA9IHRoaXMuc3lzdGVtc1tpXTtcbiAgICBpZiAoc3lzdGVtLmxhdGVUaWNrICE9IG51bGwpIHN5c3RlbS5sYXRlVGljaygpO1xuICB9XG5cbiAgdGhpcy5lbWl0KCdhZnRlclRpY2snKTtcbn07XG5cbkVuZ2luZS5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB2YXIgaW50ZXJ2YWwgPSBmdW5jdGlvbigpIHtcbiAgICBzZWxmLnRpY2soKTtcbiAgICBzZXRUaW1lb3V0KGludGVydmFsLCAxMDAwIC8gdGhpcy5mcmFtZVJhdGUpO1xuICB9XG4gIGludGVydmFsKCk7XG59O1xuXG5FbmdpbmUucHJvdG90eXBlLnZhbHVlID0gZnVuY3Rpb24odHlwZSwgb2JqZWN0KSB7XG4gIHRoaXMuYmluZGluZ3NbdHlwZV0gPSB7XG4gICAgdmFsdWU6IG9iamVjdFxuICB9O1xufTtcblxuRW5naW5lLnByb3RvdHlwZS5yZXNvbHZlID0gZnVuY3Rpb24odHlwZSwgY29udGV4dCkge1xuICB2YXIgYmluZGluZyA9IHRoaXMuYmluZGluZ3NbdHlwZV07XG4gIGlmIChiaW5kaW5nID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2JpbmRpbmcgZm9yIHR5cGUgJyArIHR5cGUgKyAnIG5vdCBmb3VuZCcpO1xuICB9XG5cbiAgaWYgKGJpbmRpbmcuZmFjdG9yeSAhPSBudWxsKSB7XG4gICAgcmV0dXJuIGJpbmRpbmcuZmFjdG9yeShjb250ZXh0KTtcbiAgfVxuXG4gIGlmIChiaW5kaW5nLnZhbHVlICE9IG51bGwpIHtcbiAgICByZXR1cm4gYmluZGluZy52YWx1ZTtcbiAgfVxuXG4gIHJldHVybiB1bmRlZmluZWQ7XG59O1xuXG5FbmdpbmUucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKHR5cGUsIGNvbnRleHQpIHtcbiAgcmV0dXJuIHRoaXMucmVzb2x2ZSh0eXBlLCBjb250ZXh0KTtcbn07XG5cbkVuZ2luZS5wcm90b3R5cGUuZ2V0Q29tcG9uZW50ID0gZnVuY3Rpb24ob2JqZWN0LCB0eXBlKSB7XG4gIHZhciBjb21wb25lbnRzID0gdGhpcy5lbnRpdHlNYXBbb2JqZWN0Ll9pZF07XG4gIGZvciAodmFyIGlkIGluIGNvbXBvbmVudHMpIHtcbiAgICBpZiAoY29tcG9uZW50c1tpZF0udHlwZSA9PT0gdHlwZSkge1xuICAgICAgcmV0dXJuIGNvbXBvbmVudHNbaWRdO1xuICAgIH1cbiAgfVxufTtcblxuRW5naW5lLnByb3RvdHlwZS5sb2FkQXNzZW1ibHkgPSBmdW5jdGlvbihhc3NlbWJseSkge1xuICByZXR1cm4gYXNzZW1ibHkodGhpcyk7XG59O1xuXG5ldmVudHMucHJvdG90eXBlLmFwcGx5KEVuZ2luZS5wcm90b3R5cGUpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IEVuZ2luZSgpO1xufTsiLCJ2YXIgRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2xpc3RlbmVycyA9IHt9O1xufTtcblxuRXZlbnRzLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24oZXZlbnQsIG9iamVjdCkge1xuICB2YXIgY2FsbGJhY2tzID0gdGhpcy5fbGlzdGVuZXJzW2V2ZW50XTtcbiAgaWYgKGNhbGxiYWNrcyA9PSBudWxsKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGNhbGxiYWNrID0gY2FsbGJhY2tzW2ldO1xuICAgIGNhbGxiYWNrKG9iamVjdCk7XG4gIH1cbn07XG5cbkV2ZW50cy5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldmVudCwgY2FsbGJhY2spIHtcbiAgdmFyIGNhbGxiYWNrcyA9IHRoaXMuX2xpc3RlbmVyc1tldmVudF07XG4gIGlmIChjYWxsYmFja3MgPT0gbnVsbCkge1xuICAgIGNhbGxiYWNrcyA9IHRoaXMuX2xpc3RlbmVyc1tldmVudF0gPSBbXTtcbiAgfVxuICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG59O1xuXG5FdmVudHMucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKGV2ZW50LCBjYWxsYmFjaykge1xuICB2YXIgY2FsbGJhY2tzID0gdGhpcy5fbGlzdGVuZXJzW2V2ZW50XTtcbiAgaWYgKGNhbGxiYWNrcyA9PSBudWxsKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGFycmF5VXRpbHMucmVtb3ZlKGNhbGxiYWNrcywgY2FsbGJhY2spO1xufTtcblxuRXZlbnRzLnByb3RvdHlwZS5hcHBseSA9IGZ1bmN0aW9uKG9iaikge1xuICBvYmouZW1pdCA9IHRoaXMuZW1pdDtcbiAgb2JqLm9uID0gdGhpcy5vbjtcbiAgb2JqLm9mZiA9IHRoaXMub2ZmO1xuICBvYmouX2xpc3RlbmVycyA9IHt9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudHM7IiwibW9kdWxlLmV4cG9ydHM9e1xufSIsIm1vZHVsZS5leHBvcnRzPVtcbiAgXCIjN0M3QzdDXCIsXG4gIFwiIzAwMDBGQ1wiLFxuICBcIiMwMDAwQkNcIixcbiAgXCIjNDQyOEJDXCIsXG4gIFwiIzk0MDA4NFwiLFxuICBcIiNBODAwMjBcIixcbiAgXCIjQTgxMDAwXCIsXG4gIFwiIzg4MTQwMFwiLFxuICBcIiM1MDMwMDBcIixcbiAgXCIjMDA3ODAwXCIsXG4gIFwiIzAwNjgwMFwiLFxuICBcIiMwMDU4MDBcIixcbiAgXCIjMDA0MDU4XCIsXG4gIFwiIzAwMDAwMFwiLFxuXG4gIFwiI0JDQkNCQ1wiLFxuICBcIiMwMDc4RjhcIixcbiAgXCIjMDA1OEY4XCIsXG4gIFwiIzY4NDRGQ1wiLFxuICBcIiNEODAwQ0NcIixcbiAgXCIjRTQwMDU4XCIsXG4gIFwiI0Y4MzgwMFwiLFxuICBcIiNFNDVDMTBcIixcbiAgXCIjQUM3QzAwXCIsXG4gIFwiIzAwQjgwMFwiLFxuICBcIiMwMEE4MDBcIixcbiAgXCIjMDBBODQ0XCIsXG4gIFwiIzAwODg4OFwiLCB7XG4gICAgXCJzcmNcIjogXCIvaW1hZ2VzL2NsZWFyLnBuZ1wiLFxuICAgIFwiaXNDbGVhckNvbG9yXCI6IHRydWVcbiAgfSxcblxuICBcIiNGOEY4RjhcIixcbiAgXCIjM0NCQ0ZDXCIsXG4gIFwiIzY4ODhGQ1wiLFxuICBcIiM5ODc4RjhcIixcbiAgXCIjRjg3OEY4XCIsXG4gIFwiI0Y4NTg5OFwiLFxuICBcIiNGODc4NThcIixcbiAgXCIjRkNBMDQ0XCIsXG4gIFwiI0Y4QjgwMFwiLFxuICBcIiNCOEY4MThcIixcbiAgXCIjNThEODU0XCIsXG4gIFwiIzU4Rjg5OFwiLFxuICBcIiMwMEU4RDhcIixcbiAgXCIjNzg3ODc4XCIsXG5cbiAgXCIjRkNGQ0ZDXCIsXG4gIFwiI0E0RTRGQ1wiLFxuICBcIiNCOEI4RjhcIixcbiAgXCIjRDhCOEY4XCIsXG4gIFwiI0Y4QjhGOFwiLFxuICBcIiNGOEE0QzBcIixcbiAgXCIjRjBEMEIwXCIsXG4gIFwiI0ZDRTBBOFwiLFxuICBcIiNGOEQ4NzhcIixcbiAgXCIjRDhGODc4XCIsXG4gIFwiI0I4RjhCOFwiLFxuICBcIiNCOEY4RDhcIixcbiAgXCIjMDBGQ0ZDXCIsXG4gIFwiI0Y4RDhGOFwiLFxuXSIsInZhciBCbG9ja0NvbW1hbmQgPSBmdW5jdGlvbihibG9ja3MpIHtcbiAgdGhpcy5ibG9ja3MgPSBibG9ja3M7XG5cbiAgdGhpcy5zdWJDb21tYW5kcyA9IFtdO1xuXG4gIHRoaXMuZGVsdGFzID0gW107XG59O1xuXG5CbG9ja0NvbW1hbmQucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKGNvb3JkLCB2YWx1ZSkge1xuICB0aGlzLnN1YkNvbW1hbmRzLnB1c2goe1xuICAgIGNvb3JkOiBjb29yZCxcbiAgICB2YWx1ZTogdmFsdWVcbiAgfSk7XG59O1xuXG5CbG9ja0NvbW1hbmQucHJvdG90eXBlLnNldEF0Q29vcmRzID0gZnVuY3Rpb24oY29vcmRzLCB2YWx1ZSkge1xuICB0aGlzLnN1YkNvbW1hbmRzLnB1c2goe1xuICAgIGNvb3JkczogY29vcmRzLFxuICAgIHZhbHVlOiB2YWx1ZVxuICB9KTtcbn07XG5cbkJsb2NrQ29tbWFuZC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24oKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdWJDb21tYW5kcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBzdWJDb21tYW5kID0gdGhpcy5zdWJDb21tYW5kc1tpXTtcbiAgICB2YXIgdmFsdWUgPSBzdWJDb21tYW5kLnZhbHVlO1xuICAgIHZhciBjb29yZHMgPSBzdWJDb21tYW5kLmNvb3JkcyB8fCBbc3ViQ29tbWFuZC5jb29yZF07XG5cbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNvb3Jkcy5sZW5ndGg7IGorKykge1xuICAgICAgdmFyIGNvb3JkID0gY29vcmRzW2pdO1xuICAgICAgdmFyIHByZXZpb3VzVmFsdWUgPSB0aGlzLmJsb2Nrcy5nZXRBdENvb3JkKGNvb3JkKTtcbiAgICAgIHRoaXMuZGVsdGFzLnB1c2goe1xuICAgICAgICBjb29yZDogY29vcmQsXG4gICAgICAgIHByZXZpb3VzVmFsdWU6IHByZXZpb3VzVmFsdWVcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLmJsb2Nrcy5zZXRBdENvb3JkKGNvb3JkLCB2YWx1ZSk7XG4gICAgfVxuICB9XG59O1xuXG5CbG9ja0NvbW1hbmQucHJvdG90eXBlLnVuZG8gPSBmdW5jdGlvbigpIHtcbiAgZm9yICh2YXIgaSA9IHRoaXMuZGVsdGFzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIGRlbHRhID0gdGhpcy5kZWx0YXNbaV07XG4gICAgdGhpcy5ibG9ja3Muc2V0QXRDb29yZChkZWx0YS5jb29yZCwgZGVsdGEucHJldmlvdXNWYWx1ZSk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQmxvY2tDb21tYW5kOyIsInZhciBCbG9ja0NvbW1hbmQgPSByZXF1aXJlKCcuL2Jsb2NrY29tbWFuZCcpO1xudmFyIGFycmF5VXRpbHMgPSByZXF1aXJlKCcuLi8uLi91dGlscy9hcnJheXV0aWxzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWRpdG9yLCBibG9ja3MsIGNvb3Jkcywgb2Zmc2V0KSB7XG4gIHZhciBjb21tYW5kID0gbmV3IEJsb2NrQ29tbWFuZChlZGl0b3IuYmxvY2tzKTtcblxuICB2YXIgdG9BZGQgPSBbXTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGNvb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBjb29yZCA9IGNvb3Jkc1tpXTtcbiAgICB2YXIgdmFsdWUgPSBibG9ja3MuZ2V0QXRDb29yZChjb29yZCk7XG5cbiAgICAvLyBSZW1vdmVcbiAgICBjb21tYW5kLnNldChjb29yZHNbaV0sIHVuZGVmaW5lZCk7XG5cbiAgICB0b0FkZC5wdXNoKHtcbiAgICAgIGNvb3JkOiBub3JtYWxpemVDb29yZChuZXcgVEhSRUUuVmVjdG9yMygpLmFkZFZlY3RvcnMoY29vcmQsIG9mZnNldCksIGJsb2Nrcy5kaW0pLFxuICAgICAgdmFsdWU6IHZhbHVlXG4gICAgfSk7XG4gIH1cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRvQWRkLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGFkZCA9IHRvQWRkW2ldO1xuXG4gICAgLy8gQWRkXG4gICAgY29tbWFuZC5zZXQoYWRkLmNvb3JkLCBhZGQudmFsdWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplQ29vcmQoY29vcmQsIGRpbSkge1xuICAgIHJldHVybiBuZXcgVEhSRUUuVmVjdG9yMyhcbiAgICAgIChjb29yZC54ICsgZGltWzBdKSAlIGRpbVswXSxcbiAgICAgIChjb29yZC55ICsgZGltWzFdKSAlIGRpbVsxXSxcbiAgICAgIChjb29yZC56ICsgZGltWzJdKSAlIGRpbVsyXVxuICAgICk7XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBzZWxlY3Rpb25Db3B5OiBudWxsLFxuICAgIHJ1bjogZnVuY3Rpb24oKSB7XG4gICAgICBjb21tYW5kLnJ1bigpO1xuICAgICAgdGhpcy5zZWxlY3Rpb25Db3B5ID0gYXJyYXlVdGlscy5jbG9uZShlZGl0b3Iuc2VsZWN0aW9ucyk7XG5cbiAgICAgIGlmIChlZGl0b3Iuc2VsZWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vIE9mZnNldCBzZWxlY3Rpb25cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlZGl0b3Iuc2VsZWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciBub3JtYWxpemVkID0gbm9ybWFsaXplQ29vcmQobmV3IFRIUkVFLlZlY3RvcjMoKS5hZGRWZWN0b3JzKGVkaXRvci5zZWxlY3Rpb25zW2ldLCBvZmZzZXQpLCBibG9ja3MuZGltKTtcbiAgICAgICAgICBlZGl0b3Iuc2VsZWN0aW9uc1tpXSA9IG5vcm1hbGl6ZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIHVuZG86IGZ1bmN0aW9uKCkge1xuICAgICAgY29tbWFuZC51bmRvKCk7XG5cbiAgICAgIGlmIChlZGl0b3Iuc2VsZWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vIE9mZnNldCBzZWxlY3Rpb25cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlZGl0b3Iuc2VsZWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciBub3JtYWxpemVkID0gbm9ybWFsaXplQ29vcmQobmV3IFRIUkVFLlZlY3RvcjMoKS5zdWJWZWN0b3JzKGVkaXRvci5zZWxlY3Rpb25zW2ldLCBvZmZzZXQpLCBibG9ja3MuZGltKTtcbiAgICAgICAgICBlZGl0b3Iuc2VsZWN0aW9uc1tpXSA9IG5vcm1hbGl6ZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn07IiwidmFyIGFycmF5VXRpbHMgPSByZXF1aXJlKCcuLi8uLi91dGlscy9hcnJheXV0aWxzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWRpdG9yLCBzZWxlY3Rpb25zKSB7XG4gIHZhciBvcmlnaW5hbFNlbGVjdGlvbnMgPSBudWxsO1xuICByZXR1cm4ge1xuICAgIHJ1bjogZnVuY3Rpb24oKSB7XG4gICAgICBvcmlnaW5hbFNlbGVjdGlvbnMgPSBhcnJheVV0aWxzLmNsb25lKGVkaXRvci5zZWxlY3Rpb25zKTtcbiAgICAgIGVkaXRvci5zZWxlY3Rpb25zID0gc2VsZWN0aW9ucztcbiAgICB9LFxuXG4gICAgdW5kbzogZnVuY3Rpb24oKSB7XG4gICAgICBlZGl0b3Iuc2VsZWN0aW9ucyA9IG9yaWdpbmFsU2VsZWN0aW9ucztcbiAgICB9XG4gIH07XG59OyIsInZhciBCbG9ja0NvbW1hbmQgPSByZXF1aXJlKCcuL2Jsb2NrY29tbWFuZCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGJsb2NrcywgY29vcmRzLCB2YWx1ZSkge1xuICB2YXIgY29tbWFuZCA9IG5ldyBCbG9ja0NvbW1hbmQoYmxvY2tzKTtcbiAgY29tbWFuZC5zZXRBdENvb3Jkcyhjb29yZHMsIHZhbHVlKTtcblxuICByZXR1cm4gY29tbWFuZDtcbn07IiwidmFyIFRIUkVFID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ1RIUkVFJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydUSFJFRSddIDogbnVsbCk7XG5cbnZhciBEcmFnQ2FtZXJhID0gZnVuY3Rpb24oY2FtZXJhLCBpbnB1dCkge1xuICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcbiAgdGhpcy5pbnB1dCA9IGlucHV0O1xuXG4gIHRoaXMucm90YXRpb24gPSBuZXcgVEhSRUUuRXVsZXIoLU1hdGguUEkgLyA0LCBNYXRoLlBJIC8gNCwgMCwgJ1lYWicpO1xuICB0aGlzLmxhc3RNb3VzZSA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gIHRoaXMubW91c2VTcGVlZFggPSAwLjAxO1xuICB0aGlzLm1vdXNlU3BlZWRZID0gMC4wMTtcbiAgdGhpcy5tb3VzZUtleVNwZWVkWCA9IDAuMDM7XG4gIHRoaXMubW91c2VLZXlTcGVlZFkgPSAwLjAzO1xuICB0aGlzLnVuaXRWZWN0b3IgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAxKTtcbiAgdGhpcy5kaXN0YW5jZSA9IDUwO1xuICB0aGlzLnRhcmdldCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDApO1xuICB0aGlzLm1heFBpdGNoID0gTWF0aC5QSSAvIDIgLSAwLjAxO1xuICB0aGlzLm1pblBpdGNoID0gLU1hdGguUEkgLyAyICsgMC4wMTtcbiAgdGhpcy56b29tUmF0ZSA9IDEuMTtcblxuICB0aGlzLnVwZGF0ZUNhbWVyYSgpO1xuXG4gIHRoaXMubG9jayA9IGZhbHNlO1xufTtcblxuRHJhZ0NhbWVyYS4kaW5qZWN0ID0gWydpbnB1dCddO1xuXG5EcmFnQ2FtZXJhLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucHJvY2Vzc0lucHV0KCk7XG5cbiAgdGhpcy51cGRhdGVDYW1lcmEoKTtcbn07XG5cbkRyYWdDYW1lcmEucHJvdG90eXBlLnByb2Nlc3NJbnB1dCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5pbnB1dC5tb3VzZUhvbGQoKSkge1xuICAgIGlmICghdGhpcy5sb2NrKSB7XG4gICAgICB2YXIgZGlmZiA9IG5ldyBUSFJFRS5WZWN0b3IyKCkuc3ViVmVjdG9ycyh0aGlzLmlucHV0Lm1vdXNlLCB0aGlzLmxhc3RNb3VzZSk7XG4gICAgICB0aGlzLnJvdGF0aW9uLnkgKz0gZGlmZi54ICogdGhpcy5tb3VzZVNwZWVkWTtcbiAgICAgIHRoaXMucm90YXRpb24ueCArPSBkaWZmLnkgKiB0aGlzLm1vdXNlU3BlZWRYO1xuXG4gICAgICBpZiAodGhpcy5yb3RhdGlvbi54IDwgdGhpcy5taW5QaXRjaCkgdGhpcy5yb3RhdGlvbi54ID0gdGhpcy5taW5QaXRjaDtcbiAgICAgIGlmICh0aGlzLnJvdGF0aW9uLnggPiB0aGlzLm1heFBpdGNoKSB0aGlzLnJvdGF0aW9uLnggPSB0aGlzLm1heFBpdGNoO1xuICAgIH1cbiAgfVxuXG4gIHZhciByb3RhdGVSaWdodCA9IDA7XG4gIHZhciByb3RhdGVVcCA9IDA7XG4gIGlmICh0aGlzLmlucHV0LmtleUhvbGQoJ3JpZ2h0JykpIHtcbiAgICByb3RhdGVSaWdodCsrO1xuICB9XG4gIGlmICh0aGlzLmlucHV0LmtleUhvbGQoJ2xlZnQnKSkge1xuICAgIHJvdGF0ZVJpZ2h0LS07XG4gIH1cbiAgaWYgKHRoaXMuaW5wdXQua2V5SG9sZCgndXAnKSkge1xuICAgIHJvdGF0ZVVwKys7XG4gIH1cbiAgaWYgKHRoaXMuaW5wdXQua2V5SG9sZCgnZG93bicpKSB7XG4gICAgcm90YXRlVXAtLTtcbiAgfVxuXG4gIHRoaXMucm90YXRpb24ueCArPSByb3RhdGVVcCAqIHRoaXMubW91c2VLZXlTcGVlZFg7XG4gIHRoaXMucm90YXRpb24ueSAtPSByb3RhdGVSaWdodCAqIHRoaXMubW91c2VLZXlTcGVlZFk7XG5cbiAgdGhpcy5sYXN0TW91c2UuY29weSh0aGlzLmlucHV0Lm1vdXNlKTtcblxuICBpZiAodGhpcy5pbnB1dC5rZXlVcCgnPScpKSB7XG4gICAgdGhpcy5kaXN0YW5jZSAvPSB0aGlzLnpvb21SYXRlO1xuICB9IGVsc2UgaWYgKHRoaXMuaW5wdXQua2V5VXAoJy0nKSkge1xuICAgIHRoaXMuZGlzdGFuY2UgKj0gdGhpcy56b29tUmF0ZTtcbiAgfVxufTtcblxuRHJhZ0NhbWVyYS5wcm90b3R5cGUudXBkYXRlQ2FtZXJhID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwb3NpdGlvbiA9IHRoaXMudW5pdFZlY3Rvci5jbG9uZSgpLmFwcGx5RXVsZXIodGhpcy5yb3RhdGlvbikuc2V0TGVuZ3RoKHRoaXMuZGlzdGFuY2UpLmFkZCh0aGlzLnRhcmdldCk7XG4gIHRoaXMuY2FtZXJhLnBvc2l0aW9uLmNvcHkocG9zaXRpb24pO1xuICB0aGlzLmNhbWVyYS5sb29rQXQodGhpcy50YXJnZXQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcmFnQ2FtZXJhOyIsInZhciBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydUSFJFRSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnVEhSRUUnXSA6IG51bGwpO1xudmFyIENCdWZmZXIgPSByZXF1aXJlKCdjYnVmZmVyJyk7XG5cbnZhciBibG9ja3NDb21wb25lbnQgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL2Jsb2NrcycpO1xudmFyIGRyYWdDYW1lcmFDb21wb25lbnQgPSByZXF1aXJlKCcuL2RyYWdjYW1lcmEnKTtcbnZhciBlZGl0b3JDb25zb2xlID0gcmVxdWlyZSgnLi9lZGl0b3Jjb25zb2xlJyk7XG52YXIgRWRpdG9yVG9vbHMgPSByZXF1aXJlKCcuL2VkaXRvcnRvb2xzJyk7XG52YXIgT2Zmc2V0Q29tbWFuZCA9IHJlcXVpcmUoJy4vY29tbWFuZHMvb2Zmc2V0Y29tbWFuZCcpO1xudmFyIEJsb2NrcyA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvYmxvY2tzJyk7XG52YXIgYXJyYXlVdGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzL2FycmF5dXRpbHMnKTtcblxudmFyIHRvb2xCYXIgPSByZXF1aXJlKCcuL2d1aS90b29sYmFyJyk7XG52YXIgYXJyb3dCYXIgPSByZXF1aXJlKCcuL2d1aS9hcnJvd2JhcicpO1xudmFyIGZpbGVCYXIgPSByZXF1aXJlKCcuL2d1aS9maWxlYmFyJyk7XG52YXIgcHJlZmFic0JhciA9IHJlcXVpcmUoJy4vZ3VpL3ByZWZhYnNiYXInKTtcbnZhciBwcmVmYWJzVG9vbEJhciA9IHJlcXVpcmUoJy4vZ3VpL3ByZWZhYnN0b29sYmFyJyk7XG52YXIgY29sb3JCYXIgPSByZXF1aXJlKCcuL2d1aS9jb2xvcmJhcicpO1xudmFyIHByb3BlcnR5UGFuZWwgPSByZXF1aXJlKCcuL2d1aS9wcm9wZXJ0eXBhbmVsJyk7XG5cbnZhciBQZW5Ub29sID0gcmVxdWlyZSgnLi90b29scy9wZW50b29sJyk7XG52YXIgU2FtcGxlVG9vbCA9IHJlcXVpcmUoJy4vdG9vbHMvc2FtcGxldG9vbCcpO1xudmFyIFNlbGVjdFRvb2wgPSByZXF1aXJlKCcuL3Rvb2xzL3NlbGVjdHRvb2wnKTtcbnZhciBDYW1lcmFUb29sID0gcmVxdWlyZSgnLi90b29scy9jYW1lcmF0b29sJyk7XG52YXIgRmlsbFRvb2wgPSByZXF1aXJlKCcuL3Rvb2xzL2ZpbGx0b29sJyk7XG5cbnZhciBWRVJTSU9OID0gJzEuMCc7XG52YXIgS0VZX1NBVkUgPSAnc2F2ZSc7XG5cbnZhciBFZGl0b3IgPSBmdW5jdGlvbihvYmplY3QsIGFwcCwgaW5wdXQsIGNhbWVyYSwgZGV2Q29uc29sZSwgY29uZmlnLCBwYWxldHRlLCBjYW52YXMsIGNhY2hlKSB7XG5cbiAgdGhpcy5vYmplY3QgPSBvYmplY3Q7XG5cbiAgdGhpcy5hcHAgPSBhcHA7XG5cbiAgdGhpcy5pbnB1dCA9IGlucHV0O1xuXG4gIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuXG4gIHRoaXMuZGV2Q29uc29sZSA9IGRldkNvbnNvbGU7XG5cbiAgdGhpcy5jb25maWcgPSBjb25maWc7XG5cbiAgdGhpcy5wYWxldHRlID0gcGFsZXR0ZTtcblxuICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcblxuICB0aGlzLmNhY2hlID0gY2FjaGU7XG5cbiAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICB0aGlzLmJsb2NrcyA9IG51bGw7XG5cbiAgdGhpcy5kcmFnQ2FtZXJhID0gbnVsbDtcblxuICB0aGlzLm9iakdyb3VuZCA9IG51bGw7XG5cbiAgdGhpcy5vYmpCb3VuZGluZ0JveCA9IG51bGw7XG5cbiAgdGhpcy5fc3RhcnRlZCA9IGZhbHNlO1xuXG4gIHRoaXMubWF0ZXJpYWxzID0gW107XG5cbiAgdGhpcy5zZWxlY3RlZENvbG9yID0gbnVsbDtcblxuICB0aGlzLnVuZG9zID0gQ0J1ZmZlcigyMDApO1xuXG4gIHRoaXMucmVkb3MgPSBDQnVmZmVyKDIwMCk7XG5cbiAgdGhpcy5jb2xvckJhciA9IG51bGw7XG5cbiAgdGhpcy5wcmVmYWJzQmFyID0gbnVsbDtcblxuICB0aGlzLnByZWZhYlRvb2xiYXIgPSBudWxsO1xuXG4gIHRoaXMudG9vbEJhciA9IG51bGw7XG5cbiAgdGhpcy5hcnJvd0JhciA9IG51bGw7XG5cbiAgdGhpcy5maWxlQmFyID0gbnVsbDtcblxuICB0aGlzLnRvb2xOYW1lcyA9IFtFZGl0b3JUb29scy5QZW4sIEVkaXRvclRvb2xzLlNhbXBsZSwgRWRpdG9yVG9vbHMuU2VsZWN0LCBFZGl0b3JUb29scy5DYW1lcmEsIEVkaXRvclRvb2xzLkZpbGxdO1xuXG4gIHRoaXMudG9vbE5hbWUgPSBFZGl0b3JUb29scy5QZW47XG4gIHRoaXMubGFzdFRvb2wgPSB0aGlzLnRvb2xOYW1lO1xuXG4gIHRoaXMudG9vbCA9IG51bGw7XG5cbiAgdGhpcy5zZWxlY3Rpb25zID0gW107XG5cbiAgdGhpcy5yZWZsZWN0WCA9IGZhbHNlO1xuXG4gIHRoaXMucmVmbGVjdFkgPSBmYWxzZTtcblxuICB0aGlzLnJlZmxlY3RaID0gZmFsc2U7XG5cbiAgLy8gbG9hZGVkIHNhdmVzXG4gIHRoaXMucHJlZmFicyA9IFtdO1xuXG4gIHRoaXMuc2NyZWVuc2hvdFJlbmRlcmVyID0gbnVsbDtcblxuICAvLyBDb3B5IG9mIGJsb2NrIG9iamVjdFxuICB0aGlzLmxhc3RCbG9ja3MgPSBudWxsO1xuXG4gIHRoaXMub2JqSGlnaGxpZ2h0ID0gbnVsbDtcblxuICB0aGlzLnNuID0gMC4wMDAxO1xuXG4gIHRoaXMuaGlnaGxpZ2h0Q29vcmQgPSBudWxsO1xuXG4gIHRoaXMuZG93bmxvYWRFbGVtZW50ID0gbnVsbDtcblxuICB0aGlzLmVkaXRMb2NrID0gZmFsc2U7XG5cbiAgdGhpcy5jYW1lcmFMb2NrID0gZmFsc2U7XG5cbiAgdGhpcy5wcm9wZXJ0eVBhbmVsID0gbnVsbDtcblxuICB0aGlzLnByZWZhYkluZGV4ID0gMDtcblxuICB0aGlzLmxhc3RUb29sID0gbnVsbDtcbn07XG5cbkVkaXRvci4kaW5qZWN0ID0gWydhcHAnLCAnaW5wdXQnLCAnY2FtZXJhJywgJ2RldkNvbnNvbGUnLCAnY29uZmlnJywgJ3BhbGV0dGUnLCAnY2FudmFzJywgJ2NhY2hlJ107XG5cbkVkaXRvci5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgZWRpdG9yQ29uc29sZSh0aGlzLCB0aGlzLmRldkNvbnNvbGUpO1xuXG4gIHRoaXMuc2VsZWN0ZWRDb2xvciA9IHRoaXMucGFsZXR0ZVswXTtcblxuICB2YXIgc2F2ZSA9IHRoaXMuY2FjaGUuZ2V0KEtFWV9TQVZFKTtcbiAgaWYgKHNhdmUgIT0gbnVsbCkge1xuICAgIGlmIChzYXZlLnZlcnNpb24gIT09IFZFUlNJT04pIHtcbiAgICAgIC8vIE1pZ3JhdGVcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wcmVmYWJzID0gc2F2ZS5wcmVmYWJzIHx8IFtdOyAgXG4gICAgICB0aGlzLnNlbGVjdGVkQ29sb3IgPSBzYXZlLnNlbGVjdGVkQ29sb3I7XG4gICAgfVxuICB9XG5cbiAgdGhpcy5ibG9ja3MgPSB0aGlzLmFwcC5hdHRhY2godGhpcy5vYmplY3QsIGJsb2Nrc0NvbXBvbmVudCk7XG5cbiAgdGhpcy5kcmFnQ2FtZXJhID0gdGhpcy5hcHAuYXR0YWNoKHRoaXMuY2FtZXJhLCBkcmFnQ2FtZXJhQ29tcG9uZW50KTtcblxuICB0aGlzLnVwZGF0ZVRvb2woKTtcblxuICB0aGlzLnVwZGF0ZU1hdGVyaWFsKHRoaXMuYmxvY2tzKTtcblxuICAvLyBTZXQgdXAgR1VJXG4gIHRoaXMudG9vbEJhciA9IHRvb2xCYXIodGhpcyk7XG4gIHRoaXMuYXJyb3dCYXIgPSBhcnJvd0Jhcih0aGlzKTtcbiAgdGhpcy5maWxlQmFyID0gZmlsZUJhcih0aGlzKTtcbiAgdGhpcy5jb2xvckJhciA9IGNvbG9yQmFyKHRoaXMpO1xuICB0aGlzLnByZWZhYnNCYXIgPSBwcmVmYWJzQmFyKHRoaXMpO1xuICB0aGlzLnByZWZhYnNUb29sYmFyID0gcHJlZmFic1Rvb2xCYXIodGhpcyk7XG4gIHRoaXMucHJvcGVydHlQYW5lbCA9IHByb3BlcnR5UGFuZWwodGhpcyk7XG5cbiAgaWYgKHRoaXMucHJlZmFicy5sZW5ndGggPT09IDApIHtcbiAgICB0aGlzLnByZWZhYnMucHVzaCh0aGlzLmJsb2Nrcy5zZXJpYWxpemUoKSk7XG4gIH1cblxuICB0aGlzLmxvYWQodGhpcy5wcmVmYWJzWzBdKTtcbiAgdGhpcy51cGRhdGVTY3JlZW5zaG90cygpO1xuXG4gIHRoaXMuc2V0U2VsZWN0ZWRDb2xvcih0aGlzLnNlbGVjdGVkQ29sb3IpO1xuICB0aGlzLnByZWZhYnNCYXIuaGlnaGxpZ2h0KDApO1xuICB0aGlzLnRvb2xCYXIuaGlnaGxpZ2h0KDApO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5sb2FkID0gZnVuY3Rpb24oZGF0YSkge1xuICB0aGlzLmJsb2Nrcy5kZXNlcmlhbGl6ZShkYXRhKTtcblxuICB0aGlzLnVwZGF0ZVNpemUodGhpcy5ibG9ja3MuZGltKTtcblxuICB0aGlzLnVwZGF0ZUxhc3RCbG9ja3MoKTtcblxuICB0aGlzLnVwZGF0ZVByb3BlcnR5UGFuZWwoKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUuc2V0VG9vbCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgdmFyIGluZGV4ID0gYXJyYXlVdGlscy5pbmRleE9mKHRoaXMudG9vbE5hbWVzLCBuYW1lKTtcbiAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMudG9vbEJhci5oaWdobGlnaHQoaW5kZXgpO1xuICB0aGlzLmxhc3RUb29sID0gdGhpcy50b29sTmFtZTtcbiAgdGhpcy50b29sTmFtZSA9IG5hbWU7XG4gIHRoaXMudXBkYXRlVG9vbCgpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oKSB7XG4gIGlmICghdGhpcy5fc3RhcnRlZCkge1xuICAgIHRoaXMuc3RhcnQoKTtcbiAgICB0aGlzLl9zdGFydGVkID0gdHJ1ZTtcbiAgfVxuXG4gIHRoaXMuY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG5cbiAgdmFyIGhhc0ludGVyc2VjdCA9IHRoaXMuZ2V0Q29vcmRBYm92ZSgpICE9IG51bGw7XG5cbiAgaWYgKCFoYXNJbnRlcnNlY3QgJiYgdGhpcy5pbnB1dC5tb3VzZURvd24oKSkge1xuICAgIHRoaXMuZWRpdExvY2sgPSB0cnVlO1xuICB9XG5cbiAgaWYgKGhhc0ludGVyc2VjdCAmJiB0aGlzLmlucHV0Lm1vdXNlRG93bigpKSB7XG4gICAgdGhpcy5jYW1lcmFMb2NrID0gdHJ1ZTtcbiAgfVxuXG4gIGlmICh0aGlzLmlucHV0Lm1vdXNlVXAoKSkge1xuICAgIHRoaXMuZWRpdExvY2sgPSBmYWxzZTtcbiAgICB0aGlzLmNhbWVyYUxvY2sgPSBmYWxzZTtcbiAgfVxuXG4gIGlmICh0aGlzLnRvb2xOYW1lID09PSBFZGl0b3JUb29scy5TZWxlY3QgfHwgdGhpcy50b29sTmFtZSA9PT0gRWRpdG9yVG9vbHMuU2FtcGxlKSB7XG4gICAgdGhpcy5jYW1lcmFMb2NrID0gdHJ1ZTtcbiAgfSBlbHNlIGlmICh0aGlzLnRvb2xOYW1lID09PSBFZGl0b3JUb29scy5DYW1lcmEpIHtcbiAgICB0aGlzLmNhbWVyYUxvY2sgPSBmYWxzZTtcbiAgfVxuXG4gIHRoaXMuZHJhZ0NhbWVyYS5sb2NrID0gdGhpcy5jYW1lcmFMb2NrO1xuXG4gIHRoaXMudG9vbC50aWNrKCk7XG5cbiAgdGhpcy51cGRhdGVIaWdobGlnaHQodGhpcy5oaWdobGlnaHRDb29yZCk7XG5cbiAgdGhpcy5kcmF3U2VsZWN0aW9uKCk7XG5cbiAgdmFyIG9mZnNldENvb3JkID0gbnVsbDtcbiAgaWYgKHRoaXMuaW5wdXQua2V5RG93bignZicpKSB7XG4gICAgb2Zmc2V0Q29vcmQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAtMSwgMCk7XG4gIH1cbiAgaWYgKHRoaXMuaW5wdXQua2V5RG93bigncicpKSB7XG4gICAgb2Zmc2V0Q29vcmQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAxLCAwKTtcbiAgfVxuICBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCdhJykpIHtcbiAgICBvZmZzZXRDb29yZCA9IG5ldyBUSFJFRS5WZWN0b3IzKC0xLCAwLCAwKTtcbiAgfVxuICBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCdkJykpIHtcbiAgICBvZmZzZXRDb29yZCA9IG5ldyBUSFJFRS5WZWN0b3IzKDEsIDAsIDApO1xuICB9XG4gIGlmICh0aGlzLmlucHV0LmtleURvd24oJ3cnKSkge1xuICAgIG9mZnNldENvb3JkID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTEpO1xuICB9XG4gIGlmICh0aGlzLmlucHV0LmtleURvd24oJ3MnKSkge1xuICAgIG9mZnNldENvb3JkID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMSk7XG4gIH1cblxuICBpZiAob2Zmc2V0Q29vcmQgIT0gbnVsbCkge1xuICAgIHRoaXMuYXBwbHlPZmZzZXQob2Zmc2V0Q29vcmQpO1xuICB9XG5cbiAgaWYgKHRoaXMuaW5wdXQua2V5SG9sZCgnY29tbWFuZCcpICYmIHRoaXMuaW5wdXQua2V5SG9sZCgnc2hpZnQnKSkge1xuICAgIGlmICh0aGlzLmlucHV0LmtleURvd24oJ3onKSkge1xuICAgICAgdGhpcy5yZWRvKCk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHRoaXMuaW5wdXQua2V5SG9sZCgnY29tbWFuZCcpKSB7XG4gICAgaWYgKHRoaXMuaW5wdXQua2V5RG93bigneicpKSB7XG4gICAgICB0aGlzLnVuZG8oKTtcbiAgICB9XG4gIH1cblxuICBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCcxJykpIHtcbiAgICB0aGlzLnNldFRvb2wodGhpcy50b29sTmFtZXNbMF0pO1xuICB9IGVsc2UgaWYgKHRoaXMuaW5wdXQua2V5RG93bignMicpKSB7XG4gICAgdGhpcy5zZXRUb29sKHRoaXMudG9vbE5hbWVzWzFdKTtcbiAgfSBlbHNlIGlmICh0aGlzLmlucHV0LmtleURvd24oJzMnKSkge1xuICAgIHRoaXMuc2V0VG9vbCh0aGlzLnRvb2xOYW1lc1syXSk7XG4gIH0gZWxzZSBpZiAodGhpcy5pbnB1dC5rZXlEb3duKCc0JykpIHtcbiAgICB0aGlzLnNldFRvb2wodGhpcy50b29sTmFtZXNbM10pO1xuICB9IGVsc2UgaWYgKHRoaXMuaW5wdXQua2V5RG93bignNScpKSB7XG4gICAgdGhpcy5zZXRUb29sKHRoaXMudG9vbE5hbWVzWzRdKTtcbiAgfVxufTtcblxuRWRpdG9yLnByb3RvdHlwZS51bmRvID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjb21tYW5kID0gdGhpcy51bmRvcy5sYXN0KCk7XG4gIGlmIChjb21tYW5kID09IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29tbWFuZC51bmRvKCk7XG4gIHRoaXMudW5kb3MucG9wKCk7XG4gIHRoaXMucmVkb3MucHVzaChjb21tYW5kKTtcbiAgdGhpcy51cGRhdGVDdXJyZW50U2NyZWVuc2hvdCgpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5yZWRvID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjb21tYW5kID0gdGhpcy5yZWRvcy5sYXN0KCk7XG4gIGlmIChjb21tYW5kID09IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29tbWFuZC5ydW4oKTtcbiAgdGhpcy5yZWRvcy5wb3AoKTtcbiAgdGhpcy51bmRvcy5wdXNoKGNvbW1hbmQpO1xuICB0aGlzLnVwZGF0ZUN1cnJlbnRTY3JlZW5zaG90KCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnJ1bkNvbW1hbmQgPSBmdW5jdGlvbihjb21tYW5kKSB7XG4gIGNvbW1hbmQucnVuKCk7XG4gIHRoaXMudW5kb3MucHVzaChjb21tYW5kKTtcbiAgdGhpcy5yZWRvcyA9IENCdWZmZXIoMjAwKTtcbiAgdGhpcy51cGRhdGVDdXJyZW50U2NyZWVuc2hvdCgpO1xuICB0aGlzLnNhdmUoKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUudXBkYXRlQ3VycmVudFNjcmVlbnNob3QgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGluZGV4ID0gdGhpcy5wcmVmYWJJbmRleDtcbiAgdGhpcy5wcmVmYWJzW2luZGV4XSA9IHRoaXMuYmxvY2tzLnNlcmlhbGl6ZSgpO1xuICB0aGlzLnVwZGF0ZVNjcmVlbnNob3RBdEluZGV4KGluZGV4KTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUudXBkYXRlU2NyZWVuc2hvdHMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wcmVmYWJzQmFyLmNsZWFyKCk7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnByZWZhYnMubGVuZ3RoOyBpKyspIHtcbiAgICB0aGlzLnVwZGF0ZVNjcmVlbnNob3RBdEluZGV4KGkpO1xuICB9XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnVwZGF0ZVNjcmVlbnNob3RBdEluZGV4ID0gZnVuY3Rpb24oaW5kZXgpIHtcbiAgdmFyIHByZWZhYiA9IHRoaXMucHJlZmFic1tpbmRleF07XG4gIHZhciBpbWdEYXRhID0gdGhpcy5zY3JlZW5zaG90KHByZWZhYik7XG5cbiAgdGhpcy5wcmVmYWJzQmFyLnNldChpbmRleCwge1xuICAgIGltZ0RhdGE6IGltZ0RhdGEsXG4gICAgaW5kZXg6IGluZGV4XG4gIH0pO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS51cGRhdGVNYXRlcmlhbCA9IGZ1bmN0aW9uKGJsb2Nrcykge1xuICB2YXIgbWF0ZXJpYWxzID0gYmxvY2tzLm1hdGVyaWFsLm1hdGVyaWFscztcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1hdGVyaWFscy5sZW5ndGg7IGkrKykge1xuICAgIG1hdGVyaWFsc1tpXSA9IHRoaXMubWF0ZXJpYWxzW2ldO1xuICB9XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnVwZGF0ZVNpemUgPSBmdW5jdGlvbihzaXplKSB7XG4gIHRoaXMuYmxvY2tzLnNldERpbShbc2l6ZVswXSwgc2l6ZVsxXSwgc2l6ZVsyXV0pO1xuICB0aGlzLmJsb2Nrcy5vYmoucG9zaXRpb24uc2V0KC1zaXplWzBdIC8gMiwgLXNpemVbMV0gLyAyLCAtc2l6ZVsyXSAvIDIpO1xuICB0aGlzLnVwZGF0ZUdyb3VuZChzaXplKTtcbiAgdGhpcy51cGRhdGVCb3VuZGluZ0JveChzaXplKTtcblxuICAvLyBNYXggZnJvbSAzIG51bWJlcnNcbiAgdmFyIG1heFNpemUgPSBNYXRoLm1heChzaXplWzBdLCBzaXplWzFdLCBzaXplWzJdKTtcbiAgdGhpcy5kcmFnQ2FtZXJhLmRpc3RhbmNlID0gMiAqIChtYXhTaXplKTtcbiAgdGhpcy51cGRhdGVDdXJyZW50UHJlZmFiKCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnVwZGF0ZUdyb3VuZCA9IGZ1bmN0aW9uKHNpemUpIHtcbiAgaWYgKHRoaXMub2JqR3JvdW5kICE9IG51bGwpIHtcbiAgICB0aGlzLm9iamVjdC5yZW1vdmUodGhpcy5vYmpHcm91bmQpO1xuICB9XG5cbiAgdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkdlb21ldHJ5KCk7XG4gIGdlb21ldHJ5LnZlcnRpY2VzLnB1c2goXG4gICAgbmV3IFRIUkVFLlZlY3RvcjMoLXNpemVbMF0gLyAyLCAtc2l6ZVsxXSAvIDIsIC1zaXplWzJdIC8gMiksXG4gICAgbmV3IFRIUkVFLlZlY3RvcjMoc2l6ZVswXSAvIDIsIC1zaXplWzFdIC8gMiwgLXNpemVbMl0gLyAyKSxcbiAgICBuZXcgVEhSRUUuVmVjdG9yMyhzaXplWzBdIC8gMiwgLXNpemVbMV0gLyAyLCBzaXplWzJdIC8gMiksXG4gICAgbmV3IFRIUkVFLlZlY3RvcjMoLXNpemVbMF0gLyAyLCAtc2l6ZVsxXSAvIDIsIHNpemVbMl0gLyAyKVxuICApO1xuICBnZW9tZXRyeS5mYWNlcy5wdXNoKFxuICAgIG5ldyBUSFJFRS5GYWNlMygyLCAxLCAwKSxcbiAgICBuZXcgVEhSRUUuRmFjZTMoMCwgMywgMilcbiAgKTtcbiAgZ2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXS5wdXNoKFxuICAgIFtcbiAgICAgIG5ldyBUSFJFRS5WZWN0b3IyKDAsIDApLFxuICAgICAgbmV3IFRIUkVFLlZlY3RvcjIoc2l6ZVsyXSAvIDIsIDApLFxuICAgICAgbmV3IFRIUkVFLlZlY3RvcjIoc2l6ZVsyXSAvIDIsIHNpemVbMF0gLyAyKVxuICAgIF0sIFtcbiAgICAgIG5ldyBUSFJFRS5WZWN0b3IyKHNpemVbMl0gLyAyLCBzaXplWzBdIC8gMiksXG4gICAgICBuZXcgVEhSRUUuVmVjdG9yMigwLCBzaXplWzBdIC8gMiksXG4gICAgICBuZXcgVEhSRUUuVmVjdG9yMigwLCAwKVxuICAgIF1cbiAgKTtcbiAgdmFyIG1hdGVyaWFsID0gbWF0ZXJpYWxzWydwbGFjZWhvbGRlciddO1xuICB0aGlzLm9iakdyb3VuZCA9IG5ldyBUSFJFRS5NZXNoKGdlb21ldHJ5LCBtYXRlcmlhbCk7XG4gIHRoaXMub2JqZWN0LmFkZCh0aGlzLm9iakdyb3VuZCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnVwZGF0ZUJvdW5kaW5nQm94ID0gZnVuY3Rpb24oc2l6ZSkge1xuICBpZiAodGhpcy5vYmpCb3VuZGluZ0JveCAhPSBudWxsKSB7XG4gICAgdGhpcy5vYmplY3QucmVtb3ZlKHRoaXMub2JqQm91bmRpbmdCb3gpO1xuICB9XG5cbiAgdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkdlb21ldHJ5KCk7XG5cbiAgdmFyIGEgPSBuZXcgVEhSRUUuVmVjdG9yMygtc2l6ZVswXSAvIDIsIC1zaXplWzFdIC8gMiwgLXNpemVbMl0gLyAyKTtcbiAgdmFyIGIgPSBuZXcgVEhSRUUuVmVjdG9yMyhzaXplWzBdIC8gMiwgLXNpemVbMV0gLyAyLCAtc2l6ZVsyXSAvIDIpO1xuICB2YXIgYyA9IG5ldyBUSFJFRS5WZWN0b3IzKHNpemVbMF0gLyAyLCAtc2l6ZVsxXSAvIDIsIHNpemVbMl0gLyAyKTtcbiAgdmFyIGQgPSBuZXcgVEhSRUUuVmVjdG9yMygtc2l6ZVswXSAvIDIsIC1zaXplWzFdIC8gMiwgc2l6ZVsyXSAvIDIpO1xuXG4gIHZhciBlID0gbmV3IFRIUkVFLlZlY3RvcjMoLXNpemVbMF0gLyAyLCBzaXplWzFdIC8gMiwgLXNpemVbMl0gLyAyKTtcbiAgdmFyIGYgPSBuZXcgVEhSRUUuVmVjdG9yMyhzaXplWzBdIC8gMiwgc2l6ZVsxXSAvIDIsIC1zaXplWzJdIC8gMik7XG4gIHZhciBnID0gbmV3IFRIUkVFLlZlY3RvcjMoc2l6ZVswXSAvIDIsIHNpemVbMV0gLyAyLCBzaXplWzJdIC8gMik7XG4gIHZhciBoID0gbmV3IFRIUkVFLlZlY3RvcjMoLXNpemVbMF0gLyAyLCBzaXplWzFdIC8gMiwgc2l6ZVsyXSAvIDIpO1xuXG4gIGdlb21ldHJ5LnZlcnRpY2VzLnB1c2goYSwgZSwgYiwgZiwgYywgZywgZCwgaCwgZSwgZiwgZiwgZywgZywgaCwgaCwgZSk7XG5cbiAgdmFyIG1hdGVyaWFsID0gbmV3IFRIUkVFLkxpbmVCYXNpY01hdGVyaWFsKHtcbiAgICBjb2xvcjogMHhmZmZmZmYsXG4gICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgb3BhY2l0eTogMC41XG4gIH0pO1xuICB0aGlzLm9iakJvdW5kaW5nQm94ID0gbmV3IFRIUkVFLkxpbmVTZWdtZW50cyhnZW9tZXRyeSwgbWF0ZXJpYWwpO1xuICB0aGlzLm9iamVjdC5hZGQodGhpcy5vYmpCb3VuZGluZ0JveCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnVwZGF0ZVRvb2wgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMudG9vbCAhPSBudWxsKSB7XG4gICAgaWYgKHRoaXMudG9vbC5kaXNwb3NlICE9IG51bGwpIHtcbiAgICAgIHRoaXMudG9vbC5kaXNwb3NlKCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHRoaXMudG9vbE5hbWUgPT09IEVkaXRvclRvb2xzLlBlbikge1xuICAgIHRoaXMudG9vbCA9IG5ldyBQZW5Ub29sKHRoaXMpO1xuICB9IGVsc2UgaWYgKHRoaXMudG9vbE5hbWUgPT09IEVkaXRvclRvb2xzLlNhbXBsZSkge1xuICAgIHRoaXMudG9vbCA9IG5ldyBTYW1wbGVUb29sKHRoaXMpO1xuICB9IGVsc2UgaWYgKHRoaXMudG9vbE5hbWUgPT09IEVkaXRvclRvb2xzLlNlbGVjdCkge1xuICAgIHRoaXMudG9vbCA9IG5ldyBTZWxlY3RUb29sKHRoaXMpO1xuICB9IGVsc2UgaWYgKHRoaXMudG9vbE5hbWUgPT09IEVkaXRvclRvb2xzLkNhbWVyYSkge1xuICAgIHRoaXMudG9vbCA9IG5ldyBDYW1lcmFUb29sKHRoaXMpO1xuICB9IGVsc2UgaWYgKHRoaXMudG9vbE5hbWUgPT09IEVkaXRvclRvb2xzLkZpbGwpIHtcbiAgICB0aGlzLnRvb2wgPSBuZXcgRmlsbFRvb2wodGhpcyk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgbWFrZSB0b29sIG5hbWVkOiAnICsgdGhpcy50b29sTmFtZSk7XG4gIH1cblxuICBpZiAodGhpcy50b29sLnN0YXJ0ICE9IG51bGwpIHtcbiAgICB0aGlzLnRvb2wuc3RhcnQoKTtcbiAgfVxufTtcblxuRWRpdG9yLnByb3RvdHlwZS5kcmF3U2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gIHZhciBibG9ja3MgPSB0aGlzLmJsb2NrcztcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNlbGVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgY29vcmQgPSB0aGlzLnNlbGVjdGlvbnNbaV07XG4gICAgY29vcmQgPSBjb29yZC5jbG9uZSgpLmFkZChuZXcgVEhSRUUuVmVjdG9yMygwLjUsIDAuNSwgMC41KSk7XG4gICAgdmFyIGxvY2FsUG9pbnQgPSBibG9ja3MuY29vcmRUb1BvaW50KGNvb3JkKTtcbiAgICB2YXIgd29ybGRQb2ludCA9IGJsb2Nrcy5vYmoubG9jYWxUb1dvcmxkKGxvY2FsUG9pbnQpO1xuICAgIHZhciB2ZWN0b3IgPSB3b3JsZFBvaW50LnByb2plY3QodGhpcy5jYW1lcmEpO1xuICAgIHZlY3Rvci54ID0gTWF0aC5yb3VuZCgodmVjdG9yLnggKyAxKSAqIGNhbnZhcy53aWR0aCAvIDIpO1xuICAgIHZlY3Rvci55ID0gTWF0aC5yb3VuZCgoLXZlY3Rvci55ICsgMSkgKiBjYW52YXMuaGVpZ2h0IC8gMik7XG5cbiAgICB0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gJyNmZmZmZmYnO1xuICAgIHRoaXMuY29udGV4dC5maWxsUmVjdCh2ZWN0b3IueCwgdmVjdG9yLnksIDEsIDEpO1xuICB9XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLmNyZWF0ZU5ldyA9IGZ1bmN0aW9uKGluZGV4KSB7XG4gIGluZGV4ID0gaW5kZXggfHwgdGhpcy5wcmVmYWJzLmxlbmd0aDtcblxuICB0aGlzLmJsb2Nrcy5jbGVhcigpO1xuICB2YXIgcHJlZmFiID0gdGhpcy5ibG9ja3Muc2VyaWFsaXplKCk7XG4gIHRoaXMucHJlZmFicy5zcGxpY2UoaW5kZXgsIDAsIHByZWZhYik7XG4gIHRoaXMudXBkYXRlU2NyZWVuc2hvdEF0SW5kZXgoaW5kZXgpO1xuICB0aGlzLnByZWZhYkluZGV4ID0gaW5kZXg7XG4gIHRoaXMucHJlZmFic0Jhci5oaWdobGlnaHQoaW5kZXgpO1xuICB0aGlzLnVwZGF0ZVByb3BlcnR5UGFuZWwoKTtcbiAgdGhpcy51cGRhdGVMYXN0QmxvY2tzKCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnJlbW92ZVNlbGVjdGVkID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucHJlZmFicy5zcGxpY2UodGhpcy5wcmVmYWJJbmRleCwgMSk7XG5cbiAgaWYgKHRoaXMucHJlZmFicy5sZW5ndGggPT09IDApIHtcbiAgICB0aGlzLmJsb2Nrcy5jbGVhcigpO1xuICAgIHRoaXMucHJlZmFicy5wdXNoKHRoaXMuYmxvY2tzLnNlcmlhbGl6ZSgpKTtcbiAgICB0aGlzLnVwZGF0ZVByb3BlcnR5UGFuZWwoKTtcbiAgfVxuXG4gIGlmICh0aGlzLnByZWZhYkluZGV4ID4gdGhpcy5wcmVmYWJzLmxlbmd0aCAtIDEpIHtcbiAgICB0aGlzLnByZWZhYkluZGV4ID0gdGhpcy5wcmVmYWJzLmxlbmd0aCAtIDE7XG4gICAgdGhpcy5wcmVmYWJzQmFyLmhpZ2hsaWdodCh0aGlzLnByZWZhYkluZGV4KTtcbiAgICB0aGlzLmJsb2Nrcy5kZXNlcmlhbGl6ZSh0aGlzLnByZWZhYnNbdGhpcy5wcmVmYWJJbmRleF0pO1xuICAgIHRoaXMudXBkYXRlUHJvcGVydHlQYW5lbCgpO1xuICB9XG5cbiAgdGhpcy51cGRhdGVTY3JlZW5zaG90cygpO1xuICB0aGlzLnVwZGF0ZUxhc3RCbG9ja3MoKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUuY3JlYXRlQ2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHByZWZhYiA9IHRoaXMuYmxvY2tzLnNlcmlhbGl6ZSgpO1xuICB0aGlzLmNyZWF0ZU5ldyh0aGlzLnByZWZhYkluZGV4ICsgMSk7XG4gIHRoaXMuYmxvY2tzLmRlc2VyaWFsaXplKHByZWZhYik7XG4gIHRoaXMudXBkYXRlQ3VycmVudFByZWZhYigpO1xuXG4gIHRoaXMudXBkYXRlU2NyZWVuc2hvdHMoKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUuc2NyZWVuc2hvdCA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgaWYgKHRoaXMuc2NyZWVuc2hvdFJlbmRlcmVyID09IG51bGwpIHtcbiAgICB0aGlzLnNjcmVlbnNob3RSZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKHtcbiAgICAgIGFscGhhOiB0cnVlXG4gICAgfSk7XG4gICAgdGhpcy5zY3JlZW5zaG90UmVuZGVyZXIuc2V0Q2xlYXJDb2xvcigweGZmZmZmZiwgMC4wKTtcbiAgfVxuXG4gIHZhciByZW5kZXJlciA9IHRoaXMuc2NyZWVuc2hvdFJlbmRlcmVyO1xuXG4gIHZhciB3aWR0aCA9IDEwMDtcbiAgdmFyIGhlaWdodCA9IDEwMDtcbiAgcmVuZGVyZXIuc2V0U2l6ZSh3aWR0aCwgaGVpZ2h0KTtcblxuICB2YXIgb2JqZWN0ID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gIHZhciBibG9ja3MgPSBuZXcgQmxvY2tzKG9iamVjdCk7XG4gIGJsb2Nrcy5kZXNlcmlhbGl6ZShkYXRhKTtcbiAgYmxvY2tzLnRpY2soKTtcblxuICB2YXIgZGltID0gYmxvY2tzLmRpbTtcblxuICBibG9ja3Mub2JqLnBvc2l0aW9uLnNldCgtZGltWzBdIC8gMiwgLWRpbVsxXSAvIDIsIC1kaW1bMl0gLyAyKTtcblxuICB2YXIgb2JqZWN0Q2xvbmUgPSBvYmplY3QuY2xvbmUoKTtcbiAgdmFyIHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XG4gIHNjZW5lLmFkZChvYmplY3RDbG9uZSk7XG5cbiAgdmFyIGFtYmllbnQgPSBuZXcgVEhSRUUuQW1iaWVudExpZ2h0KG5ldyBUSFJFRS5Db2xvcihcInJnYig2MCUsIDYwJSwgNjAlKVwiKSk7XG4gIHZhciBsaWdodCA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KDB4ZmZmZmZmLCAwLjYpO1xuICBsaWdodC5wb3NpdGlvbi5zZXQoMC44LCAxLCAwLjUpO1xuICBzY2VuZS5hZGQobGlnaHQpO1xuICBzY2VuZS5hZGQoYW1iaWVudCk7XG5cbiAgdmFyIG1heFNpemUgPSBNYXRoLm1heChkaW1bMF0sIGRpbVsxXSwgZGltWzJdKSAqIDI7XG5cbiAgdmFyIGNhbWVyYSA9IG5ldyBUSFJFRS5PcnRob2dyYXBoaWNDYW1lcmEobWF4U2l6ZSAvIC0yLCBtYXhTaXplIC8gMiwgbWF4U2l6ZSAvIDIsIG1heFNpemUgLyAtMiwgMC4xLCAxMDAwKTtcbiAgY2FtZXJhLnBvc2l0aW9uLnNldCgwLCAwLCAxMCk7XG5cbiAgdmFyIGNhbWVyYVBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgbWF4U2l6ZSlcbiAgICAuYXBwbHlFdWxlcihuZXcgVEhSRUUuRXVsZXIoLU1hdGguUEkgLyA0LCAwLCAwLCAnWVhaJykpXG4gIGNhbWVyYS5wb3NpdGlvbi5jb3B5KGNhbWVyYVBvc2l0aW9uKTtcbiAgY2FtZXJhLmxvb2tBdChuZXcgVEhSRUUuVmVjdG9yMygpKTtcblxuICByZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7XG4gIGltZ0RhdGEgPSByZW5kZXJlci5kb21FbGVtZW50LnRvRGF0YVVSTCgpO1xuXG4gIHJlbmRlcmVyLmRpc3Bvc2UoKTtcblxuICByZXR1cm4gaW1nRGF0YTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUudXBkYXRlUHJvcGVydHlQYW5lbCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcHJlZmFiID0gdGhpcy5nZXRTZWxlY3RlZFByZWZhYigpO1xuXG4gIHRoaXMucHJvcGVydHlQYW5lbC5jb250cm9sbGVyc1snbmFtZSddLnNldFZhbHVlKHByZWZhYi51c2VyRGF0YS5uYW1lIHx8ICd1bm5hbWVkJyk7XG5cbiAgdmFyIGRpbSA9IHByZWZhYi5kaW07XG4gIHZhciBmb3JtYXR0ZWRTaXplID0gZGltLmpvaW4oJyAnKTtcbiAgdGhpcy5wcm9wZXJ0eVBhbmVsLmNvbnRyb2xsZXJzWydzaXplJ10uc2V0VmFsdWUoZm9ybWF0dGVkU2l6ZSk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnNhdmUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHNhdmUgPSB7XG4gICAgdmVyc2lvbjogVkVSU0lPTixcbiAgICBwcmVmYWJzOiB0aGlzLnByZWZhYnMsXG4gICAgc2VsZWN0ZWRDb2xvcjogdGhpcy5zZWxlY3RlZENvbG9yXG4gIH07XG5cbiAgdGhpcy5jYWNoZS5zZXQoS0VZX1NBVkUsIHNhdmUpO1xuXG4gIHJldHVybiBzYXZlO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS51cGRhdGVMYXN0QmxvY2tzID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuYmxvY2tzLnVwZGF0ZU1lc2goKTtcbiAgdGhpcy5sYXN0QmxvY2tzID0gdGhpcy5ibG9ja3Mub2JqLmNsb25lKCk7XG4gIHRoaXMubGFzdEJsb2Nrcy51cGRhdGVNYXRyaXhXb3JsZCgpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5nZXRDb29yZEFib3ZlID0gZnVuY3Rpb24ocG9pbnQpIHtcbiAgcG9pbnQgPSBwb2ludCB8fCB0aGlzLmlucHV0Lm1vdXNlO1xuICB2YXIgb2JqZWN0cyA9IFtdO1xuICBpZiAodGhpcy5sYXN0QmxvY2tzICE9IG51bGwpIG9iamVjdHMucHVzaCh0aGlzLmxhc3RCbG9ja3MpO1xuICBpZiAodGhpcy5vYmpHcm91bmQgIT0gbnVsbCkgb2JqZWN0cy5wdXNoKHRoaXMub2JqR3JvdW5kKTtcbiAgcmV0dXJuIHRoaXMuZ2V0Q29vcmQob2JqZWN0cywgcG9pbnQsIC10aGlzLnNuKTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUuZ2V0Q29vcmRCZWxvdyA9IGZ1bmN0aW9uKHBvaW50KSB7XG4gIHBvaW50ID0gcG9pbnQgfHwgdGhpcy5pbnB1dC5tb3VzZTtcbiAgdmFyIG9iamVjdHMgPSBbXTtcbiAgaWYgKHRoaXMubGFzdEJsb2NrcyAhPSBudWxsKSBvYmplY3RzLnB1c2godGhpcy5sYXN0QmxvY2tzKTtcbiAgdmFyIGNvb3JkID0gdGhpcy5nZXRDb29yZChvYmplY3RzLCBwb2ludCwgdGhpcy5zbik7XG5cbiAgaWYgKGNvb3JkID09IG51bGwgJiYgdGhpcy5vYmpHcm91bmQgIT0gbnVsbCkge1xuICAgIHJldHVybiB0aGlzLmdldENvb3JkKFt0aGlzLm9iakdyb3VuZF0sIHBvaW50LCAtdGhpcy5zbik7XG4gIH1cblxuICByZXR1cm4gY29vcmQ7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLmdldENvb3JkID0gZnVuY3Rpb24ob2JqZWN0cywgYXRQb2ludCwgZGVsdGEpIHtcbiAgdmFyIHZpZXdwb3J0ID0gdGhpcy5pbnB1dC5zY3JlZW5Ub1ZpZXdwb3J0KGF0UG9pbnQpO1xuICB2YXIgcmF5Y2FzdGVyID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xuICByYXljYXN0ZXIuc2V0RnJvbUNhbWVyYSh2aWV3cG9ydCwgdGhpcy5jYW1lcmEpO1xuICB2YXIgaW50ZXJzZWN0cyA9IHJheWNhc3Rlci5pbnRlcnNlY3RPYmplY3RzKG9iamVjdHMsIHRydWUpO1xuXG4gIGlmIChpbnRlcnNlY3RzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICB2YXIgaW50ZXJzZWN0ID0gaW50ZXJzZWN0c1swXTtcblxuICB2YXIgcG9pbnQgPSBpbnRlcnNlY3QucG9pbnQ7XG4gIHZhciBkaWZmID0gcG9pbnQuY2xvbmUoKS5zdWIodGhpcy5jYW1lcmEucG9zaXRpb24pO1xuICBkaWZmID0gZGlmZi5zZXRMZW5ndGgoZGlmZi5sZW5ndGgoKSArIChkZWx0YSB8fCAwKSk7XG4gIHBvaW50ID0gdGhpcy5jYW1lcmEucG9zaXRpb24uY2xvbmUoKS5hZGQoZGlmZik7XG5cbiAgdmFyIGxvY2FsUG9pbnQgPSB0aGlzLmJsb2Nrcy5vYmoud29ybGRUb0xvY2FsKHBvaW50KTtcbiAgdmFyIGNvb3JkID0gdGhpcy5ibG9ja3MucG9pbnRUb0Nvb3JkKGxvY2FsUG9pbnQpO1xuICBjb29yZCA9IG5ldyBUSFJFRS5WZWN0b3IzKFxuICAgIE1hdGgucm91bmQoY29vcmQueCksXG4gICAgTWF0aC5yb3VuZChjb29yZC55KSxcbiAgICBNYXRoLnJvdW5kKGNvb3JkLnopXG4gICk7XG5cbiAgcmV0dXJuIGNvb3JkO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS51cGRhdGVIaWdobGlnaHQgPSBmdW5jdGlvbihjb29yZCkge1xuICBpZiAodGhpcy5vYmpIaWdobGlnaHQgPT0gbnVsbCkge1xuICAgIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5Cb3hHZW9tZXRyeSgxLCAxLCAxKTtcbiAgICB2YXIgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoKTtcbiAgICB2YXIgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKGdlb21ldHJ5LCBtYXRlcmlhbCk7XG4gICAgdmFyIHdpcmVmcmFtZSA9IG5ldyBUSFJFRS5FZGdlc0hlbHBlcihtZXNoLCAweGZmZmZmZik7XG4gICAgdGhpcy5vYmpIaWdobGlnaHQgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcbiAgICB0aGlzLm9iakhpZ2hsaWdodC5hZGQod2lyZWZyYW1lKTtcbiAgICB0aGlzLm9iamVjdC5hZGQodGhpcy5vYmpIaWdobGlnaHQpO1xuICB9XG5cbiAgaWYgKGNvb3JkID09IG51bGwpIHtcbiAgICB0aGlzLm9iakhpZ2hsaWdodC52aXNpYmxlID0gZmFsc2U7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29vcmQgPSBjb29yZC5jbG9uZSgpLmFkZChuZXcgVEhSRUUuVmVjdG9yMygwLjUsIDAuNSwgMC41KSk7XG4gIHRoaXMub2JqSGlnaGxpZ2h0LnZpc2libGUgPSB0cnVlO1xuICB2YXIgbG9jYWxQb2ludCA9IHRoaXMuYmxvY2tzLmNvb3JkVG9Qb2ludChjb29yZCk7XG4gIHZhciB3b3JsZFBvaW50ID0gdGhpcy5ibG9ja3Mub2JqLmxvY2FsVG9Xb3JsZChsb2NhbFBvaW50KTtcbiAgdGhpcy5vYmpIaWdobGlnaHQucG9zaXRpb24uY29weSh3b3JsZFBvaW50KTtcbn07XG5cbkVkaXRvci5wcm90b3R5cGUuc2V0U2VsZWN0ZWRDb2xvciA9IGZ1bmN0aW9uKGNvbG9yKSB7XG4gIHZhciBpbmRleCA9IGFycmF5VXRpbHMuaW5kZXhPZih0aGlzLnBhbGV0dGUsIGZ1bmN0aW9uKGMpIHtcbiAgICByZXR1cm4gY29sb3IgPT09IGMgfHwgKGNvbG9yID09IG51bGwgJiYgYy5pc0NsZWFyQ29sb3IpO1xuICB9KTtcblxuICBpZiAoaW5kZXggPT0gLTEpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLnNlbGVjdGVkQ29sb3IgPSBjb2xvcjtcbiAgdGhpcy5jb2xvckJhci5oaWdobGlnaHQoaW5kZXgpO1xufTtcblxuRWRpdG9yLnByb3RvdHlwZS5hcHBseU9mZnNldCA9IGZ1bmN0aW9uKG9mZnNldCkge1xuICB2YXIgc2VsZWN0ZWRDb29yZHM7XG4gIGlmICh0aGlzLnNlbGVjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgIHNlbGVjdGVkQ29vcmRzID0gdGhpcy5zZWxlY3Rpb25zO1xuICB9IGVsc2Uge1xuICAgIHNlbGVjdGVkQ29vcmRzID0gdGhpcy5ibG9ja3MuZ2V0QWxsQ29vcmRzKCk7XG4gIH1cblxuICB0aGlzLnJ1bkNvbW1hbmQobmV3IE9mZnNldENvbW1hbmQodGhpcywgdGhpcy5ibG9ja3MsIHNlbGVjdGVkQ29vcmRzLCBvZmZzZXQpKTtcbiAgdGhpcy51cGRhdGVMYXN0QmxvY2tzKCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLmRvd25sb2FkSlNPTiA9IGZ1bmN0aW9uKCkge1xuICB2YXIganNvbiA9IHRoaXMuc2F2ZSgpO1xuXG4gIHZhciBuYW1lID0gdGhpcy5nZXRTZWxlY3RlZFByZWZhYigpLnVzZXJEYXRhLm5hbWU7XG5cbiAgdmFyIGRhdGFTdHIgPSBcImRhdGE6dGV4dC9qc29uO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoanNvbikpO1xuICBpZiAodGhpcy5kb3dubG9hZEVsZW1lbnQgPT0gbnVsbCkge1xuICAgIHRoaXMuZG93bmxvYWRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgIHRoaXMuZG93bmxvYWRFbGVtZW50LnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZG93bmxvYWRFbGVtZW50KTtcbiAgfVxuICB0aGlzLmRvd25sb2FkRWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIGRhdGFTdHIpO1xuICB0aGlzLmRvd25sb2FkRWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJkb3dubG9hZFwiLCBuYW1lICsgJy5qc29uJyk7XG4gIHRoaXMuZG93bmxvYWRFbGVtZW50LmNsaWNrKCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLmdldFNlbGVjdGVkUHJlZmFiID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnByZWZhYnNbdGhpcy5wcmVmYWJJbmRleF07XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnVwZGF0ZUN1cnJlbnRQcmVmYWIgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wcmVmYWJzW3RoaXMucHJlZmFiSW5kZXhdID0gdGhpcy5ibG9ja3Muc2VyaWFsaXplKCk7XG59O1xuXG5FZGl0b3IucHJvdG90eXBlLnNldExhc3RUb29sID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuc2V0VG9vbCh0aGlzLmxhc3RUb29sKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yOyIsInZhciBFZGl0b3IgPSByZXF1aXJlKCcuL2VkaXRvcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVkaXRvciwgZGV2Q29uc29sZSkge1xuXG4gIGRldkNvbnNvbGUuY29tbWFuZHNbJ3NpemUnXSA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICB2YXIgZGVmYXVsdFNpemUgPSBlZGl0b3IuY29uZmlnWydlZGl0b3JfZGVmYXVsdF9zaXplJ107XG4gICAgdmFyIHggPSBhcmdzLl9bMF0gfHwgZGVmYXVsdFNpemVbMF07XG4gICAgdmFyIHkgPSBhcmdzLl9bMV0gfHwgYXJncy5fWzBdIHx8IGRlZmF1bHRTaXplWzFdO1xuICAgIHZhciB6ID0gYXJncy5fWzJdIHx8IGFyZ3MuX1swXSB8fCBkZWZhdWx0U2l6ZVsyXTtcblxuICAgIGVkaXRvci51cGRhdGVTaXplKFt4LCB5LCB6XSk7XG4gIH07XG5cbiAgZGV2Q29uc29sZS5jb21tYW5kc1snb2Zmc2V0J10gPSBmdW5jdGlvbihhcmdzKSB7XG4gICAgdmFyIHggPSBhcmdzLl9bMF0gfHwgMDtcbiAgICB2YXIgeSA9IGFyZ3MuX1sxXSB8fCAwO1xuICAgIHZhciB6ID0gYXJncy5fWzJdIHx8IDA7XG5cbiAgICBlZGl0b3IuYmxvY2tzLnNldE9mZnNldChuZXcgVEhSRUUuVmVjdG9yMyh4LCB5LCB6KSk7XG4gIH07XG5cbiAgZGV2Q29uc29sZS5jb21tYW5kc1snbmV3J10gPSBmdW5jdGlvbihhcmdzKSB7XG4gICAgZWRpdG9yLmNyZWF0ZU5ldygpO1xuICB9O1xuXG4gIGRldkNvbnNvbGUuY29tbWFuZHNbJ21pcnJvciddID0gZnVuY3Rpb24oYXJncykge1xuICAgIGlmIChhcmdzLl8ubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3BsZWFzZSBzcGVjaWZ5IHggeSB6IG9yIG5vbmUnKTtcbiAgICB9XG5cbiAgICBpZiAoYXJncy5fLmxlbmd0aCA9PT0gMSkge1xuICAgICAgaWYgKGFyZ3MuX1swXSA9PT0gJ25vbmUnKSB7XG4gICAgICAgIGVkaXRvci5yZWZsZWN0WCA9IGVkaXRvci5yZWZsZWN0WSA9IGVkaXRvci5yZWZsZWN0WiA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGVkaXRvci5yZWZsZWN0WCA9IGVkaXRvci5yZWZsZWN0WSA9IGVkaXRvci5yZWZsZWN0WiA9IGZhbHNlO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5fLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgYXJnID0gYXJncy5fW2ldO1xuICAgICAgaWYgKGFyZyA9PT0gJ3gnKSB7XG4gICAgICAgIGVkaXRvci5yZWZsZWN0WCA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGFyZyA9PT0gJ3knKSB7XG4gICAgICAgIGVkaXRvci5yZWZsZWN0WSA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGFyZyA9PT0gJ3onKSB7XG4gICAgICAgIGVkaXRvci5yZWZsZWN0WiA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Vua25vd24gb3B0aW9uOiAnICsgYXJnKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgZGV2Q29uc29sZS5jb21tYW5kc1sncmVzZXQnXSA9IGZ1bmN0aW9uKCkge1xuICAgIGVkaXRvci5yZXNldCgpO1xuICB9O1xuXG4gIGRldkNvbnNvbGUuY29tbWFuZHNbJ3NhdmUnXSA9IGZ1bmN0aW9uKCkge1xuICAgIGVkaXRvci5zYXZlKCk7XG4gIH07XG59IiwidmFyIEVkaXRvclRvb2xzID0ge1xuICBQZW46ICdQZW4nLFxuICBTZWxlY3Q6ICdTZWxlY3QnLFxuICBTYW1wbGU6ICdTYW1wbGUnLFxuICBDYW1lcmE6ICdDYW1lcmEnLFxuICBGaWxsOiAnRmlsbCdcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yVG9vbHM7IiwidmFyIGNwciA9IHJlcXVpcmUoJy4vY3ByJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWRpdG9yKSB7XG4gIHZhciBkYXRhID0gW3tcbiAgICBzcmM6ICcvaW1hZ2VzL2ljb25zL2Fycm93MV9saWdodC5wbmcnLFxuICAgIHNyY0FjdGl2ZTogJy9pbWFnZXMvaWNvbnMvYXJyb3cxX2RhcmsucG5nJyxcbiAgICBpbmRleDogMCxcbiAgICB0b29sdGlwOiAnbW92ZSByaWdodCAoRCknXG4gIH0sIHtcbiAgICBzcmM6ICcvaW1hZ2VzL2ljb25zL2Fycm93Ml9saWdodC5wbmcnLFxuICAgIHNyY0FjdGl2ZTogJy9pbWFnZXMvaWNvbnMvYXJyb3cyX2RhcmsucG5nJyxcbiAgICBpbmRleDogMSxcbiAgICB0b29sdGlwOiAnbW92ZSBsZWZ0IChBKSdcbiAgfSwge1xuICAgIHNyYzogJy9pbWFnZXMvaWNvbnMvYXJyb3czX2xpZ2h0LnBuZycsXG4gICAgc3JjQWN0aXZlOiAnL2ltYWdlcy9pY29ucy9hcnJvdzNfZGFyay5wbmcnLFxuICAgIGluZGV4OiAyLFxuICAgIHRvb2x0aXA6ICdtb3ZlIGZyb250IChXKSdcbiAgfSwge1xuICAgIHNyYzogJy9pbWFnZXMvaWNvbnMvYXJyb3c0X2xpZ2h0LnBuZycsXG4gICAgc3JjQWN0aXZlOiAnL2ltYWdlcy9pY29ucy9hcnJvdzRfZGFyay5wbmcnLFxuICAgIGluZGV4OiAzLFxuICAgIHRvb2x0aXA6ICdtb3ZlIGJhY2sgKFMpJ1xuICB9LCB7XG4gICAgc3JjOiAnL2ltYWdlcy9pY29ucy9hcnJvdzVfbGlnaHQucG5nJyxcbiAgICBzcmNBY3RpdmU6ICcvaW1hZ2VzL2ljb25zL2Fycm93NV9kYXJrLnBuZycsXG4gICAgaW5kZXg6IDQsXG4gICAgdG9vbHRpcDogJ21vdmUgdXAgKFIpJ1xuICB9LCB7XG4gICAgc3JjOiAnL2ltYWdlcy9pY29ucy9hcnJvdzZfbGlnaHQucG5nJyxcbiAgICBzcmNBY3RpdmU6ICcvaW1hZ2VzL2ljb25zL2Fycm93Nl9kYXJrLnBuZycsXG4gICAgaW5kZXg6IDUsXG4gICAgdG9vbHRpcDogJ21vdmUgZG93biAoRiknXG4gIH1dO1xuXG4gIHZhciBiYXIgPSBjcHIoe1xuICAgIGRhdGE6IGRhdGEsXG4gICAgYmxvY2tXaWR0aDogMzIsXG4gICAgYmxvY2tIZWlnaHQ6IDMyLFxuICAgIGhpZGVIaWdobGlnaHQ6IHRydWUsXG4gICAgY3VzdG9tUGxhY2VtZW50OiB0cnVlLFxuICAgIHNob3dUb29sdGlwOiB0cnVlLFxuICAgIG9uUGljazogZnVuY3Rpb24ob2JqKSB7XG4gICAgICB2YXIgaW5kZXggPSBvYmouaW5kZXg7XG5cbiAgICAgIHZhciBvZmZzZXQgPSBudWxsO1xuICAgICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICAgIG9mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKDEsIDAsIDApO1xuICAgICAgfSBlbHNlIGlmIChpbmRleCA9PT0gMSkge1xuICAgICAgICBvZmZzZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygtMSwgMCwgMCk7XG4gICAgICB9IGVsc2UgaWYgKGluZGV4ID09PSAyKSB7XG4gICAgICAgIG9mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKTtcbiAgICAgIH0gZWxzZSBpZiAoaW5kZXggPT09IDMpIHtcbiAgICAgICAgb2Zmc2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMSk7XG4gICAgICB9IGVsc2UgaWYgKGluZGV4ID09PSA0KSB7XG4gICAgICAgIG9mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDEsIDApO1xuICAgICAgfSBlbHNlIGlmIChpbmRleCA9PT0gNSkge1xuICAgICAgICBvZmZzZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAtMSwgMCk7XG4gICAgICB9XG5cbiAgICAgIGVkaXRvci5hcHBseU9mZnNldChvZmZzZXQpO1xuICAgIH0sXG4gICAgaXNCdXR0b246IHRydWVcbiAgfSk7XG5cbiAgdmFyIGd1aSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdndWknKTtcbiAgZ3VpLmFwcGVuZENoaWxkKGJhci5kb21FbGVtZW50KTtcblxuICBiYXIuZG9tRWxlbWVudC5jbGFzc0xpc3QuYWRkKCd0b29sYmFyJyk7XG4gIGJhci5kb21FbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgYmFyLmRvbUVsZW1lbnQuc3R5bGUudG9wID0gJzcwcHgnO1xuICBiYXIuZG9tRWxlbWVudC5zdHlsZS5sZWZ0ID0gJzIwcHgnO1xufTsiLCJ2YXIgY3ByID0gcmVxdWlyZSgnLi9jcHInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlZGl0b3IpIHtcbiAgdmFyIGJhciA9IGNwcih7XG4gICAgZGF0YTogZWRpdG9yLnBhbGV0dGUsXG4gICAgb25QaWNrOiBmdW5jdGlvbihjb2xvcikge1xuICAgICAgZWRpdG9yLnNlbGVjdGVkQ29sb3IgPSBjb2xvci5pc0NsZWFyQ29sb3IgPyBudWxsIDogY29sb3I7XG4gICAgICBlZGl0b3Iuc2F2ZSgpO1xuICAgIH0sXG4gICAgY3VzdG9tUGxhY2VtZW50OiB0cnVlXG4gIH0pO1xuXG4gIHZhciBndWkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ3VpJyk7XG4gIGd1aS5hcHBlbmRDaGlsZChiYXIuZG9tRWxlbWVudCk7XG5cbiAgYmFyLmRvbUVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICBiYXIuZG9tRWxlbWVudC5zdHlsZS5sZWZ0ID0gJzIwcHgnO1xuICBiYXIuZG9tRWxlbWVudC5zdHlsZS5ib3R0b20gPSAnMjBweCc7XG5cbiAgcmV0dXJuIGJhcjtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRzKSB7XG4gIG9wdHMgPSBvcHRzIHx8IHt9O1xuICB2YXIgZGF0YVRvTG9hZCA9IG9wdHMuZGF0YSB8fCBbXTtcbiAgdmFyIG9uUGljayA9IG9wdHMub25QaWNrIHx8IGZ1bmN0aW9uKCkge307XG4gIHZhciBvbkhvdmVyID0gb3B0cy5vbkhvdmVyIHx8IGZ1bmN0aW9uKCkge307XG4gIHZhciBvbkxlYXZlID0gb3B0cy5vbkxlYXZlIHx8IGZ1bmN0aW9uKCkge307XG4gIHZhciBjdXN0b21QbGFjZW1lbnQgPSBvcHRzLmN1c3RvbVBsYWNlbWVudCB8fCBmYWxzZTtcbiAgdmFyIHNob3dUb29sdGlwID0gb3B0cy5zaG93VG9vbHRpcCB8fCBmYWxzZTtcbiAgdmFyIHBhZGRpbmdSaWdodCA9IG9wdHMucGFkZGluZ1JpZ2h0IHx8IDA7XG4gIHZhciBibG9ja1dpZHRoID0gb3B0cy5ibG9ja1dpZHRoIHx8IDIwO1xuICB2YXIgYmxvY2tIZWlnaHQgPSBvcHRzLmJsb2NrSGVpZ2h0IHx8IDIwO1xuICB2YXIgY29sdW1ucyA9IG9wdHMuY29sdW1ucyB8fCAxNDtcbiAgdmFyIGlzQnV0dG9uID0gb3B0cy5pc0J1dHRvbiB8fCBmYWxzZTtcbiAgdmFyIHNraW5CbG9jayA9IG9wdHMuc2tpbkJsb2NrIHx8IGZ1bmN0aW9uKCkge307XG4gIHZhciBzdGlja3lTZWxlY3Rpb24gPSBvcHRzLnN0aWNreVNlbGVjdGlvbiB8fCBmYWxzZTtcblxuICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGNvbnRhaW5lci5jbGFzc05hbWUgPSAnY3ByJztcblxuICB2YXIgbW91c2Vkb3duTGlzdGVuZXJzID0gW107XG4gIHZhciBtb3VzZXVwTGlzdGVuZXJzID0gW107XG4gIHZhciBibG9ja3MgPSBbXTtcbiAgdmFyIGRhdGEgPSBbXTtcbiAgdmFyIGhpZ2hsaWdodERpdiA9IG51bGw7XG4gIHZhciBzZWxlY3RlZEluZGV4ID0gLTE7XG5cbiAgaWYgKHNob3dUb29sdGlwKSB7XG4gICAgdmFyIHRvb2x0aXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0b29sdGlwLmNsYXNzTmFtZSA9ICd0b29sdGlwJztcblxuICAgIHRvb2x0aXAuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIHRvb2x0aXAuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0b29sdGlwKTtcbiAgfVxuXG4gIGlmICghY3VzdG9tUGxhY2VtZW50KSB7XG4gICAgY29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBjb250YWluZXIuc3R5bGUubGVmdCA9ICcyMHB4JztcbiAgICBjb250YWluZXIuc3R5bGUuYm90dG9tID0gJzIwcHgnO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgfVxuXG4gIGNvbnRhaW5lci5vbmZvY3VzID0gZnVuY3Rpb24oKSB7XG4gICAgY29udGFpbmVyLnN0eWxlWydvdXRsaW5lJ10gPSAnbm9uZSc7XG4gIH07XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhVG9Mb2FkLmxlbmd0aDsgaSsrKSB7XG4gICAgYWRkKGRhdGFUb0xvYWRbaV0pO1xuICB9XG5cbiAgdXBkYXRlQ29udGFpbmVyKCk7XG5cbiAgZnVuY3Rpb24gZ2V0Um93KGluZGV4KSB7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IoaW5kZXggLyBjb2x1bW5zKTtcbiAgfTtcblxuICBmdW5jdGlvbiBnZXRDb2x1bW4oaW5kZXgpIHtcbiAgICByZXR1cm4gaW5kZXggJSBjb2x1bW5zO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGdldFJvd3MoKSB7XG4gICAgcmV0dXJuIE1hdGguY2VpbChkYXRhLmxlbmd0aCAvIGNvbHVtbnMpO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGdldEluZGV4KHJvdywgY29sdW1uKSB7XG4gICAgcmV0dXJuIHJvdyAqIGNvbHVtbnMgKyBjb2x1bW47XG4gIH07XG5cbiAgZnVuY3Rpb24gcmVtb3ZlKGluZGV4KSB7XG4gICAgY29udGFpbmVyLnJlbW92ZUNoaWxkKGJsb2Nrc1tpbmRleF0pO1xuICAgIGJsb2Nrc1tpbmRleF0ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgbW91c2Vkb3duTGlzdGVuZXJzW2luZGV4XSk7XG4gICAgYmxvY2tzW2luZGV4XS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgbW91c2V1cExpc3RlbmVyc1tpbmRleF0pO1xuXG4gICAgbW91c2Vkb3duTGlzdGVuZXJzW2luZGV4XSA9IHVuZGVmaW5lZDtcbiAgICBtb3VzZXVwTGlzdGVuZXJzW2luZGV4XSA9IHVuZGVmaW5lZDtcbiAgICBibG9ja3NbaW5kZXhdID0gdW5kZWZpbmVkO1xuICAgIGRhdGFbaW5kZXhdID0gdW5kZWZpbmVkO1xuICB9O1xuXG4gIGZ1bmN0aW9uIHNldChpbmRleCwgb2JqKSB7XG4gICAgaWYgKGRhdGFbaW5kZXhdICE9IG51bGwpIHtcbiAgICAgIHJlbW92ZShpbmRleCk7XG4gICAgfTtcblxuICAgIHZhciByb3cgPSBnZXRSb3coaW5kZXgpO1xuICAgIHZhciBjb2x1bW4gPSBnZXRDb2x1bW4oaW5kZXgpO1xuXG4gICAgdmFyIGVsZW1lbnQ7XG4gICAgaWYgKG9iai5pbWdEYXRhICE9IG51bGwpIHtcbiAgICAgIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcbiAgICAgIGVsZW1lbnQuc3JjID0gb2JqLmltZ0RhdGE7XG4gICAgfSBlbHNlIGlmIChvYmouc3JjICE9IG51bGwpIHtcbiAgICAgIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcbiAgICAgIGVsZW1lbnQuc3JjID0gb2JqLnNyYztcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGNvbG9yID0gb2JqO1xuICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgZWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvcjtcbiAgICB9XG5cbiAgICBlbGVtZW50LmNsYXNzTmFtZSA9ICdibG9jayBib3gtc2l6aW5nJztcbiAgICBpZiAoaXNCdXR0b24pIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnYnV0dG9uJyk7XG4gICAgfVxuXG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgIHBvc2l0aW9uKGVsZW1lbnQsIHJvdywgY29sdW1uKTtcblxuICAgIGJsb2Nrc1tpbmRleF0gPSBlbGVtZW50O1xuICAgIGRhdGFbaW5kZXhdID0gb2JqO1xuXG4gICAgdXBkYXRlQ29udGFpbmVyKCk7XG5cbiAgICBza2luQmxvY2soZWxlbWVudCk7XG5cbiAgICB2YXIgb25Nb3VzZURvd24gPSBmdW5jdGlvbihlKSB7XG4gICAgICBoaWdobGlnaHQoaW5kZXgsIHRydWUpO1xuICAgICAgb25QaWNrKG9iaiwgaW5kZXgpO1xuICAgIH07XG5cbiAgICB2YXIgb25Nb3VzZVVwID0gZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKGlzQnV0dG9uICYmICFzdGlja3lTZWxlY3Rpb24pIHtcbiAgICAgICAgaGlnaGxpZ2h0KGluZGV4LCBmYWxzZSk7XG4gICAgICB9IFxuICAgIH07XG5cbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIG9uTW91c2VEb3duKTtcblxuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIG9uTW91c2VVcCk7XG5cbiAgICBtb3VzZWRvd25MaXN0ZW5lcnNbaW5kZXhdID0gb25Nb3VzZURvd247XG4gICAgbW91c2V1cExpc3RlbmVyc1tpbmRleF0gPSBvbk1vdXNlVXA7XG4gIH07XG5cbiAgZnVuY3Rpb24gYWRkKG9iaikge1xuICAgIHZhciBpbmRleCA9IGJsb2Nrcy5sZW5ndGg7XG4gICAgc2V0KGluZGV4LCBvYmopO1xuICB9O1xuXG4gIGZ1bmN0aW9uIHBvc2l0aW9uKGVsZW1lbnQsIHJvdywgY29sdW1uKSB7XG4gICAgZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgZWxlbWVudC5zdHlsZS5sZWZ0ID0gY29sdW1uICogKGJsb2NrV2lkdGggKyBwYWRkaW5nUmlnaHQpICsgJ3B4JztcbiAgICBlbGVtZW50LnN0eWxlLnRvcCA9IHJvdyAqIGJsb2NrSGVpZ2h0ICsgJ3B4JztcbiAgICBlbGVtZW50LnN0eWxlLndpZHRoID0gYmxvY2tXaWR0aCArICdweCc7XG4gICAgZWxlbWVudC5zdHlsZS5oZWlnaHQgPSBibG9ja0hlaWdodCArICdweCc7XG4gIH07XG5cbiAgZnVuY3Rpb24gdXBkYXRlQ29udGFpbmVyKCkge1xuICAgIHZhciBudW1iZXJPZkNvbHVtbnMgPSBkYXRhLmxlbmd0aCA+IGNvbHVtbnMgPyBjb2x1bW5zIDogZGF0YS5sZW5ndGg7XG4gICAgY29udGFpbmVyLnN0eWxlLndpZHRoID0gbnVtYmVyT2ZDb2x1bW5zICogKGJsb2NrV2lkdGggKyBwYWRkaW5nUmlnaHQpICsgJ3B4JztcbiAgICBjb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gZ2V0Um93cygpICogYmxvY2tIZWlnaHQgKyAncHgnO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodChpbmRleCwgdmFsdWUpIHtcbiAgICB2YWx1ZSA9IHZhbHVlID09PSB1bmRlZmluZWQgPyB0cnVlIDogdmFsdWU7XG5cbiAgICB2YXIgZWxlbWVudCA9IGJsb2Nrc1tpbmRleF07XG5cbiAgICBpZiAoZWxlbWVudCA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIG9iaiA9IGRhdGFbaW5kZXhdO1xuXG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICBpZiAoaXNCdXR0b24pIHtcbiAgICAgICAgLy8gdW4gaGlnaGxpZ2h0IGxhc3QgZWxlbWVudCBpZiBzdGlja3kgc2VsZWN0aW9uXG4gICAgICAgIGlmIChzdGlja3lTZWxlY3Rpb24gJiYgc2VsZWN0ZWRJbmRleCAhPSBpbmRleCkge1xuICAgICAgICAgIGhpZ2hsaWdodChzZWxlY3RlZEluZGV4LCBmYWxzZSk7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoJ3NlbGVjdGVkJyk7XG4gICAgICAgIGlmIChvYmouc3JjQWN0aXZlICE9IG51bGwpIGVsZW1lbnQuc3JjID0gb2JqLnNyY0FjdGl2ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciByb3cgPSBnZXRSb3coaW5kZXgpO1xuICAgICAgICB2YXIgY29sdW1uID0gZ2V0Q29sdW1uKGluZGV4KTtcbiAgICAgICAgaWYgKGhpZ2hsaWdodERpdiA9PSBudWxsKSB7XG4gICAgICAgICAgaGlnaGxpZ2h0RGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgaGlnaGxpZ2h0RGl2LmNsYXNzTmFtZSA9ICdoaWdobGlnaHQnO1xuICAgICAgICAgIGhpZ2hsaWdodERpdi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgICAgaGlnaGxpZ2h0RGl2LnN0eWxlLndpZHRoID0gYmxvY2tXaWR0aCArICdweCc7XG4gICAgICAgICAgaGlnaGxpZ2h0RGl2LnN0eWxlLmhlaWdodCA9IGJsb2NrSGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgICBoaWdobGlnaHREaXYuc3R5bGUuekluZGV4ID0gMTtcbiAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoaGlnaGxpZ2h0RGl2KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhpZ2hsaWdodERpdi5zdHlsZS5sZWZ0ID0gY29sdW1uICogKGJsb2NrV2lkdGggKyBwYWRkaW5nUmlnaHQpIC0gMSArICdweCc7XG4gICAgICAgIGhpZ2hsaWdodERpdi5zdHlsZS50b3AgPSByb3cgKiBibG9ja0hlaWdodCAtIDEgKyAncHgnO1xuICAgICAgfVxuXG4gICAgICBzZWxlY3RlZEluZGV4ID0gaW5kZXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChpc0J1dHRvbikge1xuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjdGVkJyk7XG4gICAgICAgIGVsZW1lbnQuc3JjID0gb2JqLnNyYztcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICByZW1vdmUoaSk7XG4gICAgfVxuXG4gICAgZGF0YSA9IFtdO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGlzRGVzY2VuZGFudChwYXJlbnQsIGNoaWxkKSB7XG4gICAgaWYgKGNoaWxkID09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgbm9kZSA9IGNoaWxkLnBhcmVudE5vZGU7XG4gICAgd2hpbGUgKG5vZGUgIT0gbnVsbCkge1xuICAgICAgaWYgKG5vZGUgPT0gcGFyZW50KSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgdmFyIG1vdXNlID0gbnVsbDtcbiAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGZ1bmN0aW9uKGUpIHtcbiAgICBtb3VzZSA9IGU7XG4gICAgdmFyIG1vdXNlWCA9IGUucGFnZVggLSBjb250YWluZXIub2Zmc2V0TGVmdDtcbiAgICB2YXIgbW91c2VZID0gZS5wYWdlWSAtIGNvbnRhaW5lci5vZmZzZXRUb3A7XG4gICAgdmFyIHJvdyA9IE1hdGguZmxvb3IobW91c2VZIC8gYmxvY2tIZWlnaHQpO1xuICAgIHZhciBjb2x1bW4gPSBNYXRoLmZsb29yKG1vdXNlWCAvIGJsb2NrV2lkdGgpO1xuICAgIHZhciBpbmRleCA9IGdldEluZGV4KHJvdywgY29sdW1uKTtcblxuICAgIGlmIChkYXRhW2luZGV4XSA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIG9iaiA9IGRhdGFbaW5kZXhdO1xuICAgIG9uSG92ZXIob2JqLCBpbmRleCk7XG5cbiAgICBpZiAoc2hvd1Rvb2x0aXAgJiYgb2JqLnRvb2x0aXAgIT0gbnVsbCkge1xuICAgICAgdG9vbHRpcC5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xuICAgICAgdG9vbHRpcC5zdHlsZS5sZWZ0ID0gbW91c2VYICsgMiArICdweCc7XG4gICAgICB0b29sdGlwLnN0eWxlLnRvcCA9IG1vdXNlWSArIDIgKyAncHgnO1xuICAgICAgaWYgKHRvb2x0aXAuaW5uZXJIVE1MICE9PSBvYmoudG9vbHRpcCkge1xuICAgICAgICB0b29sdGlwLmlubmVySFRNTCA9IG9iai50b29sdGlwO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCBmdW5jdGlvbihlKSB7XG4gICAgaWYgKCFpc0Rlc2NlbmRhbnQoY29udGFpbmVyLCBlLnRvRWxlbWVudCkpIHtcbiAgICAgIG9uTGVhdmUoZSk7XG5cbiAgICAgIGlmIChzaG93VG9vbHRpcCkge1xuICAgICAgICB0b29sdGlwLnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiB7XG4gICAgaGlnaGxpZ2h0OiBoaWdobGlnaHQsXG4gICAgYWRkOiBhZGQsXG4gICAgc2V0OiBzZXQsXG4gICAgY2xlYXI6IGNsZWFyLFxuICAgIGRhdGE6IGRhdGEsXG4gICAgZG9tRWxlbWVudDogY29udGFpbmVyLFxuICAgIGdldCBzZWxlY3RlZEluZGV4KCkge1xuICAgICAgcmV0dXJuIHNlbGVjdGVkSW5kZXg7XG4gICAgfSxcbiAgICBnZXQgbW91c2UoKSB7XG4gICAgICByZXR1cm4gbW91c2U7XG4gICAgfSxcbiAgICBnZXQgdG9vbHRpcCgpIHtcbiAgICAgIHJldHVybiB0b29sdGlwO1xuICAgIH1cbiAgfVxufTsiLCJ2YXIgY3ByID0gcmVxdWlyZSgnLi9jcHInKTtcbnZhciBwb3B1cCA9IHJlcXVpcmUoJy4vcG9wdXAnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlZGl0b3IpIHtcbiAgLy8gZG93bmxvYWQucG5nXG4gIHZhciBkYXRhID0gW3tcbiAgICBzcmM6ICcvaW1hZ2VzL2ljb25zL3VuZG9fbGlnaHQucG5nJyxcbiAgICBzcmNBY3RpdmU6ICcvaW1hZ2VzL2ljb25zL3VuZG9fZGFyay5wbmcnLFxuICAgIGJ1dHRvbjogJ3VuZG8nLFxuICAgIHRvb2x0aXA6ICdVbmRvIChjdHJsICsgeiknXG4gIH0sIHtcbiAgICBzcmM6ICcvaW1hZ2VzL2ljb25zL3JlZG9fbGlnaHQucG5nJyxcbiAgICBzcmNBY3RpdmU6ICcvaW1hZ2VzL2ljb25zL3JlZG9fZGFyay5wbmcnLFxuICAgIGJ1dHRvbjogJ3JlZG8nLFxuICAgIHRvb2x0aXA6ICdSZWRvIChzaGlmdCArIGN0cmwgKyB6KSdcbiAgfSwge1xuICAgIHNyYzogJy9pbWFnZXMvaWNvbnMvZG93bmxvYWRfbGlnaHQucG5nJyxcbiAgICBzcmNBY3RpdmU6ICcvaW1hZ2VzL2ljb25zL2Rvd25sb2FkX2RhcmsucG5nJyxcbiAgICBidXR0b246ICdzYXZlJyxcbiAgICB0b29sdGlwOiAnU2F2ZSdcbiAgfV07XG5cbiAgdmFyIGJhciA9IGNwcih7XG4gICAgZGF0YTogZGF0YSxcbiAgICBjdXN0b21QbGFjZW1lbnQ6IHRydWUsXG4gICAgYmxvY2tXaWR0aDogMzIsXG4gICAgYmxvY2tIZWlnaHQ6IDMyLFxuICAgIGhpZGVIaWdobGlnaHQ6IHRydWUsXG4gICAgc2hvd1Rvb2x0aXA6IHRydWUsXG4gICAgb25QaWNrOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHZhciBidXR0b24gPSBvYmouYnV0dG9uO1xuXG4gICAgICBpZiAoYnV0dG9uID09PSAnc2F2ZScpIHtcbiAgICAgICAgZWRpdG9yLmRvd25sb2FkSlNPTigpO1xuICAgICAgfSBlbHNlIGlmIChidXR0b24gPT09ICd1bmRvJykge1xuICAgICAgICBlZGl0b3IudW5kbygpO1xuICAgICAgfSBlbHNlIGlmIChidXR0b24gPT09ICdyZWRvJykge1xuICAgICAgICBlZGl0b3IucmVkbygpO1xuICAgICAgfVxuICAgIH0sXG4gICAgaXNCdXR0b246IHRydWVcbiAgfSk7XG5cbiAgdmFyIGd1aSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdndWknKTtcbiAgZ3VpLmFwcGVuZENoaWxkKGJhci5kb21FbGVtZW50KTtcblxuICBiYXIuZG9tRWxlbWVudC5jbGFzc0xpc3QuYWRkKCd0b29sYmFyJyk7XG5cbiAgYmFyLmRvbUVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICBiYXIuZG9tRWxlbWVudC5zdHlsZS5sZWZ0ID0gMjAgKyAncHgnO1xuICBiYXIuZG9tRWxlbWVudC5zdHlsZS50b3AgPSAxMjAgKyAncHgnO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRhdGEsIG9wdHMpIHtcbiAgdmFyIGN1c3RvbVBsYWNlbWVudCA9IG9wdHMuY3VzdG9tUGxhY2VtZW50IHx8IGZhbHNlO1xuXG4gIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICBjb250YWluZXIuY2xhc3NOYW1lID0gJ3BhbmVsJztcblxuICBpZiAoIWN1c3RvbVBsYWNlbWVudCkge1xuICAgIGNvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgY29udGFpbmVyLnN0eWxlLnJpZ2h0ID0gNDAgKyAncHgnO1xuICAgIGNvbnRhaW5lci5zdHlsZS50b3AgPSAyMCArICdweCc7XG4gICAgY29udGFpbmVyLnN0eWxlLndpZHRoID0gMjAwICsgJ3B4JztcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XG4gIH1cblxuICB2YXIgcGFuZWwgPSB7fTtcbiAgcGFuZWwuY29udHJvbGxlcnMgPSB7fTtcbiAgcGFuZWwuZG9tRWxlbWVudCA9IGNvbnRhaW5lcjtcblxuICB2YXIgY29udHJvbGxlcnMgPSB7XG4gICAgJ2NoZWNrTGlzdCc6IGNoZWNrTGlzdENvbnRyb2xsZXJcbiAgfTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaXRlbSA9IGRhdGFbaV07XG5cbiAgICB2YXIgZmFjdG9yeSA9IGNvbnRyb2xsZXJzW2l0ZW0udHlwZV0gfHwgdmFsdWVDb250cm9sbGVyO1xuICAgIHZhciBjb250cm9sbGVyID0gZmFjdG9yeShpdGVtKTtcbiAgICBwYW5lbC5jb250cm9sbGVyc1tpdGVtLnRpdGxlXSA9IGNvbnRyb2xsZXI7XG5cbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY29udHJvbGxlci5lbGVtZW50KTtcbiAgfVxuXG4gIHJldHVybiBwYW5lbDtcbn07XG5cbnZhciB2YWx1ZUNvbnRyb2xsZXIgPSBmdW5jdGlvbihpdGVtKSB7XG5cbiAgdmFyIG9uQ2hhbmdlID0gaXRlbS5vbkNoYW5nZSB8fCBmdW5jdGlvbigpIHt9O1xuICB2YXIgb25GaW5pc2hFZGl0aW5nID0gaXRlbS5vbkZpbmlzaEVkaXRpbmcgfHwgZnVuY3Rpb24oKSB7fTtcblxuICB2YXIgc2VjdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlY3Rpb24nKTtcbiAgc2VjdGlvbi5jbGFzc05hbWUgPSAnc2VjdGlvbic7XG5cbiAgdmFyIHRpdGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHRpdGxlLmlubmVySFRNTCA9IGl0ZW0udGl0bGU7XG4gIHRpdGxlLmNsYXNzTmFtZSA9ICd0aXRsZSc7XG4gIHNlY3Rpb24uYXBwZW5kQ2hpbGQodGl0bGUpO1xuXG4gIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIGlucHV0LnR5cGUgPSAndGV4dCc7XG4gIGlucHV0LnZhbHVlID0gaXRlbS52YWx1ZTtcbiAgaW5wdXQuY2xhc3NOYW1lID0gJ3RleHQtZmllbGQnO1xuXG4gIHNlY3Rpb24uYXBwZW5kQ2hpbGQoaW5wdXQpO1xuXG4gIHZhciBpbnB1dExpc3RlbmVyID0gZnVuY3Rpb24oKSB7XG4gICAgb25DaGFuZ2UoaW5wdXQudmFsdWUpO1xuICB9O1xuXG4gIHZhciBrZXlkb3duTGlzdGVuZXIgPSBmdW5jdGlvbihlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgIGlucHV0LmJsdXIoKTtcbiAgICB9XG4gIH07XG5cbiAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBpbnB1dExpc3RlbmVyKTtcbiAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGtleWRvd25MaXN0ZW5lcik7XG5cbiAgZnVuY3Rpb24gc2V0VmFsdWUodmFsdWUpIHtcbiAgICBpbnB1dC52YWx1ZSA9IHZhbHVlO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGRpc3Bvc2UoKSB7XG4gICAgaW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBpbnB1dExpc3RlbmVyKTtcbiAgICBpbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywga2V5ZG93bkxpc3RlbmVyKTtcbiAgfTtcblxuICBpbnB1dC5vbmJsdXIgPSBmdW5jdGlvbigpIHtcbiAgICBvbkZpbmlzaEVkaXRpbmcoaW5wdXQudmFsdWUsIGlucHV0KTtcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIGVsZW1lbnQ6IHNlY3Rpb24sXG4gICAgc2V0VmFsdWU6IHNldFZhbHVlLFxuICAgIHNldCBvbkNoYW5nZSh2YWx1ZSkge1xuICAgICAgb25DaGFuZ2UgPSB2YWx1ZTtcbiAgICB9LFxuICAgIGRpc3Bvc2U6IGRpc3Bvc2VcbiAgfVxufTtcblxudmFyIGNoZWNrTGlzdENvbnRyb2xsZXIgPSBmdW5jdGlvbihpdGVtKSB7XG4gIHZhciBvbkNoYW5nZSA9IGl0ZW0ub25DaGFuZ2UgfHwgZnVuY3Rpb24oKSB7fTtcblxuICB2YXIgc2VjdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlY3Rpb24nKTtcbiAgc2VjdGlvbi5jbGFzc05hbWUgPSAnc2VjdGlvbic7XG5cbiAgdmFyIHRpdGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHRpdGxlLmlubmVySFRNTCA9IGl0ZW0udGl0bGU7XG4gIHRpdGxlLmNsYXNzTmFtZSA9ICd0aXRsZSc7XG4gIHNlY3Rpb24uYXBwZW5kQ2hpbGQodGl0bGUpO1xuXG4gIHZhciBvcHRpb25zID0gaXRlbS5vcHRpb25zO1xuXG4gIHZhciBidXR0b25zID0gW107XG5cbiAgdmFyIG9uQ2xpY2sgPSBmdW5jdGlvbihpbmRleCkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBidXR0b24gPSBidXR0b25zW2luZGV4XTtcblxuICAgICAgYnV0dG9uLmNsYXNzTGlzdC50b2dnbGUoJ3NlbGVjdGVkJyk7XG5cbiAgICAgIG9uQ2hhbmdlKGdldFNlbGVjdGVkT3B0aW9ucygpKTtcbiAgICB9O1xuICB9O1xuXG4gIGZ1bmN0aW9uIGdldFNlbGVjdGVkT3B0aW9ucygpIHtcbiAgICB2YXIgc2VsZWN0aW9uID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBidXR0b25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYnV0dG9uc1tpXS5jbGFzc0xpc3QuY29udGFpbnMoJ3NlbGVjdGVkJykpIHtcbiAgICAgICAgc2VsZWN0aW9uLnB1c2gob3B0aW9uc1tpXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlbGVjdGlvbjtcbiAgfTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgb3B0aW9uID0gb3B0aW9uc1tpXTtcbiAgICB2YXIgYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgYnV0dG9uLmNsYXNzTmFtZSA9ICdzZWdtZW50ZWQtYnV0dG9uJztcbiAgICBidXR0b24uaW5uZXJIVE1MID0gb3B0aW9uO1xuICAgIHNlY3Rpb24uYXBwZW5kQ2hpbGQoYnV0dG9uKTtcblxuICAgIGlmIChpID09PSBvcHRpb25zLmxlbmd0aCAtIDEpIHtcbiAgICAgIGJ1dHRvbi5zdHlsZVsnYm9yZGVyLXJpZ2h0LXN0eWxlJ10gPSAnMnB4IHNvbGlkICMwMDAnO1xuICAgIH1cblxuICAgIGJ1dHRvbi5vbmNsaWNrID0gb25DbGljayhpKTtcblxuICAgIGJ1dHRvbnMucHVzaChidXR0b24pO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBlbGVtZW50OiBzZWN0aW9uXG4gIH1cbn07IiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIHByb21wdDogZnVuY3Rpb24ob3B0cywgY2FsbGJhY2spIHtcbiAgICB2YXIgdGV4dCA9IG9wdHMudGV4dDtcbiAgICB2YXIgYnV0dG9ucyA9IG9wdHMuYnV0dG9ucyB8fCBbJ09LJ107XG4gICAgdmFyIGNvbnRhaW5lcldpZHRoID0gb3B0cy5jb250YWluZXJXaWR0aCB8fCAyMDA7XG4gICAgdmFyIGNvbnRhaW5lckhlaWdodCA9IG9wdHMuY29udGFpbmVySGVpZ2h0IHx8IDIwMDtcblxuICAgIHZhciBiYWNrZ3JvdW5kID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgYmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAncmdiYSgwLDAsMCwwLjgpJ1xuICAgIGJhY2tncm91bmQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIGJhY2tncm91bmQuc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gICAgYmFja2dyb3VuZC5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChiYWNrZ3JvdW5kKTtcblxuICAgIGNvbnRhaW5lcldpZHRoID0gMjAwO1xuICAgIGNvbnRhaW5lckhlaWdodCA9IDIwMDtcbiAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY29udGFpbmVyLmNsYXNzTmFtZSA9ICdwcm9tcHQnO1xuICAgIGNvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgY29udGFpbmVyLnN0eWxlLndpZHRoID0gY29udGFpbmVyV2lkdGggKyAncHgnO1xuICAgIC8vIGNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBjb250YWluZXJIZWlnaHQgKyAncHgnO1xuXG4gICAgYmFja2dyb3VuZC5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuXG4gICAgdXBkYXRlTGF5b3V0KCk7XG5cbiAgICBmdW5jdGlvbiBvbldpbmRvd1Jlc2l6ZSgpIHtcbiAgICAgIHVwZGF0ZUxheW91dCgpO1xuICAgIH07XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgb25XaW5kb3dSZXNpemUpO1xuXG4gICAgdmFyIHF1ZXN0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDInKTtcbiAgICBxdWVzdGlvbi5pbm5lckhUTUwgPSB0ZXh0O1xuICAgIHF1ZXN0aW9uLnN0eWxlLmZvbnRGYW1pbHkgPSAnJ1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChxdWVzdGlvbik7XG5cbiAgICAvLyB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgIC8vIGlucHV0LnR5cGUgPSAndGV4dCc7XG4gICAgLy8gY29udGFpbmVyLmFwcGVuZENoaWxkKGlucHV0KTtcblxuICAgIC8vIGNvbnRhaW5lci5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdicicpKTtcblxuICAgIC8vIGlucHV0LmZvY3VzKCk7XG5cbiAgICBmdW5jdGlvbiBvbkNsaWNrKGluZGV4KSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzaG91bGREaXNtaXNzID0gY2FsbGJhY2soaW5kZXgpO1xuICAgICAgICBpZiAoc2hvdWxkRGlzbWlzcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgc2hvdWxkRGlzbWlzcyA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2hvdWxkRGlzbWlzcykge1xuICAgICAgICAgIGRpc21pc3MoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1dHRvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBidXR0b25UZXh0ID0gYnV0dG9uc1tpXTtcbiAgICAgIHZhciBidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAgIGJ1dHRvbi5pbm5lckhUTUwgPSBidXR0b25UZXh0O1xuICAgICAgYnV0dG9uLm9uY2xpY2sgPSBvbkNsaWNrKGkpO1xuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGJ1dHRvbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdXBkYXRlTGF5b3V0KCkge1xuICAgICAgY29udGFpbmVyLnN0eWxlLmxlZnQgPSAod2luZG93LmlubmVyV2lkdGggLSBjb250YWluZXJXaWR0aCkgLyAyICsgJ3B4JztcbiAgICAgIGNvbnRhaW5lci5zdHlsZS50b3AgPSAod2luZG93LmlubmVySGVpZ2h0IC0gY29udGFpbmVySGVpZ2h0KSAvIDIgKyAncHgnO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBkaXNtaXNzKCkge1xuICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChiYWNrZ3JvdW5kKTtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCBvbldpbmRvd1Jlc2l6ZSk7XG4gICAgfVxuXG4gICAgdmFyIHByb21wdCA9IHtcbiAgICAgIGRpc21pc3M6IGRpc21pc3NcbiAgICB9O1xuXG4gICAgcmV0dXJuIHByb21wdDtcbiAgfVxufSIsInZhciBjcHIgPSByZXF1aXJlKCcuL2NwcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVkaXRvcikge1xuICB2YXIgYmFyID0gY3ByKHtcbiAgICBvblBpY2s6IGZ1bmN0aW9uKG9iaiwgaW5kZXgpIHtcbiAgICAgIGVkaXRvci5wcmVmYWJJbmRleCA9IGluZGV4O1xuICAgICAgZWRpdG9yLmxvYWQoZWRpdG9yLnByZWZhYnNbaW5kZXhdKTtcbiAgICB9LFxuICAgIGJsb2NrV2lkdGg6IDQ4LFxuICAgIGJsb2NrSGVpZ2h0OiA0OCxcbiAgICBjdXN0b21QbGFjZW1lbnQ6IHRydWVcbiAgfSk7XG5cbiAgdmFyIGd1aSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdndWknKTtcbiAgZ3VpLmFwcGVuZENoaWxkKGJhci5kb21FbGVtZW50KTtcblxuICBiYXIuZG9tRWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIGJhci5kb21FbGVtZW50LnN0eWxlLmxlZnQgPSAnMjBweCc7XG4gIGJhci5kb21FbGVtZW50LnN0eWxlLmJvdHRvbSA9ICcxMjBweCc7XG5cbiAgcmV0dXJuIGJhcjtcbn07IiwidmFyIGNwciA9IHJlcXVpcmUoJy4vY3ByJyk7XG52YXIgcG9wdXAgPSByZXF1aXJlKCcuL3BvcHVwJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWRpdG9yKSB7XG4gIHZhciBpbnB1dCA9IGVkaXRvci5pbnB1dDtcbiAgdmFyIGRhdGEgPSBbe1xuICAgIGJ1dHRvbjogJ3BsdXMnLFxuICAgIHNyYzogJy9pbWFnZXMvaWNvbnMvcGx1c19saWdodC5wbmcnLFxuICAgIHNyY0FjdGl2ZTogJy9pbWFnZXMvaWNvbnMvcGx1c19kYXJrLnBuZycsXG4gICAgdG9vbHRpcDogJ0NyZWF0ZSBuZXcnXG4gIH0sIHtcbiAgICBidXR0b246ICdtaW51cycsXG4gICAgc3JjOiAnL2ltYWdlcy9pY29ucy9taW51c19saWdodC5wbmcnLFxuICAgIHNyY0FjdGl2ZTogJy9pbWFnZXMvaWNvbnMvbWludXNfZGFyay5wbmcnLFxuICAgIHRvb2x0aXA6ICdSZW1vdmUgc2VsZWN0ZWQnXG4gIH0sIHtcbiAgICBidXR0b246ICdjbG9uZScsXG4gICAgc3JjOiAnL2ltYWdlcy9pY29ucy9jbG9uZV9saWdodC5wbmcnLFxuICAgIHNyY0FjdGl2ZTogJy9pbWFnZXMvaWNvbnMvY2xvbmVfZGFyay5wbmcnLFxuICAgIHRvb2x0aXA6ICdDbG9uZSBzZWxlY3RlZCdcbiAgfV07XG5cbiAgdmFyIGJhciA9IGNwcih7XG4gICAgZGF0YTogZGF0YSxcbiAgICBibG9ja1dpZHRoOiAzMixcbiAgICBibG9ja0hlaWdodDogMzIsXG4gICAgZGlzYWJsZUhpZ2hsaWdodDogdHJ1ZSxcbiAgICBzaG93VG9vbHRpcDogdHJ1ZSxcbiAgICBvblBpY2s6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgdmFyIGJ1dHRvbiA9IG9iai5idXR0b247XG5cbiAgICAgIGlmIChidXR0b24gPT09ICdwbHVzJykge1xuICAgICAgICBlZGl0b3IuY3JlYXRlTmV3KCk7XG4gICAgICB9IGVsc2UgaWYgKGJ1dHRvbiA9PT0gJ21pbnVzJykge1xuICAgICAgICBwb3B1cC5wcm9tcHQoe1xuICAgICAgICAgIHRleHQ6IFwiQXJlIHlvdSBzdXJlP1wiLFxuICAgICAgICAgIGJ1dHRvbnM6IFtcIlllYVwiLCBcIk5hXCJdXG4gICAgICAgIH0sIGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICAgICAgICBlZGl0b3IucmVtb3ZlU2VsZWN0ZWQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGJhci5oaWdobGlnaHQoMSwgZmFsc2UpO1xuXG4gICAgICB9IGVsc2UgaWYgKGJ1dHRvbiA9PT0gJ2Nsb25lJykge1xuICAgICAgICBlZGl0b3IuY3JlYXRlQ2xvbmUoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGN1c3RvbVBsYWNlbWVudDogdHJ1ZSxcbiAgICBpc0J1dHRvbjogdHJ1ZVxuICB9KTtcblxuICB2YXIgZ3VpID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2d1aScpO1xuICBndWkuYXBwZW5kQ2hpbGQoYmFyLmRvbUVsZW1lbnQpO1xuXG4gIGJhci5kb21FbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgYmFyLmRvbUVsZW1lbnQuc3R5bGUubGVmdCA9ICcyMHB4JztcbiAgYmFyLmRvbUVsZW1lbnQuc3R5bGUuYm90dG9tID0gJzE4MHB4Jztcbn07IiwidmFyIHBhbmVsID0gcmVxdWlyZSgnLi9wYW5lbCcpO1xuXG5mdW5jdGlvbiBjbGFtcCh2YWx1ZSwgbWluLCBtYXgpIHtcbiAgaWYgKHZhbHVlIDwgbWluKSB7XG4gICAgcmV0dXJuIG1pbjtcbiAgfVxuXG4gIGlmICh2YWx1ZSA+IG1heCkge1xuICAgIHJldHVybiBtYXg7XG4gIH1cblxuICByZXR1cm4gdmFsdWU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVkaXRvcikge1xuICB2YXIgZGF0YSA9IFt7XG4gICAgdGl0bGU6ICduYW1lJyxcbiAgICB2YWx1ZTogJycsXG4gICAgb25DaGFuZ2U6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBlZGl0b3IuZ2V0U2VsZWN0ZWRQcmVmYWIoKS51c2VyRGF0YS5uYW1lID0gdmFsdWU7XG4gICAgfVxuICB9LCB7XG4gICAgdGl0bGU6ICdzaXplJyxcbiAgICB2YWx1ZTogJycsXG4gICAgb25GaW5pc2hFZGl0aW5nOiBmdW5jdGlvbih2YWx1ZSwgaW5wdXQpIHtcbiAgICAgIHZhciByZWcgPSAvXlxccyooXFxkezEsMn0pIChcXGR7MSwyfSkgKFxcZHsxLDJ9KVxccyokL2dcbiAgICAgIHZhciBtYXRjaGVzID0gcmVnLmV4ZWModmFsdWUpO1xuXG4gICAgICBpZiAobWF0Y2hlcyA9PSBudWxsKSB7XG4gICAgICAgIGVkaXRvci51cGRhdGVQcm9wZXJ0eVBhbmVsKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgZWRpdG9yLnVwZGF0ZVNpemUoW1xuICAgICAgICBjbGFtcChwYXJzZUludChtYXRjaGVzWzFdKSwgMCwgMzIpLFxuICAgICAgICBjbGFtcChwYXJzZUludChtYXRjaGVzWzJdKSwgMCwgMzIpLFxuICAgICAgICBjbGFtcChwYXJzZUludChtYXRjaGVzWzNdKSwgMCwgMzIpXG4gICAgICBdKTtcblxuICAgICAgZWRpdG9yLnVwZGF0ZVByb3BlcnR5UGFuZWwoKTtcbiAgICB9XG4gIH0sIHtcbiAgICB0aXRsZTogJ21pcnJvcicsXG4gICAgdHlwZTogJ2NoZWNrTGlzdCcsXG4gICAgb3B0aW9uczogWyd4JywgJ3knLCAneiddLFxuICAgIG9uQ2hhbmdlOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICBlZGl0b3IucmVmbGVjdFggPSBlZGl0b3IucmVmbGVjdFkgPSBlZGl0b3IucmVmbGVjdFogPSBmYWxzZTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAob3B0aW9uc1tpXSA9PT0gJ3gnKSB7XG4gICAgICAgICAgZWRpdG9yLnJlZmxlY3RYID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zW2ldID09PSAneScpIHtcbiAgICAgICAgICBlZGl0b3IucmVmbGVjdFkgPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnNbaV0gPT09ICd6Jykge1xuICAgICAgICAgIGVkaXRvci5yZWZsZWN0WiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1dO1xuXG4gIHZhciBwcm9wZXJ0eVBhbmVsID0gcGFuZWwoZGF0YSwge1xuICAgIGN1c3RvbVBsYWNlbWVudDogdHJ1ZVxuICB9KTtcblxuICBwcm9wZXJ0eVBhbmVsLmRvbUVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICBwcm9wZXJ0eVBhbmVsLmRvbUVsZW1lbnQuc3R5bGUucmlnaHQgPSA0MCArICdweCc7XG4gIHByb3BlcnR5UGFuZWwuZG9tRWxlbWVudC5zdHlsZS50b3AgPSAyMCArICdweCc7XG4gIHByb3BlcnR5UGFuZWwuZG9tRWxlbWVudC5zdHlsZS53aWR0aCA9IDIwMCArICdweCc7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdndWknKS5hcHBlbmRDaGlsZChwcm9wZXJ0eVBhbmVsLmRvbUVsZW1lbnQpO1xuXG4gIHJldHVybiBwcm9wZXJ0eVBhbmVsO1xufTsiLCJ2YXIgY3ByID0gcmVxdWlyZSgnLi9jcHInKTtcbnZhciBFZGl0b3JUb29scyA9IHJlcXVpcmUoJy4uL2VkaXRvcnRvb2xzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWRpdG9yKSB7XG4gIHZhciBiYXIgPSBjcHIoe1xuICAgIGRhdGE6IFt7XG4gICAgICBzcmM6ICcvaW1hZ2VzL2ljb25zL3BlbmNpbF9saWdodC5wbmcnLFxuICAgICAgc3JjQWN0aXZlOiAnL2ltYWdlcy9pY29ucy9wZW5jaWxfZGFyay5wbmcnLFxuICAgICAgdG9vbG5hbWU6IEVkaXRvclRvb2xzLlBlbixcbiAgICAgIHRvb2x0aXA6ICdwZW4gdG9vbCAoMSknXG4gICAgfSwge1xuICAgICAgc3JjOiAnL2ltYWdlcy9pY29ucy9zYW1wbGVyX2xpZ2h0LnBuZycsXG4gICAgICBzcmNBY3RpdmU6ICcvaW1hZ2VzL2ljb25zL3NhbXBsZXJfZGFyay5wbmcnLFxuICAgICAgdG9vbG5hbWU6IEVkaXRvclRvb2xzLlNhbXBsZSxcbiAgICAgIHRvb2x0aXA6ICdzYW1wbGUgdG9vbCAoMiknXG4gICAgfSwge1xuICAgICAgc3JjOiAnL2ltYWdlcy9pY29ucy9sYXNzb19saWdodC5wbmcnLFxuICAgICAgc3JjQWN0aXZlOiAnL2ltYWdlcy9pY29ucy9sYXNzb19kYXJrLnBuZycsXG4gICAgICB0b29sbmFtZTogRWRpdG9yVG9vbHMuU2VsZWN0LFxuICAgICAgdG9vbHRpcDogJ2xhc3NvIHRvb2wgKDMpJ1xuICAgIH0sIHtcbiAgICAgIHNyYzogJy9pbWFnZXMvaWNvbnMvY2FtZXJhX2xpZ2h0LnBuZycsXG4gICAgICBzcmNBY3RpdmU6ICcvaW1hZ2VzL2ljb25zL2NhbWVyYV9kYXJrLnBuZycsXG4gICAgICB0b29sbmFtZTogRWRpdG9yVG9vbHMuQ2FtZXJhLFxuICAgICAgdG9vbHRpcDogJ2NhbWVyYSB0b29sICg0IG9yIGRyYWcgZW1wdHkgc3BhY2UpJ1xuICAgIH0sIHtcbiAgICAgIHNyYzogJy9pbWFnZXMvaWNvbnMvZmlsbF9saWdodC5wbmcnLFxuICAgICAgc3JjQWN0aXZlOiAnL2ltYWdlcy9pY29ucy9maWxsX2RhcmsucG5nJyxcbiAgICAgIHRvb2xuYW1lOiBFZGl0b3JUb29scy5GaWxsLFxuICAgICAgdG9vbHRpcDogJ2Jsb2NrIHRvb2wgKDUpIChkcmFnIGFuZCBkcm9wIGJldHdlZW4gdHdvIHBvaW50cyknXG4gICAgfV0sXG4gICAgYmxvY2tXaWR0aDogMzIsXG4gICAgYmxvY2tIZWlnaHQ6IDMyLFxuICAgIG9uUGljazogZnVuY3Rpb24ob2JqKSB7XG4gICAgICBlZGl0b3Iuc2V0VG9vbChvYmoudG9vbG5hbWUpO1xuICAgIH0sXG4gICAgY3VzdG9tUGxhY2VtZW50OiB0cnVlLFxuICAgIHNob3dUb29sdGlwOiB0cnVlLFxuICAgIGhpZGVIaWdobGlnaHQ6IHRydWUsXG4gICAgaXNCdXR0b246IHRydWUsXG4gICAgc3RpY2t5U2VsZWN0aW9uOiB0cnVlXG4gIH0pO1xuXG4gIHZhciBndWkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ3VpJyk7XG4gIGd1aS5hcHBlbmRDaGlsZChiYXIuZG9tRWxlbWVudCk7XG5cbiAgYmFyLmRvbUVsZW1lbnQuY2xhc3NMaXN0LmFkZCgndG9vbGJhcicpO1xuXG4gIGJhci5kb21FbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgYmFyLmRvbUVsZW1lbnQuc3R5bGUudG9wID0gMjAgKyAncHgnO1xuICBiYXIuZG9tRWxlbWVudC5zdHlsZS5sZWZ0ID0gMjAgKyAncHgnO1xuXG4gIHJldHVybiBiYXI7XG59OyIsInZhciBDYW1lcmFUb29sID0gZnVuY3Rpb24oKSB7XG5cbn07XG5cbkNhbWVyYVRvb2wucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcblx0XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhbWVyYVRvb2w7IiwidmFyIFNldENvbW1hbmQgPSByZXF1aXJlKCcuLi9jb21tYW5kcy9zZXRjb21tYW5kJyk7XG5cbnZhciBGaWxsVG9vbCA9IGZ1bmN0aW9uKGVkaXRvcikge1xuICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcbiAgdGhpcy5pbnB1dCA9IHRoaXMuZWRpdG9yLmlucHV0O1xuICB0aGlzLmJsb2Nrc0NvcHkgPSBudWxsO1xuICB0aGlzLnN0YXJ0Q29vcmQgPSBudWxsO1xuICB0aGlzLmVuZENvb3JkID0gbnVsbDtcbn07XG5cbkZpbGxUb29sLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmVkaXRvci51cGRhdGVMYXN0QmxvY2tzKCk7XG59O1xuXG5GaWxsVG9vbC5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY29vcmRBYm92ZSA9IHRoaXMuZWRpdG9yLmdldENvb3JkQWJvdmUoKTtcbiAgdmFyIGNvb3JkQmVsb3cgPSB0aGlzLmVkaXRvci5nZXRDb29yZEJlbG93KCk7XG4gIHZhciBzaG91bGRVcGRhdGUgPSBmYWxzZTtcblxuICB2YXIgaXNSZW1vdmUgPSB0aGlzLmlucHV0Lm1vdXNlSG9sZCgyKSB8fCB0aGlzLmlucHV0Lm1vdXNlVXAoMik7XG5cbiAgdGhpcy5lZGl0b3IuaGlnaGxpZ2h0Q29vcmQgPSB0aGlzLmVkaXRvci5zZWxlY3RlZENvbG9yID09IG51bGwgPyBjb29yZEJlbG93IDogY29vcmRBYm92ZTtcblxuICB2YXIgY29vcmQgPSAoaXNSZW1vdmUgfHwgdGhpcy5lZGl0b3Iuc2VsZWN0ZWRDb2xvciA9PSBudWxsKSA/IGNvb3JkQmVsb3cgOiBjb29yZEFib3ZlO1xuXG4gIGlmICh0aGlzLmlucHV0Lm1vdXNlRG93bigpICYmIGNvb3JkICE9IG51bGwpIHtcbiAgICB0aGlzLmJsb2Nrc0NvcHkgPSB0aGlzLmVkaXRvci5ibG9ja3Muc2VyaWFsaXplKCk7XG4gICAgaWYgKHRoaXMuc3RhcnRDb29yZCA9PSBudWxsKSB7XG4gICAgICB0aGlzLnN0YXJ0Q29vcmQgPSBjb29yZDtcbiAgICAgIHRoaXMuZW5kQ29vcmQgPSBjb29yZDtcbiAgICAgIHNob3VsZFVwZGF0ZSA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKHRoaXMuc3RhcnRDb29yZCAhPSBudWxsICYmIGNvb3JkICE9IG51bGwpIHtcbiAgICBpZiAodGhpcy5lbmRDb29yZCA9PSBudWxsIHx8ICF0aGlzLmVuZENvb3JkLmVxdWFscyhjb29yZCkpIHtcbiAgICAgIHRoaXMuZW5kQ29vcmQgPSBjb29yZDtcbiAgICAgIHNob3VsZFVwZGF0ZSA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgdmFyIGluZGV4ID0gaXNSZW1vdmUgPyAwIDpcbiAgICB0aGlzLmVkaXRvci5ibG9ja3MuZ2V0T3JBZGRDb2xvckluZGV4KHRoaXMuZWRpdG9yLnNlbGVjdGVkQ29sb3IpO1xuXG4gIGlmICh0aGlzLnN0YXJ0Q29vcmQgIT0gbnVsbCAmJiB0aGlzLmVuZENvb3JkICE9IG51bGwgJiYgc2hvdWxkVXBkYXRlKSB7XG4gICAgdGhpcy5lZGl0b3IuYmxvY2tzLmRlc2VyaWFsaXplKHRoaXMuYmxvY2tzQ29weSk7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5sb29wQ29vcmRzKHRoaXMuc3RhcnRDb29yZCwgdGhpcy5lbmRDb29yZCwgZnVuY3Rpb24oaSwgaiwgaykge1xuICAgICAgc2VsZi5lZGl0b3IuYmxvY2tzLnNldChpLCBqLCBrLCBpbmRleCk7XG4gICAgfSk7XG4gIH1cblxuICBpZiAodGhpcy5pbnB1dC5tb3VzZVVwKCkgJiYgdGhpcy5ibG9ja3NDb3B5ICE9IG51bGwpIHtcbiAgICB0aGlzLmVkaXRvci5ibG9ja3MuZGVzZXJpYWxpemUodGhpcy5ibG9ja3NDb3B5KTtcblxuICAgIHZhciBjb29yZHMgPSBbXTtcblxuICAgIHRoaXMubG9vcENvb3Jkcyh0aGlzLnN0YXJ0Q29vcmQsIHRoaXMuZW5kQ29vcmQsIGZ1bmN0aW9uKGksIGosIGspIHtcbiAgICAgIGNvb3Jkcy5wdXNoKG5ldyBUSFJFRS5WZWN0b3IzKGksIGosIGspKTtcbiAgICB9KTtcblxuICAgIHZhciBjb21tYW5kID0gbmV3IFNldENvbW1hbmQodGhpcy5lZGl0b3IuYmxvY2tzLCBjb29yZHMsIGluZGV4KTtcbiAgICB0aGlzLmVkaXRvci5ydW5Db21tYW5kKGNvbW1hbmQpO1xuICAgIHRoaXMuZWRpdG9yLnVwZGF0ZUxhc3RCbG9ja3MoKTtcblxuICAgIHRoaXMuc3RhcnRDb29yZCA9IG51bGw7XG4gICAgdGhpcy5lbmRDb29yZCA9IG51bGw7XG4gICAgdGhpcy5ibG9ja3NDb3B5ID0gbnVsbDtcbiAgfVxufTtcblxuRmlsbFRvb2wucHJvdG90eXBlLmxvb3BDb29yZHMgPSBmdW5jdGlvbihzdGFydENvb3JkLCBlbmRDb29yZCwgY2FsbGJhY2spIHtcbiAgdmFyIG1pbiA9IG5ldyBUSFJFRS5WZWN0b3IzKFxuICAgIE1hdGgubWluKHN0YXJ0Q29vcmQueCwgZW5kQ29vcmQueCksXG4gICAgTWF0aC5taW4oc3RhcnRDb29yZC55LCBlbmRDb29yZC55KSxcbiAgICBNYXRoLm1pbihzdGFydENvb3JkLnosIGVuZENvb3JkLnopXG4gICk7XG5cbiAgdmFyIG1heCA9IG5ldyBUSFJFRS5WZWN0b3IzKFxuICAgIE1hdGgubWF4KHN0YXJ0Q29vcmQueCwgZW5kQ29vcmQueCksXG4gICAgTWF0aC5tYXgoc3RhcnRDb29yZC55LCBlbmRDb29yZC55KSxcbiAgICBNYXRoLm1heChzdGFydENvb3JkLnosIGVuZENvb3JkLnopXG4gICk7XG5cbiAgZm9yICh2YXIgaSA9IG1pbi54OyBpIDw9IG1heC54OyBpKyspIHtcbiAgICBmb3IgKHZhciBqID0gbWluLnk7IGogPD0gbWF4Lnk7IGorKykge1xuICAgICAgZm9yICh2YXIgayA9IG1pbi56OyBrIDw9IG1heC56OyBrKyspIHtcbiAgICAgICAgY2FsbGJhY2soaSwgaiwgayk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGxUb29sOyIsInZhciBTZXRDb21tYW5kID0gcmVxdWlyZSgnLi4vY29tbWFuZHMvc2V0Y29tbWFuZCcpO1xuXG52YXIgUGVuVG9vbCA9IGZ1bmN0aW9uKGVkaXRvcikge1xuXG4gIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xuXG4gIHRoaXMuY2FtZXJhID0gdGhpcy5lZGl0b3IuY2FtZXJhO1xuXG4gIHRoaXMuaW5wdXQgPSB0aGlzLmVkaXRvci5pbnB1dDtcblxuICB0aGlzLmJsb2NrcyA9IHRoaXMuZWRpdG9yLmJsb2NrcztcblxuICB0aGlzLm9iamVjdCA9IHRoaXMuZWRpdG9yLm9iamVjdDtcblxuICB0aGlzLmxhc3RNb3VzZSA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG5cbiAgdGhpcy5tb3VzZVNhbXBsZUludGVydmFsID0gNDtcbn07XG5cblBlblRvb2wucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuZWRpdG9yLmVkaXRMb2NrKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIFxuICB2YXIgaXNDbGVhckNvbG9yID0gdGhpcy5lZGl0b3Iuc2VsZWN0ZWRDb2xvciA9PSBudWxsO1xuXG4gIHRoaXMuZWRpdG9yLmhpZ2hsaWdodENvb3JkID0gaXNDbGVhckNvbG9yID9cbiAgICB0aGlzLmVkaXRvci5nZXRDb29yZEJlbG93KCkgOlxuICAgIHRoaXMuZWRpdG9yLmdldENvb3JkQWJvdmUoKTtcblxuICBpZiAodGhpcy5pbnB1dC5tb3VzZURvd24oKSB8fCB0aGlzLmlucHV0Lm1vdXNlVXAoKSkge1xuICAgIHRoaXMuZWRpdG9yLnVwZGF0ZUxhc3RCbG9ja3MoKTtcbiAgfVxuXG4gIGlmICh0aGlzLmlucHV0Lm1vdXNlRG93bigwKSkge1xuICAgIHRoaXMub25DbGljayhpc0NsZWFyQ29sb3IpO1xuICB9IGVsc2UgaWYgKHRoaXMuaW5wdXQubW91c2VEb3duKDIpKSB7XG4gICAgdGhpcy5vbkNsaWNrKHRydWUpO1xuICB9XG5cbiAgaWYgKHRoaXMuaW5wdXQubW91c2VIb2xkKDApICYmIHRoaXMuaW5wdXQubW91c2VNb3ZlKCkpIHtcbiAgICB0aGlzLm9uRHJhZyhpc0NsZWFyQ29sb3IpO1xuICB9IGVsc2UgaWYgKHRoaXMuaW5wdXQubW91c2VIb2xkKDIpICYmIHRoaXMuaW5wdXQubW91c2VNb3ZlKCkpIHtcbiAgICB0aGlzLm9uRHJhZyh0cnVlKTtcbiAgfVxuXG4gIHRoaXMubGFzdE1vdXNlID0gdGhpcy5pbnB1dC5tb3VzZS5jbG9uZSgpO1xufTtcblxuUGVuVG9vbC5wcm90b3R5cGUub25DbGljayA9IGZ1bmN0aW9uKGlzQ2xlYXIpIHtcbiAgdmFyIGNvbG9yID0gaXNDbGVhciA/IG51bGwgOiB0aGlzLmVkaXRvci5zZWxlY3RlZENvbG9yO1xuICB2YXIgc2VsZWN0ZWRJbmRleCA9IHRoaXMuYmxvY2tzLmdldE9yQWRkQ29sb3JJbmRleChjb2xvcik7XG5cbiAgdmFyIGNvb3JkID0gaXNDbGVhciA/XG4gICAgdGhpcy5lZGl0b3IuZ2V0Q29vcmRCZWxvdygpIDpcbiAgICB0aGlzLmVkaXRvci5nZXRDb29yZEFib3ZlKCk7XG5cbiAgaWYgKCEhY29vcmQpIHtcbiAgICBpZiAodGhpcy5ibG9ja3MuZ2V0QXRDb29yZChjb29yZCkgIT09IHNlbGVjdGVkSW5kZXgpIHtcbiAgICAgIHRoaXMuZWRpdG9yLnJ1bkNvbW1hbmQobmV3IFNldENvbW1hbmQodGhpcy5ibG9ja3MsIHRoaXMucmVmbGVjdENvb3JkcyhbY29vcmRdKSwgc2VsZWN0ZWRJbmRleCkpO1xuICAgICAgdGhpcy5lZGl0b3IudXBkYXRlTGFzdEJsb2NrcygpO1xuICAgIH1cbiAgfVxufTtcblxuUGVuVG9vbC5wcm90b3R5cGUub25EcmFnID0gZnVuY3Rpb24oaXNDbGVhcikge1xuICB2YXIgY29sb3IgPSBpc0NsZWFyID8gbnVsbCA6IHRoaXMuZWRpdG9yLnNlbGVjdGVkQ29sb3I7XG4gIHZhciBzZWxlY3RlZEluZGV4ID0gdGhpcy5ibG9ja3MuZ2V0T3JBZGRDb2xvckluZGV4KGNvbG9yKTtcblxuICB2YXIgcG9pbnRzID0gdGhpcy5nZXRNb3VzZVBvaW50cyh0aGlzLmxhc3RNb3VzZSwgdGhpcy5pbnB1dC5tb3VzZSwgdGhpcy5tb3VzZVNhbXBsZUludGVydmFsKTtcbiAgdmFyIGNvb3JkcyA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBjb29yZCA9IGlzQ2xlYXIgP1xuICAgICAgdGhpcy5lZGl0b3IuZ2V0Q29vcmRCZWxvdyhwb2ludHNbaV0pIDpcbiAgICAgIHRoaXMuZWRpdG9yLmdldENvb3JkQWJvdmUocG9pbnRzW2ldKTtcblxuICAgIGlmICghIWNvb3JkKSB7XG4gICAgICBpZiAodGhpcy5ibG9ja3MuZ2V0QXRDb29yZChjb29yZCkgIT09IHNlbGVjdGVkSW5kZXgpIHtcbiAgICAgICAgY29vcmRzLnB1c2goY29vcmQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvb3JkcyA9IHVuaXF1ZUNvb3Jkcyhjb29yZHMpO1xuICBpZiAoY29vcmRzLmxlbmd0aCA+IDApIHtcbiAgICB0aGlzLmVkaXRvci5ydW5Db21tYW5kKG5ldyBTZXRDb21tYW5kKHRoaXMuYmxvY2tzLCB0aGlzLnJlZmxlY3RDb29yZHMoY29vcmRzKSwgc2VsZWN0ZWRJbmRleCkpO1xuICB9XG59O1xuXG4vLyBSZWZsZWN0IGNvb3JkcyB3aXRoIGVkaXRvciBzZXR0aW5nc1xuUGVuVG9vbC5wcm90b3R5cGUucmVmbGVjdENvb3JkcyA9IGZ1bmN0aW9uKGNvb3Jkcykge1xuICBpZiAoIXRoaXMuZWRpdG9yLnJlZmxlY3RYICYmICF0aGlzLmVkaXRvci5yZWZsZWN0WSAmJiAhdGhpcy5lZGl0b3IucmVmbGVjdFopIHtcbiAgICByZXR1cm4gY29vcmRzO1xuICB9XG5cbiAgdmFyIGRpbSA9IHRoaXMuYmxvY2tzLmRpbTtcbiAgdmFyIHBpdm90ID0gW1xuICAgIE1hdGgucm91bmQoKGRpbVswXSAtIDEpIC8gMiksXG4gICAgTWF0aC5yb3VuZCgoZGltWzFdIC0gMSkgLyAyKSxcbiAgICBNYXRoLnJvdW5kKChkaW1bMl0gLSAxKSAvIDIpXG4gIF07XG5cbiAgaWYgKHRoaXMuZWRpdG9yLnJlZmxlY3RYKSB7XG4gICAgdmFyIHJlZmxlY3RlZCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29vcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgciA9IGNvb3Jkc1tpXS5jbG9uZSgpO1xuICAgICAgci54ID0gcGl2b3RbMF0gKyBwaXZvdFswXSAtIHIueDtcbiAgICAgIHJlZmxlY3RlZC5wdXNoKHIpO1xuICAgIH1cbiAgICBjb29yZHMgPSBjb29yZHMuY29uY2F0KHJlZmxlY3RlZCk7XG4gIH1cblxuICBpZiAodGhpcy5lZGl0b3IucmVmbGVjdFkpIHtcbiAgICB2YXIgcmVmbGVjdGVkID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciByID0gY29vcmRzW2ldLmNsb25lKCk7XG4gICAgICByLnkgPSBwaXZvdFsxXSArIHBpdm90WzFdIC0gci55O1xuICAgICAgcmVmbGVjdGVkLnB1c2gocik7XG4gICAgfVxuICAgIGNvb3JkcyA9IGNvb3Jkcy5jb25jYXQocmVmbGVjdGVkKTtcbiAgfVxuXG4gIGlmICh0aGlzLmVkaXRvci5yZWZsZWN0Wikge1xuICAgIHZhciByZWZsZWN0ZWQgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHIgPSBjb29yZHNbaV0uY2xvbmUoKTtcbiAgICAgIHIueiA9IHBpdm90WzJdICsgcGl2b3RbMl0gLSByLno7XG4gICAgICByZWZsZWN0ZWQucHVzaChyKTtcbiAgICB9XG4gICAgY29vcmRzID0gY29vcmRzLmNvbmNhdChyZWZsZWN0ZWQpO1xuICB9XG5cbiAgcmV0dXJuIGNvb3Jkcztcbn07XG5cblBlblRvb2wucHJvdG90eXBlLmdldE1vdXNlUG9pbnRzID0gZnVuY3Rpb24oZnJvbSwgdG8sIG1heERpcykge1xuICB2YXIgZGlzdGFuY2UgPSBuZXcgVEhSRUUuVmVjdG9yMigpLnN1YlZlY3RvcnModG8sIGZyb20pLmxlbmd0aCgpO1xuXG4gIHZhciBpbnRlcnZhbCA9IE1hdGguY2VpbChkaXN0YW5jZSAvIG1heERpcyk7XG4gIHZhciBzdGVwID0gbmV3IFRIUkVFLlZlY3RvcjIoKS5zdWJWZWN0b3JzKHRvLCBmcm9tKS5zZXRMZW5ndGgoZGlzdGFuY2UgLyBpbnRlcnZhbCk7XG5cbiAgdmFyIGxpc3QgPSBbXTtcbiAgdmFyIHN0YXJ0ID0gZnJvbS5jbG9uZSgpO1xuICBsaXN0LnB1c2goc3RhcnQpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGludGVydmFsOyBpKyspIHtcbiAgICBzdGFydC5hZGQoc3RlcCk7XG4gICAgbGlzdC5wdXNoKHN0YXJ0LmNsb25lKCkpO1xuICB9XG4gIHJldHVybiBsaXN0O1xufTtcblxuZnVuY3Rpb24gdW5pcXVlQ29vcmRzKGNvb3Jkcykge1xuICB2YXIgbWFwID0ge307XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY29vcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgbWFwW2Nvb3Jkc1tpXS50b0FycmF5KCkuam9pbignLCcpXSA9IGNvb3Jkc1tpXTtcbiAgfVxuICB2YXIgbGlzdCA9IFtdO1xuICBmb3IgKHZhciBpZCBpbiBtYXApIHtcbiAgICBsaXN0LnB1c2gobWFwW2lkXSk7XG4gIH1cbiAgcmV0dXJuIGxpc3Q7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBlblRvb2w7IiwidmFyIEVkaXRvclRvb2xzID0gcmVxdWlyZSgnLi4vZWRpdG9ydG9vbHMnKTtcblxudmFyIFNhbXBsZVRvb2wgPSBmdW5jdGlvbihlZGl0b3IpIHtcbiAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XG4gIHRoaXMuaW5wdXQgPSB0aGlzLmVkaXRvci5pbnB1dDtcbiAgdGhpcy5ibG9ja3MgPSB0aGlzLmVkaXRvci5ibG9ja3M7XG59O1xuXG5TYW1wbGVUb29sLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuZWRpdG9yLmhpZ2hsaWdodENvb3JkID0gdGhpcy5lZGl0b3IuZ2V0Q29vcmRCZWxvdygpO1xuXG4gIGlmICh0aGlzLmlucHV0Lm1vdXNlRG93bigpKSB7XG4gICAgdmFyIGNvb3JkID0gdGhpcy5lZGl0b3IuZ2V0Q29vcmRCZWxvdygpO1xuXG4gICAgdmFyIGNvbG9yID0gbnVsbDtcbiAgICBpZiAoY29vcmQgIT0gbnVsbCkge1xuICAgICAgdmFyIGluZGV4ID0gdGhpcy5ibG9ja3MuZ2V0QXRDb29yZChjb29yZCk7XG4gICAgICB2YXIgY29sb3IgPSB0aGlzLmJsb2Nrcy5wYWxldHRlW2luZGV4XTtcbiAgICAgIHRoaXMuZWRpdG9yLnNldFNlbGVjdGVkQ29sb3IoY29sb3IpO1xuICAgICAgdGhpcy5lZGl0b3Iuc2V0TGFzdFRvb2woKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lZGl0b3Iuc2V0U2VsZWN0ZWRDb2xvcihudWxsKTtcbiAgICAgIHRoaXMuZWRpdG9yLnNldExhc3RUb29sKCk7XG4gICAgfVxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNhbXBsZVRvb2w7IiwidmFyIGluc2lkZSA9IHJlcXVpcmUoJ3BvaW50LWluLXBvbHlnb24nKTtcbnZhciBTZWxlY3RDb21tYW5kID0gcmVxdWlyZSgnLi4vY29tbWFuZHMvc2VsZWN0Y29tbWFuZCcpO1xuXG52YXIgU2VsZWN0VG9vbCA9IGZ1bmN0aW9uKGVkaXRvcikge1xuICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcbiAgdGhpcy5pbnB1dCA9IHRoaXMuZWRpdG9yLmlucHV0O1xuICB0aGlzLmJsb2NrcyA9IHRoaXMuZWRpdG9yLmJsb2NrcztcbiAgdGhpcy5jYW1lcmEgPSB0aGlzLmVkaXRvci5jYW1lcmE7XG5cbiAgdGhpcy5kaXZTZWxlY3Rpb25Cb3ggPSBudWxsO1xuXG4gIHRoaXMuY2FudmFzID0gZWRpdG9yLmNhbnZhcztcbiAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICB0aGlzLnBvaW50cyA9IFtdO1xuICB0aGlzLm1pbkRpc3RhbmNlID0gMjtcbn07XG5cblNlbGVjdFRvb2wucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcblxuICBpZiAodGhpcy5pbnB1dC5tb3VzZUhvbGQoMCkpIHtcbiAgICB2YXIgbW91c2UgPSB0aGlzLmlucHV0Lm1vdXNlLmNsb25lKCk7XG4gICAgaWYgKHRoaXMucG9pbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5wb2ludHMucHVzaChtb3VzZS50b0FycmF5KCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbGFzdE1vdXNlID0gbmV3IFRIUkVFLlZlY3RvcjIoKS5mcm9tQXJyYXkodGhpcy5wb2ludHNbdGhpcy5wb2ludHMubGVuZ3RoIC0gMV0pO1xuICAgICAgdmFyIGRpc3RhbmNlID0gbGFzdE1vdXNlLmRpc3RhbmNlVG8obW91c2UpO1xuICAgICAgaWYgKGRpc3RhbmNlID4gdGhpcy5taW5EaXN0YW5jZSkge1xuICAgICAgICB0aGlzLnBvaW50cy5wdXNoKG1vdXNlLnRvQXJyYXkoKSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICh0aGlzLnBvaW50cy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLnVwZGF0ZVNlbGVjdGlvbigpO1xuICAgIH1cbiAgICB0aGlzLnBvaW50cyA9IFtdO1xuICB9XG5cbiAgdGhpcy5kcmF3TGFzc28oKTtcbn07XG5cblNlbGVjdFRvb2wucHJvdG90eXBlLmRyYXdMYXNzbyA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5wb2ludHMubGVuZ3RoIDwgMikge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMuY29udGV4dC5saW5lV2lkdGggPSAnMSc7XG4gIHRoaXMuY29udGV4dC5zZXRMaW5lRGFzaChbM10pO1xuICB0aGlzLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSAnI2ZmZmZmZic7XG4gIHRoaXMuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBwb2ludCA9IHRoaXMucG9pbnRzW2ldO1xuICAgIGlmIChpID09PSAwKSB7XG4gICAgICB0aGlzLmNvbnRleHQubW92ZVRvKHBvaW50WzBdLCBwb2ludFsxXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY29udGV4dC5saW5lVG8ocG9pbnRbMF0sIHBvaW50WzFdKTtcbiAgICB9XG4gIH1cbiAgdGhpcy5jb250ZXh0LnN0cm9rZSgpO1xufTtcblxuU2VsZWN0VG9vbC5wcm90b3R5cGUudXBkYXRlU2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gIHZhciBibG9ja3MgPSB0aGlzLmJsb2NrcztcbiAgdmFyIGNhbWVyYSA9IHRoaXMuY2FtZXJhO1xuICB2YXIgY2FudmFzID0gdGhpcy5jYW52YXM7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB2YXIgc2NyZWVuUG9pbnRzID0gW107XG4gIHRoaXMuYmxvY2tzLnZpc2l0KGZ1bmN0aW9uKGksIGosIGssIGIpIHtcbiAgICB2YXIgY29vcmQgPSBuZXcgVEhSRUUuVmVjdG9yMyhpICsgMC41LCBqICsgMC41LCBrICsgMC41KTtcbiAgICB2YXIgbG9jYWxQb2ludCA9IGJsb2Nrcy5jb29yZFRvUG9pbnQoY29vcmQpO1xuICAgIHZhciB3b3JsZFBvaW50ID0gYmxvY2tzLm9iai5sb2NhbFRvV29ybGQobG9jYWxQb2ludCk7XG4gICAgdmFyIHZlY3RvciA9IHdvcmxkUG9pbnQucHJvamVjdChjYW1lcmEpO1xuICAgIHZlY3Rvci54ID0gTWF0aC5yb3VuZCgodmVjdG9yLnggKyAxKSAqIGNhbnZhcy53aWR0aCAvIDIpO1xuICAgIHZlY3Rvci55ID0gTWF0aC5yb3VuZCgoLXZlY3Rvci55ICsgMSkgKiBjYW52YXMuaGVpZ2h0IC8gMik7XG5cbiAgICBzY3JlZW5Qb2ludHMucHVzaCh7XG4gICAgICBzY3JlZW46IFt2ZWN0b3IueCwgdmVjdG9yLnldLFxuICAgICAgY29vcmQ6IG5ldyBUSFJFRS5WZWN0b3IzKGksIGosIGspXG4gICAgfSk7XG4gIH0pO1xuXG4gIHZhciBzZWxlY3Rpb25zID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc2NyZWVuUG9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHNjcmVlbiA9IHNjcmVlblBvaW50c1tpXS5zY3JlZW47XG4gICAgLy8gVGVzdCBwb2ludCBpbiBwb2x5Z29uXG4gICAgaWYgKGluc2lkZShzY3JlZW4sIHRoaXMucG9pbnRzKSkge1xuICAgICAgc2VsZWN0aW9ucy5wdXNoKHNjcmVlblBvaW50c1tpXS5jb29yZCk7XG4gICAgfVxuICB9XG5cbiAgdGhpcy5lZGl0b3IucnVuQ29tbWFuZChuZXcgU2VsZWN0Q29tbWFuZCh0aGlzLmVkaXRvciwgc2VsZWN0aW9ucykpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZWxlY3RUb29sOyIsInZhciBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydUSFJFRSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnVEhSRUUnXSA6IG51bGwpO1xudmFyIGIgPSByZXF1aXJlKCcuL2NvcmUvYicpO1xuLy8gdmFyIHN0YXRzID0gcmVxdWlyZSgnLi9zZXJ2aWNlcy9zdGF0cycpO1xuXG52YXIgYXBwID0gYignbWFpbicpO1xuXG52YXIgc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKTtcbnZhciBjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoNjAsIHdpbmRvdy5pbm5lcldpZHRoIC8gd2luZG93LmlubmVySGVpZ2h0LCAwLjEsIDEwMDApO1xuXG4vLyBSZWdzaXRlciB2YWx1ZXNcbmFwcC52YWx1ZSgnYXBwJywgYXBwKTtcbmFwcC52YWx1ZSgnc2NlbmUnLCBzY2VuZSk7XG5hcHAudmFsdWUoJ2NhbWVyYScsIGNhbWVyYSk7XG5hcHAudmFsdWUoJ2NvbmZpZycsIHJlcXVpcmUoJy4vZGF0YS9jb25maWcuanNvbicpKTtcbmFwcC52YWx1ZSgncGFsZXR0ZScsIHJlcXVpcmUoJy4vZGF0YS9wYWxldHRlLmpzb24nKSk7XG5hcHAudmFsdWUoJ21hdGVyaWFscycsIHJlcXVpcmUoJy4vc2VydmljZXMvbWF0ZXJpYWxzJykpO1xuYXBwLnZhbHVlKCdjYW52YXMnLCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FudmFzJykpO1xuXG52YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbnRhaW5lcicpO1xuYXBwLnVzZShyZXF1aXJlKCcuL3N5c3RlbXMvcmVuZGVyZXInKShzY2VuZSwgY2FtZXJhLCBjb250YWluZXIpKTtcbmFwcC51c2UoJ2lucHV0JywgcmVxdWlyZSgnLi9zeXN0ZW1zL2lucHV0JykoY29udGFpbmVyKSk7XG5hcHAudXNlKHJlcXVpcmUoJy4vdm94ZWwvdm94ZWwnKSgpKTtcblxudmFyIGRldkNvbnNvbGUgPSByZXF1aXJlKCcuL3NlcnZpY2VzL2RldmNvbnNvbGUnKSh7XG4gIG9uYmx1cjogZnVuY3Rpb24oKSB7XG4gICAgY29udGFpbmVyLmZvY3VzKCk7XG4gIH1cbn0pO1xuYXBwLnZhbHVlKCdkZXZDb25zb2xlJywgZGV2Q29uc29sZSk7XG5cbnZhciBjYWNoZSA9IHJlcXVpcmUoJy4vc2VydmljZXMvY2FjaGUnKSgpO1xuYXBwLnZhbHVlKCdjYWNoZScsIGNhY2hlKTtcblxuLy8gc3RhdHMoYXBwKTtcblxuLy8gQXR0YWNoIGNhbWVyYSBjb250cm9sXG5mdW5jdGlvbiBsb2FkR2FtZSgpIHtcbiAgYXBwLmF0dGFjaChjYW1lcmEsIHJlcXVpcmUoJy4vY29tcG9uZW50cy9wbGF5ZXJDYW1lcmEnKSk7XG5cbiAgYXBwLmxvYWRBc3NlbWJseShyZXF1aXJlKCcuL2Fzc2VtYmxpZXMvYWdyb3VuZCcpKTtcblxuICB2YXIgcGxheWVyID0gYXBwLmxvYWRBc3NlbWJseShyZXF1aXJlKCcuL2Fzc2VtYmxpZXMvYXBsYXllcicpKTtcbiAgYXBwLnZhbHVlKCdwbGF5ZXInLCBwbGF5ZXIpO1xufTtcblxuZnVuY3Rpb24gbG9hZEVkaXRvcigpIHtcbiAgYXBwLmxvYWRBc3NlbWJseShyZXF1aXJlKCcuL2Fzc2VtYmxpZXMvYWVkaXRvcicpKTtcbn1cblxubG9hZEVkaXRvcigpO1xuXG5hcHAuc3RhcnQoKTtcblxudmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW52YXMnKTtcbmFwcC5vbignYmVmb3JlVGljaycsIGZ1bmN0aW9uKCkge1xuICBpZiAoY2FudmFzLndpZHRoICE9PSB3aW5kb3cuaW5uZXJXaWR0aCkge1xuICAgIGNhbnZhcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICB9XG4gIGlmIChjYW52YXMuaGVpZ2h0ICE9PSB3aW5kb3cuaW5uZXJIZWlnaHQpIHtcbiAgICBjYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICB9XG59KTsiLCJ2YXIgQ2FjaGUgPSBmdW5jdGlvbigpIHt9O1xuXG5DYWNoZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oa2V5KSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufTtcblxuQ2FjaGUucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgSlNPTi5zdHJpbmdpZnkodmFsdWUpKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgQ2FjaGUoKTtcbn07IiwidmFyIHBhcnNlQXJncyA9IHJlcXVpcmUoJ21pbmltaXN0Jyk7XG52YXIga2V5Y29kZSA9IHJlcXVpcmUoJ2tleWNvZGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRzKSB7XG4gIG9wdHMgPSBvcHRzIHx8IHt9O1xuICB2YXIgb25mb2N1cyA9IG9wdHMub25mb2N1cyB8fCBudWxsO1xuICB2YXIgb25ibHVyID0gb3B0cy5vbmJsdXIgfHwgbnVsbDtcbiAgdmFyIGNvbW1hbmRzID0gb3B0cy5jb21tYW5kcyB8fCB7fTtcblxuICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZGl2KTtcbiAgZGl2LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgZGl2LnN0eWxlLmxlZnQgPSAnMHB4JztcbiAgZGl2LnN0eWxlLnRvcCA9ICcwcHgnO1xuICBkaXYuc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gIGRpdi5zdHlsZS5oZWlnaHQgPSAnMTIwcHgnO1xuICBkaXYuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3JnYmEoMCwgMCwgMCwgMC41KSc7XG5cbiAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgaW5wdXQudHlwZSA9ICd0ZXh0JztcbiAgaW5wdXQuY2xhc3NOYW1lID0gJ2NvbnNvbGUtaW5wdXQnO1xuICBpbnB1dC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIGlucHV0LnN0eWxlLmxlZnQgPSAnMHB4JztcbiAgaW5wdXQuc3R5bGUudG9wID0gJzBweCc7XG4gIGlucHV0LnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICBpbnB1dC5zdHlsZS5oZWlnaHQgPSAnMjBweCc7XG4gIGlucHV0LnN0eWxlWydiYWNrZ3JvdW5kLWNvbG9yJ10gPSAndHJhbnNwYXJlbnQnO1xuICBpbnB1dC5zdHlsZVsnYm9yZGVyJ10gPSAnMHB4IHNvbGlkJztcbiAgaW5wdXQuc3BlbGxjaGVjayA9IGZhbHNlO1xuICBpbnB1dC5zdHlsZS5jb2xvciA9ICcjRkZGRkZGJztcbiAgaW5wdXQuc3R5bGUuZm9udFNpemUgPSAnMTZweCc7XG4gIGlucHV0LnN0eWxlLnBhZGRpbmcgPSAnMnB4IDJweCAwcHggMnB4JztcbiAgaW5wdXQudmFsdWUgPSAnPiAnO1xuXG4gIGRpdi5hcHBlbmRDaGlsZChpbnB1dCk7XG5cbiAgdmFyIHRleHRTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICB0ZXh0U3Bhbi5jbGFzc05hbWUgPSAnY29uc29sZS1zcGFuJztcbiAgdGV4dFNwYW4uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICB0ZXh0U3Bhbi5zdHlsZS5sZWZ0ID0gJzBweCc7XG4gIHRleHRTcGFuLnN0eWxlLnRvcCA9ICcyMHB4JztcbiAgdGV4dFNwYW4uc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gIHRleHRTcGFuLnN0eWxlLmhlaWdodCA9ICcxMDBweCc7XG4gIHRleHRTcGFuLnN0eWxlLmNvbG9yID0gJyNGRkZGRkYnO1xuICB0ZXh0U3Bhbi5zdHlsZS5mb250U2l6ZSA9ICcxNnB4JztcbiAgdGV4dFNwYW4uc3R5bGUucGFkZGluZyA9ICcwcHggMnB4IDJweCAycHgnO1xuXG4gIGRpdi5hcHBlbmRDaGlsZCh0ZXh0U3Bhbik7XG5cbiAgLy8gUmVtb3ZlIG91dGxpbmUgb24gZm9jdXNcbiAgaW5wdXQub25mb2N1cyA9IGZ1bmN0aW9uKCkge1xuICAgIGlucHV0LnN0eWxlWydvdXRsaW5lJ10gPSAnbm9uZSc7XG4gIH07XG5cbiAgaW5wdXQub25rZXlwcmVzcyA9IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgb25FbnRlclByZXNzZWQoKTtcbiAgICB9XG4gICAgb25JbnB1dENoYW5nZWQoZSk7XG4gIH07XG5cbiAgaW5wdXQub25rZXl1cCA9IGZ1bmN0aW9uKGUpIHtcbiAgICBvbklucHV0Q2hhbmdlZChlKTtcbiAgfTtcblxuICBmdW5jdGlvbiBvbklucHV0Q2hhbmdlZChlKSB7XG4gICAgaWYgKGlucHV0LnZhbHVlLmxlbmd0aCA8IDIpIHtcbiAgICAgIGlucHV0LnZhbHVlID0gJz4gJztcbiAgICB9XG4gIH07XG5cbiAgdmFyIGxpbmVzID0gW107XG4gIHZhciBoaXN0b3J5TGVuZ3RoID0gMTAwO1xuICB2YXIgbnVtYmVyT2ZMaW5lcyA9IDU7XG5cbiAgZnVuY3Rpb24gb25FbnRlclByZXNzZWQoKSB7XG4gICAgdmFyIGxpbmUgPSBpbnB1dC52YWx1ZTtcbiAgICBhZGRMb2cobGluZSk7XG4gICAgbGluZSA9IGxpbmUuc3Vic3RyaW5nKDIpO1xuICAgIGxpbmUgPSBsaW5lLnRyaW0oKTtcbiAgICB2YXIgaW5kZXggPSBsaW5lLmluZGV4T2YoJyAnKTtcbiAgICB2YXIgY29tbWFuZE5hbWUgPSBpbmRleCA9PT0gLTEgPyBsaW5lIDogbGluZS5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuICAgIHZhciBhcmdzID0gaW5kZXggPT09IC0xID8gJycgOiBsaW5lLnN1YnN0cmluZyhpbmRleCArIDEpO1xuXG4gICAgdmFyIGNvbW1hbmQgPSBjb21tYW5kc1tjb21tYW5kTmFtZV07XG4gICAgaWYgKGNvbW1hbmQgPT0gbnVsbCkge1xuICAgICAgYWRkRXJyb3IoY29tbWFuZE5hbWUgKyAnOiBjb21tYW5kIG5vdCBmb3VuZCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0cnkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gY29tbWFuZChwYXJzZUFyZ3MoYXJncy5zcGxpdCgnICcpKSk7XG4gICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIGFkZExvZyhyZXN1bHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaGlkZSgpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGFkZEVycm9yKGVycik7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpbnB1dC52YWx1ZSA9ICcnO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGFkZExvZyhsaW5lKSB7XG4gICAgYWRkTGluZShsaW5lKTtcbiAgfTtcblxuICBmdW5jdGlvbiBhZGRFcnJvcihsaW5lKSB7XG4gICAgYWRkTGluZShsaW5lKTtcbiAgfTtcblxuICBmdW5jdGlvbiBhZGRMaW5lKGxpbmUpIHtcbiAgICBsaW5lcy5wdXNoKGxpbmUpO1xuICAgIGlmIChsaW5lcy5sZW5ndGggPiBoaXN0b3J5TGVuZ3RoKSB7XG4gICAgICBsaW5lcy5wb3AoKTtcbiAgICB9XG4gICAgdXBkYXRlTGluZXMoKTtcbiAgfTtcblxuICBmdW5jdGlvbiB1cGRhdGVMaW5lcygpIHtcbiAgICB2YXIgdGV4dCA9ICcnO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtYmVyT2ZMaW5lczsgaSsrKSB7XG4gICAgICB2YXIgbGluZSA9IGxpbmVzW2xpbmVzLmxlbmd0aCAtIDEgLSBpXTtcbiAgICAgIGxpbmUgPSBsaW5lIHx8ICcnO1xuICAgICAgdGV4dCArPSBsaW5lO1xuICAgICAgdGV4dCArPSBcIjxiciAvPlwiO1xuICAgIH1cblxuICAgIHRleHRTcGFuLmlubmVySFRNTCA9IHRleHQ7XG4gIH07XG5cbiAgZnVuY3Rpb24gaGlkZSgpIHtcbiAgICBkaXYuaGlkZGVuID0gdHJ1ZTtcbiAgICBpbnB1dC5ibHVyKCk7XG4gICAgaWYgKG9uYmx1ciAhPSBudWxsKSB7XG4gICAgICBvbmJsdXIoKTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gc2hvdygpIHtcbiAgICBkaXYuaGlkZGVuID0gZmFsc2U7XG4gICAgaW5wdXQudmFsdWUgPSBpbnB1dC52YWx1ZS5zcGxpdCgnYCcpLmpvaW4oJycpO1xuICAgIGlucHV0LmZvY3VzKCk7XG4gICAgaWYgKG9uZm9jdXMgIT0gbnVsbCkge1xuICAgICAgb25mb2N1cygpO1xuICAgIH1cbiAgfTtcblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBmdW5jdGlvbihlKSB7XG4gICAgdmFyIGtleSA9IGtleWNvZGUoZSk7XG4gICAgaWYgKGtleSA9PT0gJ2AnKSB7XG4gICAgICBpZiAoZGl2LmhpZGRlbikge1xuICAgICAgICBzaG93KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBoaWRlKCk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICAvLyBIaWRkZW4gYnkgZGVmYXVsdFxuICBkaXYuaGlkZGVuID0gdHJ1ZTtcblxuICBmdW5jdGlvbiBsb2FkQ29tbWFuZHModmFsdWUpIHtcbiAgICBmb3IgKHZhciBpIGluIHZhbHVlKSB7XG4gICAgICBjb21tYW5kc1tpXSA9IHZhbHVlW2ldO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4ge1xuICAgIGNvbW1hbmRzOiBjb21tYW5kcyxcbiAgICBsb2FkQ29tbWFuZHM6IGxvYWRDb21tYW5kc1xuICB9O1xufTsiLCJ2YXIgVEhSRUUgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snVEhSRUUnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ1RIUkVFJ10gOiBudWxsKTtcblxudmFyIHRleHR1cmVMb2FkZXIgPSBuZXcgVEhSRUUuVGV4dHVyZUxvYWRlcigpO1xuXG5mdW5jdGlvbiBsb2FkTGFtYmVydE1hdGVyaWFsKHNvdXJjZSkge1xuICB2YXIgdGV4dHVyZSA9IHRleHR1cmVMb2FkZXIubG9hZChzb3VyY2UpO1xuICB0ZXh0dXJlLndyYXBTID0gVEhSRUUuUmVwZWF0V3JhcHBpbmc7XG4gIHRleHR1cmUud3JhcFQgPSBUSFJFRS5SZXBlYXRXcmFwcGluZztcblxuICByZXR1cm4gbmV3IFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwoe1xuICAgIG1hcDogdGV4dHVyZVxuICB9KTtcbn07XG5cbmZ1bmN0aW9uIGxvYWRCYXNpY01hdGVyaWFsKHNvdXJjZSkge1xuICB2YXIgdGV4dHVyZSA9IHRleHR1cmVMb2FkZXIubG9hZChzb3VyY2UpO1xuICB0ZXh0dXJlLndyYXBTID0gVEhSRUUuUmVwZWF0V3JhcHBpbmc7XG4gIHRleHR1cmUud3JhcFQgPSBUSFJFRS5SZXBlYXRXcmFwcGluZztcblxuICB0ZXh0dXJlLm1hZ0ZpbHRlciA9IFRIUkVFLk5lYXJlc3RGaWx0ZXI7XG4gIFxuICByZXR1cm4gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICBtYXA6IHRleHR1cmVcbiAgfSk7XG59O1xuXG5tYXRlcmlhbHMgPSB7XG4gICdwbGFjZWhvbGRlcic6IGxvYWRCYXNpY01hdGVyaWFsKCdpbWFnZXMvcGxhY2Vob2xkZXIucG5nJylcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBtYXRlcmlhbHM7IiwidmFyIGFycmF5VXRpbHMgPSByZXF1aXJlKCcuLi91dGlscy9hcnJheXV0aWxzJyk7XG52YXIga2V5Y29kZSA9IHJlcXVpcmUoJ2tleWNvZGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gIFwidXNlIHN0cmljdFwiO1xuXG4gIHZhciBtb3VzZSA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gIHZhciBtb3VzZWRvd25zID0gW107XG4gIHZhciBtb3VzZXVwcyA9IFtdO1xuICB2YXIgbW91c2Vtb3ZlID0gZmFsc2U7XG4gIHZhciBtb3VzZWhvbGRzID0gW107XG4gIHZhciBrZXlkb3ducyA9IFtdO1xuICB2YXIga2V5dXBzID0gW107XG4gIHZhciBrZXlob2xkcyA9IFtdO1xuICB2YXIgbW91c2Vkb3duVGltZXMgPSB7fTtcbiAgdmFyIGNsaWNrVGltZSA9IDE1MDtcbiAgdmFyIG1vdXNlY2xpY2tzID0gW107XG5cbiAgZWxlbWVudC5mb2N1cygpO1xuXG4gIGZ1bmN0aW9uIG9uTW91c2VNb3ZlKGUpIHtcbiAgICBtb3VzZW1vdmUgPSB0cnVlO1xuICAgIG1vdXNlLnggPSBlLmNsaWVudFg7XG4gICAgbW91c2UueSA9IGUuY2xpZW50WTtcbiAgfTtcblxuICBmdW5jdGlvbiBvbk1vdXNlRG93bihlKSB7XG4gICAgbW91c2Vkb3ducy5wdXNoKGUuYnV0dG9uKTtcbiAgICBtb3VzZWRvd25UaW1lc1tlLmJ1dHRvbl0gPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICBpZiAoIWFycmF5VXRpbHMuaW5jbHVkZXMobW91c2Vob2xkcywgZS5idXR0b24pKSB7XG4gICAgICBtb3VzZWhvbGRzLnB1c2goZS5idXR0b24pO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBvbk1vdXNlVXAoZSkge1xuICAgIGlmICghIW1vdXNlZG93blRpbWVzW2UuYnV0dG9uXSkge1xuICAgICAgdmFyIGRpZmYgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIG1vdXNlZG93blRpbWVzW2UuYnV0dG9uXTtcbiAgICAgIGlmIChkaWZmIDwgY2xpY2tUaW1lKSB7XG4gICAgICAgIG1vdXNlY2xpY2tzLnB1c2goZS5idXR0b24pO1xuICAgICAgfVxuICAgIH1cbiAgICBtb3VzZXVwcy5wdXNoKGUuYnV0dG9uKTtcbiAgICBhcnJheVV0aWxzLnJlbW92ZShtb3VzZWhvbGRzLCBlLmJ1dHRvbik7XG4gIH07XG5cbiAgZnVuY3Rpb24gb25LZXlEb3duKGUpIHtcbiAgICB2YXIga2V5ID0ga2V5Y29kZShlKTtcbiAgICBrZXlkb3ducy5wdXNoKGtleSk7XG4gICAgaWYgKCFhcnJheVV0aWxzLmluY2x1ZGVzKGtleWhvbGRzLCBrZXkpKSB7XG4gICAgICBrZXlob2xkcy5wdXNoKGtleSk7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIG9uS2V5VXAoZSkge1xuICAgIHZhciBrZXkgPSBrZXljb2RlKGUpO1xuICAgIGtleXVwcy5wdXNoKGtleSk7XG4gICAgYXJyYXlVdGlscy5yZW1vdmUoa2V5aG9sZHMsIGtleSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgbW91c2Vkb3ducyA9IFtdO1xuICAgIG1vdXNldXBzID0gW107XG4gICAgbW91c2Vtb3ZlID0gZmFsc2U7XG4gICAga2V5ZG93bnMgPSBbXTtcbiAgICBrZXl1cHMgPSBbXTtcbiAgICBtb3VzZWNsaWNrcyA9IFtdO1xuICB9XG5cbiAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBvbk1vdXNlRG93bik7XG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgb25Nb3VzZU1vdmUpO1xuICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBvbk1vdXNlVXApO1xuICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleURvd24pO1xuICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgb25LZXlVcCk7XG5cbiAgcmV0dXJuIHtcbiAgICBtb3VzZTogbW91c2UsXG5cbiAgICBtb3VzZURvd246IGZ1bmN0aW9uKGJ1dHRvbikge1xuICAgICAgaWYgKGJ1dHRvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBtb3VzZWRvd25zLmxlbmd0aCA+IDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gYXJyYXlVdGlscy5pbmNsdWRlcyhtb3VzZWRvd25zLCBidXR0b24pO1xuICAgIH0sXG5cbiAgICBtb3VzZVVwOiBmdW5jdGlvbihidXR0b24pIHtcbiAgICAgIGlmIChidXR0b24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gbW91c2V1cHMubGVuZ3RoID4gMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcnJheVV0aWxzLmluY2x1ZGVzKG1vdXNldXBzLCBidXR0b24pO1xuICAgIH0sXG5cbiAgICBtb3VzZUhvbGQ6IGZ1bmN0aW9uKGJ1dHRvbikge1xuICAgICAgaWYgKGJ1dHRvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBtb3VzZWhvbGRzLmxlbmd0aCA+IDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gYXJyYXlVdGlscy5pbmNsdWRlcyhtb3VzZWhvbGRzLCBidXR0b24pO1xuICAgIH0sXG5cbiAgICBtb3VzZUNsaWNrOiBmdW5jdGlvbihidXR0b24pIHtcbiAgICAgIGlmIChidXR0b24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gbW91c2VjbGlja3MubGVuZ3RoID4gMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcnJheVV0aWxzLmluY2x1ZGVzKG1vdXNlY2xpY2tzLCBidXR0b24pO1xuICAgIH0sXG5cbiAgICBrZXlEb3duOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4ga2V5ZG93bnMubGVuZ3RoID4gMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcnJheVV0aWxzLmluY2x1ZGVzKGtleWRvd25zLCBrZXkpO1xuICAgIH0sXG5cbiAgICBrZXlVcDogZnVuY3Rpb24oa2V5KSB7XG4gICAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGtleXVwcy5sZW5ndGggPiAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFycmF5VXRpbHMuaW5jbHVkZXMoa2V5dXBzLCBrZXkpO1xuICAgIH0sXG5cbiAgICBrZXlIb2xkOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4ga2V5aG9sZHMubGVuZ3RoID4gMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcnJheVV0aWxzLmluY2x1ZGVzKGtleWhvbGRzLCBrZXkpO1xuICAgIH0sXG5cbiAgICBtb3VzZU1vdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG1vdXNlbW92ZTtcbiAgICB9LFxuXG4gICAgbGF0ZVRpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgY2xlYXIoKTtcbiAgICB9LFxuXG4gICAgc2NyZWVuVG9WaWV3cG9ydDogZnVuY3Rpb24oc2NyZWVuKSB7XG4gICAgICB2YXIgdmlld3BvcnQgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICAgICAgdmlld3BvcnQueCA9IChzY3JlZW4ueCAvIHdpbmRvdy5pbm5lcldpZHRoKSAqIDIgLSAxO1xuICAgICAgdmlld3BvcnQueSA9IC0oc2NyZWVuLnkgLyB3aW5kb3cuaW5uZXJIZWlnaHQpICogMiArIDE7XG4gICAgICByZXR1cm4gdmlld3BvcnQ7XG4gICAgfVxuICB9O1xufTsiLCIvLyB2YXIgU3RhdHMgPSByZXF1aXJlKCdzdGF0cy5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNjZW5lLCBjYW1lcmEsIGNvbnRhaW5lcikge1xuICB2YXIgcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlcigpO1xuICByZW5kZXJlci5zZXRDbGVhckNvbG9yKDB4MjIyMjIyKTtcbiAgcmVuZGVyZXIuc2V0U2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcblxuICBjb250YWluZXIgPSBjb250YWluZXIgfHwgZG9jdW1lbnQuYm9keTtcbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKHJlbmRlcmVyLmRvbUVsZW1lbnQpO1xuXG4gIHZhciByZW5kZXJlciwgY2FtZXJhO1xuICB2YXIgc3Nhb1Bhc3MsIGVmZmVjdENvbXBvc2VyO1xuXG4gIHZhciBzeXN0ZW0gPSB7fTtcbiAgc3lzdGVtLnJlbmRlcmVyID0gcmVuZGVyZXI7XG5cbiAgLy8gdmFyIHN0YXRzID0gbmV3IFN0YXRzKCk7XG4gIC8vIHN0YXRzLmRvbUVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAvLyBzdGF0cy5kb21FbGVtZW50LnN0eWxlLnJpZ2h0ID0gJzBweCc7XG4gIC8vIHN0YXRzLmRvbUVsZW1lbnQuc3R5bGUuYm90dG9tID0gJzBweCc7XG5cbiAgLy8gZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzdGF0cy5kb21FbGVtZW50KTtcblxuICB2YXIgc3NhbyA9IHRydWU7XG5cbiAgdmFyIGFtYmllbnQgPSBuZXcgVEhSRUUuQW1iaWVudExpZ2h0KG5ldyBUSFJFRS5Db2xvcihcInJnYig2MCUsIDYwJSwgNjAlKVwiKSk7XG4gIHZhciBsaWdodCA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KDB4ZmZmZmZmLCAwLjYpO1xuICBsaWdodC5wb3NpdGlvbi5zZXQoMC44LCAxLCAwLjUpO1xuICBzY2VuZS5hZGQobGlnaHQpO1xuICBzY2VuZS5hZGQoYW1iaWVudCk7XG5cbiAgZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIpO1xuXG4gICAgLy8gc3RhdHMuYmVnaW4oKTtcblxuICAgIGlmIChzc2FvKSB7XG4gICAgICAvLyBSZW5kZXIgZGVwdGggaW50byBkZXB0aFJlbmRlclRhcmdldFxuICAgICAgc2NlbmUub3ZlcnJpZGVNYXRlcmlhbCA9IGRlcHRoTWF0ZXJpYWw7XG4gICAgICByZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSwgZGVwdGhSZW5kZXJUYXJnZXQsIHRydWUpO1xuXG4gICAgICAvLyBSZW5kZXIgcmVuZGVyUGFzcyBhbmQgU1NBTyBzaGFkZXJQYXNzXG4gICAgICBzY2VuZS5vdmVycmlkZU1hdGVyaWFsID0gbnVsbDtcbiAgICAgIGVmZmVjdENvbXBvc2VyLnJlbmRlcigpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7XG4gICAgfVxuXG4gICAgLy8gc3RhdHMuZW5kKCk7XG4gIH07XG5cbiAgZnVuY3Rpb24gb25XaW5kb3dSZXNpemUoKSB7XG4gICAgdmFyIHdpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgdmFyIGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcblxuICAgIGNhbWVyYS5hc3BlY3QgPSB3aWR0aCAvIGhlaWdodDtcbiAgICBjYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xuICAgIHJlbmRlcmVyLnNldFNpemUod2lkdGgsIGhlaWdodCk7XG5cbiAgICAvLyBSZXNpemUgcmVuZGVyVGFyZ2V0c1xuICAgIHNzYW9QYXNzLnVuaWZvcm1zWydzaXplJ10udmFsdWUuc2V0KHdpZHRoLCBoZWlnaHQpO1xuXG4gICAgdmFyIHBpeGVsUmF0aW8gPSByZW5kZXJlci5nZXRQaXhlbFJhdGlvKCk7XG4gICAgdmFyIG5ld1dpZHRoID0gTWF0aC5mbG9vcih3aWR0aCAvIHBpeGVsUmF0aW8pIHx8IDE7XG4gICAgdmFyIG5ld0hlaWdodCA9IE1hdGguZmxvb3IoaGVpZ2h0IC8gcGl4ZWxSYXRpbykgfHwgMTtcbiAgICBkZXB0aFJlbmRlclRhcmdldC5zZXRTaXplKG5ld1dpZHRoLCBuZXdIZWlnaHQpO1xuICAgIGVmZmVjdENvbXBvc2VyLnNldFNpemUobmV3V2lkdGgsIG5ld0hlaWdodCk7XG4gIH1cblxuICBmdW5jdGlvbiBpbml0UG9zdHByb2Nlc3NpbmcoKSB7XG5cbiAgICAvLyBTZXR1cCByZW5kZXIgcGFzc1xuICAgIHZhciByZW5kZXJQYXNzID0gbmV3IFRIUkVFLlJlbmRlclBhc3Moc2NlbmUsIGNhbWVyYSk7XG5cbiAgICAvLyBTZXR1cCBkZXB0aCBwYXNzXG4gICAgdmFyIGRlcHRoU2hhZGVyID0gVEhSRUUuU2hhZGVyTGliW1wiZGVwdGhSR0JBXCJdO1xuICAgIHZhciBkZXB0aFVuaWZvcm1zID0gVEhSRUUuVW5pZm9ybXNVdGlscy5jbG9uZShkZXB0aFNoYWRlci51bmlmb3Jtcyk7XG5cbiAgICBkZXB0aE1hdGVyaWFsID0gbmV3IFRIUkVFLlNoYWRlck1hdGVyaWFsKHtcbiAgICAgIGZyYWdtZW50U2hhZGVyOiBkZXB0aFNoYWRlci5mcmFnbWVudFNoYWRlcixcbiAgICAgIHZlcnRleFNoYWRlcjogZGVwdGhTaGFkZXIudmVydGV4U2hhZGVyLFxuICAgICAgdW5pZm9ybXM6IGRlcHRoVW5pZm9ybXMsXG4gICAgICBibGVuZGluZzogVEhSRUUuTm9CbGVuZGluZ1xuICAgIH0pO1xuXG4gICAgdmFyIHBhcnMgPSB7XG4gICAgICBtaW5GaWx0ZXI6IFRIUkVFLkxpbmVhckZpbHRlcixcbiAgICAgIG1hZ0ZpbHRlcjogVEhSRUUuTGluZWFyRmlsdGVyXG4gICAgfTtcbiAgICBkZXB0aFJlbmRlclRhcmdldCA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlclRhcmdldCh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0LCBwYXJzKTtcblxuICAgIC8vIFNldHVwIFNTQU8gcGFzc1xuICAgIHNzYW9QYXNzID0gbmV3IFRIUkVFLlNoYWRlclBhc3MoVEhSRUUuU1NBT1NoYWRlcik7XG4gICAgc3Nhb1Bhc3MucmVuZGVyVG9TY3JlZW4gPSB0cnVlO1xuICAgIC8vc3Nhb1Bhc3MudW5pZm9ybXNbIFwidERpZmZ1c2VcIiBdLnZhbHVlIHdpbGwgYmUgc2V0IGJ5IFNoYWRlclBhc3NcbiAgICBzc2FvUGFzcy51bmlmb3Jtc1tcInREZXB0aFwiXS52YWx1ZSA9IGRlcHRoUmVuZGVyVGFyZ2V0O1xuICAgIHNzYW9QYXNzLnVuaWZvcm1zWydzaXplJ10udmFsdWUuc2V0KHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpO1xuICAgIHNzYW9QYXNzLnVuaWZvcm1zWydjYW1lcmFOZWFyJ10udmFsdWUgPSBjYW1lcmEubmVhcjtcbiAgICBzc2FvUGFzcy51bmlmb3Jtc1snY2FtZXJhRmFyJ10udmFsdWUgPSBjYW1lcmEuZmFyO1xuICAgIHNzYW9QYXNzLnVuaWZvcm1zWydvbmx5QU8nXS52YWx1ZSA9IGZhbHNlO1xuICAgIHNzYW9QYXNzLnVuaWZvcm1zWydhb0NsYW1wJ10udmFsdWUgPSAxO1xuICAgIHNzYW9QYXNzLnVuaWZvcm1zWydsdW1JbmZsdWVuY2UnXS52YWx1ZSA9IDAuNTtcblxuICAgIC8vIEFkZCBwYXNzIHRvIGVmZmVjdCBjb21wb3NlclxuICAgIGVmZmVjdENvbXBvc2VyID0gbmV3IFRIUkVFLkVmZmVjdENvbXBvc2VyKHJlbmRlcmVyKTtcbiAgICBlZmZlY3RDb21wb3Nlci5hZGRQYXNzKHJlbmRlclBhc3MpO1xuICAgIGVmZmVjdENvbXBvc2VyLmFkZFBhc3Moc3Nhb1Bhc3MpO1xuICB9XG5cbiAgLy8gU2V0IHVwIHJlbmRlciBsb29wXG4gIGluaXRQb3N0cHJvY2Vzc2luZygpO1xuICByZW5kZXIoKTtcblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgb25XaW5kb3dSZXNpemUsIGZhbHNlKTtcblxuICByZXR1cm4gc3lzdGVtO1xufTsiLCJ2YXIgYXJyYXkgPSB7XG4gIGluZGV4T2Y6IGZ1bmN0aW9uKGFycmF5LCBlbGVtZW50KSB7XG4gICAgdmFyIHByZWRpY2F0ZSA9IHR5cGVvZiBlbGVtZW50ID09PSAnZnVuY3Rpb24nID8gZWxlbWVudCA6IGZ1bmN0aW9uKHYpIHtcbiAgICAgIHJldHVybiB2ID09PSBlbGVtZW50O1xuICAgIH07XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocHJlZGljYXRlKGFycmF5W2ldKSkge1xuICAgICAgICByZXR1cm4gaTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xO1xuICB9LFxuXG4gIGluY2x1ZGVzOiBmdW5jdGlvbihhcnJheSwgZWxlbWVudCkge1xuICAgIHJldHVybiB0aGlzLmluZGV4T2YoYXJyYXksIGVsZW1lbnQpICE9PSAtMTtcbiAgfSxcblxuICByZW1vdmU6IGZ1bmN0aW9uKGFycmF5LCBlbGVtZW50KSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5pbmRleE9mKGFycmF5LCBlbGVtZW50KTtcbiAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICBhcnJheS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfSxcblxuICBjbG9uZTogZnVuY3Rpb24oYXJyYXkpIHtcbiAgICB2YXIgY29weSA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvcHlbaV0gPSBhcnJheVtpXTtcbiAgICB9XG4gICAgcmV0dXJuIGNvcHk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYXJyYXk7IiwidmFyIEdyYXZpdHkgPSBmdW5jdGlvbihkaXIsIGF4aXMsIHBvc2l0aXZlKSB7XG4gIHRoaXMuZGlyID0gZGlyIHx8IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gIHRoaXMuYXhpcyA9IGF4aXMgfHwgJyc7XG4gIHRoaXMucG9zaXRpdmUgPSBwb3NpdGl2ZSB8fCAnJztcblxuICB0aGlzLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBHcmF2aXR5KHRoaXMuZGlyLCB0aGlzLmF4aXMsIHRoaXMucG9zaXRpdmUpO1xuICB9O1xuXG4gIHRoaXMuZXF1YWxzID0gZnVuY3Rpb24oZ3Jhdml0eSkge1xuICAgIHJldHVybiB0aGlzLmRpci5lcXVhbHMoZ3Jhdml0eS5kaXIpO1xuICB9O1xuXG4gIHRoaXMuaXNOb25lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlyLmxlbmd0aCgpID09PSAwO1xuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBHcmF2aXR5OyIsInZhciBHcmF2aXR5ID0gcmVxdWlyZSgnLi9ncmF2aXR5Jyk7XG5cbnZhciBncmF2aXRpZXMgPSB7XG4gIG5vbmU6IG5ldyBHcmF2aXR5KCksXG4gIHJpZ2h0OiBuZXcgR3Jhdml0eShuZXcgVEhSRUUuVmVjdG9yMygxLCAwLCAwKS5ub3JtYWxpemUoKSwgJ3gnLCB0cnVlKSxcbiAgbGVmdDogbmV3IEdyYXZpdHkobmV3IFRIUkVFLlZlY3RvcjMoLTEsIDAsIDApLm5vcm1hbGl6ZSgpLCAneCcsIGZhbHNlKSxcbiAgdG9wOiBuZXcgR3Jhdml0eShuZXcgVEhSRUUuVmVjdG9yMygwLCAxLCAwKS5ub3JtYWxpemUoKSwgJ3knLCB0cnVlKSxcbiAgYm90dG9tOiBuZXcgR3Jhdml0eShuZXcgVEhSRUUuVmVjdG9yMygwLCAtMSwgMCkubm9ybWFsaXplKCksICd5JywgZmFsc2UpLFxuICBmcm9udDogbmV3IEdyYXZpdHkobmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMSkubm9ybWFsaXplKCksICd6JywgdHJ1ZSksXG4gIGJhY2s6IG5ldyBHcmF2aXR5KG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKS5ub3JtYWxpemUoKSwgJ3onLCBmYWxzZSlcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBnZXRHcmF2aXR5OiBmdW5jdGlvbihwb3NpdGlvbikge1xuICAgIHZhciBtaW4gPSAxO1xuICAgIHZhciBjbG9zZXN0ID0gbnVsbDtcbiAgICB2YXIgZm9yY2UgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIGZvciAodmFyIGlkIGluIGdyYXZpdGllcykge1xuICAgICAgdmFyIGdyYXZpdHkgPSBncmF2aXRpZXNbaWRdO1xuICAgICAgdmFyIGRvdCA9IGdyYXZpdHkuZGlyLmNsb25lKCkuZG90KHBvc2l0aW9uLmNsb25lKCkubm9ybWFsaXplKCkpO1xuICAgICAgaWYgKGRvdCA8IG1pbikge1xuICAgICAgICBtaW4gPSBkb3Q7XG4gICAgICAgIGNsb3Nlc3QgPSBncmF2aXR5O1xuICAgICAgfVxuXG4gICAgICBpZihkb3QgPCAtIDAuNSkge1xuICAgICAgICB2YXIgcmF0aW8gPSAtMC41IC0gZG90O1xuICAgICAgICBmb3JjZS5hZGQoZ3Jhdml0eS5kaXIuY2xvbmUoKS5tdWx0aXBseVNjYWxhcihyYXRpbykpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBncmF2aXR5ID0gY2xvc2VzdC5jbG9uZSgpO1xuICAgIGdyYXZpdHkuZm9yY2VEaXIgPSBmb3JjZS5ub3JtYWxpemUoKTtcbiAgICByZXR1cm4gZ3Jhdml0eTtcbiAgfVxufTsiLCJ2YXIgY29tcGlsZU1lc2hlciA9IHJlcXVpcmUoJ2dyZWVkeS1tZXNoZXInKTtcbnZhciBuZGFycmF5ID0gcmVxdWlyZSgnbmRhcnJheScpO1xuXG52YXIgbWVzaGVyID0gY29tcGlsZU1lc2hlcih7XG4gIGV4dHJhQXJnczogMSxcbiAgb3JkZXI6IFswLCAxXSxcbiAgYXBwZW5kOiBmdW5jdGlvbihsb194LCBsb195LCBoaV94LCBoaV95LCB2YWwsIHJlc3VsdCkge1xuICAgIHJlc3VsdC5wdXNoKFtcbiAgICAgIFtsb194LCBsb195XSxcbiAgICAgIFtoaV94LCBoaV95XVxuICAgIF0pXG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRhdGEsIGRpbSwgdm94ZWxTaWRlVGV4dHVyZUlkcykge1xuICB2b3hlbFNpZGVUZXh0dXJlSWRzID0gdm94ZWxTaWRlVGV4dHVyZUlkcyB8fCB7fTtcblxuICB2YXIgdmVydGljZXMgPSBbXTtcbiAgdmFyIHN1cmZhY2VzID0gW107XG5cbiAgdmFyIHUsIHYsIGRpbXNELCBkaW1zVSwgZGltc1YsIHRkMCwgdGQxLCBkdiwgZmxpcDtcblxuICAvLyBJbnRlcmF0ZSB0aHJvdWdoIGRpbWVuc2lvbnNcbiAgZm9yICh2YXIgZCA9IDA7IGQgPCAzOyBkKyspIHtcbiAgICB1ID0gKGQgKyAxKSAlIDM7XG4gICAgdiA9IChkICsgMikgJSAzO1xuICAgIGRpbXNEID0gZGltW2RdO1xuICAgIGRpbXNVID0gZGltW3VdO1xuICAgIGRpbXNWID0gZGltW3ZdO1xuICAgIHRkMCA9IGQgKiAyO1xuICAgIHRkMSA9IGQgKiAyICsgMTtcblxuICAgIC8vIEludGVyYXRlIHRocm91Z2ggU2xpY2VzXG4gICAgZmxpcCA9IGZhbHNlO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGltc0Q7IGkrKykge1xuICAgICAgcHJvY2Vzc1NsaWNlKGkpO1xuICAgIH1cblxuXG4gICAgLy8gSW50ZXJhdGUgdGhyb3VnaCBTbGljZXMgZnJvbSBvdGhlciBkaXJcbiAgICBmbGlwID0gdHJ1ZTtcbiAgICBmb3IgKHZhciBpID0gZGltc0QgLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgcHJvY2Vzc1NsaWNlKGkpO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBwcm9jZXNzU2xpY2UoaSkge1xuICAgIHZhciBzbGljZSA9IG5kYXJyYXkoW10sIFtkaW1zVSwgZGltc1ZdKTtcblxuICAgIHZhciBzMCA9IDA7XG4gICAgZHYgPSBmbGlwID8gaSA6IGkgKyAxO1xuXG4gICAgLy9JbnRlcmF0ZSB0aHJvdWdoIHV2XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBkaW1zVTsgaisrKSB7XG4gICAgICB2YXIgczEgPSAwO1xuICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBkaW1zVjsgaysrKSB7XG4gICAgICAgIHZhciBiID0gZ2V0Vm94ZWwoaSwgaiwgaywgZCk7XG4gICAgICAgIGlmICghYikge1xuICAgICAgICAgIHNsaWNlLnNldChqLCBrLCAwKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYjE7XG4gICAgICAgIGlmIChmbGlwKSB7XG4gICAgICAgICAgYjEgPSBpID09PSAwID8gMCA6IGdldFZveGVsKGkgLSAxLCBqLCBrLCBkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBiMSA9IGkgPT09IGRpbXNEIC0gMSA/IDAgOiBnZXRWb3hlbChpICsgMSwgaiwgaywgZCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCEhYjEpIHtcbiAgICAgICAgICBzbGljZS5zZXQoaiwgaywgMCk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHQgPSBnZXRUZXh0dXJlSWQoYiwgZmxpcCA/IHRkMCA6IHRkMSk7XG4gICAgICAgIHNsaWNlLnNldChqLCBrLCB0KTtcbiAgICAgICAgczErKztcbiAgICAgIH1cbiAgICAgIHMwKys7XG4gICAgfVxuXG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgIG1lc2hlcihzbGljZSwgcmVzdWx0KTtcblxuICAgIGlmIChyZXN1bHQubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yICh2YXIgbCA9IDA7IGwgPCByZXN1bHQubGVuZ3RoOyBsKyspIHtcbiAgICAgIHZhciBmID0gcmVzdWx0W2xdO1xuICAgICAgdmFyIGxvID0gZlswXTtcbiAgICAgIHZhciBoaSA9IGZbMV07XG4gICAgICB2YXIgc2l6ZXUgPSBoaVswXSAtIGxvWzBdO1xuICAgICAgdmFyIHNpemV2ID0gaGlbMV0gLSBsb1sxXTtcblxuICAgICAgdmFyIGZ1dnMgPSBbXG4gICAgICAgIFswLCAwXSxcbiAgICAgICAgW3NpemV1LCAwXSxcbiAgICAgICAgW3NpemV1LCBzaXpldl0sXG4gICAgICAgIFswLCBzaXpldl1cbiAgICAgIF07XG5cbiAgICAgIHZhciBjID0gc2xpY2UuZ2V0KGxvWzBdLCBsb1sxXSk7XG5cbiAgICAgIHZhciB2MCA9IFtdO1xuICAgICAgdmFyIHYxID0gW107XG4gICAgICB2YXIgdjIgPSBbXTtcbiAgICAgIHZhciB2MyA9IFtdO1xuXG4gICAgICB2MFtkXSA9IGR2O1xuICAgICAgdjBbdV0gPSBsb1swXTtcbiAgICAgIHYwW3ZdID0gbG9bMV07XG5cbiAgICAgIHYxW2RdID0gZHY7XG4gICAgICB2MVt1XSA9IGhpWzBdO1xuICAgICAgdjFbdl0gPSBsb1sxXTtcblxuICAgICAgdjJbZF0gPSBkdjtcbiAgICAgIHYyW3VdID0gaGlbMF07XG4gICAgICB2Mlt2XSA9IGhpWzFdO1xuXG4gICAgICB2M1tkXSA9IGR2O1xuICAgICAgdjNbdV0gPSBsb1swXTtcbiAgICAgIHYzW3ZdID0gaGlbMV07XG5cbiAgICAgIHZhciB2aW5kZXggPSB2ZXJ0aWNlcy5sZW5ndGg7XG4gICAgICB2ZXJ0aWNlcy5wdXNoKHYwLCB2MSwgdjIsIHYzKTtcbiAgICAgIGlmIChmbGlwKSB7XG4gICAgICAgIHN1cmZhY2VzLnB1c2goe1xuICAgICAgICAgIGZhY2U6IFt2aW5kZXggKyAzLCB2aW5kZXggKyAyLCB2aW5kZXggKyAxLCB2aW5kZXgsIGNdLFxuICAgICAgICAgIHV2OiBbZnV2c1szXSwgZnV2c1syXSwgZnV2c1sxXSwgZnV2c1swXV1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdXJmYWNlcy5wdXNoKHtcbiAgICAgICAgICBmYWNlOiBbdmluZGV4LCB2aW5kZXggKyAxLCB2aW5kZXggKyAyLCB2aW5kZXggKyAzLCBjXSxcbiAgICAgICAgICB1djogW2Z1dnNbMF0sIGZ1dnNbMV0sIGZ1dnNbMl0sIGZ1dnNbM11dXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFZveGVsKGksIGosIGssIGQpIHtcbiAgICBpZiAoZCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGRhdGEoaSwgaiwgayk7XG4gICAgICAvLyByZXR1cm4gZGF0YVtrICsgKGogKyBpICogZGltWzBdKSAqIGRpbVsxXV07XG4gICAgfSBlbHNlIGlmIChkID09PSAxKSB7XG4gICAgICByZXR1cm4gZGF0YShrLCBpLCBqKTtcbiAgICAgIC8vIHJldHVybiBkYXRhW2ogKyAoaSArIGsgKiBkaW1bMF0pICogZGltWzFdXTtcbiAgICB9IGVsc2UgaWYgKGQgPT09IDIpIHtcbiAgICAgIHJldHVybiBkYXRhKGosIGssIGkpO1xuICAgICAgLy8gcmV0dXJuIGRhdGFbaSArIChrICsgaiAqIGRpbVswXSkgKiBkaW1bMV1dO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBnZXRUZXh0dXJlSWQoYiwgc2lkZSkge1xuICAgIGlmICghYikge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgdmFyIG1hcCA9IHZveGVsU2lkZVRleHR1cmVJZHNbYl07XG4gICAgaWYgKG1hcCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gYjtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhzaWRlKTtcbiAgICAvLyBjb25zb2xlLmxvZyhtYXBbc2lkZV0gfHwgYik7XG4gICAgcmV0dXJuIG1hcFtzaWRlXSB8fCBiO1xuICB9O1xuXG4gIHJldHVybiB7XG4gICAgdmVydGljZXM6IHZlcnRpY2VzLFxuICAgIHN1cmZhY2VzOiBzdXJmYWNlc1xuICB9XG59OyIsInZhciBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydUSFJFRSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnVEhSRUUnXSA6IG51bGwpO1xudmFyIGdyYXZpdHlVdGlscyA9IHJlcXVpcmUoJy4vZ3Jhdml0eXV0aWxzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuXG4gIHZhciBtYXAgPSB7fTtcbiAgdmFyIGNvZyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gIHZhciBncmF2aXR5QW1vdW50ID0gMC4wNTtcblxuICBmdW5jdGlvbiBvbkF0dGFjaChvYmplY3QsIGNvbXBvbmVudCkge1xuICAgIGlmKGNvbXBvbmVudC50eXBlID09PSAncmlnaWRCb2R5Jykge1xuICAgICAgbWFwW2NvbXBvbmVudC5faWRdID0gY29tcG9uZW50O1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBvbkRldHRhY2gob2JqZWN0LCBjb21wb25lbnQpIHtcbiAgICBpZihjb21wb25lbnQudHlwZSA9PT0gJ3JpZ2lkQm9keScpIHtcbiAgICAgIGRlbGV0ZSBtYXBbY29tcG9uZW50Ll9pZF07XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIHRpY2soKSB7XG4gICAgdmFyIGJvZGllcyA9IFtdO1xuICAgIHZhciBmaXh0dXJlcyA9IFtdO1xuICAgIGZvciAodmFyIGlkIGluIG1hcCkge1xuICAgICAgdmFyIGJvZHkgPSBtYXBbaWRdO1xuICAgICAgaWYgKGJvZHkuaXNGaXh0dXJlKSB7XG4gICAgICAgIGZpeHR1cmVzLnB1c2goYm9keSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBib2RpZXMucHVzaChib2R5KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJvZGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHJpZ2lkQm9keSA9IGJvZGllc1tpXTtcblxuICAgICAgLy8gQXBwbHkgZ3Jhdml0eVxuICAgICAgdmFyIGdyYXZpdHkgPSBncmF2aXR5VXRpbHMuZ2V0R3Jhdml0eShyaWdpZEJvZHkub2JqZWN0LnBvc2l0aW9uKTtcbiAgICAgIHJpZ2lkQm9keS5ncmF2aXR5ID0gZ3Jhdml0eTtcblxuICAgICAgaWYgKHJpZ2lkQm9keS5ncm91bmRlZCkge1xuICAgICAgICB2YXIgZ3Jhdml0eUZvcmNlID0gZ3Jhdml0eS5kaXIuY2xvbmUoKS5zZXRMZW5ndGgoZ3Jhdml0eUFtb3VudCk7XG4gICAgICAgIHJpZ2lkQm9keS5hcHBseUZvcmNlKGdyYXZpdHlGb3JjZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZ3Jhdml0eUZvcmNlID0gZ3Jhdml0eS5mb3JjZURpci5jbG9uZSgpLnNldExlbmd0aChncmF2aXR5QW1vdW50KTtcbiAgICAgICAgcmlnaWRCb2R5LmFwcGx5Rm9yY2UoZ3Jhdml0eUZvcmNlKTtcbiAgICAgIH1cblxuXG4gICAgICAvLyBBcHBseSBhY2NlbGVyYXRpb24gdG8gdmVsb2NpdHlcbiAgICAgIHJpZ2lkQm9keS52ZWxvY2l0eS5hZGQocmlnaWRCb2R5LmFjY2VsZXJhdGlvbik7XG4gICAgICByaWdpZEJvZHkudmVsb2NpdHkubXVsdGlwbHlTY2FsYXIocmlnaWRCb2R5LmZyaWN0aW9uKTtcblxuICAgICAgcmlnaWRCb2R5Lmdyb3VuZGVkID0gZmFsc2U7XG5cbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZml4dHVyZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgdmFyIGZpeHR1cmUgPSBmaXh0dXJlc1tqXTtcblxuICAgICAgICB2YXIgdmVsb2NpdGllcyA9IHtcbiAgICAgICAgICAneCc6IG5ldyBUSFJFRS5WZWN0b3IzKHJpZ2lkQm9keS52ZWxvY2l0eS54LCAwLCAwKSxcbiAgICAgICAgICAneSc6IG5ldyBUSFJFRS5WZWN0b3IzKDAsIHJpZ2lkQm9keS52ZWxvY2l0eS55LCAwKSxcbiAgICAgICAgICAneic6IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIHJpZ2lkQm9keS52ZWxvY2l0eS56KVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHBvc2l0aW9uID0gcmlnaWRCb2R5Lm9iamVjdC5wb3NpdGlvbi5jbG9uZSgpO1xuICAgICAgICBmb3IgKHZhciBheGlzIGluIHZlbG9jaXRpZXMpIHtcbiAgICAgICAgICB2YXIgdiA9IHZlbG9jaXRpZXNbYXhpc107XG4gICAgICAgICAgdmFyIHJheWNhc3RlciA9IG5ldyBUSFJFRS5SYXljYXN0ZXIoXG4gICAgICAgICAgICBwb3NpdGlvbixcbiAgICAgICAgICAgIHYuY2xvbmUoKS5ub3JtYWxpemUoKSxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICB2Lmxlbmd0aCgpICsgMC41XG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHZhciBpbnRlcnNlY3RzID0gcmF5Y2FzdGVyLmludGVyc2VjdE9iamVjdChmaXh0dXJlLm9iamVjdCwgdHJ1ZSk7XG4gICAgICAgICAgaWYgKGludGVyc2VjdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdmFyIGludGVyc2VjdCA9IGludGVyc2VjdHNbMF07XG4gICAgICAgICAgICB2YXIgbWFnID0gaW50ZXJzZWN0LmRpc3RhbmNlIC0gMC41O1xuICAgICAgICAgICAgcmlnaWRCb2R5LnZlbG9jaXR5W2F4aXNdID0gcmlnaWRCb2R5LnZlbG9jaXR5W2F4aXNdID4gMCA/IG1hZyA6IC1tYWc7XG4gICAgICAgICAgICBpZiAoYXhpcyA9PT0gZ3Jhdml0eS5heGlzKSB7XG4gICAgICAgICAgICAgIHJpZ2lkQm9keS5ncm91bmRlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcG9zaXRpb24uYWRkKHYpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEFwcGx5IHZlbG9jaXR5XG4gICAgICByaWdpZEJvZHkub2JqZWN0LnBvc2l0aW9uLmFkZChyaWdpZEJvZHkudmVsb2NpdHkpO1xuXG4gICAgICAvLyBDbGVhciBhY2NlbGVyYXRpb25cbiAgICAgIHJpZ2lkQm9keS5hY2NlbGVyYXRpb24uc2V0KDAsIDAsIDApO1xuICAgIH1cbiAgfTtcblxuICB2YXIgcGh5c2ljcyA9IHtcbiAgICBvbkF0dGFjaDogb25BdHRhY2gsXG4gICAgb25EZXR0YWNoOiBvbkRldHRhY2gsXG4gICAgdGljazogdGljayxcbiAgICBhcHA6IG51bGxcbiAgfTtcblxuICByZXR1cm4gcGh5c2ljcztcbn07IiwiLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8ZmVyb3NzQGZlcm9zcy5vcmc+IDxodHRwOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuXG52YXIgYmFzZTY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJylcbnZhciBpZWVlNzU0ID0gcmVxdWlyZSgnaWVlZTc1NCcpXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoJ2lzLWFycmF5JylcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IFNsb3dCdWZmZXJcbmV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMgPSA1MFxuQnVmZmVyLnBvb2xTaXplID0gODE5MiAvLyBub3QgdXNlZCBieSB0aGlzIGltcGxlbWVudGF0aW9uXG5cbnZhciByb290UGFyZW50ID0ge31cblxuLyoqXG4gKiBJZiBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgOlxuICogICA9PT0gdHJ1ZSAgICBVc2UgVWludDhBcnJheSBpbXBsZW1lbnRhdGlvbiAoZmFzdGVzdClcbiAqICAgPT09IGZhbHNlICAgVXNlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiAobW9zdCBjb21wYXRpYmxlLCBldmVuIElFNilcbiAqXG4gKiBCcm93c2VycyB0aGF0IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGFyZSBJRSAxMCssIEZpcmVmb3ggNCssIENocm9tZSA3KywgU2FmYXJpIDUuMSssXG4gKiBPcGVyYSAxMS42KywgaU9TIDQuMisuXG4gKlxuICogRHVlIHRvIHZhcmlvdXMgYnJvd3NlciBidWdzLCBzb21ldGltZXMgdGhlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiB3aWxsIGJlIHVzZWQgZXZlblxuICogd2hlbiB0aGUgYnJvd3NlciBzdXBwb3J0cyB0eXBlZCBhcnJheXMuXG4gKlxuICogTm90ZTpcbiAqXG4gKiAgIC0gRmlyZWZveCA0LTI5IGxhY2tzIHN1cHBvcnQgZm9yIGFkZGluZyBuZXcgcHJvcGVydGllcyB0byBgVWludDhBcnJheWAgaW5zdGFuY2VzLFxuICogICAgIFNlZTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4LlxuICpcbiAqICAgLSBTYWZhcmkgNS03IGxhY2tzIHN1cHBvcnQgZm9yIGNoYW5naW5nIHRoZSBgT2JqZWN0LnByb3RvdHlwZS5jb25zdHJ1Y3RvcmAgcHJvcGVydHlcbiAqICAgICBvbiBvYmplY3RzLlxuICpcbiAqICAgLSBDaHJvbWUgOS0xMCBpcyBtaXNzaW5nIHRoZSBgVHlwZWRBcnJheS5wcm90b3R5cGUuc3ViYXJyYXlgIGZ1bmN0aW9uLlxuICpcbiAqICAgLSBJRTEwIGhhcyBhIGJyb2tlbiBgVHlwZWRBcnJheS5wcm90b3R5cGUuc3ViYXJyYXlgIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgYXJyYXlzIG9mXG4gKiAgICAgaW5jb3JyZWN0IGxlbmd0aCBpbiBzb21lIHNpdHVhdGlvbnMuXG5cbiAqIFdlIGRldGVjdCB0aGVzZSBidWdneSBicm93c2VycyBhbmQgc2V0IGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGAgdG8gYGZhbHNlYCBzbyB0aGV5XG4gKiBnZXQgdGhlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiwgd2hpY2ggaXMgc2xvd2VyIGJ1dCBiZWhhdmVzIGNvcnJlY3RseS5cbiAqL1xuQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgPSAoZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBCYXIgKCkge31cbiAgdHJ5IHtcbiAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkoMSlcbiAgICBhcnIuZm9vID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfVxuICAgIGFyci5jb25zdHJ1Y3RvciA9IEJhclxuICAgIHJldHVybiBhcnIuZm9vKCkgPT09IDQyICYmIC8vIHR5cGVkIGFycmF5IGluc3RhbmNlcyBjYW4gYmUgYXVnbWVudGVkXG4gICAgICAgIGFyci5jb25zdHJ1Y3RvciA9PT0gQmFyICYmIC8vIGNvbnN0cnVjdG9yIGNhbiBiZSBzZXRcbiAgICAgICAgdHlwZW9mIGFyci5zdWJhcnJheSA9PT0gJ2Z1bmN0aW9uJyAmJiAvLyBjaHJvbWUgOS0xMCBsYWNrIGBzdWJhcnJheWBcbiAgICAgICAgYXJyLnN1YmFycmF5KDEsIDEpLmJ5dGVMZW5ndGggPT09IDAgLy8gaWUxMCBoYXMgYnJva2VuIGBzdWJhcnJheWBcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59KSgpXG5cbmZ1bmN0aW9uIGtNYXhMZW5ndGggKCkge1xuICByZXR1cm4gQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRcbiAgICA/IDB4N2ZmZmZmZmZcbiAgICA6IDB4M2ZmZmZmZmZcbn1cblxuLyoqXG4gKiBDbGFzczogQnVmZmVyXG4gKiA9PT09PT09PT09PT09XG4gKlxuICogVGhlIEJ1ZmZlciBjb25zdHJ1Y3RvciByZXR1cm5zIGluc3RhbmNlcyBvZiBgVWludDhBcnJheWAgdGhhdCBhcmUgYXVnbWVudGVkXG4gKiB3aXRoIGZ1bmN0aW9uIHByb3BlcnRpZXMgZm9yIGFsbCB0aGUgbm9kZSBgQnVmZmVyYCBBUEkgZnVuY3Rpb25zLiBXZSB1c2VcbiAqIGBVaW50OEFycmF5YCBzbyB0aGF0IHNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0IHJldHVybnNcbiAqIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIEJ5IGF1Z21lbnRpbmcgdGhlIGluc3RhbmNlcywgd2UgY2FuIGF2b2lkIG1vZGlmeWluZyB0aGUgYFVpbnQ4QXJyYXlgXG4gKiBwcm90b3R5cGUuXG4gKi9cbmZ1bmN0aW9uIEJ1ZmZlciAoYXJnKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBCdWZmZXIpKSB7XG4gICAgLy8gQXZvaWQgZ29pbmcgdGhyb3VnaCBhbiBBcmd1bWVudHNBZGFwdG9yVHJhbXBvbGluZSBpbiB0aGUgY29tbW9uIGNhc2UuXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSByZXR1cm4gbmV3IEJ1ZmZlcihhcmcsIGFyZ3VtZW50c1sxXSlcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcihhcmcpXG4gIH1cblxuICB0aGlzLmxlbmd0aCA9IDBcbiAgdGhpcy5wYXJlbnQgPSB1bmRlZmluZWRcblxuICAvLyBDb21tb24gY2FzZS5cbiAgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSB7XG4gICAgcmV0dXJuIGZyb21OdW1iZXIodGhpcywgYXJnKVxuICB9XG5cbiAgLy8gU2xpZ2h0bHkgbGVzcyBjb21tb24gY2FzZS5cbiAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGZyb21TdHJpbmcodGhpcywgYXJnLCBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6ICd1dGY4JylcbiAgfVxuXG4gIC8vIFVudXN1YWwuXG4gIHJldHVybiBmcm9tT2JqZWN0KHRoaXMsIGFyZylcbn1cblxuZnVuY3Rpb24gZnJvbU51bWJlciAodGhhdCwgbGVuZ3RoKSB7XG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGggPCAwID8gMCA6IGNoZWNrZWQobGVuZ3RoKSB8IDApXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGF0W2ldID0gMFxuICAgIH1cbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tU3RyaW5nICh0aGF0LCBzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnIHx8IGVuY29kaW5nID09PSAnJykgZW5jb2RpbmcgPSAndXRmOCdcblxuICAvLyBBc3N1bXB0aW9uOiBieXRlTGVuZ3RoKCkgcmV0dXJuIHZhbHVlIGlzIGFsd2F5cyA8IGtNYXhMZW5ndGguXG4gIHZhciBsZW5ndGggPSBieXRlTGVuZ3RoKHN0cmluZywgZW5jb2RpbmcpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuXG4gIHRoYXQud3JpdGUoc3RyaW5nLCBlbmNvZGluZylcbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbU9iamVjdCAodGhhdCwgb2JqZWN0KSB7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIob2JqZWN0KSkgcmV0dXJuIGZyb21CdWZmZXIodGhhdCwgb2JqZWN0KVxuXG4gIGlmIChpc0FycmF5KG9iamVjdCkpIHJldHVybiBmcm9tQXJyYXkodGhhdCwgb2JqZWN0KVxuXG4gIGlmIChvYmplY3QgPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ211c3Qgc3RhcnQgd2l0aCBudW1iZXIsIGJ1ZmZlciwgYXJyYXkgb3Igc3RyaW5nJylcbiAgfVxuXG4gIGlmICh0eXBlb2YgQXJyYXlCdWZmZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKG9iamVjdC5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgcmV0dXJuIGZyb21UeXBlZEFycmF5KHRoYXQsIG9iamVjdClcbiAgICB9XG4gICAgaWYgKG9iamVjdCBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICByZXR1cm4gZnJvbUFycmF5QnVmZmVyKHRoYXQsIG9iamVjdClcbiAgICB9XG4gIH1cblxuICBpZiAob2JqZWN0Lmxlbmd0aCkgcmV0dXJuIGZyb21BcnJheUxpa2UodGhhdCwgb2JqZWN0KVxuXG4gIHJldHVybiBmcm9tSnNvbk9iamVjdCh0aGF0LCBvYmplY3QpXG59XG5cbmZ1bmN0aW9uIGZyb21CdWZmZXIgKHRoYXQsIGJ1ZmZlcikge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChidWZmZXIubGVuZ3RoKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcbiAgYnVmZmVyLmNvcHkodGhhdCwgMCwgMCwgbGVuZ3RoKVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXkgKHRoYXQsIGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICB0aGF0W2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG4vLyBEdXBsaWNhdGUgb2YgZnJvbUFycmF5KCkgdG8ga2VlcCBmcm9tQXJyYXkoKSBtb25vbW9ycGhpYy5cbmZ1bmN0aW9uIGZyb21UeXBlZEFycmF5ICh0aGF0LCBhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuICAvLyBUcnVuY2F0aW5nIHRoZSBlbGVtZW50cyBpcyBwcm9iYWJseSBub3Qgd2hhdCBwZW9wbGUgZXhwZWN0IGZyb20gdHlwZWRcbiAgLy8gYXJyYXlzIHdpdGggQllURVNfUEVSX0VMRU1FTlQgPiAxIGJ1dCBpdCdzIGNvbXBhdGlibGUgd2l0aCB0aGUgYmVoYXZpb3JcbiAgLy8gb2YgdGhlIG9sZCBCdWZmZXIgY29uc3RydWN0b3IuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICB0aGF0W2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlCdWZmZXIgKHRoYXQsIGFycmF5KSB7XG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlLCBmb3IgYmVzdCBwZXJmb3JtYW5jZVxuICAgIGFycmF5LmJ5dGVMZW5ndGhcbiAgICB0aGF0ID0gQnVmZmVyLl9hdWdtZW50KG5ldyBVaW50OEFycmF5KGFycmF5KSlcbiAgfSBlbHNlIHtcbiAgICAvLyBGYWxsYmFjazogUmV0dXJuIGFuIG9iamVjdCBpbnN0YW5jZSBvZiB0aGUgQnVmZmVyIGNsYXNzXG4gICAgdGhhdCA9IGZyb21UeXBlZEFycmF5KHRoYXQsIG5ldyBVaW50OEFycmF5KGFycmF5KSlcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlMaWtlICh0aGF0LCBhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuLy8gRGVzZXJpYWxpemUgeyB0eXBlOiAnQnVmZmVyJywgZGF0YTogWzEsMiwzLC4uLl0gfSBpbnRvIGEgQnVmZmVyIG9iamVjdC5cbi8vIFJldHVybnMgYSB6ZXJvLWxlbmd0aCBidWZmZXIgZm9yIGlucHV0cyB0aGF0IGRvbid0IGNvbmZvcm0gdG8gdGhlIHNwZWMuXG5mdW5jdGlvbiBmcm9tSnNvbk9iamVjdCAodGhhdCwgb2JqZWN0KSB7XG4gIHZhciBhcnJheVxuICB2YXIgbGVuZ3RoID0gMFxuXG4gIGlmIChvYmplY3QudHlwZSA9PT0gJ0J1ZmZlcicgJiYgaXNBcnJheShvYmplY3QuZGF0YSkpIHtcbiAgICBhcnJheSA9IG9iamVjdC5kYXRhXG4gICAgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB9XG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIHRoYXRbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGFsbG9jYXRlICh0aGF0LCBsZW5ndGgpIHtcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2UsIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgdGhhdCA9IEJ1ZmZlci5fYXVnbWVudChuZXcgVWludDhBcnJheShsZW5ndGgpKVxuICB9IGVsc2Uge1xuICAgIC8vIEZhbGxiYWNrOiBSZXR1cm4gYW4gb2JqZWN0IGluc3RhbmNlIG9mIHRoZSBCdWZmZXIgY2xhc3NcbiAgICB0aGF0Lmxlbmd0aCA9IGxlbmd0aFxuICAgIHRoYXQuX2lzQnVmZmVyID0gdHJ1ZVxuICB9XG5cbiAgdmFyIGZyb21Qb29sID0gbGVuZ3RoICE9PSAwICYmIGxlbmd0aCA8PSBCdWZmZXIucG9vbFNpemUgPj4+IDFcbiAgaWYgKGZyb21Qb29sKSB0aGF0LnBhcmVudCA9IHJvb3RQYXJlbnRcblxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBjaGVja2VkIChsZW5ndGgpIHtcbiAgLy8gTm90ZTogY2Fubm90IHVzZSBgbGVuZ3RoIDwga01heExlbmd0aGAgaGVyZSBiZWNhdXNlIHRoYXQgZmFpbHMgd2hlblxuICAvLyBsZW5ndGggaXMgTmFOICh3aGljaCBpcyBvdGhlcndpc2UgY29lcmNlZCB0byB6ZXJvLilcbiAgaWYgKGxlbmd0aCA+PSBrTWF4TGVuZ3RoKCkpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byBhbGxvY2F0ZSBCdWZmZXIgbGFyZ2VyIHRoYW4gbWF4aW11bSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAnc2l6ZTogMHgnICsga01heExlbmd0aCgpLnRvU3RyaW5nKDE2KSArICcgYnl0ZXMnKVxuICB9XG4gIHJldHVybiBsZW5ndGggfCAwXG59XG5cbmZ1bmN0aW9uIFNsb3dCdWZmZXIgKHN1YmplY3QsIGVuY29kaW5nKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBTbG93QnVmZmVyKSkgcmV0dXJuIG5ldyBTbG93QnVmZmVyKHN1YmplY3QsIGVuY29kaW5nKVxuXG4gIHZhciBidWYgPSBuZXcgQnVmZmVyKHN1YmplY3QsIGVuY29kaW5nKVxuICBkZWxldGUgYnVmLnBhcmVudFxuICByZXR1cm4gYnVmXG59XG5cbkJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uIGlzQnVmZmVyIChiKSB7XG4gIHJldHVybiAhIShiICE9IG51bGwgJiYgYi5faXNCdWZmZXIpXG59XG5cbkJ1ZmZlci5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAoYSwgYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihhKSB8fCAhQnVmZmVyLmlzQnVmZmVyKGIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIG11c3QgYmUgQnVmZmVycycpXG4gIH1cblxuICBpZiAoYSA9PT0gYikgcmV0dXJuIDBcblxuICB2YXIgeCA9IGEubGVuZ3RoXG4gIHZhciB5ID0gYi5sZW5ndGhcblxuICB2YXIgaSA9IDBcbiAgdmFyIGxlbiA9IE1hdGgubWluKHgsIHkpXG4gIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIGJyZWFrXG5cbiAgICArK2lcbiAgfVxuXG4gIGlmIChpICE9PSBsZW4pIHtcbiAgICB4ID0gYVtpXVxuICAgIHkgPSBiW2ldXG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gaXNFbmNvZGluZyAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgIGNhc2UgJ3Jhdyc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQgKGxpc3QsIGxlbmd0aCkge1xuICBpZiAoIWlzQXJyYXkobGlzdCkpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2xpc3QgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzLicpXG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoMClcbiAgfVxuXG4gIHZhciBpXG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGxlbmd0aCA9IDBcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgbGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1ZiA9IG5ldyBCdWZmZXIobGVuZ3RoKVxuICB2YXIgcG9zID0gMFxuICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBpdGVtID0gbGlzdFtpXVxuICAgIGl0ZW0uY29weShidWYsIHBvcylcbiAgICBwb3MgKz0gaXRlbS5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKSBzdHJpbmcgPSAnJyArIHN0cmluZ1xuXG4gIHZhciBsZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGlmIChsZW4gPT09IDApIHJldHVybiAwXG5cbiAgLy8gVXNlIGEgZm9yIGxvb3AgdG8gYXZvaWQgcmVjdXJzaW9uXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgLy8gRGVwcmVjYXRlZFxuICAgICAgY2FzZSAncmF3JzpcbiAgICAgIGNhc2UgJ3Jhd3MnOlxuICAgICAgICByZXR1cm4gbGVuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gbGVuICogMlxuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGxlbiA+Pj4gMVxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgcmV0dXJuIHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoIC8vIGFzc3VtZSB1dGY4XG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhcblxuLy8gcHJlLXNldCBmb3IgdmFsdWVzIHRoYXQgbWF5IGV4aXN0IGluIHRoZSBmdXR1cmVcbkJ1ZmZlci5wcm90b3R5cGUubGVuZ3RoID0gdW5kZWZpbmVkXG5CdWZmZXIucHJvdG90eXBlLnBhcmVudCA9IHVuZGVmaW5lZFxuXG5mdW5jdGlvbiBzbG93VG9TdHJpbmcgKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG5cbiAgc3RhcnQgPSBzdGFydCB8IDBcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgfHwgZW5kID09PSBJbmZpbml0eSA/IHRoaXMubGVuZ3RoIDogZW5kIHwgMFxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG4gIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmIChlbmQgPD0gc3RhcnQpIHJldHVybiAnJ1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGJpbmFyeVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdXRmMTZsZVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9IChlbmNvZGluZyArICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGggfCAwXG4gIGlmIChsZW5ndGggPT09IDApIHJldHVybiAnJ1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCAwLCBsZW5ndGgpXG4gIHJldHVybiBzbG93VG9TdHJpbmcuYXBwbHkodGhpcywgYXJndW1lbnRzKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIGVxdWFscyAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYikgPT09IDBcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gaW5zcGVjdCAoKSB7XG4gIHZhciBzdHIgPSAnJ1xuICB2YXIgbWF4ID0gZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFU1xuICBpZiAodGhpcy5sZW5ndGggPiAwKSB7XG4gICAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5tYXRjaCgvLnsyfS9nKS5qb2luKCcgJylcbiAgICBpZiAodGhpcy5sZW5ndGggPiBtYXgpIHN0ciArPSAnIC4uLiAnXG4gIH1cbiAgcmV0dXJuICc8QnVmZmVyICcgKyBzdHIgKyAnPidcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gMFxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYilcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gaW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0KSB7XG4gIGlmIChieXRlT2Zmc2V0ID4gMHg3ZmZmZmZmZikgYnl0ZU9mZnNldCA9IDB4N2ZmZmZmZmZcbiAgZWxzZSBpZiAoYnl0ZU9mZnNldCA8IC0weDgwMDAwMDAwKSBieXRlT2Zmc2V0ID0gLTB4ODAwMDAwMDBcbiAgYnl0ZU9mZnNldCA+Pj0gMFxuXG4gIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xXG4gIGlmIChieXRlT2Zmc2V0ID49IHRoaXMubGVuZ3RoKSByZXR1cm4gLTFcblxuICAvLyBOZWdhdGl2ZSBvZmZzZXRzIHN0YXJ0IGZyb20gdGhlIGVuZCBvZiB0aGUgYnVmZmVyXG4gIGlmIChieXRlT2Zmc2V0IDwgMCkgYnl0ZU9mZnNldCA9IE1hdGgubWF4KHRoaXMubGVuZ3RoICsgYnl0ZU9mZnNldCwgMClcblxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xIC8vIHNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nIGFsd2F5cyBmYWlsc1xuICAgIHJldHVybiBTdHJpbmcucHJvdG90eXBlLmluZGV4T2YuY2FsbCh0aGlzLCB2YWwsIGJ5dGVPZmZzZXQpXG4gIH1cbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcih2YWwpKSB7XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQpXG4gIH1cbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwodGhpcywgdmFsLCBieXRlT2Zmc2V0KVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKHRoaXMsIFsgdmFsIF0sIGJ5dGVPZmZzZXQpXG4gIH1cblxuICBmdW5jdGlvbiBhcnJheUluZGV4T2YgKGFyciwgdmFsLCBieXRlT2Zmc2V0KSB7XG4gICAgdmFyIGZvdW5kSW5kZXggPSAtMVxuICAgIGZvciAodmFyIGkgPSAwOyBieXRlT2Zmc2V0ICsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFycltieXRlT2Zmc2V0ICsgaV0gPT09IHZhbFtmb3VuZEluZGV4ID09PSAtMSA/IDAgOiBpIC0gZm91bmRJbmRleF0pIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggPT09IC0xKSBmb3VuZEluZGV4ID0gaVxuICAgICAgICBpZiAoaSAtIGZvdW5kSW5kZXggKyAxID09PSB2YWwubGVuZ3RoKSByZXR1cm4gYnl0ZU9mZnNldCArIGZvdW5kSW5kZXhcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvdW5kSW5kZXggPSAtMVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLTFcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbCBtdXN0IGJlIHN0cmluZywgbnVtYmVyIG9yIEJ1ZmZlcicpXG59XG5cbi8vIGBnZXRgIGlzIGRlcHJlY2F0ZWRcbkJ1ZmZlci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0IChvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5nZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLnJlYWRVSW50OChvZmZzZXQpXG59XG5cbi8vIGBzZXRgIGlzIGRlcHJlY2F0ZWRcbkJ1ZmZlci5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0ICh2LCBvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5zZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLndyaXRlVUludDgodiwgb2Zmc2V0KVxufVxuXG5mdW5jdGlvbiBoZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIC8vIG11c3QgYmUgYW4gZXZlbiBudW1iZXIgb2YgZGlnaXRzXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGlmIChzdHJMZW4gJSAyICE9PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaGV4IHN0cmluZycpXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHZhciBwYXJzZWQgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgaWYgKGlzTmFOKHBhcnNlZCkpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBoZXggc3RyaW5nJylcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSBwYXJzZWRcbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiB1dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBhc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYXNjaWlUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJpbmFyeVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGFzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGJhc2U2NFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gdWNzMldyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIHdyaXRlIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZykge1xuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nKVxuICBpZiAob2Zmc2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIG9mZnNldFssIGxlbmd0aF1bLCBlbmNvZGluZ10pXG4gIH0gZWxzZSBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgICBpZiAoaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgbGVuZ3RoID0gbGVuZ3RoIHwgMFxuICAgICAgaWYgKGVuY29kaW5nID09PSB1bmRlZmluZWQpIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgfSBlbHNlIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIC8vIGxlZ2FjeSB3cml0ZShzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXQsIGxlbmd0aCkgLSByZW1vdmUgaW4gdjAuMTNcbiAgfSBlbHNlIHtcbiAgICB2YXIgc3dhcCA9IGVuY29kaW5nXG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBvZmZzZXQgPSBsZW5ndGggfCAwXG4gICAgbGVuZ3RoID0gc3dhcFxuICB9XG5cbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPiByZW1haW5pbmcpIGxlbmd0aCA9IHJlbWFpbmluZ1xuXG4gIGlmICgoc3RyaW5nLmxlbmd0aCA+IDAgJiYgKGxlbmd0aCA8IDAgfHwgb2Zmc2V0IDwgMCkpIHx8IG9mZnNldCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2F0dGVtcHQgdG8gd3JpdGUgb3V0c2lkZSBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBiaW5hcnlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICAvLyBXYXJuaW5nOiBtYXhMZW5ndGggbm90IHRha2VuIGludG8gYWNjb3VudCBpbiBiYXNlNjRXcml0ZVxuICAgICAgICByZXR1cm4gYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHVjczJXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gYnVmLmxlbmd0aCkge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1Zi5zbGljZShzdGFydCwgZW5kKSlcbiAgfVxufVxuXG5mdW5jdGlvbiB1dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG4gIHZhciByZXMgPSBbXVxuXG4gIHZhciBpID0gc3RhcnRcbiAgd2hpbGUgKGkgPCBlbmQpIHtcbiAgICB2YXIgZmlyc3RCeXRlID0gYnVmW2ldXG4gICAgdmFyIGNvZGVQb2ludCA9IG51bGxcbiAgICB2YXIgYnl0ZXNQZXJTZXF1ZW5jZSA9IChmaXJzdEJ5dGUgPiAweEVGKSA/IDRcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4REYpID8gM1xuICAgICAgOiAoZmlyc3RCeXRlID4gMHhCRikgPyAyXG4gICAgICA6IDFcblxuICAgIGlmIChpICsgYnl0ZXNQZXJTZXF1ZW5jZSA8PSBlbmQpIHtcbiAgICAgIHZhciBzZWNvbmRCeXRlLCB0aGlyZEJ5dGUsIGZvdXJ0aEJ5dGUsIHRlbXBDb2RlUG9pbnRcblxuICAgICAgc3dpdGNoIChieXRlc1BlclNlcXVlbmNlKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBpZiAoZmlyc3RCeXRlIDwgMHg4MCkge1xuICAgICAgICAgICAgY29kZVBvaW50ID0gZmlyc3RCeXRlXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4MUYpIDw8IDB4NiB8IChzZWNvbmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3Rikge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweEMgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4NiB8ICh0aGlyZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGRiAmJiAodGVtcENvZGVQb2ludCA8IDB4RDgwMCB8fCB0ZW1wQ29kZVBvaW50ID4gMHhERkZGKSkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBmb3VydGhCeXRlID0gYnVmW2kgKyAzXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAoZm91cnRoQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHgxMiB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHhDIHwgKHRoaXJkQnl0ZSAmIDB4M0YpIDw8IDB4NiB8IChmb3VydGhCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHhGRkZGICYmIHRlbXBDb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb2RlUG9pbnQgPT09IG51bGwpIHtcbiAgICAgIC8vIHdlIGRpZCBub3QgZ2VuZXJhdGUgYSB2YWxpZCBjb2RlUG9pbnQgc28gaW5zZXJ0IGFcbiAgICAgIC8vIHJlcGxhY2VtZW50IGNoYXIgKFUrRkZGRCkgYW5kIGFkdmFuY2Ugb25seSAxIGJ5dGVcbiAgICAgIGNvZGVQb2ludCA9IDB4RkZGRFxuICAgICAgYnl0ZXNQZXJTZXF1ZW5jZSA9IDFcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA+IDB4RkZGRikge1xuICAgICAgLy8gZW5jb2RlIHRvIHV0ZjE2IChzdXJyb2dhdGUgcGFpciBkYW5jZSlcbiAgICAgIGNvZGVQb2ludCAtPSAweDEwMDAwXG4gICAgICByZXMucHVzaChjb2RlUG9pbnQgPj4+IDEwICYgMHgzRkYgfCAweEQ4MDApXG4gICAgICBjb2RlUG9pbnQgPSAweERDMDAgfCBjb2RlUG9pbnQgJiAweDNGRlxuICAgIH1cblxuICAgIHJlcy5wdXNoKGNvZGVQb2ludClcbiAgICBpICs9IGJ5dGVzUGVyU2VxdWVuY2VcbiAgfVxuXG4gIHJldHVybiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkocmVzKVxufVxuXG4vLyBCYXNlZCBvbiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMjc0NzI3Mi82ODA3NDIsIHRoZSBicm93c2VyIHdpdGhcbi8vIHRoZSBsb3dlc3QgbGltaXQgaXMgQ2hyb21lLCB3aXRoIDB4MTAwMDAgYXJncy5cbi8vIFdlIGdvIDEgbWFnbml0dWRlIGxlc3MsIGZvciBzYWZldHlcbnZhciBNQVhfQVJHVU1FTlRTX0xFTkdUSCA9IDB4MTAwMFxuXG5mdW5jdGlvbiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkgKGNvZGVQb2ludHMpIHtcbiAgdmFyIGxlbiA9IGNvZGVQb2ludHMubGVuZ3RoXG4gIGlmIChsZW4gPD0gTUFYX0FSR1VNRU5UU19MRU5HVEgpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNvZGVQb2ludHMpIC8vIGF2b2lkIGV4dHJhIHNsaWNlKClcbiAgfVxuXG4gIC8vIERlY29kZSBpbiBjaHVua3MgdG8gYXZvaWQgXCJjYWxsIHN0YWNrIHNpemUgZXhjZWVkZWRcIi5cbiAgdmFyIHJlcyA9ICcnXG4gIHZhciBpID0gMFxuICB3aGlsZSAoaSA8IGxlbikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFxuICAgICAgU3RyaW5nLFxuICAgICAgY29kZVBvaW50cy5zbGljZShpLCBpICs9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKVxuICAgIClcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldICYgMHg3RilcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGJpbmFyeVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGhleFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcblxuICBpZiAoIXN0YXJ0IHx8IHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmICghZW5kIHx8IGVuZCA8IDAgfHwgZW5kID4gbGVuKSBlbmQgPSBsZW5cblxuICB2YXIgb3V0ID0gJydcbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBvdXQgKz0gdG9IZXgoYnVmW2ldKVxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyBieXRlc1tpICsgMV0gKiAyNTYpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZlxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICBuZXdCdWYgPSBCdWZmZXIuX2F1Z21lbnQodGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSlcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2xpY2VMZW4gPSBlbmQgLSBzdGFydFxuICAgIG5ld0J1ZiA9IG5ldyBCdWZmZXIoc2xpY2VMZW4sIHVuZGVmaW5lZClcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWNlTGVuOyBpKyspIHtcbiAgICAgIG5ld0J1ZltpXSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfVxuXG4gIGlmIChuZXdCdWYubGVuZ3RoKSBuZXdCdWYucGFyZW50ID0gdGhpcy5wYXJlbnQgfHwgdGhpc1xuXG4gIHJldHVybiBuZXdCdWZcbn1cblxuLypcbiAqIE5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgYnVmZmVyIGlzbid0IHRyeWluZyB0byB3cml0ZSBvdXQgb2YgYm91bmRzLlxuICovXG5mdW5jdGlvbiBjaGVja09mZnNldCAob2Zmc2V0LCBleHQsIGxlbmd0aCkge1xuICBpZiAoKG9mZnNldCAlIDEpICE9PSAwIHx8IG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdvZmZzZXQgaXMgbm90IHVpbnQnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gbGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVHJ5aW5nIHRvIGFjY2VzcyBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRMRSA9IGZ1bmN0aW9uIHJlYWRVSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRCRSA9IGZ1bmN0aW9uIHJlYWRVSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG4gIH1cblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdXG4gIHZhciBtdWwgPSAxXG4gIHdoaWxlIChieXRlTGVuZ3RoID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiByZWFkVUludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiByZWFkVUludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgOCkgfCB0aGlzW29mZnNldCArIDFdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICgodGhpc1tvZmZzZXRdKSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikpICtcbiAgICAgICh0aGlzW29mZnNldCArIDNdICogMHgxMDAwMDAwKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdICogMHgxMDAwMDAwKSArXG4gICAgKCh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgIHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludExFID0gZnVuY3Rpb24gcmVhZEludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludEJFID0gZnVuY3Rpb24gcmVhZEludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoXG4gIHZhciBtdWwgPSAxXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0taV1cbiAgd2hpbGUgKGkgPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1pXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiByZWFkSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICBpZiAoISh0aGlzW29mZnNldF0gJiAweDgwKSkgcmV0dXJuICh0aGlzW29mZnNldF0pXG4gIHJldHVybiAoKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gcmVhZEludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIDFdIHwgKHRoaXNbb2Zmc2V0XSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbiByZWFkSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdKSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10gPDwgMjQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiByZWFkSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDI0KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiByZWFkRmxvYXRMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0QkUgPSBmdW5jdGlvbiByZWFkRmxvYXRCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gcmVhZERvdWJsZUJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgNTIsIDgpXG59XG5cbmZ1bmN0aW9uIGNoZWNrSW50IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignYnVmZmVyIG11c3QgYmUgYSBCdWZmZXIgaW5zdGFuY2UnKVxuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCd2YWx1ZSBpcyBvdXQgb2YgYm91bmRzJylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdpbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludExFID0gZnVuY3Rpb24gd3JpdGVVSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSwgMClcblxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludEJFID0gZnVuY3Rpb24gd3JpdGVVSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSwgMClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiB3cml0ZVVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4ZmYsIDApXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHZhbHVlID0gTWF0aC5mbG9vcih2YWx1ZSlcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuZnVuY3Rpb24gb2JqZWN0V3JpdGVVSW50MTYgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuKSB7XG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmICsgdmFsdWUgKyAxXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4oYnVmLmxlbmd0aCAtIG9mZnNldCwgMik7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSAodmFsdWUgJiAoMHhmZiA8PCAoOCAqIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpKSkpID4+PlxuICAgICAgKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkgKiA4XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9IHZhbHVlXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuZnVuY3Rpb24gb2JqZWN0V3JpdGVVSW50MzIgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuKSB7XG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGJ1Zi5sZW5ndGggLSBvZmZzZXQsIDQpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID0gKHZhbHVlID4+PiAobGl0dGxlRW5kaWFuID8gaSA6IDMgLSBpKSAqIDgpICYgMHhmZlxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9IHZhbHVlXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludExFID0gZnVuY3Rpb24gd3JpdGVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGggLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IDBcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IHZhbHVlIDwgMCA/IDEgOiAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gdmFsdWUgPCAwID8gMSA6IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uIHdyaXRlSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweDdmLCAtMHg4MClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkgdmFsdWUgPSBNYXRoLmZsb29yKHZhbHVlKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDFdID0gdmFsdWVcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9IHZhbHVlXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuZnVuY3Rpb24gY2hlY2tJRUVFNzU0IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndmFsdWUgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdpbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5mdW5jdGlvbiB3cml0ZUZsb2F0IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDQsIDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgsIC0zLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gd3JpdGVGbG9hdEJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDgsIDEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4LCAtMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG4gIHJldHVybiBvZmZzZXQgKyA4XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVMRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUJFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuLy8gY29weSh0YXJnZXRCdWZmZXIsIHRhcmdldFN0YXJ0PTAsIHNvdXJjZVN0YXJ0PTAsIHNvdXJjZUVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gY29weSAodGFyZ2V0LCB0YXJnZXRTdGFydCwgc3RhcnQsIGVuZCkge1xuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0U3RhcnQgPj0gdGFyZ2V0Lmxlbmd0aCkgdGFyZ2V0U3RhcnQgPSB0YXJnZXQubGVuZ3RoXG4gIGlmICghdGFyZ2V0U3RhcnQpIHRhcmdldFN0YXJ0ID0gMFxuICBpZiAoZW5kID4gMCAmJiBlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICAvLyBDb3B5IDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVybiAwXG4gIGlmICh0YXJnZXQubGVuZ3RoID09PSAwIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIEZhdGFsIGVycm9yIGNvbmRpdGlvbnNcbiAgaWYgKHRhcmdldFN0YXJ0IDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgfVxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlU3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChlbmQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlRW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIC8vIEFyZSB3ZSBvb2I/XG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCA8IGVuZCAtIHN0YXJ0KSB7XG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0ICsgc3RhcnRcbiAgfVxuXG4gIHZhciBsZW4gPSBlbmQgLSBzdGFydFxuICB2YXIgaVxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQgJiYgc3RhcnQgPCB0YXJnZXRTdGFydCAmJiB0YXJnZXRTdGFydCA8IGVuZCkge1xuICAgIC8vIGRlc2NlbmRpbmcgY29weSBmcm9tIGVuZFxuICAgIGZvciAoaSA9IGxlbiAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIGlmIChsZW4gPCAxMDAwIHx8ICFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIC8vIGFzY2VuZGluZyBjb3B5IGZyb20gc3RhcnRcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0U3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRhcmdldC5fc2V0KHRoaXMuc3ViYXJyYXkoc3RhcnQsIHN0YXJ0ICsgbGVuKSwgdGFyZ2V0U3RhcnQpXG4gIH1cblxuICByZXR1cm4gbGVuXG59XG5cbi8vIGZpbGwodmFsdWUsIHN0YXJ0PTAsIGVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gZmlsbCAodmFsdWUsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCF2YWx1ZSkgdmFsdWUgPSAwXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCkgZW5kID0gdGhpcy5sZW5ndGhcblxuICBpZiAoZW5kIDwgc3RhcnQpIHRocm93IG5ldyBSYW5nZUVycm9yKCdlbmQgPCBzdGFydCcpXG5cbiAgLy8gRmlsbCAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm5cbiAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChlbmQgPCAwIHx8IGVuZCA+IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignZW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIHZhciBpXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgdGhpc1tpXSA9IHZhbHVlXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBieXRlcyA9IHV0ZjhUb0J5dGVzKHZhbHVlLnRvU3RyaW5nKCkpXG4gICAgdmFyIGxlbiA9IGJ5dGVzLmxlbmd0aFxuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIHRoaXNbaV0gPSBieXRlc1tpICUgbGVuXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBgQXJyYXlCdWZmZXJgIHdpdGggdGhlICpjb3BpZWQqIG1lbW9yeSBvZiB0aGUgYnVmZmVyIGluc3RhbmNlLlxuICogQWRkZWQgaW4gTm9kZSAwLjEyLiBPbmx5IGF2YWlsYWJsZSBpbiBicm93c2VycyB0aGF0IHN1cHBvcnQgQXJyYXlCdWZmZXIuXG4gKi9cbkJ1ZmZlci5wcm90b3R5cGUudG9BcnJheUJ1ZmZlciA9IGZ1bmN0aW9uIHRvQXJyYXlCdWZmZXIgKCkge1xuICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgICByZXR1cm4gKG5ldyBCdWZmZXIodGhpcykpLmJ1ZmZlclxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5sZW5ndGgpXG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYnVmLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgIGJ1ZltpXSA9IHRoaXNbaV1cbiAgICAgIH1cbiAgICAgIHJldHVybiBidWYuYnVmZmVyXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0J1ZmZlci50b0FycmF5QnVmZmVyIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyJylcbiAgfVxufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbnZhciBCUCA9IEJ1ZmZlci5wcm90b3R5cGVcblxuLyoqXG4gKiBBdWdtZW50IGEgVWludDhBcnJheSAqaW5zdGFuY2UqIChub3QgdGhlIFVpbnQ4QXJyYXkgY2xhc3MhKSB3aXRoIEJ1ZmZlciBtZXRob2RzXG4gKi9cbkJ1ZmZlci5fYXVnbWVudCA9IGZ1bmN0aW9uIF9hdWdtZW50IChhcnIpIHtcbiAgYXJyLmNvbnN0cnVjdG9yID0gQnVmZmVyXG4gIGFyci5faXNCdWZmZXIgPSB0cnVlXG5cbiAgLy8gc2F2ZSByZWZlcmVuY2UgdG8gb3JpZ2luYWwgVWludDhBcnJheSBzZXQgbWV0aG9kIGJlZm9yZSBvdmVyd3JpdGluZ1xuICBhcnIuX3NldCA9IGFyci5zZXRcblxuICAvLyBkZXByZWNhdGVkXG4gIGFyci5nZXQgPSBCUC5nZXRcbiAgYXJyLnNldCA9IEJQLnNldFxuXG4gIGFyci53cml0ZSA9IEJQLndyaXRlXG4gIGFyci50b1N0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0xvY2FsZVN0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0pTT04gPSBCUC50b0pTT05cbiAgYXJyLmVxdWFscyA9IEJQLmVxdWFsc1xuICBhcnIuY29tcGFyZSA9IEJQLmNvbXBhcmVcbiAgYXJyLmluZGV4T2YgPSBCUC5pbmRleE9mXG4gIGFyci5jb3B5ID0gQlAuY29weVxuICBhcnIuc2xpY2UgPSBCUC5zbGljZVxuICBhcnIucmVhZFVJbnRMRSA9IEJQLnJlYWRVSW50TEVcbiAgYXJyLnJlYWRVSW50QkUgPSBCUC5yZWFkVUludEJFXG4gIGFyci5yZWFkVUludDggPSBCUC5yZWFkVUludDhcbiAgYXJyLnJlYWRVSW50MTZMRSA9IEJQLnJlYWRVSW50MTZMRVxuICBhcnIucmVhZFVJbnQxNkJFID0gQlAucmVhZFVJbnQxNkJFXG4gIGFyci5yZWFkVUludDMyTEUgPSBCUC5yZWFkVUludDMyTEVcbiAgYXJyLnJlYWRVSW50MzJCRSA9IEJQLnJlYWRVSW50MzJCRVxuICBhcnIucmVhZEludExFID0gQlAucmVhZEludExFXG4gIGFyci5yZWFkSW50QkUgPSBCUC5yZWFkSW50QkVcbiAgYXJyLnJlYWRJbnQ4ID0gQlAucmVhZEludDhcbiAgYXJyLnJlYWRJbnQxNkxFID0gQlAucmVhZEludDE2TEVcbiAgYXJyLnJlYWRJbnQxNkJFID0gQlAucmVhZEludDE2QkVcbiAgYXJyLnJlYWRJbnQzMkxFID0gQlAucmVhZEludDMyTEVcbiAgYXJyLnJlYWRJbnQzMkJFID0gQlAucmVhZEludDMyQkVcbiAgYXJyLnJlYWRGbG9hdExFID0gQlAucmVhZEZsb2F0TEVcbiAgYXJyLnJlYWRGbG9hdEJFID0gQlAucmVhZEZsb2F0QkVcbiAgYXJyLnJlYWREb3VibGVMRSA9IEJQLnJlYWREb3VibGVMRVxuICBhcnIucmVhZERvdWJsZUJFID0gQlAucmVhZERvdWJsZUJFXG4gIGFyci53cml0ZVVJbnQ4ID0gQlAud3JpdGVVSW50OFxuICBhcnIud3JpdGVVSW50TEUgPSBCUC53cml0ZVVJbnRMRVxuICBhcnIud3JpdGVVSW50QkUgPSBCUC53cml0ZVVJbnRCRVxuICBhcnIud3JpdGVVSW50MTZMRSA9IEJQLndyaXRlVUludDE2TEVcbiAgYXJyLndyaXRlVUludDE2QkUgPSBCUC53cml0ZVVJbnQxNkJFXG4gIGFyci53cml0ZVVJbnQzMkxFID0gQlAud3JpdGVVSW50MzJMRVxuICBhcnIud3JpdGVVSW50MzJCRSA9IEJQLndyaXRlVUludDMyQkVcbiAgYXJyLndyaXRlSW50TEUgPSBCUC53cml0ZUludExFXG4gIGFyci53cml0ZUludEJFID0gQlAud3JpdGVJbnRCRVxuICBhcnIud3JpdGVJbnQ4ID0gQlAud3JpdGVJbnQ4XG4gIGFyci53cml0ZUludDE2TEUgPSBCUC53cml0ZUludDE2TEVcbiAgYXJyLndyaXRlSW50MTZCRSA9IEJQLndyaXRlSW50MTZCRVxuICBhcnIud3JpdGVJbnQzMkxFID0gQlAud3JpdGVJbnQzMkxFXG4gIGFyci53cml0ZUludDMyQkUgPSBCUC53cml0ZUludDMyQkVcbiAgYXJyLndyaXRlRmxvYXRMRSA9IEJQLndyaXRlRmxvYXRMRVxuICBhcnIud3JpdGVGbG9hdEJFID0gQlAud3JpdGVGbG9hdEJFXG4gIGFyci53cml0ZURvdWJsZUxFID0gQlAud3JpdGVEb3VibGVMRVxuICBhcnIud3JpdGVEb3VibGVCRSA9IEJQLndyaXRlRG91YmxlQkVcbiAgYXJyLmZpbGwgPSBCUC5maWxsXG4gIGFyci5pbnNwZWN0ID0gQlAuaW5zcGVjdFxuICBhcnIudG9BcnJheUJ1ZmZlciA9IEJQLnRvQXJyYXlCdWZmZXJcblxuICByZXR1cm4gYXJyXG59XG5cbnZhciBJTlZBTElEX0JBU0U2NF9SRSA9IC9bXitcXC8wLTlBLVphLXotX10vZ1xuXG5mdW5jdGlvbiBiYXNlNjRjbGVhbiAoc3RyKSB7XG4gIC8vIE5vZGUgc3RyaXBzIG91dCBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSBcXG4gYW5kIFxcdCBmcm9tIHRoZSBzdHJpbmcsIGJhc2U2NC1qcyBkb2VzIG5vdFxuICBzdHIgPSBzdHJpbmd0cmltKHN0cikucmVwbGFjZShJTlZBTElEX0JBU0U2NF9SRSwgJycpXG4gIC8vIE5vZGUgY29udmVydHMgc3RyaW5ncyB3aXRoIGxlbmd0aCA8IDIgdG8gJydcbiAgaWYgKHN0ci5sZW5ndGggPCAyKSByZXR1cm4gJydcbiAgLy8gTm9kZSBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgYmFzZTY0IHN0cmluZ3MgKG1pc3NpbmcgdHJhaWxpbmcgPT09KSwgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHdoaWxlIChzdHIubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgIHN0ciA9IHN0ciArICc9J1xuICB9XG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gc3RyaW5ndHJpbSAoc3RyKSB7XG4gIGlmIChzdHIudHJpbSkgcmV0dXJuIHN0ci50cmltKClcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJylcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyaW5nLCB1bml0cykge1xuICB1bml0cyA9IHVuaXRzIHx8IEluZmluaXR5XG4gIHZhciBjb2RlUG9pbnRcbiAgdmFyIGxlbmd0aCA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIGxlYWRTdXJyb2dhdGUgPSBudWxsXG4gIHZhciBieXRlcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGNvZGVQb2ludCA9IHN0cmluZy5jaGFyQ29kZUF0KGkpXG5cbiAgICAvLyBpcyBzdXJyb2dhdGUgY29tcG9uZW50XG4gICAgaWYgKGNvZGVQb2ludCA+IDB4RDdGRiAmJiBjb2RlUG9pbnQgPCAweEUwMDApIHtcbiAgICAgIC8vIGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoIWxlYWRTdXJyb2dhdGUpIHtcbiAgICAgICAgLy8gbm8gbGVhZCB5ZXRcbiAgICAgICAgaWYgKGNvZGVQb2ludCA+IDB4REJGRikge1xuICAgICAgICAgIC8vIHVuZXhwZWN0ZWQgdHJhaWxcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKGkgKyAxID09PSBsZW5ndGgpIHtcbiAgICAgICAgICAvLyB1bnBhaXJlZCBsZWFkXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhbGlkIGxlYWRcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIDIgbGVhZHMgaW4gYSByb3dcbiAgICAgIGlmIChjb2RlUG9pbnQgPCAweERDMDApIHtcbiAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gdmFsaWQgc3Vycm9nYXRlIHBhaXJcbiAgICAgIGNvZGVQb2ludCA9IGxlYWRTdXJyb2dhdGUgLSAweEQ4MDAgPDwgMTAgfCBjb2RlUG9pbnQgLSAweERDMDAgfCAweDEwMDAwXG4gICAgfSBlbHNlIGlmIChsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAvLyB2YWxpZCBibXAgY2hhciwgYnV0IGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICB9XG5cbiAgICBsZWFkU3Vycm9nYXRlID0gbnVsbFxuXG4gICAgLy8gZW5jb2RlIHV0ZjhcbiAgICBpZiAoY29kZVBvaW50IDwgMHg4MCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAxKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKGNvZGVQb2ludClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4ODAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgfCAweEMwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAzKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDIHwgMHhFMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gNCkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4MTIgfCAweEYwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvZGUgcG9pbnQnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBieXRlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyLCB1bml0cykge1xuICB2YXIgYywgaGksIGxvXG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuXG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIHJldHVybiBiYXNlNjQudG9CeXRlQXJyYXkoYmFzZTY0Y2xlYW4oc3RyKSlcbn1cblxuZnVuY3Rpb24gYmxpdEJ1ZmZlciAoc3JjLCBkc3QsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoKGkgKyBvZmZzZXQgPj0gZHN0Lmxlbmd0aCkgfHwgKGkgPj0gc3JjLmxlbmd0aCkpIGJyZWFrXG4gICAgZHN0W2kgKyBvZmZzZXRdID0gc3JjW2ldXG4gIH1cbiAgcmV0dXJuIGlcbn1cbiIsInZhciBsb29rdXAgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLyc7XG5cbjsoZnVuY3Rpb24gKGV4cG9ydHMpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG4gIHZhciBBcnIgPSAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnKVxuICAgID8gVWludDhBcnJheVxuICAgIDogQXJyYXlcblxuXHR2YXIgUExVUyAgID0gJysnLmNoYXJDb2RlQXQoMClcblx0dmFyIFNMQVNIICA9ICcvJy5jaGFyQ29kZUF0KDApXG5cdHZhciBOVU1CRVIgPSAnMCcuY2hhckNvZGVBdCgwKVxuXHR2YXIgTE9XRVIgID0gJ2EnLmNoYXJDb2RlQXQoMClcblx0dmFyIFVQUEVSICA9ICdBJy5jaGFyQ29kZUF0KDApXG5cdHZhciBQTFVTX1VSTF9TQUZFID0gJy0nLmNoYXJDb2RlQXQoMClcblx0dmFyIFNMQVNIX1VSTF9TQUZFID0gJ18nLmNoYXJDb2RlQXQoMClcblxuXHRmdW5jdGlvbiBkZWNvZGUgKGVsdCkge1xuXHRcdHZhciBjb2RlID0gZWx0LmNoYXJDb2RlQXQoMClcblx0XHRpZiAoY29kZSA9PT0gUExVUyB8fFxuXHRcdCAgICBjb2RlID09PSBQTFVTX1VSTF9TQUZFKVxuXHRcdFx0cmV0dXJuIDYyIC8vICcrJ1xuXHRcdGlmIChjb2RlID09PSBTTEFTSCB8fFxuXHRcdCAgICBjb2RlID09PSBTTEFTSF9VUkxfU0FGRSlcblx0XHRcdHJldHVybiA2MyAvLyAnLydcblx0XHRpZiAoY29kZSA8IE5VTUJFUilcblx0XHRcdHJldHVybiAtMSAvL25vIG1hdGNoXG5cdFx0aWYgKGNvZGUgPCBOVU1CRVIgKyAxMClcblx0XHRcdHJldHVybiBjb2RlIC0gTlVNQkVSICsgMjYgKyAyNlxuXHRcdGlmIChjb2RlIDwgVVBQRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gVVBQRVJcblx0XHRpZiAoY29kZSA8IExPV0VSICsgMjYpXG5cdFx0XHRyZXR1cm4gY29kZSAtIExPV0VSICsgMjZcblx0fVxuXG5cdGZ1bmN0aW9uIGI2NFRvQnl0ZUFycmF5IChiNjQpIHtcblx0XHR2YXIgaSwgaiwgbCwgdG1wLCBwbGFjZUhvbGRlcnMsIGFyclxuXG5cdFx0aWYgKGI2NC5sZW5ndGggJSA0ID4gMCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0Jylcblx0XHR9XG5cblx0XHQvLyB0aGUgbnVtYmVyIG9mIGVxdWFsIHNpZ25zIChwbGFjZSBob2xkZXJzKVxuXHRcdC8vIGlmIHRoZXJlIGFyZSB0d28gcGxhY2Vob2xkZXJzLCB0aGFuIHRoZSB0d28gY2hhcmFjdGVycyBiZWZvcmUgaXRcblx0XHQvLyByZXByZXNlbnQgb25lIGJ5dGVcblx0XHQvLyBpZiB0aGVyZSBpcyBvbmx5IG9uZSwgdGhlbiB0aGUgdGhyZWUgY2hhcmFjdGVycyBiZWZvcmUgaXQgcmVwcmVzZW50IDIgYnl0ZXNcblx0XHQvLyB0aGlzIGlzIGp1c3QgYSBjaGVhcCBoYWNrIHRvIG5vdCBkbyBpbmRleE9mIHR3aWNlXG5cdFx0dmFyIGxlbiA9IGI2NC5sZW5ndGhcblx0XHRwbGFjZUhvbGRlcnMgPSAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMikgPyAyIDogJz0nID09PSBiNjQuY2hhckF0KGxlbiAtIDEpID8gMSA6IDBcblxuXHRcdC8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuXHRcdGFyciA9IG5ldyBBcnIoYjY0Lmxlbmd0aCAqIDMgLyA0IC0gcGxhY2VIb2xkZXJzKVxuXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuXHRcdGwgPSBwbGFjZUhvbGRlcnMgPiAwID8gYjY0Lmxlbmd0aCAtIDQgOiBiNjQubGVuZ3RoXG5cblx0XHR2YXIgTCA9IDBcblxuXHRcdGZ1bmN0aW9uIHB1c2ggKHYpIHtcblx0XHRcdGFycltMKytdID0gdlxuXHRcdH1cblxuXHRcdGZvciAoaSA9IDAsIGogPSAwOyBpIDwgbDsgaSArPSA0LCBqICs9IDMpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTgpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgMTIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPDwgNikgfCBkZWNvZGUoYjY0LmNoYXJBdChpICsgMykpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDAwMCkgPj4gMTYpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDApID4+IDgpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fVxuXG5cdFx0aWYgKHBsYWNlSG9sZGVycyA9PT0gMikge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAyKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpID4+IDQpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fSBlbHNlIGlmIChwbGFjZUhvbGRlcnMgPT09IDEpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTApIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgNCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA+PiAyKVxuXHRcdFx0cHVzaCgodG1wID4+IDgpICYgMHhGRilcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRyZXR1cm4gYXJyXG5cdH1cblxuXHRmdW5jdGlvbiB1aW50OFRvQmFzZTY0ICh1aW50OCkge1xuXHRcdHZhciBpLFxuXHRcdFx0ZXh0cmFCeXRlcyA9IHVpbnQ4Lmxlbmd0aCAlIDMsIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG5cdFx0XHRvdXRwdXQgPSBcIlwiLFxuXHRcdFx0dGVtcCwgbGVuZ3RoXG5cblx0XHRmdW5jdGlvbiBlbmNvZGUgKG51bSkge1xuXHRcdFx0cmV0dXJuIGxvb2t1cC5jaGFyQXQobnVtKVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG5cdFx0XHRyZXR1cm4gZW5jb2RlKG51bSA+PiAxOCAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiAxMiAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiA2ICYgMHgzRikgKyBlbmNvZGUobnVtICYgMHgzRilcblx0XHR9XG5cblx0XHQvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG5cdFx0Zm9yIChpID0gMCwgbGVuZ3RoID0gdWludDgubGVuZ3RoIC0gZXh0cmFCeXRlczsgaSA8IGxlbmd0aDsgaSArPSAzKSB7XG5cdFx0XHR0ZW1wID0gKHVpbnQ4W2ldIDw8IDE2KSArICh1aW50OFtpICsgMV0gPDwgOCkgKyAodWludDhbaSArIDJdKVxuXHRcdFx0b3V0cHV0ICs9IHRyaXBsZXRUb0Jhc2U2NCh0ZW1wKVxuXHRcdH1cblxuXHRcdC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcblx0XHRzd2l0Y2ggKGV4dHJhQnl0ZXMpIHtcblx0XHRcdGNhc2UgMTpcblx0XHRcdFx0dGVtcCA9IHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUodGVtcCA+PiAyKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9PSdcblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgMjpcblx0XHRcdFx0dGVtcCA9ICh1aW50OFt1aW50OC5sZW5ndGggLSAyXSA8PCA4KSArICh1aW50OFt1aW50OC5sZW5ndGggLSAxXSlcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDEwKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wID4+IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA8PCAyKSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSAnPSdcblx0XHRcdFx0YnJlYWtcblx0XHR9XG5cblx0XHRyZXR1cm4gb3V0cHV0XG5cdH1cblxuXHRleHBvcnRzLnRvQnl0ZUFycmF5ID0gYjY0VG9CeXRlQXJyYXlcblx0ZXhwb3J0cy5mcm9tQnl0ZUFycmF5ID0gdWludDhUb0Jhc2U2NFxufSh0eXBlb2YgZXhwb3J0cyA9PT0gJ3VuZGVmaW5lZCcgPyAodGhpcy5iYXNlNjRqcyA9IHt9KSA6IGV4cG9ydHMpKVxuIiwiZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24gKGJ1ZmZlciwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG1cbiAgdmFyIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBuQml0cyA9IC03XG4gIHZhciBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDBcbiAgdmFyIGQgPSBpc0xFID8gLTEgOiAxXG4gIHZhciBzID0gYnVmZmVyW29mZnNldCArIGldXG5cbiAgaSArPSBkXG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgcyA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gZUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gZSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIG0gPSBlICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIGUgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IG1MZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgbSA9IG0gKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBpZiAoZSA9PT0gMCkge1xuICAgIGUgPSAxIC0gZUJpYXNcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpXG4gIH0gZWxzZSB7XG4gICAgbSA9IG0gKyBNYXRoLnBvdygyLCBtTGVuKVxuICAgIGUgPSBlIC0gZUJpYXNcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKVxufVxuXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24gKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLCBjXG4gIHZhciBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApXG4gIHZhciBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSlcbiAgdmFyIGQgPSBpc0xFID8gMSA6IC0xXG4gIHZhciBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwXG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSlcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMFxuICAgIGUgPSBlTWF4XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpXG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tXG4gICAgICBjICo9IDJcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGNcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpXG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrXG4gICAgICBjIC89IDJcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwXG4gICAgICBlID0gZU1heFxuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAodmFsdWUgKiBjIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IGUgKyBlQmlhc1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSAwXG4gICAgfVxuICB9XG5cbiAgZm9yICg7IG1MZW4gPj0gODsgYnVmZmVyW29mZnNldCArIGldID0gbSAmIDB4ZmYsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCkge31cblxuICBlID0gKGUgPDwgbUxlbikgfCBtXG4gIGVMZW4gKz0gbUxlblxuICBmb3IgKDsgZUxlbiA+IDA7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGUgJiAweGZmLCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpIHt9XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4XG59XG4iLCJcbi8qKlxuICogaXNBcnJheVxuICovXG5cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcblxuLyoqXG4gKiB0b1N0cmluZ1xuICovXG5cbnZhciBzdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4vKipcbiAqIFdoZXRoZXIgb3Igbm90IHRoZSBnaXZlbiBgdmFsYFxuICogaXMgYW4gYXJyYXkuXG4gKlxuICogZXhhbXBsZTpcbiAqXG4gKiAgICAgICAgaXNBcnJheShbXSk7XG4gKiAgICAgICAgLy8gPiB0cnVlXG4gKiAgICAgICAgaXNBcnJheShhcmd1bWVudHMpO1xuICogICAgICAgIC8vID4gZmFsc2VcbiAqICAgICAgICBpc0FycmF5KCcnKTtcbiAqICAgICAgICAvLyA+IGZhbHNlXG4gKlxuICogQHBhcmFtIHttaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtib29sfVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcnJheSB8fCBmdW5jdGlvbiAodmFsKSB7XG4gIHJldHVybiAhISB2YWwgJiYgJ1tvYmplY3QgQXJyYXldJyA9PSBzdHIuY2FsbCh2YWwpO1xufTtcbiJdfQ==
