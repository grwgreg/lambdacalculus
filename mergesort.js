//untyped lambda calculus
//can only:
//1. refer to argument variables
//2. create functions
//3. call functions

x => y => x(y)

//I won't use braces so remember this is valid js
//equivalent to (((a(b))(c))(d))	
//a(b)(c)(d)

//also we'll resrtict to only single arg vars
((x,y) => x + y)(3,4)
//rewrite as:
(x => y => x + y)(3)(4)

//numbers
const zero = x => y => y//call x zero times on y
const one = x => y => x(y)//call x one time on y
const two = x => y => x(x(y))//call x two times on y
const three = x => y => x(x(x(y)))//call x n times on y

//to convert the lambda calculus style numbers (church encoded numerals)
//to normal js numbers we can use this function
//see this will exand to essentially plus1(plus1(plus1(0))) for three
//note I'm using the full "function()" syntax to mark this as a helper
function toInteger(x) {
  return x(n => n+1)(0)
}

console.log(toInteger(two))//2

//helper to write number functions
function makeNum(n) {
  let str = 'x => y => '
  let i = n
  while (i-- > 0) str += 'x('
  str += 'y'
  while (++i < n) str += ')'
  return eval(str) 
}

//booleans
const _true = x => y => x
const _false = x => y => y

function toBoolean(x){
 return x(true)(false)
}

//note this is just sugar, true&false fns do real work
//const _if = b => x => y => b(x)(y)
//can simplify to this
const _if = b => b
//then you can use for control flow like so:
//_if(somePredicate)(
//  consequentFn
//)(
//  alternativeFn
//)


//predicates
//tricky- use the fact that all number fns invoke first arg 
//at least once except for zero
//so isZero(two) is essentially false(false(true))
//while isZero(zero) just returns true
const isZero = n => n(x => _false)(_true)

//pairs
//key idea with pairs is the pair fn takes 3 args
//but we refer to it as a pair when only 2 args have been invoked on it
//the 3rd arg is a function that will be passed the values from the pair
const pair = x => y => f => f(x)(y)
const left = p => p(x => y => x)
const right = p => p(x => y => y)

//numeric operations
//remember numbers are represented by how many times you invoke x with y
//so to add one, return a new number function that invokes x one more time
//on the result of calling the number fn
const increment = n => x => y => x(n(x)(y))

//decrementing is harder to implement because we can't undo fn calls
//so we have to pass the number fn a pair making fn that keeps
//the last two values. Then when done, we grab the n-1 value off the pair

//slide fn takes a pair, creates a new pair with right value
//and incremented right value
//note the left pair is never used for zero'th pair so it's ok
//we don't have a negative number representation
const slide = p => pair(right(p))(increment(right(p)))

//our dec fn then returns the left value of the number
//function, n, invoked with the slide function and initial
//value of a pair of zero,zero
//remember first invocation of slide with pair(*anything*)(zero) 
//will return pair(zero)(one)
const decrement = n => left(n(slide)(pair(zero)(zero)))

//both m and n are number fns
//increment m n times
const add = m => n => n(increment)(m)
const subtract = m => n => n(decrement)(m)

//add m n times starting from 0
const multiply = m => n => n(add(m))(zero)

//multiply m n times starting from 1
const power = m => n => n(multiply(m))(one)

//note to get normal less than we can just increment/decrement the m/n args
//this relies on zero being as low as the slide fn will go
//remember we have no negative number representation
const lessOrEqual = m => n => isZero(subtract(m)(n))


//Y combinator wont work in strict language (applicative evaluation)
//f(x(x)) in the argument is the problem, we have to defer it
//invoking this will recurse infinitely
//const Y = f => (x => f(x(x)))(x => f(x(x)))

//defer x(x) calls with an 'inert' y => x(x)(y)
const Z = f => (x => f(y => x(x)(y)))(x => f(y => x(x)(y)))
//at the end of this file I'm going to replace all javascript variables with their function bodies
//Z and some other functions are defined and then called so using the function's toString
//will lose some info. Instead I'm going to keep a string version of the definition.
const ZStr = `f => (x => f(y => x(x)(y)))(x => f(y => x(x)(y)))`

