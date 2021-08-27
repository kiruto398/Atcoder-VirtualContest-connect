"use strict";

const dom_remaining_time = document.getElementById('remaining_time');
const dom_score = document.getElementById('score');
const dom_realtime_rank = document.getElementById('realtime_rank');
const dom_realtime_perf = document.getElementById('realtime_perf');
const dom_final_rank = document.getElementById('final_rank');
const dom_final_perf = document.getElementById('final_perf');

timer();
setInterval(timer, 1000);

let cnter = true;
function timer(){
  chrome.runtime.sendMessage({mode: 1});
  const res = chrome.extension.getBackgroundPage().update_results();

  if(res.contest.error){
    dom_remaining_time.textContent = '-';
    dom_score.textContent = '';
    dom_realtime_rank.textContent = '';
    dom_realtime_perf.textContent = '';
    dom_final_rank.textContent = '';
    dom_final_perf.textContent = '';

  }else if(res.my.is_joining_vc){
    let now = new Date();
    now.setMilliseconds(0);
    let remain = parseInt((res.my.end_time - now)/1000);
    const s = ('0' + remain%60).slice(-2);
    remain = parseInt(remain/60);
    const m = ('0' + remain%60).slice(-2);
    const h = ('0' + parseInt(remain/60)).slice(-2);

    dom_remaining_time.textContent = h + ':' + m + ':' + s;
    dom_score.textContent = res.my.score;
    dom_realtime_rank.textContent = res.my.realtime_rank;
    dom_realtime_perf.textContent = res.my.realtime_perf;
    dom_realtime_perf.style = 'color : ' + get_color(res.my.realtime_perf) + ';';
    dom_final_rank.textContent = res.my.final_rank;
    dom_final_perf.textContent = res.my.final_perf;
    dom_final_perf.style = 'color : ' + get_color(res.my.final_perf) + ';';

  }else{
    dom_remaining_time.textContent = '-';
    dom_score.textContent = res.my.score;
    dom_realtime_rank.textContent = '';
    dom_realtime_perf.textContent = '';
    dom_final_rank.textContent = res.my.final_rank;
    dom_final_perf.textContent = res.my.final_perf;
    dom_final_perf.style = 'color : ' + get_color(res.my.final_perf) + ';';
  }
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
