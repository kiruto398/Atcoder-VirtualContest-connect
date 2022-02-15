"use strict";

class ContestInfo{
  constructor(penalty = 300){
    this.error = true;
    this.url = null;
    this.name = null;
    this.duration = null;
    this.penalty = penalty;
    this.taskNum = null;
    this.tackScores = null;
    this.entryCount = 0;
    this.ratedEntryCount = 0;
    this.finalScores = null;
    this.finalRatedScores = null;
    this.performances = null;
    this.isRatedList = null;
    this.tasksAcElapses = null;
    this.indexOfTasksAcElapses = null;
    this.realtimeScores = null;
    this.isUnderSameScores = null;
  }

  initializeRealtime(){
    this.indexOfTasksAcElapses.fill(0);
    this.realtimeScores.fill(0);
    this.isUnderSameScores.fill(false);
  }

  async setAsyncData(){

    this.error = false;
    await Promise.all([this.#fetchPerformances(), this.#fetchStandings()])
    .then(responses => {
      this.performances = responses[0];

      this.finalScores = responses[1].finalScores;
      this.finalRatedScores = responses[1].finalRatedScores;
      this.tasksAcElapses = responses[1].tasksAcElapses;
      this.isRatedList = responses[1].isRatedList;
      this.entryCount = responses[1].entryCount;
      this.ratedEntryCount = responses[1].ratedEntryCount;
      this.taskNum = responses[1].taskNum;

      this.indexOfTasksAcElapses = new Array(this.taskNum).fill(0);
      this.realtimeScores = Array(this.entryCount).fill(0);
      this.isUnderSameScores = Array(this.entryCount).fill(false);

      this.entryCount++;
      this.ratedEntryCount++;
    })
    .catch(e => {
      this.error = true;
      this.url = null;
      this.loading = false;
    });

  }

  async #fetchPerformances(){
    let performances = [];
    await fetch(this.url + '/results/json')
    .then(response => {
      return response.json();
    })
    .then(results => {

      let cnt = 0;
      for(let i = 0, len = results.length; i < len; i++){
        const result = results[i];
        if(result.IsRated == false){
          continue;
        }
        cnt++;

        let perf = result.Performance;
        if(perf < 400){
          perf = Math.round(400.0 / Math.exp((400.0-perf) / 400));
        }

        performances.push(perf);
      }

      //コンテスト本番の最下位以下の順位には
      //最下位のパフォーマンスの半分を当てはめる
      if(performances.length > 0){
        performances.push(parseInt(performances[performances.length-1]/2));
      }

      console.log('perfCount: ' + cnt);
    })
    .catch(error => {
      console.log(error);
    });

    return performances;
  }

  async #fetchStandings(){
    let ret = {
      finalScores : [],
      finalRatedScores : [],
      tasksAcElapses : [],
      isRatedList : [],
      entryCount : 0,
      ratedEntryCount : 0,
      taskNum : null
    };

    await fetch(this.url + '/standings/json')
    .then(response => {
      return response.json();
    })
    .then(standingsData => {

      ret.taskNum = standingsData.TaskInfo.length;
      let taskName2Index = {};
      for(let i = 0, len = ret.taskNum; i < len; i++){
        ret.tasksAcElapses[i] = [];
        taskName2Index[standingsData.TaskInfo[i].TaskScreenName] = i;
      }

      ret.entryCount = standingsData.StandingsData.length;
      for(let i = 0; i < ret.entryCount; i++){
        const standings = standingsData.StandingsData[i];

        if(ret.finalScores.length === 0 | (ret.finalScores[ret.finalScores.length-1] != standings.Rank)){
          ret.finalScores.push([standings.Rank
            , standings.TotalResult.Score / 100
            , standings.TotalResult.Elapsed / 1000000000]);
        }

        let tmpTasksAcScore = [];
        const taskKeys = Object.keys(standings.TaskResults);
        for(let j = 0, lenTaskKeys = taskKeys.length; j < lenTaskKeys; j++){
          const task = standings.TaskResults[taskKeys[j]];
          if(task.Score <= 0){
            continue;
          }
          tmpTasksAcScore.push({elapsed : task.Elapsed / 1000000000
            , penalty : task.Penalty
            , ind : taskName2Index[taskKeys[j]]
            , addingScore : task.Score/100})
        }

        //ペナルティを問題ごとに累積で付与する
        tmpTasksAcScore.sort((a, b) => a.elapsed - b.elapsed);
        let countPenalty = 0;
        for(let j = 0, len = tmpTasksAcScore.length; j < len; j++){
          const task = tmpTasksAcScore[j];
          countPenalty += task.penalty;

          ret.tasksAcElapses[task.ind].push({key : i
            , elapsed : task.elapsed + countPenalty*this.penalty
            , addingScore : task.addingScore});
        }

        ret.isRatedList.push(standings.IsRated);

        if(!standings.IsRated){
          continue;
        }

        ret.ratedEntryCount++;

        if(ret.finalRatedScores[ret.finalRatedScores.length-1] != standings.Rank){
          ret.finalRatedScores.push([ret.ratedEntryCount
            , standings.TotalResult.Score / 100
            , standings.TotalResult.Elapsed / 1000000000]);
        }
      }


      //門番の追加
      ret.finalScores.push([ret.entryCount+1, -1, 1000000000]);
      ret.finalRatedScores.push([ret.ratedEntryCount, -1, 1000000000]);
    })
    .catch(error => {
      this.error = true;
      this.url = null;
      console.log(error);
    });

    for(let i = 0, len = ret.tasksAcElapses.length; i < len; i++){
      ret.tasksAcElapses[i].sort((a, b) => a.elapsed - b.elapsed);
    }
    return ret;
  }

