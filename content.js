"use strict";
let div_acvc = document.getElementById('add_by_acvc');
let element_twi_all = document.getElementById('acvc_twi_all');
let element_twi_rated = document.getElementById('acvc_twi_rated');
let element_final = document.getElementById('acvc_final');
let element_opt = document.getElementById('acvc_opt');

let response_acvc = {};

(function(){


  const accept_contest_url = /^https:\/\/atcoder.jp\/contests\/[^/]+/;
  const contest_url = location.href.match(accept_contest_url);
  if(!contest_url){
    return;
  }

  let my_userName = get_my_userName();
  if(!my_userName){
    return;
  }

  const contest_duration = get_contest_duration();
  const href = location.href;

  chrome.runtime.sendMessage({mode : "content", contest_duration : contest_duration, contest_url : contest_url[0], now_url : href, user_name : my_userName});
})();

chrome.runtime.onMessage.addListener((response, sender, sendResponse) => {
  const accept_vc_url = /^https:\/\/atcoder.jp\/contests\/.+\/standings\/virtual$/;
  const valid_vc_url = location.href.match(accept_vc_url);
  if(valid_vc_url == null){
    return;
  }

  response_acvc = response;

  if(!div_acvc){
    div_acvc = document.createElement('div');
    div_acvc.id = 'add-by-acvc';
    div_acvc.style = 'padding: 10px; margin-bottom: 10px; border: 1px dotted #333333; border-radius: 5px;';
    document.getElementById('vue-standings').childNodes[4].after(div_acvc);

    const optTwi = document.createElement('p');
    optTwi.style = 'margin: 0; position: relative;';

    const sc = document.createElement('script');
    sc.src = 'https://platform.twitter.com/widgets.js'
    sc.charset = 'utf-8';
    sc.innerHTML = 'async';
    optTwi.appendChild(sc);

    element_twi_all = document.createElement('p');
    element_twi_all.id = 'acvc_twi_all';
    element_twi_all.style.margin = '0';
    element_twi_all.style.position = 'absolute';
    element_twi_all.style.right = '5px';
    element_twi_all.style['z-index'] = (response.opt.displayRank) ? '1' : '2';
    optTwi.appendChild(element_twi_all);

    element_twi_rated = document.createElement('p');
    element_twi_rated.id = 'acvc_twi_rated';
    element_twi_rated.style.margin = '0';
    element_twi_rated.style.position = 'absolute';
    element_twi_rated.style.right = '5px';
    element_twi_rated.style['z-index'] = (response.opt.displayRank) ? '2' : '1';
    optTwi.appendChild(element_twi_rated);

    element_opt = document.createElement('button');
    element_opt.id = 'acvc_opt';
    element_opt.type = 'button';
    element_opt.style.position = 'relative';
    element_opt.textContent = (response.opt.displayRank) ? '順位：Rated' : '順位：All';
    element_opt.onclick = function(){
      if(response_acvc.opt.displayRank){
        this.textContent = '順位：All';
        element_twi_all.style['z-index'] = 2;
        element_twi_rated.style['z-index'] = 1;
        response_acvc.opt.displayRank = 0;
      }else{
      this.textContent = '順位：Rated';
      element_twi_all.style['z-index'] = 1;
      element_twi_rated.style['z-index'] = 2;
      response_acvc.opt.displayRank = 1;
      }

      element_final.innerHTML = '終了時の順位 : ' + finalRankCountPerf();
      if(element_realtime){
        element_realtime.innerHTML = '現在の順位 : ' + realtimeRankCountPerf();
      }

      chrome.runtime.sendMessage({mode : "opt", displayRank: response_acvc.opt.displayRank});
    };
    optTwi.appendChild(element_opt);

    div_acvc.appendChild(optTwi);

    element_final = document.createElement('p');
    element_final.id = 'acvc_final';
    element_final.className = 'text-center';
    element_final.style = 'padding: 0px 0px 10px; font-size: 30px;';
    div_acvc.childNodes[0].before(element_final);
  }

  element_twi_all.innerHTML = createTwiAllText();
  element_twi_rated.innerHTML = createTwiRatedText();
  element_final.innerHTML = '終了時の順位 : ' + finalRankCountPerf();

  let element_realtime = document.getElementById('acvc_real');
  if(response.my.elapse > 0){
    if(!element_realtime){
      element_realtime = document.createElement('p');
      element_realtime.className = 'text-center';
      element_realtime.style = 'padding: 0px 0px 10px; font-size: 30px;';
      div_acvc.childNodes[0].before(element_realtime);
    }

    element_realtime.innerHTML = '現在の順位 : ' + realtimeRankCountPerf();
  }else{
    if(element_realtime){
      element_realtime.remove();
    }
  }
});

function finalRankCountPerf(){
  if(response_acvc.opt.displayRank){
    return rankCountPerf(response_acvc.my.finalRatedRank, response_acvc.contest.ratedEntryCount, response_acvc.my.finalPerf);
  }else {
    return rankCountPerf(response_acvc.my.finalRank, response_acvc.contest.entryCount, response_acvc.my.finalPerf);
  }
}
function realtimeRankCountPerf(){
  if(response_acvc.opt.displayRank){
    return rankCountPerf(response_acvc.my.realtimeRatedRank, response_acvc.contest.ratedEntryCount, response_acvc.my.realtimePerf);
  }else {
    return rankCountPerf(response_acvc.my.realtimeRank, response_acvc.contest.entryCount, response_acvc.my.realtimePerf);
  }
}

function rankCountPerf(rank = 1, count = 1, perf){

  let ret = rank + ' / ' + count + '　Perf : ';
  if(perf){
    let color = get_color(perf);
    ret += '<span style = "color: ' + color + '">' + perf + '</span>';
  }else{
    ret += ' - ';
  }

  return ret;
}

function createTwiAllText(){
  return '<a href="https://twitter.com/intent/tweet?url=%0D%0A&text=' + response_acvc.contest.name + ' バチャ%0D%0A成績 ' + response_acvc.my.acceptedNum + '完 ' + response_acvc.my.score + ' (' + mm_ss(response_acvc.my.validElapse) + ')%0D%0A順位(All): ' + response_acvc.my.finalRank + ' / ' + response_acvc.contest.entryCount + '%0D%0APerf: ' + ((response_acvc.my.finalPerf || response_acvc.my.finalPerf === 0) ? response_acvc.my.finalPerf : ' - ') + '&hashtags=AtCoder,' + response_acvc.contest.name + ',AC_VCC" class="twitter-share-button"> Tweet</a>';
}
function createTwiRatedText(){
  return '<a href="https://twitter.com/intent/tweet?url=%0D%0A&text=' + response_acvc.contest.name + ' バチャ%0D%0A成績 ' + response_acvc.my.acceptedNum + '完 ' + response_acvc.my.score + ' (' + mm_ss(response_acvc.my.validElapse) + ')%0D%0A順位(Rated): ' + response_acvc.my.finalRatedRank + ' / ' + response_acvc.contest.ratedEntryCount + '%0D%0APerf: ' + ((response_acvc.my.finalPerf || response_acvc.my.finalPerf === 0) ? response_acvc.my.finalPerf : ' - ') + '&hashtags=AtCoder,' + response_acvc.contest.name + ',AC_VCC" class="twitter-share-button"> Tweet</a>';
}

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

  const nodes = document.head.getElementsByTagName('script');
  for(let i = 0, len = nodes.length; i < len; i++){
    let nodeSp = nodes[i].textContent.split('\"');
    if(nodeSp[0] === '\n\t\tvar LANG = '){
      my_userName = nodeSp[3];
      break;
    }
  }

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
