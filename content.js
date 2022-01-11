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
  const div = document.createElement('div');
  div.id = 'add-by-acvc';
  div.style = 'padding: 10px; margin-bottom: 10px; border: 1px dotted #333333; border-radius: 5px;'

  const sc = document.createElement('script');
  sc.src = 'https://platform.twitter.com/widgets.js'
  sc.charset = 'utf-8';
  sc.innerHTML = 'async';
  div.appendChild(sc);

  const element_twi = document.createElement('p');
  element_twi.style = 'text-align: right;'
  element_twi.innerHTML = '<a href="https://twitter.com/intent/tweet?url=%0D%0A&text=' + response.contest.name + ' バチャ%0D%0A成績 ' + response.my.accepted + '完 ' + response.my.score + '(' + mm_ss(response.my.elapse) + ')%0D%0A順位 ' + response.my.final_rank + '%0D%0Aパフォ' + response.my.final_perf + '&hashtags=AtCoder,' + response.contest.name + ',AC_VCC" class="twitter-share-button"> Tweet</a>';
  div.childNodes[0].after(element_twi);

  const element_final = document.createElement('p');
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
  div.childNodes[0].after(element_final);

  if(response.my.is_joining_vc){
    const element_realtime = document.createElement('p');
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
    div.childNodes[0].after(element_realtime);
  }

  const vue_standings = document.getElementById('vue-standings');
  vue_standings.childNodes[4].after(div);
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

function mm_ss(time){
  const s = ('0' + time%60).slice(-2);
  const m = parseInt(time/60);

  const ret = m + ":" + s;

  return ret;
}