  getResults(){
    let ret = {
      error : this.error,
      duration : this.duration,
      entryCount : this.entryCount,
      ratedEntryCount : this.ratedEntryCount,
      name : this.name
    }

    return ret;
  }
}
const contestInfo = new ContestInfo();

class MyInfo{
  constructor(){
    this.userName = null;

    this.finalRank = null;
    this.finalRatedRank = null;
    this.finalPerf = null;
    this.realtimeRank = null;
    this.realtimeRatedRank = null;
    this.realtimePerf = null;
    this.vc = {
        endTime : null,
        acceptedNum : null,
        score : null,
        validElapse : null,
        elapse : null
    }
  }

  initialize(userName = null){
    this.userName = userName;

    this.finalRank = null;
    this.finalRatedRank = null;
    this.finalPerf = null;
    this.realtimeRank = null;
    this.realtimeRatedRank = null;
    this.realtimePerf = null;
    this.vc = {
        endTime : null,
        acceptedNum : null,
        score : null,
        validElapse : null,
        elapse : null,
        penalty : null
    }
  }

  async update(){
    if(contestInfo.error){
      return;
    }

    const updatedMyVcScore = await this.#fetchMyVcScore();
    if(!updatedMyVcScore.elapse){
      this.initialize(this.userName);
      return;
    }else if(updatedMyVcScore.elapse < this.vc.elapse){
      this.initializeRealtime(this.userName);
      contestInfo.initializeRealtime();
    }

    this.vc.elapse = updatedMyVcScore.elapse;

    if(this.vc.score !== updatedMyVcScore.score){
      this.vc.score = updatedMyVcScore.score;
      this.vc.validElapse = updatedMyVcScore.validElapse;
      this.vc.acceptedNum = updatedMyVcScore.acceptedNum;
      this.vc.endTime = updatedMyVcScore.endTime;
      this.vc.penalty = updatedMyVcScore.penalty;

      this.finalRank = this.#getFinalRank();
      this.finalRatedRank = this.#getFinalRatedRank();
      this.finalPerf = contestInfo.performances[this.finalRatedRank-1];
      if(!this.finalPerf){
        this.finalPerf = contestInfo.performances[contestInfo.performances.length-2];
      }

      if(this.vc.elapse > 0){
        this.#fitBackwardTo(this.vc.validElapse);
        this.#fitForwardTo(this.vc.validElapse);

        if(this.vc.score === 0){
          this.#updateMyRealtimeRankZero();
        }else{
          this.#updateMyRealtimeRankAny();
        }
      }
    }

    if(this.vc.elapse <= 0){
      this.initializeRealtime();
      contestInfo.initializeRealtime();
      return;
    }

    this.#fitForwardTo(this.vc.elapse + this.vc.penalty*contestInfo.penalty);
    this.realtimePerf = contestInfo.performances[this.realtimeRatedRank-1];
    if(!this.realtimePerf){
      this.realtimePerf = contestInfo.performances[contestInfo.performances.length-2];
    }
  }