//modulus, repeatedly subtract the value
//note how zcombinator is used, the f param is
//a self reference to mod and we use it recursively
//ie in js:
//mod = (m,n) => n<=m ? mod(m-n,n) : m
//we have to wrap our use of the self reference in an inert function
const mod = Z(f => m => n =>
  _if(lessOrEqual(n)(m))(
    x => f(subtract(m)(n))(n)(x)
  )(
    m
  )
)
const modStr = `Z(f => m => n =>
  _if(lessOrEqual(n)(m))(
    x => f(subtract(m)(n))(n)(x)
  )(
    m
  )
)`

//linked lists
//first value in list is whether the list is empty or not
//2nd value is actual list
const empty = pair(_true)(_false)//_false here can be anything, it should never be invoked
const unshift = l => x => pair(_false)(pair(x)(l))
const isEmpty = left
const first = l => left(right(l))
const rest = l => right(right(l))

const emptyStr = `pair(_true)(_false)`

//helper to view values in a list
function toArray(proc) {
  let arr = []

  while(!toBoolean(isEmpty(proc))) {
    arr.push(first(proc))
    proc = rest(proc)
  }

  return arr
}


//fold takes a list (l), an initial accumulator (x) and a fn (g) to invoke for each element
//g takes a list and an element from the list as we move through it
const fold = Z(f => 
  l => x => g =>
    _if(isEmpty(l))(
      x
    )(
      y => g(f(rest(l))(x)(g))(first(l))(y)
    )
)

const foldStr = `Z(f => 
  l => x => g =>
    _if(isEmpty(l))(
      x
    )(
      y => g(f(rest(l))(x)(g))(first(l))(y)
    )
)`

//k is a list
const map = k => f => 
  fold(k)(empty)(
    l => x => unshift(l)(f(x))
  )

//counts how many time you can subtract n from m
const div = Z(f => m => n => 
  _if(lessOrEqual(n)(m))(
    x => increment(f(subtract(m)(n))(n))(x)
  )(
    zero
  )
)

const divStr = `Z(f => m => n => 
  _if(lessOrEqual(n)(m))(
    x => increment(f(subtract(m)(n))(n))(x)
  )(
    zero
  )
)`


let merge = Z(f => a => b =>
  _if(isEmpty(a))(
    b
  )(
   _if(isEmpty(b))(
      a
    )(
      _if(lessOrEqual(first(a))(decrement(first(b))))(
        x => unshift(f(rest(a))(b))(first(a))(x)
      )(
        x => unshift(f(rest(b))(a))(first(b))(x)
      )
    )
  )
)

let mergeStr = `Z(f => a => b =>
  _if(isEmpty(a))(
    b
  )(
   _if(isEmpty(b))(
      a
    )(
      _if(lessOrEqual(first(a))(decrement(first(b))))(
        x => unshift(f(rest(a))(b))(first(a))(x)
      )(
        x => unshift(f(rest(b))(a))(first(b))(x)
      )
    )
  )
)`

let count = l => fold(l)(zero)(i => _ => increment(i))

//to split, we have to build up 2 new lists
//we'll do this by calling fold on the list and adding to the left list
//if the current index is lower than our mid point. we add to the right
//list if the index is higher. we have to implement our own index counter which
//we'll store in a pair. so our accumulator argument is a pair with left value
//set as the pair of lists and the right value as the index of the current list
//element.
let split = l => c =>//l is list, c is midpoint number
  left(//left because fold here returns a pair and we only want the left value
    fold(l)(
      pair(//accumulator inits as pair(pair(leftHalfList, rightHalfList), zero)
        pair(empty)(empty)
      )(
        zero
      )
    )(
      a => e => //a is accumulator, e is element of list
        _if(lessOrEqual(right(a))(decrement(c)))(
          pair(
            pair(
              unshift(left(left(a)))(e)//add current element to left half list
            )(
              right(left(a))//right half of list is unchanged
            )
          )(increment(right(a)))
        )(
          pair(
            pair(
              left(left(a))
            )(
              unshift(right(left(a)))(e)
            )
          )(increment(right(a)))
        )
    )
  )

