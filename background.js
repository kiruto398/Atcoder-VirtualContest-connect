"use strict";

let contest = {
  error : true,
  url : null,
  duration : null,
  penalty : 300,
  task_number : null,
  task_scores : null,
  final_submission_number : 0,
  final_score_list : null,
  performance_list : [],
  final_rated_score_list : null,
  is_rated_list : [],
  get_point_list : [],
  first_of_get_point_list : null,
  realtime_score_list : [],
  is_under_same_scores : []
};

let my = {
  user_name : null,
  is_joining_vc : false,
  vc : {
    end_time : null,
    score : null,
    valid_elapse : null,
    elapse : null
  },
  final_rank : null,
  final_rated_rank : null,
  final_perf : null,
  realtime_rank : null,
  realtime_rated_rank : null,
  realtime_perf : null,
  realtime_ac_numbers : null,
}

let results = {
  contest : {
    error : false,
    duration : null,
    final_submission_number : null
  },
  my : {
    is_joining_vc : false,
    end_time : null,
    score : null,
    final_rank : null,
    final_perf : null,
    realtime_rank : null,
    realtime_perf : null
  }
}

function refresh_contest(){
  contest.url = null;
  contest.duration = null;
  contest.penalty = 300;
  contest.task_number = null;
  contest.task_scores = null;
  contest.final_submission_number = 0;
  contest.final_score_list = null;
  contest.performance_list = [];
  contest.final_rated_score_list = null;
  contest.is_rated_list = [];
  contest.get_point_list = null;
  contest.first_of_get_point_list = null;
  contest.realtime_score_list = [];
  contest.is_under_same_scores = [];
}

function refresh_my(){
  my.is_joining_vc = false;
  my.vc.end_time = null;
  my.vc.elapse = null;
  my.vc.valid_elapse = null;
  my.vc.score = null;
  my.final_rank = null;
  my.final_rated_rank = null;
  my.final_perf = null;
  my.realtime_rank = null;
  my.realtime_rated_rank = null;
  my.realtime_perf = null;
  my.realtime_ac_numbers = null;
}

function refresh_realtime(){
  my.realtime_rank = null;
  my.realtime_rated_rank = null;
  my.realtime_perf = null;
  my.realtime_ac_numbers = null;

  contest.first_of_get_point_list = Array(contest.task_number).fill(0);
  contest.realtime_score_list = Array(contest.final_submission_number).fill(0);
  contest.is_under_same_scores.fill(false);
}

function refresh_results(){
  results.contest.error = false;
  results.contest.duration = null;
  results.contest.final_submission_number = null;
  results.my.is_joining_vc = false;
  results.my.end_time = null;
  results.my.score = null;
  results.my.final_rank = null;
  results.my.final_perf = null;
  results.my.realtime_rank = null;
  results.my.realtime_perf = null;
}

function refresh_all(){
  refresh_contest();
  refresh_my();
  refresh_realtime();
  refresh_results();
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {

   if(request.mode == 0){

     await set_contest_data(request);
     await update_my_rank();

     if(contest.error){
       refresh_my();
       refresh_results();
       refresh_realtime();
       return;
     }

     const accept_vc_url = /^https:\/\/atcoder.jp\/contests\/.+\/standings\/virtual$/;
     const valid_vc_url = request.now_url.match(accept_vc_url);
     if(valid_vc_url == null){
       return;
     }

     update_results();

     if(contest.final_submission_number === 1){
       return;
     }

     chrome.tabs.sendMessage(sender.tab.id, results);
   }else if(request.mode == 1){
     await update_my_rank();

     if(contest.error){
       refresh_my();
       refresh_results();
       refresh_realtime();
       return;
     }
   }

});