  async #fetchMyVcScore(){
    let ret = {
      score : null,
      validElapse : null,
      elapse : null,
      acceptedNum : null,
      endTime : null,
      penalty : null
    };

    await fetch(contestInfo.url + '/standings/virtual/json')
      .then(response => {
        return response.json();
      })
      .then(virtualStandings => {

        for(let i = 0, len = virtualStandings.StandingsData.length; i < len; i++){

          if(virtualStandings.StandingsData[i].UserScreenName !== this.userName){
            continue;
          }


          const data = virtualStandings.StandingsData[i];

          ret.elapse = data.Additional['standings.virtualElapsed'];
          if(ret.elapse > 0){
            ret.elapse /= 1000000000;


            if(contestInfo.duration){
              let end_time = new Date();
              end_time.setSeconds(end_time.getSeconds() - ret.elapse);
              end_time.setSeconds(0);
              end_time.setMilliseconds(0);
              end_time.setMinutes(end_time.getMinutes() + contestInfo.duration);
              ret.endTime = end_time;
            }
          }

          ret.score = data.TotalResult.Score/100;
          ret.validElapse = data.TotalResult.Elapsed/1000000000;
          ret.acceptedNum = data.TotalResult.Accepted;
          ret.penalty = data.TotalResult.Penalty;
          break;
        }

      })
      .catch( e => {
        console.log(e);
      });

