export const CreateFriendlyPreviewUrl = (url) => {
    return url.split("?")[0].split(/http[s]*:?{?\/{0,2}w*\.?/)[1];
}