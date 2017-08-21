//https://www.youtube.com/watch?v=FITJMJjASUs
//ruby code from this talk translated to js

let fact = n => n===0 ? 1 : n * fact(n-1)
console.log('fact(5):', fact(5))

//in lambda calculus all functions are anonymous
//so can't refer to fact from within fact

//28:20
//we could refer to fact if it was passed as an arg
fact => n => n===0 ? 1 : n * fact(n-1)

//going to get sloppy evaluating these inline and logging
//so assign to o for output
let o
o = (fact => n => n===0 ? 1 : n * fact(n-1))(fact)(5)
console.log('1:', o)

//it works, let's make a "factorial improver"
//it doesn't need a full factorial function
//only a factorial function that works on a subset of inputs
//When passed to factImprover, it adds 1 to the domain of the partial function
let factImprover = partial => n => n===0 ? 1 : n * partial(n-1)

let err = n => {throw "should not have been called"}

//the base case in factImprover of n==0 serves as an initial partial factorial function
o = factImprover(err)(0)
console.log('2:', o)

//we can build up from here using the improver
//light bulbs should be going off that the fixed point of improver is the factorial function
//and that from an implementation perspective, if would figure out a way to continuously invoke
//the improver when we need it, we would have a working factorial function
let fact0 = factImprover(err)
let fact1 = factImprover(fact0)
let fact2 = factImprover(fact1)
let fact3 = factImprover(fact2)
let fact4 = factImprover(fact3)
o = fact4(4)
console.log('3:', o)
//outputs 4*3*2*1 = 24

//32:40 do same trick of making the improver an argument
//let fx = (improver => ...can compute factorials here..)(partial => n => n===0 ? 1 : n * partial(n-1))

//expression that evaluates factorial(3)
o = (improver => improver(improver(improver(improver(err)))))(partial => n => n===0 ? 1 : n * partial(n-1))(3)
console.log('4:', o)

//33:40
//instead of using improver(err) as seed, just pass improver
//it will still work for 0 because we never call partial
let fx = (improver => improver(improver))(partial => n => n===0 ? 1 : n * partial(n-1))
o = fx(0)
console.log('5:', o)
//will fail for 1, partial is called with a number but improver takes functions
//o = fx(1)

//partial expects a function so we can pass it partial (which will be bound to improver)
//we already know improver(improver) works for our base case
fx = (improver => improver(improver))(partial => n => n===0 ? 1 : n * partial(partial)(n-1))
o = fx(1)
console.log('6:', o)

//magic, it now works for all numbers
o = fx(4)
console.log('7:', o)

//jim renames partial to improver in the argument (he later renames it to generator)
//In the body we are calling improver(improver) and we bind improver to our function that
//takes a partial function... but because we call improver(improver), eventually that partial
//function will be bound to the improver parameter... so I guess it makes sense to just rename
//it as improver since that is how it will eventually be used
//This is the trickiest part to understand in my opinion.
//After this it's just refactoring, pulling out the recursive function body
fx = (improver => improver(improver))(improver => n => n===0 ? 1 : n * improver(improver)(n-1))
o = fx(5)
console.log('8:', o)

//38:20, improver renamed to gen for generator. It isn't really improving on our function anymore
//it is now a higher order function that takes an improver
fx = (gen => gen(gen))(gen => n => n===0 ? 1 : n * gen(gen)(n-1))

//not in talk:
//what does this look like when we expand it out?
// 1 (gen => gen(gen))(gen => n => n===0 ? 1 : n * gen(gen)(n-1))
// 2 (gen => n => n===0 ? 1 : n * gen(gen)(n-1))(gen => n => n===0 ? 1 : n * gen(gen)(n-1))
// 3 (n => n===0 ? 1 : n * (gen => n => n===0 ? 1 : n * gen(gen)(n-1))(gen => n => n===0 ? 1 : n * gen(gen)(n-1))(n-1))
//so we end up here, at a function that takes an n
//and within the body of this function, gen is bound to the function:
//(gen => n => n===0 ? 1 : n * gen(gen)(n-1))
//and within the body, gen(gen) will expand the same as #2 above
//
//This is too tricky to fully take in but key idea is gen(gen) used within the body of the function expands into
//a partial factorial function that within it also has a call to gen(gen)
//when we hit the base case we don't invoke gen(gen) and this recursive process stops