function update_results(){
  refresh_results();

  results.contest.error = contest.error;

  results.contest.duration = contest.duration;
  results.contest.final_submission_number = contest.final_submission_number;

  results.my.score = my.vc.score;
  results.my.final_rank = my.final_rank;
  results.my.final_perf = my.final_perf;

  if(my.is_joining_vc){
    results.my.is_joining_vc = true;
    results.my.end_time = my.vc.end_time;
    results.my.realtime_rank = my.realtime_rank;
    results.my.realtime_perf = my.realtime_perf;
  }

  return results;
}

async function set_contest_data(req){
  if(req.contest_url == contest.url){
    return;
  }

  contest.error = false;
  refresh_all();

  contest.duration = req.contest_duration;
  my.user_name = req.user_name;
  contest.url = req.contest_url;

  contest.performance_list = await get_performance_list();
  const standings_data = await get_standings_data();


  if(contest.error){
    return;
  }

  contest.final_score_list = standings_data[0][0];
  contest.final_rated_score_list = standings_data[0][1];
  contest.get_point_list = standings_data[1];
  contest.first_of_get_point_list = new Array(contest.get_point_list.length).fill(0);
}

async function update_my_rank(){

  const is_updated = await update_my_vc();

  if(contest.error){
    return;
  }
  if(my.vc.elapsed === 0){
    return;
  }

  if(is_updated){

    my.final_rank = get_final_rank();
    my.final_rated_rank = get_final_rated_rank();
    my.final_perf = get_final_perf(my.final_rated_rank);


    if(!my.is_joining_vc){
      refresh_realtime();
      return;
    }

    if(my.vc.score == 0){
      init_zero();
    }else{
      init_any();
    }
  }else if(!my.is_joining_vc){
    refresh_realtime();
    return;
  }

    fit_to(my.vc.elapse);

    my.realtime_perf = contest.performance_list[my.realtime_rated_rank-1];
}

async function update_my_vc(){

  const vc_status = await get_my_virtual_contest_status();

  if(contest.error){
    return false;
  }
  if(vc_status.elapse == 0){
    return false;
  }

  let is_updated = false;

  if(vc_status != null){

    if(vc_status.score != my.vc.score){
      is_updated = true;

      my.vc.score = vc_status.score;
    }

    my.vc.valid_elapse = vc_status.valid_elapse;
    my.vc.elapse = vc_status.elapse;
  }

  return is_updated;
}

async function popup_process(){
  await update();

  return [my.is_joining_vc, my.realtime_rank, my.realtime_perf, my.final_rank, my.final_perf, my.vc.score, contest.final_submission_number, contest.duration];
}

function init_zero(){
  fit_to(my.vc.elapse);

  my.realtime_rank = 1;
  my.realtime_rated_rank = 1;
  for(let i = 0; i < contest.realtime_score_list.length; i++){
    if(contest.realtime_score_list[i] > my.vc.score){
      my.realtime_rank++;
      contest.is_under_same_scores[i] = false;

      if(contest.is_rated_list[i]){
        my.realtime_rated_rank++;
      }
    }else{
      contest.is_under_same_scores[i] = true;
    }
  }
}

function init_any(){

  fit_to(my.vc.valid_elapse);

  let debug = new Array(contest.final_submission_number);
  for(let i = 0; i < contest.final_submission_number; i++){
    debug[i] = contest.realtime_score_list[i];
  }

  my.realtime_rank = 1;
  my.realtime_rated_rank = 1;
  for(let i = 0; i < contest.realtime_score_list.length; i++){
    if(contest.realtime_score_list[i] >= my.vc.score){
      my.realtime_rank++;

      if(contest.is_rated_list[i]){
        my.realtime_rated_rank++;
      }
    }

    contest.is_under_same_scores[i] = false;
  }
}

