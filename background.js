"use strict";

class ContestInfo{
  constructor(penalty = 300){
    this.error = true;
    this.url = null;
    this.name = null;
    this.duration = null;
    this.penalty = penalty;
    this.taskNum = null;
    this.entryCount = 0;
    this.ratedEntryCount = 0;

    this.finalScores = null;
    this.finalRatedScores = null;
    this.performances = null;
    this.isRatedList = null;

    this.realtimeInd = 0;
    this.submissions = null;
    this.realtimeScores = null;
    this.realtimeElapsed = null;
  }

  initialize(penalty = 300){
    this.error = true;
    this.url = null;
    this.name = null;
    this.duration = null;
    this.penalty = penalty;
    this.taskNum = null;
    this.entryCount = 0;
    this.ratedEntryCount = 0;

    this.finalScores = null;
    this.finalRatedScores = null;
    this.performances = null;
    this.isRatedList = null;

    this.realtimeInd = 0;
    this.submissions = null;
    this.realtimeScores = null;
    this.realtimeElapsed = null;
  }

  initializeRealtime(){
    this.realtimeInd = 0;

    this.realtimeScores = [];
    this.realtimeElapsed = [];
    for(let i = 0; i < this.entryCount; i++){
      this.realtimeScores[i] = 0;
      this.realtimeElapsed[i] = 0;
    }
  }

  async setAsyncData(){

    this.error = false;
    await Promise.all([this.#fetchPerformances(), this.#fetchStandings()])
    .then(responses => {
      this.performances = responses[0];

      this.finalScores = responses[1].finalScores;
      this.finalRatedScores = responses[1].finalRatedScores;

      this.entryCount = responses[1].entryCount;
      this.ratedEntryCount = responses[1].ratedEntryCount;
      this.isRatedList = responses[1].isRatedList;

      this.taskNum = responses[1].taskNum;
      this.submissions = responses[1].submissions;

      this.initializeRealtime();

      //バーチャル参加する自分の分参加人数加算
      this.entryCount++;
      this.ratedEntryCount++;
    })
    .catch(e => {
      this.error = true;
      this.url = null;
      console.log(e);
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
      //暫定的に最下位のパフォーマンスの半分を当てはめる
      if(performances.length > 0){
        performances.push(parseInt(performances[performances.length-1]/2));
      }
    })
    .catch(error => {
      console.log(error);
    });

    return performances;
  }

  async #fetchStandings(){
    let ret = {
      submissions : [],
      finalScores : [],
      finalRatedScores : [],
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

      ret.entryCount = 0;
      for(let standings of standingsData.StandingsData){
        ret.entryCount++;

        ret.finalScores.push([
          standings.TotalResult.Score / 100
          , standings.TotalResult.Elapsed / 1000000000]
        );

        let tmpTasksAcScore = [];
        for(let key in standings.TaskResults){
          const task = standings.TaskResults[key];

          if(task.Score <= 0){
            continue;
          }

          tmpTasksAcScore.push({elapsed : task.Elapsed / 1000000000
            , penalty : task.Penalty
            , score : task.Score/100}
          );
        }

        //ペナルティを問題ごとに累積で付与する
        tmpTasksAcScore.sort((a, b) => a.elapsed - b.elapsed);
        let nowElp = 0, cntPenalty = 0;
        for(let task of tmpTasksAcScore){
          cntPenalty += task.penalty;
          let nextElp = task.elapsed + cntPenalty * this.penalty;
          let timeDiff = nextElp - nowElp;
          nowElp = nextElp;

          ret.submissions.push({key : task.elapsed
            , id : ret.entryCount-1
            , score : task.score
            , timeDifference : timeDiff
          });
        }

        ret.isRatedList.push(standings.IsRated);

        if(!standings.IsRated){
          continue;
        }

        ret.ratedEntryCount++;

        ret.finalRatedScores.push([
          standings.TotalResult.Score / 100
          , standings.TotalResult.Elapsed / 1000000000]
        );
      }


      //門番の追加
      ret.finalScores.push([-1, 1000000000]);
      ret.finalRatedScores.push([-1, 1000000000]);
    })
    .catch(error => {
      this.error = true;
      this.url = null;
      console.log(error);
    });


    ret.submissions.sort((a, b) => a.key - b.key);
    return ret;
  }

