export function sortData(data) {
  return data.sort((a, b) => {
    if(a.Year !== b.Year) {
      return a.Year - b.Year
    }
    return b.Poultry - a.Poultry;
  })
}