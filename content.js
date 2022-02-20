"use strict";
let div_acvc = document.getElementById('add_by_acvc');
let element_twi = document.getElementById('acvc_twi');
let element_final = document.getElementById('acvc_final');
let btn_opt_rated = document.getElementById('acvc_btn_opt_rated');
let btn_opt_final = document.getElementById('acvc_btn_opt_final');
let element_realtime = document.getElementById('acvc_real');

let element_twi_replaced;
let src_element_twi;

let response_acvc;

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

  chrome.runtime.sendMessage({mode : "setContest", contest_duration : contest_duration, contest_url : contest_url[0], now_url : href, user_name : my_userName});
})();

chrome.runtime.onMessage.addListener(request => {
  if(request[0] !== 'refreshScoreAcvc'){
    return;
  }
  if(!Number.isInteger(request[1].my.score)){
    return;
  }
  let accept_vc_url = /^https:\/\/atcoder.jp\/contests\/[^/]+\/standings\/virtual$/;
  let valid_vc_url = location.href.match(accept_vc_url);
  if(!valid_vc_url){
    return;
  }

  response_acvc = request[1];

  if(!div_acvc){
    div_acvc = document.createElement('div');
    div_acvc.id = 'add-by-acvc';
    div_acvc.style = 'padding: 10px; margin-bottom: 10px; border: 1px dotted #333333; border-radius: 5px;';
    document.getElementById('vue-standings').childNodes[4].after(div_acvc);

    const p_opt = document.createElement('p');
    p_opt.id = 'acvc_twi';
    p_opt.style = 'margin: 0; position: relative;';

    element_twi = document.createElement('a');
    element_twi.style.margin = '0';
    element_twi.style.position = 'absolute';
    element_twi.style.right = '5px';
    element_twi.innerHTML = '<img onmouseover="this.style = \'opacity: 0.6\';" onmouseout="this.style = \'opacity: 1.0\';" src="' + chrome.runtime.getURL('resources/tw.png') + '" alt="Tweet"></a>';
    p_opt.appendChild(element_twi);

    btn_opt_rated = document.createElement('button');
    btn_opt_rated.id = 'acvc_btn_opt_rated';
    btn_opt_rated.style.position = 'relative';
    btn_opt_rated.style.margin = '2px';
    btn_opt_rated.onclick = function(){
      if(response_acvc.opt.displayRated){
        this.textContent = '順位：All';
        response_acvc.opt.displayRated = 0;
      }else{
      this.textContent = '順位：Rated';
      response_acvc.opt.displayRated = 1;
      }

      element_final.innerHTML = finalRankCountPerf();
      if(element_realtime){
        element_realtime.innerHTML = realtimeRankCountPerf();
      }
      element_twi.href = getTwiHref();

      chrome.runtime.sendMessage({mode : "opt_rated", displayRated: response_acvc.opt.displayRated});
    };
    p_opt.appendChild(btn_opt_rated);

    btn_opt_final = document.createElement('button');
    btn_opt_final.id = 'acvc_btn_opt_final';
    btn_opt_final.style.position = 'relative';
    btn_opt_final.style.margin = '2px';
    btn_opt_final.onclick = function(){
      if(response_acvc.opt.displayFinalCon){
        this.textContent = '終了時：表示';
        response_acvc.opt.displayFinalCon = 0;
        element_final.hidden = '';
      }else{
        this.textContent = '終了時：非表示';
        response_acvc.opt.displayFinalCon = 1;
        element_final.hidden = 'hidden';
      }

      chrome.runtime.sendMessage({mode : "opt_final_content", displayFinalCon: response_acvc.opt.displayFinalCon});
    }
    p_opt.appendChild(btn_opt_final);

    div_acvc.appendChild(p_opt);

    element_final = document.createElement('p');
    element_final.id = 'acvc_final';
    element_final.className = 'text-center';
    element_final.style = 'padding: 0px 0px 10px; font-size: 30px;';
    div_acvc.childNodes[0].before(element_final);

    element_realtime = document.createElement('p');
    element_realtime.className = 'text-center';
    element_realtime.style = 'padding: 0px 0px 10px; font-size: 30px;';
    div_acvc.childNodes[0].before(element_realtime);
  }

  if(response_acvc.opt.displayFinalCon){
    btn_opt_final.textContent = '終了時：非表示';
    element_final.hidden = 'hidden';
  }else{
    btn_opt_final.textContent = '終了時：表示';
    element_final.hidden = '';
  }

  element_twi.href = getTwiHref();
  btn_opt_rated.textContent = (response_acvc.opt.displayRated) ? '順位：Rated' : '順位：All';
  element_final.innerHTML = finalRankCountPerf();
  element_realtime.innerHTML = realtimeRankCountPerf();


  if(response_acvc.my.elapse > 0){
    element_realtime.hidden = '';
  }else{
    element_realtime.hidden = 'hidden';
  }
});

function finalRankCountPerf(){
  if(response_acvc.opt.displayRated){
    return '終了時の順位 : ' + rankCountPerf(response_acvc.my.finalRatedRank, response_acvc.contest.ratedEntryCount, response_acvc.my.finalPerf);
  }else {
    return '終了時の順位 : ' + rankCountPerf(response_acvc.my.finalRank, response_acvc.contest.entryCount, response_acvc.my.finalPerf);
  }
}
function realtimeRankCountPerf(){
  if(response_acvc.opt.displayRated){
    return '現在の順位 : ' + rankCountPerf(response_acvc.my.realtimeRatedRank, response_acvc.contest.ratedEntryCount, response_acvc.my.realtimePerf);
  }else {
    return '現在の順位 : ' + rankCountPerf(response_acvc.my.realtimeRank, response_acvc.contest.entryCount, response_acvc.my.realtimePerf);
  }
}

function rankCountPerf(rank, count, perf){
  if(!rank){
    rank = 1;
  }
  if(!count){
    count = 1;
  }

  let ret = rank + ' / ' + count + '　Perf : ';
  if(perf){
    let color = get_color(perf);
    ret += '<span style = "color: ' + color + '">' + perf + '</span>';
  }else{
    ret += ' - ';
  }

  return ret;
}

function getTwiHref(){
  const contestName = response_acvc.contest.name;
  const acceptedNum = addCommas(response_acvc.my.acceptedNum);
  const score = addCommas(response_acvc.my.score);
  const time = mm_ss(response_acvc.my.validElapse);
  const display = response_acvc.opt.displayRated ? 'Rated' : 'All';
  const rank = addCommas(response_acvc.opt.displayRated ? response_acvc.my.finalRatedRank : response_acvc.my.finalRank);
  const entryCnt = addCommas(response_acvc.opt.displayRated ? response_acvc.contest.ratedEntryCount : response_acvc.contest.entryCount);
  const perf = addCommas(response_acvc.my.finalPerf);

  return `https://twitter.com/intent/tweet?url=%0D%0A&text=${contestName} Virtual%0D%0A成績 ${acceptedNum}完 ${score} (${time})%0D%0A順位(${display}): ${rank} / ${entryCnt}%0D%0APerf: ${perf}&hashtags=AtCoder,${contestName},AC_VCC`;
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

function addCommas(num){
  let ret = ' - ';
  if(Number.isInteger(num)){
    ret = num.toLocaleString();
  }
  return ret;
}
