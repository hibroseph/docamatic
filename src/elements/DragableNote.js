import interact from 'interactjs';

interact('dragable_note')
.on('dragstart', (event) => {
    console.log("You started dragging!");
    console.log(event.pageX);
    console.log(event.pageY);
})
.on('dragend', (event) => {
    console.log("YOU ENDED DRAGGING!");
})