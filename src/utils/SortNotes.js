// This function will take in the current state of the notes
// and return a JSON object of the notes sorted according to the
// passed params
export function SortNotesFactory(notes, ascending = true) {
  let sortedJsonObject = {};

  // sort keys
  let keySortedArray = [];
  Object.keys(notes).map(key => {
    console.log(`adding key "${key}" to array`);
    keySortedArray.push(key);
  });

  console.log("array");
  console.log(keySortedArray);

  keySortedArray.sort((keyA, keyB) => {
    console.log(`Sorting ${keyA} with ${keyB}`);
    return keyA < keyB;
  });

  console.log("array after sorting");
  console.log(keySortedArray);

  keySortedArray.map(key => {
    sortedJsonObject = {
      ...sortedJsonObject,
      key: notes[key]
    };
  });

  console.log("SORTED");
  console.log(sortedJsonObject);
}
