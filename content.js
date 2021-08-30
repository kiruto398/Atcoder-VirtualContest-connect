"use strict";

(function(){


  const accept_contest_url = /^https:\/\/atcoder.jp\/contests\/[^/]+/;
  const contest_url = location.href.match(accept_contest_url);
  if(contest_url == null){
    return;
  }

  let my_userName = get_my_userName();
  if(my_userName == null){
    return;
  }

  const contest_duration = get_contest_duration();
  const href = location.href;

  chrome.runtime.sendMessage({mode : 0, contest_duration : contest_duration, contest_url : contest_url[0], now_url : href, user_name : my_userName});
})();

chrome.runtime.onMessage.addListener((response, sender, sendResponse) => {

  const vue_standings = document.getElementById('vue-standings');


  const element_final = document.createElement('p');
  element_final.id = 'add-by-acvc-connect_f';
  element_final.className = 'text-center';
  element_final.style = 'padding: 0px 0px 10px; font-size: 30px;';
  let text_f = '終了時の順位 : ' + response.my.final_rank + ' / ' + response.contest.final_submission_number + '　Perf : ';

  if(response.my.final_perf != null){
    let color = get_color(response.my.final_perf);
    text_f += '<span style = "color: ' + color + '">' + response.my.final_perf + '</span>';
  }else{
    text_f += ' -';
  }

  element_final.innerHTML = text_f;

  vue_standings.childNodes[4].after(element_final);

  if(response.my.is_joining_vc){
    const element_realtime = document.createElement('p');
    element_realtime.id = 'add-by-acvc-connect_r';
    element_realtime.className = 'text-center';
    element_realtime.style = 'padding: 0px 0px 10px; font-size: 30px;';
    let text_r = '現在の順位 : ' + response.my.realtime_rank + ' / ' + response.contest.final_submission_number + '　Perf : ';

    if(response.my.realtime_perf != null){
      let color = get_color(response.my.realtime_perf);
      text_r += '<span style = "color: ' + color + '">' + response.my.realtime_perf + '</span>';
    }else{
      text_r += ' -';
    }

    element_realtime.innerHTML = text_r;

    vue_standings.childNodes[4].after(element_realtime);
  }

})

function get_color(rate){
  let color = null;
  if(rate != null){
    if(rate < 400){
      color = 'black';
    }else if(rate < 800){
      color = 'brown';
    }else if(rate < 1200){
      color = 'green';
    }else if(rate < 1600){
      color = 'aqua';
    }else if(rate < 2000){
      color = 'blue';
    }else if(rate < 2400){
      color = 'gold';
    }else if(rate < 2800){
      color = 'orange';
    }else{
      color = 'red';
    }
  }

  return color;
}

function get_my_userName(){
let my_userName = null;

  const nodes = document.head.childNodes;
  nodes.forEach(node => {
    const fc = node.firstChild;
    if(fc == null){
      return true;
    }

    const fc_split = fc.textContent.split('\"');
    if(fc_split[0] === '\n\t\tvar LANG = '){
      my_userName = fc_split[3];
      return false;
    }
  });

  return my_userName;
}

function get_contest_duration(){
  let cnt;
  let ret;
  try {
    let txt = document.getElementById('contest-nav-tabs').childNodes[1].childNodes[1].textContent;
    const p = /\d{4}-\d{2}-\d{2}\(.\) \d{2}:\d{2}/gu;
    const txts = txt.match(p);
    const start_arr = txts[0].match(/\d+/gu);
    const start_date = new Date(Number(start_arr[0]), Number(start_arr[1]), Number(start_arr[2]), Number(start_arr[3]), Number(start_arr[4]), 0);

    const end_arr = txts[1].match(/\d+/gu);
    const end_date = new Date(Number(end_arr[0]), Number(end_arr[1]), Number(end_arr[2]), Number(end_arr[3]), Number(end_arr[4]), 0);

    ret = (end_date.getTime() - start_date.getTime()) / (1000 * 60);
  } catch(e){
    ret = null;
  }

  return ret;
}
