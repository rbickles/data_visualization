export async function fetchCsvData(filePath) {
  try {
      const response = await fetch(filePath);
      const text = await response.text();
      const jsonData = csvToJson(text);
      //console.log("Converted JSON Data:", jsonData);
      return jsonData;
  } catch (error) {
      console.error("Error fetching CSV file:", error);
  }
}

// Function to convert CSV text to JSON
function csvToJson(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    return headers.reduce((acc, header, index) => {
      let value = values[index]?.trim() || null;
      // Convert to float if the value is numeric
      if (!isNaN(value) && value !== null && value !== '') {
        value = parseFloat(value);
      }
      
      acc[header] = value;
      return acc;
    }, {});
  });
}