function fit_to(now){

  if(now < 0){
    now = 1e9;
  }

  for(let i = 0; i < contest.task_number; i++){
    while(contest.first_of_get_point_list[i] < contest.get_point_list[i].length){
      const tmp = contest.get_point_list[i][contest.first_of_get_point_list[i]];

      if(tmp.elapsed >= now){
        break;
      }

      contest.first_of_get_point_list[i]++;

      if(contest.is_under_same_scores[tmp.key]){
        contest.is_under_same_scores[tmp.key] = false;

        my.realtime_rank++;

        if(contest.is_rated_list[tmp.key]){
          my.realtime_rated_rank++;
        }
      }else if(contest.realtime_score_list[tmp.key] < my.vc.score && my.vc.score < contest.realtime_score_list[tmp.key] + contest.task_scores[i]){
        my.realtime_rank++;

        if(contest.is_rated_list[tmp.key]){
          my.realtime_rated_rank++;
        }
      }

      contest.realtime_score_list[tmp.key] += contest.task_scores[i];

      if(contest.realtime_score_list[tmp.key] == my.vc.score){
        contest.is_under_same_scores[tmp.key] = true;
      }else{
        contest.is_under_same_scores[tmp.key] = false;
      }
    }
  }

}

async function get_my_virtual_contest_status(){
  let ret = null;
  let error = true;
  let is_joining_vc = false;

  await fetch(contest.url + '/standings/virtual/json')
    .then(function(response) {
      return response.json();
    })
    .then(function(virtual_standings) {

      let is_break = false;
      virtual_standings.StandingsData.forEach(data => {
        if(is_break){
          return;
        }

        if(data.UserScreenName === my.user_name){
          error = false;

          let elp = data.Additional['standings.virtualElapsed'];
          if(elp > 0){
            is_joining_vc = true;
            elp /= 1000000000;

            if((my.vc.end_time == null) && (contest.duration != null)){
              my.vc.end_time = new Date();
              my.vc.end_time.setSeconds(my.vc.end_time.getSeconds() - elp);
              my.vc.end_time.setSeconds(0);
              my.vc.end_time.setMilliseconds(0);
              my.vc.end_time.setMinutes(my.vc.end_time.getMinutes() + contest.duration);
            }
          }

          ret = {score : data.TotalResult.Score/100, valid_elapse : data.TotalResult.Elapsed/1000000000, elapse : elp};
          is_break = true;
          return;
        }
      });

    })
    .catch();

    contest.error = error;
    my.is_joining_vc = is_joining_vc;
    return ret;
}

async function get_performance_list(){
  let perfs = [];

  await fetch(contest.url + '/results/json')
  .then(function(response) {
    return response.json();
  })
  .then(function(results) {

    let perf = -1;

    results.forEach(data => {

      if(data.IsRated == false){
        return;
      }

      perf = data.Performance;
      if(perf < 400){
        perf = Math.round(400.0 / Math.exp((400.0-perf) / 400));
      }

      perfs.push(perf);
    });

    if(perf != -1){
      perfs.push(parseInt(perf/2));
    }
  })
  .catch(error => {
    contest.error = true;
  });

  return perfs;
};

