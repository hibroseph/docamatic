export const CreateFriendlyDate = (dateInMs, sortBy = 'minute') => {
    let newDate = new Date(parseInt(dateInMs));
    console.log("formatting date for " + sortBy)
    switch (sortBy) {
        case 'second':
            return `${newDate.toLocaleDateString()} ${newDate.toLocaleTimeString()}`;
        case 'minute':
            return `${newDate.toLocaleDateString()} ${newDate.toLocaleTimeString('default', { hour: 'numeric', minute: 'numeric' })}`
        case 'hour':
            return `${newDate.toLocaleDateString()} ${newDate.toLocaleTimeString('default', { hour: 'numeric' })}`
        case 'day':
            return `${newDate.toLocaleDateString()}`
        default:
            throw new error("Unhandled case in CreateFriendlyDate");
    }
}