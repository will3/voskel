(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

module.exports = function(voxel, voxelSideTextureIds) {
  voxelSideTextureIds = voxelSideTextureIds || {};

  var dim = voxel.shape;
  var data = voxel.data;

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
      return data[k + (j + i * dim[0]) * dim[1]];
    } else if (d === 1) {
      return data[j + (i + k * dim[0]) * dim[1]];
    } else if (d === 2) {
      return data[i + (k + j * dim[0]) * dim[1]];
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

var voxel = ndarray([], [3, 3, 3]);
voxel.set(1, 1, 1, 1);

module.exports(voxel);
},{"greedy-mesher":2,"ndarray":10}],2:[function(require,module,exports){
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

},{"bit-twiddle":4,"buffer":35,"dup":5}],7:[function(require,module,exports){
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
},{}],14:[function(require,module,exports){
(function (global){
var THREE = (typeof window !== "undefined" ? window['THREE'] : typeof global !== "undefined" ? global['THREE'] : null);

module.exports = function(app) {
	var scene = app.get('scene');

	var object = new THREE.Object3D();

	var editor = app.attach(object, require('../components/editor'));

	scene.add(object);
	
	return object;
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../components/editor":20}],15:[function(require,module,exports){
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

},{"../components/blocks":17,"../components/rigidbody":23,"ndarray":10}],16:[function(require,module,exports){
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

},{"../components/character":18,"../components/playercontrol":22,"../components/rigidbody":23}],17:[function(require,module,exports){
var ndarray = require('ndarray');
var mesher = require('b-mesher');

module.exports = function(object, materials) {
  "use strict";

  var palette = [null, 0xffffff];

  var chunkSize = 16;
  var chunks = {};
  var offset = new THREE.Vector3();
  var mesh = null;
  var obj = new THREE.Object3D();
  var material = new THREE.MeshLambertMaterial();
  material.materials = materials;

  object.add(obj);

  function updateMesh() {
    for (var id in chunks) {
      var chunk = chunks[id];
      if (chunk.dirty) {
        updateChunk(chunk);
        chunk.dirty = false;
      }
    }
  };

  function updateChunk(chunk) {
    if (chunk.mesh != null) {
      obj.remove(chunk.mesh);
    }

    var result = mesher(chunk.map);

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
      face.color = new THREE.Color(palette[c]);

      face = new THREE.Face3(f[2], f[3], f[0]);
      geometry.faces.push(face);
      face.color = new THREE.Color(palette[c]);
    });

    geometry.computeFaceNormals();

    mesh = new THREE.Mesh(geometry, material);
    var origin = chunk.origin;
    mesh.position.copy(new THREE.Vector3().addVectors(origin, offset));
    obj.add(mesh);
    chunk.mesh = mesh;
  };

  function set(x, y, z, obj) {
    var origin = getOrigin(x, y, z);
    var id = origin.join(',');
    var chunk = chunks[id];
    if (chunk == null) {
      chunk = chunks[id] = {
        origin: new THREE.Vector3(origin[0], origin[1], origin[2]),
        map: ndarray([], [chunkSize, chunkSize, chunkSize])
      };
    }
    chunk.map.set(x - origin[0], y - origin[1], z - origin[2], obj);
    chunk.dirty = true;
  };

  function get(x, y, z) {
    var origin = getOrigin(x, y, z);
    var id = origin.join(',');
    var chunk = chunks[id];
    if (chunk == null) {
      return undefined;
    }
    return chunk.map.get(x - origin[0], y - origin[1], z - origin[2]);
  };

  function getOrigin(x, y, z) {
    return [
      Math.floor(x / chunkSize) * chunkSize,
      Math.floor(y / chunkSize) * chunkSize,
      Math.floor(z / chunkSize) * chunkSize
    ];
  };

  function getAtCoord(coord) {
    return get(coord.x, coord.y, coord.z);
  };

  function pointToCoord(point, round) {
    round = round === undefined ? true : false;

    if (round) {
      return new THREE.Vector3(
        Math.round(point.x - offset.x - 0.5),
        Math.round(point.y - offset.y - 0.5),
        Math.round(point.z - offset.z - 0.5)
      );
    }

    return new THREE.Vector3(
      point.x - offset.x - 0.5,
      point.y - offset.y - 0.5,
      point.z - offset.z - 0.5
    );
  };

  function coordToPoint(coord) {
    return new THREE.Vector3(
      coord.x + offset.x, coord.y + offset.y, coord.z + offset.z
    );
  };

  function setAtCoord(coord, b) {
    set(coord.x, coord.y, coord.z, b);
  };

  function tick() {
    updateMesh();
  };

  function clear() {
    for (var id in chunks) {
      var chunk = chunks[id];
      var mesh = chunk.mesh;
      if (mesh != null) {
        obj.remove(mesh);
      }
    }
    chunks = {};
  };

  function visit(callback) {
    for (var id in chunks) {
      var chunk = chunks[id];
      var map = chunk.map;
      var shape = map.shape;
      var data = map.data;
      var origin = chunk.origin;
      for (var i = 0; i < shape[0]; i++) {
        for (var j = 0; j < shape[1]; j++) {
          for (var k = 0; k < shape[2]; k++) {
            var b = map.get(i, j, k);
            if (!!b) {
              callback(i + origin.x, j + origin.y, k + origin.z, b);
            }
          }
        }
      }
    }
  };

  return {
    type: 'blocks',
    tick: tick,
    updateMesh: updateMesh,
    palette: palette,
    offset: offset,
    get: get,
    set: set,
    pointToCoord: pointToCoord,
    coordToPoint: coordToPoint,
    getAtCoord: getAtCoord,
    setAtCoord: setAtCoord,
    get material() {
      return material;
    },
    clear: clear,
    get obj() {
      return obj;
    },
    visit: visit
  };
};

module.exports.$inject = ['materials'];
},{"b-mesher":1,"ndarray":10}],18:[function(require,module,exports){
(function (global){
var THREE = (typeof window !== "undefined" ? window['THREE'] : typeof global !== "undefined" ? global['THREE'] : null);

module.exports = function(object) {
  "use strict";

  var geometry = new THREE.BoxGeometry(1, 1, 1);
  var material = new THREE.MeshBasicMaterial({
    color: 0xff0000
  });
  var moveSpeed = 0.5;
  var jumpSpeed = 0.8;

  var mesh = new THREE.Mesh(geometry, material);
  object.add(mesh);
  var jumping = false;

  function tick() {
    character.gravity = this.rigidBody.gravity;
    if (jumping && this.rigidBody.grounded) {
      jumping = false;
    }
  };

  function move(forward, amount) {
    var gravity = this.rigidBody.gravity;
    if(gravity == null) {
      return;
    }
    if (this.rigidBody.grounded || jumping) {
      var verticalSpeed = this.rigidBody.velocity.clone().projectOnVector(gravity.dir);
      var forwardSpeed = forward.clone().setLength(amount * moveSpeed);
      this.rigidBody.velocity.copy(verticalSpeed.add(forwardSpeed));
    }
  };

  function jump(amount) {
    var gravity = this.rigidBody.gravity;
    if(gravity == null) {
      return;
    }
    if (this.rigidBody.grounded) {
      jumping = true;
      this.rigidBody.velocity.copy(gravity.dir.clone().multiplyScalar(-jumpSpeed));
    }
  };

  var character = {
    tick: tick,
    move: move,
    jump: jump,
    rigidBody: null
  };

  return character;
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],19:[function(require,module,exports){
(function (global){
var THREE = (typeof window !== "undefined" ? window['THREE'] : typeof global !== "undefined" ? global['THREE'] : null);

module.exports = function(camera, input) {
  "use strict";

  var rotation = new THREE.Euler(-Math.PI / 4, Math.PI / 4, 0, 'YXZ');
  var lastMouse = new THREE.Vector2();
  var mouseSpeedX = 4;
  var mouseSpeedY = 4;
  var unitVector = new THREE.Vector3(0, 0, 1);
  var distance = 100;
  var target = new THREE.Vector3(0, 0, 0);
  var maxPitch = Math.PI / 2 - 0.01;
  var minPitch = -Math.PI / 2 + 0.01;

  function tick() {
    if (input.mouseHold(2)) {
      var diff = new THREE.Vector2().subVectors(input.mouse, lastMouse);
      rotation.y += diff.x * mouseSpeedX;
      rotation.x -= diff.y * mouseSpeedY;

      if (rotation.x < minPitch) rotation.x = minPitch;
      if (rotation.x > maxPitch) rotation.x = maxPitch;

      updateCamera();
    }

    lastMouse.copy(input.mouse);
  };

  function updateCamera() {
    var position = unitVector.clone().applyEuler(rotation).setLength(distance).add(target);
    camera.position.copy(position);
    camera.lookAt(target);
  };

  updateCamera();

  return {
    tick: tick
  }
};

module.exports.$inject = ['input'];
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],20:[function(require,module,exports){
(function (global){
var THREE = (typeof window !== "undefined" ? window['THREE'] : typeof global !== "undefined" ? global['THREE'] : null);

module.exports = function(object, app, input, camera, devConsole, config) {
  "use strict";

  var raycaster = new THREE.Raycaster();
  var sn = 0.0001;
  var blocks = null;
  var ground = null;
  var tempBlocks = null;

  devConsole.commands['new'] = function(args) {
    var size = args._[0] || 16;

    updateGround(size);
  };

  function updateGround(size) {
    ground.clear();

    var dim = [size, 2, size];

    for (var i = 0; i < dim[0]; i++) {
      for (var j = 0; j < dim[1]; j++) {
        for (var k = 0; k < dim[2]; k++) {
          ground.set(i, j, k, 1);
        }
      }
    }

    ground.offset.set(-dim[0] / 2, -dim[1] / 2, -dim[2] / 2);
    ground.updateMesh();
  };

  function getMouseCoord(delta) {
    var mouse = input.mouse;
    raycaster.setFromCamera(mouse, camera);
    var objects = [];
    if (blocks.object != null) objects.push(blocks.obj);
    if (ground.object != null) objects.push(ground.obj);
    var intersects = raycaster.intersectObjects(objects, true);

    if (intersects.length === 0) {
      return undefined;
    }

    var intersect = intersects[0];

    var point = intersect.point;
    var diff = point.clone().sub(camera.position);
    diff = diff.setLength(diff.length() + delta || 0);
    point = camera.position.clone().add(diff);

    var coord = blocks.pointToCoord(point);

    return coord;
  };

  var lastMouse = new THREE.Vector2();

  var startCoord = null;
  var endCoord = null;

  function start() {
    ground = app.attach(object, require('./blocks'));
    updateGround(config['editor_ground_size']);
    blocks = app.attach(object, require('./blocks'));
    tempBlocks = app.attach(object, require('./blocks'));
  };

  var _started = false;

  function tick() {
    if (!_started) {
      start();
      _started = true;
    }

    var mouse = input.mouse.clone();
    var coordA = getMouseCoord(-sn);
    var coordB = getMouseCoord(sn);

    if (input.mouseClick(0)) {
      blocks.setAtCoord(coordA, 1);
    }

    if (input.mouseDown(0)) {
      if (!!startCoord) {
        commitTempBlocks();
        startCoord = null;
      }
    }

    if (input.mouseHold(0)) {
      if(startCoord == null && !!coordA) {
        startCoord = coordA.clone();
      }

      endCoord = coordA;

      if (!!startCoord && !!endCoord) {
        updateTempBlocks();
      }
    }

    if (input.keyDown('up')) {
      if (!!startCoord && !!endCoord) {
        endCoord.y++;
        if (startCoord.y == endCoord.y) {
          endCoord.y++;
        }
        updateTempBlocks();
      }
    }

    if (input.keyDown('down')) {
      if (!!startCoord && !!endCoord) {
        endCoord.y--;
        if (startCoord.y == endCoord.y) {
          endCoord.y--;
        }
        updateTempBlocks();
      }
    }

  };

  function updateTempBlocks() {
    tempBlocks.clear();
    visitBound(startCoord, endCoord, function(i, j, k) {
      tempBlocks.set(i, j, k, 1);
    });
  };

  function commitTempBlocks() {
    tempBlocks.visit(function(i, j, k, b) {
      blocks.set(i, j, k, b);
    });
    tempBlocks.clear();
  };

  function visitBound(lo, hi, callback) {
    var xs = hi.x > lo.x ? [lo.x, hi.x] : [hi.x, lo.x];
    var ys = hi.y > lo.y ? [lo.y, hi.y] : [hi.y, lo.y];
    var zs = hi.z > lo.z ? [lo.z, hi.z] : [hi.z, lo.z];
    for (var i = xs[0]; i <= xs[1]; i++) {
      for (var j = ys[0]; j <= ys[1]; j++) {
        for (var k = zs[0]; k <= zs[1]; k++) {
          callback(i, j, k);
        }
      }
    }
  };

  var editor = {
    tick: tick,
    set blocks(value) {
      blocks = value;
    }
  };

  return editor;
};

module.exports.$inject = ['app', 'input', 'camera', 'devConsole', 'config'];
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./blocks":17}],21:[function(require,module,exports){
module.exports = function(camera, app) {
  var cameraTilt = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(-Math.PI / 4, Math.PI / 4, 0, 'YXZ'));

  var lastGravityDir = null;
  var cameraQuat = new THREE.Quaternion();
  var cameraQuatFinal = new THREE.Quaternion();
  var trackball = null;

  var distance = 100;
  var target = new THREE.Vector3();
  var quaternion = new THREE.Quaternion();

  function tick() {
    var player = app.get('player');
    if (player == null) {
      return;
    }

    var rigidBody = app.getComponent(player, 'rigidBody');

    var gravityDir;
    if(rigidBody.grounded) {
      gravityDir = rigidBody.gravity.dir.clone();
    }else {
      gravityDir = rigidBody.gravity.forceDir.clone();
    }

    if(gravityDir.length() == 0) {
      return;
    }

    var a = gravityDir.clone().multiplyScalar(-1);

    var diff = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0).applyQuaternion(cameraQuat),
      a
    );

    cameraQuat.multiplyQuaternions(diff, cameraQuat);
    cameraQuatFinal = new THREE.Quaternion().multiplyQuaternions(
      cameraQuat,
      cameraTilt);

    quaternion.slerp(cameraQuatFinal, 0.1);

    lastGravity = gravityDir;

    updateCamera();
  };

  function updateCamera() {
    var diff = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(quaternion)
      .setLength(distance);
    var pos = target.clone()
      .add(diff);
    camera.position.copy(pos);

    var up = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);
    camera.up.copy(up);
    camera.lookAt(target);
  };

  return {
    tick: tick
  };
};

module.exports.$inject = ['app'];
},{}],22:[function(require,module,exports){
module.exports = function(object, app, input, camera) {
  "use strict";

  var character = null;

  var lastGravity = null;

  var rigidBody = null;

  function tick() {
    var forwardAmount = 0;
    if (input.keyHold('w')) forwardAmount += 1;
    if (input.keyHold('s')) forwardAmount -= 1;

    var rightAmount = 0;
    if (input.keyHold('d')) rightAmount += 1;
    if (input.keyHold('a')) rightAmount -= 1;

    var gravity = rigidBody.gravity;

    if(gravity != null) {
      var normal = gravity.dir.clone().multiplyScalar(-1);

      var up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
      var right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

      var move = up.multiplyScalar(forwardAmount).add(right.multiplyScalar(rightAmount));
      move.projectOnPlane(normal);
      move.setLength(1);

      character.move(move, 1);

      if (input.keyDown('space')) {
        character.jump();
      }  
    }
  };

  return {
    type: 'playerControl',
    tick: tick,
    set character(value) {
      character = value;
    },
    set rigidBody(value) {
      rigidBody = value
    }
  }
};

module.exports.$inject = ['app', 'input', 'camera'];
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

module.exports = function() {
  "use strict";

  function guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }

  var app = {};
  var map = {};
  var frameRate = 48.0;
  var systems = [];
  var bindings = {};

  function attach(object, factory) {
    var args = [object];
    if (factory.$inject != null) {
      factory.$inject.forEach(function(dep) {
        args.push(resolve(dep));
      });
    }

    var component = new(Function.prototype.bind.apply(factory, [null].concat(args)));

    if (component != null) {
      component.object = object;
      if (object._id == null) object._id = guid();
      if (component._id == null) component._id = guid();
      var components = map[object._id];
      if (components == null) components = map[object._id] = {};
      components[component._id] = component;

      for (var i = 0; i < systems.length; i++) {
        var system = systems[i];
        if (system.onAttach != null) system.onAttach(object, component);
      }
    }

    return component;
  };

  function use(type, system) {
    var hasType = typeof type === 'string';
    if (!hasType) {
      system = type;
    }

    if (system != null) {
      systems.push(system);
      if (hasType) {
        value(type, system);
      }
    }

    return system;
  };

  function tick() {
    for (var i = 0; i < systems.length; i++) {
      var system = systems[i];
      if (system.tick != null) system.tick();
    }

    for (var i in map) {
      var components = map[i];
      for (var j in components) {
        var component = components[j];
        if (component.tick != null) component.tick();
      }
    }

    for (var i = 0; i < systems.length; i++) {
      var system = systems[i];
      if (system.lateTick != null) system.lateTick();
    }
    setTimeout(tick, 1000 / frameRate);
  };

  function start() {
    // Start loop
    tick();
  };

  function value(type, object) {
    bindings[type] = {
      value: object
    };
  };

  function resolve(type) {
    var binding = bindings[type];
    if (binding == null) {
      throw new Error('binding for type ' + type + ' not found');
    }
    if (binding.value != null) {
      return binding.value;
    }
    return undefined;
  };

  function getComponent(object, type) {
    var components = map[object._id];
    for (var id in components) {
      if (components[id].type === type) {
        return components[id];
      }
    }
  };

  var entityBindings = {};
  var entityIdCount = 0;
  var entities = {};

  function loadAssembly(assembly) {
    return assembly(this);
  };

  var componentBindings = {};

  function registerComponent(type, constructor) {
    componentBindings[type] = constructor;
  };

  function createComponent(type) {
    var constructor = componentBindings[type];
    if (constructor == null) {
      throw new Error('binding not found for type: ' + type);
    }
    var component = new constructor();
    component.app = this;
  };

  var app = {
    start: start,
    use: use,
    attach: attach,
    value: value,
    getComponent: getComponent,
    loadAssembly: loadAssembly,
    get: resolve,
    registerComponent: registerComponent,
    createComponent: createComponent
  };

  events.prototype.apply(app);

  return app;
};
},{"./events":25}],25:[function(require,module,exports){
var Events = function() {
  this._listeners = {};
};

Events.prototype.emit = function(event) {
  var args = Array.prototype.slice.call(arguments);

  var callbacks = this._listeners[event];
  if (callbacks == null) {
    return;
  }
  for (var i = 0; i < callbacks.length; i++) {
    var callback = callbacks[i];
    callback.apply(null, args);
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
module.exports={
	"editor_ground_size": 32
}
},{}],27:[function(require,module,exports){
(function (global){
var THREE = (typeof window !== "undefined" ? window['THREE'] : typeof global !== "undefined" ? global['THREE'] : null);
var b = require('./core/b');

var app = b();

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

// Regsiter values
app.value('app', app);
app.value('scene', scene);
app.value('camera', camera);
app.value('config', require('./data/config.json'));

var textures = [
  THREE.ImageUtils.loadTexture('images/1.png'),
  THREE.ImageUtils.loadTexture('images/2.png'),
  THREE.ImageUtils.loadTexture('images/98.png'),
  THREE.ImageUtils.loadTexture('images/99.png')
];

var materials = [];

for (var i = 0; i < textures.length; i++) {
  var texture = textures[i];
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  materials.push(new THREE.MeshLambertMaterial({
    map: texture
  }));
}

app.value('textures', textures);
app.value('materials', materials);

var container = document.getElementById('container');
app.use(require('./systems/renderer')(scene, camera, container));
app.use('input', require('./systems/input')(container));
app.use(require('./voxel/voxel')());
var devConsole = require('./systems/devconsole')({
  onblur: function() {
    container.focus();
  }
});
app.use('devConsole', devConsole);

// Attach camera control
function loadGame() {
  app.attach(camera, require('./components/playerCamera'));

  app.loadAssembly(require('./assemblies/aground'));

  var player = app.loadAssembly(require('./assemblies/aplayer'));
  app.value('player', player);
};

function loadEditor() {
  app.attach(camera, require('./components/dragcamera'));
  app.loadAssembly(require('./assemblies/aeditor'));
}

loadEditor();

app.start();
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./assemblies/aeditor":14,"./assemblies/aground":15,"./assemblies/aplayer":16,"./components/dragcamera":19,"./components/playerCamera":21,"./core/b":24,"./data/config.json":26,"./systems/devconsole":28,"./systems/input":29,"./systems/renderer":30,"./voxel/voxel":34}],28:[function(require,module,exports){
var parseArgs = require('minimist');

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
      var result = command(parseArgs(args.split(' ')));
      if (typeof result === 'string') {
        addLog(result);
      }
    }

    input.value = '';

    hide();
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
    if (e.keyCode === 192) {
      if (div.hidden) {
        show();
      } else {
        hide();
      }
    }
  });

  // Hidden by default
  div.hidden = true;

  return {
    commands: commands
  };
};
},{"minimist":9}],29:[function(require,module,exports){
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
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
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
      return arrayUtils.includes(mousedowns, button);
    },

    mouseUp: function(button) {
      return arrayUtils.includes(mouseups, button);
    },

    mouseHold: function(button) {
      return arrayUtils.includes(mouseholds, button);
    },

    mouseClick: function(button) {
      return arrayUtils.includes(mouseclicks, button);
    },

    keyDown: function(key) {
      return arrayUtils.includes(keydowns, key);
    },

    keyUp: function(key) {
      return arrayUtils.includes(keyups, key);
    },

    keyHold: function(key) {
      return arrayUtils.includes(keyholds, key);
    },

    get mouseMove() {
      return mousemove;
    },

    lateTick: function() {
      clear();
    }
  };
};
},{"../utils/arrayutils":31,"keycode":8}],30:[function(require,module,exports){
var Stats = require('stats.js');

module.exports = function(scene, camera, container) {
  var renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0xf6f6f6);
  renderer.setSize(window.innerWidth, window.innerHeight);

  container = container || document.body;
  container.appendChild(renderer.domElement);

  var renderer, camera;
  var ssaoPass, effectComposer;

  var system = {};

  var stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.right = '0px';
  stats.domElement.style.bottom = '0px';

  document.body.appendChild(stats.domElement);

  var ambient = new THREE.AmbientLight(new THREE.Color("rgb(40%, 40%, 40%)"));
  var light = new THREE.DirectionalLight(0xffffff, 0.6);
  light.position.set(0.8, 1, 0.5);
  scene.add(light);
  scene.add(ambient);

  function render() {
    requestAnimationFrame(render);

    stats.begin();

    // Render depth into depthRenderTarget
    scene.overrideMaterial = depthMaterial;
    renderer.render(scene, camera, depthRenderTarget, true);

    // Render renderPass and SSAO shaderPass
    scene.overrideMaterial = null;
    effectComposer.render();

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
},{"stats.js":13}],31:[function(require,module,exports){
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
  }
};

module.exports = array;
},{}],32:[function(require,module,exports){
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
},{}],33:[function(require,module,exports){
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
},{"./gravity":32}],34:[function(require,module,exports){
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

},{"./gravityutils":33}],35:[function(require,module,exports){
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

},{"base64-js":36,"ieee754":37,"is-array":38}],36:[function(require,module,exports){
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

},{}],37:[function(require,module,exports){
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

},{}],38:[function(require,module,exports){

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

},{}]},{},[27])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYi1tZXNoZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYi1tZXNoZXIvbm9kZV9tb2R1bGVzL2dyZWVkeS1tZXNoZXIvZ3JlZWR5LmpzIiwibm9kZV9tb2R1bGVzL2ItbWVzaGVyL25vZGVfbW9kdWxlcy9ncmVlZHktbWVzaGVyL25vZGVfbW9kdWxlcy9pb3RhLWFycmF5L2lvdGEuanMiLCJub2RlX21vZHVsZXMvYi1tZXNoZXIvbm9kZV9tb2R1bGVzL2dyZWVkeS1tZXNoZXIvbm9kZV9tb2R1bGVzL3R5cGVkYXJyYXktcG9vbC9ub2RlX21vZHVsZXMvYml0LXR3aWRkbGUvdHdpZGRsZS5qcyIsIm5vZGVfbW9kdWxlcy9iLW1lc2hlci9ub2RlX21vZHVsZXMvZ3JlZWR5LW1lc2hlci9ub2RlX21vZHVsZXMvdHlwZWRhcnJheS1wb29sL25vZGVfbW9kdWxlcy9kdXAvZHVwLmpzIiwibm9kZV9tb2R1bGVzL2ItbWVzaGVyL25vZGVfbW9kdWxlcy9ncmVlZHktbWVzaGVyL25vZGVfbW9kdWxlcy90eXBlZGFycmF5LXBvb2wvcG9vbC5qcyIsIm5vZGVfbW9kdWxlcy9iLW1lc2hlci9ub2RlX21vZHVsZXMvZ3JlZWR5LW1lc2hlci9ub2RlX21vZHVsZXMvdW5pcS91bmlxLmpzIiwibm9kZV9tb2R1bGVzL2tleWNvZGUvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbWluaW1pc3QvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbmRhcnJheS9uZGFycmF5LmpzIiwibm9kZV9tb2R1bGVzL25kYXJyYXkvbm9kZV9tb2R1bGVzL2lzLWJ1ZmZlci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zdGF0cy5qcy9zcmMvU3RhdHMuanMiLCJzcmMvYXNzZW1ibGllcy9hZWRpdG9yLmpzIiwic3JjL2Fzc2VtYmxpZXMvYWdyb3VuZC5qcyIsInNyYy9hc3NlbWJsaWVzL2FwbGF5ZXIuanMiLCJzcmMvY29tcG9uZW50cy9ibG9ja3MuanMiLCJzcmMvY29tcG9uZW50cy9jaGFyYWN0ZXIuanMiLCJzcmMvY29tcG9uZW50cy9kcmFnY2FtZXJhLmpzIiwic3JjL2NvbXBvbmVudHMvZWRpdG9yLmpzIiwic3JjL2NvbXBvbmVudHMvcGxheWVyQ2FtZXJhLmpzIiwic3JjL2NvbXBvbmVudHMvcGxheWVyY29udHJvbC5qcyIsInNyYy9jb21wb25lbnRzL3JpZ2lkYm9keS5qcyIsInNyYy9jb3JlL2IuanMiLCJzcmMvY29yZS9ldmVudHMuanMiLCJzcmMvZGF0YS9jb25maWcuanNvbiIsInNyYy9tYWluLmpzIiwic3JjL3N5c3RlbXMvZGV2Y29uc29sZS5qcyIsInNyYy9zeXN0ZW1zL2lucHV0LmpzIiwic3JjL3N5c3RlbXMvcmVuZGVyZXIuanMiLCJzcmMvdXRpbHMvYXJyYXl1dGlscy5qcyIsInNyYy92b3hlbC9ncmF2aXR5LmpzIiwic3JjL3ZveGVsL2dyYXZpdHl1dGlscy5qcyIsInNyYy92b3hlbC92b3hlbC5qcyIsIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvaW5kZXguanMiLCIuLi8uLi8uLi8uLi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9iYXNlNjQtanMvbGliL2I2NC5qcyIsIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvbm9kZV9tb2R1bGVzL2llZWU3NTQvaW5kZXguanMiLCIuLi8uLi8uLi8uLi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pcy1hcnJheS9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3JOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3ZWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3BKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDOUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNwS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBOzs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzcvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBjb21waWxlTWVzaGVyID0gcmVxdWlyZSgnZ3JlZWR5LW1lc2hlcicpO1xudmFyIG5kYXJyYXkgPSByZXF1aXJlKCduZGFycmF5Jyk7XG5cbnZhciBtZXNoZXIgPSBjb21waWxlTWVzaGVyKHtcbiAgZXh0cmFBcmdzOiAxLFxuICBvcmRlcjogWzAsIDFdLFxuICBhcHBlbmQ6IGZ1bmN0aW9uKGxvX3gsIGxvX3ksIGhpX3gsIGhpX3ksIHZhbCwgcmVzdWx0KSB7XG4gICAgcmVzdWx0LnB1c2goW1xuICAgICAgW2xvX3gsIGxvX3ldLFxuICAgICAgW2hpX3gsIGhpX3ldXG4gICAgXSlcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odm94ZWwsIHZveGVsU2lkZVRleHR1cmVJZHMpIHtcbiAgdm94ZWxTaWRlVGV4dHVyZUlkcyA9IHZveGVsU2lkZVRleHR1cmVJZHMgfHwge307XG5cbiAgdmFyIGRpbSA9IHZveGVsLnNoYXBlO1xuICB2YXIgZGF0YSA9IHZveGVsLmRhdGE7XG5cbiAgdmFyIHZlcnRpY2VzID0gW107XG4gIHZhciBzdXJmYWNlcyA9IFtdO1xuXG4gIHZhciB1LCB2LCBkaW1zRCwgZGltc1UsIGRpbXNWLCB0ZDAsIHRkMSwgZHYsIGZsaXA7XG5cbiAgLy8gSW50ZXJhdGUgdGhyb3VnaCBkaW1lbnNpb25zXG4gIGZvciAodmFyIGQgPSAwOyBkIDwgMzsgZCsrKSB7XG4gICAgdSA9IChkICsgMSkgJSAzO1xuICAgIHYgPSAoZCArIDIpICUgMztcbiAgICBkaW1zRCA9IGRpbVtkXTtcbiAgICBkaW1zVSA9IGRpbVt1XTtcbiAgICBkaW1zViA9IGRpbVt2XTtcbiAgICB0ZDAgPSBkICogMjtcbiAgICB0ZDEgPSBkICogMiArIDE7XG5cbiAgICAvLyBJbnRlcmF0ZSB0aHJvdWdoIFNsaWNlc1xuICAgIGZsaXAgPSBmYWxzZTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRpbXNEOyBpKyspIHtcbiAgICAgIHByb2Nlc3NTbGljZShpKTtcbiAgICB9XG5cblxuICAgIC8vIEludGVyYXRlIHRocm91Z2ggU2xpY2VzIGZyb20gb3RoZXIgZGlyXG4gICAgZmxpcCA9IHRydWU7XG4gICAgZm9yICh2YXIgaSA9IGRpbXNEIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHByb2Nlc3NTbGljZShpKTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gcHJvY2Vzc1NsaWNlKGkpIHtcbiAgICB2YXIgc2xpY2UgPSBuZGFycmF5KFtdLCBbZGltc1UsIGRpbXNWXSk7XG5cbiAgICB2YXIgczAgPSAwO1xuICAgIGR2ID0gZmxpcCA/IGkgOiBpICsgMTtcblxuICAgIC8vSW50ZXJhdGUgdGhyb3VnaCB1dlxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGltc1U7IGorKykge1xuICAgICAgdmFyIHMxID0gMDtcbiAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgZGltc1Y7IGsrKykge1xuICAgICAgICB2YXIgYiA9IGdldFZveGVsKGksIGosIGssIGQpO1xuICAgICAgICBpZiAoIWIpIHtcbiAgICAgICAgICBzbGljZS5zZXQoaiwgaywgMCk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGIxO1xuICAgICAgICBpZiAoZmxpcCkge1xuICAgICAgICAgIGIxID0gaSA9PT0gMCA/IDAgOiBnZXRWb3hlbChpIC0gMSwgaiwgaywgZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYjEgPSBpID09PSBkaW1zRCAtIDEgPyAwIDogZ2V0Vm94ZWwoaSArIDEsIGosIGssIGQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghIWIxKSB7XG4gICAgICAgICAgc2xpY2Uuc2V0KGosIGssIDApO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0ID0gZ2V0VGV4dHVyZUlkKGIsIGZsaXAgPyB0ZDAgOiB0ZDEpO1xuICAgICAgICBzbGljZS5zZXQoaiwgaywgdCk7XG4gICAgICAgIHMxKys7XG4gICAgICB9XG4gICAgICBzMCsrO1xuICAgIH1cblxuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICBtZXNoZXIoc2xpY2UsIHJlc3VsdCk7XG5cbiAgICBpZiAocmVzdWx0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAodmFyIGwgPSAwOyBsIDwgcmVzdWx0Lmxlbmd0aDsgbCsrKSB7XG4gICAgICB2YXIgZiA9IHJlc3VsdFtsXTtcbiAgICAgIHZhciBsbyA9IGZbMF07XG4gICAgICB2YXIgaGkgPSBmWzFdO1xuICAgICAgdmFyIHNpemV1ID0gaGlbMF0gLSBsb1swXTtcbiAgICAgIHZhciBzaXpldiA9IGhpWzFdIC0gbG9bMV07XG5cbiAgICAgIHZhciBmdXZzID0gW1xuICAgICAgICBbMCwgMF0sXG4gICAgICAgIFtzaXpldSwgMF0sXG4gICAgICAgIFtzaXpldSwgc2l6ZXZdLFxuICAgICAgICBbMCwgc2l6ZXZdXG4gICAgICBdO1xuXG4gICAgICB2YXIgYyA9IHNsaWNlLmdldChsb1swXSwgbG9bMV0pO1xuXG4gICAgICB2YXIgdjAgPSBbXTtcbiAgICAgIHZhciB2MSA9IFtdO1xuICAgICAgdmFyIHYyID0gW107XG4gICAgICB2YXIgdjMgPSBbXTtcblxuICAgICAgdjBbZF0gPSBkdjtcbiAgICAgIHYwW3VdID0gbG9bMF07XG4gICAgICB2MFt2XSA9IGxvWzFdO1xuXG4gICAgICB2MVtkXSA9IGR2O1xuICAgICAgdjFbdV0gPSBoaVswXTtcbiAgICAgIHYxW3ZdID0gbG9bMV07XG5cbiAgICAgIHYyW2RdID0gZHY7XG4gICAgICB2Mlt1XSA9IGhpWzBdO1xuICAgICAgdjJbdl0gPSBoaVsxXTtcblxuICAgICAgdjNbZF0gPSBkdjtcbiAgICAgIHYzW3VdID0gbG9bMF07XG4gICAgICB2M1t2XSA9IGhpWzFdO1xuXG4gICAgICB2YXIgdmluZGV4ID0gdmVydGljZXMubGVuZ3RoO1xuICAgICAgdmVydGljZXMucHVzaCh2MCwgdjEsIHYyLCB2Myk7XG4gICAgICBpZiAoZmxpcCkge1xuICAgICAgICBzdXJmYWNlcy5wdXNoKHtcbiAgICAgICAgICBmYWNlOiBbdmluZGV4ICsgMywgdmluZGV4ICsgMiwgdmluZGV4ICsgMSwgdmluZGV4LCBjXSxcbiAgICAgICAgICB1djogW2Z1dnNbM10sIGZ1dnNbMl0sIGZ1dnNbMV0sIGZ1dnNbMF1dXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3VyZmFjZXMucHVzaCh7XG4gICAgICAgICAgZmFjZTogW3ZpbmRleCwgdmluZGV4ICsgMSwgdmluZGV4ICsgMiwgdmluZGV4ICsgMywgY10sXG4gICAgICAgICAgdXY6IFtmdXZzWzBdLCBmdXZzWzFdLCBmdXZzWzJdLCBmdXZzWzNdXVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRWb3hlbChpLCBqLCBrLCBkKSB7XG4gICAgaWYgKGQgPT09IDApIHtcbiAgICAgIHJldHVybiBkYXRhW2sgKyAoaiArIGkgKiBkaW1bMF0pICogZGltWzFdXTtcbiAgICB9IGVsc2UgaWYgKGQgPT09IDEpIHtcbiAgICAgIHJldHVybiBkYXRhW2ogKyAoaSArIGsgKiBkaW1bMF0pICogZGltWzFdXTtcbiAgICB9IGVsc2UgaWYgKGQgPT09IDIpIHtcbiAgICAgIHJldHVybiBkYXRhW2kgKyAoayArIGogKiBkaW1bMF0pICogZGltWzFdXTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0VGV4dHVyZUlkKGIsIHNpZGUpIHtcbiAgICBpZiAoIWIpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIHZhciBtYXAgPSB2b3hlbFNpZGVUZXh0dXJlSWRzW2JdO1xuICAgIGlmIChtYXAgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGI7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coc2lkZSk7XG4gICAgLy8gY29uc29sZS5sb2cobWFwW3NpZGVdIHx8IGIpO1xuICAgIHJldHVybiBtYXBbc2lkZV0gfHwgYjtcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIHZlcnRpY2VzOiB2ZXJ0aWNlcyxcbiAgICBzdXJmYWNlczogc3VyZmFjZXNcbiAgfVxufTtcblxudmFyIHZveGVsID0gbmRhcnJheShbXSwgWzMsIDMsIDNdKTtcbnZveGVsLnNldCgxLCAxLCAxLCAxKTtcblxubW9kdWxlLmV4cG9ydHModm94ZWwpOyIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBwb29sID0gcmVxdWlyZShcInR5cGVkYXJyYXktcG9vbFwiKVxudmFyIHVuaXEgPSByZXF1aXJlKFwidW5pcVwiKVxudmFyIGlvdGEgPSByZXF1aXJlKFwiaW90YS1hcnJheVwiKVxuXG5mdW5jdGlvbiBnZW5lcmF0ZU1lc2hlcihvcmRlciwgc2tpcCwgbWVyZ2UsIGFwcGVuZCwgbnVtX29wdGlvbnMsIG9wdGlvbnMsIHVzZUdldHRlcikge1xuICB2YXIgY29kZSA9IFtdXG4gIHZhciBkID0gb3JkZXIubGVuZ3RoXG4gIHZhciBpLCBqLCBrXG4gIFxuICAvL0J1aWxkIGFyZ3VtZW50cyBmb3IgYXBwZW5kIG1hY3JvXG4gIHZhciBhcHBlbmRfYXJncyA9IG5ldyBBcnJheSgyKmQrMStudW1fb3B0aW9ucylcbiAgZm9yKGk9MDsgaTxkOyArK2kpIHtcbiAgICBhcHBlbmRfYXJnc1tpXSA9IFwiaVwiK2lcbiAgfVxuICBmb3IoaT0wOyBpPGQ7ICsraSkge1xuICAgIGFwcGVuZF9hcmdzW2krZF0gPSBcImpcIitpXG4gIH1cbiAgYXBwZW5kX2FyZ3NbMipkXSA9IFwib3ZhbFwiXG4gIFxuICB2YXIgb3B0X2FyZ3MgPSBuZXcgQXJyYXkobnVtX29wdGlvbnMpXG4gIGZvcihpPTA7IGk8bnVtX29wdGlvbnM7ICsraSkge1xuICAgIG9wdF9hcmdzW2ldID0gXCJvcHRcIitpXG4gICAgYXBwZW5kX2FyZ3NbMipkKzEraV0gPSBcIm9wdFwiK2lcbiAgfVxuXG4gIC8vVW5wYWNrIHN0cmlkZSBhbmQgc2hhcGUgYXJyYXlzIGludG8gdmFyaWFibGVzXG4gIGNvZGUucHVzaChcInZhciBkYXRhPWFycmF5LmRhdGEsb2Zmc2V0PWFycmF5Lm9mZnNldCxzaGFwZT1hcnJheS5zaGFwZSxzdHJpZGU9YXJyYXkuc3RyaWRlXCIpXG4gIGZvcih2YXIgaT0wOyBpPGQ7ICsraSkge1xuICAgIGNvZGUucHVzaChbXCJ2YXIgc3RyaWRlXCIsaSxcIj1zdHJpZGVbXCIsb3JkZXJbaV0sXCJdfDAsc2hhcGVcIixpLFwiPXNoYXBlW1wiLG9yZGVyW2ldLFwiXXwwXCJdLmpvaW4oXCJcIikpXG4gICAgaWYoaSA+IDApIHtcbiAgICAgIGNvZGUucHVzaChbXCJ2YXIgYXN0ZXBcIixpLFwiPShzdHJpZGVcIixpLFwiLXN0cmlkZVwiLGktMSxcIipzaGFwZVwiLGktMSxcIil8MFwiXS5qb2luKFwiXCIpKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb2RlLnB1c2goW1widmFyIGFzdGVwXCIsaSxcIj1zdHJpZGVcIixpLFwifDBcIl0uam9pbihcIlwiKSlcbiAgICB9XG4gICAgaWYoaSA+IDApIHtcbiAgICAgIGNvZGUucHVzaChbXCJ2YXIgdnN0ZXBcIixpLFwiPSh2c3RlcFwiLGktMSxcIipzaGFwZVwiLGktMSxcIil8MFwiXS5qb2luKFwiXCIpKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb2RlLnB1c2goW1widmFyIHZzdGVwXCIsaSxcIj0xXCJdLmpvaW4oXCJcIikpXG4gICAgfVxuICAgIGNvZGUucHVzaChbXCJ2YXIgaVwiLGksXCI9MCxqXCIsaSxcIj0wLGtcIixpLFwiPTAsdXN0ZXBcIixpLFwiPXZzdGVwXCIsaSxcInwwLGJzdGVwXCIsaSxcIj1hc3RlcFwiLGksXCJ8MFwiXS5qb2luKFwiXCIpKVxuICB9XG4gIFxuICAvL0luaXRpYWxpemUgcG9pbnRlcnNcbiAgY29kZS5wdXNoKFwidmFyIGFfcHRyPW9mZnNldD4+PjAsYl9wdHI9MCx1X3B0cj0wLHZfcHRyPTAsaT0wLGQ9MCx2YWw9MCxvdmFsPTBcIilcbiAgXG4gIC8vSW5pdGlhbGl6ZSBjb3VudFxuICBjb2RlLnB1c2goXCJ2YXIgY291bnQ9XCIgKyBpb3RhKGQpLm1hcChmdW5jdGlvbihpKSB7IHJldHVybiBcInNoYXBlXCIraX0pLmpvaW4oXCIqXCIpKVxuICBjb2RlLnB1c2goXCJ2YXIgdmlzaXRlZD1tYWxsb2NVaW50OChjb3VudClcIilcbiAgXG4gIC8vWmVybyBvdXQgdmlzaXRlZCBtYXBcbiAgY29kZS5wdXNoKFwiZm9yKDtpPGNvdW50OysraSl7dmlzaXRlZFtpXT0wfVwiKVxuICBcbiAgLy9CZWdpbiB0cmF2ZXJzYWxcbiAgZm9yKGk9ZC0xOyBpPj0wOyAtLWkpIHtcbiAgICBjb2RlLnB1c2goW1wiZm9yKGlcIixpLFwiPTA7aVwiLGksXCI8c2hhcGVcIixpLFwiOysraVwiLGksXCIpe1wiXS5qb2luKFwiXCIpKVxuICB9XG4gIGNvZGUucHVzaChcImlmKCF2aXNpdGVkW3ZfcHRyXSl7XCIpXG4gIFxuICAgIGlmKHVzZUdldHRlcikge1xuICAgICAgY29kZS5wdXNoKFwidmFsPWRhdGEuZ2V0KGFfcHRyKVwiKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb2RlLnB1c2goXCJ2YWw9ZGF0YVthX3B0cl1cIilcbiAgICB9XG4gIFxuICAgIGlmKHNraXApIHtcbiAgICAgIGNvZGUucHVzaChcImlmKCFza2lwKHZhbCkpe1wiKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb2RlLnB1c2goXCJpZih2YWwhPT0wKXtcIilcbiAgICB9XG4gIFxuICAgICAgLy9TYXZlIHZhbCB0byBvdmFsXG4gICAgICBjb2RlLnB1c2goXCJvdmFsID0gdmFsXCIpXG4gIFxuICAgICAgLy9HZW5lcmF0ZSBtZXJnaW5nIGNvZGVcbiAgICAgIGZvcihpPTA7IGk8ZDsgKytpKSB7XG4gICAgICAgIGNvZGUucHVzaChcInVfcHRyPXZfcHRyK3ZzdGVwXCIraSlcbiAgICAgICAgY29kZS5wdXNoKFwiYl9wdHI9YV9wdHIrc3RyaWRlXCIraSlcbiAgICAgICAgY29kZS5wdXNoKFtcImpcIixpLFwiX2xvb3A6IGZvcihqXCIsaSxcIj0xK2lcIixpLFwiO2pcIixpLFwiPHNoYXBlXCIsaSxcIjsrK2pcIixpLFwiKXtcIl0uam9pbihcIlwiKSlcbiAgICAgICAgZm9yKGo9aS0xOyBqPj0wOyAtLWopIHtcbiAgICAgICAgICBjb2RlLnB1c2goW1wiZm9yKGtcIixqLFwiPWlcIixqLFwiO2tcIixqLFwiPGpcIixqLFwiOysra1wiLGosXCIpe1wiXS5qb2luKFwiXCIpKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAgIC8vQ2hlY2sgaWYgd2UgY2FuIG1lcmdlIHRoaXMgdm94ZWxcbiAgICAgICAgICBjb2RlLnB1c2goXCJpZih2aXNpdGVkW3VfcHRyXSkgeyBicmVhayBqXCIraStcIl9sb29wOyB9XCIpXG4gICAgICAgIFxuICAgICAgICAgIGlmKHVzZUdldHRlcikge1xuICAgICAgICAgICAgY29kZS5wdXNoKFwidmFsPWRhdGEuZ2V0KGJfcHRyKVwiKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb2RlLnB1c2goXCJ2YWw9ZGF0YVtiX3B0cl1cIilcbiAgICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAgIGlmKHNraXAgJiYgbWVyZ2UpIHtcbiAgICAgICAgICAgIGNvZGUucHVzaChcImlmKHNraXAodmFsKSB8fCAhbWVyZ2Uob3ZhbCx2YWwpKXsgYnJlYWsgalwiK2krXCJfbG9vcDsgfVwiKVxuICAgICAgICAgIH0gZWxzZSBpZihza2lwKSB7XG4gICAgICAgICAgICBjb2RlLnB1c2goXCJpZihza2lwKHZhbCkgfHwgdmFsICE9PSBvdmFsKXsgYnJlYWsgalwiK2krXCJfbG9vcDsgfVwiKVxuICAgICAgICAgIH0gZWxzZSBpZihtZXJnZSkge1xuICAgICAgICAgICAgY29kZS5wdXNoKFwiaWYodmFsID09PSAwIHx8ICFtZXJnZShvdmFsLHZhbCkpeyBicmVhayBqXCIraStcIl9sb29wOyB9XCIpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvZGUucHVzaChcImlmKHZhbCA9PT0gMCB8fCB2YWwgIT09IG92YWwpeyBicmVhayBqXCIraStcIl9sb29wOyB9XCIpXG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vQ2xvc2Ugb2ZmIGxvb3AgYm9kaWVzXG4gICAgICAgICAgY29kZS5wdXNoKFwiKyt1X3B0clwiKVxuICAgICAgICAgIGNvZGUucHVzaChcImJfcHRyKz1zdHJpZGUwXCIpXG4gICAgICAgIGNvZGUucHVzaChcIn1cIilcbiAgICAgICAgXG4gICAgICAgIGZvcihqPTE7IGo8PWk7ICsraikge1xuICAgICAgICAgIGNvZGUucHVzaChcInVfcHRyKz11c3RlcFwiK2opXG4gICAgICAgICAgY29kZS5wdXNoKFwiYl9wdHIrPWJzdGVwXCIrailcbiAgICAgICAgICBjb2RlLnB1c2goXCJ9XCIpXG4gICAgICAgIH1cbiAgICAgICAgaWYoaSA8IGQtMSkge1xuICAgICAgICAgIGNvZGUucHVzaChcImQ9alwiK2krXCItaVwiK2kpXG4gICAgICAgICAgY29kZS5wdXNoKFtcInVzdGVwXCIsaSsxLFwiPSh2c3RlcFwiLGkrMSxcIi12c3RlcFwiLGksXCIqZCl8MFwiXS5qb2luKFwiXCIpKVxuICAgICAgICAgIGNvZGUucHVzaChbXCJic3RlcFwiLGkrMSxcIj0oc3RyaWRlXCIsaSsxLFwiLXN0cmlkZVwiLGksXCIqZCl8MFwiXS5qb2luKFwiXCIpKVxuICAgICAgICB9XG4gICAgICB9XG4gIFxuICAgICAgLy9NYXJrIG9mZiB2aXNpdGVkIHRhYmxlXG4gICAgICBjb2RlLnB1c2goXCJ1X3B0cj12X3B0clwiKVxuICAgICAgZm9yKGk9ZC0xOyBpPj0wOyAtLWkpIHtcbiAgICAgICAgY29kZS5wdXNoKFtcImZvcihrXCIsaSxcIj1pXCIsaSxcIjtrXCIsaSxcIjxqXCIsaSxcIjsrK2tcIixpLFwiKXtcIl0uam9pbihcIlwiKSlcbiAgICAgIH1cbiAgICAgIGNvZGUucHVzaChcInZpc2l0ZWRbdV9wdHIrK109MVwiKVxuICAgICAgY29kZS5wdXNoKFwifVwiKVxuICAgICAgZm9yKGk9MTsgaTxkOyArK2kpIHtcbiAgICAgICAgY29kZS5wdXNoKFwidV9wdHIrPXVzdGVwXCIraSlcbiAgICAgICAgY29kZS5wdXNoKFwifVwiKVxuICAgICAgfVxuICBcbiAgICAgIC8vQXBwZW5kIGNodW5rIHRvIG1lc2hcbiAgICAgIGNvZGUucHVzaChcImFwcGVuZChcIisgYXBwZW5kX2FyZ3Muam9pbihcIixcIikrIFwiKVwiKVxuICAgIFxuICAgIGNvZGUucHVzaChcIn1cIilcbiAgY29kZS5wdXNoKFwifVwiKVxuICBjb2RlLnB1c2goXCIrK3ZfcHRyXCIpXG4gIGZvcih2YXIgaT0wOyBpPGQ7ICsraSkge1xuICAgIGNvZGUucHVzaChcImFfcHRyKz1hc3RlcFwiK2kpXG4gICAgY29kZS5wdXNoKFwifVwiKVxuICB9XG4gIFxuICBjb2RlLnB1c2goXCJmcmVlVWludDgodmlzaXRlZClcIilcbiAgXG4gIGlmKG9wdGlvbnMuZGVidWcpIHtcbiAgICBjb25zb2xlLmxvZyhcIkdFTkVSQVRJTkcgTUVTSEVSOlwiKVxuICAgIGNvbnNvbGUubG9nKGNvZGUuam9pbihcIlxcblwiKSlcbiAgfVxuICBcbiAgLy9Db21waWxlIHByb2NlZHVyZVxuICB2YXIgYXJncyA9IFtcImFwcGVuZFwiLCBcIm1hbGxvY1VpbnQ4XCIsIFwiZnJlZVVpbnQ4XCJdXG4gIGlmKG1lcmdlKSB7XG4gICAgYXJncy51bnNoaWZ0KFwibWVyZ2VcIilcbiAgfVxuICBpZihza2lwKSB7XG4gICAgYXJncy51bnNoaWZ0KFwic2tpcFwiKVxuICB9XG4gIFxuICAvL0J1aWxkIHdyYXBwZXJcbiAgdmFyIGxvY2FsX2FyZ3MgPSBbXCJhcnJheVwiXS5jb25jYXQob3B0X2FyZ3MpXG4gIHZhciBmdW5jTmFtZSA9IFtcImdyZWVkeU1lc2hlclwiLCBkLCBcImRfb3JkXCIsIG9yZGVyLmpvaW4oXCJzXCIpICwgKHNraXAgPyBcInNraXBcIiA6IFwiXCIpICwgKG1lcmdlID8gXCJtZXJnZVwiIDogXCJcIildLmpvaW4oXCJcIilcbiAgdmFyIGdlbl9ib2R5ID0gW1wiJ3VzZSBzdHJpY3QnO2Z1bmN0aW9uIFwiLCBmdW5jTmFtZSwgXCIoXCIsIGxvY2FsX2FyZ3Muam9pbihcIixcIiksIFwiKXtcIiwgY29kZS5qb2luKFwiXFxuXCIpLCBcIn07cmV0dXJuIFwiLCBmdW5jTmFtZV0uam9pbihcIlwiKVxuICBhcmdzLnB1c2goZ2VuX2JvZHkpXG4gIHZhciBwcm9jID0gRnVuY3Rpb24uYXBwbHkodW5kZWZpbmVkLCBhcmdzKVxuICBcbiAgaWYoc2tpcCAmJiBtZXJnZSkge1xuICAgIHJldHVybiBwcm9jKHNraXAsIG1lcmdlLCBhcHBlbmQsIHBvb2wubWFsbG9jVWludDgsIHBvb2wuZnJlZVVpbnQ4KVxuICB9IGVsc2UgaWYoc2tpcCkge1xuICAgIHJldHVybiBwcm9jKHNraXAsIGFwcGVuZCwgcG9vbC5tYWxsb2NVaW50OCwgcG9vbC5mcmVlVWludDgpXG4gIH0gZWxzZSBpZihtZXJnZSkge1xuICAgIHJldHVybiBwcm9jKG1lcmdlLCBhcHBlbmQsIHBvb2wubWFsbG9jVWludDgsIHBvb2wuZnJlZVVpbnQ4KVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBwcm9jKGFwcGVuZCwgcG9vbC5tYWxsb2NVaW50OCwgcG9vbC5mcmVlVWludDgpXG4gIH1cbn1cblxuLy9UaGUgYWN0dWFsIG1lc2ggY29tcGlsZXJcbmZ1bmN0aW9uIGNvbXBpbGVNZXNoZXIob3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICBpZighb3B0aW9ucy5vcmRlcikge1xuICAgIHRocm93IG5ldyBFcnJvcihcImdyZWVkeS1tZXNoZXI6IE1pc3Npbmcgb3JkZXIgZmllbGRcIilcbiAgfVxuICBpZighb3B0aW9ucy5hcHBlbmQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJncmVlZHktbWVzaGVyOiBNaXNzaW5nIGFwcGVuZCBmaWVsZFwiKVxuICB9XG4gIHJldHVybiBnZW5lcmF0ZU1lc2hlcihcbiAgICBvcHRpb25zLm9yZGVyLFxuICAgIG9wdGlvbnMuc2tpcCxcbiAgICBvcHRpb25zLm1lcmdlLFxuICAgIG9wdGlvbnMuYXBwZW5kLFxuICAgIG9wdGlvbnMuZXh0cmFBcmdzfDAsXG4gICAgb3B0aW9ucyxcbiAgICAhIW9wdGlvbnMudXNlR2V0dGVyXG4gIClcbn1cbm1vZHVsZS5leHBvcnRzID0gY29tcGlsZU1lc2hlclxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuZnVuY3Rpb24gaW90YShuKSB7XG4gIHZhciByZXN1bHQgPSBuZXcgQXJyYXkobilcbiAgZm9yKHZhciBpPTA7IGk8bjsgKytpKSB7XG4gICAgcmVzdWx0W2ldID0gaVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpb3RhIiwiLyoqXG4gKiBCaXQgdHdpZGRsaW5nIGhhY2tzIGZvciBKYXZhU2NyaXB0LlxuICpcbiAqIEF1dGhvcjogTWlrb2xhIEx5c2Vua29cbiAqXG4gKiBQb3J0ZWQgZnJvbSBTdGFuZm9yZCBiaXQgdHdpZGRsaW5nIGhhY2sgbGlicmFyeTpcbiAqICAgIGh0dHA6Ly9ncmFwaGljcy5zdGFuZm9yZC5lZHUvfnNlYW5kZXIvYml0aGFja3MuaHRtbFxuICovXG5cblwidXNlIHN0cmljdFwiOyBcInVzZSByZXN0cmljdFwiO1xuXG4vL051bWJlciBvZiBiaXRzIGluIGFuIGludGVnZXJcbnZhciBJTlRfQklUUyA9IDMyO1xuXG4vL0NvbnN0YW50c1xuZXhwb3J0cy5JTlRfQklUUyAgPSBJTlRfQklUUztcbmV4cG9ydHMuSU5UX01BWCAgID0gIDB4N2ZmZmZmZmY7XG5leHBvcnRzLklOVF9NSU4gICA9IC0xPDwoSU5UX0JJVFMtMSk7XG5cbi8vUmV0dXJucyAtMSwgMCwgKzEgZGVwZW5kaW5nIG9uIHNpZ24gb2YgeFxuZXhwb3J0cy5zaWduID0gZnVuY3Rpb24odikge1xuICByZXR1cm4gKHYgPiAwKSAtICh2IDwgMCk7XG59XG5cbi8vQ29tcHV0ZXMgYWJzb2x1dGUgdmFsdWUgb2YgaW50ZWdlclxuZXhwb3J0cy5hYnMgPSBmdW5jdGlvbih2KSB7XG4gIHZhciBtYXNrID0gdiA+PiAoSU5UX0JJVFMtMSk7XG4gIHJldHVybiAodiBeIG1hc2spIC0gbWFzaztcbn1cblxuLy9Db21wdXRlcyBtaW5pbXVtIG9mIGludGVnZXJzIHggYW5kIHlcbmV4cG9ydHMubWluID0gZnVuY3Rpb24oeCwgeSkge1xuICByZXR1cm4geSBeICgoeCBeIHkpICYgLSh4IDwgeSkpO1xufVxuXG4vL0NvbXB1dGVzIG1heGltdW0gb2YgaW50ZWdlcnMgeCBhbmQgeVxuZXhwb3J0cy5tYXggPSBmdW5jdGlvbih4LCB5KSB7XG4gIHJldHVybiB4IF4gKCh4IF4geSkgJiAtKHggPCB5KSk7XG59XG5cbi8vQ2hlY2tzIGlmIGEgbnVtYmVyIGlzIGEgcG93ZXIgb2YgdHdvXG5leHBvcnRzLmlzUG93MiA9IGZ1bmN0aW9uKHYpIHtcbiAgcmV0dXJuICEodiAmICh2LTEpKSAmJiAoISF2KTtcbn1cblxuLy9Db21wdXRlcyBsb2cgYmFzZSAyIG9mIHZcbmV4cG9ydHMubG9nMiA9IGZ1bmN0aW9uKHYpIHtcbiAgdmFyIHIsIHNoaWZ0O1xuICByID0gICAgICh2ID4gMHhGRkZGKSA8PCA0OyB2ID4+Pj0gcjtcbiAgc2hpZnQgPSAodiA+IDB4RkYgICkgPDwgMzsgdiA+Pj49IHNoaWZ0OyByIHw9IHNoaWZ0O1xuICBzaGlmdCA9ICh2ID4gMHhGICAgKSA8PCAyOyB2ID4+Pj0gc2hpZnQ7IHIgfD0gc2hpZnQ7XG4gIHNoaWZ0ID0gKHYgPiAweDMgICApIDw8IDE7IHYgPj4+PSBzaGlmdDsgciB8PSBzaGlmdDtcbiAgcmV0dXJuIHIgfCAodiA+PiAxKTtcbn1cblxuLy9Db21wdXRlcyBsb2cgYmFzZSAxMCBvZiB2XG5leHBvcnRzLmxvZzEwID0gZnVuY3Rpb24odikge1xuICByZXR1cm4gICh2ID49IDEwMDAwMDAwMDApID8gOSA6ICh2ID49IDEwMDAwMDAwMCkgPyA4IDogKHYgPj0gMTAwMDAwMDApID8gNyA6XG4gICAgICAgICAgKHYgPj0gMTAwMDAwMCkgPyA2IDogKHYgPj0gMTAwMDAwKSA/IDUgOiAodiA+PSAxMDAwMCkgPyA0IDpcbiAgICAgICAgICAodiA+PSAxMDAwKSA/IDMgOiAodiA+PSAxMDApID8gMiA6ICh2ID49IDEwKSA/IDEgOiAwO1xufVxuXG4vL0NvdW50cyBudW1iZXIgb2YgYml0c1xuZXhwb3J0cy5wb3BDb3VudCA9IGZ1bmN0aW9uKHYpIHtcbiAgdiA9IHYgLSAoKHYgPj4+IDEpICYgMHg1NTU1NTU1NSk7XG4gIHYgPSAodiAmIDB4MzMzMzMzMzMpICsgKCh2ID4+PiAyKSAmIDB4MzMzMzMzMzMpO1xuICByZXR1cm4gKCh2ICsgKHYgPj4+IDQpICYgMHhGMEYwRjBGKSAqIDB4MTAxMDEwMSkgPj4+IDI0O1xufVxuXG4vL0NvdW50cyBudW1iZXIgb2YgdHJhaWxpbmcgemVyb3NcbmZ1bmN0aW9uIGNvdW50VHJhaWxpbmdaZXJvcyh2KSB7XG4gIHZhciBjID0gMzI7XG4gIHYgJj0gLXY7XG4gIGlmICh2KSBjLS07XG4gIGlmICh2ICYgMHgwMDAwRkZGRikgYyAtPSAxNjtcbiAgaWYgKHYgJiAweDAwRkYwMEZGKSBjIC09IDg7XG4gIGlmICh2ICYgMHgwRjBGMEYwRikgYyAtPSA0O1xuICBpZiAodiAmIDB4MzMzMzMzMzMpIGMgLT0gMjtcbiAgaWYgKHYgJiAweDU1NTU1NTU1KSBjIC09IDE7XG4gIHJldHVybiBjO1xufVxuZXhwb3J0cy5jb3VudFRyYWlsaW5nWmVyb3MgPSBjb3VudFRyYWlsaW5nWmVyb3M7XG5cbi8vUm91bmRzIHRvIG5leHQgcG93ZXIgb2YgMlxuZXhwb3J0cy5uZXh0UG93MiA9IGZ1bmN0aW9uKHYpIHtcbiAgdiArPSB2ID09PSAwO1xuICAtLXY7XG4gIHYgfD0gdiA+Pj4gMTtcbiAgdiB8PSB2ID4+PiAyO1xuICB2IHw9IHYgPj4+IDQ7XG4gIHYgfD0gdiA+Pj4gODtcbiAgdiB8PSB2ID4+PiAxNjtcbiAgcmV0dXJuIHYgKyAxO1xufVxuXG4vL1JvdW5kcyBkb3duIHRvIHByZXZpb3VzIHBvd2VyIG9mIDJcbmV4cG9ydHMucHJldlBvdzIgPSBmdW5jdGlvbih2KSB7XG4gIHYgfD0gdiA+Pj4gMTtcbiAgdiB8PSB2ID4+PiAyO1xuICB2IHw9IHYgPj4+IDQ7XG4gIHYgfD0gdiA+Pj4gODtcbiAgdiB8PSB2ID4+PiAxNjtcbiAgcmV0dXJuIHYgLSAodj4+PjEpO1xufVxuXG4vL0NvbXB1dGVzIHBhcml0eSBvZiB3b3JkXG5leHBvcnRzLnBhcml0eSA9IGZ1bmN0aW9uKHYpIHtcbiAgdiBePSB2ID4+PiAxNjtcbiAgdiBePSB2ID4+PiA4O1xuICB2IF49IHYgPj4+IDQ7XG4gIHYgJj0gMHhmO1xuICByZXR1cm4gKDB4Njk5NiA+Pj4gdikgJiAxO1xufVxuXG52YXIgUkVWRVJTRV9UQUJMRSA9IG5ldyBBcnJheSgyNTYpO1xuXG4oZnVuY3Rpb24odGFiKSB7XG4gIGZvcih2YXIgaT0wOyBpPDI1NjsgKytpKSB7XG4gICAgdmFyIHYgPSBpLCByID0gaSwgcyA9IDc7XG4gICAgZm9yICh2ID4+Pj0gMTsgdjsgdiA+Pj49IDEpIHtcbiAgICAgIHIgPDw9IDE7XG4gICAgICByIHw9IHYgJiAxO1xuICAgICAgLS1zO1xuICAgIH1cbiAgICB0YWJbaV0gPSAociA8PCBzKSAmIDB4ZmY7XG4gIH1cbn0pKFJFVkVSU0VfVEFCTEUpO1xuXG4vL1JldmVyc2UgYml0cyBpbiBhIDMyIGJpdCB3b3JkXG5leHBvcnRzLnJldmVyc2UgPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiAgKFJFVkVSU0VfVEFCTEVbIHYgICAgICAgICAmIDB4ZmZdIDw8IDI0KSB8XG4gICAgICAgICAgKFJFVkVSU0VfVEFCTEVbKHYgPj4+IDgpICAmIDB4ZmZdIDw8IDE2KSB8XG4gICAgICAgICAgKFJFVkVSU0VfVEFCTEVbKHYgPj4+IDE2KSAmIDB4ZmZdIDw8IDgpICB8XG4gICAgICAgICAgIFJFVkVSU0VfVEFCTEVbKHYgPj4+IDI0KSAmIDB4ZmZdO1xufVxuXG4vL0ludGVybGVhdmUgYml0cyBvZiAyIGNvb3JkaW5hdGVzIHdpdGggMTYgYml0cy4gIFVzZWZ1bCBmb3IgZmFzdCBxdWFkdHJlZSBjb2Rlc1xuZXhwb3J0cy5pbnRlcmxlYXZlMiA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgeCAmPSAweEZGRkY7XG4gIHggPSAoeCB8ICh4IDw8IDgpKSAmIDB4MDBGRjAwRkY7XG4gIHggPSAoeCB8ICh4IDw8IDQpKSAmIDB4MEYwRjBGMEY7XG4gIHggPSAoeCB8ICh4IDw8IDIpKSAmIDB4MzMzMzMzMzM7XG4gIHggPSAoeCB8ICh4IDw8IDEpKSAmIDB4NTU1NTU1NTU7XG5cbiAgeSAmPSAweEZGRkY7XG4gIHkgPSAoeSB8ICh5IDw8IDgpKSAmIDB4MDBGRjAwRkY7XG4gIHkgPSAoeSB8ICh5IDw8IDQpKSAmIDB4MEYwRjBGMEY7XG4gIHkgPSAoeSB8ICh5IDw8IDIpKSAmIDB4MzMzMzMzMzM7XG4gIHkgPSAoeSB8ICh5IDw8IDEpKSAmIDB4NTU1NTU1NTU7XG5cbiAgcmV0dXJuIHggfCAoeSA8PCAxKTtcbn1cblxuLy9FeHRyYWN0cyB0aGUgbnRoIGludGVybGVhdmVkIGNvbXBvbmVudFxuZXhwb3J0cy5kZWludGVybGVhdmUyID0gZnVuY3Rpb24odiwgbikge1xuICB2ID0gKHYgPj4+IG4pICYgMHg1NTU1NTU1NTtcbiAgdiA9ICh2IHwgKHYgPj4+IDEpKSAgJiAweDMzMzMzMzMzO1xuICB2ID0gKHYgfCAodiA+Pj4gMikpICAmIDB4MEYwRjBGMEY7XG4gIHYgPSAodiB8ICh2ID4+PiA0KSkgICYgMHgwMEZGMDBGRjtcbiAgdiA9ICh2IHwgKHYgPj4+IDE2KSkgJiAweDAwMEZGRkY7XG4gIHJldHVybiAodiA8PCAxNikgPj4gMTY7XG59XG5cblxuLy9JbnRlcmxlYXZlIGJpdHMgb2YgMyBjb29yZGluYXRlcywgZWFjaCB3aXRoIDEwIGJpdHMuICBVc2VmdWwgZm9yIGZhc3Qgb2N0cmVlIGNvZGVzXG5leHBvcnRzLmludGVybGVhdmUzID0gZnVuY3Rpb24oeCwgeSwgeikge1xuICB4ICY9IDB4M0ZGO1xuICB4ICA9ICh4IHwgKHg8PDE2KSkgJiA0Mjc4MTkwMzM1O1xuICB4ICA9ICh4IHwgKHg8PDgpKSAgJiAyNTE3MTk2OTU7XG4gIHggID0gKHggfCAoeDw8NCkpICAmIDMyNzIzNTYwMzU7XG4gIHggID0gKHggfCAoeDw8MikpICAmIDEyMjcxMzM1MTM7XG5cbiAgeSAmPSAweDNGRjtcbiAgeSAgPSAoeSB8ICh5PDwxNikpICYgNDI3ODE5MDMzNTtcbiAgeSAgPSAoeSB8ICh5PDw4KSkgICYgMjUxNzE5Njk1O1xuICB5ICA9ICh5IHwgKHk8PDQpKSAgJiAzMjcyMzU2MDM1O1xuICB5ICA9ICh5IHwgKHk8PDIpKSAgJiAxMjI3MTMzNTEzO1xuICB4IHw9ICh5IDw8IDEpO1xuICBcbiAgeiAmPSAweDNGRjtcbiAgeiAgPSAoeiB8ICh6PDwxNikpICYgNDI3ODE5MDMzNTtcbiAgeiAgPSAoeiB8ICh6PDw4KSkgICYgMjUxNzE5Njk1O1xuICB6ICA9ICh6IHwgKHo8PDQpKSAgJiAzMjcyMzU2MDM1O1xuICB6ICA9ICh6IHwgKHo8PDIpKSAgJiAxMjI3MTMzNTEzO1xuICBcbiAgcmV0dXJuIHggfCAoeiA8PCAyKTtcbn1cblxuLy9FeHRyYWN0cyBudGggaW50ZXJsZWF2ZWQgY29tcG9uZW50IG9mIGEgMy10dXBsZVxuZXhwb3J0cy5kZWludGVybGVhdmUzID0gZnVuY3Rpb24odiwgbikge1xuICB2ID0gKHYgPj4+IG4pICAgICAgICYgMTIyNzEzMzUxMztcbiAgdiA9ICh2IHwgKHY+Pj4yKSkgICAmIDMyNzIzNTYwMzU7XG4gIHYgPSAodiB8ICh2Pj4+NCkpICAgJiAyNTE3MTk2OTU7XG4gIHYgPSAodiB8ICh2Pj4+OCkpICAgJiA0Mjc4MTkwMzM1O1xuICB2ID0gKHYgfCAodj4+PjE2KSkgICYgMHgzRkY7XG4gIHJldHVybiAodjw8MjIpPj4yMjtcbn1cblxuLy9Db21wdXRlcyBuZXh0IGNvbWJpbmF0aW9uIGluIGNvbGV4aWNvZ3JhcGhpYyBvcmRlciAodGhpcyBpcyBtaXN0YWtlbmx5IGNhbGxlZCBuZXh0UGVybXV0YXRpb24gb24gdGhlIGJpdCB0d2lkZGxpbmcgaGFja3MgcGFnZSlcbmV4cG9ydHMubmV4dENvbWJpbmF0aW9uID0gZnVuY3Rpb24odikge1xuICB2YXIgdCA9IHYgfCAodiAtIDEpO1xuICByZXR1cm4gKHQgKyAxKSB8ICgoKH50ICYgLX50KSAtIDEpID4+PiAoY291bnRUcmFpbGluZ1plcm9zKHYpICsgMSkpO1xufVxuXG4iLCJcInVzZSBzdHJpY3RcIlxuXG5mdW5jdGlvbiBkdXBlX2FycmF5KGNvdW50LCB2YWx1ZSwgaSkge1xuICB2YXIgYyA9IGNvdW50W2ldfDBcbiAgaWYoYyA8PSAwKSB7XG4gICAgcmV0dXJuIFtdXG4gIH1cbiAgdmFyIHJlc3VsdCA9IG5ldyBBcnJheShjKSwgalxuICBpZihpID09PSBjb3VudC5sZW5ndGgtMSkge1xuICAgIGZvcihqPTA7IGo8YzsgKytqKSB7XG4gICAgICByZXN1bHRbal0gPSB2YWx1ZVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBmb3Ioaj0wOyBqPGM7ICsraikge1xuICAgICAgcmVzdWx0W2pdID0gZHVwZV9hcnJheShjb3VudCwgdmFsdWUsIGkrMSlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5mdW5jdGlvbiBkdXBlX251bWJlcihjb3VudCwgdmFsdWUpIHtcbiAgdmFyIHJlc3VsdCwgaVxuICByZXN1bHQgPSBuZXcgQXJyYXkoY291bnQpXG4gIGZvcihpPTA7IGk8Y291bnQ7ICsraSkge1xuICAgIHJlc3VsdFtpXSA9IHZhbHVlXG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5mdW5jdGlvbiBkdXBlKGNvdW50LCB2YWx1ZSkge1xuICBpZih0eXBlb2YgdmFsdWUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICB2YWx1ZSA9IDBcbiAgfVxuICBzd2l0Y2godHlwZW9mIGNvdW50KSB7XG4gICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgaWYoY291bnQgPiAwKSB7XG4gICAgICAgIHJldHVybiBkdXBlX251bWJlcihjb3VudHwwLCB2YWx1ZSlcbiAgICAgIH1cbiAgICBicmVha1xuICAgIGNhc2UgXCJvYmplY3RcIjpcbiAgICAgIGlmKHR5cGVvZiAoY291bnQubGVuZ3RoKSA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICByZXR1cm4gZHVwZV9hcnJheShjb3VudCwgdmFsdWUsIDApXG4gICAgICB9XG4gICAgYnJlYWtcbiAgfVxuICByZXR1cm4gW11cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkdXBlIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBiaXRzID0gcmVxdWlyZSgnYml0LXR3aWRkbGUnKVxudmFyIGR1cCA9IHJlcXVpcmUoJ2R1cCcpXG5cbi8vTGVnYWN5IHBvb2wgc3VwcG9ydFxuaWYoIWdsb2JhbC5fX1RZUEVEQVJSQVlfUE9PTCkge1xuICBnbG9iYWwuX19UWVBFREFSUkFZX1BPT0wgPSB7XG4gICAgICBVSU5UOCAgIDogZHVwKFszMiwgMF0pXG4gICAgLCBVSU5UMTYgIDogZHVwKFszMiwgMF0pXG4gICAgLCBVSU5UMzIgIDogZHVwKFszMiwgMF0pXG4gICAgLCBJTlQ4ICAgIDogZHVwKFszMiwgMF0pXG4gICAgLCBJTlQxNiAgIDogZHVwKFszMiwgMF0pXG4gICAgLCBJTlQzMiAgIDogZHVwKFszMiwgMF0pXG4gICAgLCBGTE9BVCAgIDogZHVwKFszMiwgMF0pXG4gICAgLCBET1VCTEUgIDogZHVwKFszMiwgMF0pXG4gICAgLCBEQVRBICAgIDogZHVwKFszMiwgMF0pXG4gICAgLCBVSU5UOEMgIDogZHVwKFszMiwgMF0pXG4gICAgLCBCVUZGRVIgIDogZHVwKFszMiwgMF0pXG4gIH1cbn1cblxudmFyIGhhc1VpbnQ4QyA9ICh0eXBlb2YgVWludDhDbGFtcGVkQXJyYXkpICE9PSAndW5kZWZpbmVkJ1xudmFyIFBPT0wgPSBnbG9iYWwuX19UWVBFREFSUkFZX1BPT0xcblxuLy9VcGdyYWRlIHBvb2xcbmlmKCFQT09MLlVJTlQ4Qykge1xuICBQT09MLlVJTlQ4QyA9IGR1cChbMzIsIDBdKVxufVxuaWYoIVBPT0wuQlVGRkVSKSB7XG4gIFBPT0wuQlVGRkVSID0gZHVwKFszMiwgMF0pXG59XG5cbi8vTmV3IHRlY2huaXF1ZTogT25seSBhbGxvY2F0ZSBmcm9tIEFycmF5QnVmZmVyVmlldyBhbmQgQnVmZmVyXG52YXIgREFUQSAgICA9IFBPT0wuREFUQVxuICAsIEJVRkZFUiAgPSBQT09MLkJVRkZFUlxuXG5leHBvcnRzLmZyZWUgPSBmdW5jdGlvbiBmcmVlKGFycmF5KSB7XG4gIGlmKEJ1ZmZlci5pc0J1ZmZlcihhcnJheSkpIHtcbiAgICBCVUZGRVJbYml0cy5sb2cyKGFycmF5Lmxlbmd0aCldLnB1c2goYXJyYXkpXG4gIH0gZWxzZSB7XG4gICAgaWYoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFycmF5KSAhPT0gJ1tvYmplY3QgQXJyYXlCdWZmZXJdJykge1xuICAgICAgYXJyYXkgPSBhcnJheS5idWZmZXJcbiAgICB9XG4gICAgaWYoIWFycmF5KSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdmFyIG4gPSBhcnJheS5sZW5ndGggfHwgYXJyYXkuYnl0ZUxlbmd0aFxuICAgIHZhciBsb2dfbiA9IGJpdHMubG9nMihuKXwwXG4gICAgREFUQVtsb2dfbl0ucHVzaChhcnJheSlcbiAgfVxufVxuXG5mdW5jdGlvbiBmcmVlQXJyYXlCdWZmZXIoYnVmZmVyKSB7XG4gIGlmKCFidWZmZXIpIHtcbiAgICByZXR1cm5cbiAgfVxuICB2YXIgbiA9IGJ1ZmZlci5sZW5ndGggfHwgYnVmZmVyLmJ5dGVMZW5ndGhcbiAgdmFyIGxvZ19uID0gYml0cy5sb2cyKG4pXG4gIERBVEFbbG9nX25dLnB1c2goYnVmZmVyKVxufVxuXG5mdW5jdGlvbiBmcmVlVHlwZWRBcnJheShhcnJheSkge1xuICBmcmVlQXJyYXlCdWZmZXIoYXJyYXkuYnVmZmVyKVxufVxuXG5leHBvcnRzLmZyZWVVaW50OCA9XG5leHBvcnRzLmZyZWVVaW50MTYgPVxuZXhwb3J0cy5mcmVlVWludDMyID1cbmV4cG9ydHMuZnJlZUludDggPVxuZXhwb3J0cy5mcmVlSW50MTYgPVxuZXhwb3J0cy5mcmVlSW50MzIgPVxuZXhwb3J0cy5mcmVlRmxvYXQzMiA9IFxuZXhwb3J0cy5mcmVlRmxvYXQgPVxuZXhwb3J0cy5mcmVlRmxvYXQ2NCA9IFxuZXhwb3J0cy5mcmVlRG91YmxlID0gXG5leHBvcnRzLmZyZWVVaW50OENsYW1wZWQgPSBcbmV4cG9ydHMuZnJlZURhdGFWaWV3ID0gZnJlZVR5cGVkQXJyYXlcblxuZXhwb3J0cy5mcmVlQXJyYXlCdWZmZXIgPSBmcmVlQXJyYXlCdWZmZXJcblxuZXhwb3J0cy5mcmVlQnVmZmVyID0gZnVuY3Rpb24gZnJlZUJ1ZmZlcihhcnJheSkge1xuICBCVUZGRVJbYml0cy5sb2cyKGFycmF5Lmxlbmd0aCldLnB1c2goYXJyYXkpXG59XG5cbmV4cG9ydHMubWFsbG9jID0gZnVuY3Rpb24gbWFsbG9jKG4sIGR0eXBlKSB7XG4gIGlmKGR0eXBlID09PSB1bmRlZmluZWQgfHwgZHR5cGUgPT09ICdhcnJheWJ1ZmZlcicpIHtcbiAgICByZXR1cm4gbWFsbG9jQXJyYXlCdWZmZXIobilcbiAgfSBlbHNlIHtcbiAgICBzd2l0Y2goZHR5cGUpIHtcbiAgICAgIGNhc2UgJ3VpbnQ4JzpcbiAgICAgICAgcmV0dXJuIG1hbGxvY1VpbnQ4KG4pXG4gICAgICBjYXNlICd1aW50MTYnOlxuICAgICAgICByZXR1cm4gbWFsbG9jVWludDE2KG4pXG4gICAgICBjYXNlICd1aW50MzInOlxuICAgICAgICByZXR1cm4gbWFsbG9jVWludDMyKG4pXG4gICAgICBjYXNlICdpbnQ4JzpcbiAgICAgICAgcmV0dXJuIG1hbGxvY0ludDgobilcbiAgICAgIGNhc2UgJ2ludDE2JzpcbiAgICAgICAgcmV0dXJuIG1hbGxvY0ludDE2KG4pXG4gICAgICBjYXNlICdpbnQzMic6XG4gICAgICAgIHJldHVybiBtYWxsb2NJbnQzMihuKVxuICAgICAgY2FzZSAnZmxvYXQnOlxuICAgICAgY2FzZSAnZmxvYXQzMic6XG4gICAgICAgIHJldHVybiBtYWxsb2NGbG9hdChuKVxuICAgICAgY2FzZSAnZG91YmxlJzpcbiAgICAgIGNhc2UgJ2Zsb2F0NjQnOlxuICAgICAgICByZXR1cm4gbWFsbG9jRG91YmxlKG4pXG4gICAgICBjYXNlICd1aW50OF9jbGFtcGVkJzpcbiAgICAgICAgcmV0dXJuIG1hbGxvY1VpbnQ4Q2xhbXBlZChuKVxuICAgICAgY2FzZSAnYnVmZmVyJzpcbiAgICAgICAgcmV0dXJuIG1hbGxvY0J1ZmZlcihuKVxuICAgICAgY2FzZSAnZGF0YSc6XG4gICAgICBjYXNlICdkYXRhdmlldyc6XG4gICAgICAgIHJldHVybiBtYWxsb2NEYXRhVmlldyhuKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbFxufVxuXG5mdW5jdGlvbiBtYWxsb2NBcnJheUJ1ZmZlcihuKSB7XG4gIHZhciBuID0gYml0cy5uZXh0UG93MihuKVxuICB2YXIgbG9nX24gPSBiaXRzLmxvZzIobilcbiAgdmFyIGQgPSBEQVRBW2xvZ19uXVxuICBpZihkLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gZC5wb3AoKVxuICB9XG4gIHJldHVybiBuZXcgQXJyYXlCdWZmZXIobilcbn1cbmV4cG9ydHMubWFsbG9jQXJyYXlCdWZmZXIgPSBtYWxsb2NBcnJheUJ1ZmZlclxuXG5mdW5jdGlvbiBtYWxsb2NVaW50OChuKSB7XG4gIHJldHVybiBuZXcgVWludDhBcnJheShtYWxsb2NBcnJheUJ1ZmZlcihuKSwgMCwgbilcbn1cbmV4cG9ydHMubWFsbG9jVWludDggPSBtYWxsb2NVaW50OFxuXG5mdW5jdGlvbiBtYWxsb2NVaW50MTYobikge1xuICByZXR1cm4gbmV3IFVpbnQxNkFycmF5KG1hbGxvY0FycmF5QnVmZmVyKDIqbiksIDAsIG4pXG59XG5leHBvcnRzLm1hbGxvY1VpbnQxNiA9IG1hbGxvY1VpbnQxNlxuXG5mdW5jdGlvbiBtYWxsb2NVaW50MzIobikge1xuICByZXR1cm4gbmV3IFVpbnQzMkFycmF5KG1hbGxvY0FycmF5QnVmZmVyKDQqbiksIDAsIG4pXG59XG5leHBvcnRzLm1hbGxvY1VpbnQzMiA9IG1hbGxvY1VpbnQzMlxuXG5mdW5jdGlvbiBtYWxsb2NJbnQ4KG4pIHtcbiAgcmV0dXJuIG5ldyBJbnQ4QXJyYXkobWFsbG9jQXJyYXlCdWZmZXIobiksIDAsIG4pXG59XG5leHBvcnRzLm1hbGxvY0ludDggPSBtYWxsb2NJbnQ4XG5cbmZ1bmN0aW9uIG1hbGxvY0ludDE2KG4pIHtcbiAgcmV0dXJuIG5ldyBJbnQxNkFycmF5KG1hbGxvY0FycmF5QnVmZmVyKDIqbiksIDAsIG4pXG59XG5leHBvcnRzLm1hbGxvY0ludDE2ID0gbWFsbG9jSW50MTZcblxuZnVuY3Rpb24gbWFsbG9jSW50MzIobikge1xuICByZXR1cm4gbmV3IEludDMyQXJyYXkobWFsbG9jQXJyYXlCdWZmZXIoNCpuKSwgMCwgbilcbn1cbmV4cG9ydHMubWFsbG9jSW50MzIgPSBtYWxsb2NJbnQzMlxuXG5mdW5jdGlvbiBtYWxsb2NGbG9hdChuKSB7XG4gIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KG1hbGxvY0FycmF5QnVmZmVyKDQqbiksIDAsIG4pXG59XG5leHBvcnRzLm1hbGxvY0Zsb2F0MzIgPSBleHBvcnRzLm1hbGxvY0Zsb2F0ID0gbWFsbG9jRmxvYXRcblxuZnVuY3Rpb24gbWFsbG9jRG91YmxlKG4pIHtcbiAgcmV0dXJuIG5ldyBGbG9hdDY0QXJyYXkobWFsbG9jQXJyYXlCdWZmZXIoOCpuKSwgMCwgbilcbn1cbmV4cG9ydHMubWFsbG9jRmxvYXQ2NCA9IGV4cG9ydHMubWFsbG9jRG91YmxlID0gbWFsbG9jRG91YmxlXG5cbmZ1bmN0aW9uIG1hbGxvY1VpbnQ4Q2xhbXBlZChuKSB7XG4gIGlmKGhhc1VpbnQ4Qykge1xuICAgIHJldHVybiBuZXcgVWludDhDbGFtcGVkQXJyYXkobWFsbG9jQXJyYXlCdWZmZXIobiksIDAsIG4pXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG1hbGxvY1VpbnQ4KG4pXG4gIH1cbn1cbmV4cG9ydHMubWFsbG9jVWludDhDbGFtcGVkID0gbWFsbG9jVWludDhDbGFtcGVkXG5cbmZ1bmN0aW9uIG1hbGxvY0RhdGFWaWV3KG4pIHtcbiAgcmV0dXJuIG5ldyBEYXRhVmlldyhtYWxsb2NBcnJheUJ1ZmZlcihuKSwgMCwgbilcbn1cbmV4cG9ydHMubWFsbG9jRGF0YVZpZXcgPSBtYWxsb2NEYXRhVmlld1xuXG5mdW5jdGlvbiBtYWxsb2NCdWZmZXIobikge1xuICBuID0gYml0cy5uZXh0UG93MihuKVxuICB2YXIgbG9nX24gPSBiaXRzLmxvZzIobilcbiAgdmFyIGNhY2hlID0gQlVGRkVSW2xvZ19uXVxuICBpZihjYWNoZS5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIGNhY2hlLnBvcCgpXG4gIH1cbiAgcmV0dXJuIG5ldyBCdWZmZXIobilcbn1cbmV4cG9ydHMubWFsbG9jQnVmZmVyID0gbWFsbG9jQnVmZmVyXG5cbmV4cG9ydHMuY2xlYXJDYWNoZSA9IGZ1bmN0aW9uIGNsZWFyQ2FjaGUoKSB7XG4gIGZvcih2YXIgaT0wOyBpPDMyOyArK2kpIHtcbiAgICBQT09MLlVJTlQ4W2ldLmxlbmd0aCA9IDBcbiAgICBQT09MLlVJTlQxNltpXS5sZW5ndGggPSAwXG4gICAgUE9PTC5VSU5UMzJbaV0ubGVuZ3RoID0gMFxuICAgIFBPT0wuSU5UOFtpXS5sZW5ndGggPSAwXG4gICAgUE9PTC5JTlQxNltpXS5sZW5ndGggPSAwXG4gICAgUE9PTC5JTlQzMltpXS5sZW5ndGggPSAwXG4gICAgUE9PTC5GTE9BVFtpXS5sZW5ndGggPSAwXG4gICAgUE9PTC5ET1VCTEVbaV0ubGVuZ3RoID0gMFxuICAgIFBPT0wuVUlOVDhDW2ldLmxlbmd0aCA9IDBcbiAgICBEQVRBW2ldLmxlbmd0aCA9IDBcbiAgICBCVUZGRVJbaV0ubGVuZ3RoID0gMFxuICB9XG59IiwiXCJ1c2Ugc3RyaWN0XCJcblxuZnVuY3Rpb24gdW5pcXVlX3ByZWQobGlzdCwgY29tcGFyZSkge1xuICB2YXIgcHRyID0gMVxuICAgICwgbGVuID0gbGlzdC5sZW5ndGhcbiAgICAsIGE9bGlzdFswXSwgYj1saXN0WzBdXG4gIGZvcih2YXIgaT0xOyBpPGxlbjsgKytpKSB7XG4gICAgYiA9IGFcbiAgICBhID0gbGlzdFtpXVxuICAgIGlmKGNvbXBhcmUoYSwgYikpIHtcbiAgICAgIGlmKGkgPT09IHB0cikge1xuICAgICAgICBwdHIrK1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuICAgICAgbGlzdFtwdHIrK10gPSBhXG4gICAgfVxuICB9XG4gIGxpc3QubGVuZ3RoID0gcHRyXG4gIHJldHVybiBsaXN0XG59XG5cbmZ1bmN0aW9uIHVuaXF1ZV9lcShsaXN0KSB7XG4gIHZhciBwdHIgPSAxXG4gICAgLCBsZW4gPSBsaXN0Lmxlbmd0aFxuICAgICwgYT1saXN0WzBdLCBiID0gbGlzdFswXVxuICBmb3IodmFyIGk9MTsgaTxsZW47ICsraSwgYj1hKSB7XG4gICAgYiA9IGFcbiAgICBhID0gbGlzdFtpXVxuICAgIGlmKGEgIT09IGIpIHtcbiAgICAgIGlmKGkgPT09IHB0cikge1xuICAgICAgICBwdHIrK1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuICAgICAgbGlzdFtwdHIrK10gPSBhXG4gICAgfVxuICB9XG4gIGxpc3QubGVuZ3RoID0gcHRyXG4gIHJldHVybiBsaXN0XG59XG5cbmZ1bmN0aW9uIHVuaXF1ZShsaXN0LCBjb21wYXJlLCBzb3J0ZWQpIHtcbiAgaWYobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbGlzdFxuICB9XG4gIGlmKGNvbXBhcmUpIHtcbiAgICBpZighc29ydGVkKSB7XG4gICAgICBsaXN0LnNvcnQoY29tcGFyZSlcbiAgICB9XG4gICAgcmV0dXJuIHVuaXF1ZV9wcmVkKGxpc3QsIGNvbXBhcmUpXG4gIH1cbiAgaWYoIXNvcnRlZCkge1xuICAgIGxpc3Quc29ydCgpXG4gIH1cbiAgcmV0dXJuIHVuaXF1ZV9lcShsaXN0KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHVuaXF1ZVxuIiwiLy8gU291cmNlOiBodHRwOi8vanNmaWRkbGUubmV0L3ZXeDhWL1xuLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy81NjAzMTk1L2Z1bGwtbGlzdC1vZi1qYXZhc2NyaXB0LWtleWNvZGVzXG5cblxuXG4vKipcbiAqIENvbmVuaWVuY2UgbWV0aG9kIHJldHVybnMgY29ycmVzcG9uZGluZyB2YWx1ZSBmb3IgZ2l2ZW4ga2V5TmFtZSBvciBrZXlDb2RlLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IGtleUNvZGUge051bWJlcn0gb3Iga2V5TmFtZSB7U3RyaW5nfVxuICogQHJldHVybiB7TWl4ZWR9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlYXJjaElucHV0KSB7XG4gIC8vIEtleWJvYXJkIEV2ZW50c1xuICBpZiAoc2VhcmNoSW5wdXQgJiYgJ29iamVjdCcgPT09IHR5cGVvZiBzZWFyY2hJbnB1dCkge1xuICAgIHZhciBoYXNLZXlDb2RlID0gc2VhcmNoSW5wdXQud2hpY2ggfHwgc2VhcmNoSW5wdXQua2V5Q29kZSB8fCBzZWFyY2hJbnB1dC5jaGFyQ29kZVxuICAgIGlmIChoYXNLZXlDb2RlKSBzZWFyY2hJbnB1dCA9IGhhc0tleUNvZGVcbiAgfVxuXG4gIC8vIE51bWJlcnNcbiAgaWYgKCdudW1iZXInID09PSB0eXBlb2Ygc2VhcmNoSW5wdXQpIHJldHVybiBuYW1lc1tzZWFyY2hJbnB1dF1cblxuICAvLyBFdmVyeXRoaW5nIGVsc2UgKGNhc3QgdG8gc3RyaW5nKVxuICB2YXIgc2VhcmNoID0gU3RyaW5nKHNlYXJjaElucHV0KVxuXG4gIC8vIGNoZWNrIGNvZGVzXG4gIHZhciBmb3VuZE5hbWVkS2V5ID0gY29kZXNbc2VhcmNoLnRvTG93ZXJDYXNlKCldXG4gIGlmIChmb3VuZE5hbWVkS2V5KSByZXR1cm4gZm91bmROYW1lZEtleVxuXG4gIC8vIGNoZWNrIGFsaWFzZXNcbiAgdmFyIGZvdW5kTmFtZWRLZXkgPSBhbGlhc2VzW3NlYXJjaC50b0xvd2VyQ2FzZSgpXVxuICBpZiAoZm91bmROYW1lZEtleSkgcmV0dXJuIGZvdW5kTmFtZWRLZXlcblxuICAvLyB3ZWlyZCBjaGFyYWN0ZXI/XG4gIGlmIChzZWFyY2gubGVuZ3RoID09PSAxKSByZXR1cm4gc2VhcmNoLmNoYXJDb2RlQXQoMClcblxuICByZXR1cm4gdW5kZWZpbmVkXG59XG5cbi8qKlxuICogR2V0IGJ5IG5hbWVcbiAqXG4gKiAgIGV4cG9ydHMuY29kZVsnZW50ZXInXSAvLyA9PiAxM1xuICovXG5cbnZhciBjb2RlcyA9IGV4cG9ydHMuY29kZSA9IGV4cG9ydHMuY29kZXMgPSB7XG4gICdiYWNrc3BhY2UnOiA4LFxuICAndGFiJzogOSxcbiAgJ2VudGVyJzogMTMsXG4gICdzaGlmdCc6IDE2LFxuICAnY3RybCc6IDE3LFxuICAnYWx0JzogMTgsXG4gICdwYXVzZS9icmVhayc6IDE5LFxuICAnY2FwcyBsb2NrJzogMjAsXG4gICdlc2MnOiAyNyxcbiAgJ3NwYWNlJzogMzIsXG4gICdwYWdlIHVwJzogMzMsXG4gICdwYWdlIGRvd24nOiAzNCxcbiAgJ2VuZCc6IDM1LFxuICAnaG9tZSc6IDM2LFxuICAnbGVmdCc6IDM3LFxuICAndXAnOiAzOCxcbiAgJ3JpZ2h0JzogMzksXG4gICdkb3duJzogNDAsXG4gICdpbnNlcnQnOiA0NSxcbiAgJ2RlbGV0ZSc6IDQ2LFxuICAnY29tbWFuZCc6IDkxLFxuICAncmlnaHQgY2xpY2snOiA5MyxcbiAgJ251bXBhZCAqJzogMTA2LFxuICAnbnVtcGFkICsnOiAxMDcsXG4gICdudW1wYWQgLSc6IDEwOSxcbiAgJ251bXBhZCAuJzogMTEwLFxuICAnbnVtcGFkIC8nOiAxMTEsXG4gICdudW0gbG9jayc6IDE0NCxcbiAgJ3Njcm9sbCBsb2NrJzogMTQ1LFxuICAnbXkgY29tcHV0ZXInOiAxODIsXG4gICdteSBjYWxjdWxhdG9yJzogMTgzLFxuICAnOyc6IDE4NixcbiAgJz0nOiAxODcsXG4gICcsJzogMTg4LFxuICAnLSc6IDE4OSxcbiAgJy4nOiAxOTAsXG4gICcvJzogMTkxLFxuICAnYCc6IDE5MixcbiAgJ1snOiAyMTksXG4gICdcXFxcJzogMjIwLFxuICAnXSc6IDIyMSxcbiAgXCInXCI6IDIyMixcbn1cblxuLy8gSGVscGVyIGFsaWFzZXNcblxudmFyIGFsaWFzZXMgPSBleHBvcnRzLmFsaWFzZXMgPSB7XG4gICd3aW5kb3dzJzogOTEsXG4gICfih6cnOiAxNixcbiAgJ+KMpSc6IDE4LFxuICAn4oyDJzogMTcsXG4gICfijJgnOiA5MSxcbiAgJ2N0bCc6IDE3LFxuICAnY29udHJvbCc6IDE3LFxuICAnb3B0aW9uJzogMTgsXG4gICdwYXVzZSc6IDE5LFxuICAnYnJlYWsnOiAxOSxcbiAgJ2NhcHMnOiAyMCxcbiAgJ3JldHVybic6IDEzLFxuICAnZXNjYXBlJzogMjcsXG4gICdzcGMnOiAzMixcbiAgJ3BndXAnOiAzMyxcbiAgJ3BnZG4nOiAzMyxcbiAgJ2lucyc6IDQ1LFxuICAnZGVsJzogNDYsXG4gICdjbWQnOiA5MVxufVxuXG5cbi8qIVxuICogUHJvZ3JhbWF0aWNhbGx5IGFkZCB0aGUgZm9sbG93aW5nXG4gKi9cblxuLy8gbG93ZXIgY2FzZSBjaGFyc1xuZm9yIChpID0gOTc7IGkgPCAxMjM7IGkrKykgY29kZXNbU3RyaW5nLmZyb21DaGFyQ29kZShpKV0gPSBpIC0gMzJcblxuLy8gbnVtYmVyc1xuZm9yICh2YXIgaSA9IDQ4OyBpIDwgNTg7IGkrKykgY29kZXNbaSAtIDQ4XSA9IGlcblxuLy8gZnVuY3Rpb24ga2V5c1xuZm9yIChpID0gMTsgaSA8IDEzOyBpKyspIGNvZGVzWydmJytpXSA9IGkgKyAxMTFcblxuLy8gbnVtcGFkIGtleXNcbmZvciAoaSA9IDA7IGkgPCAxMDsgaSsrKSBjb2Rlc1snbnVtcGFkICcraV0gPSBpICsgOTZcblxuLyoqXG4gKiBHZXQgYnkgY29kZVxuICpcbiAqICAgZXhwb3J0cy5uYW1lWzEzXSAvLyA9PiAnRW50ZXInXG4gKi9cblxudmFyIG5hbWVzID0gZXhwb3J0cy5uYW1lcyA9IGV4cG9ydHMudGl0bGUgPSB7fSAvLyB0aXRsZSBmb3IgYmFja3dhcmQgY29tcGF0XG5cbi8vIENyZWF0ZSByZXZlcnNlIG1hcHBpbmdcbmZvciAoaSBpbiBjb2RlcykgbmFtZXNbY29kZXNbaV1dID0gaVxuXG4vLyBBZGQgYWxpYXNlc1xuZm9yICh2YXIgYWxpYXMgaW4gYWxpYXNlcykge1xuICBjb2Rlc1thbGlhc10gPSBhbGlhc2VzW2FsaWFzXVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYXJncywgb3B0cykge1xuICAgIGlmICghb3B0cykgb3B0cyA9IHt9O1xuICAgIFxuICAgIHZhciBmbGFncyA9IHsgYm9vbHMgOiB7fSwgc3RyaW5ncyA6IHt9LCB1bmtub3duRm46IG51bGwgfTtcblxuICAgIGlmICh0eXBlb2Ygb3B0c1sndW5rbm93biddID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGZsYWdzLnVua25vd25GbiA9IG9wdHNbJ3Vua25vd24nXTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9wdHNbJ2Jvb2xlYW4nXSA9PT0gJ2Jvb2xlYW4nICYmIG9wdHNbJ2Jvb2xlYW4nXSkge1xuICAgICAgZmxhZ3MuYWxsQm9vbHMgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBbXS5jb25jYXQob3B0c1snYm9vbGVhbiddKS5maWx0ZXIoQm9vbGVhbikuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgZmxhZ3MuYm9vbHNba2V5XSA9IHRydWU7XG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgdmFyIGFsaWFzZXMgPSB7fTtcbiAgICBPYmplY3Qua2V5cyhvcHRzLmFsaWFzIHx8IHt9KS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgYWxpYXNlc1trZXldID0gW10uY29uY2F0KG9wdHMuYWxpYXNba2V5XSk7XG4gICAgICAgIGFsaWFzZXNba2V5XS5mb3JFYWNoKGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICBhbGlhc2VzW3hdID0gW2tleV0uY29uY2F0KGFsaWFzZXNba2V5XS5maWx0ZXIoZnVuY3Rpb24gKHkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geCAhPT0geTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBbXS5jb25jYXQob3B0cy5zdHJpbmcpLmZpbHRlcihCb29sZWFuKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgZmxhZ3Muc3RyaW5nc1trZXldID0gdHJ1ZTtcbiAgICAgICAgaWYgKGFsaWFzZXNba2V5XSkge1xuICAgICAgICAgICAgZmxhZ3Muc3RyaW5nc1thbGlhc2VzW2tleV1dID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICB9KTtcblxuICAgIHZhciBkZWZhdWx0cyA9IG9wdHNbJ2RlZmF1bHQnXSB8fCB7fTtcbiAgICBcbiAgICB2YXIgYXJndiA9IHsgXyA6IFtdIH07XG4gICAgT2JqZWN0LmtleXMoZmxhZ3MuYm9vbHMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBzZXRBcmcoa2V5LCBkZWZhdWx0c1trZXldID09PSB1bmRlZmluZWQgPyBmYWxzZSA6IGRlZmF1bHRzW2tleV0pO1xuICAgIH0pO1xuICAgIFxuICAgIHZhciBub3RGbGFncyA9IFtdO1xuXG4gICAgaWYgKGFyZ3MuaW5kZXhPZignLS0nKSAhPT0gLTEpIHtcbiAgICAgICAgbm90RmxhZ3MgPSBhcmdzLnNsaWNlKGFyZ3MuaW5kZXhPZignLS0nKSsxKTtcbiAgICAgICAgYXJncyA9IGFyZ3Muc2xpY2UoMCwgYXJncy5pbmRleE9mKCctLScpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhcmdEZWZpbmVkKGtleSwgYXJnKSB7XG4gICAgICAgIHJldHVybiAoZmxhZ3MuYWxsQm9vbHMgJiYgL14tLVtePV0rJC8udGVzdChhcmcpKSB8fFxuICAgICAgICAgICAgZmxhZ3Muc3RyaW5nc1trZXldIHx8IGZsYWdzLmJvb2xzW2tleV0gfHwgYWxpYXNlc1trZXldO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldEFyZyAoa2V5LCB2YWwsIGFyZykge1xuICAgICAgICBpZiAoYXJnICYmIGZsYWdzLnVua25vd25GbiAmJiAhYXJnRGVmaW5lZChrZXksIGFyZykpIHtcbiAgICAgICAgICAgIGlmIChmbGFncy51bmtub3duRm4oYXJnKSA9PT0gZmFsc2UpIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB2YWx1ZSA9ICFmbGFncy5zdHJpbmdzW2tleV0gJiYgaXNOdW1iZXIodmFsKVxuICAgICAgICAgICAgPyBOdW1iZXIodmFsKSA6IHZhbFxuICAgICAgICA7XG4gICAgICAgIHNldEtleShhcmd2LCBrZXkuc3BsaXQoJy4nKSwgdmFsdWUpO1xuICAgICAgICBcbiAgICAgICAgKGFsaWFzZXNba2V5XSB8fCBbXSkuZm9yRWFjaChmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgc2V0S2V5KGFyZ3YsIHguc3BsaXQoJy4nKSwgdmFsdWUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRLZXkgKG9iaiwga2V5cywgdmFsdWUpIHtcbiAgICAgICAgdmFyIG8gPSBvYmo7XG4gICAgICAgIGtleXMuc2xpY2UoMCwtMSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICBpZiAob1trZXldID09PSB1bmRlZmluZWQpIG9ba2V5XSA9IHt9O1xuICAgICAgICAgICAgbyA9IG9ba2V5XTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGtleSA9IGtleXNba2V5cy5sZW5ndGggLSAxXTtcbiAgICAgICAgaWYgKG9ba2V5XSA9PT0gdW5kZWZpbmVkIHx8IGZsYWdzLmJvb2xzW2tleV0gfHwgdHlwZW9mIG9ba2V5XSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICBvW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9ba2V5XSkpIHtcbiAgICAgICAgICAgIG9ba2V5XS5wdXNoKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG9ba2V5XSA9IFsgb1trZXldLCB2YWx1ZSBdO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGZ1bmN0aW9uIGFsaWFzSXNCb29sZWFuKGtleSkge1xuICAgICAgcmV0dXJuIGFsaWFzZXNba2V5XS5zb21lKGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgcmV0dXJuIGZsYWdzLmJvb2xzW3hdO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBhcmcgPSBhcmdzW2ldO1xuICAgICAgICBcbiAgICAgICAgaWYgKC9eLS0uKz0vLnRlc3QoYXJnKSkge1xuICAgICAgICAgICAgLy8gVXNpbmcgW1xcc1xcU10gaW5zdGVhZCBvZiAuIGJlY2F1c2UganMgZG9lc24ndCBzdXBwb3J0IHRoZVxuICAgICAgICAgICAgLy8gJ2RvdGFsbCcgcmVnZXggbW9kaWZpZXIuIFNlZTpcbiAgICAgICAgICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEwNjgzMDgvMTMyMTZcbiAgICAgICAgICAgIHZhciBtID0gYXJnLm1hdGNoKC9eLS0oW149XSspPShbXFxzXFxTXSopJC8pO1xuICAgICAgICAgICAgdmFyIGtleSA9IG1bMV07XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBtWzJdO1xuICAgICAgICAgICAgaWYgKGZsYWdzLmJvb2xzW2tleV0pIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICE9PSAnZmFsc2UnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2V0QXJnKGtleSwgdmFsdWUsIGFyZyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoL14tLW5vLS4rLy50ZXN0KGFyZykpIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBhcmcubWF0Y2goL14tLW5vLSguKykvKVsxXTtcbiAgICAgICAgICAgIHNldEFyZyhrZXksIGZhbHNlLCBhcmcpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKC9eLS0uKy8udGVzdChhcmcpKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gYXJnLm1hdGNoKC9eLS0oLispLylbMV07XG4gICAgICAgICAgICB2YXIgbmV4dCA9IGFyZ3NbaSArIDFdO1xuICAgICAgICAgICAgaWYgKG5leHQgIT09IHVuZGVmaW5lZCAmJiAhL14tLy50ZXN0KG5leHQpXG4gICAgICAgICAgICAmJiAhZmxhZ3MuYm9vbHNba2V5XVxuICAgICAgICAgICAgJiYgIWZsYWdzLmFsbEJvb2xzXG4gICAgICAgICAgICAmJiAoYWxpYXNlc1trZXldID8gIWFsaWFzSXNCb29sZWFuKGtleSkgOiB0cnVlKSkge1xuICAgICAgICAgICAgICAgIHNldEFyZyhrZXksIG5leHQsIGFyZyk7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoL14odHJ1ZXxmYWxzZSkkLy50ZXN0KG5leHQpKSB7XG4gICAgICAgICAgICAgICAgc2V0QXJnKGtleSwgbmV4dCA9PT0gJ3RydWUnLCBhcmcpO1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNldEFyZyhrZXksIGZsYWdzLnN0cmluZ3Nba2V5XSA/ICcnIDogdHJ1ZSwgYXJnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICgvXi1bXi1dKy8udGVzdChhcmcpKSB7XG4gICAgICAgICAgICB2YXIgbGV0dGVycyA9IGFyZy5zbGljZSgxLC0xKS5zcGxpdCgnJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBicm9rZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbGV0dGVycy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIHZhciBuZXh0ID0gYXJnLnNsaWNlKGorMik7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKG5leHQgPT09ICctJykge1xuICAgICAgICAgICAgICAgICAgICBzZXRBcmcobGV0dGVyc1tqXSwgbmV4dCwgYXJnKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKC9bQS1aYS16XS8udGVzdChsZXR0ZXJzW2pdKSAmJiAvPS8udGVzdChuZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICBzZXRBcmcobGV0dGVyc1tqXSwgbmV4dC5zcGxpdCgnPScpWzFdLCBhcmcpO1xuICAgICAgICAgICAgICAgICAgICBicm9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKC9bQS1aYS16XS8udGVzdChsZXR0ZXJzW2pdKVxuICAgICAgICAgICAgICAgICYmIC8tP1xcZCsoXFwuXFxkKik/KGUtP1xcZCspPyQvLnRlc3QobmV4dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0QXJnKGxldHRlcnNbal0sIG5leHQsIGFyZyk7XG4gICAgICAgICAgICAgICAgICAgIGJyb2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAobGV0dGVyc1tqKzFdICYmIGxldHRlcnNbaisxXS5tYXRjaCgvXFxXLykpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0QXJnKGxldHRlcnNbal0sIGFyZy5zbGljZShqKzIpLCBhcmcpO1xuICAgICAgICAgICAgICAgICAgICBicm9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNldEFyZyhsZXR0ZXJzW2pdLCBmbGFncy5zdHJpbmdzW2xldHRlcnNbal1dID8gJycgOiB0cnVlLCBhcmcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGtleSA9IGFyZy5zbGljZSgtMSlbMF07XG4gICAgICAgICAgICBpZiAoIWJyb2tlbiAmJiBrZXkgIT09ICctJykge1xuICAgICAgICAgICAgICAgIGlmIChhcmdzW2krMV0gJiYgIS9eKC18LS0pW14tXS8udGVzdChhcmdzW2krMV0pXG4gICAgICAgICAgICAgICAgJiYgIWZsYWdzLmJvb2xzW2tleV1cbiAgICAgICAgICAgICAgICAmJiAoYWxpYXNlc1trZXldID8gIWFsaWFzSXNCb29sZWFuKGtleSkgOiB0cnVlKSkge1xuICAgICAgICAgICAgICAgICAgICBzZXRBcmcoa2V5LCBhcmdzW2krMV0sIGFyZyk7XG4gICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoYXJnc1tpKzFdICYmIC90cnVlfGZhbHNlLy50ZXN0KGFyZ3NbaSsxXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0QXJnKGtleSwgYXJnc1tpKzFdID09PSAndHJ1ZScsIGFyZyk7XG4gICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNldEFyZyhrZXksIGZsYWdzLnN0cmluZ3Nba2V5XSA/ICcnIDogdHJ1ZSwgYXJnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoIWZsYWdzLnVua25vd25GbiB8fCBmbGFncy51bmtub3duRm4oYXJnKSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBhcmd2Ll8ucHVzaChcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3Muc3RyaW5nc1snXyddIHx8ICFpc051bWJlcihhcmcpID8gYXJnIDogTnVtYmVyKGFyZylcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9wdHMuc3RvcEVhcmx5KSB7XG4gICAgICAgICAgICAgICAgYXJndi5fLnB1c2guYXBwbHkoYXJndi5fLCBhcmdzLnNsaWNlKGkgKyAxKSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgT2JqZWN0LmtleXMoZGVmYXVsdHMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBpZiAoIWhhc0tleShhcmd2LCBrZXkuc3BsaXQoJy4nKSkpIHtcbiAgICAgICAgICAgIHNldEtleShhcmd2LCBrZXkuc3BsaXQoJy4nKSwgZGVmYXVsdHNba2V5XSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIChhbGlhc2VzW2tleV0gfHwgW10pLmZvckVhY2goZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICBzZXRLZXkoYXJndiwgeC5zcGxpdCgnLicpLCBkZWZhdWx0c1trZXldKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgXG4gICAgaWYgKG9wdHNbJy0tJ10pIHtcbiAgICAgICAgYXJndlsnLS0nXSA9IG5ldyBBcnJheSgpO1xuICAgICAgICBub3RGbGFncy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgYXJndlsnLS0nXS5wdXNoKGtleSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgbm90RmxhZ3MuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgIGFyZ3YuXy5wdXNoKGtleSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBhcmd2O1xufTtcblxuZnVuY3Rpb24gaGFzS2V5IChvYmosIGtleXMpIHtcbiAgICB2YXIgbyA9IG9iajtcbiAgICBrZXlzLnNsaWNlKDAsLTEpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBvID0gKG9ba2V5XSB8fCB7fSk7XG4gICAgfSk7XG5cbiAgICB2YXIga2V5ID0ga2V5c1trZXlzLmxlbmd0aCAtIDFdO1xuICAgIHJldHVybiBrZXkgaW4gbztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIgKHgpIHtcbiAgICBpZiAodHlwZW9mIHggPT09ICdudW1iZXInKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoL14weFswLTlhLWZdKyQvaS50ZXN0KHgpKSByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gL15bLStdPyg/OlxcZCsoPzpcXC5cXGQqKT98XFwuXFxkKykoZVstK10/XFxkKyk/JC8udGVzdCh4KTtcbn1cblxuIiwidmFyIGlvdGEgPSByZXF1aXJlKFwiaW90YS1hcnJheVwiKVxudmFyIGlzQnVmZmVyID0gcmVxdWlyZShcImlzLWJ1ZmZlclwiKVxuXG52YXIgaGFzVHlwZWRBcnJheXMgID0gKCh0eXBlb2YgRmxvYXQ2NEFycmF5KSAhPT0gXCJ1bmRlZmluZWRcIilcblxuZnVuY3Rpb24gY29tcGFyZTFzdChhLCBiKSB7XG4gIHJldHVybiBhWzBdIC0gYlswXVxufVxuXG5mdW5jdGlvbiBvcmRlcigpIHtcbiAgdmFyIHN0cmlkZSA9IHRoaXMuc3RyaWRlXG4gIHZhciB0ZXJtcyA9IG5ldyBBcnJheShzdHJpZGUubGVuZ3RoKVxuICB2YXIgaVxuICBmb3IoaT0wOyBpPHRlcm1zLmxlbmd0aDsgKytpKSB7XG4gICAgdGVybXNbaV0gPSBbTWF0aC5hYnMoc3RyaWRlW2ldKSwgaV1cbiAgfVxuICB0ZXJtcy5zb3J0KGNvbXBhcmUxc3QpXG4gIHZhciByZXN1bHQgPSBuZXcgQXJyYXkodGVybXMubGVuZ3RoKVxuICBmb3IoaT0wOyBpPHJlc3VsdC5sZW5ndGg7ICsraSkge1xuICAgIHJlc3VsdFtpXSA9IHRlcm1zW2ldWzFdXG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5mdW5jdGlvbiBjb21waWxlQ29uc3RydWN0b3IoZHR5cGUsIGRpbWVuc2lvbikge1xuICB2YXIgY2xhc3NOYW1lID0gW1wiVmlld1wiLCBkaW1lbnNpb24sIFwiZFwiLCBkdHlwZV0uam9pbihcIlwiKVxuICBpZihkaW1lbnNpb24gPCAwKSB7XG4gICAgY2xhc3NOYW1lID0gXCJWaWV3X05pbFwiICsgZHR5cGVcbiAgfVxuICB2YXIgdXNlR2V0dGVycyA9IChkdHlwZSA9PT0gXCJnZW5lcmljXCIpXG5cbiAgaWYoZGltZW5zaW9uID09PSAtMSkge1xuICAgIC8vU3BlY2lhbCBjYXNlIGZvciB0cml2aWFsIGFycmF5c1xuICAgIHZhciBjb2RlID1cbiAgICAgIFwiZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiKGEpe3RoaXMuZGF0YT1hO307XFxcbnZhciBwcm90bz1cIitjbGFzc05hbWUrXCIucHJvdG90eXBlO1xcXG5wcm90by5kdHlwZT0nXCIrZHR5cGUrXCInO1xcXG5wcm90by5pbmRleD1mdW5jdGlvbigpe3JldHVybiAtMX07XFxcbnByb3RvLnNpemU9MDtcXFxucHJvdG8uZGltZW5zaW9uPS0xO1xcXG5wcm90by5zaGFwZT1wcm90by5zdHJpZGU9cHJvdG8ub3JkZXI9W107XFxcbnByb3RvLmxvPXByb3RvLmhpPXByb3RvLnRyYW5zcG9zZT1wcm90by5zdGVwPVxcXG5mdW5jdGlvbigpe3JldHVybiBuZXcgXCIrY2xhc3NOYW1lK1wiKHRoaXMuZGF0YSk7fTtcXFxucHJvdG8uZ2V0PXByb3RvLnNldD1mdW5jdGlvbigpe307XFxcbnByb3RvLnBpY2s9ZnVuY3Rpb24oKXtyZXR1cm4gbnVsbH07XFxcbnJldHVybiBmdW5jdGlvbiBjb25zdHJ1Y3RfXCIrY2xhc3NOYW1lK1wiKGEpe3JldHVybiBuZXcgXCIrY2xhc3NOYW1lK1wiKGEpO31cIlxuICAgIHZhciBwcm9jZWR1cmUgPSBuZXcgRnVuY3Rpb24oY29kZSlcbiAgICByZXR1cm4gcHJvY2VkdXJlKClcbiAgfSBlbHNlIGlmKGRpbWVuc2lvbiA9PT0gMCkge1xuICAgIC8vU3BlY2lhbCBjYXNlIGZvciAwZCBhcnJheXNcbiAgICB2YXIgY29kZSA9XG4gICAgICBcImZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIihhLGQpIHtcXFxudGhpcy5kYXRhID0gYTtcXFxudGhpcy5vZmZzZXQgPSBkXFxcbn07XFxcbnZhciBwcm90bz1cIitjbGFzc05hbWUrXCIucHJvdG90eXBlO1xcXG5wcm90by5kdHlwZT0nXCIrZHR5cGUrXCInO1xcXG5wcm90by5pbmRleD1mdW5jdGlvbigpe3JldHVybiB0aGlzLm9mZnNldH07XFxcbnByb3RvLmRpbWVuc2lvbj0wO1xcXG5wcm90by5zaXplPTE7XFxcbnByb3RvLnNoYXBlPVxcXG5wcm90by5zdHJpZGU9XFxcbnByb3RvLm9yZGVyPVtdO1xcXG5wcm90by5sbz1cXFxucHJvdG8uaGk9XFxcbnByb3RvLnRyYW5zcG9zZT1cXFxucHJvdG8uc3RlcD1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfY29weSgpIHtcXFxucmV0dXJuIG5ldyBcIitjbGFzc05hbWUrXCIodGhpcy5kYXRhLHRoaXMub2Zmc2V0KVxcXG59O1xcXG5wcm90by5waWNrPWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9waWNrKCl7XFxcbnJldHVybiBUcml2aWFsQXJyYXkodGhpcy5kYXRhKTtcXFxufTtcXFxucHJvdG8udmFsdWVPZj1wcm90by5nZXQ9ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX2dldCgpe1xcXG5yZXR1cm4gXCIrKHVzZUdldHRlcnMgPyBcInRoaXMuZGF0YS5nZXQodGhpcy5vZmZzZXQpXCIgOiBcInRoaXMuZGF0YVt0aGlzLm9mZnNldF1cIikrXG5cIn07XFxcbnByb3RvLnNldD1mdW5jdGlvbiBcIitjbGFzc05hbWUrXCJfc2V0KHYpe1xcXG5yZXR1cm4gXCIrKHVzZUdldHRlcnMgPyBcInRoaXMuZGF0YS5zZXQodGhpcy5vZmZzZXQsdilcIiA6IFwidGhpcy5kYXRhW3RoaXMub2Zmc2V0XT12XCIpK1wiXFxcbn07XFxcbnJldHVybiBmdW5jdGlvbiBjb25zdHJ1Y3RfXCIrY2xhc3NOYW1lK1wiKGEsYixjLGQpe3JldHVybiBuZXcgXCIrY2xhc3NOYW1lK1wiKGEsZCl9XCJcbiAgICB2YXIgcHJvY2VkdXJlID0gbmV3IEZ1bmN0aW9uKFwiVHJpdmlhbEFycmF5XCIsIGNvZGUpXG4gICAgcmV0dXJuIHByb2NlZHVyZShDQUNIRURfQ09OU1RSVUNUT1JTW2R0eXBlXVswXSlcbiAgfVxuXG4gIHZhciBjb2RlID0gW1wiJ3VzZSBzdHJpY3QnXCJdXG5cbiAgLy9DcmVhdGUgY29uc3RydWN0b3IgZm9yIHZpZXdcbiAgdmFyIGluZGljZXMgPSBpb3RhKGRpbWVuc2lvbilcbiAgdmFyIGFyZ3MgPSBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7IHJldHVybiBcImlcIitpIH0pXG4gIHZhciBpbmRleF9zdHIgPSBcInRoaXMub2Zmc2V0K1wiICsgaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgICByZXR1cm4gXCJ0aGlzLnN0cmlkZVtcIiArIGkgKyBcIl0qaVwiICsgaVxuICAgICAgfSkuam9pbihcIitcIilcbiAgdmFyIHNoYXBlQXJnID0gaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFwiYlwiK2lcbiAgICB9KS5qb2luKFwiLFwiKVxuICB2YXIgc3RyaWRlQXJnID0gaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFwiY1wiK2lcbiAgICB9KS5qb2luKFwiLFwiKVxuICBjb2RlLnB1c2goXG4gICAgXCJmdW5jdGlvbiBcIitjbGFzc05hbWUrXCIoYSxcIiArIHNoYXBlQXJnICsgXCIsXCIgKyBzdHJpZGVBcmcgKyBcIixkKXt0aGlzLmRhdGE9YVwiLFxuICAgICAgXCJ0aGlzLnNoYXBlPVtcIiArIHNoYXBlQXJnICsgXCJdXCIsXG4gICAgICBcInRoaXMuc3RyaWRlPVtcIiArIHN0cmlkZUFyZyArIFwiXVwiLFxuICAgICAgXCJ0aGlzLm9mZnNldD1kfDB9XCIsXG4gICAgXCJ2YXIgcHJvdG89XCIrY2xhc3NOYW1lK1wiLnByb3RvdHlwZVwiLFxuICAgIFwicHJvdG8uZHR5cGU9J1wiK2R0eXBlK1wiJ1wiLFxuICAgIFwicHJvdG8uZGltZW5zaW9uPVwiK2RpbWVuc2lvbilcblxuICAvL3ZpZXcuc2l6ZTpcbiAgY29kZS5wdXNoKFwiT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCdzaXplJyx7Z2V0OmZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9zaXplKCl7XFxcbnJldHVybiBcIitpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7IHJldHVybiBcInRoaXMuc2hhcGVbXCIraStcIl1cIiB9KS5qb2luKFwiKlwiKSxcblwifX0pXCIpXG5cbiAgLy92aWV3Lm9yZGVyOlxuICBpZihkaW1lbnNpb24gPT09IDEpIHtcbiAgICBjb2RlLnB1c2goXCJwcm90by5vcmRlcj1bMF1cIilcbiAgfSBlbHNlIHtcbiAgICBjb2RlLnB1c2goXCJPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sJ29yZGVyJyx7Z2V0OlwiKVxuICAgIGlmKGRpbWVuc2lvbiA8IDQpIHtcbiAgICAgIGNvZGUucHVzaChcImZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9vcmRlcigpe1wiKVxuICAgICAgaWYoZGltZW5zaW9uID09PSAyKSB7XG4gICAgICAgIGNvZGUucHVzaChcInJldHVybiAoTWF0aC5hYnModGhpcy5zdHJpZGVbMF0pPk1hdGguYWJzKHRoaXMuc3RyaWRlWzFdKSk/WzEsMF06WzAsMV19fSlcIilcbiAgICAgIH0gZWxzZSBpZihkaW1lbnNpb24gPT09IDMpIHtcbiAgICAgICAgY29kZS5wdXNoKFxuXCJ2YXIgczA9TWF0aC5hYnModGhpcy5zdHJpZGVbMF0pLHMxPU1hdGguYWJzKHRoaXMuc3RyaWRlWzFdKSxzMj1NYXRoLmFicyh0aGlzLnN0cmlkZVsyXSk7XFxcbmlmKHMwPnMxKXtcXFxuaWYoczE+czIpe1xcXG5yZXR1cm4gWzIsMSwwXTtcXFxufWVsc2UgaWYoczA+czIpe1xcXG5yZXR1cm4gWzEsMiwwXTtcXFxufWVsc2V7XFxcbnJldHVybiBbMSwwLDJdO1xcXG59XFxcbn1lbHNlIGlmKHMwPnMyKXtcXFxucmV0dXJuIFsyLDAsMV07XFxcbn1lbHNlIGlmKHMyPnMxKXtcXFxucmV0dXJuIFswLDEsMl07XFxcbn1lbHNle1xcXG5yZXR1cm4gWzAsMiwxXTtcXFxufX19KVwiKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb2RlLnB1c2goXCJPUkRFUn0pXCIpXG4gICAgfVxuICB9XG5cbiAgLy92aWV3LnNldChpMCwgLi4uLCB2KTpcbiAgY29kZS5wdXNoKFxuXCJwcm90by5zZXQ9ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX3NldChcIithcmdzLmpvaW4oXCIsXCIpK1wiLHYpe1wiKVxuICBpZih1c2VHZXR0ZXJzKSB7XG4gICAgY29kZS5wdXNoKFwicmV0dXJuIHRoaXMuZGF0YS5zZXQoXCIraW5kZXhfc3RyK1wiLHYpfVwiKVxuICB9IGVsc2Uge1xuICAgIGNvZGUucHVzaChcInJldHVybiB0aGlzLmRhdGFbXCIraW5kZXhfc3RyK1wiXT12fVwiKVxuICB9XG5cbiAgLy92aWV3LmdldChpMCwgLi4uKTpcbiAgY29kZS5wdXNoKFwicHJvdG8uZ2V0PWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9nZXQoXCIrYXJncy5qb2luKFwiLFwiKStcIil7XCIpXG4gIGlmKHVzZUdldHRlcnMpIHtcbiAgICBjb2RlLnB1c2goXCJyZXR1cm4gdGhpcy5kYXRhLmdldChcIitpbmRleF9zdHIrXCIpfVwiKVxuICB9IGVsc2Uge1xuICAgIGNvZGUucHVzaChcInJldHVybiB0aGlzLmRhdGFbXCIraW5kZXhfc3RyK1wiXX1cIilcbiAgfVxuXG4gIC8vdmlldy5pbmRleDpcbiAgY29kZS5wdXNoKFxuICAgIFwicHJvdG8uaW5kZXg9ZnVuY3Rpb24gXCIrY2xhc3NOYW1lK1wiX2luZGV4KFwiLCBhcmdzLmpvaW4oKSwgXCIpe3JldHVybiBcIitpbmRleF9zdHIrXCJ9XCIpXG5cbiAgLy92aWV3LmhpKCk6XG4gIGNvZGUucHVzaChcInByb3RvLmhpPWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9oaShcIithcmdzLmpvaW4oXCIsXCIpK1wiKXtyZXR1cm4gbmV3IFwiK2NsYXNzTmFtZStcIih0aGlzLmRhdGEsXCIrXG4gICAgaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFtcIih0eXBlb2YgaVwiLGksXCIhPT0nbnVtYmVyJ3x8aVwiLGksXCI8MCk/dGhpcy5zaGFwZVtcIiwgaSwgXCJdOmlcIiwgaSxcInwwXCJdLmpvaW4oXCJcIilcbiAgICB9KS5qb2luKFwiLFwiKStcIixcIitcbiAgICBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gXCJ0aGlzLnN0cmlkZVtcIitpICsgXCJdXCJcbiAgICB9KS5qb2luKFwiLFwiKStcIix0aGlzLm9mZnNldCl9XCIpXG5cbiAgLy92aWV3LmxvKCk6XG4gIHZhciBhX3ZhcnMgPSBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7IHJldHVybiBcImFcIitpK1wiPXRoaXMuc2hhcGVbXCIraStcIl1cIiB9KVxuICB2YXIgY192YXJzID0gaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkgeyByZXR1cm4gXCJjXCIraStcIj10aGlzLnN0cmlkZVtcIitpK1wiXVwiIH0pXG4gIGNvZGUucHVzaChcInByb3RvLmxvPWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9sbyhcIithcmdzLmpvaW4oXCIsXCIpK1wiKXt2YXIgYj10aGlzLm9mZnNldCxkPTAsXCIrYV92YXJzLmpvaW4oXCIsXCIpK1wiLFwiK2NfdmFycy5qb2luKFwiLFwiKSlcbiAgZm9yKHZhciBpPTA7IGk8ZGltZW5zaW9uOyArK2kpIHtcbiAgICBjb2RlLnB1c2goXG5cImlmKHR5cGVvZiBpXCIraStcIj09PSdudW1iZXInJiZpXCIraStcIj49MCl7XFxcbmQ9aVwiK2krXCJ8MDtcXFxuYis9Y1wiK2krXCIqZDtcXFxuYVwiK2krXCItPWR9XCIpXG4gIH1cbiAgY29kZS5wdXNoKFwicmV0dXJuIG5ldyBcIitjbGFzc05hbWUrXCIodGhpcy5kYXRhLFwiK1xuICAgIGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBcImFcIitpXG4gICAgfSkuam9pbihcIixcIikrXCIsXCIrXG4gICAgaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFwiY1wiK2lcbiAgICB9KS5qb2luKFwiLFwiKStcIixiKX1cIilcblxuICAvL3ZpZXcuc3RlcCgpOlxuICBjb2RlLnB1c2goXCJwcm90by5zdGVwPWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9zdGVwKFwiK2FyZ3Muam9pbihcIixcIikrXCIpe3ZhciBcIitcbiAgICBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gXCJhXCIraStcIj10aGlzLnNoYXBlW1wiK2krXCJdXCJcbiAgICB9KS5qb2luKFwiLFwiKStcIixcIitcbiAgICBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gXCJiXCIraStcIj10aGlzLnN0cmlkZVtcIitpK1wiXVwiXG4gICAgfSkuam9pbihcIixcIikrXCIsYz10aGlzLm9mZnNldCxkPTAsY2VpbD1NYXRoLmNlaWxcIilcbiAgZm9yKHZhciBpPTA7IGk8ZGltZW5zaW9uOyArK2kpIHtcbiAgICBjb2RlLnB1c2goXG5cImlmKHR5cGVvZiBpXCIraStcIj09PSdudW1iZXInKXtcXFxuZD1pXCIraStcInwwO1xcXG5pZihkPDApe1xcXG5jKz1iXCIraStcIiooYVwiK2krXCItMSk7XFxcbmFcIitpK1wiPWNlaWwoLWFcIitpK1wiL2QpXFxcbn1lbHNle1xcXG5hXCIraStcIj1jZWlsKGFcIitpK1wiL2QpXFxcbn1cXFxuYlwiK2krXCIqPWRcXFxufVwiKVxuICB9XG4gIGNvZGUucHVzaChcInJldHVybiBuZXcgXCIrY2xhc3NOYW1lK1wiKHRoaXMuZGF0YSxcIitcbiAgICBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gXCJhXCIgKyBpXG4gICAgfSkuam9pbihcIixcIikrXCIsXCIrXG4gICAgaW5kaWNlcy5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgcmV0dXJuIFwiYlwiICsgaVxuICAgIH0pLmpvaW4oXCIsXCIpK1wiLGMpfVwiKVxuXG4gIC8vdmlldy50cmFuc3Bvc2UoKTpcbiAgdmFyIHRTaGFwZSA9IG5ldyBBcnJheShkaW1lbnNpb24pXG4gIHZhciB0U3RyaWRlID0gbmV3IEFycmF5KGRpbWVuc2lvbilcbiAgZm9yKHZhciBpPTA7IGk8ZGltZW5zaW9uOyArK2kpIHtcbiAgICB0U2hhcGVbaV0gPSBcImFbaVwiK2krXCJdXCJcbiAgICB0U3RyaWRlW2ldID0gXCJiW2lcIitpK1wiXVwiXG4gIH1cbiAgY29kZS5wdXNoKFwicHJvdG8udHJhbnNwb3NlPWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl90cmFuc3Bvc2UoXCIrYXJncytcIil7XCIrXG4gICAgYXJncy5tYXAoZnVuY3Rpb24obixpZHgpIHsgcmV0dXJuIG4gKyBcIj0oXCIgKyBuICsgXCI9PT11bmRlZmluZWQ/XCIgKyBpZHggKyBcIjpcIiArIG4gKyBcInwwKVwifSkuam9pbihcIjtcIiksXG4gICAgXCJ2YXIgYT10aGlzLnNoYXBlLGI9dGhpcy5zdHJpZGU7cmV0dXJuIG5ldyBcIitjbGFzc05hbWUrXCIodGhpcy5kYXRhLFwiK3RTaGFwZS5qb2luKFwiLFwiKStcIixcIit0U3RyaWRlLmpvaW4oXCIsXCIpK1wiLHRoaXMub2Zmc2V0KX1cIilcblxuICAvL3ZpZXcucGljaygpOlxuICBjb2RlLnB1c2goXCJwcm90by5waWNrPWZ1bmN0aW9uIFwiK2NsYXNzTmFtZStcIl9waWNrKFwiK2FyZ3MrXCIpe3ZhciBhPVtdLGI9W10sYz10aGlzLm9mZnNldFwiKVxuICBmb3IodmFyIGk9MDsgaTxkaW1lbnNpb247ICsraSkge1xuICAgIGNvZGUucHVzaChcImlmKHR5cGVvZiBpXCIraStcIj09PSdudW1iZXInJiZpXCIraStcIj49MCl7Yz0oYyt0aGlzLnN0cmlkZVtcIitpK1wiXSppXCIraStcIil8MH1lbHNle2EucHVzaCh0aGlzLnNoYXBlW1wiK2krXCJdKTtiLnB1c2godGhpcy5zdHJpZGVbXCIraStcIl0pfVwiKVxuICB9XG4gIGNvZGUucHVzaChcInZhciBjdG9yPUNUT1JfTElTVFthLmxlbmd0aCsxXTtyZXR1cm4gY3Rvcih0aGlzLmRhdGEsYSxiLGMpfVwiKVxuXG4gIC8vQWRkIHJldHVybiBzdGF0ZW1lbnRcbiAgY29kZS5wdXNoKFwicmV0dXJuIGZ1bmN0aW9uIGNvbnN0cnVjdF9cIitjbGFzc05hbWUrXCIoZGF0YSxzaGFwZSxzdHJpZGUsb2Zmc2V0KXtyZXR1cm4gbmV3IFwiK2NsYXNzTmFtZStcIihkYXRhLFwiK1xuICAgIGluZGljZXMubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgIHJldHVybiBcInNoYXBlW1wiK2krXCJdXCJcbiAgICB9KS5qb2luKFwiLFwiKStcIixcIitcbiAgICBpbmRpY2VzLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICByZXR1cm4gXCJzdHJpZGVbXCIraStcIl1cIlxuICAgIH0pLmpvaW4oXCIsXCIpK1wiLG9mZnNldCl9XCIpXG5cbiAgLy9Db21waWxlIHByb2NlZHVyZVxuICB2YXIgcHJvY2VkdXJlID0gbmV3IEZ1bmN0aW9uKFwiQ1RPUl9MSVNUXCIsIFwiT1JERVJcIiwgY29kZS5qb2luKFwiXFxuXCIpKVxuICByZXR1cm4gcHJvY2VkdXJlKENBQ0hFRF9DT05TVFJVQ1RPUlNbZHR5cGVdLCBvcmRlcilcbn1cblxuZnVuY3Rpb24gYXJyYXlEVHlwZShkYXRhKSB7XG4gIGlmKGlzQnVmZmVyKGRhdGEpKSB7XG4gICAgcmV0dXJuIFwiYnVmZmVyXCJcbiAgfVxuICBpZihoYXNUeXBlZEFycmF5cykge1xuICAgIHN3aXRjaChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZGF0YSkpIHtcbiAgICAgIGNhc2UgXCJbb2JqZWN0IEZsb2F0NjRBcnJheV1cIjpcbiAgICAgICAgcmV0dXJuIFwiZmxvYXQ2NFwiXG4gICAgICBjYXNlIFwiW29iamVjdCBGbG9hdDMyQXJyYXldXCI6XG4gICAgICAgIHJldHVybiBcImZsb2F0MzJcIlxuICAgICAgY2FzZSBcIltvYmplY3QgSW50OEFycmF5XVwiOlxuICAgICAgICByZXR1cm4gXCJpbnQ4XCJcbiAgICAgIGNhc2UgXCJbb2JqZWN0IEludDE2QXJyYXldXCI6XG4gICAgICAgIHJldHVybiBcImludDE2XCJcbiAgICAgIGNhc2UgXCJbb2JqZWN0IEludDMyQXJyYXldXCI6XG4gICAgICAgIHJldHVybiBcImludDMyXCJcbiAgICAgIGNhc2UgXCJbb2JqZWN0IFVpbnQ4QXJyYXldXCI6XG4gICAgICAgIHJldHVybiBcInVpbnQ4XCJcbiAgICAgIGNhc2UgXCJbb2JqZWN0IFVpbnQxNkFycmF5XVwiOlxuICAgICAgICByZXR1cm4gXCJ1aW50MTZcIlxuICAgICAgY2FzZSBcIltvYmplY3QgVWludDMyQXJyYXldXCI6XG4gICAgICAgIHJldHVybiBcInVpbnQzMlwiXG4gICAgICBjYXNlIFwiW29iamVjdCBVaW50OENsYW1wZWRBcnJheV1cIjpcbiAgICAgICAgcmV0dXJuIFwidWludDhfY2xhbXBlZFwiXG4gICAgfVxuICB9XG4gIGlmKEFycmF5LmlzQXJyYXkoZGF0YSkpIHtcbiAgICByZXR1cm4gXCJhcnJheVwiXG4gIH1cbiAgcmV0dXJuIFwiZ2VuZXJpY1wiXG59XG5cbnZhciBDQUNIRURfQ09OU1RSVUNUT1JTID0ge1xuICBcImZsb2F0MzJcIjpbXSxcbiAgXCJmbG9hdDY0XCI6W10sXG4gIFwiaW50OFwiOltdLFxuICBcImludDE2XCI6W10sXG4gIFwiaW50MzJcIjpbXSxcbiAgXCJ1aW50OFwiOltdLFxuICBcInVpbnQxNlwiOltdLFxuICBcInVpbnQzMlwiOltdLFxuICBcImFycmF5XCI6W10sXG4gIFwidWludDhfY2xhbXBlZFwiOltdLFxuICBcImJ1ZmZlclwiOltdLFxuICBcImdlbmVyaWNcIjpbXVxufVxuXG47KGZ1bmN0aW9uKCkge1xuICBmb3IodmFyIGlkIGluIENBQ0hFRF9DT05TVFJVQ1RPUlMpIHtcbiAgICBDQUNIRURfQ09OU1RSVUNUT1JTW2lkXS5wdXNoKGNvbXBpbGVDb25zdHJ1Y3RvcihpZCwgLTEpKVxuICB9XG59KTtcblxuZnVuY3Rpb24gd3JhcHBlZE5EQXJyYXlDdG9yKGRhdGEsIHNoYXBlLCBzdHJpZGUsIG9mZnNldCkge1xuICBpZihkYXRhID09PSB1bmRlZmluZWQpIHtcbiAgICB2YXIgY3RvciA9IENBQ0hFRF9DT05TVFJVQ1RPUlMuYXJyYXlbMF1cbiAgICByZXR1cm4gY3RvcihbXSlcbiAgfSBlbHNlIGlmKHR5cGVvZiBkYXRhID09PSBcIm51bWJlclwiKSB7XG4gICAgZGF0YSA9IFtkYXRhXVxuICB9XG4gIGlmKHNoYXBlID09PSB1bmRlZmluZWQpIHtcbiAgICBzaGFwZSA9IFsgZGF0YS5sZW5ndGggXVxuICB9XG4gIHZhciBkID0gc2hhcGUubGVuZ3RoXG4gIGlmKHN0cmlkZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgc3RyaWRlID0gbmV3IEFycmF5KGQpXG4gICAgZm9yKHZhciBpPWQtMSwgc3o9MTsgaT49MDsgLS1pKSB7XG4gICAgICBzdHJpZGVbaV0gPSBzelxuICAgICAgc3ogKj0gc2hhcGVbaV1cbiAgICB9XG4gIH1cbiAgaWYob2Zmc2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICBvZmZzZXQgPSAwXG4gICAgZm9yKHZhciBpPTA7IGk8ZDsgKytpKSB7XG4gICAgICBpZihzdHJpZGVbaV0gPCAwKSB7XG4gICAgICAgIG9mZnNldCAtPSAoc2hhcGVbaV0tMSkqc3RyaWRlW2ldXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHZhciBkdHlwZSA9IGFycmF5RFR5cGUoZGF0YSlcbiAgdmFyIGN0b3JfbGlzdCA9IENBQ0hFRF9DT05TVFJVQ1RPUlNbZHR5cGVdXG4gIHdoaWxlKGN0b3JfbGlzdC5sZW5ndGggPD0gZCsxKSB7XG4gICAgY3Rvcl9saXN0LnB1c2goY29tcGlsZUNvbnN0cnVjdG9yKGR0eXBlLCBjdG9yX2xpc3QubGVuZ3RoLTEpKVxuICB9XG4gIHZhciBjdG9yID0gY3Rvcl9saXN0W2QrMV1cbiAgcmV0dXJuIGN0b3IoZGF0YSwgc2hhcGUsIHN0cmlkZSwgb2Zmc2V0KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHdyYXBwZWROREFycmF5Q3RvclxuIiwiLyoqXG4gKiBEZXRlcm1pbmUgaWYgYW4gb2JqZWN0IGlzIEJ1ZmZlclxuICpcbiAqIEF1dGhvcjogICBGZXJvc3MgQWJvdWtoYWRpamVoIDxmZXJvc3NAZmVyb3NzLm9yZz4gPGh0dHA6Ly9mZXJvc3Mub3JnPlxuICogTGljZW5zZTogIE1JVFxuICpcbiAqIGBucG0gaW5zdGFsbCBpcy1idWZmZXJgXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiAhIShvYmogIT0gbnVsbCAmJlxuICAgIChvYmouX2lzQnVmZmVyIHx8IC8vIEZvciBTYWZhcmkgNS03IChtaXNzaW5nIE9iamVjdC5wcm90b3R5cGUuY29uc3RydWN0b3IpXG4gICAgICAob2JqLmNvbnN0cnVjdG9yICYmXG4gICAgICB0eXBlb2Ygb2JqLmNvbnN0cnVjdG9yLmlzQnVmZmVyID09PSAnZnVuY3Rpb24nICYmXG4gICAgICBvYmouY29uc3RydWN0b3IuaXNCdWZmZXIob2JqKSlcbiAgICApKVxufVxuIiwiLyoqXG4gKiBAYXV0aG9yIG1yZG9vYiAvIGh0dHA6Ly9tcmRvb2IuY29tL1xuICovXG5cbnZhciBTdGF0cyA9IGZ1bmN0aW9uICgpIHtcblxuXHR2YXIgc3RhcnRUaW1lID0gRGF0ZS5ub3coKSwgcHJldlRpbWUgPSBzdGFydFRpbWU7XG5cdHZhciBtcyA9IDAsIG1zTWluID0gSW5maW5pdHksIG1zTWF4ID0gMDtcblx0dmFyIGZwcyA9IDAsIGZwc01pbiA9IEluZmluaXR5LCBmcHNNYXggPSAwO1xuXHR2YXIgZnJhbWVzID0gMCwgbW9kZSA9IDA7XG5cblx0dmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG5cdGNvbnRhaW5lci5pZCA9ICdzdGF0cyc7XG5cdGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCAnbW91c2Vkb3duJywgZnVuY3Rpb24gKCBldmVudCApIHsgZXZlbnQucHJldmVudERlZmF1bHQoKTsgc2V0TW9kZSggKysgbW9kZSAlIDIgKSB9LCBmYWxzZSApO1xuXHRjb250YWluZXIuc3R5bGUuY3NzVGV4dCA9ICd3aWR0aDo4MHB4O29wYWNpdHk6MC45O2N1cnNvcjpwb2ludGVyJztcblxuXHR2YXIgZnBzRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0ZnBzRGl2LmlkID0gJ2Zwcyc7XG5cdGZwc0Rpdi5zdHlsZS5jc3NUZXh0ID0gJ3BhZGRpbmc6MCAwIDNweCAzcHg7dGV4dC1hbGlnbjpsZWZ0O2JhY2tncm91bmQtY29sb3I6IzAwMic7XG5cdGNvbnRhaW5lci5hcHBlbmRDaGlsZCggZnBzRGl2ICk7XG5cblx0dmFyIGZwc1RleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuXHRmcHNUZXh0LmlkID0gJ2Zwc1RleHQnO1xuXHRmcHNUZXh0LnN0eWxlLmNzc1RleHQgPSAnY29sb3I6IzBmZjtmb250LWZhbWlseTpIZWx2ZXRpY2EsQXJpYWwsc2Fucy1zZXJpZjtmb250LXNpemU6OXB4O2ZvbnQtd2VpZ2h0OmJvbGQ7bGluZS1oZWlnaHQ6MTVweCc7XG5cdGZwc1RleHQuaW5uZXJIVE1MID0gJ0ZQUyc7XG5cdGZwc0Rpdi5hcHBlbmRDaGlsZCggZnBzVGV4dCApO1xuXG5cdHZhciBmcHNHcmFwaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG5cdGZwc0dyYXBoLmlkID0gJ2Zwc0dyYXBoJztcblx0ZnBzR3JhcGguc3R5bGUuY3NzVGV4dCA9ICdwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDo3NHB4O2hlaWdodDozMHB4O2JhY2tncm91bmQtY29sb3I6IzBmZic7XG5cdGZwc0Rpdi5hcHBlbmRDaGlsZCggZnBzR3JhcGggKTtcblxuXHR3aGlsZSAoIGZwc0dyYXBoLmNoaWxkcmVuLmxlbmd0aCA8IDc0ICkge1xuXG5cdFx0dmFyIGJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdzcGFuJyApO1xuXHRcdGJhci5zdHlsZS5jc3NUZXh0ID0gJ3dpZHRoOjFweDtoZWlnaHQ6MzBweDtmbG9hdDpsZWZ0O2JhY2tncm91bmQtY29sb3I6IzExMyc7XG5cdFx0ZnBzR3JhcGguYXBwZW5kQ2hpbGQoIGJhciApO1xuXG5cdH1cblxuXHR2YXIgbXNEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuXHRtc0Rpdi5pZCA9ICdtcyc7XG5cdG1zRGl2LnN0eWxlLmNzc1RleHQgPSAncGFkZGluZzowIDAgM3B4IDNweDt0ZXh0LWFsaWduOmxlZnQ7YmFja2dyb3VuZC1jb2xvcjojMDIwO2Rpc3BsYXk6bm9uZSc7XG5cdGNvbnRhaW5lci5hcHBlbmRDaGlsZCggbXNEaXYgKTtcblxuXHR2YXIgbXNUZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0bXNUZXh0LmlkID0gJ21zVGV4dCc7XG5cdG1zVGV4dC5zdHlsZS5jc3NUZXh0ID0gJ2NvbG9yOiMwZjA7Zm9udC1mYW1pbHk6SGVsdmV0aWNhLEFyaWFsLHNhbnMtc2VyaWY7Zm9udC1zaXplOjlweDtmb250LXdlaWdodDpib2xkO2xpbmUtaGVpZ2h0OjE1cHgnO1xuXHRtc1RleHQuaW5uZXJIVE1MID0gJ01TJztcblx0bXNEaXYuYXBwZW5kQ2hpbGQoIG1zVGV4dCApO1xuXG5cdHZhciBtc0dyYXBoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0bXNHcmFwaC5pZCA9ICdtc0dyYXBoJztcblx0bXNHcmFwaC5zdHlsZS5jc3NUZXh0ID0gJ3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjc0cHg7aGVpZ2h0OjMwcHg7YmFja2dyb3VuZC1jb2xvcjojMGYwJztcblx0bXNEaXYuYXBwZW5kQ2hpbGQoIG1zR3JhcGggKTtcblxuXHR3aGlsZSAoIG1zR3JhcGguY2hpbGRyZW4ubGVuZ3RoIDwgNzQgKSB7XG5cblx0XHR2YXIgYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ3NwYW4nICk7XG5cdFx0YmFyLnN0eWxlLmNzc1RleHQgPSAnd2lkdGg6MXB4O2hlaWdodDozMHB4O2Zsb2F0OmxlZnQ7YmFja2dyb3VuZC1jb2xvcjojMTMxJztcblx0XHRtc0dyYXBoLmFwcGVuZENoaWxkKCBiYXIgKTtcblxuXHR9XG5cblx0dmFyIHNldE1vZGUgPSBmdW5jdGlvbiAoIHZhbHVlICkge1xuXG5cdFx0bW9kZSA9IHZhbHVlO1xuXG5cdFx0c3dpdGNoICggbW9kZSApIHtcblxuXHRcdFx0Y2FzZSAwOlxuXHRcdFx0XHRmcHNEaXYuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cdFx0XHRcdG1zRGl2LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHRmcHNEaXYuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0XHRcdFx0bXNEaXYuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdH1cblxuXHR9O1xuXG5cdHZhciB1cGRhdGVHcmFwaCA9IGZ1bmN0aW9uICggZG9tLCB2YWx1ZSApIHtcblxuXHRcdHZhciBjaGlsZCA9IGRvbS5hcHBlbmRDaGlsZCggZG9tLmZpcnN0Q2hpbGQgKTtcblx0XHRjaGlsZC5zdHlsZS5oZWlnaHQgPSB2YWx1ZSArICdweCc7XG5cblx0fTtcblxuXHRyZXR1cm4ge1xuXG5cdFx0UkVWSVNJT046IDEyLFxuXG5cdFx0ZG9tRWxlbWVudDogY29udGFpbmVyLFxuXG5cdFx0c2V0TW9kZTogc2V0TW9kZSxcblxuXHRcdGJlZ2luOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRcdHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cblx0XHR9LFxuXG5cdFx0ZW5kOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRcdHZhciB0aW1lID0gRGF0ZS5ub3coKTtcblxuXHRcdFx0bXMgPSB0aW1lIC0gc3RhcnRUaW1lO1xuXHRcdFx0bXNNaW4gPSBNYXRoLm1pbiggbXNNaW4sIG1zICk7XG5cdFx0XHRtc01heCA9IE1hdGgubWF4KCBtc01heCwgbXMgKTtcblxuXHRcdFx0bXNUZXh0LnRleHRDb250ZW50ID0gbXMgKyAnIE1TICgnICsgbXNNaW4gKyAnLScgKyBtc01heCArICcpJztcblx0XHRcdHVwZGF0ZUdyYXBoKCBtc0dyYXBoLCBNYXRoLm1pbiggMzAsIDMwIC0gKCBtcyAvIDIwMCApICogMzAgKSApO1xuXG5cdFx0XHRmcmFtZXMgKys7XG5cblx0XHRcdGlmICggdGltZSA+IHByZXZUaW1lICsgMTAwMCApIHtcblxuXHRcdFx0XHRmcHMgPSBNYXRoLnJvdW5kKCAoIGZyYW1lcyAqIDEwMDAgKSAvICggdGltZSAtIHByZXZUaW1lICkgKTtcblx0XHRcdFx0ZnBzTWluID0gTWF0aC5taW4oIGZwc01pbiwgZnBzICk7XG5cdFx0XHRcdGZwc01heCA9IE1hdGgubWF4KCBmcHNNYXgsIGZwcyApO1xuXG5cdFx0XHRcdGZwc1RleHQudGV4dENvbnRlbnQgPSBmcHMgKyAnIEZQUyAoJyArIGZwc01pbiArICctJyArIGZwc01heCArICcpJztcblx0XHRcdFx0dXBkYXRlR3JhcGgoIGZwc0dyYXBoLCBNYXRoLm1pbiggMzAsIDMwIC0gKCBmcHMgLyAxMDAgKSAqIDMwICkgKTtcblxuXHRcdFx0XHRwcmV2VGltZSA9IHRpbWU7XG5cdFx0XHRcdGZyYW1lcyA9IDA7XG5cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRpbWU7XG5cblx0XHR9LFxuXG5cdFx0dXBkYXRlOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRcdHN0YXJ0VGltZSA9IHRoaXMuZW5kKCk7XG5cblx0XHR9XG5cblx0fVxuXG59O1xuXG5pZiAoIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICkge1xuXG5cdG1vZHVsZS5leHBvcnRzID0gU3RhdHM7XG5cbn0iLCJ2YXIgVEhSRUUgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snVEhSRUUnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ1RIUkVFJ10gOiBudWxsKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcHApIHtcblx0dmFyIHNjZW5lID0gYXBwLmdldCgnc2NlbmUnKTtcblxuXHR2YXIgb2JqZWN0ID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG5cblx0dmFyIGVkaXRvciA9IGFwcC5hdHRhY2gob2JqZWN0LCByZXF1aXJlKCcuLi9jb21wb25lbnRzL2VkaXRvcicpKTtcblxuXHRzY2VuZS5hZGQob2JqZWN0KTtcblx0XG5cdHJldHVybiBvYmplY3Q7XG59OyIsInZhciBuZGFycmF5ID0gcmVxdWlyZSgnbmRhcnJheScpO1xudmFyIFRIUkVFID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ1RIUkVFJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydUSFJFRSddIDogbnVsbCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXBwKSB7XG4gIHZhciBzY2VuZSA9IGFwcC5nZXQoJ3NjZW5lJyk7XG4gIHZhciBjYW1lcmEgPSBhcHAuZ2V0KCdjYW1lcmEnKTtcblxuICB2YXIgb2JqZWN0ID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gIHZhciBibG9ja3MgPSBhcHAuYXR0YWNoKG9iamVjdCwgcmVxdWlyZSgnLi4vY29tcG9uZW50cy9ibG9ja3MnKSk7XG5cbiAgdmFyIGRpbSA9IFszMiwgMzIsIDMyXTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGRpbVswXTsgaSsrKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBkaW1bMV07IGorKykge1xuICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBkaW1bMl07IGsrKykge1xuICAgICAgICBibG9ja3Muc2V0KGksIGosIGssIDEpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGJsb2Nrcy5vZmZzZXQuc2V0KC0xNiwgLTE2LCAtMTYpO1xuICBibG9ja3MudXBkYXRlTWVzaCgpO1xuXG4gIHZhciByaWdpZEJvZHkgPSBhcHAuYXR0YWNoKG9iamVjdCwgcmVxdWlyZSgnLi4vY29tcG9uZW50cy9yaWdpZGJvZHknKSk7XG4gIHJpZ2lkQm9keS5jb2xsaXNpb25PYmplY3QgPSBibG9ja3Mub2JqZWN0O1xuICByaWdpZEJvZHkuaXNGaXh0dXJlID0gdHJ1ZTtcbiAgXG4gIHNjZW5lLmFkZChvYmplY3QpO1xufTsiLCJ2YXIgVEhSRUUgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snVEhSRUUnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ1RIUkVFJ10gOiBudWxsKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcHApIHtcbiAgdmFyIHNjZW5lID0gYXBwLmdldCgnc2NlbmUnKTtcblxuICB2YXIgb2JqZWN0ID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gIHZhciBjaGFyYWN0ZXIgPSBhcHAuYXR0YWNoKG9iamVjdCwgcmVxdWlyZSgnLi4vY29tcG9uZW50cy9jaGFyYWN0ZXInKSk7XG4gIHZhciByaWdpZEJvZHkgPSBhcHAuYXR0YWNoKG9iamVjdCwgcmVxdWlyZSgnLi4vY29tcG9uZW50cy9yaWdpZGJvZHknKSk7XG4gIHJpZ2lkQm9keS5tYXNzID0gMTtcbiAgdmFyIHBsYXllckNvbnRyb2wgPSBhcHAuYXR0YWNoKG9iamVjdCwgcmVxdWlyZSgnLi4vY29tcG9uZW50cy9wbGF5ZXJjb250cm9sJykpO1xuXG4gIGNoYXJhY3Rlci5yaWdpZEJvZHkgPSByaWdpZEJvZHk7XG4gIHBsYXllckNvbnRyb2wuY2hhcmFjdGVyID0gY2hhcmFjdGVyO1xuICBwbGF5ZXJDb250cm9sLnJpZ2lkQm9keSA9IHJpZ2lkQm9keTtcblxuICBzY2VuZS5hZGQob2JqZWN0KTtcblxuICBvYmplY3QucG9zaXRpb24uc2V0KDAsIDQwLCAwKTtcblxuICByZXR1cm4gb2JqZWN0O1xufTsiLCJ2YXIgbmRhcnJheSA9IHJlcXVpcmUoJ25kYXJyYXknKTtcbnZhciBtZXNoZXIgPSByZXF1aXJlKCdiLW1lc2hlcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iamVjdCwgbWF0ZXJpYWxzKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuXG4gIHZhciBwYWxldHRlID0gW251bGwsIDB4ZmZmZmZmXTtcblxuICB2YXIgY2h1bmtTaXplID0gMTY7XG4gIHZhciBjaHVua3MgPSB7fTtcbiAgdmFyIG9mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gIHZhciBtZXNoID0gbnVsbDtcbiAgdmFyIG9iaiA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICB2YXIgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaExhbWJlcnRNYXRlcmlhbCgpO1xuICBtYXRlcmlhbC5tYXRlcmlhbHMgPSBtYXRlcmlhbHM7XG5cbiAgb2JqZWN0LmFkZChvYmopO1xuXG4gIGZ1bmN0aW9uIHVwZGF0ZU1lc2goKSB7XG4gICAgZm9yICh2YXIgaWQgaW4gY2h1bmtzKSB7XG4gICAgICB2YXIgY2h1bmsgPSBjaHVua3NbaWRdO1xuICAgICAgaWYgKGNodW5rLmRpcnR5KSB7XG4gICAgICAgIHVwZGF0ZUNodW5rKGNodW5rKTtcbiAgICAgICAgY2h1bmsuZGlydHkgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gdXBkYXRlQ2h1bmsoY2h1bmspIHtcbiAgICBpZiAoY2h1bmsubWVzaCAhPSBudWxsKSB7XG4gICAgICBvYmoucmVtb3ZlKGNodW5rLm1lc2gpO1xuICAgIH1cblxuICAgIHZhciByZXN1bHQgPSBtZXNoZXIoY2h1bmsubWFwKTtcblxuICAgIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5HZW9tZXRyeSgpO1xuXG5cbiAgICByZXN1bHQudmVydGljZXMuZm9yRWFjaChmdW5jdGlvbih2KSB7XG4gICAgICB2YXIgdmVydGljZSA9IG5ldyBUSFJFRS5WZWN0b3IzKFxuICAgICAgICB2WzBdLCB2WzFdLCB2WzJdXG4gICAgICApO1xuICAgICAgZ2VvbWV0cnkudmVydGljZXMucHVzaCh2ZXJ0aWNlKTtcbiAgICB9KTtcblxuICAgIHJlc3VsdC5zdXJmYWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHN1cmZhY2UpIHtcbiAgICAgIHZhciBmID0gc3VyZmFjZS5mYWNlO1xuICAgICAgdmFyIHV2ID0gc3VyZmFjZS51djtcbiAgICAgIHZhciBjID0gZls0XTtcblxuICAgICAgdmFyIGZhY2UgPSBuZXcgVEhSRUUuRmFjZTMoZlswXSwgZlsxXSwgZlsyXSk7XG4gICAgICBnZW9tZXRyeS5mYWNlcy5wdXNoKGZhY2UpO1xuICAgICAgZmFjZS5jb2xvciA9IG5ldyBUSFJFRS5Db2xvcihwYWxldHRlW2NdKTtcblxuICAgICAgZmFjZSA9IG5ldyBUSFJFRS5GYWNlMyhmWzJdLCBmWzNdLCBmWzBdKTtcbiAgICAgIGdlb21ldHJ5LmZhY2VzLnB1c2goZmFjZSk7XG4gICAgICBmYWNlLmNvbG9yID0gbmV3IFRIUkVFLkNvbG9yKHBhbGV0dGVbY10pO1xuICAgIH0pO1xuXG4gICAgZ2VvbWV0cnkuY29tcHV0ZUZhY2VOb3JtYWxzKCk7XG5cbiAgICBtZXNoID0gbmV3IFRIUkVFLk1lc2goZ2VvbWV0cnksIG1hdGVyaWFsKTtcbiAgICB2YXIgb3JpZ2luID0gY2h1bmsub3JpZ2luO1xuICAgIG1lc2gucG9zaXRpb24uY29weShuZXcgVEhSRUUuVmVjdG9yMygpLmFkZFZlY3RvcnMob3JpZ2luLCBvZmZzZXQpKTtcbiAgICBvYmouYWRkKG1lc2gpO1xuICAgIGNodW5rLm1lc2ggPSBtZXNoO1xuICB9O1xuXG4gIGZ1bmN0aW9uIHNldCh4LCB5LCB6LCBvYmopIHtcbiAgICB2YXIgb3JpZ2luID0gZ2V0T3JpZ2luKHgsIHksIHopO1xuICAgIHZhciBpZCA9IG9yaWdpbi5qb2luKCcsJyk7XG4gICAgdmFyIGNodW5rID0gY2h1bmtzW2lkXTtcbiAgICBpZiAoY2h1bmsgPT0gbnVsbCkge1xuICAgICAgY2h1bmsgPSBjaHVua3NbaWRdID0ge1xuICAgICAgICBvcmlnaW46IG5ldyBUSFJFRS5WZWN0b3IzKG9yaWdpblswXSwgb3JpZ2luWzFdLCBvcmlnaW5bMl0pLFxuICAgICAgICBtYXA6IG5kYXJyYXkoW10sIFtjaHVua1NpemUsIGNodW5rU2l6ZSwgY2h1bmtTaXplXSlcbiAgICAgIH07XG4gICAgfVxuICAgIGNodW5rLm1hcC5zZXQoeCAtIG9yaWdpblswXSwgeSAtIG9yaWdpblsxXSwgeiAtIG9yaWdpblsyXSwgb2JqKTtcbiAgICBjaHVuay5kaXJ0eSA9IHRydWU7XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0KHgsIHksIHopIHtcbiAgICB2YXIgb3JpZ2luID0gZ2V0T3JpZ2luKHgsIHksIHopO1xuICAgIHZhciBpZCA9IG9yaWdpbi5qb2luKCcsJyk7XG4gICAgdmFyIGNodW5rID0gY2h1bmtzW2lkXTtcbiAgICBpZiAoY2h1bmsgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIGNodW5rLm1hcC5nZXQoeCAtIG9yaWdpblswXSwgeSAtIG9yaWdpblsxXSwgeiAtIG9yaWdpblsyXSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0T3JpZ2luKHgsIHksIHopIHtcbiAgICByZXR1cm4gW1xuICAgICAgTWF0aC5mbG9vcih4IC8gY2h1bmtTaXplKSAqIGNodW5rU2l6ZSxcbiAgICAgIE1hdGguZmxvb3IoeSAvIGNodW5rU2l6ZSkgKiBjaHVua1NpemUsXG4gICAgICBNYXRoLmZsb29yKHogLyBjaHVua1NpemUpICogY2h1bmtTaXplXG4gICAgXTtcbiAgfTtcblxuICBmdW5jdGlvbiBnZXRBdENvb3JkKGNvb3JkKSB7XG4gICAgcmV0dXJuIGdldChjb29yZC54LCBjb29yZC55LCBjb29yZC56KTtcbiAgfTtcblxuICBmdW5jdGlvbiBwb2ludFRvQ29vcmQocG9pbnQsIHJvdW5kKSB7XG4gICAgcm91bmQgPSByb3VuZCA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgaWYgKHJvdW5kKSB7XG4gICAgICByZXR1cm4gbmV3IFRIUkVFLlZlY3RvcjMoXG4gICAgICAgIE1hdGgucm91bmQocG9pbnQueCAtIG9mZnNldC54IC0gMC41KSxcbiAgICAgICAgTWF0aC5yb3VuZChwb2ludC55IC0gb2Zmc2V0LnkgLSAwLjUpLFxuICAgICAgICBNYXRoLnJvdW5kKHBvaW50LnogLSBvZmZzZXQueiAtIDAuNSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBUSFJFRS5WZWN0b3IzKFxuICAgICAgcG9pbnQueCAtIG9mZnNldC54IC0gMC41LFxuICAgICAgcG9pbnQueSAtIG9mZnNldC55IC0gMC41LFxuICAgICAgcG9pbnQueiAtIG9mZnNldC56IC0gMC41XG4gICAgKTtcbiAgfTtcblxuICBmdW5jdGlvbiBjb29yZFRvUG9pbnQoY29vcmQpIHtcbiAgICByZXR1cm4gbmV3IFRIUkVFLlZlY3RvcjMoXG4gICAgICBjb29yZC54ICsgb2Zmc2V0LngsIGNvb3JkLnkgKyBvZmZzZXQueSwgY29vcmQueiArIG9mZnNldC56XG4gICAgKTtcbiAgfTtcblxuICBmdW5jdGlvbiBzZXRBdENvb3JkKGNvb3JkLCBiKSB7XG4gICAgc2V0KGNvb3JkLngsIGNvb3JkLnksIGNvb3JkLnosIGIpO1xuICB9O1xuXG4gIGZ1bmN0aW9uIHRpY2soKSB7XG4gICAgdXBkYXRlTWVzaCgpO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIGZvciAodmFyIGlkIGluIGNodW5rcykge1xuICAgICAgdmFyIGNodW5rID0gY2h1bmtzW2lkXTtcbiAgICAgIHZhciBtZXNoID0gY2h1bmsubWVzaDtcbiAgICAgIGlmIChtZXNoICE9IG51bGwpIHtcbiAgICAgICAgb2JqLnJlbW92ZShtZXNoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY2h1bmtzID0ge307XG4gIH07XG5cbiAgZnVuY3Rpb24gdmlzaXQoY2FsbGJhY2spIHtcbiAgICBmb3IgKHZhciBpZCBpbiBjaHVua3MpIHtcbiAgICAgIHZhciBjaHVuayA9IGNodW5rc1tpZF07XG4gICAgICB2YXIgbWFwID0gY2h1bmsubWFwO1xuICAgICAgdmFyIHNoYXBlID0gbWFwLnNoYXBlO1xuICAgICAgdmFyIGRhdGEgPSBtYXAuZGF0YTtcbiAgICAgIHZhciBvcmlnaW4gPSBjaHVuay5vcmlnaW47XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNoYXBlWzBdOyBpKyspIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBzaGFwZVsxXTsgaisrKSB7XG4gICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBzaGFwZVsyXTsgaysrKSB7XG4gICAgICAgICAgICB2YXIgYiA9IG1hcC5nZXQoaSwgaiwgayk7XG4gICAgICAgICAgICBpZiAoISFiKSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrKGkgKyBvcmlnaW4ueCwgaiArIG9yaWdpbi55LCBrICsgb3JpZ2luLnosIGIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICByZXR1cm4ge1xuICAgIHR5cGU6ICdibG9ja3MnLFxuICAgIHRpY2s6IHRpY2ssXG4gICAgdXBkYXRlTWVzaDogdXBkYXRlTWVzaCxcbiAgICBwYWxldHRlOiBwYWxldHRlLFxuICAgIG9mZnNldDogb2Zmc2V0LFxuICAgIGdldDogZ2V0LFxuICAgIHNldDogc2V0LFxuICAgIHBvaW50VG9Db29yZDogcG9pbnRUb0Nvb3JkLFxuICAgIGNvb3JkVG9Qb2ludDogY29vcmRUb1BvaW50LFxuICAgIGdldEF0Q29vcmQ6IGdldEF0Q29vcmQsXG4gICAgc2V0QXRDb29yZDogc2V0QXRDb29yZCxcbiAgICBnZXQgbWF0ZXJpYWwoKSB7XG4gICAgICByZXR1cm4gbWF0ZXJpYWw7XG4gICAgfSxcbiAgICBjbGVhcjogY2xlYXIsXG4gICAgZ2V0IG9iaigpIHtcbiAgICAgIHJldHVybiBvYmo7XG4gICAgfSxcbiAgICB2aXNpdDogdmlzaXRcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzLiRpbmplY3QgPSBbJ21hdGVyaWFscyddOyIsInZhciBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydUSFJFRSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnVEhSRUUnXSA6IG51bGwpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICB2YXIgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuQm94R2VvbWV0cnkoMSwgMSwgMSk7XG4gIHZhciBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgY29sb3I6IDB4ZmYwMDAwXG4gIH0pO1xuICB2YXIgbW92ZVNwZWVkID0gMC41O1xuICB2YXIganVtcFNwZWVkID0gMC44O1xuXG4gIHZhciBtZXNoID0gbmV3IFRIUkVFLk1lc2goZ2VvbWV0cnksIG1hdGVyaWFsKTtcbiAgb2JqZWN0LmFkZChtZXNoKTtcbiAgdmFyIGp1bXBpbmcgPSBmYWxzZTtcblxuICBmdW5jdGlvbiB0aWNrKCkge1xuICAgIGNoYXJhY3Rlci5ncmF2aXR5ID0gdGhpcy5yaWdpZEJvZHkuZ3Jhdml0eTtcbiAgICBpZiAoanVtcGluZyAmJiB0aGlzLnJpZ2lkQm9keS5ncm91bmRlZCkge1xuICAgICAganVtcGluZyA9IGZhbHNlO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBtb3ZlKGZvcndhcmQsIGFtb3VudCkge1xuICAgIHZhciBncmF2aXR5ID0gdGhpcy5yaWdpZEJvZHkuZ3Jhdml0eTtcbiAgICBpZihncmF2aXR5ID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMucmlnaWRCb2R5Lmdyb3VuZGVkIHx8IGp1bXBpbmcpIHtcbiAgICAgIHZhciB2ZXJ0aWNhbFNwZWVkID0gdGhpcy5yaWdpZEJvZHkudmVsb2NpdHkuY2xvbmUoKS5wcm9qZWN0T25WZWN0b3IoZ3Jhdml0eS5kaXIpO1xuICAgICAgdmFyIGZvcndhcmRTcGVlZCA9IGZvcndhcmQuY2xvbmUoKS5zZXRMZW5ndGgoYW1vdW50ICogbW92ZVNwZWVkKTtcbiAgICAgIHRoaXMucmlnaWRCb2R5LnZlbG9jaXR5LmNvcHkodmVydGljYWxTcGVlZC5hZGQoZm9yd2FyZFNwZWVkKSk7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIGp1bXAoYW1vdW50KSB7XG4gICAgdmFyIGdyYXZpdHkgPSB0aGlzLnJpZ2lkQm9keS5ncmF2aXR5O1xuICAgIGlmKGdyYXZpdHkgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5yaWdpZEJvZHkuZ3JvdW5kZWQpIHtcbiAgICAgIGp1bXBpbmcgPSB0cnVlO1xuICAgICAgdGhpcy5yaWdpZEJvZHkudmVsb2NpdHkuY29weShncmF2aXR5LmRpci5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKC1qdW1wU3BlZWQpKTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIGNoYXJhY3RlciA9IHtcbiAgICB0aWNrOiB0aWNrLFxuICAgIG1vdmU6IG1vdmUsXG4gICAganVtcDoganVtcCxcbiAgICByaWdpZEJvZHk6IG51bGxcbiAgfTtcblxuICByZXR1cm4gY2hhcmFjdGVyO1xufTsiLCJ2YXIgVEhSRUUgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snVEhSRUUnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ1RIUkVFJ10gOiBudWxsKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihjYW1lcmEsIGlucHV0KSB7XG4gIFwidXNlIHN0cmljdFwiO1xuXG4gIHZhciByb3RhdGlvbiA9IG5ldyBUSFJFRS5FdWxlcigtTWF0aC5QSSAvIDQsIE1hdGguUEkgLyA0LCAwLCAnWVhaJyk7XG4gIHZhciBsYXN0TW91c2UgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICB2YXIgbW91c2VTcGVlZFggPSA0O1xuICB2YXIgbW91c2VTcGVlZFkgPSA0O1xuICB2YXIgdW5pdFZlY3RvciA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDEpO1xuICB2YXIgZGlzdGFuY2UgPSAxMDA7XG4gIHZhciB0YXJnZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAwKTtcbiAgdmFyIG1heFBpdGNoID0gTWF0aC5QSSAvIDIgLSAwLjAxO1xuICB2YXIgbWluUGl0Y2ggPSAtTWF0aC5QSSAvIDIgKyAwLjAxO1xuXG4gIGZ1bmN0aW9uIHRpY2soKSB7XG4gICAgaWYgKGlucHV0Lm1vdXNlSG9sZCgyKSkge1xuICAgICAgdmFyIGRpZmYgPSBuZXcgVEhSRUUuVmVjdG9yMigpLnN1YlZlY3RvcnMoaW5wdXQubW91c2UsIGxhc3RNb3VzZSk7XG4gICAgICByb3RhdGlvbi55ICs9IGRpZmYueCAqIG1vdXNlU3BlZWRYO1xuICAgICAgcm90YXRpb24ueCAtPSBkaWZmLnkgKiBtb3VzZVNwZWVkWTtcblxuICAgICAgaWYgKHJvdGF0aW9uLnggPCBtaW5QaXRjaCkgcm90YXRpb24ueCA9IG1pblBpdGNoO1xuICAgICAgaWYgKHJvdGF0aW9uLnggPiBtYXhQaXRjaCkgcm90YXRpb24ueCA9IG1heFBpdGNoO1xuXG4gICAgICB1cGRhdGVDYW1lcmEoKTtcbiAgICB9XG5cbiAgICBsYXN0TW91c2UuY29weShpbnB1dC5tb3VzZSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gdXBkYXRlQ2FtZXJhKCkge1xuICAgIHZhciBwb3NpdGlvbiA9IHVuaXRWZWN0b3IuY2xvbmUoKS5hcHBseUV1bGVyKHJvdGF0aW9uKS5zZXRMZW5ndGgoZGlzdGFuY2UpLmFkZCh0YXJnZXQpO1xuICAgIGNhbWVyYS5wb3NpdGlvbi5jb3B5KHBvc2l0aW9uKTtcbiAgICBjYW1lcmEubG9va0F0KHRhcmdldCk7XG4gIH07XG5cbiAgdXBkYXRlQ2FtZXJhKCk7XG5cbiAgcmV0dXJuIHtcbiAgICB0aWNrOiB0aWNrXG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzLiRpbmplY3QgPSBbJ2lucHV0J107IiwidmFyIFRIUkVFID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ1RIUkVFJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydUSFJFRSddIDogbnVsbCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob2JqZWN0LCBhcHAsIGlucHV0LCBjYW1lcmEsIGRldkNvbnNvbGUsIGNvbmZpZykge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICB2YXIgcmF5Y2FzdGVyID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xuICB2YXIgc24gPSAwLjAwMDE7XG4gIHZhciBibG9ja3MgPSBudWxsO1xuICB2YXIgZ3JvdW5kID0gbnVsbDtcbiAgdmFyIHRlbXBCbG9ja3MgPSBudWxsO1xuXG4gIGRldkNvbnNvbGUuY29tbWFuZHNbJ25ldyddID0gZnVuY3Rpb24oYXJncykge1xuICAgIHZhciBzaXplID0gYXJncy5fWzBdIHx8IDE2O1xuXG4gICAgdXBkYXRlR3JvdW5kKHNpemUpO1xuICB9O1xuXG4gIGZ1bmN0aW9uIHVwZGF0ZUdyb3VuZChzaXplKSB7XG4gICAgZ3JvdW5kLmNsZWFyKCk7XG5cbiAgICB2YXIgZGltID0gW3NpemUsIDIsIHNpemVdO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkaW1bMF07IGkrKykge1xuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBkaW1bMV07IGorKykge1xuICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IGRpbVsyXTsgaysrKSB7XG4gICAgICAgICAgZ3JvdW5kLnNldChpLCBqLCBrLCAxKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGdyb3VuZC5vZmZzZXQuc2V0KC1kaW1bMF0gLyAyLCAtZGltWzFdIC8gMiwgLWRpbVsyXSAvIDIpO1xuICAgIGdyb3VuZC51cGRhdGVNZXNoKCk7XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0TW91c2VDb29yZChkZWx0YSkge1xuICAgIHZhciBtb3VzZSA9IGlucHV0Lm1vdXNlO1xuICAgIHJheWNhc3Rlci5zZXRGcm9tQ2FtZXJhKG1vdXNlLCBjYW1lcmEpO1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgaWYgKGJsb2Nrcy5vYmplY3QgIT0gbnVsbCkgb2JqZWN0cy5wdXNoKGJsb2Nrcy5vYmopO1xuICAgIGlmIChncm91bmQub2JqZWN0ICE9IG51bGwpIG9iamVjdHMucHVzaChncm91bmQub2JqKTtcbiAgICB2YXIgaW50ZXJzZWN0cyA9IHJheWNhc3Rlci5pbnRlcnNlY3RPYmplY3RzKG9iamVjdHMsIHRydWUpO1xuXG4gICAgaWYgKGludGVyc2VjdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHZhciBpbnRlcnNlY3QgPSBpbnRlcnNlY3RzWzBdO1xuXG4gICAgdmFyIHBvaW50ID0gaW50ZXJzZWN0LnBvaW50O1xuICAgIHZhciBkaWZmID0gcG9pbnQuY2xvbmUoKS5zdWIoY2FtZXJhLnBvc2l0aW9uKTtcbiAgICBkaWZmID0gZGlmZi5zZXRMZW5ndGgoZGlmZi5sZW5ndGgoKSArIGRlbHRhIHx8IDApO1xuICAgIHBvaW50ID0gY2FtZXJhLnBvc2l0aW9uLmNsb25lKCkuYWRkKGRpZmYpO1xuXG4gICAgdmFyIGNvb3JkID0gYmxvY2tzLnBvaW50VG9Db29yZChwb2ludCk7XG5cbiAgICByZXR1cm4gY29vcmQ7XG4gIH07XG5cbiAgdmFyIGxhc3RNb3VzZSA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG5cbiAgdmFyIHN0YXJ0Q29vcmQgPSBudWxsO1xuICB2YXIgZW5kQ29vcmQgPSBudWxsO1xuXG4gIGZ1bmN0aW9uIHN0YXJ0KCkge1xuICAgIGdyb3VuZCA9IGFwcC5hdHRhY2gob2JqZWN0LCByZXF1aXJlKCcuL2Jsb2NrcycpKTtcbiAgICB1cGRhdGVHcm91bmQoY29uZmlnWydlZGl0b3JfZ3JvdW5kX3NpemUnXSk7XG4gICAgYmxvY2tzID0gYXBwLmF0dGFjaChvYmplY3QsIHJlcXVpcmUoJy4vYmxvY2tzJykpO1xuICAgIHRlbXBCbG9ja3MgPSBhcHAuYXR0YWNoKG9iamVjdCwgcmVxdWlyZSgnLi9ibG9ja3MnKSk7XG4gIH07XG5cbiAgdmFyIF9zdGFydGVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gdGljaygpIHtcbiAgICBpZiAoIV9zdGFydGVkKSB7XG4gICAgICBzdGFydCgpO1xuICAgICAgX3N0YXJ0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHZhciBtb3VzZSA9IGlucHV0Lm1vdXNlLmNsb25lKCk7XG4gICAgdmFyIGNvb3JkQSA9IGdldE1vdXNlQ29vcmQoLXNuKTtcbiAgICB2YXIgY29vcmRCID0gZ2V0TW91c2VDb29yZChzbik7XG5cbiAgICBpZiAoaW5wdXQubW91c2VDbGljaygwKSkge1xuICAgICAgYmxvY2tzLnNldEF0Q29vcmQoY29vcmRBLCAxKTtcbiAgICB9XG5cbiAgICBpZiAoaW5wdXQubW91c2VEb3duKDApKSB7XG4gICAgICBpZiAoISFzdGFydENvb3JkKSB7XG4gICAgICAgIGNvbW1pdFRlbXBCbG9ja3MoKTtcbiAgICAgICAgc3RhcnRDb29yZCA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGlucHV0Lm1vdXNlSG9sZCgwKSkge1xuICAgICAgaWYoc3RhcnRDb29yZCA9PSBudWxsICYmICEhY29vcmRBKSB7XG4gICAgICAgIHN0YXJ0Q29vcmQgPSBjb29yZEEuY2xvbmUoKTtcbiAgICAgIH1cblxuICAgICAgZW5kQ29vcmQgPSBjb29yZEE7XG5cbiAgICAgIGlmICghIXN0YXJ0Q29vcmQgJiYgISFlbmRDb29yZCkge1xuICAgICAgICB1cGRhdGVUZW1wQmxvY2tzKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGlucHV0LmtleURvd24oJ3VwJykpIHtcbiAgICAgIGlmICghIXN0YXJ0Q29vcmQgJiYgISFlbmRDb29yZCkge1xuICAgICAgICBlbmRDb29yZC55Kys7XG4gICAgICAgIGlmIChzdGFydENvb3JkLnkgPT0gZW5kQ29vcmQueSkge1xuICAgICAgICAgIGVuZENvb3JkLnkrKztcbiAgICAgICAgfVxuICAgICAgICB1cGRhdGVUZW1wQmxvY2tzKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGlucHV0LmtleURvd24oJ2Rvd24nKSkge1xuICAgICAgaWYgKCEhc3RhcnRDb29yZCAmJiAhIWVuZENvb3JkKSB7XG4gICAgICAgIGVuZENvb3JkLnktLTtcbiAgICAgICAgaWYgKHN0YXJ0Q29vcmQueSA9PSBlbmRDb29yZC55KSB7XG4gICAgICAgICAgZW5kQ29vcmQueS0tO1xuICAgICAgICB9XG4gICAgICAgIHVwZGF0ZVRlbXBCbG9ja3MoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgfTtcblxuICBmdW5jdGlvbiB1cGRhdGVUZW1wQmxvY2tzKCkge1xuICAgIHRlbXBCbG9ja3MuY2xlYXIoKTtcbiAgICB2aXNpdEJvdW5kKHN0YXJ0Q29vcmQsIGVuZENvb3JkLCBmdW5jdGlvbihpLCBqLCBrKSB7XG4gICAgICB0ZW1wQmxvY2tzLnNldChpLCBqLCBrLCAxKTtcbiAgICB9KTtcbiAgfTtcblxuICBmdW5jdGlvbiBjb21taXRUZW1wQmxvY2tzKCkge1xuICAgIHRlbXBCbG9ja3MudmlzaXQoZnVuY3Rpb24oaSwgaiwgaywgYikge1xuICAgICAgYmxvY2tzLnNldChpLCBqLCBrLCBiKTtcbiAgICB9KTtcbiAgICB0ZW1wQmxvY2tzLmNsZWFyKCk7XG4gIH07XG5cbiAgZnVuY3Rpb24gdmlzaXRCb3VuZChsbywgaGksIGNhbGxiYWNrKSB7XG4gICAgdmFyIHhzID0gaGkueCA+IGxvLnggPyBbbG8ueCwgaGkueF0gOiBbaGkueCwgbG8ueF07XG4gICAgdmFyIHlzID0gaGkueSA+IGxvLnkgPyBbbG8ueSwgaGkueV0gOiBbaGkueSwgbG8ueV07XG4gICAgdmFyIHpzID0gaGkueiA+IGxvLnogPyBbbG8ueiwgaGkuel0gOiBbaGkueiwgbG8uel07XG4gICAgZm9yICh2YXIgaSA9IHhzWzBdOyBpIDw9IHhzWzFdOyBpKyspIHtcbiAgICAgIGZvciAodmFyIGogPSB5c1swXTsgaiA8PSB5c1sxXTsgaisrKSB7XG4gICAgICAgIGZvciAodmFyIGsgPSB6c1swXTsgayA8PSB6c1sxXTsgaysrKSB7XG4gICAgICAgICAgY2FsbGJhY2soaSwgaiwgayk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgdmFyIGVkaXRvciA9IHtcbiAgICB0aWNrOiB0aWNrLFxuICAgIHNldCBibG9ja3ModmFsdWUpIHtcbiAgICAgIGJsb2NrcyA9IHZhbHVlO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gZWRpdG9yO1xufTtcblxubW9kdWxlLmV4cG9ydHMuJGluamVjdCA9IFsnYXBwJywgJ2lucHV0JywgJ2NhbWVyYScsICdkZXZDb25zb2xlJywgJ2NvbmZpZyddOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oY2FtZXJhLCBhcHApIHtcbiAgdmFyIGNhbWVyYVRpbHQgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21FdWxlcihcbiAgICBuZXcgVEhSRUUuRXVsZXIoLU1hdGguUEkgLyA0LCBNYXRoLlBJIC8gNCwgMCwgJ1lYWicpKTtcblxuICB2YXIgbGFzdEdyYXZpdHlEaXIgPSBudWxsO1xuICB2YXIgY2FtZXJhUXVhdCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG4gIHZhciBjYW1lcmFRdWF0RmluYWwgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICB2YXIgdHJhY2tiYWxsID0gbnVsbDtcblxuICB2YXIgZGlzdGFuY2UgPSAxMDA7XG4gIHZhciB0YXJnZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICB2YXIgcXVhdGVybmlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbiAgZnVuY3Rpb24gdGljaygpIHtcbiAgICB2YXIgcGxheWVyID0gYXBwLmdldCgncGxheWVyJyk7XG4gICAgaWYgKHBsYXllciA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHJpZ2lkQm9keSA9IGFwcC5nZXRDb21wb25lbnQocGxheWVyLCAncmlnaWRCb2R5Jyk7XG5cbiAgICB2YXIgZ3Jhdml0eURpcjtcbiAgICBpZihyaWdpZEJvZHkuZ3JvdW5kZWQpIHtcbiAgICAgIGdyYXZpdHlEaXIgPSByaWdpZEJvZHkuZ3Jhdml0eS5kaXIuY2xvbmUoKTtcbiAgICB9ZWxzZSB7XG4gICAgICBncmF2aXR5RGlyID0gcmlnaWRCb2R5LmdyYXZpdHkuZm9yY2VEaXIuY2xvbmUoKTtcbiAgICB9XG5cbiAgICBpZihncmF2aXR5RGlyLmxlbmd0aCgpID09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgYSA9IGdyYXZpdHlEaXIuY2xvbmUoKS5tdWx0aXBseVNjYWxhcigtMSk7XG5cbiAgICB2YXIgZGlmZiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbVVuaXRWZWN0b3JzKFxuICAgICAgbmV3IFRIUkVFLlZlY3RvcjMoMCwgMSwgMCkuYXBwbHlRdWF0ZXJuaW9uKGNhbWVyYVF1YXQpLFxuICAgICAgYVxuICAgICk7XG5cbiAgICBjYW1lcmFRdWF0Lm11bHRpcGx5UXVhdGVybmlvbnMoZGlmZiwgY2FtZXJhUXVhdCk7XG4gICAgY2FtZXJhUXVhdEZpbmFsID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5tdWx0aXBseVF1YXRlcm5pb25zKFxuICAgICAgY2FtZXJhUXVhdCxcbiAgICAgIGNhbWVyYVRpbHQpO1xuXG4gICAgcXVhdGVybmlvbi5zbGVycChjYW1lcmFRdWF0RmluYWwsIDAuMSk7XG5cbiAgICBsYXN0R3Jhdml0eSA9IGdyYXZpdHlEaXI7XG5cbiAgICB1cGRhdGVDYW1lcmEoKTtcbiAgfTtcblxuICBmdW5jdGlvbiB1cGRhdGVDYW1lcmEoKSB7XG4gICAgdmFyIGRpZmYgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAxKVxuICAgICAgLmFwcGx5UXVhdGVybmlvbihxdWF0ZXJuaW9uKVxuICAgICAgLnNldExlbmd0aChkaXN0YW5jZSk7XG4gICAgdmFyIHBvcyA9IHRhcmdldC5jbG9uZSgpXG4gICAgICAuYWRkKGRpZmYpO1xuICAgIGNhbWVyYS5wb3NpdGlvbi5jb3B5KHBvcyk7XG5cbiAgICB2YXIgdXAgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAxLCAwKS5hcHBseVF1YXRlcm5pb24ocXVhdGVybmlvbik7XG4gICAgY2FtZXJhLnVwLmNvcHkodXApO1xuICAgIGNhbWVyYS5sb29rQXQodGFyZ2V0KTtcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIHRpY2s6IHRpY2tcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzLiRpbmplY3QgPSBbJ2FwcCddOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob2JqZWN0LCBhcHAsIGlucHV0LCBjYW1lcmEpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgdmFyIGNoYXJhY3RlciA9IG51bGw7XG5cbiAgdmFyIGxhc3RHcmF2aXR5ID0gbnVsbDtcblxuICB2YXIgcmlnaWRCb2R5ID0gbnVsbDtcblxuICBmdW5jdGlvbiB0aWNrKCkge1xuICAgIHZhciBmb3J3YXJkQW1vdW50ID0gMDtcbiAgICBpZiAoaW5wdXQua2V5SG9sZCgndycpKSBmb3J3YXJkQW1vdW50ICs9IDE7XG4gICAgaWYgKGlucHV0LmtleUhvbGQoJ3MnKSkgZm9yd2FyZEFtb3VudCAtPSAxO1xuXG4gICAgdmFyIHJpZ2h0QW1vdW50ID0gMDtcbiAgICBpZiAoaW5wdXQua2V5SG9sZCgnZCcpKSByaWdodEFtb3VudCArPSAxO1xuICAgIGlmIChpbnB1dC5rZXlIb2xkKCdhJykpIHJpZ2h0QW1vdW50IC09IDE7XG5cbiAgICB2YXIgZ3Jhdml0eSA9IHJpZ2lkQm9keS5ncmF2aXR5O1xuXG4gICAgaWYoZ3Jhdml0eSAhPSBudWxsKSB7XG4gICAgICB2YXIgbm9ybWFsID0gZ3Jhdml0eS5kaXIuY2xvbmUoKS5tdWx0aXBseVNjYWxhcigtMSk7XG5cbiAgICAgIHZhciB1cCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDEsIDApLmFwcGx5UXVhdGVybmlvbihjYW1lcmEucXVhdGVybmlvbik7XG4gICAgICB2YXIgcmlnaHQgPSBuZXcgVEhSRUUuVmVjdG9yMygxLCAwLCAwKS5hcHBseVF1YXRlcm5pb24oY2FtZXJhLnF1YXRlcm5pb24pO1xuXG4gICAgICB2YXIgbW92ZSA9IHVwLm11bHRpcGx5U2NhbGFyKGZvcndhcmRBbW91bnQpLmFkZChyaWdodC5tdWx0aXBseVNjYWxhcihyaWdodEFtb3VudCkpO1xuICAgICAgbW92ZS5wcm9qZWN0T25QbGFuZShub3JtYWwpO1xuICAgICAgbW92ZS5zZXRMZW5ndGgoMSk7XG5cbiAgICAgIGNoYXJhY3Rlci5tb3ZlKG1vdmUsIDEpO1xuXG4gICAgICBpZiAoaW5wdXQua2V5RG93bignc3BhY2UnKSkge1xuICAgICAgICBjaGFyYWN0ZXIuanVtcCgpO1xuICAgICAgfSAgXG4gICAgfVxuICB9O1xuXG4gIHJldHVybiB7XG4gICAgdHlwZTogJ3BsYXllckNvbnRyb2wnLFxuICAgIHRpY2s6IHRpY2ssXG4gICAgc2V0IGNoYXJhY3Rlcih2YWx1ZSkge1xuICAgICAgY2hhcmFjdGVyID0gdmFsdWU7XG4gICAgfSxcbiAgICBzZXQgcmlnaWRCb2R5KHZhbHVlKSB7XG4gICAgICByaWdpZEJvZHkgPSB2YWx1ZVxuICAgIH1cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMuJGluamVjdCA9IFsnYXBwJywgJ2lucHV0JywgJ2NhbWVyYSddOyIsInZhciBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydUSFJFRSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnVEhSRUUnXSA6IG51bGwpO1xuXG52YXIgUmlnaWRCb2R5ID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gIHRoaXMub2JqZWN0ID0gb2JqZWN0O1xuICBcbiAgdGhpcy52ZWxvY2l0eSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gIFxuICB0aGlzLmFjY2VsZXJhdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gIFxuICB0aGlzLnR5cGUgPSAncmlnaWRCb2R5JztcbiAgXG4gIHRoaXMuZnJpY3Rpb24gPSAwLjk4O1xuXG4gIC8vIDAgbWFzcyBtZWFucyBpbW1vdmFibGVcbiAgdGhpcy5tYXNzID0gMDtcbiAgXG4gIHRoaXMuZ3Jhdml0eSA9IG51bGw7XG5cbiAgdGhpcy5jb2xsaXNpb25PYmplY3QgPSBudWxsO1xufTtcblxuUmlnaWRCb2R5LnByb3RvdHlwZS5hcHBseUZvcmNlID0gZnVuY3Rpb24oZm9yY2UpIHtcbiAgdGhpcy5hY2NlbGVyYXRpb24uYWRkKGZvcmNlLmNsb25lKCkubXVsdGlwbHlTY2FsYXIoMSAvIHRoaXMubWFzcykpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSaWdpZEJvZHk7IiwidmFyIGV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuXG4gIGZ1bmN0aW9uIGd1aWQoKSB7XG4gICAgZnVuY3Rpb24gczQoKSB7XG4gICAgICByZXR1cm4gTWF0aC5mbG9vcigoMSArIE1hdGgucmFuZG9tKCkpICogMHgxMDAwMClcbiAgICAgICAgLnRvU3RyaW5nKDE2KVxuICAgICAgICAuc3Vic3RyaW5nKDEpO1xuICAgIH1cbiAgICByZXR1cm4gczQoKSArIHM0KCkgKyAnLScgKyBzNCgpICsgJy0nICsgczQoKSArICctJyArXG4gICAgICBzNCgpICsgJy0nICsgczQoKSArIHM0KCkgKyBzNCgpO1xuICB9XG5cbiAgdmFyIGFwcCA9IHt9O1xuICB2YXIgbWFwID0ge307XG4gIHZhciBmcmFtZVJhdGUgPSA0OC4wO1xuICB2YXIgc3lzdGVtcyA9IFtdO1xuICB2YXIgYmluZGluZ3MgPSB7fTtcblxuICBmdW5jdGlvbiBhdHRhY2gob2JqZWN0LCBmYWN0b3J5KSB7XG4gICAgdmFyIGFyZ3MgPSBbb2JqZWN0XTtcbiAgICBpZiAoZmFjdG9yeS4kaW5qZWN0ICE9IG51bGwpIHtcbiAgICAgIGZhY3RvcnkuJGluamVjdC5mb3JFYWNoKGZ1bmN0aW9uKGRlcCkge1xuICAgICAgICBhcmdzLnB1c2gocmVzb2x2ZShkZXApKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBjb21wb25lbnQgPSBuZXcoRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQuYXBwbHkoZmFjdG9yeSwgW251bGxdLmNvbmNhdChhcmdzKSkpO1xuXG4gICAgaWYgKGNvbXBvbmVudCAhPSBudWxsKSB7XG4gICAgICBjb21wb25lbnQub2JqZWN0ID0gb2JqZWN0O1xuICAgICAgaWYgKG9iamVjdC5faWQgPT0gbnVsbCkgb2JqZWN0Ll9pZCA9IGd1aWQoKTtcbiAgICAgIGlmIChjb21wb25lbnQuX2lkID09IG51bGwpIGNvbXBvbmVudC5faWQgPSBndWlkKCk7XG4gICAgICB2YXIgY29tcG9uZW50cyA9IG1hcFtvYmplY3QuX2lkXTtcbiAgICAgIGlmIChjb21wb25lbnRzID09IG51bGwpIGNvbXBvbmVudHMgPSBtYXBbb2JqZWN0Ll9pZF0gPSB7fTtcbiAgICAgIGNvbXBvbmVudHNbY29tcG9uZW50Ll9pZF0gPSBjb21wb25lbnQ7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3lzdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc3lzdGVtID0gc3lzdGVtc1tpXTtcbiAgICAgICAgaWYgKHN5c3RlbS5vbkF0dGFjaCAhPSBudWxsKSBzeXN0ZW0ub25BdHRhY2gob2JqZWN0LCBjb21wb25lbnQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb21wb25lbnQ7XG4gIH07XG5cbiAgZnVuY3Rpb24gdXNlKHR5cGUsIHN5c3RlbSkge1xuICAgIHZhciBoYXNUeXBlID0gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnO1xuICAgIGlmICghaGFzVHlwZSkge1xuICAgICAgc3lzdGVtID0gdHlwZTtcbiAgICB9XG5cbiAgICBpZiAoc3lzdGVtICE9IG51bGwpIHtcbiAgICAgIHN5c3RlbXMucHVzaChzeXN0ZW0pO1xuICAgICAgaWYgKGhhc1R5cGUpIHtcbiAgICAgICAgdmFsdWUodHlwZSwgc3lzdGVtKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc3lzdGVtO1xuICB9O1xuXG4gIGZ1bmN0aW9uIHRpY2soKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzeXN0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgc3lzdGVtID0gc3lzdGVtc1tpXTtcbiAgICAgIGlmIChzeXN0ZW0udGljayAhPSBudWxsKSBzeXN0ZW0udGljaygpO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgaW4gbWFwKSB7XG4gICAgICB2YXIgY29tcG9uZW50cyA9IG1hcFtpXTtcbiAgICAgIGZvciAodmFyIGogaW4gY29tcG9uZW50cykge1xuICAgICAgICB2YXIgY29tcG9uZW50ID0gY29tcG9uZW50c1tqXTtcbiAgICAgICAgaWYgKGNvbXBvbmVudC50aWNrICE9IG51bGwpIGNvbXBvbmVudC50aWNrKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzeXN0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgc3lzdGVtID0gc3lzdGVtc1tpXTtcbiAgICAgIGlmIChzeXN0ZW0ubGF0ZVRpY2sgIT0gbnVsbCkgc3lzdGVtLmxhdGVUaWNrKCk7XG4gICAgfVxuICAgIHNldFRpbWVvdXQodGljaywgMTAwMCAvIGZyYW1lUmF0ZSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gc3RhcnQoKSB7XG4gICAgLy8gU3RhcnQgbG9vcFxuICAgIHRpY2soKTtcbiAgfTtcblxuICBmdW5jdGlvbiB2YWx1ZSh0eXBlLCBvYmplY3QpIHtcbiAgICBiaW5kaW5nc1t0eXBlXSA9IHtcbiAgICAgIHZhbHVlOiBvYmplY3RcbiAgICB9O1xuICB9O1xuXG4gIGZ1bmN0aW9uIHJlc29sdmUodHlwZSkge1xuICAgIHZhciBiaW5kaW5nID0gYmluZGluZ3NbdHlwZV07XG4gICAgaWYgKGJpbmRpbmcgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdiaW5kaW5nIGZvciB0eXBlICcgKyB0eXBlICsgJyBub3QgZm91bmQnKTtcbiAgICB9XG4gICAgaWYgKGJpbmRpbmcudmFsdWUgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGJpbmRpbmcudmFsdWU7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0Q29tcG9uZW50KG9iamVjdCwgdHlwZSkge1xuICAgIHZhciBjb21wb25lbnRzID0gbWFwW29iamVjdC5faWRdO1xuICAgIGZvciAodmFyIGlkIGluIGNvbXBvbmVudHMpIHtcbiAgICAgIGlmIChjb21wb25lbnRzW2lkXS50eXBlID09PSB0eXBlKSB7XG4gICAgICAgIHJldHVybiBjb21wb25lbnRzW2lkXTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgdmFyIGVudGl0eUJpbmRpbmdzID0ge307XG4gIHZhciBlbnRpdHlJZENvdW50ID0gMDtcbiAgdmFyIGVudGl0aWVzID0ge307XG5cbiAgZnVuY3Rpb24gbG9hZEFzc2VtYmx5KGFzc2VtYmx5KSB7XG4gICAgcmV0dXJuIGFzc2VtYmx5KHRoaXMpO1xuICB9O1xuXG4gIHZhciBjb21wb25lbnRCaW5kaW5ncyA9IHt9O1xuXG4gIGZ1bmN0aW9uIHJlZ2lzdGVyQ29tcG9uZW50KHR5cGUsIGNvbnN0cnVjdG9yKSB7XG4gICAgY29tcG9uZW50QmluZGluZ3NbdHlwZV0gPSBjb25zdHJ1Y3RvcjtcbiAgfTtcblxuICBmdW5jdGlvbiBjcmVhdGVDb21wb25lbnQodHlwZSkge1xuICAgIHZhciBjb25zdHJ1Y3RvciA9IGNvbXBvbmVudEJpbmRpbmdzW3R5cGVdO1xuICAgIGlmIChjb25zdHJ1Y3RvciA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2JpbmRpbmcgbm90IGZvdW5kIGZvciB0eXBlOiAnICsgdHlwZSk7XG4gICAgfVxuICAgIHZhciBjb21wb25lbnQgPSBuZXcgY29uc3RydWN0b3IoKTtcbiAgICBjb21wb25lbnQuYXBwID0gdGhpcztcbiAgfTtcblxuICB2YXIgYXBwID0ge1xuICAgIHN0YXJ0OiBzdGFydCxcbiAgICB1c2U6IHVzZSxcbiAgICBhdHRhY2g6IGF0dGFjaCxcbiAgICB2YWx1ZTogdmFsdWUsXG4gICAgZ2V0Q29tcG9uZW50OiBnZXRDb21wb25lbnQsXG4gICAgbG9hZEFzc2VtYmx5OiBsb2FkQXNzZW1ibHksXG4gICAgZ2V0OiByZXNvbHZlLFxuICAgIHJlZ2lzdGVyQ29tcG9uZW50OiByZWdpc3RlckNvbXBvbmVudCxcbiAgICBjcmVhdGVDb21wb25lbnQ6IGNyZWF0ZUNvbXBvbmVudFxuICB9O1xuXG4gIGV2ZW50cy5wcm90b3R5cGUuYXBwbHkoYXBwKTtcblxuICByZXR1cm4gYXBwO1xufTsiLCJ2YXIgRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2xpc3RlbmVycyA9IHt9O1xufTtcblxuRXZlbnRzLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXG4gIHZhciBjYWxsYmFja3MgPSB0aGlzLl9saXN0ZW5lcnNbZXZlbnRdO1xuICBpZiAoY2FsbGJhY2tzID09IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgY2FsbGJhY2sgPSBjYWxsYmFja3NbaV07XG4gICAgY2FsbGJhY2suYXBwbHkobnVsbCwgYXJncyk7XG4gIH1cbn07XG5cbkV2ZW50cy5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldmVudCwgY2FsbGJhY2spIHtcbiAgdmFyIGNhbGxiYWNrcyA9IHRoaXMuX2xpc3RlbmVyc1tldmVudF07XG4gIGlmIChjYWxsYmFja3MgPT0gbnVsbCkge1xuICAgIGNhbGxiYWNrcyA9IHRoaXMuX2xpc3RlbmVyc1tldmVudF0gPSBbXTtcbiAgfVxuICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG59O1xuXG5FdmVudHMucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKGV2ZW50LCBjYWxsYmFjaykge1xuICB2YXIgY2FsbGJhY2tzID0gdGhpcy5fbGlzdGVuZXJzW2V2ZW50XTtcbiAgaWYgKGNhbGxiYWNrcyA9PSBudWxsKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGFycmF5VXRpbHMucmVtb3ZlKGNhbGxiYWNrcywgY2FsbGJhY2spO1xufTtcblxuRXZlbnRzLnByb3RvdHlwZS5hcHBseSA9IGZ1bmN0aW9uKG9iaikge1xuICBvYmouZW1pdCA9IHRoaXMuZW1pdDtcbiAgb2JqLm9uID0gdGhpcy5vbjtcbiAgb2JqLm9mZiA9IHRoaXMub2ZmO1xuICBvYmouX2xpc3RlbmVycyA9IHt9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudHM7IiwibW9kdWxlLmV4cG9ydHM9e1xuXHRcImVkaXRvcl9ncm91bmRfc2l6ZVwiOiAzMlxufSIsInZhciBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydUSFJFRSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnVEhSRUUnXSA6IG51bGwpO1xudmFyIGIgPSByZXF1aXJlKCcuL2NvcmUvYicpO1xuXG52YXIgYXBwID0gYigpO1xuXG52YXIgc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKTtcbnZhciBjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoNjAsIHdpbmRvdy5pbm5lcldpZHRoIC8gd2luZG93LmlubmVySGVpZ2h0LCAwLjEsIDEwMDApO1xuXG4vLyBSZWdzaXRlciB2YWx1ZXNcbmFwcC52YWx1ZSgnYXBwJywgYXBwKTtcbmFwcC52YWx1ZSgnc2NlbmUnLCBzY2VuZSk7XG5hcHAudmFsdWUoJ2NhbWVyYScsIGNhbWVyYSk7XG5hcHAudmFsdWUoJ2NvbmZpZycsIHJlcXVpcmUoJy4vZGF0YS9jb25maWcuanNvbicpKTtcblxudmFyIHRleHR1cmVzID0gW1xuICBUSFJFRS5JbWFnZVV0aWxzLmxvYWRUZXh0dXJlKCdpbWFnZXMvMS5wbmcnKSxcbiAgVEhSRUUuSW1hZ2VVdGlscy5sb2FkVGV4dHVyZSgnaW1hZ2VzLzIucG5nJyksXG4gIFRIUkVFLkltYWdlVXRpbHMubG9hZFRleHR1cmUoJ2ltYWdlcy85OC5wbmcnKSxcbiAgVEhSRUUuSW1hZ2VVdGlscy5sb2FkVGV4dHVyZSgnaW1hZ2VzLzk5LnBuZycpXG5dO1xuXG52YXIgbWF0ZXJpYWxzID0gW107XG5cbmZvciAodmFyIGkgPSAwOyBpIDwgdGV4dHVyZXMubGVuZ3RoOyBpKyspIHtcbiAgdmFyIHRleHR1cmUgPSB0ZXh0dXJlc1tpXTtcbiAgdGV4dHVyZS53cmFwUyA9IFRIUkVFLlJlcGVhdFdyYXBwaW5nO1xuICB0ZXh0dXJlLndyYXBUID0gVEhSRUUuUmVwZWF0V3JhcHBpbmc7XG4gIG1hdGVyaWFscy5wdXNoKG5ldyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsKHtcbiAgICBtYXA6IHRleHR1cmVcbiAgfSkpO1xufVxuXG5hcHAudmFsdWUoJ3RleHR1cmVzJywgdGV4dHVyZXMpO1xuYXBwLnZhbHVlKCdtYXRlcmlhbHMnLCBtYXRlcmlhbHMpO1xuXG52YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbnRhaW5lcicpO1xuYXBwLnVzZShyZXF1aXJlKCcuL3N5c3RlbXMvcmVuZGVyZXInKShzY2VuZSwgY2FtZXJhLCBjb250YWluZXIpKTtcbmFwcC51c2UoJ2lucHV0JywgcmVxdWlyZSgnLi9zeXN0ZW1zL2lucHV0JykoY29udGFpbmVyKSk7XG5hcHAudXNlKHJlcXVpcmUoJy4vdm94ZWwvdm94ZWwnKSgpKTtcbnZhciBkZXZDb25zb2xlID0gcmVxdWlyZSgnLi9zeXN0ZW1zL2RldmNvbnNvbGUnKSh7XG4gIG9uYmx1cjogZnVuY3Rpb24oKSB7XG4gICAgY29udGFpbmVyLmZvY3VzKCk7XG4gIH1cbn0pO1xuYXBwLnVzZSgnZGV2Q29uc29sZScsIGRldkNvbnNvbGUpO1xuXG4vLyBBdHRhY2ggY2FtZXJhIGNvbnRyb2xcbmZ1bmN0aW9uIGxvYWRHYW1lKCkge1xuICBhcHAuYXR0YWNoKGNhbWVyYSwgcmVxdWlyZSgnLi9jb21wb25lbnRzL3BsYXllckNhbWVyYScpKTtcblxuICBhcHAubG9hZEFzc2VtYmx5KHJlcXVpcmUoJy4vYXNzZW1ibGllcy9hZ3JvdW5kJykpO1xuXG4gIHZhciBwbGF5ZXIgPSBhcHAubG9hZEFzc2VtYmx5KHJlcXVpcmUoJy4vYXNzZW1ibGllcy9hcGxheWVyJykpO1xuICBhcHAudmFsdWUoJ3BsYXllcicsIHBsYXllcik7XG59O1xuXG5mdW5jdGlvbiBsb2FkRWRpdG9yKCkge1xuICBhcHAuYXR0YWNoKGNhbWVyYSwgcmVxdWlyZSgnLi9jb21wb25lbnRzL2RyYWdjYW1lcmEnKSk7XG4gIGFwcC5sb2FkQXNzZW1ibHkocmVxdWlyZSgnLi9hc3NlbWJsaWVzL2FlZGl0b3InKSk7XG59XG5cbmxvYWRFZGl0b3IoKTtcblxuYXBwLnN0YXJ0KCk7IiwidmFyIHBhcnNlQXJncyA9IHJlcXVpcmUoJ21pbmltaXN0Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0cykge1xuICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgdmFyIG9uZm9jdXMgPSBvcHRzLm9uZm9jdXMgfHwgbnVsbDtcbiAgdmFyIG9uYmx1ciA9IG9wdHMub25ibHVyIHx8IG51bGw7XG4gIHZhciBjb21tYW5kcyA9IG9wdHMuY29tbWFuZHMgfHwge307XG5cbiAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGRpdik7XG4gIGRpdi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIGRpdi5zdHlsZS5sZWZ0ID0gJzBweCc7XG4gIGRpdi5zdHlsZS50b3AgPSAnMHB4JztcbiAgZGl2LnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICBkaXYuc3R5bGUuaGVpZ2h0ID0gJzEyMHB4JztcbiAgZGl2LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICdyZ2JhKDAsIDAsIDAsIDAuNSknO1xuXG4gIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIGlucHV0LnR5cGUgPSAndGV4dCc7XG4gIGlucHV0LmNsYXNzTmFtZSA9ICdjb25zb2xlLWlucHV0JztcbiAgaW5wdXQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICBpbnB1dC5zdHlsZS5sZWZ0ID0gJzBweCc7XG4gIGlucHV0LnN0eWxlLnRvcCA9ICcwcHgnO1xuICBpbnB1dC5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgaW5wdXQuc3R5bGUuaGVpZ2h0ID0gJzIwcHgnO1xuICBpbnB1dC5zdHlsZVsnYmFja2dyb3VuZC1jb2xvciddID0gJ3RyYW5zcGFyZW50JztcbiAgaW5wdXQuc3R5bGVbJ2JvcmRlciddID0gJzBweCBzb2xpZCc7XG4gIGlucHV0LnNwZWxsY2hlY2sgPSBmYWxzZTtcbiAgaW5wdXQuc3R5bGUuY29sb3IgPSAnI0ZGRkZGRic7XG4gIGlucHV0LnN0eWxlLmZvbnRTaXplID0gJzE2cHgnO1xuICBpbnB1dC5zdHlsZS5mb250RmFtaWx5ID0gJ0FyaWFsJztcbiAgaW5wdXQuc3R5bGUucGFkZGluZyA9ICcycHggMnB4IDBweCAycHgnO1xuICBpbnB1dC52YWx1ZSA9ICc+ICc7XG5cbiAgZGl2LmFwcGVuZENoaWxkKGlucHV0KTtcblxuICB2YXIgdGV4dFNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gIHRleHRTcGFuLmNsYXNzTmFtZSA9ICdjb25zb2xlLXNwYW4nO1xuICB0ZXh0U3Bhbi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIHRleHRTcGFuLnN0eWxlLmxlZnQgPSAnMHB4JztcbiAgdGV4dFNwYW4uc3R5bGUudG9wID0gJzIwcHgnO1xuICB0ZXh0U3Bhbi5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgdGV4dFNwYW4uc3R5bGUuaGVpZ2h0ID0gJzEwMHB4JztcbiAgdGV4dFNwYW4uc3R5bGUuY29sb3IgPSAnI0ZGRkZGRic7XG4gIHRleHRTcGFuLnN0eWxlLmZvbnRTaXplID0gJzE2cHgnO1xuICB0ZXh0U3Bhbi5zdHlsZS5mb250RmFtaWx5ID0gJ0FyaWFsJztcbiAgdGV4dFNwYW4uc3R5bGUucGFkZGluZyA9ICcwcHggMnB4IDJweCAycHgnO1xuXG4gIGRpdi5hcHBlbmRDaGlsZCh0ZXh0U3Bhbik7XG5cbiAgLy8gUmVtb3ZlIG91dGxpbmUgb24gZm9jdXNcbiAgaW5wdXQub25mb2N1cyA9IGZ1bmN0aW9uKCkge1xuICAgIGlucHV0LnN0eWxlWydvdXRsaW5lJ10gPSAnbm9uZSc7XG4gIH07XG5cbiAgaW5wdXQub25rZXlwcmVzcyA9IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgb25FbnRlclByZXNzZWQoKTtcbiAgICB9XG4gICAgb25JbnB1dENoYW5nZWQoZSk7XG4gIH07XG5cbiAgaW5wdXQub25rZXl1cCA9IGZ1bmN0aW9uKGUpIHtcbiAgICBvbklucHV0Q2hhbmdlZChlKTtcbiAgfTtcblxuICBmdW5jdGlvbiBvbklucHV0Q2hhbmdlZChlKSB7XG4gICAgaWYgKGlucHV0LnZhbHVlLmxlbmd0aCA8IDIpIHtcbiAgICAgIGlucHV0LnZhbHVlID0gJz4gJztcbiAgICB9XG4gIH07XG5cbiAgdmFyIGxpbmVzID0gW107XG4gIHZhciBoaXN0b3J5TGVuZ3RoID0gMTAwO1xuICB2YXIgbnVtYmVyT2ZMaW5lcyA9IDU7XG5cbiAgZnVuY3Rpb24gb25FbnRlclByZXNzZWQoKSB7XG4gICAgdmFyIGxpbmUgPSBpbnB1dC52YWx1ZTtcbiAgICBhZGRMb2cobGluZSk7XG4gICAgbGluZSA9IGxpbmUuc3Vic3RyaW5nKDIpO1xuICAgIGxpbmUgPSBsaW5lLnRyaW0oKTtcbiAgICB2YXIgaW5kZXggPSBsaW5lLmluZGV4T2YoJyAnKTtcbiAgICB2YXIgY29tbWFuZE5hbWUgPSBpbmRleCA9PT0gLTEgPyBsaW5lIDogbGluZS5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuICAgIHZhciBhcmdzID0gaW5kZXggPT09IC0xID8gJycgOiBsaW5lLnN1YnN0cmluZyhpbmRleCArIDEpO1xuXG4gICAgdmFyIGNvbW1hbmQgPSBjb21tYW5kc1tjb21tYW5kTmFtZV07XG4gICAgaWYgKGNvbW1hbmQgPT0gbnVsbCkge1xuICAgICAgYWRkRXJyb3IoY29tbWFuZE5hbWUgKyAnOiBjb21tYW5kIG5vdCBmb3VuZCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgcmVzdWx0ID0gY29tbWFuZChwYXJzZUFyZ3MoYXJncy5zcGxpdCgnICcpKSk7XG4gICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgYWRkTG9nKHJlc3VsdCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaW5wdXQudmFsdWUgPSAnJztcblxuICAgIGhpZGUoKTtcbiAgfTtcblxuICBmdW5jdGlvbiBhZGRMb2cobGluZSkge1xuICAgIGFkZExpbmUobGluZSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gYWRkRXJyb3IobGluZSkge1xuICAgIGFkZExpbmUobGluZSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gYWRkTGluZShsaW5lKSB7XG4gICAgbGluZXMucHVzaChsaW5lKTtcbiAgICBpZiAobGluZXMubGVuZ3RoID4gaGlzdG9yeUxlbmd0aCkge1xuICAgICAgbGluZXMucG9wKCk7XG4gICAgfVxuICAgIHVwZGF0ZUxpbmVzKCk7XG4gIH07XG5cbiAgZnVuY3Rpb24gdXBkYXRlTGluZXMoKSB7XG4gICAgdmFyIHRleHQgPSAnJztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bWJlck9mTGluZXM7IGkrKykge1xuICAgICAgdmFyIGxpbmUgPSBsaW5lc1tsaW5lcy5sZW5ndGggLSAxIC0gaV07XG4gICAgICBsaW5lID0gbGluZSB8fCAnJztcbiAgICAgIHRleHQgKz0gbGluZTtcbiAgICAgIHRleHQgKz0gXCI8YnIgLz5cIjtcbiAgICB9XG5cbiAgICB0ZXh0U3Bhbi5pbm5lckhUTUwgPSB0ZXh0O1xuICB9O1xuXG4gIGZ1bmN0aW9uIGhpZGUoKSB7XG4gICAgZGl2LmhpZGRlbiA9IHRydWU7XG4gICAgaW5wdXQuYmx1cigpO1xuICAgIGlmIChvbmJsdXIgIT0gbnVsbCkge1xuICAgICAgb25ibHVyKCk7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIHNob3coKSB7XG4gICAgZGl2LmhpZGRlbiA9IGZhbHNlO1xuICAgIGlucHV0LnZhbHVlID0gaW5wdXQudmFsdWUuc3BsaXQoJ2AnKS5qb2luKCcnKTtcbiAgICBpbnB1dC5mb2N1cygpO1xuICAgIGlmIChvbmZvY3VzICE9IG51bGwpIHtcbiAgICAgIG9uZm9jdXMoKTtcbiAgICB9XG4gIH07XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDE5Mikge1xuICAgICAgaWYgKGRpdi5oaWRkZW4pIHtcbiAgICAgICAgc2hvdygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaGlkZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgLy8gSGlkZGVuIGJ5IGRlZmF1bHRcbiAgZGl2LmhpZGRlbiA9IHRydWU7XG5cbiAgcmV0dXJuIHtcbiAgICBjb21tYW5kczogY29tbWFuZHNcbiAgfTtcbn07IiwidmFyIGFycmF5VXRpbHMgPSByZXF1aXJlKCcuLi91dGlscy9hcnJheXV0aWxzJyk7XG52YXIga2V5Y29kZSA9IHJlcXVpcmUoJ2tleWNvZGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gIFwidXNlIHN0cmljdFwiO1xuXG4gIHZhciBtb3VzZSA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gIHZhciBtb3VzZWRvd25zID0gW107XG4gIHZhciBtb3VzZXVwcyA9IFtdO1xuICB2YXIgbW91c2Vtb3ZlID0gZmFsc2U7XG4gIHZhciBtb3VzZWhvbGRzID0gW107XG4gIHZhciBrZXlkb3ducyA9IFtdO1xuICB2YXIga2V5dXBzID0gW107XG4gIHZhciBrZXlob2xkcyA9IFtdO1xuICB2YXIgbW91c2Vkb3duVGltZXMgPSB7fTtcbiAgdmFyIGNsaWNrVGltZSA9IDE1MDtcbiAgdmFyIG1vdXNlY2xpY2tzID0gW107XG5cbiAgZWxlbWVudC5mb2N1cygpO1xuXG4gIGZ1bmN0aW9uIG9uTW91c2VNb3ZlKGUpIHtcbiAgICBtb3VzZW1vdmUgPSB0cnVlO1xuICAgIG1vdXNlLnggPSAoZS5jbGllbnRYIC8gd2luZG93LmlubmVyV2lkdGgpICogMiAtIDE7XG4gICAgbW91c2UueSA9IC0oZS5jbGllbnRZIC8gd2luZG93LmlubmVySGVpZ2h0KSAqIDIgKyAxO1xuICB9O1xuXG4gIGZ1bmN0aW9uIG9uTW91c2VEb3duKGUpIHtcbiAgICBtb3VzZWRvd25zLnB1c2goZS5idXR0b24pO1xuICAgIG1vdXNlZG93blRpbWVzW2UuYnV0dG9uXSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIGlmICghYXJyYXlVdGlscy5pbmNsdWRlcyhtb3VzZWhvbGRzLCBlLmJ1dHRvbikpIHtcbiAgICAgIG1vdXNlaG9sZHMucHVzaChlLmJ1dHRvbik7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIG9uTW91c2VVcChlKSB7XG4gICAgaWYgKCEhbW91c2Vkb3duVGltZXNbZS5idXR0b25dKSB7XG4gICAgICB2YXIgZGlmZiA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gbW91c2Vkb3duVGltZXNbZS5idXR0b25dO1xuICAgICAgaWYgKGRpZmYgPCBjbGlja1RpbWUpIHtcbiAgICAgICAgbW91c2VjbGlja3MucHVzaChlLmJ1dHRvbik7XG4gICAgICB9XG4gICAgfVxuICAgIG1vdXNldXBzLnB1c2goZS5idXR0b24pO1xuICAgIGFycmF5VXRpbHMucmVtb3ZlKG1vdXNlaG9sZHMsIGUuYnV0dG9uKTtcbiAgfTtcblxuICBmdW5jdGlvbiBvbktleURvd24oZSkge1xuICAgIHZhciBrZXkgPSBrZXljb2RlKGUpO1xuICAgIGtleWRvd25zLnB1c2goa2V5KTtcbiAgICBpZiAoIWFycmF5VXRpbHMuaW5jbHVkZXMoa2V5aG9sZHMsIGtleSkpIHtcbiAgICAgIGtleWhvbGRzLnB1c2goa2V5KTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gb25LZXlVcChlKSB7XG4gICAgdmFyIGtleSA9IGtleWNvZGUoZSk7XG4gICAga2V5dXBzLnB1c2goa2V5KTtcbiAgICBhcnJheVV0aWxzLnJlbW92ZShrZXlob2xkcywga2V5KTtcbiAgfTtcblxuICBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICBtb3VzZWRvd25zID0gW107XG4gICAgbW91c2V1cHMgPSBbXTtcbiAgICBtb3VzZW1vdmUgPSBmYWxzZTtcbiAgICBrZXlkb3ducyA9IFtdO1xuICAgIGtleXVwcyA9IFtdO1xuICAgIG1vdXNlY2xpY2tzID0gW107XG4gIH1cblxuICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIG9uTW91c2VEb3duKTtcbiAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSk7XG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIG9uTW91c2VVcCk7XG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9uS2V5RG93bik7XG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBvbktleVVwKTtcblxuICByZXR1cm4ge1xuICAgIG1vdXNlOiBtb3VzZSxcblxuICAgIG1vdXNlRG93bjogZnVuY3Rpb24oYnV0dG9uKSB7XG4gICAgICByZXR1cm4gYXJyYXlVdGlscy5pbmNsdWRlcyhtb3VzZWRvd25zLCBidXR0b24pO1xuICAgIH0sXG5cbiAgICBtb3VzZVVwOiBmdW5jdGlvbihidXR0b24pIHtcbiAgICAgIHJldHVybiBhcnJheVV0aWxzLmluY2x1ZGVzKG1vdXNldXBzLCBidXR0b24pO1xuICAgIH0sXG5cbiAgICBtb3VzZUhvbGQ6IGZ1bmN0aW9uKGJ1dHRvbikge1xuICAgICAgcmV0dXJuIGFycmF5VXRpbHMuaW5jbHVkZXMobW91c2Vob2xkcywgYnV0dG9uKTtcbiAgICB9LFxuXG4gICAgbW91c2VDbGljazogZnVuY3Rpb24oYnV0dG9uKSB7XG4gICAgICByZXR1cm4gYXJyYXlVdGlscy5pbmNsdWRlcyhtb3VzZWNsaWNrcywgYnV0dG9uKTtcbiAgICB9LFxuXG4gICAga2V5RG93bjogZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gYXJyYXlVdGlscy5pbmNsdWRlcyhrZXlkb3ducywga2V5KTtcbiAgICB9LFxuXG4gICAga2V5VXA6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGFycmF5VXRpbHMuaW5jbHVkZXMoa2V5dXBzLCBrZXkpO1xuICAgIH0sXG5cbiAgICBrZXlIb2xkOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBhcnJheVV0aWxzLmluY2x1ZGVzKGtleWhvbGRzLCBrZXkpO1xuICAgIH0sXG5cbiAgICBnZXQgbW91c2VNb3ZlKCkge1xuICAgICAgcmV0dXJuIG1vdXNlbW92ZTtcbiAgICB9LFxuXG4gICAgbGF0ZVRpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgY2xlYXIoKTtcbiAgICB9XG4gIH07XG59OyIsInZhciBTdGF0cyA9IHJlcXVpcmUoJ3N0YXRzLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2NlbmUsIGNhbWVyYSwgY29udGFpbmVyKSB7XG4gIHZhciByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKCk7XG4gIHJlbmRlcmVyLnNldENsZWFyQ29sb3IoMHhmNmY2ZjYpO1xuICByZW5kZXJlci5zZXRTaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpO1xuXG4gIGNvbnRhaW5lciA9IGNvbnRhaW5lciB8fCBkb2N1bWVudC5ib2R5O1xuICBjb250YWluZXIuYXBwZW5kQ2hpbGQocmVuZGVyZXIuZG9tRWxlbWVudCk7XG5cbiAgdmFyIHJlbmRlcmVyLCBjYW1lcmE7XG4gIHZhciBzc2FvUGFzcywgZWZmZWN0Q29tcG9zZXI7XG5cbiAgdmFyIHN5c3RlbSA9IHt9O1xuXG4gIHZhciBzdGF0cyA9IG5ldyBTdGF0cygpO1xuICBzdGF0cy5kb21FbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgc3RhdHMuZG9tRWxlbWVudC5zdHlsZS5yaWdodCA9ICcwcHgnO1xuICBzdGF0cy5kb21FbGVtZW50LnN0eWxlLmJvdHRvbSA9ICcwcHgnO1xuXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc3RhdHMuZG9tRWxlbWVudCk7XG5cbiAgdmFyIGFtYmllbnQgPSBuZXcgVEhSRUUuQW1iaWVudExpZ2h0KG5ldyBUSFJFRS5Db2xvcihcInJnYig0MCUsIDQwJSwgNDAlKVwiKSk7XG4gIHZhciBsaWdodCA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KDB4ZmZmZmZmLCAwLjYpO1xuICBsaWdodC5wb3NpdGlvbi5zZXQoMC44LCAxLCAwLjUpO1xuICBzY2VuZS5hZGQobGlnaHQpO1xuICBzY2VuZS5hZGQoYW1iaWVudCk7XG5cbiAgZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIpO1xuXG4gICAgc3RhdHMuYmVnaW4oKTtcblxuICAgIC8vIFJlbmRlciBkZXB0aCBpbnRvIGRlcHRoUmVuZGVyVGFyZ2V0XG4gICAgc2NlbmUub3ZlcnJpZGVNYXRlcmlhbCA9IGRlcHRoTWF0ZXJpYWw7XG4gICAgcmVuZGVyZXIucmVuZGVyKHNjZW5lLCBjYW1lcmEsIGRlcHRoUmVuZGVyVGFyZ2V0LCB0cnVlKTtcblxuICAgIC8vIFJlbmRlciByZW5kZXJQYXNzIGFuZCBTU0FPIHNoYWRlclBhc3NcbiAgICBzY2VuZS5vdmVycmlkZU1hdGVyaWFsID0gbnVsbDtcbiAgICBlZmZlY3RDb21wb3Nlci5yZW5kZXIoKTtcblxuICAgIHN0YXRzLmVuZCgpO1xuICB9O1xuXG4gIGZ1bmN0aW9uIG9uV2luZG93UmVzaXplKCkge1xuICAgIHZhciB3aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIHZhciBoZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG5cbiAgICBjYW1lcmEuYXNwZWN0ID0gd2lkdGggLyBoZWlnaHQ7XG4gICAgY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcbiAgICByZW5kZXJlci5zZXRTaXplKHdpZHRoLCBoZWlnaHQpO1xuXG4gICAgLy8gUmVzaXplIHJlbmRlclRhcmdldHNcbiAgICBzc2FvUGFzcy51bmlmb3Jtc1snc2l6ZSddLnZhbHVlLnNldCh3aWR0aCwgaGVpZ2h0KTtcblxuICAgIHZhciBwaXhlbFJhdGlvID0gcmVuZGVyZXIuZ2V0UGl4ZWxSYXRpbygpO1xuICAgIHZhciBuZXdXaWR0aCA9IE1hdGguZmxvb3Iod2lkdGggLyBwaXhlbFJhdGlvKSB8fCAxO1xuICAgIHZhciBuZXdIZWlnaHQgPSBNYXRoLmZsb29yKGhlaWdodCAvIHBpeGVsUmF0aW8pIHx8IDE7XG4gICAgZGVwdGhSZW5kZXJUYXJnZXQuc2V0U2l6ZShuZXdXaWR0aCwgbmV3SGVpZ2h0KTtcbiAgICBlZmZlY3RDb21wb3Nlci5zZXRTaXplKG5ld1dpZHRoLCBuZXdIZWlnaHQpO1xuICB9XG5cbiAgZnVuY3Rpb24gaW5pdFBvc3Rwcm9jZXNzaW5nKCkge1xuXG4gICAgLy8gU2V0dXAgcmVuZGVyIHBhc3NcbiAgICB2YXIgcmVuZGVyUGFzcyA9IG5ldyBUSFJFRS5SZW5kZXJQYXNzKHNjZW5lLCBjYW1lcmEpO1xuXG4gICAgLy8gU2V0dXAgZGVwdGggcGFzc1xuICAgIHZhciBkZXB0aFNoYWRlciA9IFRIUkVFLlNoYWRlckxpYltcImRlcHRoUkdCQVwiXTtcbiAgICB2YXIgZGVwdGhVbmlmb3JtcyA9IFRIUkVFLlVuaWZvcm1zVXRpbHMuY2xvbmUoZGVwdGhTaGFkZXIudW5pZm9ybXMpO1xuXG4gICAgZGVwdGhNYXRlcmlhbCA9IG5ldyBUSFJFRS5TaGFkZXJNYXRlcmlhbCh7XG4gICAgICBmcmFnbWVudFNoYWRlcjogZGVwdGhTaGFkZXIuZnJhZ21lbnRTaGFkZXIsXG4gICAgICB2ZXJ0ZXhTaGFkZXI6IGRlcHRoU2hhZGVyLnZlcnRleFNoYWRlcixcbiAgICAgIHVuaWZvcm1zOiBkZXB0aFVuaWZvcm1zLFxuICAgICAgYmxlbmRpbmc6IFRIUkVFLk5vQmxlbmRpbmdcbiAgICB9KTtcblxuICAgIHZhciBwYXJzID0ge1xuICAgICAgbWluRmlsdGVyOiBUSFJFRS5MaW5lYXJGaWx0ZXIsXG4gICAgICBtYWdGaWx0ZXI6IFRIUkVFLkxpbmVhckZpbHRlclxuICAgIH07XG4gICAgZGVwdGhSZW5kZXJUYXJnZXQgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJUYXJnZXQod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCwgcGFycyk7XG5cbiAgICAvLyBTZXR1cCBTU0FPIHBhc3NcbiAgICBzc2FvUGFzcyA9IG5ldyBUSFJFRS5TaGFkZXJQYXNzKFRIUkVFLlNTQU9TaGFkZXIpO1xuICAgIHNzYW9QYXNzLnJlbmRlclRvU2NyZWVuID0gdHJ1ZTtcbiAgICAvL3NzYW9QYXNzLnVuaWZvcm1zWyBcInREaWZmdXNlXCIgXS52YWx1ZSB3aWxsIGJlIHNldCBieSBTaGFkZXJQYXNzXG4gICAgc3Nhb1Bhc3MudW5pZm9ybXNbXCJ0RGVwdGhcIl0udmFsdWUgPSBkZXB0aFJlbmRlclRhcmdldDtcbiAgICBzc2FvUGFzcy51bmlmb3Jtc1snc2l6ZSddLnZhbHVlLnNldCh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgICBzc2FvUGFzcy51bmlmb3Jtc1snY2FtZXJhTmVhciddLnZhbHVlID0gY2FtZXJhLm5lYXI7XG4gICAgc3Nhb1Bhc3MudW5pZm9ybXNbJ2NhbWVyYUZhciddLnZhbHVlID0gY2FtZXJhLmZhcjtcbiAgICBzc2FvUGFzcy51bmlmb3Jtc1snb25seUFPJ10udmFsdWUgPSBmYWxzZTtcbiAgICBzc2FvUGFzcy51bmlmb3Jtc1snYW9DbGFtcCddLnZhbHVlID0gMTtcbiAgICBzc2FvUGFzcy51bmlmb3Jtc1snbHVtSW5mbHVlbmNlJ10udmFsdWUgPSAwLjU7XG5cbiAgICAvLyBBZGQgcGFzcyB0byBlZmZlY3QgY29tcG9zZXJcbiAgICBlZmZlY3RDb21wb3NlciA9IG5ldyBUSFJFRS5FZmZlY3RDb21wb3NlcihyZW5kZXJlcik7XG4gICAgZWZmZWN0Q29tcG9zZXIuYWRkUGFzcyhyZW5kZXJQYXNzKTtcbiAgICBlZmZlY3RDb21wb3Nlci5hZGRQYXNzKHNzYW9QYXNzKTtcbiAgfVxuXG4gIC8vIFNldCB1cCByZW5kZXIgbG9vcFxuICBpbml0UG9zdHByb2Nlc3NpbmcoKTtcbiAgcmVuZGVyKCk7XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIG9uV2luZG93UmVzaXplLCBmYWxzZSk7XG5cbiAgcmV0dXJuIHN5c3RlbTtcbn07IiwidmFyIGFycmF5ID0ge1xuICBpbmRleE9mOiBmdW5jdGlvbihhcnJheSwgZWxlbWVudCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhcnJheVtpXSA9PT0gZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gaTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xO1xuICB9LFxuXG4gIGluY2x1ZGVzOiBmdW5jdGlvbihhcnJheSwgZWxlbWVudCkge1xuICAgIHJldHVybiB0aGlzLmluZGV4T2YoYXJyYXksIGVsZW1lbnQpICE9PSAtMTtcbiAgfSxcblxuICByZW1vdmU6IGZ1bmN0aW9uKGFycmF5LCBlbGVtZW50KSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5pbmRleE9mKGFycmF5LCBlbGVtZW50KTtcbiAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICBhcnJheS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheTsiLCJ2YXIgR3Jhdml0eSA9IGZ1bmN0aW9uKGRpciwgYXhpcywgcG9zaXRpdmUpIHtcbiAgdGhpcy5kaXIgPSBkaXIgfHwgbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgdGhpcy5heGlzID0gYXhpcyB8fCAnJztcbiAgdGhpcy5wb3NpdGl2ZSA9IHBvc2l0aXZlIHx8ICcnO1xuXG4gIHRoaXMuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEdyYXZpdHkodGhpcy5kaXIsIHRoaXMuYXhpcywgdGhpcy5wb3NpdGl2ZSk7XG4gIH07XG5cbiAgdGhpcy5lcXVhbHMgPSBmdW5jdGlvbihncmF2aXR5KSB7XG4gICAgcmV0dXJuIHRoaXMuZGlyLmVxdWFscyhncmF2aXR5LmRpcik7XG4gIH07XG5cbiAgdGhpcy5pc05vbmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5kaXIubGVuZ3RoKCkgPT09IDA7XG4gIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdyYXZpdHk7IiwidmFyIEdyYXZpdHkgPSByZXF1aXJlKCcuL2dyYXZpdHknKTtcblxudmFyIGdyYXZpdGllcyA9IHtcbiAgbm9uZTogbmV3IEdyYXZpdHkoKSxcbiAgcmlnaHQ6IG5ldyBHcmF2aXR5KG5ldyBUSFJFRS5WZWN0b3IzKDEsIDAsIDApLm5vcm1hbGl6ZSgpLCAneCcsIHRydWUpLFxuICBsZWZ0OiBuZXcgR3Jhdml0eShuZXcgVEhSRUUuVmVjdG9yMygtMSwgMCwgMCkubm9ybWFsaXplKCksICd4JywgZmFsc2UpLFxuICB0b3A6IG5ldyBHcmF2aXR5KG5ldyBUSFJFRS5WZWN0b3IzKDAsIDEsIDApLm5vcm1hbGl6ZSgpLCAneScsIHRydWUpLFxuICBib3R0b206IG5ldyBHcmF2aXR5KG5ldyBUSFJFRS5WZWN0b3IzKDAsIC0xLCAwKS5ub3JtYWxpemUoKSwgJ3knLCBmYWxzZSksXG4gIGZyb250OiBuZXcgR3Jhdml0eShuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAxKS5ub3JtYWxpemUoKSwgJ3onLCB0cnVlKSxcbiAgYmFjazogbmV3IEdyYXZpdHkobmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTEpLm5vcm1hbGl6ZSgpLCAneicsIGZhbHNlKVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldEdyYXZpdHk6IGZ1bmN0aW9uKHBvc2l0aW9uKSB7XG4gICAgdmFyIG1pbiA9IDE7XG4gICAgdmFyIGNsb3Nlc3QgPSBudWxsO1xuICAgIHZhciBmb3JjZSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgZm9yICh2YXIgaWQgaW4gZ3Jhdml0aWVzKSB7XG4gICAgICB2YXIgZ3Jhdml0eSA9IGdyYXZpdGllc1tpZF07XG4gICAgICB2YXIgZG90ID0gZ3Jhdml0eS5kaXIuY2xvbmUoKS5kb3QocG9zaXRpb24uY2xvbmUoKS5ub3JtYWxpemUoKSk7XG4gICAgICBpZiAoZG90IDwgbWluKSB7XG4gICAgICAgIG1pbiA9IGRvdDtcbiAgICAgICAgY2xvc2VzdCA9IGdyYXZpdHk7XG4gICAgICB9XG5cbiAgICAgIGlmKGRvdCA8IC0gMC41KSB7XG4gICAgICAgIHZhciByYXRpbyA9IC0wLjUgLSBkb3Q7XG4gICAgICAgIGZvcmNlLmFkZChncmF2aXR5LmRpci5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKHJhdGlvKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGdyYXZpdHkgPSBjbG9zZXN0LmNsb25lKCk7XG4gICAgZ3Jhdml0eS5mb3JjZURpciA9IGZvcmNlLm5vcm1hbGl6ZSgpO1xuICAgIHJldHVybiBncmF2aXR5O1xuICB9XG59OyIsInZhciBUSFJFRSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydUSFJFRSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnVEhSRUUnXSA6IG51bGwpO1xudmFyIGdyYXZpdHlVdGlscyA9IHJlcXVpcmUoJy4vZ3Jhdml0eXV0aWxzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuXG4gIHZhciBtYXAgPSB7fTtcbiAgdmFyIGNvZyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gIHZhciBncmF2aXR5QW1vdW50ID0gMC4wNTtcblxuICBmdW5jdGlvbiBvbkF0dGFjaChvYmplY3QsIGNvbXBvbmVudCkge1xuICAgIGlmKGNvbXBvbmVudC50eXBlID09PSAncmlnaWRCb2R5Jykge1xuICAgICAgbWFwW2NvbXBvbmVudC5faWRdID0gY29tcG9uZW50O1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBvbkRldHRhY2gob2JqZWN0LCBjb21wb25lbnQpIHtcbiAgICBpZihjb21wb25lbnQudHlwZSA9PT0gJ3JpZ2lkQm9keScpIHtcbiAgICAgIGRlbGV0ZSBtYXBbY29tcG9uZW50Ll9pZF07XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIHRpY2soKSB7XG4gICAgdmFyIGJvZGllcyA9IFtdO1xuICAgIHZhciBmaXh0dXJlcyA9IFtdO1xuICAgIGZvciAodmFyIGlkIGluIG1hcCkge1xuICAgICAgdmFyIGJvZHkgPSBtYXBbaWRdO1xuICAgICAgaWYgKGJvZHkuaXNGaXh0dXJlKSB7XG4gICAgICAgIGZpeHR1cmVzLnB1c2goYm9keSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBib2RpZXMucHVzaChib2R5KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJvZGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHJpZ2lkQm9keSA9IGJvZGllc1tpXTtcblxuICAgICAgLy8gQXBwbHkgZ3Jhdml0eVxuICAgICAgdmFyIGdyYXZpdHkgPSBncmF2aXR5VXRpbHMuZ2V0R3Jhdml0eShyaWdpZEJvZHkub2JqZWN0LnBvc2l0aW9uKTtcbiAgICAgIHJpZ2lkQm9keS5ncmF2aXR5ID0gZ3Jhdml0eTtcblxuICAgICAgaWYgKHJpZ2lkQm9keS5ncm91bmRlZCkge1xuICAgICAgICB2YXIgZ3Jhdml0eUZvcmNlID0gZ3Jhdml0eS5kaXIuY2xvbmUoKS5zZXRMZW5ndGgoZ3Jhdml0eUFtb3VudCk7XG4gICAgICAgIHJpZ2lkQm9keS5hcHBseUZvcmNlKGdyYXZpdHlGb3JjZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZ3Jhdml0eUZvcmNlID0gZ3Jhdml0eS5mb3JjZURpci5jbG9uZSgpLnNldExlbmd0aChncmF2aXR5QW1vdW50KTtcbiAgICAgICAgcmlnaWRCb2R5LmFwcGx5Rm9yY2UoZ3Jhdml0eUZvcmNlKTtcbiAgICAgIH1cblxuXG4gICAgICAvLyBBcHBseSBhY2NlbGVyYXRpb24gdG8gdmVsb2NpdHlcbiAgICAgIHJpZ2lkQm9keS52ZWxvY2l0eS5hZGQocmlnaWRCb2R5LmFjY2VsZXJhdGlvbik7XG4gICAgICByaWdpZEJvZHkudmVsb2NpdHkubXVsdGlwbHlTY2FsYXIocmlnaWRCb2R5LmZyaWN0aW9uKTtcblxuICAgICAgcmlnaWRCb2R5Lmdyb3VuZGVkID0gZmFsc2U7XG5cbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZml4dHVyZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgdmFyIGZpeHR1cmUgPSBmaXh0dXJlc1tqXTtcblxuICAgICAgICB2YXIgdmVsb2NpdGllcyA9IHtcbiAgICAgICAgICAneCc6IG5ldyBUSFJFRS5WZWN0b3IzKHJpZ2lkQm9keS52ZWxvY2l0eS54LCAwLCAwKSxcbiAgICAgICAgICAneSc6IG5ldyBUSFJFRS5WZWN0b3IzKDAsIHJpZ2lkQm9keS52ZWxvY2l0eS55LCAwKSxcbiAgICAgICAgICAneic6IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIHJpZ2lkQm9keS52ZWxvY2l0eS56KVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHBvc2l0aW9uID0gcmlnaWRCb2R5Lm9iamVjdC5wb3NpdGlvbi5jbG9uZSgpO1xuICAgICAgICBmb3IgKHZhciBheGlzIGluIHZlbG9jaXRpZXMpIHtcbiAgICAgICAgICB2YXIgdiA9IHZlbG9jaXRpZXNbYXhpc107XG4gICAgICAgICAgdmFyIHJheWNhc3RlciA9IG5ldyBUSFJFRS5SYXljYXN0ZXIoXG4gICAgICAgICAgICBwb3NpdGlvbixcbiAgICAgICAgICAgIHYuY2xvbmUoKS5ub3JtYWxpemUoKSxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICB2Lmxlbmd0aCgpICsgMC41XG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHZhciBpbnRlcnNlY3RzID0gcmF5Y2FzdGVyLmludGVyc2VjdE9iamVjdChmaXh0dXJlLm9iamVjdCwgdHJ1ZSk7XG4gICAgICAgICAgaWYgKGludGVyc2VjdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdmFyIGludGVyc2VjdCA9IGludGVyc2VjdHNbMF07XG4gICAgICAgICAgICB2YXIgbWFnID0gaW50ZXJzZWN0LmRpc3RhbmNlIC0gMC41O1xuICAgICAgICAgICAgcmlnaWRCb2R5LnZlbG9jaXR5W2F4aXNdID0gcmlnaWRCb2R5LnZlbG9jaXR5W2F4aXNdID4gMCA/IG1hZyA6IC1tYWc7XG4gICAgICAgICAgICBpZiAoYXhpcyA9PT0gZ3Jhdml0eS5heGlzKSB7XG4gICAgICAgICAgICAgIHJpZ2lkQm9keS5ncm91bmRlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcG9zaXRpb24uYWRkKHYpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEFwcGx5IHZlbG9jaXR5XG4gICAgICByaWdpZEJvZHkub2JqZWN0LnBvc2l0aW9uLmFkZChyaWdpZEJvZHkudmVsb2NpdHkpO1xuXG4gICAgICAvLyBDbGVhciBhY2NlbGVyYXRpb25cbiAgICAgIHJpZ2lkQm9keS5hY2NlbGVyYXRpb24uc2V0KDAsIDAsIDApO1xuICAgIH1cbiAgfTtcblxuICB2YXIgcGh5c2ljcyA9IHtcbiAgICBvbkF0dGFjaDogb25BdHRhY2gsXG4gICAgb25EZXR0YWNoOiBvbkRldHRhY2gsXG4gICAgdGljazogdGljayxcbiAgICBhcHA6IG51bGxcbiAgfTtcblxuICByZXR1cm4gcGh5c2ljcztcbn07IiwiLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8ZmVyb3NzQGZlcm9zcy5vcmc+IDxodHRwOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuXG52YXIgYmFzZTY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJylcbnZhciBpZWVlNzU0ID0gcmVxdWlyZSgnaWVlZTc1NCcpXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoJ2lzLWFycmF5JylcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IFNsb3dCdWZmZXJcbmV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMgPSA1MFxuQnVmZmVyLnBvb2xTaXplID0gODE5MiAvLyBub3QgdXNlZCBieSB0aGlzIGltcGxlbWVudGF0aW9uXG5cbnZhciByb290UGFyZW50ID0ge31cblxuLyoqXG4gKiBJZiBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgOlxuICogICA9PT0gdHJ1ZSAgICBVc2UgVWludDhBcnJheSBpbXBsZW1lbnRhdGlvbiAoZmFzdGVzdClcbiAqICAgPT09IGZhbHNlICAgVXNlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiAobW9zdCBjb21wYXRpYmxlLCBldmVuIElFNilcbiAqXG4gKiBCcm93c2VycyB0aGF0IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGFyZSBJRSAxMCssIEZpcmVmb3ggNCssIENocm9tZSA3KywgU2FmYXJpIDUuMSssXG4gKiBPcGVyYSAxMS42KywgaU9TIDQuMisuXG4gKlxuICogRHVlIHRvIHZhcmlvdXMgYnJvd3NlciBidWdzLCBzb21ldGltZXMgdGhlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiB3aWxsIGJlIHVzZWQgZXZlblxuICogd2hlbiB0aGUgYnJvd3NlciBzdXBwb3J0cyB0eXBlZCBhcnJheXMuXG4gKlxuICogTm90ZTpcbiAqXG4gKiAgIC0gRmlyZWZveCA0LTI5IGxhY2tzIHN1cHBvcnQgZm9yIGFkZGluZyBuZXcgcHJvcGVydGllcyB0byBgVWludDhBcnJheWAgaW5zdGFuY2VzLFxuICogICAgIFNlZTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4LlxuICpcbiAqICAgLSBTYWZhcmkgNS03IGxhY2tzIHN1cHBvcnQgZm9yIGNoYW5naW5nIHRoZSBgT2JqZWN0LnByb3RvdHlwZS5jb25zdHJ1Y3RvcmAgcHJvcGVydHlcbiAqICAgICBvbiBvYmplY3RzLlxuICpcbiAqICAgLSBDaHJvbWUgOS0xMCBpcyBtaXNzaW5nIHRoZSBgVHlwZWRBcnJheS5wcm90b3R5cGUuc3ViYXJyYXlgIGZ1bmN0aW9uLlxuICpcbiAqICAgLSBJRTEwIGhhcyBhIGJyb2tlbiBgVHlwZWRBcnJheS5wcm90b3R5cGUuc3ViYXJyYXlgIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgYXJyYXlzIG9mXG4gKiAgICAgaW5jb3JyZWN0IGxlbmd0aCBpbiBzb21lIHNpdHVhdGlvbnMuXG5cbiAqIFdlIGRldGVjdCB0aGVzZSBidWdneSBicm93c2VycyBhbmQgc2V0IGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGAgdG8gYGZhbHNlYCBzbyB0aGV5XG4gKiBnZXQgdGhlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiwgd2hpY2ggaXMgc2xvd2VyIGJ1dCBiZWhhdmVzIGNvcnJlY3RseS5cbiAqL1xuQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgPSAoZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBCYXIgKCkge31cbiAgdHJ5IHtcbiAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkoMSlcbiAgICBhcnIuZm9vID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfVxuICAgIGFyci5jb25zdHJ1Y3RvciA9IEJhclxuICAgIHJldHVybiBhcnIuZm9vKCkgPT09IDQyICYmIC8vIHR5cGVkIGFycmF5IGluc3RhbmNlcyBjYW4gYmUgYXVnbWVudGVkXG4gICAgICAgIGFyci5jb25zdHJ1Y3RvciA9PT0gQmFyICYmIC8vIGNvbnN0cnVjdG9yIGNhbiBiZSBzZXRcbiAgICAgICAgdHlwZW9mIGFyci5zdWJhcnJheSA9PT0gJ2Z1bmN0aW9uJyAmJiAvLyBjaHJvbWUgOS0xMCBsYWNrIGBzdWJhcnJheWBcbiAgICAgICAgYXJyLnN1YmFycmF5KDEsIDEpLmJ5dGVMZW5ndGggPT09IDAgLy8gaWUxMCBoYXMgYnJva2VuIGBzdWJhcnJheWBcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59KSgpXG5cbmZ1bmN0aW9uIGtNYXhMZW5ndGggKCkge1xuICByZXR1cm4gQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRcbiAgICA/IDB4N2ZmZmZmZmZcbiAgICA6IDB4M2ZmZmZmZmZcbn1cblxuLyoqXG4gKiBDbGFzczogQnVmZmVyXG4gKiA9PT09PT09PT09PT09XG4gKlxuICogVGhlIEJ1ZmZlciBjb25zdHJ1Y3RvciByZXR1cm5zIGluc3RhbmNlcyBvZiBgVWludDhBcnJheWAgdGhhdCBhcmUgYXVnbWVudGVkXG4gKiB3aXRoIGZ1bmN0aW9uIHByb3BlcnRpZXMgZm9yIGFsbCB0aGUgbm9kZSBgQnVmZmVyYCBBUEkgZnVuY3Rpb25zLiBXZSB1c2VcbiAqIGBVaW50OEFycmF5YCBzbyB0aGF0IHNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0IHJldHVybnNcbiAqIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIEJ5IGF1Z21lbnRpbmcgdGhlIGluc3RhbmNlcywgd2UgY2FuIGF2b2lkIG1vZGlmeWluZyB0aGUgYFVpbnQ4QXJyYXlgXG4gKiBwcm90b3R5cGUuXG4gKi9cbmZ1bmN0aW9uIEJ1ZmZlciAoYXJnKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBCdWZmZXIpKSB7XG4gICAgLy8gQXZvaWQgZ29pbmcgdGhyb3VnaCBhbiBBcmd1bWVudHNBZGFwdG9yVHJhbXBvbGluZSBpbiB0aGUgY29tbW9uIGNhc2UuXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSByZXR1cm4gbmV3IEJ1ZmZlcihhcmcsIGFyZ3VtZW50c1sxXSlcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcihhcmcpXG4gIH1cblxuICB0aGlzLmxlbmd0aCA9IDBcbiAgdGhpcy5wYXJlbnQgPSB1bmRlZmluZWRcblxuICAvLyBDb21tb24gY2FzZS5cbiAgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSB7XG4gICAgcmV0dXJuIGZyb21OdW1iZXIodGhpcywgYXJnKVxuICB9XG5cbiAgLy8gU2xpZ2h0bHkgbGVzcyBjb21tb24gY2FzZS5cbiAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGZyb21TdHJpbmcodGhpcywgYXJnLCBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6ICd1dGY4JylcbiAgfVxuXG4gIC8vIFVudXN1YWwuXG4gIHJldHVybiBmcm9tT2JqZWN0KHRoaXMsIGFyZylcbn1cblxuZnVuY3Rpb24gZnJvbU51bWJlciAodGhhdCwgbGVuZ3RoKSB7XG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGggPCAwID8gMCA6IGNoZWNrZWQobGVuZ3RoKSB8IDApXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGF0W2ldID0gMFxuICAgIH1cbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tU3RyaW5nICh0aGF0LCBzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnIHx8IGVuY29kaW5nID09PSAnJykgZW5jb2RpbmcgPSAndXRmOCdcblxuICAvLyBBc3N1bXB0aW9uOiBieXRlTGVuZ3RoKCkgcmV0dXJuIHZhbHVlIGlzIGFsd2F5cyA8IGtNYXhMZW5ndGguXG4gIHZhciBsZW5ndGggPSBieXRlTGVuZ3RoKHN0cmluZywgZW5jb2RpbmcpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuXG4gIHRoYXQud3JpdGUoc3RyaW5nLCBlbmNvZGluZylcbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbU9iamVjdCAodGhhdCwgb2JqZWN0KSB7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIob2JqZWN0KSkgcmV0dXJuIGZyb21CdWZmZXIodGhhdCwgb2JqZWN0KVxuXG4gIGlmIChpc0FycmF5KG9iamVjdCkpIHJldHVybiBmcm9tQXJyYXkodGhhdCwgb2JqZWN0KVxuXG4gIGlmIChvYmplY3QgPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ211c3Qgc3RhcnQgd2l0aCBudW1iZXIsIGJ1ZmZlciwgYXJyYXkgb3Igc3RyaW5nJylcbiAgfVxuXG4gIGlmICh0eXBlb2YgQXJyYXlCdWZmZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKG9iamVjdC5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgcmV0dXJuIGZyb21UeXBlZEFycmF5KHRoYXQsIG9iamVjdClcbiAgICB9XG4gICAgaWYgKG9iamVjdCBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICByZXR1cm4gZnJvbUFycmF5QnVmZmVyKHRoYXQsIG9iamVjdClcbiAgICB9XG4gIH1cblxuICBpZiAob2JqZWN0Lmxlbmd0aCkgcmV0dXJuIGZyb21BcnJheUxpa2UodGhhdCwgb2JqZWN0KVxuXG4gIHJldHVybiBmcm9tSnNvbk9iamVjdCh0aGF0LCBvYmplY3QpXG59XG5cbmZ1bmN0aW9uIGZyb21CdWZmZXIgKHRoYXQsIGJ1ZmZlcikge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChidWZmZXIubGVuZ3RoKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcbiAgYnVmZmVyLmNvcHkodGhhdCwgMCwgMCwgbGVuZ3RoKVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXkgKHRoYXQsIGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICB0aGF0W2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG4vLyBEdXBsaWNhdGUgb2YgZnJvbUFycmF5KCkgdG8ga2VlcCBmcm9tQXJyYXkoKSBtb25vbW9ycGhpYy5cbmZ1bmN0aW9uIGZyb21UeXBlZEFycmF5ICh0aGF0LCBhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuICAvLyBUcnVuY2F0aW5nIHRoZSBlbGVtZW50cyBpcyBwcm9iYWJseSBub3Qgd2hhdCBwZW9wbGUgZXhwZWN0IGZyb20gdHlwZWRcbiAgLy8gYXJyYXlzIHdpdGggQllURVNfUEVSX0VMRU1FTlQgPiAxIGJ1dCBpdCdzIGNvbXBhdGlibGUgd2l0aCB0aGUgYmVoYXZpb3JcbiAgLy8gb2YgdGhlIG9sZCBCdWZmZXIgY29uc3RydWN0b3IuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICB0aGF0W2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlCdWZmZXIgKHRoYXQsIGFycmF5KSB7XG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlLCBmb3IgYmVzdCBwZXJmb3JtYW5jZVxuICAgIGFycmF5LmJ5dGVMZW5ndGhcbiAgICB0aGF0ID0gQnVmZmVyLl9hdWdtZW50KG5ldyBVaW50OEFycmF5KGFycmF5KSlcbiAgfSBlbHNlIHtcbiAgICAvLyBGYWxsYmFjazogUmV0dXJuIGFuIG9iamVjdCBpbnN0YW5jZSBvZiB0aGUgQnVmZmVyIGNsYXNzXG4gICAgdGhhdCA9IGZyb21UeXBlZEFycmF5KHRoYXQsIG5ldyBVaW50OEFycmF5KGFycmF5KSlcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlMaWtlICh0aGF0LCBhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuLy8gRGVzZXJpYWxpemUgeyB0eXBlOiAnQnVmZmVyJywgZGF0YTogWzEsMiwzLC4uLl0gfSBpbnRvIGEgQnVmZmVyIG9iamVjdC5cbi8vIFJldHVybnMgYSB6ZXJvLWxlbmd0aCBidWZmZXIgZm9yIGlucHV0cyB0aGF0IGRvbid0IGNvbmZvcm0gdG8gdGhlIHNwZWMuXG5mdW5jdGlvbiBmcm9tSnNvbk9iamVjdCAodGhhdCwgb2JqZWN0KSB7XG4gIHZhciBhcnJheVxuICB2YXIgbGVuZ3RoID0gMFxuXG4gIGlmIChvYmplY3QudHlwZSA9PT0gJ0J1ZmZlcicgJiYgaXNBcnJheShvYmplY3QuZGF0YSkpIHtcbiAgICBhcnJheSA9IG9iamVjdC5kYXRhXG4gICAgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB9XG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIHRoYXRbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGFsbG9jYXRlICh0aGF0LCBsZW5ndGgpIHtcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2UsIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgdGhhdCA9IEJ1ZmZlci5fYXVnbWVudChuZXcgVWludDhBcnJheShsZW5ndGgpKVxuICB9IGVsc2Uge1xuICAgIC8vIEZhbGxiYWNrOiBSZXR1cm4gYW4gb2JqZWN0IGluc3RhbmNlIG9mIHRoZSBCdWZmZXIgY2xhc3NcbiAgICB0aGF0Lmxlbmd0aCA9IGxlbmd0aFxuICAgIHRoYXQuX2lzQnVmZmVyID0gdHJ1ZVxuICB9XG5cbiAgdmFyIGZyb21Qb29sID0gbGVuZ3RoICE9PSAwICYmIGxlbmd0aCA8PSBCdWZmZXIucG9vbFNpemUgPj4+IDFcbiAgaWYgKGZyb21Qb29sKSB0aGF0LnBhcmVudCA9IHJvb3RQYXJlbnRcblxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBjaGVja2VkIChsZW5ndGgpIHtcbiAgLy8gTm90ZTogY2Fubm90IHVzZSBgbGVuZ3RoIDwga01heExlbmd0aGAgaGVyZSBiZWNhdXNlIHRoYXQgZmFpbHMgd2hlblxuICAvLyBsZW5ndGggaXMgTmFOICh3aGljaCBpcyBvdGhlcndpc2UgY29lcmNlZCB0byB6ZXJvLilcbiAgaWYgKGxlbmd0aCA+PSBrTWF4TGVuZ3RoKCkpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byBhbGxvY2F0ZSBCdWZmZXIgbGFyZ2VyIHRoYW4gbWF4aW11bSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAnc2l6ZTogMHgnICsga01heExlbmd0aCgpLnRvU3RyaW5nKDE2KSArICcgYnl0ZXMnKVxuICB9XG4gIHJldHVybiBsZW5ndGggfCAwXG59XG5cbmZ1bmN0aW9uIFNsb3dCdWZmZXIgKHN1YmplY3QsIGVuY29kaW5nKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBTbG93QnVmZmVyKSkgcmV0dXJuIG5ldyBTbG93QnVmZmVyKHN1YmplY3QsIGVuY29kaW5nKVxuXG4gIHZhciBidWYgPSBuZXcgQnVmZmVyKHN1YmplY3QsIGVuY29kaW5nKVxuICBkZWxldGUgYnVmLnBhcmVudFxuICByZXR1cm4gYnVmXG59XG5cbkJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uIGlzQnVmZmVyIChiKSB7XG4gIHJldHVybiAhIShiICE9IG51bGwgJiYgYi5faXNCdWZmZXIpXG59XG5cbkJ1ZmZlci5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAoYSwgYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihhKSB8fCAhQnVmZmVyLmlzQnVmZmVyKGIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIG11c3QgYmUgQnVmZmVycycpXG4gIH1cblxuICBpZiAoYSA9PT0gYikgcmV0dXJuIDBcblxuICB2YXIgeCA9IGEubGVuZ3RoXG4gIHZhciB5ID0gYi5sZW5ndGhcblxuICB2YXIgaSA9IDBcbiAgdmFyIGxlbiA9IE1hdGgubWluKHgsIHkpXG4gIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIGJyZWFrXG5cbiAgICArK2lcbiAgfVxuXG4gIGlmIChpICE9PSBsZW4pIHtcbiAgICB4ID0gYVtpXVxuICAgIHkgPSBiW2ldXG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gaXNFbmNvZGluZyAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgIGNhc2UgJ3Jhdyc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQgKGxpc3QsIGxlbmd0aCkge1xuICBpZiAoIWlzQXJyYXkobGlzdCkpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2xpc3QgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzLicpXG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoMClcbiAgfVxuXG4gIHZhciBpXG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGxlbmd0aCA9IDBcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgbGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1ZiA9IG5ldyBCdWZmZXIobGVuZ3RoKVxuICB2YXIgcG9zID0gMFxuICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBpdGVtID0gbGlzdFtpXVxuICAgIGl0ZW0uY29weShidWYsIHBvcylcbiAgICBwb3MgKz0gaXRlbS5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKSBzdHJpbmcgPSAnJyArIHN0cmluZ1xuXG4gIHZhciBsZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGlmIChsZW4gPT09IDApIHJldHVybiAwXG5cbiAgLy8gVXNlIGEgZm9yIGxvb3AgdG8gYXZvaWQgcmVjdXJzaW9uXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgLy8gRGVwcmVjYXRlZFxuICAgICAgY2FzZSAncmF3JzpcbiAgICAgIGNhc2UgJ3Jhd3MnOlxuICAgICAgICByZXR1cm4gbGVuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gbGVuICogMlxuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGxlbiA+Pj4gMVxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgcmV0dXJuIHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoIC8vIGFzc3VtZSB1dGY4XG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhcblxuLy8gcHJlLXNldCBmb3IgdmFsdWVzIHRoYXQgbWF5IGV4aXN0IGluIHRoZSBmdXR1cmVcbkJ1ZmZlci5wcm90b3R5cGUubGVuZ3RoID0gdW5kZWZpbmVkXG5CdWZmZXIucHJvdG90eXBlLnBhcmVudCA9IHVuZGVmaW5lZFxuXG5mdW5jdGlvbiBzbG93VG9TdHJpbmcgKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG5cbiAgc3RhcnQgPSBzdGFydCB8IDBcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgfHwgZW5kID09PSBJbmZpbml0eSA/IHRoaXMubGVuZ3RoIDogZW5kIHwgMFxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG4gIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmIChlbmQgPD0gc3RhcnQpIHJldHVybiAnJ1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGJpbmFyeVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdXRmMTZsZVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9IChlbmNvZGluZyArICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGggfCAwXG4gIGlmIChsZW5ndGggPT09IDApIHJldHVybiAnJ1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCAwLCBsZW5ndGgpXG4gIHJldHVybiBzbG93VG9TdHJpbmcuYXBwbHkodGhpcywgYXJndW1lbnRzKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIGVxdWFscyAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYikgPT09IDBcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gaW5zcGVjdCAoKSB7XG4gIHZhciBzdHIgPSAnJ1xuICB2YXIgbWF4ID0gZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFU1xuICBpZiAodGhpcy5sZW5ndGggPiAwKSB7XG4gICAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5tYXRjaCgvLnsyfS9nKS5qb2luKCcgJylcbiAgICBpZiAodGhpcy5sZW5ndGggPiBtYXgpIHN0ciArPSAnIC4uLiAnXG4gIH1cbiAgcmV0dXJuICc8QnVmZmVyICcgKyBzdHIgKyAnPidcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gMFxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYilcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gaW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0KSB7XG4gIGlmIChieXRlT2Zmc2V0ID4gMHg3ZmZmZmZmZikgYnl0ZU9mZnNldCA9IDB4N2ZmZmZmZmZcbiAgZWxzZSBpZiAoYnl0ZU9mZnNldCA8IC0weDgwMDAwMDAwKSBieXRlT2Zmc2V0ID0gLTB4ODAwMDAwMDBcbiAgYnl0ZU9mZnNldCA+Pj0gMFxuXG4gIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xXG4gIGlmIChieXRlT2Zmc2V0ID49IHRoaXMubGVuZ3RoKSByZXR1cm4gLTFcblxuICAvLyBOZWdhdGl2ZSBvZmZzZXRzIHN0YXJ0IGZyb20gdGhlIGVuZCBvZiB0aGUgYnVmZmVyXG4gIGlmIChieXRlT2Zmc2V0IDwgMCkgYnl0ZU9mZnNldCA9IE1hdGgubWF4KHRoaXMubGVuZ3RoICsgYnl0ZU9mZnNldCwgMClcblxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xIC8vIHNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nIGFsd2F5cyBmYWlsc1xuICAgIHJldHVybiBTdHJpbmcucHJvdG90eXBlLmluZGV4T2YuY2FsbCh0aGlzLCB2YWwsIGJ5dGVPZmZzZXQpXG4gIH1cbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcih2YWwpKSB7XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQpXG4gIH1cbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwodGhpcywgdmFsLCBieXRlT2Zmc2V0KVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKHRoaXMsIFsgdmFsIF0sIGJ5dGVPZmZzZXQpXG4gIH1cblxuICBmdW5jdGlvbiBhcnJheUluZGV4T2YgKGFyciwgdmFsLCBieXRlT2Zmc2V0KSB7XG4gICAgdmFyIGZvdW5kSW5kZXggPSAtMVxuICAgIGZvciAodmFyIGkgPSAwOyBieXRlT2Zmc2V0ICsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFycltieXRlT2Zmc2V0ICsgaV0gPT09IHZhbFtmb3VuZEluZGV4ID09PSAtMSA/IDAgOiBpIC0gZm91bmRJbmRleF0pIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggPT09IC0xKSBmb3VuZEluZGV4ID0gaVxuICAgICAgICBpZiAoaSAtIGZvdW5kSW5kZXggKyAxID09PSB2YWwubGVuZ3RoKSByZXR1cm4gYnl0ZU9mZnNldCArIGZvdW5kSW5kZXhcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvdW5kSW5kZXggPSAtMVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLTFcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbCBtdXN0IGJlIHN0cmluZywgbnVtYmVyIG9yIEJ1ZmZlcicpXG59XG5cbi8vIGBnZXRgIGlzIGRlcHJlY2F0ZWRcbkJ1ZmZlci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0IChvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5nZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLnJlYWRVSW50OChvZmZzZXQpXG59XG5cbi8vIGBzZXRgIGlzIGRlcHJlY2F0ZWRcbkJ1ZmZlci5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0ICh2LCBvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5zZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLndyaXRlVUludDgodiwgb2Zmc2V0KVxufVxuXG5mdW5jdGlvbiBoZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIC8vIG11c3QgYmUgYW4gZXZlbiBudW1iZXIgb2YgZGlnaXRzXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGlmIChzdHJMZW4gJSAyICE9PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaGV4IHN0cmluZycpXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHZhciBwYXJzZWQgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgaWYgKGlzTmFOKHBhcnNlZCkpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBoZXggc3RyaW5nJylcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSBwYXJzZWRcbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiB1dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBhc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYXNjaWlUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJpbmFyeVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGFzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGJhc2U2NFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gdWNzMldyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIHdyaXRlIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZykge1xuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nKVxuICBpZiAob2Zmc2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIG9mZnNldFssIGxlbmd0aF1bLCBlbmNvZGluZ10pXG4gIH0gZWxzZSBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgICBpZiAoaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgbGVuZ3RoID0gbGVuZ3RoIHwgMFxuICAgICAgaWYgKGVuY29kaW5nID09PSB1bmRlZmluZWQpIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgfSBlbHNlIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIC8vIGxlZ2FjeSB3cml0ZShzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXQsIGxlbmd0aCkgLSByZW1vdmUgaW4gdjAuMTNcbiAgfSBlbHNlIHtcbiAgICB2YXIgc3dhcCA9IGVuY29kaW5nXG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBvZmZzZXQgPSBsZW5ndGggfCAwXG4gICAgbGVuZ3RoID0gc3dhcFxuICB9XG5cbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPiByZW1haW5pbmcpIGxlbmd0aCA9IHJlbWFpbmluZ1xuXG4gIGlmICgoc3RyaW5nLmxlbmd0aCA+IDAgJiYgKGxlbmd0aCA8IDAgfHwgb2Zmc2V0IDwgMCkpIHx8IG9mZnNldCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2F0dGVtcHQgdG8gd3JpdGUgb3V0c2lkZSBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBiaW5hcnlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICAvLyBXYXJuaW5nOiBtYXhMZW5ndGggbm90IHRha2VuIGludG8gYWNjb3VudCBpbiBiYXNlNjRXcml0ZVxuICAgICAgICByZXR1cm4gYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHVjczJXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gYnVmLmxlbmd0aCkge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1Zi5zbGljZShzdGFydCwgZW5kKSlcbiAgfVxufVxuXG5mdW5jdGlvbiB1dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG4gIHZhciByZXMgPSBbXVxuXG4gIHZhciBpID0gc3RhcnRcbiAgd2hpbGUgKGkgPCBlbmQpIHtcbiAgICB2YXIgZmlyc3RCeXRlID0gYnVmW2ldXG4gICAgdmFyIGNvZGVQb2ludCA9IG51bGxcbiAgICB2YXIgYnl0ZXNQZXJTZXF1ZW5jZSA9IChmaXJzdEJ5dGUgPiAweEVGKSA/IDRcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4REYpID8gM1xuICAgICAgOiAoZmlyc3RCeXRlID4gMHhCRikgPyAyXG4gICAgICA6IDFcblxuICAgIGlmIChpICsgYnl0ZXNQZXJTZXF1ZW5jZSA8PSBlbmQpIHtcbiAgICAgIHZhciBzZWNvbmRCeXRlLCB0aGlyZEJ5dGUsIGZvdXJ0aEJ5dGUsIHRlbXBDb2RlUG9pbnRcblxuICAgICAgc3dpdGNoIChieXRlc1BlclNlcXVlbmNlKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBpZiAoZmlyc3RCeXRlIDwgMHg4MCkge1xuICAgICAgICAgICAgY29kZVBvaW50ID0gZmlyc3RCeXRlXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4MUYpIDw8IDB4NiB8IChzZWNvbmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3Rikge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweEMgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4NiB8ICh0aGlyZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGRiAmJiAodGVtcENvZGVQb2ludCA8IDB4RDgwMCB8fCB0ZW1wQ29kZVBvaW50ID4gMHhERkZGKSkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBmb3VydGhCeXRlID0gYnVmW2kgKyAzXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAoZm91cnRoQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHgxMiB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHhDIHwgKHRoaXJkQnl0ZSAmIDB4M0YpIDw8IDB4NiB8IChmb3VydGhCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHhGRkZGICYmIHRlbXBDb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb2RlUG9pbnQgPT09IG51bGwpIHtcbiAgICAgIC8vIHdlIGRpZCBub3QgZ2VuZXJhdGUgYSB2YWxpZCBjb2RlUG9pbnQgc28gaW5zZXJ0IGFcbiAgICAgIC8vIHJlcGxhY2VtZW50IGNoYXIgKFUrRkZGRCkgYW5kIGFkdmFuY2Ugb25seSAxIGJ5dGVcbiAgICAgIGNvZGVQb2ludCA9IDB4RkZGRFxuICAgICAgYnl0ZXNQZXJTZXF1ZW5jZSA9IDFcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA+IDB4RkZGRikge1xuICAgICAgLy8gZW5jb2RlIHRvIHV0ZjE2IChzdXJyb2dhdGUgcGFpciBkYW5jZSlcbiAgICAgIGNvZGVQb2ludCAtPSAweDEwMDAwXG4gICAgICByZXMucHVzaChjb2RlUG9pbnQgPj4+IDEwICYgMHgzRkYgfCAweEQ4MDApXG4gICAgICBjb2RlUG9pbnQgPSAweERDMDAgfCBjb2RlUG9pbnQgJiAweDNGRlxuICAgIH1cblxuICAgIHJlcy5wdXNoKGNvZGVQb2ludClcbiAgICBpICs9IGJ5dGVzUGVyU2VxdWVuY2VcbiAgfVxuXG4gIHJldHVybiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkocmVzKVxufVxuXG4vLyBCYXNlZCBvbiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMjc0NzI3Mi82ODA3NDIsIHRoZSBicm93c2VyIHdpdGhcbi8vIHRoZSBsb3dlc3QgbGltaXQgaXMgQ2hyb21lLCB3aXRoIDB4MTAwMDAgYXJncy5cbi8vIFdlIGdvIDEgbWFnbml0dWRlIGxlc3MsIGZvciBzYWZldHlcbnZhciBNQVhfQVJHVU1FTlRTX0xFTkdUSCA9IDB4MTAwMFxuXG5mdW5jdGlvbiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkgKGNvZGVQb2ludHMpIHtcbiAgdmFyIGxlbiA9IGNvZGVQb2ludHMubGVuZ3RoXG4gIGlmIChsZW4gPD0gTUFYX0FSR1VNRU5UU19MRU5HVEgpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNvZGVQb2ludHMpIC8vIGF2b2lkIGV4dHJhIHNsaWNlKClcbiAgfVxuXG4gIC8vIERlY29kZSBpbiBjaHVua3MgdG8gYXZvaWQgXCJjYWxsIHN0YWNrIHNpemUgZXhjZWVkZWRcIi5cbiAgdmFyIHJlcyA9ICcnXG4gIHZhciBpID0gMFxuICB3aGlsZSAoaSA8IGxlbikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFxuICAgICAgU3RyaW5nLFxuICAgICAgY29kZVBvaW50cy5zbGljZShpLCBpICs9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKVxuICAgIClcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldICYgMHg3RilcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGJpbmFyeVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGhleFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcblxuICBpZiAoIXN0YXJ0IHx8IHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmICghZW5kIHx8IGVuZCA8IDAgfHwgZW5kID4gbGVuKSBlbmQgPSBsZW5cblxuICB2YXIgb3V0ID0gJydcbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBvdXQgKz0gdG9IZXgoYnVmW2ldKVxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyBieXRlc1tpICsgMV0gKiAyNTYpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZlxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICBuZXdCdWYgPSBCdWZmZXIuX2F1Z21lbnQodGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSlcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2xpY2VMZW4gPSBlbmQgLSBzdGFydFxuICAgIG5ld0J1ZiA9IG5ldyBCdWZmZXIoc2xpY2VMZW4sIHVuZGVmaW5lZClcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWNlTGVuOyBpKyspIHtcbiAgICAgIG5ld0J1ZltpXSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfVxuXG4gIGlmIChuZXdCdWYubGVuZ3RoKSBuZXdCdWYucGFyZW50ID0gdGhpcy5wYXJlbnQgfHwgdGhpc1xuXG4gIHJldHVybiBuZXdCdWZcbn1cblxuLypcbiAqIE5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgYnVmZmVyIGlzbid0IHRyeWluZyB0byB3cml0ZSBvdXQgb2YgYm91bmRzLlxuICovXG5mdW5jdGlvbiBjaGVja09mZnNldCAob2Zmc2V0LCBleHQsIGxlbmd0aCkge1xuICBpZiAoKG9mZnNldCAlIDEpICE9PSAwIHx8IG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdvZmZzZXQgaXMgbm90IHVpbnQnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gbGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVHJ5aW5nIHRvIGFjY2VzcyBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRMRSA9IGZ1bmN0aW9uIHJlYWRVSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRCRSA9IGZ1bmN0aW9uIHJlYWRVSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG4gIH1cblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdXG4gIHZhciBtdWwgPSAxXG4gIHdoaWxlIChieXRlTGVuZ3RoID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiByZWFkVUludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiByZWFkVUludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgOCkgfCB0aGlzW29mZnNldCArIDFdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICgodGhpc1tvZmZzZXRdKSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikpICtcbiAgICAgICh0aGlzW29mZnNldCArIDNdICogMHgxMDAwMDAwKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdICogMHgxMDAwMDAwKSArXG4gICAgKCh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgIHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludExFID0gZnVuY3Rpb24gcmVhZEludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludEJFID0gZnVuY3Rpb24gcmVhZEludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoXG4gIHZhciBtdWwgPSAxXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0taV1cbiAgd2hpbGUgKGkgPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1pXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiByZWFkSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICBpZiAoISh0aGlzW29mZnNldF0gJiAweDgwKSkgcmV0dXJuICh0aGlzW29mZnNldF0pXG4gIHJldHVybiAoKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gcmVhZEludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIDFdIHwgKHRoaXNbb2Zmc2V0XSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbiByZWFkSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdKSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10gPDwgMjQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiByZWFkSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDI0KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiByZWFkRmxvYXRMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0QkUgPSBmdW5jdGlvbiByZWFkRmxvYXRCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gcmVhZERvdWJsZUJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgNTIsIDgpXG59XG5cbmZ1bmN0aW9uIGNoZWNrSW50IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignYnVmZmVyIG11c3QgYmUgYSBCdWZmZXIgaW5zdGFuY2UnKVxuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCd2YWx1ZSBpcyBvdXQgb2YgYm91bmRzJylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdpbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludExFID0gZnVuY3Rpb24gd3JpdGVVSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSwgMClcblxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludEJFID0gZnVuY3Rpb24gd3JpdGVVSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSwgMClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiB3cml0ZVVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4ZmYsIDApXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHZhbHVlID0gTWF0aC5mbG9vcih2YWx1ZSlcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuZnVuY3Rpb24gb2JqZWN0V3JpdGVVSW50MTYgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuKSB7XG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmICsgdmFsdWUgKyAxXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4oYnVmLmxlbmd0aCAtIG9mZnNldCwgMik7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSAodmFsdWUgJiAoMHhmZiA8PCAoOCAqIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpKSkpID4+PlxuICAgICAgKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkgKiA4XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9IHZhbHVlXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuZnVuY3Rpb24gb2JqZWN0V3JpdGVVSW50MzIgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuKSB7XG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGJ1Zi5sZW5ndGggLSBvZmZzZXQsIDQpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID0gKHZhbHVlID4+PiAobGl0dGxlRW5kaWFuID8gaSA6IDMgLSBpKSAqIDgpICYgMHhmZlxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9IHZhbHVlXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludExFID0gZnVuY3Rpb24gd3JpdGVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGggLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IDBcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IHZhbHVlIDwgMCA/IDEgOiAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gdmFsdWUgPCAwID8gMSA6IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uIHdyaXRlSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweDdmLCAtMHg4MClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkgdmFsdWUgPSBNYXRoLmZsb29yKHZhbHVlKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDFdID0gdmFsdWVcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9IHZhbHVlXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuZnVuY3Rpb24gY2hlY2tJRUVFNzU0IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndmFsdWUgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdpbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5mdW5jdGlvbiB3cml0ZUZsb2F0IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDQsIDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgsIC0zLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gd3JpdGVGbG9hdEJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDgsIDEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4LCAtMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG4gIHJldHVybiBvZmZzZXQgKyA4XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVMRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUJFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuLy8gY29weSh0YXJnZXRCdWZmZXIsIHRhcmdldFN0YXJ0PTAsIHNvdXJjZVN0YXJ0PTAsIHNvdXJjZUVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gY29weSAodGFyZ2V0LCB0YXJnZXRTdGFydCwgc3RhcnQsIGVuZCkge1xuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0U3RhcnQgPj0gdGFyZ2V0Lmxlbmd0aCkgdGFyZ2V0U3RhcnQgPSB0YXJnZXQubGVuZ3RoXG4gIGlmICghdGFyZ2V0U3RhcnQpIHRhcmdldFN0YXJ0ID0gMFxuICBpZiAoZW5kID4gMCAmJiBlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICAvLyBDb3B5IDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVybiAwXG4gIGlmICh0YXJnZXQubGVuZ3RoID09PSAwIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIEZhdGFsIGVycm9yIGNvbmRpdGlvbnNcbiAgaWYgKHRhcmdldFN0YXJ0IDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgfVxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlU3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChlbmQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlRW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIC8vIEFyZSB3ZSBvb2I/XG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCA8IGVuZCAtIHN0YXJ0KSB7XG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0ICsgc3RhcnRcbiAgfVxuXG4gIHZhciBsZW4gPSBlbmQgLSBzdGFydFxuICB2YXIgaVxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQgJiYgc3RhcnQgPCB0YXJnZXRTdGFydCAmJiB0YXJnZXRTdGFydCA8IGVuZCkge1xuICAgIC8vIGRlc2NlbmRpbmcgY29weSBmcm9tIGVuZFxuICAgIGZvciAoaSA9IGxlbiAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIGlmIChsZW4gPCAxMDAwIHx8ICFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIC8vIGFzY2VuZGluZyBjb3B5IGZyb20gc3RhcnRcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0U3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRhcmdldC5fc2V0KHRoaXMuc3ViYXJyYXkoc3RhcnQsIHN0YXJ0ICsgbGVuKSwgdGFyZ2V0U3RhcnQpXG4gIH1cblxuICByZXR1cm4gbGVuXG59XG5cbi8vIGZpbGwodmFsdWUsIHN0YXJ0PTAsIGVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gZmlsbCAodmFsdWUsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCF2YWx1ZSkgdmFsdWUgPSAwXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCkgZW5kID0gdGhpcy5sZW5ndGhcblxuICBpZiAoZW5kIDwgc3RhcnQpIHRocm93IG5ldyBSYW5nZUVycm9yKCdlbmQgPCBzdGFydCcpXG5cbiAgLy8gRmlsbCAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm5cbiAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChlbmQgPCAwIHx8IGVuZCA+IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignZW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIHZhciBpXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgdGhpc1tpXSA9IHZhbHVlXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBieXRlcyA9IHV0ZjhUb0J5dGVzKHZhbHVlLnRvU3RyaW5nKCkpXG4gICAgdmFyIGxlbiA9IGJ5dGVzLmxlbmd0aFxuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIHRoaXNbaV0gPSBieXRlc1tpICUgbGVuXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBgQXJyYXlCdWZmZXJgIHdpdGggdGhlICpjb3BpZWQqIG1lbW9yeSBvZiB0aGUgYnVmZmVyIGluc3RhbmNlLlxuICogQWRkZWQgaW4gTm9kZSAwLjEyLiBPbmx5IGF2YWlsYWJsZSBpbiBicm93c2VycyB0aGF0IHN1cHBvcnQgQXJyYXlCdWZmZXIuXG4gKi9cbkJ1ZmZlci5wcm90b3R5cGUudG9BcnJheUJ1ZmZlciA9IGZ1bmN0aW9uIHRvQXJyYXlCdWZmZXIgKCkge1xuICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgICByZXR1cm4gKG5ldyBCdWZmZXIodGhpcykpLmJ1ZmZlclxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5sZW5ndGgpXG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYnVmLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgIGJ1ZltpXSA9IHRoaXNbaV1cbiAgICAgIH1cbiAgICAgIHJldHVybiBidWYuYnVmZmVyXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0J1ZmZlci50b0FycmF5QnVmZmVyIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyJylcbiAgfVxufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbnZhciBCUCA9IEJ1ZmZlci5wcm90b3R5cGVcblxuLyoqXG4gKiBBdWdtZW50IGEgVWludDhBcnJheSAqaW5zdGFuY2UqIChub3QgdGhlIFVpbnQ4QXJyYXkgY2xhc3MhKSB3aXRoIEJ1ZmZlciBtZXRob2RzXG4gKi9cbkJ1ZmZlci5fYXVnbWVudCA9IGZ1bmN0aW9uIF9hdWdtZW50IChhcnIpIHtcbiAgYXJyLmNvbnN0cnVjdG9yID0gQnVmZmVyXG4gIGFyci5faXNCdWZmZXIgPSB0cnVlXG5cbiAgLy8gc2F2ZSByZWZlcmVuY2UgdG8gb3JpZ2luYWwgVWludDhBcnJheSBzZXQgbWV0aG9kIGJlZm9yZSBvdmVyd3JpdGluZ1xuICBhcnIuX3NldCA9IGFyci5zZXRcblxuICAvLyBkZXByZWNhdGVkXG4gIGFyci5nZXQgPSBCUC5nZXRcbiAgYXJyLnNldCA9IEJQLnNldFxuXG4gIGFyci53cml0ZSA9IEJQLndyaXRlXG4gIGFyci50b1N0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0xvY2FsZVN0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0pTT04gPSBCUC50b0pTT05cbiAgYXJyLmVxdWFscyA9IEJQLmVxdWFsc1xuICBhcnIuY29tcGFyZSA9IEJQLmNvbXBhcmVcbiAgYXJyLmluZGV4T2YgPSBCUC5pbmRleE9mXG4gIGFyci5jb3B5ID0gQlAuY29weVxuICBhcnIuc2xpY2UgPSBCUC5zbGljZVxuICBhcnIucmVhZFVJbnRMRSA9IEJQLnJlYWRVSW50TEVcbiAgYXJyLnJlYWRVSW50QkUgPSBCUC5yZWFkVUludEJFXG4gIGFyci5yZWFkVUludDggPSBCUC5yZWFkVUludDhcbiAgYXJyLnJlYWRVSW50MTZMRSA9IEJQLnJlYWRVSW50MTZMRVxuICBhcnIucmVhZFVJbnQxNkJFID0gQlAucmVhZFVJbnQxNkJFXG4gIGFyci5yZWFkVUludDMyTEUgPSBCUC5yZWFkVUludDMyTEVcbiAgYXJyLnJlYWRVSW50MzJCRSA9IEJQLnJlYWRVSW50MzJCRVxuICBhcnIucmVhZEludExFID0gQlAucmVhZEludExFXG4gIGFyci5yZWFkSW50QkUgPSBCUC5yZWFkSW50QkVcbiAgYXJyLnJlYWRJbnQ4ID0gQlAucmVhZEludDhcbiAgYXJyLnJlYWRJbnQxNkxFID0gQlAucmVhZEludDE2TEVcbiAgYXJyLnJlYWRJbnQxNkJFID0gQlAucmVhZEludDE2QkVcbiAgYXJyLnJlYWRJbnQzMkxFID0gQlAucmVhZEludDMyTEVcbiAgYXJyLnJlYWRJbnQzMkJFID0gQlAucmVhZEludDMyQkVcbiAgYXJyLnJlYWRGbG9hdExFID0gQlAucmVhZEZsb2F0TEVcbiAgYXJyLnJlYWRGbG9hdEJFID0gQlAucmVhZEZsb2F0QkVcbiAgYXJyLnJlYWREb3VibGVMRSA9IEJQLnJlYWREb3VibGVMRVxuICBhcnIucmVhZERvdWJsZUJFID0gQlAucmVhZERvdWJsZUJFXG4gIGFyci53cml0ZVVJbnQ4ID0gQlAud3JpdGVVSW50OFxuICBhcnIud3JpdGVVSW50TEUgPSBCUC53cml0ZVVJbnRMRVxuICBhcnIud3JpdGVVSW50QkUgPSBCUC53cml0ZVVJbnRCRVxuICBhcnIud3JpdGVVSW50MTZMRSA9IEJQLndyaXRlVUludDE2TEVcbiAgYXJyLndyaXRlVUludDE2QkUgPSBCUC53cml0ZVVJbnQxNkJFXG4gIGFyci53cml0ZVVJbnQzMkxFID0gQlAud3JpdGVVSW50MzJMRVxuICBhcnIud3JpdGVVSW50MzJCRSA9IEJQLndyaXRlVUludDMyQkVcbiAgYXJyLndyaXRlSW50TEUgPSBCUC53cml0ZUludExFXG4gIGFyci53cml0ZUludEJFID0gQlAud3JpdGVJbnRCRVxuICBhcnIud3JpdGVJbnQ4ID0gQlAud3JpdGVJbnQ4XG4gIGFyci53cml0ZUludDE2TEUgPSBCUC53cml0ZUludDE2TEVcbiAgYXJyLndyaXRlSW50MTZCRSA9IEJQLndyaXRlSW50MTZCRVxuICBhcnIud3JpdGVJbnQzMkxFID0gQlAud3JpdGVJbnQzMkxFXG4gIGFyci53cml0ZUludDMyQkUgPSBCUC53cml0ZUludDMyQkVcbiAgYXJyLndyaXRlRmxvYXRMRSA9IEJQLndyaXRlRmxvYXRMRVxuICBhcnIud3JpdGVGbG9hdEJFID0gQlAud3JpdGVGbG9hdEJFXG4gIGFyci53cml0ZURvdWJsZUxFID0gQlAud3JpdGVEb3VibGVMRVxuICBhcnIud3JpdGVEb3VibGVCRSA9IEJQLndyaXRlRG91YmxlQkVcbiAgYXJyLmZpbGwgPSBCUC5maWxsXG4gIGFyci5pbnNwZWN0ID0gQlAuaW5zcGVjdFxuICBhcnIudG9BcnJheUJ1ZmZlciA9IEJQLnRvQXJyYXlCdWZmZXJcblxuICByZXR1cm4gYXJyXG59XG5cbnZhciBJTlZBTElEX0JBU0U2NF9SRSA9IC9bXitcXC8wLTlBLVphLXotX10vZ1xuXG5mdW5jdGlvbiBiYXNlNjRjbGVhbiAoc3RyKSB7XG4gIC8vIE5vZGUgc3RyaXBzIG91dCBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSBcXG4gYW5kIFxcdCBmcm9tIHRoZSBzdHJpbmcsIGJhc2U2NC1qcyBkb2VzIG5vdFxuICBzdHIgPSBzdHJpbmd0cmltKHN0cikucmVwbGFjZShJTlZBTElEX0JBU0U2NF9SRSwgJycpXG4gIC8vIE5vZGUgY29udmVydHMgc3RyaW5ncyB3aXRoIGxlbmd0aCA8IDIgdG8gJydcbiAgaWYgKHN0ci5sZW5ndGggPCAyKSByZXR1cm4gJydcbiAgLy8gTm9kZSBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgYmFzZTY0IHN0cmluZ3MgKG1pc3NpbmcgdHJhaWxpbmcgPT09KSwgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHdoaWxlIChzdHIubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgIHN0ciA9IHN0ciArICc9J1xuICB9XG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gc3RyaW5ndHJpbSAoc3RyKSB7XG4gIGlmIChzdHIudHJpbSkgcmV0dXJuIHN0ci50cmltKClcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJylcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyaW5nLCB1bml0cykge1xuICB1bml0cyA9IHVuaXRzIHx8IEluZmluaXR5XG4gIHZhciBjb2RlUG9pbnRcbiAgdmFyIGxlbmd0aCA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIGxlYWRTdXJyb2dhdGUgPSBudWxsXG4gIHZhciBieXRlcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGNvZGVQb2ludCA9IHN0cmluZy5jaGFyQ29kZUF0KGkpXG5cbiAgICAvLyBpcyBzdXJyb2dhdGUgY29tcG9uZW50XG4gICAgaWYgKGNvZGVQb2ludCA+IDB4RDdGRiAmJiBjb2RlUG9pbnQgPCAweEUwMDApIHtcbiAgICAgIC8vIGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoIWxlYWRTdXJyb2dhdGUpIHtcbiAgICAgICAgLy8gbm8gbGVhZCB5ZXRcbiAgICAgICAgaWYgKGNvZGVQb2ludCA+IDB4REJGRikge1xuICAgICAgICAgIC8vIHVuZXhwZWN0ZWQgdHJhaWxcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKGkgKyAxID09PSBsZW5ndGgpIHtcbiAgICAgICAgICAvLyB1bnBhaXJlZCBsZWFkXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhbGlkIGxlYWRcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIDIgbGVhZHMgaW4gYSByb3dcbiAgICAgIGlmIChjb2RlUG9pbnQgPCAweERDMDApIHtcbiAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gdmFsaWQgc3Vycm9nYXRlIHBhaXJcbiAgICAgIGNvZGVQb2ludCA9IGxlYWRTdXJyb2dhdGUgLSAweEQ4MDAgPDwgMTAgfCBjb2RlUG9pbnQgLSAweERDMDAgfCAweDEwMDAwXG4gICAgfSBlbHNlIGlmIChsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAvLyB2YWxpZCBibXAgY2hhciwgYnV0IGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICB9XG5cbiAgICBsZWFkU3Vycm9nYXRlID0gbnVsbFxuXG4gICAgLy8gZW5jb2RlIHV0ZjhcbiAgICBpZiAoY29kZVBvaW50IDwgMHg4MCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAxKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKGNvZGVQb2ludClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4ODAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgfCAweEMwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAzKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDIHwgMHhFMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gNCkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4MTIgfCAweEYwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvZGUgcG9pbnQnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBieXRlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyLCB1bml0cykge1xuICB2YXIgYywgaGksIGxvXG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuXG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIHJldHVybiBiYXNlNjQudG9CeXRlQXJyYXkoYmFzZTY0Y2xlYW4oc3RyKSlcbn1cblxuZnVuY3Rpb24gYmxpdEJ1ZmZlciAoc3JjLCBkc3QsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoKGkgKyBvZmZzZXQgPj0gZHN0Lmxlbmd0aCkgfHwgKGkgPj0gc3JjLmxlbmd0aCkpIGJyZWFrXG4gICAgZHN0W2kgKyBvZmZzZXRdID0gc3JjW2ldXG4gIH1cbiAgcmV0dXJuIGlcbn1cbiIsInZhciBsb29rdXAgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLyc7XG5cbjsoZnVuY3Rpb24gKGV4cG9ydHMpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG4gIHZhciBBcnIgPSAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnKVxuICAgID8gVWludDhBcnJheVxuICAgIDogQXJyYXlcblxuXHR2YXIgUExVUyAgID0gJysnLmNoYXJDb2RlQXQoMClcblx0dmFyIFNMQVNIICA9ICcvJy5jaGFyQ29kZUF0KDApXG5cdHZhciBOVU1CRVIgPSAnMCcuY2hhckNvZGVBdCgwKVxuXHR2YXIgTE9XRVIgID0gJ2EnLmNoYXJDb2RlQXQoMClcblx0dmFyIFVQUEVSICA9ICdBJy5jaGFyQ29kZUF0KDApXG5cdHZhciBQTFVTX1VSTF9TQUZFID0gJy0nLmNoYXJDb2RlQXQoMClcblx0dmFyIFNMQVNIX1VSTF9TQUZFID0gJ18nLmNoYXJDb2RlQXQoMClcblxuXHRmdW5jdGlvbiBkZWNvZGUgKGVsdCkge1xuXHRcdHZhciBjb2RlID0gZWx0LmNoYXJDb2RlQXQoMClcblx0XHRpZiAoY29kZSA9PT0gUExVUyB8fFxuXHRcdCAgICBjb2RlID09PSBQTFVTX1VSTF9TQUZFKVxuXHRcdFx0cmV0dXJuIDYyIC8vICcrJ1xuXHRcdGlmIChjb2RlID09PSBTTEFTSCB8fFxuXHRcdCAgICBjb2RlID09PSBTTEFTSF9VUkxfU0FGRSlcblx0XHRcdHJldHVybiA2MyAvLyAnLydcblx0XHRpZiAoY29kZSA8IE5VTUJFUilcblx0XHRcdHJldHVybiAtMSAvL25vIG1hdGNoXG5cdFx0aWYgKGNvZGUgPCBOVU1CRVIgKyAxMClcblx0XHRcdHJldHVybiBjb2RlIC0gTlVNQkVSICsgMjYgKyAyNlxuXHRcdGlmIChjb2RlIDwgVVBQRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gVVBQRVJcblx0XHRpZiAoY29kZSA8IExPV0VSICsgMjYpXG5cdFx0XHRyZXR1cm4gY29kZSAtIExPV0VSICsgMjZcblx0fVxuXG5cdGZ1bmN0aW9uIGI2NFRvQnl0ZUFycmF5IChiNjQpIHtcblx0XHR2YXIgaSwgaiwgbCwgdG1wLCBwbGFjZUhvbGRlcnMsIGFyclxuXG5cdFx0aWYgKGI2NC5sZW5ndGggJSA0ID4gMCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0Jylcblx0XHR9XG5cblx0XHQvLyB0aGUgbnVtYmVyIG9mIGVxdWFsIHNpZ25zIChwbGFjZSBob2xkZXJzKVxuXHRcdC8vIGlmIHRoZXJlIGFyZSB0d28gcGxhY2Vob2xkZXJzLCB0aGFuIHRoZSB0d28gY2hhcmFjdGVycyBiZWZvcmUgaXRcblx0XHQvLyByZXByZXNlbnQgb25lIGJ5dGVcblx0XHQvLyBpZiB0aGVyZSBpcyBvbmx5IG9uZSwgdGhlbiB0aGUgdGhyZWUgY2hhcmFjdGVycyBiZWZvcmUgaXQgcmVwcmVzZW50IDIgYnl0ZXNcblx0XHQvLyB0aGlzIGlzIGp1c3QgYSBjaGVhcCBoYWNrIHRvIG5vdCBkbyBpbmRleE9mIHR3aWNlXG5cdFx0dmFyIGxlbiA9IGI2NC5sZW5ndGhcblx0XHRwbGFjZUhvbGRlcnMgPSAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMikgPyAyIDogJz0nID09PSBiNjQuY2hhckF0KGxlbiAtIDEpID8gMSA6IDBcblxuXHRcdC8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuXHRcdGFyciA9IG5ldyBBcnIoYjY0Lmxlbmd0aCAqIDMgLyA0IC0gcGxhY2VIb2xkZXJzKVxuXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuXHRcdGwgPSBwbGFjZUhvbGRlcnMgPiAwID8gYjY0Lmxlbmd0aCAtIDQgOiBiNjQubGVuZ3RoXG5cblx0XHR2YXIgTCA9IDBcblxuXHRcdGZ1bmN0aW9uIHB1c2ggKHYpIHtcblx0XHRcdGFycltMKytdID0gdlxuXHRcdH1cblxuXHRcdGZvciAoaSA9IDAsIGogPSAwOyBpIDwgbDsgaSArPSA0LCBqICs9IDMpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTgpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgMTIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPDwgNikgfCBkZWNvZGUoYjY0LmNoYXJBdChpICsgMykpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDAwMCkgPj4gMTYpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDApID4+IDgpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fVxuXG5cdFx0aWYgKHBsYWNlSG9sZGVycyA9PT0gMikge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAyKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpID4+IDQpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fSBlbHNlIGlmIChwbGFjZUhvbGRlcnMgPT09IDEpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTApIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgNCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA+PiAyKVxuXHRcdFx0cHVzaCgodG1wID4+IDgpICYgMHhGRilcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRyZXR1cm4gYXJyXG5cdH1cblxuXHRmdW5jdGlvbiB1aW50OFRvQmFzZTY0ICh1aW50OCkge1xuXHRcdHZhciBpLFxuXHRcdFx0ZXh0cmFCeXRlcyA9IHVpbnQ4Lmxlbmd0aCAlIDMsIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG5cdFx0XHRvdXRwdXQgPSBcIlwiLFxuXHRcdFx0dGVtcCwgbGVuZ3RoXG5cblx0XHRmdW5jdGlvbiBlbmNvZGUgKG51bSkge1xuXHRcdFx0cmV0dXJuIGxvb2t1cC5jaGFyQXQobnVtKVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG5cdFx0XHRyZXR1cm4gZW5jb2RlKG51bSA+PiAxOCAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiAxMiAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiA2ICYgMHgzRikgKyBlbmNvZGUobnVtICYgMHgzRilcblx0XHR9XG5cblx0XHQvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG5cdFx0Zm9yIChpID0gMCwgbGVuZ3RoID0gdWludDgubGVuZ3RoIC0gZXh0cmFCeXRlczsgaSA8IGxlbmd0aDsgaSArPSAzKSB7XG5cdFx0XHR0ZW1wID0gKHVpbnQ4W2ldIDw8IDE2KSArICh1aW50OFtpICsgMV0gPDwgOCkgKyAodWludDhbaSArIDJdKVxuXHRcdFx0b3V0cHV0ICs9IHRyaXBsZXRUb0Jhc2U2NCh0ZW1wKVxuXHRcdH1cblxuXHRcdC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcblx0XHRzd2l0Y2ggKGV4dHJhQnl0ZXMpIHtcblx0XHRcdGNhc2UgMTpcblx0XHRcdFx0dGVtcCA9IHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUodGVtcCA+PiAyKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9PSdcblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgMjpcblx0XHRcdFx0dGVtcCA9ICh1aW50OFt1aW50OC5sZW5ndGggLSAyXSA8PCA4KSArICh1aW50OFt1aW50OC5sZW5ndGggLSAxXSlcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDEwKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wID4+IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA8PCAyKSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSAnPSdcblx0XHRcdFx0YnJlYWtcblx0XHR9XG5cblx0XHRyZXR1cm4gb3V0cHV0XG5cdH1cblxuXHRleHBvcnRzLnRvQnl0ZUFycmF5ID0gYjY0VG9CeXRlQXJyYXlcblx0ZXhwb3J0cy5mcm9tQnl0ZUFycmF5ID0gdWludDhUb0Jhc2U2NFxufSh0eXBlb2YgZXhwb3J0cyA9PT0gJ3VuZGVmaW5lZCcgPyAodGhpcy5iYXNlNjRqcyA9IHt9KSA6IGV4cG9ydHMpKVxuIiwiZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24gKGJ1ZmZlciwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG1cbiAgdmFyIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBuQml0cyA9IC03XG4gIHZhciBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDBcbiAgdmFyIGQgPSBpc0xFID8gLTEgOiAxXG4gIHZhciBzID0gYnVmZmVyW29mZnNldCArIGldXG5cbiAgaSArPSBkXG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgcyA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gZUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gZSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIG0gPSBlICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIGUgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IG1MZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgbSA9IG0gKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBpZiAoZSA9PT0gMCkge1xuICAgIGUgPSAxIC0gZUJpYXNcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpXG4gIH0gZWxzZSB7XG4gICAgbSA9IG0gKyBNYXRoLnBvdygyLCBtTGVuKVxuICAgIGUgPSBlIC0gZUJpYXNcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKVxufVxuXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24gKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLCBjXG4gIHZhciBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApXG4gIHZhciBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSlcbiAgdmFyIGQgPSBpc0xFID8gMSA6IC0xXG4gIHZhciBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwXG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSlcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMFxuICAgIGUgPSBlTWF4XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpXG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tXG4gICAgICBjICo9IDJcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGNcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpXG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrXG4gICAgICBjIC89IDJcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwXG4gICAgICBlID0gZU1heFxuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAodmFsdWUgKiBjIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IGUgKyBlQmlhc1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSAwXG4gICAgfVxuICB9XG5cbiAgZm9yICg7IG1MZW4gPj0gODsgYnVmZmVyW29mZnNldCArIGldID0gbSAmIDB4ZmYsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCkge31cblxuICBlID0gKGUgPDwgbUxlbikgfCBtXG4gIGVMZW4gKz0gbUxlblxuICBmb3IgKDsgZUxlbiA+IDA7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGUgJiAweGZmLCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpIHt9XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4XG59XG4iLCJcbi8qKlxuICogaXNBcnJheVxuICovXG5cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcblxuLyoqXG4gKiB0b1N0cmluZ1xuICovXG5cbnZhciBzdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4vKipcbiAqIFdoZXRoZXIgb3Igbm90IHRoZSBnaXZlbiBgdmFsYFxuICogaXMgYW4gYXJyYXkuXG4gKlxuICogZXhhbXBsZTpcbiAqXG4gKiAgICAgICAgaXNBcnJheShbXSk7XG4gKiAgICAgICAgLy8gPiB0cnVlXG4gKiAgICAgICAgaXNBcnJheShhcmd1bWVudHMpO1xuICogICAgICAgIC8vID4gZmFsc2VcbiAqICAgICAgICBpc0FycmF5KCcnKTtcbiAqICAgICAgICAvLyA+IGZhbHNlXG4gKlxuICogQHBhcmFtIHttaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtib29sfVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcnJheSB8fCBmdW5jdGlvbiAodmFsKSB7XG4gIHJldHVybiAhISB2YWwgJiYgJ1tvYmplY3QgQXJyYXldJyA9PSBzdHIuY2FsbCh2YWwpO1xufTtcbiJdfQ==
