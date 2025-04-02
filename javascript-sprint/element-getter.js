const getFirstElement = (a) => getElementByIndex(a, 0);

const getLastElement = (a) => getElementByIndex(a, a.length - 1);

const getElementByIndex = (a, index) => {
    if (!a || a.length === 0) {
        return undefined;
    }
    return a[index];
};