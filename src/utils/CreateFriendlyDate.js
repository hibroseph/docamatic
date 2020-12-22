export const CreateFriendlyDate = (dateInMs) => {
    let newDate = new Date(dateInMs);
    return `${newDate.toLocaleDateString()} ${newDate.toLocaleTimeString()}`;
}