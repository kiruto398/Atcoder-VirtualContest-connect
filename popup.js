"use strict";

const dom_remaining_time = document.getElementById('remaining_time');
const dom_score = document.getElementById('score');
const dom_time = document.getElementById('time');
const dom_realtime_rank = document.getElementById('realtime_rank');
const dom_realtime_perf = document.getElementById('realtime_perf');
const dom_final_rank = document.getElementById('final_rank');
const dom_final_perf = document.getElementById('final_perf');

timer();
setInterval(timer, 1000);

let cnter = true;
function timer(){
  chrome.runtime.sendMessage({mode: "popup"});
  const res = chrome.extension.getBackgroundPage().getResults();

  if(res.my.score === null){
    dom_remaining_time.textContent = '-';
    dom_score.textContent = '';
    dom_time.textContent = '';
    dom_realtime_rank.textContent = '';
    dom_realtime_perf.textContent = '';
    dom_final_rank.textContent = '';
    dom_final_perf.textContent = '';

  }else if(res.my.elapse >= 0){
    if(res.my.elapse > 0){
      let now = new Date();
      now.setMilliseconds(0);
      let remain = Number.parseInt((res.my.endTime - now)/1000);
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

    dom_score.textContent = add_commas(res.my.score);
    dom_time.textContent = Number.parseInt(res.my.validElapse/60) + ':' + ('0' + res.my.validElapse%60).slice(-2);
    dom_realtime_rank.textContent = add_commas(res.opt.displayRank ? res.my.realtimeRatedRank : res.my.realtimeRank) + ' / ' + add_commas(res.opt.displayRank ? res.contest.ratedEntryCount : res.contest.entryCount);
    dom_realtime_perf.textContent = add_commas(res.my.realtimePerf);
    dom_realtime_perf.style = 'color : ' + get_color(res.my.realtimePerf) + ';';
    dom_final_rank.textContent = add_commas(res.opt.displayRank ? res.my.finalRatedRank : res.my.finalRank) + ' / ' + add_commas(res.opt.displayRank ? res.contest.ratedEntryCount : res.contest.entryCount);
    dom_final_perf.textContent = add_commas(res.my.finalPerf);
    dom_final_perf.style = 'color : ' + get_color(res.my.finalPerf) + ';';

  }else{
    dom_remaining_time.textContent = '-';
    dom_score.textContent = add_commas(res.my.score);
    dom_time.textContent = Number.parseInt(res.my.validElapse/60) + ':' + res.my.validElapse%60;
    dom_realtime_rank.textContent = '';
    dom_realtime_perf.textContent = '';
    dom_final_rank.textContent = add_commas(res.opt.displayRank ? res.my.finalRatedRank : res.my.finalRank) + ' / ' + add_commas(res.opt.displayRank ? res.contest.ratedEntryCount : res.contest.entryCount);
    dom_final_perf.textContent = add_commas(res.my.finalPerf);
    dom_final_perf.style = 'color : ' + get_color(res.my.finalPerf) + ';';
  }
}

function add_commas(num){
  let ret = '';
  if(Number.isInteger(num)){
    ret = num.toLocaleString();
  }else{
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
