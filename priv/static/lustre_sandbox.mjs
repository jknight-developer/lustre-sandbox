// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label2) => label2 in fields ? fields[label2] : this[label2]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array3, tail) {
    let t = tail || new Empty();
    for (let i = array3.length - 1; i >= 0; --i) {
      t = new NonEmpty(array3[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  // @internal
  atLeastLength(desired) {
    for (let _ of this) {
      if (desired <= 0)
        return true;
      desired--;
    }
    return desired <= 0;
  }
  // @internal
  hasLength(desired) {
    for (let _ of this) {
      if (desired <= 0)
        return false;
      desired--;
    }
    return desired === 0;
  }
  countLength() {
    let length4 = 0;
    for (let _ of this)
      length4++;
    return length4;
  }
};
function prepend(element2, tail) {
  return new NonEmpty(element2, tail);
}
function toList(elements3, tail) {
  return List.fromArray(elements3, tail);
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
};
var BitArray = class _BitArray {
  constructor(buffer) {
    if (!(buffer instanceof Uint8Array)) {
      throw "BitArray can only be constructed from a Uint8Array";
    }
    this.buffer = buffer;
  }
  // @internal
  get length() {
    return this.buffer.length;
  }
  // @internal
  byteAt(index3) {
    return this.buffer[index3];
  }
  // @internal
  floatFromSlice(start3, end, isBigEndian) {
    return byteArrayToFloat(this.buffer, start3, end, isBigEndian);
  }
  // @internal
  intFromSlice(start3, end, isBigEndian, isSigned) {
    return byteArrayToInt(this.buffer, start3, end, isBigEndian, isSigned);
  }
  // @internal
  binaryFromSlice(start3, end) {
    return new _BitArray(this.buffer.slice(start3, end));
  }
  // @internal
  sliceAfter(index3) {
    return new _BitArray(this.buffer.slice(index3));
  }
};
function byteArrayToInt(byteArray, start3, end, isBigEndian, isSigned) {
  let value3 = 0;
  if (isBigEndian) {
    for (let i = start3; i < end; i++) {
      value3 = value3 * 256 + byteArray[i];
    }
  } else {
    for (let i = end - 1; i >= start3; i--) {
      value3 = value3 * 256 + byteArray[i];
    }
  }
  if (isSigned) {
    const byteSize = end - start3;
    const highBit = 2 ** (byteSize * 8 - 1);
    if (value3 >= highBit) {
      value3 -= highBit * 2;
    }
  }
  return value3;
}
function byteArrayToFloat(byteArray, start3, end, isBigEndian) {
  const view2 = new DataView(byteArray.buffer);
  const byteSize = end - start3;
  if (byteSize === 8) {
    return view2.getFloat64(start3, !isBigEndian);
  } else if (byteSize === 4) {
    return view2.getFloat32(start3, !isBigEndian);
  } else {
    const msg = `Sized floats must be 32-bit or 64-bit on JavaScript, got size of ${byteSize * 8} bits`;
    throw new globalThis.Error(msg);
  }
}
var Result = class _Result extends CustomType {
  // @internal
  static isResult(data) {
    return data instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value3) {
    super();
    this[0] = value3;
  }
  // @internal
  isOk() {
    return true;
  }
};
var Error = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  // @internal
  isOk() {
    return false;
  }
};
function isEqual(x, y) {
  let values = [x, y];
  while (values.length) {
    let a2 = values.pop();
    let b = values.pop();
    if (a2 === b)
      continue;
    if (!isObject(a2) || !isObject(b))
      return false;
    let unequal = !structurallyCompatibleObjects(a2, b) || unequalDates(a2, b) || unequalBuffers(a2, b) || unequalArrays(a2, b) || unequalMaps(a2, b) || unequalSets(a2, b) || unequalRegExps(a2, b);
    if (unequal)
      return false;
    const proto = Object.getPrototypeOf(a2);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a2.equals(b))
          continue;
        else
          return false;
      } catch {
      }
    }
    let [keys2, get2] = getters(a2);
    for (let k of keys2(a2)) {
      values.push(get2(a2, k), get2(b, k));
    }
  }
  return true;
}
function getters(object3) {
  if (object3 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object3 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a2, b) {
  return a2 instanceof Date && (a2 > b || a2 < b);
}
function unequalBuffers(a2, b) {
  return a2.buffer instanceof ArrayBuffer && a2.BYTES_PER_ELEMENT && !(a2.byteLength === b.byteLength && a2.every((n, i) => n === b[i]));
}
function unequalArrays(a2, b) {
  return Array.isArray(a2) && a2.length !== b.length;
}
function unequalMaps(a2, b) {
  return a2 instanceof Map && a2.size !== b.size;
}
function unequalSets(a2, b) {
  return a2 instanceof Set && (a2.size != b.size || [...a2].some((e) => !b.has(e)));
}
function unequalRegExps(a2, b) {
  return a2 instanceof RegExp && (a2.source !== b.source || a2.flags !== b.flags);
}
function isObject(a2) {
  return typeof a2 === "object" && a2 !== null;
}
function structurallyCompatibleObjects(a2, b) {
  if (typeof a2 !== "object" && typeof b !== "object" && (!a2 || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a2 instanceof c))
    return false;
  return a2.constructor === b.constructor;
}
function divideInt(a2, b) {
  return Math.trunc(divideFloat(a2, b));
}
function divideFloat(a2, b) {
  if (b === 0) {
    return 0;
  } else {
    return a2 / b;
  }
}
function makeError(variant, module, line, fn, message, extra) {
  let error2 = new globalThis.Error(message);
  error2.gleam_error = variant;
  error2.module = module;
  error2.line = line;
  error2.fn = fn;
  for (let k in extra)
    error2[k] = extra[k];
  return error2;
}

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var None = class extends CustomType {
};
function to_result(option, e) {
  if (option instanceof Some) {
    let a2 = option[0];
    return new Ok(a2);
  } else {
    return new Error(e);
  }
}

// build/dev/javascript/gleam_stdlib/gleam/order.mjs
var Lt = class extends CustomType {
};
var Eq = class extends CustomType {
};
var Gt = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/float.mjs
function to_string(x) {
  return float_to_string(x);
}
function negate(x) {
  return -1 * x;
}
function do_round(x) {
  let $ = x >= 0;
  if ($) {
    return round(x);
  } else {
    return 0 - round(negate(x));
  }
}
function round2(x) {
  return do_round(x);
}
function divide(a2, b) {
  if (b === 0) {
    return new Error(void 0);
  } else {
    let b$1 = b;
    return new Ok(divideFloat(a2, b$1));
  }
}
function multiply(a2, b) {
  return a2 * b;
}

// build/dev/javascript/gleam_stdlib/gleam/int.mjs
function to_string3(x) {
  return to_string2(x);
}
function to_float(x) {
  return identity(x);
}
function compare(a2, b) {
  let $ = a2 === b;
  if ($) {
    return new Eq();
  } else {
    let $1 = a2 < b;
    if ($1) {
      return new Lt();
    } else {
      return new Gt();
    }
  }
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
function length_loop(loop$list, loop$count) {
  while (true) {
    let list = loop$list;
    let count = loop$count;
    if (list.atLeastLength(1)) {
      let list$1 = list.tail;
      loop$list = list$1;
      loop$count = count + 1;
    } else {
      return count;
    }
  }
}
function length(list) {
  return length_loop(list, 0);
}
function reverse_loop(loop$remaining, loop$accumulator) {
  while (true) {
    let remaining = loop$remaining;
    let accumulator = loop$accumulator;
    if (remaining.hasLength(0)) {
      return accumulator;
    } else {
      let item = remaining.head;
      let rest$1 = remaining.tail;
      loop$remaining = rest$1;
      loop$accumulator = prepend(item, accumulator);
    }
  }
}
function reverse(list) {
  return reverse_loop(list, toList([]));
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map(list, fun) {
  return map_loop(list, fun, toList([]));
}
function append_loop(loop$first, loop$second) {
  while (true) {
    let first2 = loop$first;
    let second = loop$second;
    if (first2.hasLength(0)) {
      return second;
    } else {
      let item = first2.head;
      let rest$1 = first2.tail;
      loop$first = rest$1;
      loop$second = prepend(item, second);
    }
  }
}
function append(first2, second) {
  return append_loop(reverse(first2), second);
}
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix.hasLength(0)) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function concat_loop(loop$lists, loop$acc) {
  while (true) {
    let lists = loop$lists;
    let acc = loop$acc;
    if (lists.hasLength(0)) {
      return reverse(acc);
    } else {
      let list = lists.head;
      let further_lists = lists.tail;
      loop$lists = further_lists;
      loop$acc = reverse_and_prepend(list, acc);
    }
  }
}
function flatten(lists) {
  return concat_loop(lists, toList([]));
}
function fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list.hasLength(0)) {
      return initial;
    } else {
      let x = list.head;
      let rest$1 = list.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, x);
      loop$fun = fun;
    }
  }
}
function index_fold_loop(loop$over, loop$acc, loop$with, loop$index) {
  while (true) {
    let over = loop$over;
    let acc = loop$acc;
    let with$ = loop$with;
    let index3 = loop$index;
    if (over.hasLength(0)) {
      return acc;
    } else {
      let first$1 = over.head;
      let rest$1 = over.tail;
      loop$over = rest$1;
      loop$acc = with$(acc, first$1, index3);
      loop$with = with$;
      loop$index = index3 + 1;
    }
  }
}
function index_fold(list, initial, fun) {
  return index_fold_loop(list, initial, fun, 0);
}
function range_loop(loop$start, loop$stop, loop$acc) {
  while (true) {
    let start3 = loop$start;
    let stop = loop$stop;
    let acc = loop$acc;
    let $ = compare(start3, stop);
    if ($ instanceof Eq) {
      return prepend(stop, acc);
    } else if ($ instanceof Gt) {
      loop$start = start3;
      loop$stop = stop + 1;
      loop$acc = prepend(stop, acc);
    } else {
      loop$start = start3;
      loop$stop = stop - 1;
      loop$acc = prepend(stop, acc);
    }
  }
}
function range(start3, stop) {
  return range_loop(start3, stop, toList([]));
}

