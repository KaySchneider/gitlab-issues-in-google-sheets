const SERVER='';
const PRIVATETOKEN='';

function _getValue(pointNotation, resultObj){
    var fields=pointNotation.split(".");
    while(fields.length>0){
        resultObj=resultObj[fields.shift()];
        if(!resultObj) return "";
    }
    return resultObj;
}


async function _gitlabIssues(url, fields){
    var result=UrlFetchApp
        .fetch(url, {
            "method" : "get",
            "headers": {'PRIVATE-TOKEN': PRIVATETOKEN},
        });
    var li = returnLi();
    var resultArray=[];
    var fieldsOrig=fields; //copy of fields without modifications
    var fields=fields.split(",");
    var resultObj=JSON.parse(result);
    var headers = result.getAllHeaders();
    var headerPages = li.parse(headers['Link']);

    for(var i=0; i<resultObj.length; i++){
        var issue=resultObj[i];
        var row=[];
        fields.forEach(field=>{
            let fieldValue=_getValue(field, issue);
            if(Array.isArray(fieldValue)) {
                fieldValue=fieldValue.join(" ,");
            }
            row.push(fieldValue);
        });
        resultArray.push(row);
    }

    //gitlab keyset pagination
    if(headerPages["next"]) {
        let subArr = await _gitlabIssues(headerPages["next"], fieldsOrig);
        resultArray=resultArray.concat(subArr);
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
    return _gitlabIssues('https://'+SERVER+'/api/v4/groups/'+encodeURIComponent(group)+'/issues'+'?'+_extendPagination(params), fields);
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
    return _gitlabIssues('https://'+SERVER+'/api/v4/projects/'+encodeURIComponent(group)+'/issues'+'?'+_extendPagination(params), fields);
}


//create Object from Url param string
function _buildObjectFromUrlString(urlString){
    let paramObject={};
    let paramsSplitted=urlString.split("&");
    paramsSplitted.map((param)=> {
        let keyV=param.split("=");
        let key=keyV[0];
        let value=keyV[1];
        paramObject[key]=value;
    });
    return paramObject;
}

//simple replacement for URLSearchParams
String.prototype.addQuery = function(obj) {
    return this + Object.keys(obj).reduce(function(p, e, i) {
        return p + (i == 0 ? "" : "&") +
            (Array.isArray(obj[e]) ? obj[e].reduce(function(str, f, j) {
                return str + e + "=" + encodeURIComponent(f) + (j != obj[e].length - 1 ? "&" : "")
            },"") : e + "=" + encodeURIComponent(obj[e]));
    },"");
}

//add  params for pagination if missing
function _extendPagination(params)  {
    let paramObject = _buildObjectFromUrlString(params);
    if(!paramObject["pagination"]){
        paramObject["pagination"]="keyset";
    }
    if(!paramObject["order_by"]){
        //updated_at label_priority  due_date title weight relative_position
        paramObject["order_by"]="created_at";
    }
    return "".addQuery(paramObject);
}



//this is the source of npm package li
//https://www.npmjs.com/package/li
//https://github.com/jfromaniello/li#readme
function returnLi() {

    // compile regular expressions ahead of time for efficiency
    var relsRegExp = /^;\s*([^"=]+)=(?:"([^"]+)"|([^";,]+)(?:[;,]|$))/;
    var sourceRegExp = /^<([^>]*)>/;
    var delimiterRegExp = /^\s*,\s*/;

    return {
        parse: function (linksHeader, options) {
            var match;
            var source;
            var rels;
            var extended = options && options.extended || false;
            var links = [];

            while (linksHeader) {
                linksHeader = linksHeader.trim();

                // Parse `<link>`
                source = sourceRegExp.exec(linksHeader);
                if (!source) break;

                var current = {
                    link: source[1]
                };

                // Move cursor
                linksHeader = linksHeader.slice(source[0].length);

                // Parse `; attr=relation` and `; attr="relation"`

                var nextDelimiter = linksHeader.match(delimiterRegExp);
                while(linksHeader && (!nextDelimiter || nextDelimiter.index > 0)) {
                    match = relsRegExp.exec(linksHeader);
                    if (!match) break;
                    // Move cursor
                    linksHeader = linksHeader.slice(match[0].length);
                    nextDelimiter = linksHeader.match(delimiterRegExp);


                    if (match[1] === 'rel' || match[1] === 'rev') {
                        // Add either quoted rel or unquoted rel
                        rels = (match[2] || match[3]).split(/\s+/);
                        current[match[1]] = rels;
                    } else {
                        current[match[1]] = match[2] || match[3];
                    }
                }

                links.push(current);
                // Move cursor
                linksHeader = linksHeader.replace(delimiterRegExp, '');
            }

            if (!extended) {
                return links.reduce(function(result, currentLink) {
                    if (currentLink.rel) {
                        currentLink.rel.forEach(function(rel) {
                            result[rel] = currentLink.link;
                        });
                    }
                    return result;
                }, {});
            }

            return links;
        },
        stringify: function (params) {
            var grouped = Object.keys(params).reduce(function(grouped, key) {
                grouped[params[key]] = grouped[params[key]] || [];
                grouped[params[key]].push(key);
                return grouped;
            }, {});

            var entries = Object.keys(grouped).reduce(function(result, link) {
                return result.concat('<' + link + '>; rel="' + grouped[link].join(' ') + '"');
            }, []);

            return entries.join(', ');
        }
    };
}