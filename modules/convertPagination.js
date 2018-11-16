
var convertPagination = function(resource, currentPage){
  // 分頁
  var totalResult = resource.length; //總資料
  var perpage = 3; //每頁多少資料
  var pageTotal = Math.ceil(totalResult / perpage); //總頁數
  // var currentPage = 2;
  if(currentPage > pageTotal) {
    currentPage = pageTotal;
  }

  var minItem = (currentPage * perpage) - perpage +1;
  var maxItem = (currentPage * perpage);
  var data = [];
  resource.forEach(function(item,i){
    var itemNum = i + 1;
    if(itemNum >= minItem && itemNum <= maxItem){
      data.push(item);
    }
  });
  var page = {
    pageTotal: pageTotal,
    currentPage: currentPage,
    hasPre: currentPage > 1,
    hasNext: currentPage < pageTotal
  }
  return{
    page,
    data
  }
}

module.exports = convertPagination;