//At this point we have the recursive magic for factorial working
//the rest of this talk is pulling out the factorial specific code
//resulting in the Z combinator


//wrap our factorial function body in iife
//we use a param of 'code' and we pass in the err fn from above, it is never used
fx = (gen => gen(gen))(gen => (code => n => n===0 ? 1 : n * gen(gen)(n-1))(err))
o = fx(5)
console.log('9:', o)

//it'd be better to not use the err fn because we want this to be lambda calculus
//instead we'll pass in gen(gen)
//remember above we were able to do similar to get rid of the err function?

//this will cause infinite recursion!
//this is the f(x(x)) as a function argument in the ycombinator
//in applicative languages it gets evaluated before binding to the parameter
//fx = (gen => gen(gen))(gen => (code => n => n===0 ? 1 : n * gen(gen)(n-1))(gen(gen)))
//we fix by wrapping in a lambda
fx = (gen => gen(gen))(gen => (code => n => n===0 ? 1 : n * gen(gen)(n-1))(v => gen(gen)(v)))
o = fx(5)
console.log('10:', o)

//not in talk, my notes:
//replacing gen(gen) with v => gen(gen)(v) is equivalent because gen(gen) returns a fn
//so imagine some function that takes gen(gen) as an arg
//(a => a(y))(gen(gen))
////evals to:
////gen(gen)(y)
////when we pass our replacement:
//(a => a(y))(v => gen(gen)(v))
////evals to
//(v => gen(gen)(v))(y)
//gen(gen)(y)

//remember at this point, v => gen(gen)(v) isn't invoked anywhere yet, 3(4) would throw a runtime error
fx = (gen => gen(gen))(gen => (code => n => n===0 ? 1 : n * gen(gen)(n-1))(v => gen(gen)(v) && 3(4)))
o = fx(5)
console.log('11:', o)

//in our factorial body we call gen(gen)(n-1), we can replace gen(gen) with code because our argument is equivalent
fx = (gen => gen(gen))(gen => (code => n => n===0 ? 1 : n * code(n-1))(v => gen(gen)(v)))
o = fx(5)
console.log('12:', o)

//41:25 rename code to partial and this section of code is same as what we were calling improver
fx = (gen => gen(gen))(gen => (partial => n => n===0 ? 1 : n * partial(n-1))(v => gen(gen)(v)))
//improver: partial => n => n===0 ? 1 : n * partial(n-1)

//so lets extract out improver as an argument and we remove the factorial specific code
//from the recursive function and put it into an argument
//at this point we're using the full z combinator just with different names
fx = (improver => (gen => gen(gen))(gen => improver(v => gen(gen)(v))))(partial => n => n===0 ? 1 : n * partial(n-1))
o = fx(5)
console.log('13:', o)

//44:00
//instructive names to see moving pieces
let fact_improver = partial => n => n===0 ? 1 : n * partial(n-1)
let Z = improver => (gen => gen(gen))(gen => improver(v => gen(gen)(v)))
let factorial = Z(fact_improver)
o = factorial(5)
console.log('14:', o)

//can we improve on a fully working implementation?
let improved = fact_improver(factorial)
o = improved(5)
console.log('15:', o)

//no, the fully working implementation is the fixed point of the improver function
improved = fact_improver(fact_improver(fact_improver(fact_improver(factorial))))
o = improved(5)
console.log('16:', o)

//common letter names for the combinator
Z = f => (x => x(x))(x => f(v => x(x)(v)))

//in lazy languages the args aren't evaluated before the body of the function is called
//so we can remove the wrapper of argument
//this is the cute version math nerds like... won't work in js
Y = f => (x => x(x))(x => f(x(x)))
