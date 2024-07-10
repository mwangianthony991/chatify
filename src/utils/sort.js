export const compareName = (a, b) => {
    // converting to uppercase to have case-insensitive comparison
    const name1 = a.username.toUpperCase();
    const name2 = b.username.toUpperCase();

    let comparison = 0;

    if (name1 > name2) {
        comparison = 1;
    } else if (name1 < name2) {
        comparison = -1;
    }
    return comparison;
}
