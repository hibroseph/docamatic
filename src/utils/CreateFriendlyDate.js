export const CreateFriendlyDate = (dateInMs) => {
    console.log("creating a date for " + dateInMs)
    let newDate = new Date(parseInt(dateInMs));
    console.log(newDate)
    return `${newDate.toLocaleDateString()} ${newDate.toLocaleTimeString()}`;
}