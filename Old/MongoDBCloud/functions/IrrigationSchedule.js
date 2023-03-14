exports = function() {
  let evenDays = [
    [
      [1, 'A', 'O']
    ],
    [],
    [],
    [],
    [
      [1, 'A', 'C'],
      [1, 'B', 'O'],
    ],
    [],
    [],
    [],
    [
      [1, 'B', 'C']
    ],
    [],
    [],
    [],
    [] // end, 12
  ];
  
  let oddDays = [
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [] // end, 12
  ];
  
  
  let date = new Date();
  let timeSelection = date.getHours() - 2; // -2 because GMT is 7 hours ahead, minus 2 hours makes 7pm === 0
  
  let start = new Date(date.getFullYear(), 0, 0);
  let diff = date - start;
  let oneDay = 1000 * 60 * 60 * 24;
  let dayOfYear = Math.floor(diff / oneDay);
  let timeSeries = dayOfYear % 2 ? oddDays : evenDays;
  
  console.log(timeSelection);
  console.log(timeSeries);
  
  if(timeSelection <= 12) {
    for (controlArgs of timeSeries[timeSelection]) {
      if(controlArgs.length > 0) {
        console.log(controlArgs);
        context.functions.execute("AddControl", controlArgs[0], controlArgs[1], controlArgs[2]);
      }
    }
  }
  
  
  return true;
};