      return ret;
  }

  #getFinalRank(){
    const ret = this.#binSearchRank(contestInfo.finalScores);
    return ret;
  }

  #getFinalRatedRank(){
    const ret = this.#binSearchRank(contestInfo.finalRatedScores);
    return ret;
  }

  #binSearchRank(scoreBoard){

    if(!scoreBoard){
      return null;
    }

    let l = 0;
    let r = scoreBoard.length-1;
    while(l <= r){
      const m = Number.parseInt((l+r)/2);
      if(this.vc.score === scoreBoard[m][1]){
        if(this.vc.validElapse === scoreBoard[m][2]){
          return scoreBoard[m][0];
        }else if(this.vc.validElapse < scoreBoard[m][2]){
          r = m-1;
        }else{
          l = m+1;
        }
      }else if(this.vc.score > scoreBoard[m][1]){
        r = m-1;
      }else{
        l = m+1;
      }
    }

    return scoreBoard[l][0];
  }

  #updateMyRealtimeRankZero(){
    this.realtimeRank = 1;
    this.realtimeRatedRank = 1;
    for(let i = 0; i < contestInfo.realtimeScores.length; i++){
      if(contestInfo.realtimeScores[i] > this.vc.score){
        this.realtimeRank++;
        contestInfo.isUnderSameScores[i] = false;

        if(contestInfo.isRatedList[i]){
          this.realtimeRatedRank++;
        }
      }else{
        contestInfo.isUnderSameScores[i] = true;
      }
    }
  }

  #updateMyRealtimeRankAny(){
    this.realtimeRank = 1;
    this.realtimeRatedRank = 1;
    for(let i = 0; i < contestInfo.realtimeScores.length; i++){
      if(contestInfo.realtimeScores[i] >= this.vc.score){
        this.realtimeRank++;

        if(contestInfo.isRatedList[i]){
          this.realtimeRatedRank++;
        }
      }

      contestInfo.isUnderSameScores[i] = false;
    }
  }

  #fitForwardTo(currentElapse){
    console.log('fitForwardTo:' + currentElapse);

      if(currentElapse < 0){
        currentElapse = 1e9;
      }

      for(let i = 0; i < contestInfo.taskNum; i++){
        while(contestInfo.indexOfTasksAcElapses[i] < contestInfo.tasksAcElapses[i].length){
          const tmp = contestInfo.tasksAcElapses[i][contestInfo.indexOfTasksAcElapses[i]];

          if(tmp.elapsed >= currentElapse){
            break;
          }


          if(contestInfo.isUnderSameScores[tmp.key]){
            this.realtimeRank++;

            if(contestInfo.isRatedList[tmp.key]){
              this.realtimeRatedRank++;
            }
          }else if((contestInfo.realtimeScores[tmp.key] < this.vc.score) && (this.vc.score < contestInfo.realtimeScores[tmp.key] + tmp.addingScore)){
            this.realtimeRank++;

            if(contestInfo.isRatedList[tmp.key]){
              this.realtimeRatedRank++;
            }
          }

          contestInfo.realtimeScores[tmp.key] += tmp.addingScore;

          if(contestInfo.realtimeScores[tmp.key] == this.vc.score){
            contestInfo.isUnderSameScores[tmp.key] = true;
          }else{
            contestInfo.isUnderSameScores[tmp.key] = false;
          }

          contestInfo.indexOfTasksAcElapses[i]++;
        }
      }

  }

  #fitBackwardTo(currentElapse){
    console.log('fitBackwardTo:' + currentElapse);
    for(let i = 0; i < contestInfo.taskNum; i++){
      while(contestInfo.indexOfTasksAcElapses[i]-1 >= 0){
        const tmp = contestInfo.tasksAcElapses[i][contestInfo.indexOfTasksAcElapses[i]-1];
        if(tmp.elapsed < currentElapse){
          break;
        }

        contestInfo.realtimeScores[tmp.key] -= tmp.addingScore;
        contestInfo.indexOfTasksAcElapses[i]--;
      }
    }
  }

  initializeRealtime(){
    this.realtimeRank = null;
    this.realtimeRatedRank = null;
    this.realtimePerf = null;

    contestInfo.indexOfTasksAcElapses.fill(0);
    contestInfo.realtimeScores.fill(0);
    contestInfo.isUnderSameScores.fill(false);
  }

  getResults(){
    let ret = {
      elapse : this.vc.elapse,
      validElapse : this.vc.validElapse,
      endTime : this.vc.endTime,
      acceptedNum : this.vc.acceptedNum,
      score : this.vc.score,
      finalRank : this.finalRank,
      finalRatedRank : this.finalRatedRank,
      finalPerf : this.finalPerf,
      realtimeRank : this.realtimeRank,
      realtimeRatedRank : this.realtimeRatedRank,
      realtimePerf : this.realtimePerf
    }

    return ret;
  }
}
const myInfo = new MyInfo();

class Opt_acvc{
  constructor(displayRank = 0){
    this.displayRank = displayRank;
  }

  setDisplayRank(displayRank){
    this.displayRank = displayRank;
  }

  getResults(){
    let ret = {
      displayRank: this.displayRank
    }
    return ret;
  }
}
const opt_acvc = new Opt_acvc();

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
   if(request.mode === "content"){
     if(contestInfo.error | (contestInfo.url !== request.contest_url)){
       contestInfo.url = request.contest_url;
       const urlSplit = request.contest_url.split('/');
       contestInfo.name = urlSplit[urlSplit.length-1];
       contestInfo.duration = request.contest_duration;
       myInfo.initialize(request.user_name);

       await contestInfo.setAsyncData();
     }

     await myInfo.update();

     if(!myInfo.vc.elapse){
       return;
     }

     const accept_vc_url = /^https:\/\/atcoder.jp\/contests\/.+\/standings\/virtual$/;
     const valid_vc_url = request.now_url.match(accept_vc_url);
     if(!valid_vc_url){
       return;
     }

     chrome.tabs.sendMessage(sender.tab.id, getResults());
   }else if(request.mode === "popup"){
     await myInfo.update();

     if(contestInfo.error){
       myInfo.initialize(myInfo.userName);
       return;
     }
   }else{
     opt_acvc.setDisplayRank(request.displayRank);
   }

   return;
});

function getResults(){
  return {contest : contestInfo.getResults(), my : myInfo.getResults(), opt : opt_acvc.getResults()};
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
