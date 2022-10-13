// This function will take in the current state of the notes
// and return a JSON object of the notes sorted according to the
// passed params
export function SortNotesFactory(notes, ascending = true) {
  let sortedJsonObject = {};

  // sort keys
  let keySortedArray = [];
  Object.keys(notes).map(key => {
    keySortedArray.push(key);
  });

  keySortedArray.sort((keyA, keyB) => {
    return keyA < keyB;
  });

  keySortedArray.map(key => {
    sortedJsonObject = {
      ...sortedJsonObject,
      key: notes[key]
    };
  });
}
