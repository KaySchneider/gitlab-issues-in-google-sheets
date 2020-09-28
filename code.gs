var SERVER='gitlab.com';
var PRIVATETOKEN='';

function _getValue(pointNotation, resultObj){
  var fields=pointNotation.split(".");
  while(fields.length>0){
    resultObj=resultObj[fields.shift()];
    if(!resultObj) return "";
  }
  return resultObj;
}

function _gitlabIssues(url, fields){
  Logger.log(url);
  var result=UrlFetchApp
  .fetch(url, {
    "method" : "get",
    "headers": {'PRIVATE-TOKEN': PRIVATETOKEN},
  });
  
  var resultArray=[];
  var fields=fields.split(",");
  var resultObj=JSON.parse(result);
  for(var i=0; i<resultObj.length; i++){
    var issue=resultObj[i];
    var row=[];
    fields.forEach(field=>{
      row.push(_getValue(field, issue));
    });
    resultArray.push(row);
  }

  return resultArray;
}

/**
 * Querys issues on gitlab group
 *
 * @param {string} group
 * @param {string} params eg. "state=opened"
 * @param {string} ticket fields ("project_id,iid,title,author.name,milestone.title,milestone.due_date")
 * @return value
 * @customfunction
 */
function gitlabGroupIssues(group, params, fields) {
  return _gitlabIssues('https://'+SERVER+'/api/v4/groups/'+encodeURIComponent(group)+'/issues'+'?'+params, fields);
}

/**
 * Querys issues on gitlab project
 *
 * @param {string} project
 * @param {string} params eg. "state=opened"
 * @param {string} ticket fields ("project_id,iid,title,author.name,milestone.title,milestone.due_date")
 * @return value
 * @customfunction
 */
function gitlabProjectIssues(group, params, fields) {
  return _gitlabIssues('https://'+SERVER+'/api/v4/projects/'+encodeURIComponent(group)+'/issues'+'?'+params, fields);
}