let splitStr = `l => c =>
  left(
    fold(l)(
      pair(
        pair(empty)(empty)
      )(
        zero
      )
    )(
      a => e =>
        _if(lessOrEqual(right(a))(decrement(c)))(
          pair(
            pair(
              unshift(left(left(a)))(e)
            )(
              right(left(a))
            )
          )(increment(right(a)))
        )(
          pair(
            pair(
              left(left(a))
            )(
              unshift(right(left(a)))(e)
            )
          )(increment(right(a)))
        )
    )
  )`

let pairMap = p => f => 
  pair(
    f(left(p))
  )(
    f(right(p))
  )

let mergePair = p => merge(left(p))(right(p))

let mergeSort = Z(f => l =>
  _if(isEmpty(rest(l)))(
    l
  )(
    x => mergePair(
        pairMap(split(
            l//split the list
          )(
            div(count(l))(two)//midpoint count(l)/2
          )
        )(f)
    )(x)
  )
)

let mergeSortStr = `Z(f => l =>
  _if(isEmpty(rest(l)))(
    l
  )(
    x => mergePair(
        pairMap(split(
            l
          )(
            div(count(l))(two)
          )
        )(f)
    )(x)
  )
)`

let list = unshift(unshift(unshift(unshift(empty)(makeNum(1)))(makeNum(4)))(three))(makeNum(5))
list = unshift(list)(makeNum(6))

//adding too many elements will take a looooong time to compute
//on my machine sorting only 7 elements takes about 10 seconds
list = unshift(list)(makeNum(8))
//list = unshift(list)(makeNum(2))
//list = unshift(list)(makeNum(5))
//list = unshift(list)(makeNum(9))
//list = unshift(list)(makeNum(7))

console.log('list before sort:', toArray(list).map(n => toInteger(n)))
console.log('list after sort', toArray(mergeSort(list)).map(n => toInteger(n)))


//To finish off we replace all the variables with their full function definitions
//we wrap the replacement in parens to make sure it parses correctly

//order matters!, have to replace 'mapThing' before 'map' or 'Thing'
let namedFuns = [
'one',
'two',
'unshift',
'rest',
'fold',
'_if',
'isEmpty',
'empty',
'first',
'rest',
'right',
'left',
'_true',
'_false',
'mod',
'subtract',
'lessOrEqual',
'decrement',
'slide',
'isZero',
'zero',
'increment',
'div',
'count',
'mergePair',
'pairMap',
'pair',
'split',
'merge',
'Z',
'map',
]

console.log('mergeSortStr before replacing variables:', mergeSortStr)

let i = 1 
//some functions are essentially defined like
//const someFn = (param => body)(argument)
//so someFn's toString method is the function that results from this call
//we want a strict replacement so I have the code in strings
//toString also preserves comments which we don't want in the final version
let fnStrs = {
  mod: modStr,
  fold: foldStr,
  div: divStr,
  empty: emptyStr,
  split: splitStr,//split had comments
  merge: mergeStr,
  Z: ZStr
}
while(i > 0) {
  i = namedFuns.length
  namedFuns.forEach(fn => {
    let regex = new RegExp(fn, 'g')
    if (!mergeSortStr.match(regex)) i--
    else if (fnStrs[fn]) {
      mergeSortStr = mergeSortStr.replace(regex, '(' + fnStrs[fn] + ')')
    } else {
      mergeSortStr = mergeSortStr.replace(regex, '(' + eval(fn).toString() + ')')
    }
  })
}

//clean up white space, newlines
mergeSortStr = mergeSortStr.replace(/[\s]+/g, ' ')
console.log('mergeSortStr after:', mergeSortStr)
let finalMergesort = eval(mergeSortStr)
console.log('check if our final method actually works:', toArray(finalMergesort(list)).map(n => toInteger(n)))