// build/dev/javascript/gleam_stdlib/gleam/string_tree.mjs
function from_strings(strings) {
  return concat(strings);
}
function from_string(string3) {
  return identity(string3);
}
function to_string4(tree) {
  return identity(tree);
}
function split2(tree, pattern) {
  return split(tree, pattern);
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function length3(string3) {
  return string_length(string3);
}
function replace(string3, pattern, substitute) {
  let _pipe = string3;
  let _pipe$1 = from_string(_pipe);
  let _pipe$2 = string_replace(_pipe$1, pattern, substitute);
  return to_string4(_pipe$2);
}
function slice(string3, idx, len) {
  let $ = len < 0;
  if ($) {
    return "";
  } else {
    let $1 = idx < 0;
    if ($1) {
      let translated_idx = length3(string3) + idx;
      let $2 = translated_idx < 0;
      if ($2) {
        return "";
      } else {
        return string_slice(string3, translated_idx, len);
      }
    } else {
      return string_slice(string3, idx, len);
    }
  }
}
function drop_start(string3, num_graphemes) {
  let $ = num_graphemes < 0;
  if ($) {
    return string3;
  } else {
    return slice(string3, num_graphemes, length3(string3) - num_graphemes);
  }
}
function join2(strings, separator) {
  return join(strings, separator);
}
function split3(x, substring) {
  if (substring === "") {
    return graphemes(x);
  } else {
    let _pipe = x;
    let _pipe$1 = from_string(_pipe);
    let _pipe$2 = split2(_pipe$1, substring);
    return map(_pipe$2, to_string4);
  }
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function map2(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(fun(x));
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function map_error(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(x);
  } else {
    let error2 = result[0];
    return new Error(fun(error2));
  }
}
function try$(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return fun(x);
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function then$(result, fun) {
  return try$(result, fun);
}
function unwrap(result, default$) {
  if (result.isOk()) {
    let v = result[0];
    return v;
  } else {
    return default$;
  }
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic.mjs
var DecodeError = class extends CustomType {
  constructor(expected, found, path2) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path2;
  }
};
function classify(data) {
  return classify_dynamic(data);
}
function int(data) {
  return decode_int(data);
}
function any(decoders) {
  return (data) => {
    if (decoders.hasLength(0)) {
      return new Error(
        toList([new DecodeError("another type", classify(data), toList([]))])
      );
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder(data);
      if ($.isOk()) {
        let decoded = $[0];
        return new Ok(decoded);
      } else {
        return any(decoders$1)(data);
      }
    }
  };
}
function push_path(error2, name) {
  let name$1 = identity(name);
  let decoder = any(
    toList([string, (x) => {
      return map2(int(x), to_string3);
    }])
  );
  let name$2 = (() => {
    let $ = decoder(name$1);
    if ($.isOk()) {
      let name$22 = $[0];
      return name$22;
    } else {
      let _pipe = toList(["<", classify(name$1), ">"]);
      let _pipe$1 = from_strings(_pipe);
      return to_string4(_pipe$1);
    }
  })();
  return error2.withFields({ path: prepend(name$2, error2.path) });
}
function map_errors(result, f) {
  return map_error(
    result,
    (_capture) => {
      return map(_capture, f);
    }
  );
}
function string(data) {
  return decode_string(data);
}
function field(name, inner_type) {
  return (value3) => {
    let missing_field_error = new DecodeError("field", "nothing", toList([]));
    return try$(
      decode_field(value3, name),
      (maybe_inner) => {
        let _pipe = maybe_inner;
        let _pipe$1 = to_result(_pipe, toList([missing_field_error]));
        let _pipe$2 = try$(_pipe$1, inner_type);
        return map_errors(
          _pipe$2,
          (_capture) => {
            return push_path(_capture, name);
          }
        );
      }
    );
  };
}

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = new DataView(new ArrayBuffer(8));
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a2, b) {
  return a2 ^ b + 2654435769 + (a2 << 6) + (a2 >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code = o.hashCode(o);
      if (typeof code === "number") {
        return code;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys2 = Object.keys(o);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null)
    return 1108378658;
  if (u === void 0)
    return 1108378659;
  if (u === true)
    return 1108378657;
  if (u === false)
    return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var SHIFT = 5;
var BUCKET_SIZE = Math.pow(2, SHIFT);
var MASK = BUCKET_SIZE - 1;
var MAX_INDEX_NODE = BUCKET_SIZE / 2;
var MIN_ARRAY_NODE = BUCKET_SIZE / 4;
var ENTRY = 0;
var ARRAY_NODE = 1;
var INDEX_NODE = 2;
var COLLISION_NODE = 3;
var EMPTY = {
  type: INDEX_NODE,
  bitmap: 0,
  array: []
};
function mask(hash, shift) {
  return hash >>> shift & MASK;
}
function bitpos(hash, shift) {
  return 1 << mask(hash, shift);
}
function bitcount(x) {
  x -= x >> 1 & 1431655765;
  x = (x & 858993459) + (x >> 2 & 858993459);
  x = x + (x >> 4) & 252645135;
  x += x >> 8;
  x += x >> 16;
  return x & 127;
}
function index(bitmap, bit) {
  return bitcount(bitmap & bit - 1);
}
function cloneAndSet(arr, at, val) {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) {
    out[i] = arr[i];
  }
  out[at] = val;
  return out;
}
function spliceIn(arr, at, val) {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  out[g++] = val;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function spliceOut(arr, at) {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  ++i;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function createNode(shift, key1, val1, key2hash, key2, val2) {
  const key1hash = getHash(key1);
  if (key1hash === key2hash) {
    return {
      type: COLLISION_NODE,
      hash: key1hash,
      array: [
        { type: ENTRY, k: key1, v: val1 },
        { type: ENTRY, k: key2, v: val2 }
      ]
    };
  }
  const addedLeaf = { val: false };
  return assoc(
    assocIndex(EMPTY, shift, key1hash, key1, val1, addedLeaf),
    shift,
    key2hash,
    key2,
    val2,
    addedLeaf
  );
}
function assoc(root, shift, hash, key, val, addedLeaf) {
  switch (root.type) {
    case ARRAY_NODE:
      return assocArray(root, shift, hash, key, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root, shift, hash, key, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root, shift, hash, key, val, addedLeaf);
  }
}
function assocArray(root, shift, hash, key, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size + 1,
      array: cloneAndSet(root.array, idx, { type: ENTRY, k: key, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key, node.k)) {
      if (val === node.v) {
        return root;
      }
      return {
        type: ARRAY_NODE,
        size: root.size,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size,
      array: cloneAndSet(
        root.array,
        idx,
        createNode(shift + SHIFT, node.k, node.v, hash, key, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
  if (n === node) {
    return root;
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function assocIndex(root, shift, hash, key, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root.bitmap, bit);
  if ((root.bitmap & bit) !== 0) {
    const node = root.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
      if (n === node) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, n)
      };
    }
    const nodeKey = node.k;
    if (isEqual(key, nodeKey)) {
      if (val === node.v) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap,
      array: cloneAndSet(
        root.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node.v, hash, key, val)
      )
    };
  } else {
    const n = root.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key, val, addedLeaf);
      let j = 0;
      let bitmap = root.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node = root.array[j++];
          nodes[i] = node;
        }
        bitmap = bitmap >>> 1;
      }
      return {
        type: ARRAY_NODE,
        size: n + 1,
        array: nodes
      };
    } else {
      const newArray = spliceIn(root.array, idx, {
        type: ENTRY,
        k: key,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root, shift, hash, key, val, addedLeaf) {
  if (hash === root.hash) {
    const idx = collisionIndexOf(root, key);
    if (idx !== -1) {
      const entry = root.array[idx];
      if (entry.v === val) {
        return root;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root.array, idx, { type: ENTRY, k: key, v: val })
      };
    }
    const size = root.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root.array, size, { type: ENTRY, k: key, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root.hash, shift),
      array: [root]
    },
    shift,
    hash,
    key,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root, key) {
  const size = root.array.length;
  for (let i = 0; i < size; i++) {
    if (isEqual(key, root.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root, shift, hash, key) {
  switch (root.type) {
    case ARRAY_NODE:
      return findArray(root, shift, hash, key);
    case INDEX_NODE:
      return findIndex(root, shift, hash, key);
    case COLLISION_NODE:
      return findCollision(root, key);
  }
}
function findArray(root, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    return void 0;
  }
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findIndex(root, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root.bitmap, bit);
  const node = root.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root, key) {
  const idx = collisionIndexOf(root, key);
  if (idx < 0) {
    return void 0;
  }
  return root.array[idx];
}
function without(root, shift, hash, key) {
  switch (root.type) {
    case ARRAY_NODE:
      return withoutArray(root, shift, hash, key);
    case INDEX_NODE:
      return withoutIndex(root, shift, hash, key);
    case COLLISION_NODE:
      return withoutCollision(root, key);
  }
}
function withoutArray(root, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    return root;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key)) {
      return root;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root;
    }
  }
  if (n === void 0) {
    if (root.size <= MIN_ARRAY_NODE) {
      const arr = root.array;
      const out = new Array(root.size - 1);
      let i = 0;
      let j = 0;
      let bitmap = 0;
      while (i < idx) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      ++i;
      while (i < arr.length) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      return {
        type: INDEX_NODE,
        bitmap,
        array: out
      };
    }
    return {
      type: ARRAY_NODE,
      size: root.size - 1,
      array: cloneAndSet(root.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function withoutIndex(root, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root.bitmap & bit) === 0) {
    return root;
  }
  const idx = index(root.bitmap, bit);
  const node = root.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, n)
      };
    }
    if (root.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap ^ bit,
      array: spliceOut(root.array, idx)
    };
  }
  if (isEqual(key, node.k)) {
    if (root.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap ^ bit,
      array: spliceOut(root.array, idx)
    };
  }
  return root;
}
function withoutCollision(root, key) {
  const idx = collisionIndexOf(root, key);
  if (idx < 0) {
    return root;
  }
  if (root.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root.hash,
    array: spliceOut(root.array, idx)
  };
}
function forEach(root, fn) {
  if (root === void 0) {
    return;
  }
  const items = root.array;
  const size = items.length;
  for (let i = 0; i < size; i++) {
    const item = items[i];
    if (item === void 0) {
      continue;
    }
    if (item.type === ENTRY) {
      fn(item.v, item.k);
      continue;
    }
    forEach(item, fn);
  }
}
var Dict = class _Dict {
  /**
   * @template V
   * @param {Record<string,V>} o
   * @returns {Dict<string,V>}
   */
  static fromObject(o) {
    const keys2 = Object.keys(o);
    let m = _Dict.new();
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      m = m.set(k, o[k]);
    }
    return m;
  }
  /**
   * @template K,V
   * @param {Map<K,V>} o
   * @returns {Dict<K,V>}
   */
  static fromMap(o) {
    let m = _Dict.new();
    o.forEach((v, k) => {
      m = m.set(k, v);
    });
    return m;
  }
  static new() {
    return new _Dict(void 0, 0);
  }
  /**
   * @param {undefined | Node<K,V>} root
   * @param {number} size
   */
  constructor(root, size) {
    this.root = root;
    this.size = size;
  }
  /**
   * @template NotFound
   * @param {K} key
   * @param {NotFound} notFound
   * @returns {NotFound | V}
   */
  get(key, notFound) {
    if (this.root === void 0) {
      return notFound;
    }
    const found = find(this.root, 0, getHash(key), key);
    if (found === void 0) {
      return notFound;
    }
    return found.v;
  }
  /**
   * @param {K} key
   * @param {V} val
   * @returns {Dict<K,V>}
   */
  set(key, val) {
    const addedLeaf = { val: false };
    const root = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root, 0, getHash(key), key, val, addedLeaf);
    if (newRoot === this.root) {
      return this;
    }
    return new _Dict(newRoot, addedLeaf.val ? this.size + 1 : this.size);
  }
  /**
   * @param {K} key
   * @returns {Dict<K,V>}
   */
  delete(key) {
    if (this.root === void 0) {
      return this;
    }
    const newRoot = without(this.root, 0, getHash(key), key);
    if (newRoot === this.root) {
      return this;
    }
    if (newRoot === void 0) {
      return _Dict.new();
    }
    return new _Dict(newRoot, this.size - 1);
  }
  /**
   * @param {K} key
   * @returns {boolean}
   */
  has(key) {
    if (this.root === void 0) {
      return false;
    }
    return find(this.root, 0, getHash(key), key) !== void 0;
  }
  /**
   * @returns {[K,V][]}
   */
  entries() {
    if (this.root === void 0) {
      return [];
    }
    const result = [];
    this.forEach((v, k) => result.push([k, v]));
    return result;
  }
  /**
   *
   * @param {(val:V,key:K)=>void} fn
   */
  forEach(fn) {
    forEach(this.root, fn);
  }
  hashCode() {
    let h = 0;
    this.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
    return h;
  }
  /**
   * @param {unknown} o
   * @returns {boolean}
   */
  equals(o) {
    if (!(o instanceof _Dict) || this.size !== o.size) {
      return false;
    }
    let equal = true;
    this.forEach((v, k) => {
      equal = equal && isEqual(o.get(k, !v), v);
    });
    return equal;
  }
};

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
var NOT_FOUND = {};
function identity(x) {
  return x;
}
function to_string2(term) {
  return term.toString();
}
function float_to_string(float3) {
  const string3 = float3.toString().replace("+", "");
  if (string3.indexOf(".") >= 0) {
    return string3;
  } else {
    const index3 = string3.indexOf("e");
    if (index3 >= 0) {
      return string3.slice(0, index3) + ".0" + string3.slice(index3);
    } else {
      return string3 + ".0";
    }
  }
}
function string_replace(string3, target, substitute) {
  if (typeof string3.replaceAll !== "undefined") {
    return string3.replaceAll(target, substitute);
  }
  return string3.replace(
    // $& means the whole matched string
    new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
    substitute
  );
}
function string_length(string3) {
  if (string3 === "") {
    return 0;
  }
  const iterator = graphemes_iterator(string3);
  if (iterator) {
    let i = 0;
    for (const _ of iterator) {
      i++;
    }
    return i;
  } else {
    return string3.match(/./gsu).length;
  }
}
function graphemes(string3) {
  const iterator = graphemes_iterator(string3);
  if (iterator) {
    return List.fromArray(Array.from(iterator).map((item) => item.segment));
  } else {
    return List.fromArray(string3.match(/./gsu));
  }
}
var segmenter = void 0;
function graphemes_iterator(string3) {
  if (globalThis.Intl && Intl.Segmenter) {
    segmenter ||= new Intl.Segmenter();
    return segmenter.segment(string3)[Symbol.iterator]();
  }
}
function split(xs, pattern) {
  return List.fromArray(xs.split(pattern));
}
function join(xs, separator) {
  const iterator = xs[Symbol.iterator]();
  let result = iterator.next().value || "";
  let current = iterator.next();
  while (!current.done) {
    result = result + separator + current.value;
    current = iterator.next();
  }
  return result;
}
function concat(xs) {
  let result = "";
  for (const x of xs) {
    result = result + x;
  }
  return result;
}
function string_slice(string3, idx, len) {
  if (len <= 0 || idx >= string3.length) {
    return "";
  }
  const iterator = graphemes_iterator(string3);
  if (iterator) {
    while (idx-- > 0) {
      iterator.next();
    }
    let result = "";
    while (len-- > 0) {
      const v = iterator.next().value;
      if (v === void 0) {
        break;
      }
      result += v.segment;
    }
    return result;
  } else {
    return string3.match(/./gsu).slice(idx, idx + len).join("");
  }
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join("");
var left_trim_regex = new RegExp(`^([${unicode_whitespaces}]*)`, "g");
var right_trim_regex = new RegExp(`([${unicode_whitespaces}]*)$`, "g");
function console_log(term) {
  console.log(term);
}
function round(float3) {
  return Math.round(float3);
}
function new_map() {
  return Dict.new();
}
function map_to_list(map4) {
  return List.fromArray(map4.entries());
}
function map_get(map4, key) {
  const value3 = map4.get(key, NOT_FOUND);
  if (value3 === NOT_FOUND) {
    return new Error(Nil);
  }
  return new Ok(value3);
}
function map_insert(key, value3, map4) {
  return map4.set(key, value3);
}
function classify_dynamic(data) {
  if (typeof data === "string") {
    return "String";
  } else if (typeof data === "boolean") {
    return "Bool";
  } else if (data instanceof Result) {
    return "Result";
  } else if (data instanceof List) {
    return "List";
  } else if (data instanceof BitArray) {
    return "BitArray";
  } else if (data instanceof Dict) {
    return "Dict";
  } else if (Number.isInteger(data)) {
    return "Int";
  } else if (Array.isArray(data)) {
    return `Tuple of ${data.length} elements`;
  } else if (typeof data === "number") {
    return "Float";
  } else if (data === null) {
    return "Null";
  } else if (data === void 0) {
    return "Nil";
  } else {
    const type = typeof data;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
function decoder_error(expected, got) {
  return decoder_error_no_classify(expected, classify_dynamic(got));
}
function decoder_error_no_classify(expected, got) {
  return new Error(
    List.fromArray([new DecodeError(expected, got, List.fromArray([]))])
  );
}
function decode_string(data) {
  return typeof data === "string" ? new Ok(data) : decoder_error("String", data);
}
function decode_int(data) {
  return Number.isInteger(data) ? new Ok(data) : decoder_error("Int", data);
}
function decode_field(value3, name) {
  const not_a_map_error = () => decoder_error("Dict", value3);
  if (value3 instanceof Dict || value3 instanceof WeakMap || value3 instanceof Map) {
    const entry = map_get(value3, name);
    return new Ok(entry.isOk() ? new Some(entry[0]) : new None());
  } else if (value3 === null) {
    return not_a_map_error();
  } else if (Object.getPrototypeOf(value3) == Object.prototype) {
    return try_get_field(value3, name, () => new Ok(new None()));
  } else {
    return try_get_field(value3, name, not_a_map_error);
  }
}
function try_get_field(value3, field3, or_else) {
  try {
    return field3 in value3 ? new Ok(new Some(value3[field3])) : or_else();
  } catch {
    return or_else();
  }
}
function bitwise_and(x, y) {
  return Number(BigInt(x) & BigInt(y));
}
function bitwise_shift_right(x, y) {
  return Number(BigInt(x) >> BigInt(y));
}

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function new$() {
  return new_map();
}
function get(from2, get2) {
  return map_get(from2, get2);
}
function insert(dict, key, value3) {
  return map_insert(key, value3, dict);
}
function from_list_loop(loop$list, loop$initial) {
  while (true) {
    let list = loop$list;
    let initial = loop$initial;
    if (list.hasLength(0)) {
      return initial;
    } else {
      let x = list.head;
      let rest = list.tail;
      loop$list = rest;
      loop$initial = insert(initial, x[0], x[1]);
    }
  }
}
function from_list(list) {
  return from_list_loop(list, new$());
}
function reverse_and_concat(loop$remaining, loop$accumulator) {
  while (true) {
    let remaining = loop$remaining;
    let accumulator = loop$accumulator;
    if (remaining.hasLength(0)) {
      return accumulator;
    } else {
      let item = remaining.head;
      let rest = remaining.tail;
      loop$remaining = rest;
      loop$accumulator = prepend(item, accumulator);
    }
  }
}
function do_keys_loop(loop$list, loop$acc) {
  while (true) {
    let list = loop$list;
    let acc = loop$acc;
    if (list.hasLength(0)) {
      return reverse_and_concat(acc, toList([]));
    } else {
      let first2 = list.head;
      let rest = list.tail;
      loop$list = rest;
      loop$acc = prepend(first2[0], acc);
    }
  }
}
function do_keys(dict) {
  let list_of_pairs = map_to_list(dict);
  return do_keys_loop(list_of_pairs, toList([]));
}
function keys(dict) {
  return do_keys(dict);
}
function insert_pair(dict, pair) {
  return insert(dict, pair[0], pair[1]);
}
function fold_inserts(loop$new_entries, loop$dict) {
  while (true) {
    let new_entries = loop$new_entries;
    let dict = loop$dict;
    if (new_entries.hasLength(0)) {
      return dict;
    } else {
      let first2 = new_entries.head;
      let rest = new_entries.tail;
      loop$new_entries = rest;
      loop$dict = insert_pair(dict, first2);
    }
  }
}
function do_merge(dict, new_entries) {
  let _pipe = new_entries;
  let _pipe$1 = map_to_list(_pipe);
  return fold_inserts(_pipe$1, dict);
}
function merge(dict, new_entries) {
  return do_merge(dict, new_entries);
}
function fold_loop(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list.hasLength(0)) {
      return initial;
    } else {
      let k = list.head[0];
      let v = list.head[1];
      let rest = list.tail;
      loop$list = rest;
      loop$initial = fun(initial, k, v);
      loop$fun = fun;
    }
  }
}
function fold2(dict, initial, fun) {
  return fold_loop(map_to_list(dict), initial, fun);
}
function do_map_values(f, dict) {
  let f$1 = (dict2, k, v) => {
    return insert(dict2, k, f(k, v));
  };
  return fold2(dict, new$(), f$1);
}
function map_values(dict, fun) {
  return do_map_values(fun, dict);
}

// build/dev/javascript/gleam_stdlib/gleam/io.mjs
function println(string3) {
  return console_log(string3);
}

// build/dev/javascript/gleam_stdlib/gleam/uri.mjs
var Uri = class extends CustomType {
  constructor(scheme, userinfo, host, port, path2, query, fragment) {
    super();
    this.scheme = scheme;
    this.userinfo = userinfo;
    this.host = host;
    this.port = port;
    this.path = path2;
    this.query = query;
    this.fragment = fragment;
  }
};
function remove_dot_segments_loop(loop$input, loop$accumulator) {
  while (true) {
    let input4 = loop$input;
    let accumulator = loop$accumulator;
    if (input4.hasLength(0)) {
      return reverse(accumulator);
    } else {
      let segment = input4.head;
      let rest = input4.tail;
      let accumulator$1 = (() => {
        if (segment === "") {
          let accumulator$12 = accumulator;
          return accumulator$12;
        } else if (segment === ".") {
          let accumulator$12 = accumulator;
          return accumulator$12;
        } else if (segment === ".." && accumulator.hasLength(0)) {
          return toList([]);
        } else if (segment === ".." && accumulator.atLeastLength(1)) {
          let accumulator$12 = accumulator.tail;
          return accumulator$12;
        } else {
          let segment$1 = segment;
          let accumulator$12 = accumulator;
          return prepend(segment$1, accumulator$12);
        }
      })();
      loop$input = rest;
      loop$accumulator = accumulator$1;
    }
  }
}
function remove_dot_segments(input4) {
  return remove_dot_segments_loop(input4, toList([]));
}
function path_segments(path2) {
  return remove_dot_segments(split3(path2, "/"));
}

// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}

// build/dev/javascript/lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(all) {
    super();
    this.all = all;
  }
};
function custom(run) {
  return new Effect(
    toList([
      (actions) => {
        return run(actions.dispatch, actions.emit, actions.select, actions.root);
      }
    ])
  );
}
function from(effect) {
  return custom((dispatch, _, _1, _2) => {
    return effect(dispatch);
  });
}
function none() {
  return new Effect(toList([]));
}
function batch(effects) {
  return new Effect(
    fold(
      effects,
      toList([]),
      (b, _use1) => {
        let a2 = _use1.all;
        return append(b, a2);
      }
    )
  );
}

// build/dev/javascript/lustre/lustre/internals/vdom.mjs
var Text = class extends CustomType {
  constructor(content) {
    super();
    this.content = content;
  }
};
var Element = class extends CustomType {
  constructor(key, namespace2, tag2, attrs, children2, self_closing, void$) {
    super();
    this.key = key;
    this.namespace = namespace2;
    this.tag = tag2;
    this.attrs = attrs;
    this.children = children2;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Map2 = class extends CustomType {
  constructor(subtree) {
    super();
    this.subtree = subtree;
  }
};
var Attribute = class extends CustomType {
  constructor(x0, x1, as_property) {
    super();
    this[0] = x0;
    this[1] = x1;
    this.as_property = as_property;
  }
};
var Event = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function attribute_to_event_handler(attribute2) {
  if (attribute2 instanceof Attribute) {
    return new Error(void 0);
  } else {
    let name = attribute2[0];
    let handler = attribute2[1];
    let name$1 = drop_start(name, 2);
    return new Ok([name$1, handler]);
  }
}
function do_element_list_handlers(elements3, handlers2, key) {
  return index_fold(
    elements3,
    handlers2,
    (handlers3, element2, index3) => {
      let key$1 = key + "-" + to_string3(index3);
      return do_handlers(element2, handlers3, key$1);
    }
  );
}
function do_handlers(loop$element, loop$handlers, loop$key) {
  while (true) {
    let element2 = loop$element;
    let handlers2 = loop$handlers;
    let key = loop$key;
    if (element2 instanceof Text) {
      return handlers2;
    } else if (element2 instanceof Map2) {
      let subtree = element2.subtree;
      loop$element = subtree();
      loop$handlers = handlers2;
      loop$key = key;
    } else {
      let attrs = element2.attrs;
      let children2 = element2.children;
      let handlers$1 = fold(
        attrs,
        handlers2,
        (handlers3, attr) => {
          let $ = attribute_to_event_handler(attr);
          if ($.isOk()) {
            let name = $[0][0];
            let handler = $[0][1];
            return insert(handlers3, key + "-" + name, handler);
          } else {
            return handlers3;
          }
        }
      );
      return do_element_list_handlers(children2, handlers$1, key);
    }
  }
}
function handlers(element2) {
  return do_handlers(element2, new$(), "0");
}

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute(name, value3) {
  return new Attribute(name, identity(value3), false);
}
function property(name, value3) {
  return new Attribute(name, identity(value3), true);
}
function on(name, handler) {
  return new Event("on" + name, handler);
}
function style(properties) {
  return attribute(
    "style",
    fold(
      properties,
      "",
      (styles, _use1) => {
        let name$1 = _use1[0];
        let value$1 = _use1[1];
        return styles + name$1 + ":" + value$1 + ";";
      }
    )
  );
}
function class$(name) {
  return attribute("class", name);
}
function none2() {
  return class$("");
}
function id(name) {
  return attribute("id", name);
}
function type_(name) {
  return attribute("type", name);
}
function value(val) {
  return attribute("value", val);
}
function placeholder(text3) {
  return attribute("placeholder", text3);
}
function href(uri) {
  return attribute("href", uri);
}
function src(uri) {
  return attribute("src", uri);
}
function height(val) {
  return property("height", val);
}
function width(val) {
  return property("width", val);
}
function alt(text3) {
  return attribute("alt", text3);
}

// build/dev/javascript/lustre/lustre/element.mjs
function element(tag2, attrs, children2) {
  if (tag2 === "area") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "base") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "br") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "col") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "embed") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "hr") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "img") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "input") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "link") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "meta") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "param") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "source") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "track") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "wbr") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else {
    return new Element("", "", tag2, attrs, children2, false, false);
  }
}
function namespaced(namespace2, tag2, attrs, children2) {
  return new Element("", namespace2, tag2, attrs, children2, false, false);
}
function text(content) {
  return new Text(content);
}
function none3() {
  return new Text("");
}

// build/dev/javascript/gleam_stdlib/gleam/set.mjs
var Set2 = class extends CustomType {
  constructor(dict) {
    super();
    this.dict = dict;
  }
};
function new$3() {
  return new Set2(new$());
}

