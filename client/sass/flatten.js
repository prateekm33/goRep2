function flatten(arr) {
  // do other stuff to sanitize



  function helper(arr) {
    const newArr = [];

    arr.forEach(el => {
      if (Array.isArray(el)) newArr.push(...helper(el));
      else newArr.push(el);
    });

    return newArr;
  }

  return helper(arr);

}


// const a = flatten([ [1,2,3] , [4,5,6], [[7,8,9], [10, 11, 12]] ]);

// console.log('a: ', a);


function flatten2(arr) {
  // if array.length === 1 
  if (arr.length === 1) {
    if (Array.isArray(arr[0]) && arr[0].length > 1) return flatten2(arr[0]);
    return [arr[0]];
  }

  // split array in half
  // if array.length > 1 --- flatten
  const mid = Math.floor(arr.length / 2);
  const left = arr.slice(0, mid);
  const right = arr.slice(mid);
  return [...flatten2(left), ...flatten2(right)];
}

function flatten3(arr1) {
  const sol = [];

  function recursion(arr, i = 0) {

    if (Array.isArray(arr) && arr[i].length > 1) {
      recursion(arr[i]);
    } else if (typeof arr[i] !== 'undefined') {
      sol.push(arr[i]);
      recursion(arr[i]);
    }
  }

  recursion(arr1, 0);
  return sol;
}

// flatten3(arr);

const c = flatten3([ [1,2,3] , [4,5,6], [[7,8,9], [10, 11, 12]] ]);
console.log("c: ", c)

// const b = flatten2([ [1,2,3] , [4,5,6], [[7,8,9], [10, 11, 12]] ]);
// console.log("b: ", b)