async function get_standings_data(){
  let sbs = [[], []];
  let tasks;
  contest.is_rated_list = [];
  contest.final_submission_number = 0;

  await fetch(contest.url + '/standings/json')
  .then(function(response) {
    return response.json();
  })
  .then(function(results) {

    contest.task_number = results.TaskInfo.length;
    tasks = Array(contest.task_number);
    contest.task_scores = Array(contest.task_number);
    let task_names = new Object();
    for(let i = 0; i < contest.task_number; i++){
      tasks[i] = [];
      task_names[results.TaskInfo[i].TaskScreenName] = i;
    }

    let cnt_isRated = 0;
    let tmp_rank = -1;

    results.StandingsData.forEach(data => {

      if(data.TotalResult.Count == 0){
        return;
      }

      contest.final_submission_number++;

      if(sbs[0][sbs[0].length-1] != data.Rank){
        sbs[0].push([data.Rank, data.TotalResult.Score / 100, data.TotalResult.Elapsed / 1000000000]);
      }

      let tmp_tasks = [];
      Object.keys(data.TaskResults).forEach(function (key) {
        if(data.TaskResults[key].Status != 1){
          return;
        }
        contest.task_scores[task_names[key]] = data.TaskResults[key].Score/100;

        tmp_tasks.push({key : contest.final_submission_number-1, elapsed : data.TaskResults[key].Elapsed / 1000000000, penalty : data.TaskResults[key].Penalty, task_ind : task_names[key]});
      });

      tmp_tasks.sort((a, b) => a.elapsed - b.elapsed);
      let cnt_p = 0;
      for(let i = 0; i < tmp_tasks.length; i++){
        cnt_p += tmp_tasks[i].penalty;

        tasks[tmp_tasks[i].task_ind].push({key : contest.final_submission_number-1, elapsed : tmp_tasks[i].elapsed + cnt_p * contest.penalty});
      }

      contest.is_rated_list.push(data.IsRated);

      if(data.IsRated == false){
        return;
      }
      cnt_isRated++;

      if(sbs[1][sbs[1].length-1] != data.Rank){
        sbs[1].push([cnt_isRated, data.TotalResult.Score / 100, data.TotalResult.Elapsed / 1000000000]);
      }
    });

    if(contest.submission_person_number > 0){
      sbs[0].push([contest.submission_person_number+1, -1, 1000000000]);
    }
    if(cnt_isRated > 0){
      sbs[1].push([cnt_isRated+1, -1, 1000000000]);
    }
  })
  .catch(error => {
    contest.error = true;
    return null;
  });

  for(let i = 0; i < contest.task_number; i++){
    tasks[i].sort((a, b) => a.elapsed - b.elapsed);
  }

  contest.realtime_score_list = Array(contest.final_submission_number).fill(0);
  contest.is_under_same_scores = Array(contest.final_submission_number).fill(false);

  contest.final_submission_number++;

  return [sbs, tasks];
}

function get_final_rank(){
  if(!contest.final_score_list.length){
    return null;
  }

  return get_rank(contest.final_score_list);
}

function get_final_rated_rank(){
  if(!contest.final_rated_score_list.length){
    return null;
  }

  return get_rank(contest.final_rated_score_list);
}

function get_final_perf(rated_rank){
  if(rated_rank == null || (!contest.performance_list.length)){
    return null;
  }

  return contest.performance_list[my.final_rated_rank-1];
}

function get_rank(score_board){

  const l = lower_bound(score_board)+1;
  const r = upper_bound(score_board)-1;

  return binarySearch_getting_rank(l, r, score_board);
}

function lower_bound(score_board){
  let l = 0;
  let r = score_board.length-1;

  while(l <= r){
    let m = Math.trunc((l+r)/2);

    if(score_board[m][1] > my.vc.score){
      l = m+1;
    }else{
      r = m-1;
    }
  }

  return r;
}
function upper_bound(score_board){
  let l = 0;
  let r = score_board.length-1;

  while(l <= r){
    let m = Math.trunc((l+r)/2);

    if(score_board[m][1] >= my.vc.score){
      l = m+1;
    }else{
      r = m-1;
    }
  }

  return l;
}

function binarySearch_getting_rank(l, r, score_board){

  while(l <= r){
    let m = Math.trunc((l+r)/2);

    if(score_board[m][2] < my.vc.valid_elapse){
      l = m+1;
    }else{
      r = m-1;
    }
  }

  return score_board[l][0];
}

function get_perf(my_rank){
  let ret = null;
  if(0 < my_rank <= contest.performance_list.length){
    ret = contest.performance_list[my_rank-1];
  }

  return ret;
}

// 現時点でのruleをクリア(removeRules)して
chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
  // 新たなruleを追加する
  chrome.declarativeContent.onPageChanged.addRules([{
    conditions: [
      // アクションを実行する条件
      new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {hostEquals: 'atcoder.jp'},
      })
    ],
    // 実行するアクション
    actions: [
      new chrome.declarativeContent.ShowPageAction()
    ]
  }]);
});
