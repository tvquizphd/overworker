export const equal_sets = (as, bs) => {
	if (as.size !== bs.size) return false;
	for (var a of as) if (!bs.has(a)) return false;
	return true;
}