// build/dev/javascript/lustre/lustre/internals/patch.mjs
var Diff = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Emit = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Init = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function is_empty_element_diff(diff2) {
  return isEqual(diff2.created, new$()) && isEqual(
    diff2.removed,
    new$3()
  ) && isEqual(diff2.updated, new$());
}

// build/dev/javascript/lustre/lustre/internals/runtime.mjs
var Attrs = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Batch = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Debug = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Dispatch = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Emit2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Event2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Shutdown = class extends CustomType {
};
var Subscribe = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Unsubscribe = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var ForceModel = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};

// build/dev/javascript/lustre/vdom.ffi.mjs
if (globalThis.customElements && !globalThis.customElements.get("lustre-fragment")) {
  globalThis.customElements.define(
    "lustre-fragment",
    class LustreFragment extends HTMLElement {
      constructor() {
        super();
      }
    }
  );
}
function morph(prev, next, dispatch) {
  let out;
  let stack3 = [{ prev, next, parent: prev.parentNode }];
  while (stack3.length) {
    let { prev: prev2, next: next2, parent } = stack3.pop();
    while (next2.subtree !== void 0)
      next2 = next2.subtree();
    if (next2.content !== void 0) {
      if (!prev2) {
        const created = document.createTextNode(next2.content);
        parent.appendChild(created);
        out ??= created;
      } else if (prev2.nodeType === Node.TEXT_NODE) {
        if (prev2.textContent !== next2.content)
          prev2.textContent = next2.content;
        out ??= prev2;
      } else {
        const created = document.createTextNode(next2.content);
        parent.replaceChild(created, prev2);
        out ??= created;
      }
    } else if (next2.tag !== void 0) {
      const created = createElementNode({
        prev: prev2,
        next: next2,
        dispatch,
        stack: stack3
      });
      if (!prev2) {
        parent.appendChild(created);
      } else if (prev2 !== created) {
        parent.replaceChild(created, prev2);
      }
      out ??= created;
    }
  }
  return out;
}
function createElementNode({ prev, next, dispatch, stack: stack3 }) {
  const namespace2 = next.namespace || "http://www.w3.org/1999/xhtml";
  const canMorph = prev && prev.nodeType === Node.ELEMENT_NODE && prev.localName === next.tag && prev.namespaceURI === (next.namespace || "http://www.w3.org/1999/xhtml");
  const el = canMorph ? prev : namespace2 ? document.createElementNS(namespace2, next.tag) : document.createElement(next.tag);
  let handlersForEl;
  if (!registeredHandlers.has(el)) {
    const emptyHandlers = /* @__PURE__ */ new Map();
    registeredHandlers.set(el, emptyHandlers);
    handlersForEl = emptyHandlers;
  } else {
    handlersForEl = registeredHandlers.get(el);
  }
  const prevHandlers = canMorph ? new Set(handlersForEl.keys()) : null;
  const prevAttributes = canMorph ? new Set(Array.from(prev.attributes, (a2) => a2.name)) : null;
  let className = null;
  let style3 = null;
  let innerHTML = null;
  if (canMorph && next.tag === "textarea") {
    const innertText = next.children[Symbol.iterator]().next().value?.content;
    if (innertText !== void 0)
      el.value = innertText;
  }
  const delegated = [];
  for (const attr of next.attrs) {
    const name = attr[0];
    const value3 = attr[1];
    if (attr.as_property) {
      if (el[name] !== value3)
        el[name] = value3;
      if (canMorph)
        prevAttributes.delete(name);
    } else if (name.startsWith("on")) {
      const eventName = name.slice(2);
      const callback = dispatch(value3, eventName === "input");
      if (!handlersForEl.has(eventName)) {
        el.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      if (canMorph)
        prevHandlers.delete(eventName);
    } else if (name.startsWith("data-lustre-on-")) {
      const eventName = name.slice(15);
      const callback = dispatch(lustreServerEventHandler);
      if (!handlersForEl.has(eventName)) {
        el.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      el.setAttribute(name, value3);
      if (canMorph) {
        prevHandlers.delete(eventName);
        prevAttributes.delete(name);
      }
    } else if (name.startsWith("delegate:data-") || name.startsWith("delegate:aria-")) {
      el.setAttribute(name, value3);
      delegated.push([name.slice(10), value3]);
    } else if (name === "class") {
      className = className === null ? value3 : className + " " + value3;
    } else if (name === "style") {
      style3 = style3 === null ? value3 : style3 + value3;
    } else if (name === "dangerous-unescaped-html") {
      innerHTML = value3;
    } else {
      if (el.getAttribute(name) !== value3)
        el.setAttribute(name, value3);
      if (name === "value" || name === "selected")
        el[name] = value3;
      if (canMorph)
        prevAttributes.delete(name);
    }
  }
  if (className !== null) {
    el.setAttribute("class", className);
    if (canMorph)
      prevAttributes.delete("class");
  }
  if (style3 !== null) {
    el.setAttribute("style", style3);
    if (canMorph)
      prevAttributes.delete("style");
  }
  if (canMorph) {
    for (const attr of prevAttributes) {
      el.removeAttribute(attr);
    }
    for (const eventName of prevHandlers) {
      handlersForEl.delete(eventName);
      el.removeEventListener(eventName, lustreGenericEventHandler);
    }
  }
  if (next.tag === "slot") {
    window.queueMicrotask(() => {
      for (const child of el.assignedElements()) {
        for (const [name, value3] of delegated) {
          if (!child.hasAttribute(name)) {
            child.setAttribute(name, value3);
          }
        }
      }
    });
  }
  if (next.key !== void 0 && next.key !== "") {
    el.setAttribute("data-lustre-key", next.key);
  } else if (innerHTML !== null) {
    el.innerHTML = innerHTML;
    return el;
  }
  let prevChild = el.firstChild;
  let seenKeys = null;
  let keyedChildren = null;
  let incomingKeyedChildren = null;
  let firstChild = children(next).next().value;
  if (canMorph && firstChild !== void 0 && // Explicit checks are more verbose but truthy checks force a bunch of comparisons
  // we don't care about: it's never gonna be a number etc.
  firstChild.key !== void 0 && firstChild.key !== "") {
    seenKeys = /* @__PURE__ */ new Set();
    keyedChildren = getKeyedChildren(prev);
    incomingKeyedChildren = getKeyedChildren(next);
    for (const child of children(next)) {
      prevChild = diffKeyedChild(
        prevChild,
        child,
        el,
        stack3,
        incomingKeyedChildren,
        keyedChildren,
        seenKeys
      );
    }
  } else {
    for (const child of children(next)) {
      stack3.unshift({ prev: prevChild, next: child, parent: el });
      prevChild = prevChild?.nextSibling;
    }
  }
  while (prevChild) {
    const next2 = prevChild.nextSibling;
    el.removeChild(prevChild);
    prevChild = next2;
  }
  return el;
}
var registeredHandlers = /* @__PURE__ */ new WeakMap();
function lustreGenericEventHandler(event2) {
  const target = event2.currentTarget;
  if (!registeredHandlers.has(target)) {
    target.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  const handlersForEventTarget = registeredHandlers.get(target);
  if (!handlersForEventTarget.has(event2.type)) {
    target.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  handlersForEventTarget.get(event2.type)(event2);
}
function lustreServerEventHandler(event2) {
  const el = event2.currentTarget;
  const tag2 = el.getAttribute(`data-lustre-on-${event2.type}`);
  const data = JSON.parse(el.getAttribute("data-lustre-data") || "{}");
  const include = JSON.parse(el.getAttribute("data-lustre-include") || "[]");
  switch (event2.type) {
    case "input":
    case "change":
      include.push("target.value");
      break;
  }
  return {
    tag: tag2,
    data: include.reduce(
      (data2, property2) => {
        const path2 = property2.split(".");
        for (let i = 0, o = data2, e = event2; i < path2.length; i++) {
          if (i === path2.length - 1) {
            o[path2[i]] = e[path2[i]];
          } else {
            o[path2[i]] ??= {};
            e = e[path2[i]];
            o = o[path2[i]];
          }
        }
        return data2;
      },
      { data }
    )
  };
}
function getKeyedChildren(el) {
  const keyedChildren = /* @__PURE__ */ new Map();
  if (el) {
    for (const child of children(el)) {
      const key = child?.key || child?.getAttribute?.("data-lustre-key");
      if (key)
        keyedChildren.set(key, child);
    }
  }
  return keyedChildren;
}
function diffKeyedChild(prevChild, child, el, stack3, incomingKeyedChildren, keyedChildren, seenKeys) {
  while (prevChild && !incomingKeyedChildren.has(prevChild.getAttribute("data-lustre-key"))) {
    const nextChild = prevChild.nextSibling;
    el.removeChild(prevChild);
    prevChild = nextChild;
  }
  if (keyedChildren.size === 0) {
    stack3.unshift({ prev: prevChild, next: child, parent: el });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  if (seenKeys.has(child.key)) {
    console.warn(`Duplicate key found in Lustre vnode: ${child.key}`);
    stack3.unshift({ prev: null, next: child, parent: el });
    return prevChild;
  }
  seenKeys.add(child.key);
  const keyedChild = keyedChildren.get(child.key);
  if (!keyedChild && !prevChild) {
    stack3.unshift({ prev: null, next: child, parent: el });
    return prevChild;
  }
  if (!keyedChild && prevChild !== null) {
    const placeholder2 = document.createTextNode("");
    el.insertBefore(placeholder2, prevChild);
    stack3.unshift({ prev: placeholder2, next: child, parent: el });
    return prevChild;
  }
  if (!keyedChild || keyedChild === prevChild) {
    stack3.unshift({ prev: prevChild, next: child, parent: el });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  el.insertBefore(keyedChild, prevChild);
  stack3.unshift({ prev: keyedChild, next: child, parent: el });
  return prevChild;
}
function* children(element2) {
  for (const child of element2.children) {
    yield* forceChild(child);
  }
}
function* forceChild(element2) {
  if (element2.subtree !== void 0) {
    yield* forceChild(element2.subtree());
  } else {
    yield element2;
  }
}

// build/dev/javascript/lustre/lustre.ffi.mjs
var LustreClientApplication = class _LustreClientApplication {
  /**
   * @template Flags
   *
   * @param {object} app
   * @param {(flags: Flags) => [Model, Lustre.Effect<Msg>]} app.init
   * @param {(msg: Msg, model: Model) => [Model, Lustre.Effect<Msg>]} app.update
   * @param {(model: Model) => Lustre.Element<Msg>} app.view
   * @param {string | HTMLElement} selector
   * @param {Flags} flags
   *
   * @returns {Gleam.Ok<(action: Lustre.Action<Lustre.Client, Msg>>) => void>}
   */
  static start({ init: init4, update: update2, view: view2 }, selector, flags) {
    if (!is_browser())
      return new Error(new NotABrowser());
    const root = selector instanceof HTMLElement ? selector : document.querySelector(selector);
    if (!root)
      return new Error(new ElementNotFound(selector));
    const app2 = new _LustreClientApplication(root, init4(flags), update2, view2);
    return new Ok((action) => app2.send(action));
  }
  /**
   * @param {Element} root
   * @param {[Model, Lustre.Effect<Msg>]} init
   * @param {(model: Model, msg: Msg) => [Model, Lustre.Effect<Msg>]} update
   * @param {(model: Model) => Lustre.Element<Msg>} view
   *
   * @returns {LustreClientApplication}
   */
  constructor(root, [init4, effects], update2, view2) {
    this.root = root;
    this.#model = init4;
    this.#update = update2;
    this.#view = view2;
    this.#tickScheduled = window.requestAnimationFrame(
      () => this.#tick(effects.all.toArray(), true)
    );
  }
  /** @type {Element} */
  root;
  /**
   * @param {Lustre.Action<Lustre.Client, Msg>} action
   *
   * @returns {void}
   */
  send(action) {
    if (action instanceof Debug) {
      if (action[0] instanceof ForceModel) {
        this.#tickScheduled = window.cancelAnimationFrame(this.#tickScheduled);
        this.#queue = [];
        this.#model = action[0][0];
        const vdom = this.#view(this.#model);
        const dispatch = (handler, immediate = false) => (event2) => {
          const result = handler(event2);
          if (result instanceof Ok) {
            this.send(new Dispatch(result[0], immediate));
          }
        };
        const prev = this.root.firstChild ?? this.root.appendChild(document.createTextNode(""));
        morph(prev, vdom, dispatch);
      }
    } else if (action instanceof Dispatch) {
      const msg = action[0];
      const immediate = action[1] ?? false;
      this.#queue.push(msg);
      if (immediate) {
        this.#tickScheduled = window.cancelAnimationFrame(this.#tickScheduled);
        this.#tick();
      } else if (!this.#tickScheduled) {
        this.#tickScheduled = window.requestAnimationFrame(() => this.#tick());
      }
    } else if (action instanceof Emit2) {
      const event2 = action[0];
      const data = action[1];
      this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
    } else if (action instanceof Shutdown) {
      this.#tickScheduled = window.cancelAnimationFrame(this.#tickScheduled);
      this.#model = null;
      this.#update = null;
      this.#view = null;
      this.#queue = null;
      while (this.root.firstChild) {
        this.root.firstChild.remove();
      }
    }
  }
  /** @type {Model} */
  #model;
  /** @type {(model: Model, msg: Msg) => [Model, Lustre.Effect<Msg>]} */
  #update;
  /** @type {(model: Model) => Lustre.Element<Msg>} */
  #view;
  /** @type {Array<Msg>} */
  #queue = [];
  /** @type {number | undefined} */
  #tickScheduled;
  /**
   * @param {Lustre.Effect<Msg>[]} effects
   */
  #tick(effects = []) {
    this.#tickScheduled = void 0;
    this.#flush(effects);
    const vdom = this.#view(this.#model);
    const dispatch = (handler, immediate = false) => (event2) => {
      const result = handler(event2);
      if (result instanceof Ok) {
        this.send(new Dispatch(result[0], immediate));
      }
    };
    const prev = this.root.firstChild ?? this.root.appendChild(document.createTextNode(""));
    morph(prev, vdom, dispatch);
  }
  #flush(effects = []) {
    while (this.#queue.length > 0) {
      const msg = this.#queue.shift();
      const [next, effect] = this.#update(this.#model, msg);
      effects = effects.concat(effect.all.toArray());
      this.#model = next;
    }
    while (effects.length > 0) {
      const effect = effects.shift();
      const dispatch = (msg) => this.send(new Dispatch(msg));
      const emit2 = (event2, data) => this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
      const select = () => {
      };
      const root = this.root;
      effect({ dispatch, emit: emit2, select, root });
    }
    if (this.#queue.length > 0) {
      this.#flush(effects);
    }
  }
};
var start = LustreClientApplication.start;
var LustreServerApplication = class _LustreServerApplication {
  static start({ init: init4, update: update2, view: view2, on_attribute_change }, flags) {
    const app2 = new _LustreServerApplication(
      init4(flags),
      update2,
      view2,
      on_attribute_change
    );
    return new Ok((action) => app2.send(action));
  }
  constructor([model, effects], update2, view2, on_attribute_change) {
    this.#model = model;
    this.#update = update2;
    this.#view = view2;
    this.#html = view2(model);
    this.#onAttributeChange = on_attribute_change;
    this.#renderers = /* @__PURE__ */ new Map();
    this.#handlers = handlers(this.#html);
    this.#tick(effects.all.toArray());
  }
  send(action) {
    if (action instanceof Attrs) {
      for (const attr of action[0]) {
        const decoder = this.#onAttributeChange.get(attr[0]);
        if (!decoder)
          continue;
        const msg = decoder(attr[1]);
        if (msg instanceof Error)
          continue;
        this.#queue.push(msg);
      }
      this.#tick();
    } else if (action instanceof Batch) {
      this.#queue = this.#queue.concat(action[0].toArray());
      this.#tick(action[1].all.toArray());
    } else if (action instanceof Debug) {
    } else if (action instanceof Dispatch) {
      this.#queue.push(action[0]);
      this.#tick();
    } else if (action instanceof Emit2) {
      const event2 = new Emit(action[0], action[1]);
      for (const [_, renderer] of this.#renderers) {
        renderer(event2);
      }
    } else if (action instanceof Event2) {
      const handler = this.#handlers.get(action[0]);
      if (!handler)
        return;
      const msg = handler(action[1]);
      if (msg instanceof Error)
        return;
      this.#queue.push(msg[0]);
      this.#tick();
    } else if (action instanceof Subscribe) {
      const attrs = keys(this.#onAttributeChange);
      const patch = new Init(attrs, this.#html);
      this.#renderers = this.#renderers.set(action[0], action[1]);
      action[1](patch);
    } else if (action instanceof Unsubscribe) {
      this.#renderers = this.#renderers.delete(action[0]);
    }
  }
  #model;
  #update;
  #queue;
  #view;
  #html;
  #renderers;
  #handlers;
  #onAttributeChange;
  #tick(effects = []) {
    this.#flush(effects);
    const vdom = this.#view(this.#model);
    const diff2 = elements(this.#html, vdom);
    if (!is_empty_element_diff(diff2)) {
      const patch = new Diff(diff2);
      for (const [_, renderer] of this.#renderers) {
        renderer(patch);
      }
    }
    this.#html = vdom;
    this.#handlers = diff2.handlers;
  }
  #flush(effects = []) {
    while (this.#queue.length > 0) {
      const msg = this.#queue.shift();
      const [next, effect] = this.#update(this.#model, msg);
      effects = effects.concat(effect.all.toArray());
      this.#model = next;
    }
    while (effects.length > 0) {
      const effect = effects.shift();
      const dispatch = (msg) => this.send(new Dispatch(msg));
      const emit2 = (event2, data) => this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
      const select = () => {
      };
      const root = null;
      effect({ dispatch, emit: emit2, select, root });
    }
    if (this.#queue.length > 0) {
      this.#flush(effects);
    }
  }
};
var start_server_application = LustreServerApplication.start;
var is_browser = () => globalThis.window && window.document;

// build/dev/javascript/lustre/lustre.mjs
var App = class extends CustomType {
  constructor(init4, update2, view2, on_attribute_change) {
    super();
    this.init = init4;
    this.update = update2;
    this.view = view2;
    this.on_attribute_change = on_attribute_change;
  }
};
var ElementNotFound = class extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
};
var NotABrowser = class extends CustomType {
};
function application(init4, update2, view2) {
  return new App(init4, update2, view2, new None());
}
function start2(app2, selector, flags) {
  return guard(
    !is_browser(),
    new Error(new NotABrowser()),
    () => {
      return start(app2, selector, flags);
    }
  );
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function text2(content) {
  return text(content);
}
function style2(attrs, css) {
  return element("style", attrs, toList([text2(css)]));
}
function h1(attrs, children2) {
  return element("h1", attrs, children2);
}
function nav(attrs, children2) {
  return element("nav", attrs, children2);
}
function div(attrs, children2) {
  return element("div", attrs, children2);
}
function hr(attrs) {
  return element("hr", attrs, toList([]));
}
function p(attrs, children2) {
  return element("p", attrs, children2);
}
function a(attrs, children2) {
  return element("a", attrs, children2);
}
function em(attrs, children2) {
  return element("em", attrs, children2);
}
function strong(attrs, children2) {
  return element("strong", attrs, children2);
}
function img(attrs) {
  return element("img", attrs, toList([]));
}
function svg(attrs, children2) {
  return namespaced("http://www.w3.org/2000/svg", "svg", attrs, children2);
}
function button(attrs, children2) {
  return element("button", attrs, children2);
}
function input(attrs) {
  return element("input", attrs, toList([]));
}

// build/dev/javascript/lustre_ui/lustre/ui/button.mjs
function button2(attributes, children2) {
  return button(
    prepend(
      class$("lustre-ui-button"),
      prepend(type_("button"), attributes)
    ),
    children2
  );
}
function solid() {
  return class$("solid");
}
function outline() {
  return class$("outline");
}
function error() {
  return attribute("data-variant", "error");
}
function warning() {
  return attribute("data-variant", "warning");
}
function success() {
  return attribute("data-variant", "success");
}
function info() {
  return attribute("data-variant", "info");
}

// build/dev/javascript/lustre_ui/lustre/ui/centre.mjs
function of(element2, attributes, children2) {
  return element2(
    prepend(class$("lustre-ui-centre"), attributes),
    toList([children2])
  );
}
function centre(attributes, children2) {
  return of(div, attributes, children2);
}
function inline() {
  return class$("inline");
}

// build/dev/javascript/gleam_community_colour/gleam_community/colour.mjs
var Rgba = class extends CustomType {
  constructor(r, g, b, a2) {
    super();
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a2;
  }
};
function valid_colour_value(c) {
  let $ = c > 1 || c < 0;
  if ($) {
    return new Error(void 0);
  } else {
    return new Ok(c);
  }
}
function hue_to_rgb(hue, m1, m2) {
  let h = (() => {
    if (hue < 0) {
      return hue + 1;
    } else if (hue > 1) {
      return hue - 1;
    } else {
      return hue;
    }
  })();
  let h_t_6 = h * 6;
  let h_t_2 = h * 2;
  let h_t_3 = h * 3;
  if (h_t_6 < 1) {
    return m1 + (m2 - m1) * h * 6;
  } else if (h_t_2 < 1) {
    return m2;
  } else if (h_t_3 < 2) {
    return m1 + (m2 - m1) * (divideFloat(2, 3) - h) * 6;
  } else {
    return m1;
  }
}
function hsla_to_rgba(h, s, l, a2) {
  let m2 = (() => {
    let $ = l <= 0.5;
    if ($) {
      return l * (s + 1);
    } else {
      return l + s - l * s;
    }
  })();
  let m1 = l * 2 - m2;
  let r = hue_to_rgb(h + divideFloat(1, 3), m1, m2);
  let g = hue_to_rgb(h, m1, m2);
  let b = hue_to_rgb(h - divideFloat(1, 3), m1, m2);
  return [r, g, b, a2];
}
function from_rgb255(red2, green2, blue2) {
  return then$(
    (() => {
      let _pipe = red2;
      let _pipe$1 = to_float(_pipe);
      let _pipe$2 = divide(_pipe$1, 255);
      return then$(_pipe$2, valid_colour_value);
    })(),
    (r) => {
      return then$(
        (() => {
          let _pipe = green2;
          let _pipe$1 = to_float(_pipe);
          let _pipe$2 = divide(_pipe$1, 255);
          return then$(_pipe$2, valid_colour_value);
        })(),
        (g) => {
          return then$(
            (() => {
              let _pipe = blue2;
              let _pipe$1 = to_float(_pipe);
              let _pipe$2 = divide(_pipe$1, 255);
              return then$(_pipe$2, valid_colour_value);
            })(),
            (b) => {
              return new Ok(new Rgba(r, g, b, 1));
            }
          );
        }
      );
    }
  );
}
function from_rgb_hex(hex) {
  let $ = hex > 16777215 || hex < 0;
  if ($) {
    return new Error(void 0);
  } else {
    let r = (() => {
      let _pipe = bitwise_shift_right(hex, 16);
      return bitwise_and(_pipe, 255);
    })();
    let g = (() => {
      let _pipe = bitwise_shift_right(hex, 8);
      return bitwise_and(_pipe, 255);
    })();
    let b = bitwise_and(hex, 255);
    return from_rgb255(r, g, b);
  }
}
function to_rgba(colour) {
  if (colour instanceof Rgba) {
    let r = colour.r;
    let g = colour.g;
    let b = colour.b;
    let a2 = colour.a;
    return [r, g, b, a2];
  } else {
    let h = colour.h;
    let s = colour.s;
    let l = colour.l;
    let a2 = colour.a;
    return hsla_to_rgba(h, s, l, a2);
  }
}
function to_css_rgba_string(colour) {
  let $ = to_rgba(colour);
  let r = $[0];
  let g = $[1];
  let b = $[2];
  let a2 = $[3];
  let percent = (x) => {
    let $1 = (() => {
      let _pipe = x;
      let _pipe$1 = multiply(_pipe, 1e4);
      let _pipe$2 = round2(_pipe$1);
      let _pipe$3 = to_float(_pipe$2);
      return divide(_pipe$3, 100);
    })();
    if (!$1.isOk()) {
      throw makeError(
        "assignment_no_match",
        "gleam_community/colour",
        706,
        "",
        "Assignment pattern did not match",
        { value: $1 }
      );
    }
    let p2 = $1[0];
    return p2;
  };
  let round_to = (x) => {
    let $1 = (() => {
      let _pipe = x;
      let _pipe$1 = multiply(_pipe, 1e3);
      let _pipe$2 = round2(_pipe$1);
      let _pipe$3 = to_float(_pipe$2);
      return divide(_pipe$3, 1e3);
    })();
    if (!$1.isOk()) {
      throw makeError(
        "assignment_no_match",
        "gleam_community/colour",
        718,
        "",
        "Assignment pattern did not match",
        { value: $1 }
      );
    }
    let r$1 = $1[0];
    return r$1;
  };
  return join2(
    toList([
      "rgba(",
      to_string(percent(r)) + "%,",
      to_string(percent(g)) + "%,",
      to_string(percent(b)) + "%,",
      to_string(round_to(a2)),
      ")"
    ]),
    ""
  );
}

// build/dev/javascript/lustre_ui/lustre/ui/colour.mjs
var Scale = class extends CustomType {
  constructor(app_background, app_background_subtle, app_border, element_background, element_background_hover, element_background_strong, element_border_subtle, element_border_strong, solid_background, solid_background_hover, text_high_contrast2, text_low_contrast) {
    super();
    this.app_background = app_background;
    this.app_background_subtle = app_background_subtle;
    this.app_border = app_border;
    this.element_background = element_background;
    this.element_background_hover = element_background_hover;
    this.element_background_strong = element_background_strong;
    this.element_border_subtle = element_border_subtle;
    this.element_border_strong = element_border_strong;
    this.solid_background = solid_background;
    this.solid_background_hover = solid_background_hover;
    this.text_high_contrast = text_high_contrast2;
    this.text_low_contrast = text_low_contrast;
  }
};
function from_radix_scale(a2, b, c, d, e, f, g, h, i, j, k, l) {
  let $ = from_rgb_hex(a2);
  if (!$.isOk()) {
    throw makeError(
      "assignment_no_match",
      "lustre/ui/colour",
      56,
      "from_radix_scale",
      "Assignment pattern did not match",
      { value: $ }
    );
  }
  let app_background = $[0];
  let $1 = from_rgb_hex(b);
  if (!$1.isOk()) {
    throw makeError(
      "assignment_no_match",
      "lustre/ui/colour",
      57,
      "from_radix_scale",
      "Assignment pattern did not match",
      { value: $1 }
    );
  }
  let app_background_subtle = $1[0];
  let $2 = from_rgb_hex(c);
  if (!$2.isOk()) {
    throw makeError(
      "assignment_no_match",
      "lustre/ui/colour",
      58,
      "from_radix_scale",
      "Assignment pattern did not match",
      { value: $2 }
    );
  }
  let app_border = $2[0];
  let $3 = from_rgb_hex(d);
  if (!$3.isOk()) {
    throw makeError(
      "assignment_no_match",
      "lustre/ui/colour",
      59,
      "from_radix_scale",
      "Assignment pattern did not match",
      { value: $3 }
    );
  }
  let element_background = $3[0];
  let $4 = from_rgb_hex(e);
  if (!$4.isOk()) {
    throw makeError(
      "assignment_no_match",
      "lustre/ui/colour",
      60,
      "from_radix_scale",
      "Assignment pattern did not match",
      { value: $4 }
    );
  }
  let element_background_hover = $4[0];
  let $5 = from_rgb_hex(f);
  if (!$5.isOk()) {
    throw makeError(
      "assignment_no_match",
      "lustre/ui/colour",
      61,
      "from_radix_scale",
      "Assignment pattern did not match",
      { value: $5 }
    );
  }
  let element_background_strong = $5[0];
  let $6 = from_rgb_hex(g);
  if (!$6.isOk()) {
    throw makeError(
      "assignment_no_match",
      "lustre/ui/colour",
      62,
      "from_radix_scale",
      "Assignment pattern did not match",
      { value: $6 }
    );
  }
  let element_border_strong = $6[0];
  let $7 = from_rgb_hex(h);
  if (!$7.isOk()) {
    throw makeError(
      "assignment_no_match",
      "lustre/ui/colour",
      63,
      "from_radix_scale",
      "Assignment pattern did not match",
      { value: $7 }
    );
  }
  let element_border_subtle = $7[0];
  let $8 = from_rgb_hex(i);
  if (!$8.isOk()) {
    throw makeError(
      "assignment_no_match",
      "lustre/ui/colour",
      64,
      "from_radix_scale",
      "Assignment pattern did not match",
      { value: $8 }
    );
  }
  let solid_background = $8[0];
  let $9 = from_rgb_hex(j);
  if (!$9.isOk()) {
    throw makeError(
      "assignment_no_match",
      "lustre/ui/colour",
      65,
      "from_radix_scale",
      "Assignment pattern did not match",
      { value: $9 }
    );
  }
  let solid_background_hover = $9[0];
  let $10 = from_rgb_hex(k);
  if (!$10.isOk()) {
    throw makeError(
      "assignment_no_match",
      "lustre/ui/colour",
      66,
      "from_radix_scale",
      "Assignment pattern did not match",
      { value: $10 }
    );
  }
  let text_high_contrast2 = $10[0];
  let $11 = from_rgb_hex(l);
  if (!$11.isOk()) {
    throw makeError(
      "assignment_no_match",
      "lustre/ui/colour",
      67,
      "from_radix_scale",
      "Assignment pattern did not match",
      { value: $11 }
    );
  }
  let text_low_contrast = $11[0];
  return new Scale(
    app_background,
    app_background_subtle,
    app_border,
    element_background,
    element_background_hover,
    element_background_strong,
    element_border_subtle,
    element_border_strong,
    solid_background,
    solid_background_hover,
    text_high_contrast2,
    text_low_contrast
  );
}
function grey() {
  return from_radix_scale(
    16579836,
    16382457,
    14540253,
    15856113,
    15461355,
    15000804,
    12303291,
    13948116,
    9276813,
    8421504,
    2105376,
    6579300
  );
}
function yellow() {
  return from_radix_scale(
    16645625,
    16776160,
    15523205,
    16775366,
    16577455,
    16247451,
    13216325,
    14337390,
    16507693,
    16374288,
    4668191,
    7823144
  );
}
function red() {
  return from_radix_scale(
    16776444,
    16775159,
    16369350,
    16773103,
    16770533,
    16636120,
    15437969,
    15969967,
    15026253,
    14236994,
    6559523,
    12986927
  );
}
function purple() {
  return from_radix_scale(
    16710910,
    16644863,
    14929140,
    16380414,
    15984636,
    15588345,
    12489700,
    13874413,
    9326278,
    8668604,
    4202592,
    7944879
  );
}
function blue() {
  return from_radix_scale(
    16514559,
    16120575,
    12048888,
    15595263,
    14807295,
    13559806,
    6205679,
    9881586,
    37375,
    557290,
    1127012,
    747723
  );
}
function green() {
  return from_radix_scale(
    16514812,
    15924469,
    11853764,
    15333870,
    14545892,
    13429719,
    6011276,
    9621164,
    3187820,
    2725732,
    1653549,
    1603918
  );
}

// build/dev/javascript/lustre_ui/lustre/ui/stack.mjs
function of2(element2, attributes, children2) {
  return element2(
    prepend(class$("lustre-ui-stack"), attributes),
    children2
  );
}
function stack(attributes, children2) {
  return of2(div, attributes, children2);
}

// build/dev/javascript/lustre_ui/lustre/ui/input.mjs
function input2(attributes) {
  return input(
    prepend(class$("lustre-ui-input"), attributes)
  );
}
function primary() {
  return attribute("data-variant", "primary");
}

// build/dev/javascript/lustre_ui/lustre/ui/prose.mjs
function of3(element2, attributes, children2) {
  return element2(
    prepend(class$("lustre-ui-prose"), attributes),
    children2
  );
}
function prose(attributes, children2) {
  return of3(div, attributes, children2);
}
function full() {
  return class$("full");
}

// build/dev/javascript/lustre_ui/lustre/ui.mjs
var Theme = class extends CustomType {
  constructor(primary2, greyscale, error2, warning2, success2, info2) {
    super();
    this.primary = primary2;
    this.greyscale = greyscale;
    this.error = error2;
    this.warning = warning2;
    this.success = success2;
    this.info = info2;
  }
};
var button3 = button2;
var centre2 = centre;
var input3 = input2;
var prose2 = prose;
var stack2 = stack;

// build/dev/javascript/lustre_ui/lustre/ui/styles.mjs
function scale_to_dict(scale, prefix) {
  return from_list(
    toList([
      [
        "$(" + prefix + ".app_background)",
        to_css_rgba_string(scale.app_background)
      ],
      [
        "$(" + prefix + ".app_background_subtle)",
        to_css_rgba_string(scale.app_background_subtle)
      ],
      [
        "$(" + prefix + ".app_border)",
        to_css_rgba_string(scale.app_border)
      ],
      [
        "$(" + prefix + ".element_background)",
        to_css_rgba_string(scale.element_background)
      ],
      [
        "$(" + prefix + ".element_background_hover)",
        to_css_rgba_string(scale.element_background_hover)
      ],
      [
        "$(" + prefix + ".element_background_strong)",
        to_css_rgba_string(scale.element_background_strong)
      ],
      [
        "$(" + prefix + ".element_border_subtle)",
        to_css_rgba_string(scale.element_border_subtle)
      ],
      [
        "$(" + prefix + ".element_border_strong)",
        to_css_rgba_string(scale.element_border_strong)
      ],
      [
        "$(" + prefix + ".solid_background)",
        to_css_rgba_string(scale.solid_background)
      ],
      [
        "$(" + prefix + ".solid_background_hover)",
        to_css_rgba_string(scale.solid_background_hover)
      ],
      [
        "$(" + prefix + ".text_high_contrast)",
        to_css_rgba_string(scale.text_high_contrast)
      ],
      [
        "$(" + prefix + ".text_low_contrast)",
        to_css_rgba_string(scale.text_low_contrast)
      ]
    ])
  );
}
function theme_to_dict(theme2) {
  let _pipe = new$();
  let _pipe$1 = merge(_pipe, scale_to_dict(theme2.primary, "primary"));
  let _pipe$2 = merge(
    _pipe$1,
    scale_to_dict(theme2.greyscale, "greyscale")
  );
  let _pipe$3 = merge(_pipe$2, scale_to_dict(theme2.error, "error"));
  let _pipe$4 = merge(_pipe$3, scale_to_dict(theme2.success, "success"));
  let _pipe$5 = merge(_pipe$4, scale_to_dict(theme2.warning, "warning"));
  return merge(_pipe$5, scale_to_dict(theme2.info, "info"));
}
var theme_css = "\n:root {\n  --primary-app-background: $(primary.app_background);\n  --primary-app-background-subtle: $(primary.app_background_subtle);\n  --primary-app-border: $(primary.app_border);\n  --primary-element-background: $(primary.element_background);\n  --primary-element-background-hover: $(primary.element_background_hover);\n  --primary-element-background-strong: $(primary.element_background_strong);\n  --primary-element-border-subtle: $(primary.element_border_subtle);\n  --primary-element-border-strong: $(primary.element_border_strong);\n  --primary-solid-background: $(primary.solid_background);\n  --primary-solid-background-hover: $(primary.solid_background_hover);\n  --primary-text-high-contrast: $(primary.text_high_contrast);\n  --primary-text-low-contrast: $(primary.text_low_contrast);\n\n  --greyscale-app-background: $(greyscale.app_background);\n  --greyscale-app-background-subtle: $(greyscale.app_background_subtle);\n  --greyscale-app-border: $(greyscale.app_border);\n  --greyscale-element-background: $(greyscale.element_background);\n  --greyscale-element-background-hover: $(greyscale.element_background_hover);\n  --greyscale-element-background-strong: $(greyscale.element_background_strong);\n  --greyscale-element-border-subtle: $(greyscale.element_border_subtle);\n  --greyscale-element-border-strong: $(greyscale.element_border_strong);\n  --greyscale-solid-background: $(greyscale.solid_background);\n  --greyscale-solid-background-hover: $(greyscale.solid_background_hover);\n  --greyscale-text-high-contrast: $(greyscale.text_high_contrast);\n  --greyscale-text-low-contrast: $(greyscale.text_low_contrast);\n\n  --error-app-background: $(error.app_background);\n  --error-app-background-subtle: $(error.app_background_subtle);\n  --error-app-border: $(error.app_border);\n  --error-element-background: $(error.element_background);\n  --error-element-background-hover: $(error.element_background_hover);\n  --error-element-background-strong: $(error.element_background_strong);\n  --error-element-border-subtle: $(error.element_border_subtle);\n  --error-element-border-strong: $(error.element_border_strong);\n  --error-solid-background: $(error.solid_background);\n  --error-solid-background-hover: $(error.solid_background_hover);\n  --error-text-high-contrast: $(error.text_high_contrast);\n  --error-text-low-contrast: $(error.text_low_contrast);\n\n  --success-app-background: $(success.app_background);\n  --success-app-background-subtle: $(success.app_background_subtle);\n  --success-app-border: $(success.app_border);\n  --success-element-background: $(success.element_background);\n  --success-element-background-hover: $(success.element_background_hover);\n  --success-element-background-strong: $(success.element_background_strong);\n  --success-element-border-subtle: $(success.element_border_subtle);\n  --success-element-border-strong: $(success.element_border_strong);\n  --success-solid-background: $(success.solid_background);\n  --success-solid-background-hover: $(success.solid_background_hover);\n  --success-text-high-contrast: $(success.text_high_contrast);\n  --success-text-low-contrast: $(success.text_low_contrast);\n\n  --warning-app-background: $(warning.app_background);\n  --warning-app-background-subtle: $(warning.app_background_subtle);\n  --warning-app-border: $(warning.app_border);\n  --warning-element-background: $(warning.element_background);\n  --warning-element-background-hover: $(warning.element_background_hover);\n  --warning-element-background-strong: $(warning.element_background_strong);\n  --warning-element-border-subtle: $(warning.element_border_subtle);\n  --warning-element-border-strong: $(warning.element_border_strong);\n  --warning-solid-background: $(warning.solid_background);\n  --warning-solid-background-hover: $(warning.solid_background_hover);\n  --warning-text-high-contrast: $(warning.text_high_contrast);\n  --warning-text-low-contrast: $(warning.text_low_contrast);\n\n  --info-app-background: $(info.app_background);\n  --info-app-background-subtle: $(info.app_background_subtle);\n  --info-app-border: $(info.app_border);\n  --info-element-background: $(info.element_background);\n  --info-element-background-hover: $(info.element_background_hover);\n  --info-element-background-strong: $(info.element_background_strong);\n  --info-element-border-subtle: $(info.element_border_subtle);\n  --info-element-border-strong: $(info.element_border_strong);\n  --info-solid-background: $(info.solid_background);\n  --info-solid-background-hover: $(info.solid_background_hover);\n  --info-text-high-contrast: $(info.text_high_contrast);\n  --info-text-low-contrast: $(info.text_low_contrast);\n}\n";
function theme(theme2) {
  let _pipe = theme_to_dict(theme2);
  let _pipe$1 = fold2(_pipe, theme_css, replace);
  return ((_capture) => {
    return style2(toList([]), _capture);
  })(_pipe$1);
}
var element_css = '\n*,:after,:before{border:0 solid;box-sizing:border-box}html{-webkit-text-size-adjust:100%;font-feature-settings:normal;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;font-variation-settings:normal;line-height:1.5;-moz-tab-size:4;-o-tab-size:4;tab-size:4}body{line-height:inherit;margin:0}hr{border-top-width:1px;color:inherit;height:0}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{border-collapse:collapse;border-color:inherit;text-indent:0}button,input,optgroup,select,textarea{font-feature-settings:inherit;color:inherit;font-family:inherit;font-size:100%;font-variation-settings:inherit;font-weight:inherit;line-height:inherit;margin:0;padding:0}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0}fieldset,legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{color:#9ca3af;opacity:1}input::placeholder,textarea::placeholder{color:#9ca3af;opacity:1}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{height:auto;max-width:100%}[hidden]{display:none}.bg-app{background-color:var(--app-background)}.bg-app-subtle{background-color:var(--app-background-subtle)}.bg-element{background-color:var(--element-background)}.bg-element-hover{background-color:var(--element-background-hover)}.bg-element-strong{background-color:var(--element-background-strong)}.bg-solid{background-color:var(--solid-background)}.bg-solid-hover{background-color:var(--solid-background-hover)}.border-app{border:1px solid var(--app-border)}.border-element-subtle{border:1px solid var(--element-border-subtle)}.border-element-strong{border:1px solid var(--element-border-strong)}.text-high-contrast{color:var(--text-high-contrast)}.text-low-contrast{color:var(--text-low-contrast)}.text-xs{font-size:var(--text-xs)}.text-sm{font-size:var(--text-sm)}.text-md{font-size:var(--text-md)}.text-lg{font-size:var(--text-lg)}.text-xl{font-size:var(--text-xl)}.text-2xl{font-size:var(--text-2xl)}.text-3xl{font-size:var(--text-3xl)}.text-4xl{font-size:var(--text-4xl)}.text-5xl{font-size:var(--text-5xl)}.p-2xs{padding:var(--space-2xs)}.p-xs{padding:var(--space-xs)}.p-sm{padding:var(--space-sm)}.p-md{padding:var(--space-md)}.p-lg{padding:var(--space-lg)}.p-xl{padding:var(--space-xl)}.p-2xl{padding:var(--space-2xl)}.p-3xl{padding:var(--space-3xl)}.p-4xl{padding:var(--space-4xl)}.p-5xl{padding:var(--space-5xl)}.px-2xs{padding-left:var(--space-2xs);padding-right:var(--space-2xs)}.px-xs{padding-left:var(--space-xs);padding-right:var(--space-xs)}.px-sm{padding-left:var(--space-sm);padding-right:var(--space-sm)}.px-md{padding-left:var(--space-md);padding-right:var(--space-md)}.px-lg{padding-left:var(--space-lg);padding-right:var(--space-lg)}.px-xl{padding-left:var(--space-xl);padding-right:var(--space-xl)}.px-2xl{padding-left:var(--space-2xl);padding-right:var(--space-2xl)}.px-3xl{padding-left:var(--space-3xl);padding-right:var(--space-3xl)}.px-4xl{padding-left:var(--space-4xl);padding-right:var(--space-4xl)}.px-5xl{padding-left:var(--space-5xl);padding-right:var(--space-5xl)}.py-2xs{padding-bottom:var(--space-2xs);padding-top:var(--space-2xs)}.py-xs{padding-bottom:var(--space-xs);padding-top:var(--space-xs)}.py-sm{padding-bottom:var(--space-sm);padding-top:var(--space-sm)}.py-md{padding-bottom:var(--space-md);padding-top:var(--space-md)}.py-lg{padding-bottom:var(--space-lg);padding-top:var(--space-lg)}.py-xl{padding-bottom:var(--space-xl);padding-top:var(--space-xl)}.py-2xl{padding-bottom:var(--space-2xl);padding-top:var(--space-2xl)}.py-3xl{padding-bottom:var(--space-3xl);padding-top:var(--space-3xl)}.py-4xl{padding-bottom:var(--space-4xl);padding-top:var(--space-4xl)}.py-5xl{padding-bottom:var(--space-5xl);padding-top:var(--space-5xl)}.pt-2xs{padding-top:var(--space-2xs)}.pt-xs{padding-top:var(--space-xs)}.pt-sm{padding-top:var(--space-sm)}.pt-md{padding-top:var(--space-md)}.pt-lg{padding-top:var(--space-lg)}.pt-xl{padding-top:var(--space-xl)}.pt-2xl{padding-top:var(--space-2xl)}.pt-3xl{padding-top:var(--space-3xl)}.pt-4xl{padding-top:var(--space-4xl)}.pt-5xl{padding-top:var(--space-5xl)}.pr-2xs{padding-right:var(--space-2xs)}.pr-xs{padding-right:var(--space-xs)}.pr-sm{padding-right:var(--space-sm)}.pr-md{padding-right:var(--space-md)}.pr-lg{padding-right:var(--space-lg)}.pr-xl{padding-right:var(--space-xl)}.pr-2xl{padding-right:var(--space-2xl)}.pr-3xl{padding-right:var(--space-3xl)}.pr-4xl{padding-right:var(--space-4xl)}.pr-5xl{padding-right:var(--space-5xl)}.pb-2xs{padding-bottom:var(--space-2xs)}.pb-xs{padding-bottom:var(--space-xs)}.pb-sm{padding-bottom:var(--space-sm)}.pb-md{padding-bottom:var(--space-md)}.pb-lg{padding-bottom:var(--space-lg)}.pb-xl{padding-bottom:var(--space-xl)}.pb-2xl{padding-bottom:var(--space-2xl)}.pb-3xl{padding-bottom:var(--space-3xl)}.pb-4xl{padding-bottom:var(--space-4xl)}.pb-5xl{padding-bottom:var(--space-5xl)}.m-2xs{margin:var(--space-2xs)}.m-xs{margin:var(--space-xs)}.m-sm{margin:var(--space-sm)}.m-md{margin:var(--space-md)}.m-lg{margin:var(--space-lg)}.m-xl{margin:var(--space-xl)}.m-2xl{margin:var(--space-2xl)}.m-3xl{margin:var(--space-3xl)}.m-4xl{margin:var(--space-4xl)}.m-5xl{margin:var(--space-5xl)}.mx-2xs{margin-left:var(--space-2xs);margin-right:var(--space-2xs)}.mx-xs{margin-left:var(--space-xs);margin-right:var(--space-xs)}.mx-sm{margin-left:var(--space-sm);margin-right:var(--space-sm)}.mx-md{margin-left:var(--space-md);margin-right:var(--space-md)}.mx-lg{margin-left:var(--space-lg);margin-right:var(--space-lg)}.mx-xl{margin-left:var(--space-xl);margin-right:var(--space-xl)}.mx-2xl{margin-left:var(--space-2xl);margin-right:var(--space-2xl)}.mx-3xl{margin-left:var(--space-3xl);margin-right:var(--space-3xl)}.mx-4xl{margin-left:var(--space-4xl);margin-right:var(--space-4xl)}.mx-5xl{margin-left:var(--space-5xl);margin-right:var(--space-5xl)}.my-2xs{margin-bottom:var(--space-2xs);margin-top:var(--space-2xs)}.my-xs{margin-bottom:var(--space-xs);margin-top:var(--space-xs)}.my-sm{margin-bottom:var(--space-sm);margin-top:var(--space-sm)}.my-md{margin-bottom:var(--space-md);margin-top:var(--space-md)}.my-lg{margin-bottom:var(--space-lg);margin-top:var(--space-lg)}.my-xl{margin-bottom:var(--space-xl);margin-top:var(--space-xl)}.my-2xl{margin-bottom:var(--space-2xl);margin-top:var(--space-2xl)}.my-3xl{margin-bottom:var(--space-3xl);margin-top:var(--space-3xl)}.my-4xl{margin-bottom:var(--space-4xl);margin-top:var(--space-4xl)}.my-5xl{margin-bottom:var(--space-5xl);margin-top:var(--space-5xl)}.mt-2xs{margin-top:var(--space-2xs)}.mt-xs{margin-top:var(--space-xs)}.mt-sm{margin-top:var(--space-sm)}.mt-md{margin-top:var(--space-md)}.mt-lg{margin-top:var(--space-lg)}.mt-xl{margin-top:var(--space-xl)}.mt-2xl{margin-top:var(--space-2xl)}.mt-3xl{margin-top:var(--space-3xl)}.mt-4xl{margin-top:var(--space-4xl)}.mt-5xl{margin-top:var(--space-5xl)}.mr-2xs{margin-right:var(--space-2xs)}.mr-xs{margin-right:var(--space-xs)}.mr-sm{margin-right:var(--space-sm)}.mr-md{margin-right:var(--space-md)}.mr-lg{margin-right:var(--space-lg)}.mr-xl{margin-right:var(--space-xl)}.mr-2xl{margin-right:var(--space-2xl)}.mr-3xl{margin-right:var(--space-3xl)}.mr-4xl{margin-right:var(--space-4xl)}.mr-5xl{margin-right:var(--space-5xl)}.mb-2xs{margin-bottom:var(--space-2xs)}.mb-xs{margin-bottom:var(--space-xs)}.mb-sm{margin-bottom:var(--space-sm)}.mb-md{margin-bottom:var(--space-md)}.mb-lg{margin-bottom:var(--space-lg)}.mb-xl{margin-bottom:var(--space-xl)}.mb-2xl{margin-bottom:var(--space-2xl)}.mb-3xl{margin-bottom:var(--space-3xl)}.mb-4xl{margin-bottom:var(--space-4xl)}.mb-5xl{margin-bottom:var(--space-5xl)}.ml-2xs{margin-left:var(--space-2xs)}.ml-xs{margin-left:var(--space-xs)}.ml-sm{margin-left:var(--space-sm)}.ml-md{margin-left:var(--space-md)}.ml-lg{margin-left:var(--space-lg)}.ml-xl{margin-left:var(--space-xl)}.ml-2xl{margin-left:var(--space-2xl)}.ml-3xl{margin-left:var(--space-3xl)}.ml-4xl{margin-left:var(--space-4xl)}.ml-5xl{margin-left:var(--space-5xl)}.font-base{font-family:var(--font-base)}.font-alt{font-family:var(--font-alt)}.font-mono{font-family:var(--font-mono)}.shadow-sm{box-shadow:var(--shadow-sm)}.shadow-md{box-shadow:var(--shadow-md)}.shadow-lg{box-shadow:var(--shadow-lg)}:root{--primary-app-background:#fdfdff;--primary-app-background-subtle:#fafaff;--primary-app-border:#d0d0fa;--primary-element-background:#f3f3ff;--primary-element-background-hover:#ebebfe;--primary-element-background-strong:#e0e0fd;--primary-element-border-subtle:#babbf5;--primary-element-border-strong:#9b9ef0;--primary-solid-background:#5b5bd6;--primary-solid-background-hover:#5353ce;--primary-text-high-contrast:#272962;--primary-text-low-contrast:#4747c2;--greyscale-app-background:#fcfcfd;--greyscale-app-background-subtle:#f9f9fb;--greyscale-app-border:#dddde3;--greyscale-element-background:#f2f2f5;--greyscale-element-background-hover:#ebebef;--greyscale-element-background-strong:#e4e4e9;--greyscale-element-border-subtle:#d3d4db;--greyscale-element-border-strong:#b9bbc6;--greyscale-solid-background:#8b8d98;--greyscale-solid-background-hover:#7e808a;--greyscale-text-high-contrast:#1c2024;--greyscale-text-low-contrast:#60646c;--error-app-background:#fffcfc;--error-app-background-subtle:#fff7f7;--error-app-border:#f9c6c6;--error-element-background:#ffefef;--error-element-background-hover:#ffe5e5;--error-element-background-strong:#fdd8d8;--error-element-border-subtle:#f3aeaf;--error-element-border-strong:#eb9091;--error-solid-background:#e5484d;--error-solid-background-hover:#d93d42;--error-text-high-contrast:#641723;--error-text-low-contrast:#c62a2f;--success-app-background:#fbfefc;--success-app-background-subtle:#f2fcf5;--success-app-border:#b4dfc4;--success-element-background:#e9f9ee;--success-element-background-hover:#ddf3e4;--success-element-background-strong:#ccebd7;--success-element-border-subtle:#92ceac;--success-element-border-strong:#5bb98c;--success-solid-background:#30a46c;--success-solid-background-hover:#299764;--success-text-high-contrast:#193b2d;--success-text-low-contrast:#18794e;--warning-app-background:#fdfdf9;--warning-app-background-subtle:#fffbe0;--warning-app-border:#ecdd85;--warning-element-background:#fff8c6;--warning-element-background-hover:#fcf3af;--warning-element-background-strong:#f7ea9b;--warning-element-border-subtle:#dac56e;--warning-element-border-strong:#c9aa45;--warning-solid-background:#fbe32d;--warning-solid-background-hover:#f9da10;--warning-text-high-contrast:#473b1f;--warning-text-low-contrast:#775f28;--info-app-background:#fbfdff;--info-app-background-subtle:#f5faff;--info-app-border:#b7d9f8;--info-element-background:#edf6ff;--info-element-background-hover:#e1f0ff;--info-element-background-strong:#cee7fe;--info-element-border-subtle:#96c7f2;--info-element-border-strong:#5eb0ef;--info-solid-background:#0091ff;--info-solid-background-hover:#0880ea;--info-text-high-contrast:#113264;--info-text-low-contrast:#0b68cb;--app-background:var(--primary-app-background);--app-background-subtle:var(--primary-app-background-subtle);--app-border:var(--primary-app-border);--element-background:var(--primary-element-background);--element-background-hover:var(--primary-element-background-hover);--element-background-strong:var(--primary-element-background-strong);--element-border-subtle:var(--primary-element-border-subtle);--element-border-strong:var(--primary-element-border-strong);--solid-background:var(--primary-solid-background);--solid-background-hover:var(--primary-solid-background-hover);--text-high-contrast:var(--primary-text-high-contrast);--text-low-contrast:var(--primary-text-low-contrast);--text-xs:calc(var(--text-sm)/1.25);--text-sm:calc(var(--text-md)/1.25);--text-md:14px;--text-lg:calc(var(--text-md)*1.25);--text-xl:calc(var(--text-lg)*1.25);--text-2xl:calc(var(--text-xl)*1.25);--text-3xl:calc(var(--text-2xl)*1.25);--text-4xl:calc(var(--text-3xl)*1.25);--text-5xl:calc(var(--text-4xl)*1.25);--space-2xs:0.25rem;--space-xs:0.5rem;--space-sm:0.75rem;--space-md:1rem;--space-lg:1.25rem;--space-xl:2rem;--space-2xl:3.25rem;--space-3xl:5.25rem;--space-4xl:8.5rem;--space-5xl:13.75rem;--font-base:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";--font-alt:ui-serif,Georgia,Cambria,"Times New Roman",Times,serif;--font-mono:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;--border-radius:4px;--shadow-sm:0 1px 2px 0 rgba(0,0,0,.05);--shadow-md:0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -2px rgba(0,0,0,.1);--shadow-lg:0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1)}[data-variant=primary]{--app-background:var(--primary-app-background);--app-background-subtle:var(--primary-app-background-subtle);--app-border:var(--primary-app-border);--element-background:var(--primary-element-background);--element-background-hover:var(--primary-element-background-hover);--element-background-strong:var(--primary-element-background-strong);--element-border-subtle:var(--primary-element-border-subtle);--element-border-strong:var(--primary-element-border-strong);--solid-background:var(--primary-solid-background);--solid-background-hover:var(--primary-solid-background-hover);--text-high-contrast:var(--primary-text-high-contrast);--text-low-contrast:var(--primary-text-low-contrast);color:var(--text-high-contrast)}[data-variant=greyscale]{--app-background:var(--greyscale-app-background);--app-background-subtle:var(--greyscale-app-background-subtle);--app-border:var(--greyscale-app-border);--element-background:var(--greyscale-element-background);--element-background-hover:var(--greyscale-element-background-hover);--element-background-strong:var(--greyscale-element-background-strong);--element-border-subtle:var(--greyscale-element-border-subtle);--element-border-strong:var(--greyscale-element-border-strong);--solid-background:var(--greyscale-solid-background);--solid-background-hover:var(--greyscale-solid-background-hover);--text-high-contrast:var(--greyscale-text-high-contrast);--text-low-contrast:var(--greyscale-text-low-contrast);color:var(--text-high-contrast)}[data-variant=error]{--app-background:var(--error-app-background);--app-background-subtle:var(--error-app-background-subtle);--app-border:var(--error-app-border);--element-background:var(--error-element-background);--element-background-hover:var(--error-element-background-hover);--element-background-strong:var(--error-element-background-strong);--element-border-subtle:var(--error-element-border-subtle);--element-border-strong:var(--error-element-border-strong);--solid-background:var(--error-solid-background);--solid-background-hover:var(--error-solid-background-hover);--text-high-contrast:var(--error-text-high-contrast);--text-low-contrast:var(--error-text-low-contrast);color:var(--text-high-contrast)}[data-variant=success]{--app-background:var(--success-app-background);--app-background-subtle:var(--success-app-background-subtle);--app-border:var(--success-app-border);--element-background:var(--success-element-background);--element-background-hover:var(--success-element-background-hover);--element-background-strong:var(--success-element-background-strong);--element-border-subtle:var(--success-element-border-subtle);--element-border-strong:var(--success-element-border-strong);--solid-background:var(--success-solid-background);--solid-background-hover:var(--success-solid-background-hover);--text-high-contrast:var(--success-text-high-contrast);--text-low-contrast:var(--success-text-low-contrast);color:var(--text-high-contrast)}[data-variant=warning]{--app-background:var(--warning-app-background);--app-background-subtle:var(--warning-app-background-subtle);--app-border:var(--warning-app-border);--element-background:var(--warning-element-background);--element-background-hover:var(--warning-element-background-hover);--element-background-strong:var(--warning-element-background-strong);--element-border-subtle:var(--warning-element-border-subtle);--element-border-strong:var(--warning-element-border-strong);--solid-background:var(--warning-solid-background);--solid-background-hover:var(--warning-solid-background-hover);--text-high-contrast:var(--warning-text-high-contrast);--text-low-contrast:var(--warning-text-low-contrast);color:var(--text-high-contrast)}[data-variant=info]{--app-background:var(--info-app-background);--app-background-subtle:var(--info-app-background-subtle);--app-border:var(--info-app-border);--element-background:var(--info-element-background);--element-background-hover:var(--info-element-background-hover);--element-background-strong:var(--info-element-background-strong);--element-border-subtle:var(--info-element-border-subtle);--element-border-strong:var(--info-element-border-strong);--solid-background:var(--info-solid-background);--solid-background-hover:var(--info-solid-background-hover);--text-high-contrast:var(--info-text-high-contrast);--text-low-contrast:var(--info-text-low-contrast);color:var(--text-high-contrast)}.lustre-ui-alert,.use-lustre-ui .alert{--bg:var(--element-background);--border:var(--element-border-subtle);--text:var(--text-high-contrast);background-color:var(--bg);border:1px solid var(--border);border-radius:var(--border-radius);box-shadow:var(--shadow-sm);padding:var(--space-sm)}.clear:is(.use-lustre-ui .alert,.lustre-ui-alert){--bg:unsert}.lustre-ui-aside,.use-lustre-ui .aside{--align:start;--gap:var(--space-md);--dir:row;--wrap:wrap;--min:60%;align-items:var(--align);display:flex;flex-direction:var(--dir);flex-wrap:var(--wrap);gap:var(--gap)}.content-first:is(.use-lustre-ui .aside,.lustre-ui-aside){--dir:row;--wrap:wrap}.content-last:is(.use-lustre-ui .aside,.lustre-ui-aside){--dir:row-reverse;--wrap:wrap-reverse}.align-start:is(.use-lustre-ui .aside,.lustre-ui-aside){--align:start}.align-center:is(.use-lustre-ui .aside,.lustre-ui-aside),.align-centre:is(.use-lustre-ui .aside,.lustre-ui-aside){--align:center}.align-end:is(.use-lustre-ui .aside,.lustre-ui-aside){--align:end}.stretch:is(.use-lustre-ui .aside,.lustre-ui-aside){--align:stretch}.packed:is(.use-lustre-ui .aside,.lustre-ui-aside){--gap:0}.tight:is(.use-lustre-ui .aside,.lustre-ui-aside){--gap:var(--space-xs)}.relaxed:is(.use-lustre-ui .aside,.lustre-ui-aside){--gap:var(--space-md)}.loose:is(.use-lustre-ui .aside,.lustre-ui-aside){--gap:var(--space-lg)}:is(.use-lustre-ui .aside,.lustre-ui-aside)>:first-child{flex-basis:0;flex-grow:999;min-inline-size:var(--min)}:is(.use-lustre-ui .aside,.lustre-ui-aside)>:last-child{flex-grow:1;max-height:-moz-max-content;max-height:max-content}.lustre-ui-box,.use-lustre-ui .box{--gap:var(--space-sm);padding:var(--gap)}.packed:is(.use-lustre-ui .box,.lustre-ui-box){--gap:0}.tight:is(.use-lustre-ui .box,.lustre-ui-box){--gap:var(--space-xs)}.relaxed:is(.use-lustre-ui .box,.lustre-ui-box){--gap:var(--space-md)}.loose:is(.use-lustre-ui .box,.lustre-ui-box){--gap:var(--space-lg)}.lustre-ui-breadcrumbs,.use-lustre-ui .breadcrumbs{--gap:var(--space-sm);--align:center;align-items:var(--align);display:flex;flex-wrap:nowrap;gap:var(--gap);justify-content:start;overflow-x:auto}.tight:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs){--gap:var(--space-xs)}.relaxed:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs){--gap:var(--space-sm)}.loose:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs){--gap:var(--space-md)}.align-start:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs){--align:start}.align-center:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs),.align-centre:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs){--align:center}.align-end:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs){--align:end}:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs)>*{flex:0 0 auto}:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs):not(:has(.active))>:last-child,:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs)>.active{color:var(--text-low-contrast)}.lustre-ui-button,.use-lustre-ui .button,.use-lustre-ui button{--bg-active:var(--element-background-strong);--bg-hover:var(--element-background-hover);--bg:var(--element-background);--border-active:var(--bg-active);--border:var(--bg);--text:var(--text-high-contrast);--padding-y:var(--space-xs);--padding-x:var(--space-sm);background-color:var(--bg);border:1px solid var(--border,var(--bg),var(--element-border-subtle));border-radius:var(--border-radius);color:var(--text);padding:var(--padding-y) var(--padding-x)}:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button):focus-within,:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button):hover{background-color:var(--bg-hover)}:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button):focus-within:active,:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button):hover:active{background-color:var(--bg-active);border-color:var(--border-active)}.small:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button){--padding-y:var(--space-2xs);--padding-x:var(--space-xs)}.solid:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button){--bg-active:var(--solid-background-hover);--bg-hover:var(--solid-background-hover);--bg:var(--solid-background);--border-active:var(--solid-background-hover);--border:var(--solid-background);--text:#fff}.solid:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button):focus-within:active,.solid:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button):hover:active{--bg-active:color-mix(in srgb,var(--solid-background-hover) 90%,#000);--border-active:color-mix(in srgb,var(--solid-background-hover) 90%,#000)}.soft:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button){--bg-active:var(--element-background-strong);--bg-hover:var(--element-background-hover);--bg:var(--element-background);--border-active:var(--bg-active);--border:var(--bg);--text:var(--text-high-contrast)}.outline:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button){--bg:unset;--border:var(--element-border-subtle)}.clear:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button){--bg:unset;--border:unset}.lustre-ui-center,.lustre-ui-centre,.use-lustre-ui .center,.use-lustre-ui .centre{--display:flex;align-items:center;display:var(--display);justify-content:center}.inline:is(.use-lustre-ui .centre,.use-lustre-ui .center,.lustre-ui-centre,.lustre-ui-center){--display:inline-flex}.lustre-ui-cluster,.use-lustre-ui .cluster{--gap:var(--space-md);--dir:flex-start;--align:center;align-items:var(--align);display:flex;flex-wrap:wrap;gap:var(--gap);justify-content:var(--dir)}.packed:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--gap:0}.tight:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--gap:var(--space-xs)}.relaxed:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--gap:var(--space-md)}.loose:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--gap:var(--space-lg)}.from-start:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--dir:flex-start}.from-end:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--dir:flex-end}.align-start:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--align:start}.align-center:is(.use-lustre-ui .cluster,.lustre-ui-cluster),.align-centre:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--align:center}.align-end:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--align:end}.stretch:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--align:stretch}.lustre-ui-field,.use-lustre-ui .field{--label:var(--text-high-contrast);--label-align:start;--message:var(--text-low-contrast);--message-align:end;--text-size:var(--text-md)}.small:is(.use-lustre-ui .field,.lustre-ui-field){--text-size:var(--text-sm)}.label-start:is(.use-lustre-ui .field,.lustre-ui-field){--label-align:start}.label-center:is(.use-lustre-ui .field,.lustre-ui-field),.label-centre:is(.use-lustre-ui .field,.lustre-ui-field){--label-align:center}.label-end:is(.use-lustre-ui .field,.lustre-ui-field){--label-align:end}.message-start:is(.use-lustre-ui .field,.lustre-ui-field){--message-align:start}.message-center:is(.use-lustre-ui .field,.lustre-ui-field),.message-centre:is(.use-lustre-ui .field,.lustre-ui-field){--message-align:center}.message-end:is(.use-lustre-ui .field,.lustre-ui-field){--message-align:end}:is(.use-lustre-ui .field,.lustre-ui-field):has(input:disabled)>:is(.label,.message){opacity:.5}:is(.use-lustre-ui .field,.lustre-ui-field)>:not(input){color:var(--label);font-size:var(--text-size)}:is(.use-lustre-ui .field,.lustre-ui-field)>.label{display:inline-flex;justify-content:var(--label-align)}:is(.use-lustre-ui .field,.lustre-ui-field)>.message{color:var(--message);display:inline-flex;justify-content:var(--message-align)}.lustre-ui-group,.use-lustre-ui .group{align-items:stretch;display:inline-flex}:is(.use-lustre-ui .group,.lustre-ui-group)>:first-child{border-radius:var(--border-radius) 0 0 var(--border-radius)!important}:is(.use-lustre-ui .group,.lustre-ui-group)>:not(:first-child):not(:last-child){border-radius:0!important}:is(.use-lustre-ui .group,.lustre-ui-group)>:last-child{border-radius:0 var(--border-radius) var(--border-radius) 0!important}.lustre-ui-icon,.use-lustre-ui .icon{--size:1em;display:inline;height:var(--size);width:var(--size)}.xs:is(.use-lustre-ui .icon,.lustre-ui-icon){--size:var(--text-xs)}.sm:is(.use-lustre-ui .icon,.lustre-ui-icon){--size:var(--text-sm)}.md:is(.use-lustre-ui .icon,.lustre-ui-icon){--size:var(--text-md)}.lg:is(.use-lustre-ui .icon,.lustre-ui-icon){--size:var(--text-lg)}.xl:is(.use-lustre-ui .icon,.lustre-ui-icon){--size:var(--text-xl)}.lustre-ui-input,.use-lustre-ui .input,.use-lustre-ui input:not([type~="checkbox file radio range"]){--border-active:var(--element-border-strong);--border:var(--element-border-subtle);--outline:var(--element-border-subtle);--text:var(--text-high-contrast);--text-placeholder:var(--text-low-contrast);--padding-y:var(--space-xs);--padding-x:var(--space-sm);border:1px solid var(--border,var(--bg),var(--element-border-subtle));border-radius:var(--border-radius);color:var(--text);padding:var(--padding-y) var(--padding-x)}:is(.use-lustre-ui input:not([type~="checkbox file radio range"]),.use-lustre-ui .input,.lustre-ui-input):hover{border-color:var(--border-active)}:is(.use-lustre-ui input:not([type~="checkbox file radio range"]),.use-lustre-ui .input,.lustre-ui-input):focus-within{border-color:var(--border-active);outline:1px solid var(--outline);outline-offset:2px}:is(.use-lustre-ui input:not([type~="checkbox file radio range"]),.use-lustre-ui .input,.lustre-ui-input)::-moz-placeholder{color:var(--text-placeholder)}:is(.use-lustre-ui input:not([type~="checkbox file radio range"]),.use-lustre-ui .input,.lustre-ui-input)::placeholder{color:var(--text-placeholder)}:is(.use-lustre-ui input:not([type~="checkbox file radio range"]),.use-lustre-ui .input,.lustre-ui-input):disabled{opacity:.5}.clear:is(.use-lustre-ui input:not([type~="checkbox file radio range"]),.use-lustre-ui .input,.lustre-ui-input){--border:unset}.lustre-ui-prose,.use-lustre-ui .prose{--width:60ch;width:var(--width)}.wide:is(.use-lustre-ui .prose,.lustre-ui-prose){--width:80ch}.full:is(.use-lustre-ui .prose,.lustre-ui-prose){--width:100%}:is(.use-lustre-ui .prose,.lustre-ui-prose) *+*{margin-top:var(--space-md)}:is(.use-lustre-ui .prose,.lustre-ui-prose) :not(h1,h2,h3,h4,h5,h6)+:is(h1,h2,h3,h4,h5,h6){margin-top:var(--space-xl)}:is(.use-lustre-ui .prose,.lustre-ui-prose) h1{font-size:var(--text-3xl)}:is(.use-lustre-ui .prose,.lustre-ui-prose) h2{font-size:var(--text-2xl)}:is(.use-lustre-ui .prose,.lustre-ui-prose) h3{font-size:var(--text-xl)}:is(.use-lustre-ui .prose,.lustre-ui-prose) :is(h4,h5,h6){font-size:var(--text-lg)}:is(.use-lustre-ui .prose,.lustre-ui-prose) img{border-radius:var(--border-radius);display:block;height:auto;-o-object-fit:cover;object-fit:cover;width:100%}:is(.use-lustre-ui .prose,.lustre-ui-prose) ul{list-style:disc}:is(.use-lustre-ui .prose,.lustre-ui-prose) ol{list-style:decimal}:is(.use-lustre-ui .prose,.lustre-ui-prose) :is(ul,ol,dl){padding-left:var(--space-xl)}:is(:is(.use-lustre-ui .prose,.lustre-ui-prose) :is(ul,ol,dl))>*+*{margin-top:var(--space-md)}:is(.use-lustre-ui .prose,.lustre-ui-prose) li::marker{color:var(--text-low-contrast)}:is(.use-lustre-ui .prose,.lustre-ui-prose) pre{background-color:var(--greyscale-element-background);border-radius:var(--border-radius);overflow-x:auto;padding:var(--space-sm) var(--space-md)}:is(.use-lustre-ui .prose,.lustre-ui-prose) pre>code{background-color:transparent;border-radius:0;color:inherit;font-size:var(--text-md);padding:0}:is(.use-lustre-ui .prose,.lustre-ui-prose) blockquote{border-left:4px solid var(--element-border-subtle);padding-left:var(--space-xl);quotes:"\\201C""\\201D""\\2018""\\2019"}:is(.use-lustre-ui .prose,.lustre-ui-prose) blockquote>*{font-style:italic}:is(:is(.use-lustre-ui .prose,.lustre-ui-prose) blockquote)>*+*{margin-top:var(--space-sm)}:is(.use-lustre-ui .prose,.lustre-ui-prose) blockquote>:first-child:before{content:open-quote}:is(.use-lustre-ui .prose,.lustre-ui-prose) blockquote>:last-child:after{content:close-quote}:is(.use-lustre-ui .prose,.lustre-ui-prose) a[href]{color:var(--text-low-contrast);text-decoration:underline}:is(.use-lustre-ui .prose,.lustre-ui-prose) a[href]:visited{color:var(--text-high-contrast)}:is(.use-lustre-ui .prose,.lustre-ui-prose) :is(code,kbd){background-color:var(--greyscale-element-background);border-radius:var(--border-radius)}:is(.use-lustre-ui .prose,.lustre-ui-prose) :not(pre) code{color:var(--text-high-contrast)}:is(.use-lustre-ui .prose,.lustre-ui-prose) :not(pre) code:after,:is(.use-lustre-ui .prose,.lustre-ui-prose) :not(pre) code:before{content:"\\`"}:is(.use-lustre-ui .prose,.lustre-ui-prose) kbd{border-color:var(--greyscale-element-border-strong);border-width:1px;font-weight:700;padding:0 var(--space-2xs)}.lustre-ui-sequence,.use-lustre-ui .sequence{--gap:var(--space-md);--break:30rem;display:flex;flex-wrap:wrap;gap:var(--gap)}.packed:is(.use-lustre-ui .sequence,.lustre-ui-sequence){--gap:0}.tight:is(.use-lustre-ui .sequence,.lustre-ui-sequence){--gap:var(--space-xs)}.relaxed:is(.use-lustre-ui .sequence,.lustre-ui-sequence){--gap:var(--space-md)}.loose:is(.use-lustre-ui .sequence,.lustre-ui-sequence){--gap:var(--space-lg)}[data-split-at="3"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+3),[data-split-at="3"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+3)~*{flex-basis:100%}[data-split-at="4"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+4),[data-split-at="4"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+4)~*{flex-basis:100%}[data-split-at="5"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+5),[data-split-at="5"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+5)~*{flex-basis:100%}[data-split-at="6"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+6),[data-split-at="6"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+6)~*{flex-basis:100%}[data-split-at="7"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+7),[data-split-at="7"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+7)~*{flex-basis:100%}[data-split-at="8"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+8),[data-split-at="8"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+8)~*{flex-basis:100%}[data-split-at="9"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+9),[data-split-at="9"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+9)~*{flex-basis:100%}[data-split-at="10"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+10),[data-split-at="10"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+10)~*{flex-basis:100%}:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>*{flex-basis:calc((var(--break) - 100%)*999);flex-grow:1}.lustre-ui-stack,.use-lustre-ui .stack{--gap:var(--space-md);display:flex;flex-direction:column;gap:var(--gap);justify-content:flex-start}.packed:is(.use-lustre-ui .stack,.lustre-ui-stack){--gap:0}.tight:is(.use-lustre-ui .stack,.lustre-ui-stack){--gap:var(--space-xs)}.relaxed:is(.use-lustre-ui .stack,.lustre-ui-stack){--gap:var(--space-md)}.loose:is(.use-lustre-ui .stack,.lustre-ui-stack){--gap:var(--space-lg)}.lustre-ui-tag,.use-lustre-ui .tag{--bg-active:var(--element-background-strong);--bg-hover:var(--element-background-hover);--bg:var(--element-background);--border-active:var(--bg-active);--border:var(--bg);--text:var(--text-high-contrast);background-color:var(--bg);border:1px solid var(--border,var(--bg),var(--element-border-subtle));border-radius:var(--border-radius);color:var(--text);font-size:var(--text-sm);padding:0 var(--space-xs)}:is(.use-lustre-ui .tag,.lustre-ui-tag):is(button,a,[tabindex]){cursor:pointer;-webkit-user-select:none;-moz-user-select:none;user-select:none}:is(.use-lustre-ui .tag,.lustre-ui-tag):is(button,a,[tabindex]):focus-within,:is(.use-lustre-ui .tag,.lustre-ui-tag):is(button,a,[tabindex]):hover{background-color:var(--bg-hover)}:is(.use-lustre-ui .tag,.lustre-ui-tag):is(button,a,[tabindex]):focus-within:active,:is(.use-lustre-ui .tag,.lustre-ui-tag):is(button,a,[tabindex]):hover:active{background-color:var(--bg-active);border-color:var(--border-active)}.solid:is(.use-lustre-ui .tag,.lustre-ui-tag){--bg-active:var(--solid-background-hover);--bg-hover:var(--solid-background-hover);--bg:var(--solid-background);--border-active:var(--solid-background-hover);--border:var(--solid-background);--text:#fff}.solid:is(.use-lustre-ui .tag,.lustre-ui-tag):is(button,a,[tabindex]):focus-within:active,.solid:is(.use-lustre-ui .tag,.lustre-ui-tag):is(button,a,[tabindex]):hover:active{--bg-active:color-mix(in srgb,var(--solid-background-hover) 90%,#000);--border-active:color-mix(in srgb,var(--solid-background-hover) 90%,#000)}.soft:is(.use-lustre-ui .tag,.lustre-ui-tag){--bg-active:var(--element-background-strong);--bg-hover:var(--element-background-hover);--bg:var(--element-background);--border-active:var(--bg-active);--border:var(--bg);--text:var(--text-high-contrast)}.outline:is(.use-lustre-ui .tag,.lustre-ui-tag){--bg:unset;--border:var(--element-border-subtle)}\n';
function elements2() {
  return style2(toList([]), element_css);
}

// build/dev/javascript/modem/modem.ffi.mjs
var defaults = {
  handle_external_links: false,
  handle_internal_links: true
};
var initial_location = window?.location?.href;
var do_init = (dispatch, options = defaults) => {
  document.addEventListener("click", (event2) => {
    const a2 = find_anchor(event2.target);
    if (!a2)
      return;
    try {
      const url = new URL(a2.href);
      const uri = uri_from_url(url);
      const is_external = url.host !== window.location.host;
      if (!options.handle_external_links && is_external)
        return;
      if (!options.handle_internal_links && !is_external)
        return;
      event2.preventDefault();
      if (!is_external) {
        window.history.pushState({}, "", a2.href);
        window.requestAnimationFrame(() => {
          if (url.hash) {
            document.getElementById(url.hash.slice(1))?.scrollIntoView();
          }
        });
      }
      return dispatch(uri);
    } catch {
      return;
    }
  });
  window.addEventListener("popstate", (e) => {
    e.preventDefault();
    const url = new URL(window.location.href);
    const uri = uri_from_url(url);
    window.requestAnimationFrame(() => {
      if (url.hash) {
        document.getElementById(url.hash.slice(1))?.scrollIntoView();
      }
    });
    dispatch(uri);
  });
  window.addEventListener("modem-push", ({ detail }) => {
    dispatch(detail);
  });
  window.addEventListener("modem-replace", ({ detail }) => {
    dispatch(detail);
  });
};
var find_anchor = (el) => {
  if (!el || el.tagName === "BODY") {
    return null;
  } else if (el.tagName === "A") {
    return el;
  } else {
    return find_anchor(el.parentElement);
  }
};
var uri_from_url = (url) => {
  return new Uri(
    /* scheme   */
    url.protocol ? new Some(url.protocol.slice(0, -1)) : new None(),
    /* userinfo */
    new None(),
    /* host     */
    url.hostname ? new Some(url.hostname) : new None(),
    /* port     */
    url.port ? new Some(Number(url.port)) : new None(),
    /* path     */
    url.pathname,
    /* query    */
    url.search ? new Some(url.search.slice(1)) : new None(),
    /* fragment */
    url.hash ? new Some(url.hash.slice(1)) : new None()
  );
};

// build/dev/javascript/modem/modem.mjs
function init2(handler) {
  return from(
    (dispatch) => {
      return guard(
        !is_browser(),
        void 0,
        () => {
          return do_init(
            (uri) => {
              let _pipe = uri;
              let _pipe$1 = handler(_pipe);
              return dispatch(_pipe$1);
            }
          );
        }
      );
    }
  );
}

// build/dev/javascript/plinth/global_ffi.mjs
function setInterval(delay, callback) {
  return globalThis.setInterval(callback, delay);
}

// build/dev/javascript/lustre/lustre/event.mjs
function on2(name, handler) {
  return on(name, handler);
}
function on_click(msg) {
  return on2("click", (_) => {
    return new Ok(msg);
  });
}
function on_mouse_enter(msg) {
  return on2("mouseenter", (_) => {
    return new Ok(msg);
  });
}
function on_mouse_leave(msg) {
  return on2("mouseleave", (_) => {
    return new Ok(msg);
  });
}
function value2(event2) {
  let _pipe = event2;
  return field("target", field("value", string))(
    _pipe
  );
}
function on_input(msg) {
  return on2(
    "input",
    (event2) => {
      let _pipe = value2(event2);
      return map2(_pipe, msg);
    }
  );
}

// build/dev/javascript/lustre_ui/lustre/ui/classes.mjs
function bg_app_subtle() {
  return class$("bg-app-subtle");
}
function bg_element_hover() {
  return class$("bg-element-hover");
}
function text_high_contrast() {
  return class$("text-high-contrast");
}
function text_lg() {
  return class$("text-lg");
}
function text_xl() {
  return class$("text-xl");
}
function text_2xl() {
  return class$("text-2xl");
}
function text_3xl() {
  return class$("text-3xl");
}
function text_4xl() {
  return class$("text-4xl");
}
function text_5xl() {
  return class$("text-5xl");
}
function p_lg() {
  return class$("p-lg");
}
function py_md() {
  return class$("py-md");
}
function pb_lg() {
  return class$("pb-lg");
}
function pb_xl() {
  return class$("pb-xl");
}
function mx_5xl() {
  return class$("mx-5xl");
}
function my_lg() {
  return class$("my-lg");
}
function mt_md() {
  return class$("mt-md");
}
function font_alt() {
  return class$("font-alt");
}
function font_mono() {
  return class$("font-mono");
}
function shadow_md() {
  return class$("shadow-md");
}

// build/dev/javascript/lustre/lustre/element/svg.mjs
var namespace = "http://www.w3.org/2000/svg";
function path(attrs) {
  return namespaced(namespace, "path", attrs, toList([]));
}

// build/dev/javascript/lustre_ui/lustre/ui/icon.mjs
function icon(attrs, path2) {
  return svg(
    prepend(
      class$("lustre-ui-icon"),
      prepend(
        attribute("viewBox", "0 0 15 15"),
        prepend(attribute("fill", "none"), attrs)
      )
    ),
    toList([
      path(
        toList([
          attribute("d", path2),
          attribute("fill", "currentColor"),
          attribute("fill-rule", "evenodd"),
          attribute("clip-rule", "evenodd")
        ])
      )
    ])
  );
}
function caret_left(attrs) {
  return icon(
    attrs,
    "M8.81809 4.18179C8.99383 4.35753 8.99383 4.64245 8.81809 4.81819L6.13629 7.49999L8.81809 10.1818C8.99383 10.3575 8.99383 10.6424 8.81809 10.8182C8.64236 10.9939 8.35743 10.9939 8.1817 10.8182L5.1817 7.81819C5.09731 7.73379 5.0499 7.61933 5.0499 7.49999C5.0499 7.38064 5.09731 7.26618 5.1817 7.18179L8.1817 4.18179C8.35743 4.00605 8.64236 4.00605 8.81809 4.18179Z"
  );
}
function caret_right(attrs) {
  return icon(
    attrs,
    "M6.18194 4.18185C6.35767 4.00611 6.6426 4.00611 6.81833 4.18185L9.81833 7.18185C9.90272 7.26624 9.95013 7.3807 9.95013 7.50005C9.95013 7.6194 9.90272 7.73386 9.81833 7.81825L6.81833 10.8182C6.6426 10.994 6.35767 10.994 6.18194 10.8182C6.0062 10.6425 6.0062 10.3576 6.18194 10.1819L8.86374 7.50005L6.18194 4.81825C6.0062 4.64251 6.0062 4.35759 6.18194 4.18185Z"
  );
}
function sketch_logo(attrs) {
  return icon(
    attrs,
    "M7.53731 0.826873C7.5125 0.824392 7.4875 0.824392 7.46269 0.826873L3.96269 1.17687C3.85672 1.18747 3.76025 1.24262 3.69736 1.32857L0.699771 5.42528C0.654046 5.48627 0.62647 5.56165 0.625057 5.6434C0.625019 5.6456 0.625 5.64781 0.625 5.65001C0.625 5.65052 0.625001 5.65103 0.625003 5.65153C0.625363 5.74237 0.658021 5.82559 0.712087 5.8903L7.21042 13.7883C7.28165 13.8749 7.38789 13.925 7.5 13.925C7.61211 13.925 7.71835 13.8749 7.78958 13.7883L14.2879 5.89031C14.342 5.8256 14.3746 5.74237 14.375 5.65153C14.375 5.65103 14.375 5.65052 14.375 5.65001C14.375 5.64849 14.375 5.64697 14.375 5.64545C14.3749 5.63963 14.3747 5.63382 14.3744 5.62801C14.37 5.55219 14.3431 5.48242 14.3002 5.42527L11.3026 1.32857C11.2397 1.24262 11.1433 1.18747 11.0373 1.17687L7.53731 0.826873ZM10.925 5.27501V5.25236L10.9223 5.27501H10.925ZM10.9342 5.17498H13.1877L11.2495 2.5261L10.9342 5.17498ZM10.5707 1.88395L8.04432 1.63131L10.1747 5.21034L10.5707 1.88395ZM6.95568 1.63131L4.42931 1.88395L4.82531 5.21034L6.95568 1.63131ZM3.75046 2.5261L1.81226 5.17498H4.0658L3.75046 2.5261ZM1.79416 6.02501L6.75861 12.0587L4.22371 6.0669C4.21787 6.0531 4.21314 6.0391 4.20949 6.02501H1.79416ZM5.15055 6.02501L7.49999 12.1085L9.84943 6.02501H9.78681H5.21319H5.15055ZM10.7905 6.02501C10.7869 6.0391 10.7821 6.0531 10.7763 6.0669L8.24139 12.0587L13.2058 6.02501H10.7905ZM7.5 2.18317L9.34038 5.27501H5.65962L7.5 2.18317Z"
  );
}

// build/dev/javascript/lustre_sandbox/lustre_sandbox/lib/msg.mjs
var OnRouteChange = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var StateReset = class extends CustomType {
};
var InputUpdate = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var IntMessage = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var CarouselMessage = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Index = class extends CustomType {
};
var About = class extends CustomType {
};
var NextSlide = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var NextSlideIfAuto = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var PreviousSlide = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var SetSlide = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var StartAutoSlide = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var PauseAutoSlide = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var IntIncrement = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var IntDecrement = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};

// build/dev/javascript/lustre_sandbox/lustre_sandbox/lib/types.mjs
var Model2 = class extends CustomType {
  constructor(state) {
    super();
    this.state = state;
  }
};
var State = class extends CustomType {
  constructor(route, theme2, images, inputs, ints, carousels) {
    super();
    this.route = route;
    this.theme = theme2;
    this.images = images;
    this.inputs = inputs;
    this.ints = ints;
    this.carousels = carousels;
  }
};
var ImageRef = class extends CustomType {
  constructor(title, location) {
    super();
    this.title = title;
    this.location = location;
  }
};
var CarouselState = class extends CustomType {
  constructor(index3, images, autoslide) {
    super();
    this.index = index3;
    this.images = images;
    this.autoslide = autoslide;
  }
};

// build/dev/javascript/lustre_sandbox/lustre_sandbox/lib.mjs
function set_interval(interval, msg) {
  return from(
    (dispatch) => {
      setInterval(interval, () => {
        return dispatch(msg);
      });
      return void 0;
    }
  );
}
function to_imageref(title, location) {
  return new ImageRef(title, location);
}
function imageloader(image, width2, height2) {
  return div(
    toList([style(toList([["display", "flex"], ["flex-grow", "4"]]))]),
    toList([
      img(
        toList([
          src(image.location),
          alt(image.title),
          width(width2),
          height(height2)
        ])
      )
    ])
  );
}
function do_element_clones(loop$amount, loop$element, loop$acc) {
  while (true) {
    let amount = loop$amount;
    let element2 = loop$element;
    let acc = loop$acc;
    if (amount <= 0) {
      let x = amount;
      return acc;
    } else {
      loop$amount = amount - 1;
      loop$element = element2;
      loop$acc = flatten(toList([acc, toList([element2])]));
    }
  }
}
function element_clones(amount, element2) {
  return do_element_clones(amount, element2, toList([]));
}
function input_box(model, name, placeholder2, attrs) {
  let $ = get(model.state.inputs, name);
  if ($.isOk() && $[0] !== "") {
    let item = $[0];
    return input3(
      flatten(
        toList([
          toList([
            on_input(
              (_capture) => {
                return new InputUpdate(name, _capture);
              }
            )
          ]),
          toList([value(item)]),
          attrs,
          toList([placeholder(placeholder2)])
        ])
      )
    );
  } else {
    return input3(
      flatten(
        toList([
          toList([
            on_input(
              (_capture) => {
                return new InputUpdate(name, _capture);
              }
            )
          ]),
          attrs,
          toList([placeholder(placeholder2)])
        ])
      )
    );
  }
}

// build/dev/javascript/lustre_sandbox/components/carousel.mjs
function set_carousel_index(model, name, index3) {
  let $ = unwrap(
    get(model.state.carousels, name),
    new CarouselState(0, toList([]), false)
  );
  {
    let imgs = $.images;
    let a2 = $.autoslide;
    return insert(
      model.state.carousels,
      name,
      new CarouselState(index3, imgs, a2)
    );
  }
}
function increment_carousel_index(model, name) {
  let cstate = unwrap(
    get(model.state.carousels, name),
    new CarouselState(0, toList([]), false)
  );
  let $ = length(cstate.images);
  if (cstate instanceof CarouselState && cstate.index < $ - 1) {
    let n = cstate.index;
    let imgs = cstate.images;
    let a2 = cstate.autoslide;
    let length4 = $;
    return insert(
      model.state.carousels,
      name,
      new CarouselState(n + 1, imgs, a2)
    );
  } else {
    let imgs = cstate.images;
    let a2 = cstate.autoslide;
    return insert(
      model.state.carousels,
      name,
      new CarouselState(0, imgs, a2)
    );
  }
}
function increment_carousel_index_if_auto(model, name) {
  let cstate = unwrap(
    get(model.state.carousels, name),
    new CarouselState(0, toList([]), false)
  );
  let $ = length(cstate.images);
  if (cstate instanceof CarouselState && (cstate.index < $ - 1 && cstate.autoslide)) {
    let n = cstate.index;
    let imgs = cstate.images;
    let b = cstate.autoslide;
    let length4 = $;
    return insert(
      model.state.carousels,
      name,
      new CarouselState(n + 1, imgs, b)
    );
  } else if (cstate instanceof CarouselState && cstate.autoslide) {
    let imgs = cstate.images;
    let b = cstate.autoslide;
    return insert(
      model.state.carousels,
      name,
      new CarouselState(0, imgs, b)
    );
  } else {
    return model.state.carousels;
  }
}
function decrement_carousel_index(model, name) {
  let cstate = unwrap(
    get(model.state.carousels, name),
    new CarouselState(0, toList([]), false)
  );
  let $ = length(cstate.images);
  if (cstate instanceof CarouselState && cstate.index > 0) {
    let n = cstate.index;
    let imgs = cstate.images;
    let a2 = cstate.autoslide;
    return insert(
      model.state.carousels,
      name,
      new CarouselState(n - 1, imgs, a2)
    );
  } else {
    let imgs = cstate.images;
    let a2 = cstate.autoslide;
    let length4 = $;
    return insert(
      model.state.carousels,
      name,
      new CarouselState(length4 - 1, imgs, a2)
    );
  }
}
function start_auto_slide(model, name, interval) {
  let cstate = unwrap(
    get(model.state.carousels, name),
    new CarouselState(0, toList([]), false)
  );
  {
    let n = cstate.index;
    let imgs = cstate.images;
    return insert(
      model.state.carousels,
      name,
      new CarouselState(n, imgs, true)
    );
  }
}
function pause_auto_slide(model, name) {
  let cstate = unwrap(
    get(model.state.carousels, name),
    new CarouselState(0, toList([]), false)
  );
  {
    let n = cstate.index;
    let imgs = cstate.images;
    return insert(
      model.state.carousels,
      name,
      new CarouselState(n, imgs, false)
    );
  }
}
function message_handler(model, carouselmsg) {
  if (carouselmsg instanceof SetSlide) {
    let name = carouselmsg[0];
    let index3 = carouselmsg[1];
    return [
      new Model2(
        model.state.withFields({
          carousels: set_carousel_index(model, name, index3)
        })
      ),
      none()
    ];
  } else if (carouselmsg instanceof NextSlide) {
    let name = carouselmsg[0];
    return [
      new Model2(
        model.state.withFields({
          carousels: increment_carousel_index(model, name)
        })
      ),
      none()
    ];
  } else if (carouselmsg instanceof NextSlideIfAuto) {
    let name = carouselmsg[0];
    return [
      new Model2(
        model.state.withFields({
          carousels: increment_carousel_index_if_auto(model, name)
        })
      ),
      none()
    ];
  } else if (carouselmsg instanceof PreviousSlide) {
    let name = carouselmsg[0];
    return [
      new Model2(
        model.state.withFields({
          carousels: decrement_carousel_index(model, name)
        })
      ),
      none()
    ];
  } else if (carouselmsg instanceof StartAutoSlide) {
    let name = carouselmsg[0];
    let interval = carouselmsg[1];
    return [
      new Model2(
        model.state.withFields({
          carousels: start_auto_slide(model, name, interval)
        })
      ),
      none()
    ];
  } else {
    let name = carouselmsg[0];
    return [
      new Model2(
        model.state.withFields({ carousels: pause_auto_slide(model, name) })
      ),
      none()
    ];
  }
}
function insert_dot(model, carousel_name, index3) {
  let $ = unwrap(
    get(model.state.carousels, carousel_name),
    new CarouselState(0, toList([]), false)
  );
  if ($ instanceof CarouselState && $.index === index3 - 1) {
    let i = $.index;
    return toList([
      strong(toList([]), toList([text(to_string3(index3))]))
    ]);
  } else {
    return toList([text(to_string3(index3))]);
  }
}
function carousel(model, name) {
  let carousel_wrapper = style(
    toList([
      ["position", "relative"],
      ["width", "40%"],
      ["max_width", "400px"],
      ["max-height", "300px"],
      ["margin", "0 auto"],
      ["overflow", "hidden"]
    ])
  );
  let carousel_element = style(
    toList([
      ["display", "flex"],
      ["transition", "transform 0.5s ease-in-out"],
      [
        "transform",
        "translateX(" + to_string3(
          unwrap(
            get(model.state.carousels, name),
            new CarouselState(0, toList([]), true)
          ).index * -100
        ) + "%)"
      ]
    ])
  );
  let carousel_button = style(
    toList([
      ["position", "absolute"],
      ["top", "50%"],
      ["transform", "translateY(-50%)"],
      ["background-color", "rgba(0, 0, 0, 0.5)"],
      ["color", "white"],
      ["border", "none"],
      ["padding", "10px 20px"],
      ["cursor", "pointer"],
      ["z-index", "1"]
    ])
  );
  let carousel_dot = style(
    toList([
      ["position", "absolute"],
      ["height", "40px"],
      ["width", "40px"],
      ["color", "white"],
      ["fill", "white"],
      ["border", "none"],
      ["padding", "10px 20px"],
      ["cursor", "pointer"],
      ["z-index", "2"]
    ])
  );
  let carousel_dot_wrapper = style(
    toList([
      ["display", "flex"],
      ["justify-content", "center"],
      ["width", "40px"],
      ["height", "40px"],
      ["text-align", "center"]
    ])
  );
  let carousel_dots = style(
    toList([
      ["display", "flex"],
      ["gap", "10px"],
      ["background-color", "rgba(0, 0, 0, 0.5)"],
      ["color", "white"],
      ["border", "none"],
      ["padding", "10px 20px"],
      ["cursor", "pointer"],
      ["z-index", "1"]
    ])
  );
  let carousel_dots_wrapper = style(
    toList([
      ["position", "absolute"],
      ["display", "flex"],
      ["justify-content", "center"],
      ["width", "100%"],
      ["bottom", "10px"]
    ])
  );
  let images = unwrap(
    get(model.state.carousels, name),
    new CarouselState(0, toList([]), false)
  ).images;
  return div(
    toList([
      carousel_wrapper,
      on_mouse_enter(
        new CarouselMessage(new PauseAutoSlide(name))
      ),
      on_mouse_leave(
        new CarouselMessage(new StartAutoSlide(name, 0))
      )
    ]),
    toList([
      div(
        toList([carousel_element]),
        map(
          images,
          (image) => {
            return img(
              toList([
                src(image.location),
                alt(image.title),
                style(
                  toList([["width", "100%"], ["flex-shrink", "0"]])
                )
              ])
            );
          }
        )
      ),
      button(
        toList([
          carousel_button,
          on_click(
            new CarouselMessage(new PreviousSlide(name))
          ),
          style(toList([["left", "10px"]]))
        ]),
        toList([caret_left(toList([]))])
      ),
      button(
        toList([
          carousel_button,
          on_click(new CarouselMessage(new NextSlide(name))),
          style(toList([["right", "10px"]]))
        ]),
        toList([caret_right(toList([]))])
      ),
      div(
        toList([carousel_dots_wrapper]),
        toList([
          div(
            toList([carousel_dots]),
            fold(
              range(1, length(images)),
              toList([]),
              (dots, index3) => {
                return append(
                  dots,
                  toList([
                    div(
                      toList([carousel_dot_wrapper]),
                      toList([
                        div(
                          toList([
                            on_click(
                              new CarouselMessage(
                                new SetSlide(name, index3 - 1)
                              )
                            ),
                            carousel_dot
                          ]),
                          insert_dot(model, name, index3)
                        )
                      ])
                    )
                  ])
                );
              }
            )
          )
        ])
      )
    ])
  );
}

// build/dev/javascript/lustre_sandbox/components/ints.mjs
function message_handler2(model, intmsg) {
  if (intmsg instanceof IntIncrement) {
    let name = intmsg[0];
    return [
      new Model2(
        model.state.withFields({
          ints: map_values(
            model.state.ints,
            (k, v) => {
              if (k === name) {
                let n = k;
                return v + 1;
              } else {
                return v;
              }
            }
          )
        })
      ),
      none()
    ];
  } else {
    let name = intmsg[0];
    return [
      new Model2(
        model.state.withFields({
          ints: map_values(
            model.state.ints,
            (k, v) => {
              if (k === name && v > 0) {
                let n = k;
                let i = v;
                return v - 1;
              } else {
                return v;
              }
            }
          )
        })
      ),
      none()
    ];
  }
}

// build/dev/javascript/lustre_sandbox/components/footer.mjs
function footer(model) {
  return div(
    toList([
      style(
        toList([
          ["height", "5rem"],
          [
            "background",
            (() => {
              let $ = get(model.state.inputs, "colour");
              if ($.isOk() && $[0] === "red") {
                return "#552222";
              } else {
                return "";
              }
            })()
          ]
        ])
      )
    ]),
    toList([p(toList([]), toList([text("footer")]))])
  );
}

// build/dev/javascript/lustre_sandbox/components/navbar.mjs
function navbar(model) {
  return div(
    toList([shadow_md(), py_md()]),
    toList([
      centre2(
        toList([]),
        nav(
          toList([]),
          toList([
            a(
              toList([href("/lustre-sandbox/")]),
              toList([
                button3(
                  toList([on_click(new InputUpdate("colour", ""))]),
                  toList([text("Index")])
                )
              ])
            ),
            a(toList([]), toList([text(" | ")])),
            a(
              toList([]),
              toList([
                (() => {
                  let $ = get(model.state.inputs, "colour");
                  if ($.isOk() && $[0] === "red") {
                    return button3(
                      toList([
                        solid(),
                        error(),
                        on_click(new InputUpdate("colour", ""))
                      ]),
                      toList([text("RED MODE: ON ")])
                    );
                  } else {
                    return button3(
                      toList([
                        solid(),
                        error(),
                        on_click(new InputUpdate("colour", "red"))
                      ]),
                      toList([text("RED MODE: OFF")])
                    );
                  }
                })()
              ])
            ),
            a(toList([]), toList([text(" | ")])),
            a(
              toList([]),
              toList([
                button3(
                  toList([
                    solid(),
                    info(),
                    on_click(new StateReset())
                  ]),
                  toList([text("RESET")])
                )
              ])
            ),
            a(toList([]), toList([text(" | ")])),
            a(
              toList([href("/lustre-sandbox/about")]),
              toList([
                button3(
                  toList([info(), outline(), warning()]),
                  toList([text("About")])
                )
              ])
            )
          ])
        )
      ),
      hr(toList([style(toList([["opacity", "0"]]))]))
    ])
  );
}

// build/dev/javascript/lustre_sandbox/components/fizzbuzz.mjs
function do_fizzbuzz(loop$num, loop$acc, loop$textlist) {
  while (true) {
    let num = loop$num;
    let acc = loop$acc;
    let textlist = loop$textlist;
    if (acc === num + 1) {
      let n = acc;
      return textlist;
    } else if (acc >= 0 && acc % 15 === 0 && acc > 30) {
      let n = acc;
      loop$num = num;
      loop$acc = acc + 1;
      loop$textlist = flatten(
        toList([
          textlist,
          toList([
            centre2(
              toList([]),
              p(
                toList([text_5xl()]),
                toList([
                  text(
                    "SUPER FIZZBUZZ TIMES " + to_string3(
                      divideInt(n, 15) - 1
                    ) + "!"
                  )
                ])
              )
            )
          ])
        ])
      );
    } else if (acc >= 0 && acc % 15 === 0 && acc > 15) {
      let n = acc;
      loop$num = num;
      loop$acc = acc + 1;
      loop$textlist = flatten(
        toList([
          textlist,
          toList([
            centre2(
              toList([]),
              p(
                toList([text_3xl()]),
                toList([text("SUPER FIZZBUZZ!")])
              )
            )
          ])
        ])
      );
    } else if (acc >= 0 && acc % 15 === 0) {
      let n = acc;
      loop$num = num;
      loop$acc = acc + 1;
      loop$textlist = flatten(
        toList([
          textlist,
          toList([
            centre2(
              toList([]),
              p(
                toList([text_2xl()]),
                toList([text("FIZZBUZZ!")])
              )
            )
          ])
        ])
      );
    } else if (acc >= 0 && acc % 3 === 0) {
      let n = acc;
      loop$num = num;
      loop$acc = acc + 1;
      loop$textlist = flatten(
        toList([
          textlist,
          toList([div(toList([]), toList([text("fizz")]))])
        ])
      );
    } else if (acc >= 0 && acc % 5 === 0) {
      let n = acc;
      loop$num = num;
      loop$acc = acc + 1;
      loop$textlist = flatten(
        toList([
          textlist,
          toList([div(toList([]), toList([text("buzz")]))])
        ])
      );
    } else if (acc >= 0) {
      let n = acc;
      loop$num = num;
      loop$acc = acc + 1;
      loop$textlist = flatten(
        toList([
          textlist,
          toList([
            div(toList([]), toList([text(to_string3(acc))]))
          ])
        ])
      );
    } else {
      throw makeError(
        "panic",
        "components/fizzbuzz",
        106,
        "do_fizzbuzz",
        "panic expression evaluated",
        {}
      );
    }
  }
}
function fizzbuzz(num) {
  return toList([
    centre2(
      toList([inline()]),
      div(
        toList([
          style(
            toList([
              ["display", "flex"],
              ["align-items", "center"],
              ["flex-wrap", "wrap"],
              ["gap", "10px"]
            ])
          )
        ]),
        do_fizzbuzz(num, 1, toList([]))
      )
    )
  ]);
}

// build/dev/javascript/lustre_sandbox/pages/about.mjs
function about(model) {
  return div(
    toList([style(toList([["min-height", "80rem"]]))]),
    toList([
      prose2(
        toList([full()]),
        toList([
          centre2(
            toList([]),
            h1(
              toList([pb_lg()]),
              toList([text("TRAINING ARC")])
            )
          )
        ])
      ),
      centre2(
        toList([warning(), pb_lg()]),
        button3(
          toList([
            on_click(
              new IntMessage(new IntIncrement("fizzbuzz"))
            )
          ]),
          toList([
            p(
              toList([font_alt(), text_5xl()]),
              toList([text("MORE POWER")])
            )
          ])
        )
      ),
      div(
        toList([
          text_xl(),
          font_mono(),
          style(
            toList([["display", "flex"], ["justify-content", "center"]])
          )
        ]),
        fizzbuzz(
          unwrap(get(model.state.ints, "fizzbuzz"), 10)
        )
      )
    ])
  );
}

// build/dev/javascript/lustre_sandbox/pages/index.mjs
function index2(model) {
  return div(
    toList([bg_app_subtle()]),
    toList([
      div(
        toList([]),
        toList([
          centre2(
            toList([]),
            p(
              toList([text_2xl()]),
              toList([
                strong(
                  toList([]),
                  toList([
                    em(toList([]), toList([text("INDEX")]))
                  ])
                )
              ])
            )
          ),
          centre2(
            toList([mt_md()]),
            p(
              toList([
                font_mono(),
                text_lg(),
                pb_lg()
              ]),
              toList([
                text(
                  "lorem ipsum whatever my friend it's good to see you"
                )
              ])
            )
          ),
          div(
            toList([
              style(
                toList([
                  ["display", "flex"],
                  ["justify-content", "center"],
                  ["gap", "10px"]
                ])
              )
            ]),
            toList([
              button3(
                toList([
                  info(),
                  solid(),
                  style(toList([["width", "100px"]])),
                  on_click(
                    new IntMessage(new IntDecrement("icons"))
                  )
                ]),
                toList([text("-")])
              ),
              button3(
                toList([
                  success(),
                  solid(),
                  style(toList([["width", "100px"]])),
                  on_click(
                    new IntMessage(new IntIncrement("icons"))
                  )
                ]),
                toList([text("+")])
              )
            ])
          )
        ])
      ),
      centre2(
        toList([my_lg()]),
        div(
          toList([
            style(toList([["width", "full"], ["height", "4rem"]]))
          ]),
          element_clones(
            unwrap(get(model.state.ints, "icons"), 5),
            sketch_logo(
              toList([
                style(
                  toList([["width", "4rem"], ["height", "4rem"]])
                )
              ])
            )
          )
        )
      ),
      centre2(
        toList([my_lg()]),
        p(
          toList([text_4xl(), font_alt()]),
          toList([text("What is your name, my friend?")])
        )
      ),
      div(
        toList([
          style(
            toList([
              ["display", "flex"],
              ["justify-content", "space-evenly"],
              ["align-items", "center"],
              ["gap", "4rem"]
            ])
          ),
          mx_5xl(),
          pb_xl()
        ]),
        toList([
          div(
            toList([
              style(
                toList([["width", "100%"], ["min-width", "50%"]])
              )
            ]),
            toList([
              input_box(
                model,
                "name",
                "[your name]",
                toList([
                  text_2xl(),
                  style(
                    toList([
                      ["width", "100%"],
                      ["display", "flex"],
                      ["justify-content", "center"],
                      ["text-align", "center"]
                    ])
                  ),
                  primary()
                ])
              )
            ])
          ),
          div(
            toList([
              style(
                toList([["width", "100%"], ["max-width", "50%"]])
              )
            ]),
            toList([
              p(
                toList([
                  text_2xl(),
                  style(toList([["text-align", "center"]]))
                ]),
                toList([
                  (() => {
                    let $ = get(model.state.inputs, "name");
                    if ($.isOk() && $[0] !== "") {
                      let value3 = $[0];
                      return text("What's up, " + value3 + "?");
                    } else {
                      return text("What's up, [name]?");
                    }
                  })()
                ])
              )
            ])
          )
        ])
      ),
      div(
        toList([
          pb_lg(),
          (() => {
            let $ = get(model.state.inputs, "colour");
            if ($.isOk() && $[0] === "red") {
              return style(toList([["background", "#882222"]]));
            } else {
              return none2();
            }
          })()
        ]),
        toList([carousel(model, "test")])
      ),
      div(
        toList([
          bg_element_hover(),
          pb_lg(),
          style(
            toList([
              ["display", "flex"],
              ["flex-direction", "column"],
              ["justify-content", "center"],
              ["width", "100%"],
              ["align-items", "center"]
            ])
          )
        ]),
        toList([
          p(
            toList([
              text_2xl(),
              p_lg(),
              text_high_contrast()
            ]),
            toList([
              text("Input an image url below to load it on screen")
            ])
          ),
          div(
            toList([]),
            toList([
              input_box(
                model,
                "image_input",
                "[image_url]",
                toList([
                  text_2xl(),
                  style(
                    toList([["width", "full"], ["text-align", "center"]])
                  ),
                  primary()
                ])
              )
            ])
          ),
          div(
            toList([]),
            toList([
              (() => {
                let $ = get(model.state.inputs, "image_input");
                if ($.isOk() && $[0] === "") {
                  return none3();
                } else if ($.isOk()) {
                  let img2 = $[0];
                  return imageloader(
                    to_imageref("input_image", img2),
                    500,
                    600
                  );
                } else {
                  return none3();
                }
              })()
            ])
          )
        ])
      )
    ])
  );
}

// build/dev/javascript/lustre_sandbox/pages/app.mjs
function app(model) {
  return div(
    toList([]),
    toList([
      navbar(model),
      div(
        toList([
          style(
            toList([
              ["width", "full"],
              ["margin", "0 auto"],
              ["padding", "2rem"],
              [
                "background",
                unwrap(get(model.state.inputs, "colour"), "")
              ]
            ])
          )
        ]),
        toList([
          (() => {
            let $ = model.state.route;
            if ($ instanceof Index) {
              return index2(model);
            } else {
              return about(model);
            }
          })()
        ])
      ),
      footer(model)
    ])
  );
}

// build/dev/javascript/lustre_sandbox/lustre_sandbox.mjs
function initial_state() {
  let test_image = new ImageRef(
    "stars",
    "https://images.unsplash.com/photo-1733103373160-003dc53ccdba?q=80&w=1987&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  );
  let test_image2 = new ImageRef(
    "street",
    "https://images.unsplash.com/photo-1731978009363-21fa723e2cbe?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  );
  let test_image3 = new ImageRef(
    "street",
    "https://images.unsplash.com/photo-1733159775371-d70b9d6b1057?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  );
  let local_image = new ImageRef("local", "./image.jpeg");
  let images = toList([test_image2, test_image3, local_image, test_image]);
  let theme2 = new Theme(
    purple(),
    grey(),
    red(),
    yellow(),
    green(),
    blue()
  );
  return new State(
    new Index(),
    theme2,
    images,
    new$(),
    from_list(toList([["icons", 5], ["fizzbuzz", 10]])),
    from_list(
      toList([["test", new CarouselState(0, images, true)]])
    )
  );
}
function on_url_change(uri) {
  println(uri.path);
  let $ = path_segments(uri.path);
  if ($.hasLength(2) && $.head === "lustre-sandbox" && $.tail.head === "index") {
    return new OnRouteChange(new Index());
  } else if ($.hasLength(2) && $.head === "lustre-sandbox" && $.tail.head === "about") {
    return new OnRouteChange(new About());
  } else {
    return new OnRouteChange(new Index());
  }
}
function init3(_) {
  return [
    new Model2(initial_state()),
    batch(
      toList([
        init2(on_url_change),
        set_interval(
          1e3,
          new IntMessage(new IntIncrement("fizzbuzz"))
        ),
        set_interval(
          5e3,
          new CarouselMessage(new NextSlideIfAuto("test"))
        )
      ])
    )
  ];
}
function update(model, msg) {
  if (msg instanceof OnRouteChange) {
    let route = msg[0];
    return [new Model2(model.state.withFields({ route })), none()];
  } else if (msg instanceof StateReset) {
    return [
      new Model2(initial_state().withFields({ route: model.state.route })),
      none()
    ];
  } else if (msg instanceof InputUpdate) {
    let name = msg[0];
    let value3 = msg[1];
    return [
      new Model2(
        model.state.withFields({
          inputs: insert(model.state.inputs, name, value3)
        })
      ),
      none()
    ];
  } else if (msg instanceof IntMessage) {
    let intmsg = msg[0];
    return message_handler2(model, intmsg);
  } else {
    let carouselmsg = msg[0];
    return message_handler(model, carouselmsg);
  }
}
function view(model) {
  return div(
    toList([]),
    toList([
      stack2(
        toList([id("container")]),
        toList([
          theme(model.state.theme),
          elements2(),
          app(model)
        ])
      )
    ])
  );
}
function main() {
  let app2 = application(init3, update, view);
  let $ = start2(app2, "#app", void 0);
  if (!$.isOk()) {
    throw makeError(
      "assignment_no_match",
      "lustre_sandbox",
      26,
      "main",
      "Assignment pattern did not match",
      { value: $ }
    );
  }
  return void 0;
}

// build/.lustre/entry.mjs
main();