  getPerformance(ratedRank){
    let ret = this.performances[ratedRank-1];

    if(!ret){
      ret = this.performances[this.performances.length-1];
    }
    return ret;
  }

  recalcMyRanks(myScore, myElapse){
    if(myElapse == 0){
      return this.#recalcMyRealtimeRankZero();
    }else{
      return this.#recalcMyRealtimeRankAny(myScore, myElapse);
    }
  }

  #recalcMyRealtimeRankZero(){
    let ret = {
      realtimeRank : 1,
      realtimeRatedRank : 1
    }

    for(let i = 0; i < this.realtimeScores.length; i++){
      if(this.realtimeScores[i] > 0){
        ret.realtimeRank++;

        if(this.isRatedList[i]){
          ret.realtimeRatedRank++;
        }
      }
    }

    return ret;
  }

  #recalcMyRealtimeRankAny(myScore, myElapse){
    let ret = {
      realtimeRank : 1,
      realtimeRatedRank : 1
    }

    for(let i = 0; i < this.realtimeScores.length; i++){
      let upperScore = this.realtimeScores[i] > myScore;
      let sameScoreFastTime = (this.realtimeScores[i] == myScore) && (this.realtimeElapsed[i] < myElapse);
      if(upperScore || sameScoreFastTime){
        ret.realtimeRank++;

        if(this.isRatedList[i]){
          ret.realtimeRatedRank++;
        }
      }
    }

    return ret;
  }

  fitTo(currentElapse, myScore, myElapse){
    let ret = {
      realtimeRankDifference : 0,
      realtimeRatedRankDifference : 0
    }
      console.log('fitTo:' + currentElapse);

    let fbt = this.#fitBackwardTo(currentElapse, myScore, myElapse);
    let fft = this.#fitForwardTo(currentElapse, myScore, myElapse);

    console.log(fbt);
    console.log(fft);

    ret.realtimeRankDifference = fbt.realtimeRankDifference + fft.realtimeRankDifference;
    ret.realtimeRatedRankDifference = fbt.realtimeRatedRankDifference + fft.realtimeRatedRankDifference;


    console.log(ret);
    return ret;
  }

  #fitForwardTo(currentElapse, myScore, myElapse){
    let ret = {
      realtimeRankDifference : 0,
      realtimeRatedRankDifference : 0
    }

      if(currentElapse < 0){
        currentElapse = 1e9;
      }

      while(this.realtimeInd < this.submissions.length){
        const tmp = this.submissions[this.realtimeInd];

        if(tmp.key >= currentElapse){
          break;
        }

        const oldScore = this.realtimeScores[tmp.id];
        const oldElapsed = this.realtimeElapsed[tmp.id];
        const newScore = oldScore + tmp.score;
        const newElapsed = oldElapsed + tmp.timeDifference;

        const needToMoveMyRank = this.#isRankLowerThanYours(oldScore, oldElapsed, myScore, myElapse) && this.#isRankHigherThanYours(newScore, newElapsed, myScore, myElapse);
        console.log(needToMoveMyRank);
        if(needToMoveMyRank){
          ret.realtimeRankDifference++;

          if(this.isRatedList[tmp.id]){
            ret.realtimeRatedRankDifference++;
          }
        }

        this.realtimeScores[tmp.id] = newScore;
        this.realtimeElapsed[tmp.id] = newElapsed;

        this.realtimeInd++;
      }

      return ret
  }

  #fitBackwardTo(currentElapse, myScore, myElapse){
    let ret = {
      realtimeRankDifference : 0,
      realtimeRatedRankDifference : 0
    }

    if(currentElapse < 0){
      currentElapse = 1e9;
    }

    while(this.realtimeInd-1 >= 0){
      const tmp = this.submissions[this.realtimeInd-1];
      if(tmp.key <= currentElapse){
        break;
      }

      const oldScore = this.realtimeScores[tmp.id];
      const oldElapsed = this.realtimeElapsed[tmp.id];
      const newScore = oldScore - tmp.score;
      const newElapsed = oldElapsed - tmp.timeDifference;

      const needToMoveMyRank = this.#isRankLowerThanYours(newScore, newElapsed, myScore, myElapse) && this.#isRankHigherThanYours(oldScore, oldElapsed, myScore, myElapse);

      if(needToMoveMyRank){
        ret.realtimeRankDifference--;

        if(this.isRatedList[tmp.id]){
          ret.realtimeRatedRankDifference--;
        }
      }

      contestInfo.realtimeScores[tmp.id] = newScore;
      contestInfo.realtimeElapsed[tmp.id] = newElapsed;
      contestInfo.realtimeInd--;
    }

    return ret
  }

  #isRankLowerThanYours(score, elapsed, myScore, myElapse){
    if(score < myScore){
      return true;
    }else if(score > myScore){
      return false;
    }else{
      if(elapsed < myElapse){
        return false;
      }else{
        return true;
      }
    }
  }

  #isRankHigherThanYours(score, elapsed, myScore, myElapse){
    if(score > myScore){
      return true;
    }else if(score < myScore){
      return false;
    }else{
      if(elapsed < myElapse){
        return true;
      }else{
        return false;
      }
    }
  }

  getResults(){
    let ret = {
      error : this.error,
      taskNum : this.taskNum,
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
    this.delay = Date.now();
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

    let updatedMyVcScore;
    if(this.delay <= Date.now()){
      this.delay = Date.now()+3800;
      updatedMyVcScore = await this.#fetchMyVcScore();

      if(updatedMyVcScore.elapse === null){
        this.initialize(this.userName);
        contestInfo.error = true;
        contestInfo.initializeRealtime();
        return;
      }else if(updatedMyVcScore.elapse < this.vc.elapse){
        this.initializeRealtime(this.userName);
        contestInfo.initializeRealtime();
      }else if(updatedMyVcScore.elapse === 0){
        this.initialize(this.userName);
        contestInfo.initializeRealtime();
      }

      this.vc.elapse = updatedMyVcScore.elapse;

      if(this.vc.score !== updatedMyVcScore.score && this.vc.elapse !== 0){
        this.vc.score = updatedMyVcScore.score;
        this.vc.validElapse = updatedMyVcScore.validElapse;
        this.vc.acceptedNum = updatedMyVcScore.acceptedNum;
        this.vc.endTime = updatedMyVcScore.endTime;
        this.vc.penalty = updatedMyVcScore.penalty;

        this.finalRank = this.#getFinalRank();
        this.finalRatedRank = this.#getFinalRatedRank();
        this.finalPerf = contestInfo.getPerformance(this.finalRatedRank);

        if(this.vc.elapse > 0){
          contestInfo.fitTo(this.vc.elapse, this.vc.score, this.vc.validElapse);

          console.log(contestInfo.recalcMyRanks(this.vc.score, this.vc.validElapse));

          let myRanks = contestInfo.recalcMyRanks(this.vc.score, this.vc.validElapse);
          this.realtimeRank = myRanks.realtimeRank;
          this.realtimeRatedRank = myRanks.realtimeRatedRank;
        }

      }
    }else{
      if(this.vc.elapse > 0){
        this.vc.elapse++;
      }
    }

    if(this.vc.elapse <= 0){
      this.initializeRealtime();
      return;
    }

    let ft = contestInfo.fitTo(this.vc.elapse, this.vc.score, this.vc.validElapse);
    this.realtimeRank += ft.realtimeRankDifference;
    this.realtimeRatedRank += ft.realtimeRatedRankDifference;

    this.realtimePerf = contestInfo.getPerformance(this.realtimeRatedRank);
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
        contestInfo.error = true;
      });

      return ret;
  }

  #getFinalRank(){
    return this.#binSearchRank(contestInfo.finalScores);
  }

  #getFinalRatedRank(){
    return this.#binSearchRank(contestInfo.finalRatedScores);
  }

  #binSearchRank(scoreBoard){

    if(!scoreBoard){
      return null;
    }

    let l = 0;
    let r = scoreBoard.length-1;
    while(l <= r){
      const m = Number.parseInt((l+r)/2);

      if(this.#isLessBinSearch(m, scoreBoard)){
        r = m-1;
      }else{
        l = m+1;
      }
    }

    return l+1;
  }

  #isLessBinSearch(ind, scoreBoard){
    if(scoreBoard[ind][0] < this.vc.score){
      return true;
    }else if(scoreBoard[ind][0] > this.vc.score){
      return false;
    }else{
      if(scoreBoard[ind][1] >= this.vc.validElapse){
        return true;
      }else{
        return false;
      }
    }
  }

  initializeRealtime(){
    this.realtimeRank = null;
    this.realtimeRatedRank = null;
    this.realtimePerf = null;

    contestInfo.initializeRealtime();
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
  constructor(){
    this.displayRated = 0;
    this.displayFinalPop = 0;
    this.displayFinalCon = 0;
  }

  setDisplayRated(displayRated){
    this.displayRated = displayRated;
  }
  setDisplayFinalPop(displayFinalPop){
    this.displayFinalPop = displayFinalPop;
  }
  setDisplayFinalCon(displayFinalCon){
    this.displayFinalCon = displayFinalCon;
  }

  getResults(){
    let ret = {
      displayRated: this.displayRated,
      displayFinalPop: this.displayFinalPop,
      displayFinalCon: this.displayFinalCon
    }
    return ret;
  }
}
const opt_acvc = new Opt_acvc();

