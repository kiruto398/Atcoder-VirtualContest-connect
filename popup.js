"use strict";

const dom_remaining_time = document.getElementById('remaining_time');
const dom_score = document.getElementById('score');
const a_img_opt = document.getElementById('a_img_opt');
const btn_opt_rated = document.getElementById('opt_rated');
const btn_opt_final = document.getElementById('opt_final');
const div_realtime = document.getElementById('div_realtime');
const dom_realtime_rank = document.getElementById('realtime_rank');
const dom_realtime_perf = document.getElementById('realtime_perf');
const div_final = document.getElementById('div_final');
const dom_final_rank = document.getElementById('final_rank');
const dom_final_perf = document.getElementById('final_perf');

let response_acvc = {};
let optDisplay;

a_img_opt.onclick = function(){
  if(optDisplay){
    optDisplay = 0;
    btn_opt_rated.hidden = 'hidden';
    btn_opt_final.hidden = 'hidden';
  }else{
    optDisplay = 1;
    btn_opt_rated.hidden = '';
    btn_opt_final.hidden = '';
  }
}

btn_opt_rated.onclick = function(){
  if(response_acvc.opt.displayRated){
    btn_opt_rated.textContent = '順位：All';
    dom_realtime_rank.textContent = add_nz_commas(response_acvc.my.realtimeRank) + ' / ' + add_nz_commas(response_acvc.contest.entryCount);
    dom_final_rank.textContent = add_nz_commas(response_acvc.my.finalRank) + ' / ' + add_nz_commas(response_acvc.contest.entryCount);
    response_acvc.opt.displayRated = 0;
  }else{
    btn_opt_rated.textContent = '順位：Rated';
    dom_realtime_rank.textContent = add_nz_commas(response_acvc.my.realtimeRatedRank) + ' / ' + add_nz_commas(response_acvc.contest.ratedEntryCount);
    dom_final_rank.textContent = add_nz_commas(response_acvc.my.finalRatedRank) + ' / ' + add_nz_commas(response_acvc.contest.ratedEntryCount);
    response_acvc.opt.displayRated = 1;
  }

  chrome.runtime.sendMessage({mode : "opt_rated", displayRated: response_acvc.opt.displayRated});
}

btn_opt_final.onclick = function(){
  if(response_acvc.opt.displayFinalPop){
    response_acvc.opt.displayFinalPop = 0;
    btn_opt_final.textContent = '終了時：表示';
    div_final.hidden = '';
  }else{
    response_acvc.opt.displayFinalPop = 1;
    btn_opt_final.textContent = '終了時：非表示';
    div_final.hidden = 'hidden';
  }

  chrome.runtime.sendMessage({mode : "opt_final_pop", displayFinalPop: response_acvc.opt.displayFinalPop});
}



timer_acvc_p();
setInterval(timer_acvc_p, 1000);

function timer_acvc_p(){
  response_acvc = chrome.extension.getBackgroundPage().getResults();

  if(!response_acvc){
    return;
  }

  if(response_acvc.opt.displayFinalPop){
    btn_opt_final.textContent = '終了時：非表示';
    div_final.hidden = 'hidden';
  }else{
    btn_opt_final.textContent = '終了時：表示';
  }

  if(response_acvc.my.score === null){
    dom_remaining_time.textContent = '-';
    dom_score.textContent = '';
    btn_opt_rated.textContent = response_acvc.opt.displayRated ? '順位：Rated' : '順位：All';
    dom_realtime_rank.textContent = '';
    dom_realtime_perf.textContent = '';
    dom_final_rank.textContent = '';
    dom_final_perf.textContent = '';

    div_realtime.hidden = 'hidden';
  }else if(response_acvc.my.elapse >= 0){
    if(response_acvc.my.elapse > 0){
      let now = new Date();
      now.setMilliseconds(0);
      let remain = Number.parseInt((response_acvc.my.endTime - now)/1000);
      const s = ('0' + remain%60).slice(-2);
      remain = Number.parseInt(remain/60);
      const m = ('0' + remain%60).slice(-2);
      remain = Number.parseInt(remain/60);
      const h = ('0' + parseInt(remain%24)).slice(-2);
      const d = Number.parseInt(remain/24);

      let day_str = '';
      if(d >= 1){
        day_str = '' + d + '日 ';
      }

      dom_remaining_time.textContent = day_str + h + ':' + m + ':' + s;
    }else{
      dom_remaining_time.textContent = '-';
    }

    dom_score.textContent = add_commas(response_acvc.my.score) + ' (' + Number.parseInt(response_acvc.my.validElapse/60) + ':' + ('0' + response_acvc.my.validElapse%60).slice(-2) + ')';
    btn_opt_rated.textContent = response_acvc.opt.displayRated ? '順位：Rated' : '順位：All';
    dom_realtime_rank.textContent = add_nz_commas(response_acvc.opt.displayRated ? response_acvc.my.realtimeRatedRank : response_acvc.my.realtimeRank) + ' / ' + add_nz_commas(response_acvc.opt.displayRated ? response_acvc.contest.ratedEntryCount : response_acvc.contest.entryCount);
    dom_realtime_perf.textContent = add_commas(response_acvc.my.realtimePerf);
    dom_realtime_perf.style = 'color : ' + get_color(response_acvc.my.realtimePerf) + ';';
    dom_final_rank.textContent = add_nz_commas(response_acvc.opt.displayRated ? response_acvc.my.finalRatedRank : response_acvc.my.finalRank) + ' / ' + add_nz_commas(response_acvc.opt.displayRated ? response_acvc.contest.ratedEntryCount : response_acvc.contest.entryCount);
    dom_final_perf.textContent = add_commas(response_acvc.my.finalPerf);
    dom_final_perf.style = 'color : ' + get_color(response_acvc.my.finalPerf) + ';';

    div_realtime.hidden = '';
  }else{
    dom_remaining_time.textContent = '-';
    dom_score.textContent = add_commas(response_acvc.my.score) + ' (' + Number.parseInt(response_acvc.my.validElapse/60) + ':' + ('0' + response_acvc.my.validElapse%60).slice(-2) + ')';
    btn_opt_rated.textContent = response_acvc.opt.displayRated ? '順位：Rated' : '順位：All';
    dom_realtime_rank.textContent = '';
    dom_realtime_perf.textContent = '';
    dom_final_rank.textContent = add_nz_commas(response_acvc.opt.displayRated ? response_acvc.my.finalRatedRank : response_acvc.my.finalRank) + ' / ' + add_nz_commas(response_acvc.opt.displayRated ? response_acvc.contest.ratedEntryCount : response_acvc.contest.entryCount);
    dom_final_perf.textContent = add_commas(response_acvc.my.finalPerf);
    dom_final_perf.style = 'color : ' + get_color(response_acvc.my.finalPerf) + ';';

    div_realtime.hidden = 'hidden';
  }
}

function co(){
  console.log('co');
}

function add_nz_commas(num){
  if(!num){
    num = 1;
  }

  return add_commas(num);
}

function add_commas(num){
  let ret = '';
  if(Number.isInteger(num)){
    ret = num.toLocaleString();
  }

  return ret;
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
