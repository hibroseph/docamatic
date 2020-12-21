export const CreateFriendlyPreviewUrl = (url) => {
    return url.split("?")[0].split(/http[s:/]*/)[1];
}