let timerSendContent;
let senderVcTabId;

function testFitTo(time){
  myInfo.fitBackwardTo(time);
  myInfo.fitForwardTo(time);

  if(this.vc.score === 0){
    this.updateMyRealtimeRankZero();
  }else{
    this.updateMyRealtimeRankAny();
  }

  return contestInfo;
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
   if(request.mode === "setContest"){
     if(!timerSendContent){
       timerSendContent = setInterval(async function(){
         await myInfo.update();

         if(contestInfo.error){
           myInfo.initialize(myInfo.userName);
         }

         let accept_vc_url = /^https:\/\/atcoder.jp\/contests\/[^/]+\/standings\/virtual$/;
         let valid_vc_url = request.now_url.match(accept_vc_url);
         if(valid_vc_url){
           senderVcTabId = sender.tab.id;
         }

         if(senderVcTabId){
           chrome.tabs.sendMessage(senderVcTabId, ['refreshScoreAcvc', getResults()]);
         }
        }, 1000);
      }

     if(contestInfo.error | (contestInfo.url !== request.contest_url)){
       contestInfo.url = request.contest_url;
       const urlSplit = request.contest_url.split('/');
       contestInfo.name = urlSplit[urlSplit.length-1].toUpperCase();
       contestInfo.duration = request.contest_duration;
       myInfo.initialize(request.user_name);

       await contestInfo.setAsyncData();
     }

     if(contestInfo.error){
       contestInfo.initialize();
       clearInterval(timerSendContent);
       return;
     }

     //await myInfo.update();

     chrome.tabs.sendMessage(sender.tab.id, ['refreshScoreAcvc', getResults()]);
   }else if(request.mode === "update"){
     await myInfo.update();

     if(contestInfo.error){
       myInfo.initialize(myInfo.userName);
       return;
     }
   }else if(request.mode === "opt_rated"){
     opt_acvc.setDisplayRated(request.displayRated);
   }else if(request.mode === "opt_final_pop"){
     opt_acvc.setDisplayFinalPop(request.displayFinalPop);
   }else if(request.mode === "opt_final_content"){
     opt_acvc.setDisplayFinalCon(request.displayFinalCon);
   }

   return;
});

function getResults(){
  return {contest : contestInfo.getResults(), my : myInfo.getResults(), opt : opt_acvc.getResults()};
}
