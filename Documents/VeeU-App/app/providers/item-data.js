import {Injectable, Inject} from 'angular2/core';
import {Events} from 'ionic-angular';
import {Http, Headers, HTTP_PROVIDERS} from 'angular2/http';
import {UserData} from './user-data';
import {API_ENDPOINT} from '../../app_settings';

import 'rxjs/add/operator/map';


@Injectable()
export class MediaItemData {
  static get parameters(){
    return [[Http], [UserData], [Events]];
  }

  constructor(http, userData, events) {
    // inject the Http provider and set to this instance
    this.http = http;
    this.userData = userData;
    this.events = events;
    this.userID  = 0;
  }

  loadMediaItems(theUserID, numberItemsToGet, feedType){
    // feedType = 'VEEU' | 'ALL' | 'USERS'
    //    VEEU = Feed of unseen images for VEEU page
    //    ALL = All images whether or not they have been seen by this user
    //    USERS = Images this user has submitted
    //    BOOKMARKED = Images this user has bookmarked
    
    // Get user's id
    //alert('about to call veeuID()');
    //let userID = this.userData.veeuID();
    //alert('loadMediaItems for ID='+userID);

    // Setup category string for API call
    var theCategoriesWanted = this.userData.getCategoriesWanted();
    console.log('getcategorieswanted returned: ' + theCategoriesWanted);
    var numItems = 1;
    var fromUser = '';
    // Are we getting the user's submitted items or items they haven't seen?
    if (feedType == 'USERS'){
      numItems = 10; // Max number of items user is allowed to have actively submitted
      fromUser = '&from='+this.userID;
    }
    else if (feedType == 'VEEU'){
      numItems = numberItemsToGet;  // Use the calling parameter
      fromUser = '';
    }

    this.userID = theUserID;
    return new Promise(resolve => {
      this.http.get(API_ENDPOINT+'items/?categories='+theCategoriesWanted+'&num='+numItems+'&user='+this.userID+'&format=json'+fromUser)
          .map(res => res.json())
          .subscribe(
              data => {
                //alert(JSON.stringify(data));
                this.data = data;
                resolve(this.data);
              },
              err => {
                alert("Error! api/items/ failed: "+JSON.stringify(err));
              },
              () => {
                //alert('Complete');
              }
          );
    });
  }
  
  recordLike(itemID, liked){
    // Get user's id
    this.userData.veeuID().then((veeuID) => {
      //alert('inside recordLike this.userData.veeuID().then. itemID= '+itemID+', veeuID='+veeuID);
      this.userID = veeuID;

      let body = JSON.stringify({item_seen: itemID, who_saw: this.userID, liked: liked});
      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      this.http.post(API_ENDPOINT+'seen/ ',
        body, {
          headers: headers
        })
        .map(res => res.json())
        .subscribe(
          data => {
            //alert('DATA returned from SEEN API call: ' + JSON.stringify(data));
          },
          err => {
            alert('ERROR from recordLike() API call: ' + JSON.stringify(err));
          },
          () => {
            //alert('Complete');
          }
        );
    });
  }

  // Empties the record of which items this user has seen
  emptySeenList(){
    //alert('A');
    // Get user's id
    this.userData.veeuID().then((veeuID) => {
      //alert('inside recordLike this.userData.veeuID().then. itemID= '+itemID+', veeuID='+veeuID);
      this.userID = veeuID;
      //alert(veeuID);

      let body = '?item_seen=0&who_saw='+this.userID+'&liked=0&empty=true';
      this.http.delete(API_ENDPOINT+'seen/'+body)
        .subscribe(
          data => {
            //alert('DATA returned from Empty Seen List API call: ' + JSON.stringify(data));
          },
          err => {
            alert('ERROR from emptySeenList() API call: ' + JSON.stringify(err));
          },
          () => {
            //alert('Complete');
          }
        );
    });
  }

  submitImage(url,title,categories,itemType,creditsToApply){
    //alert('stuff');
    // Get user's id
    this.userData.veeuID().then((veeuID) => {
      //alert('inside recordLike this.userData.veeuID().then. itemID= '+itemID+', veeuID='+veeuID);
      this.userID = veeuID;

      // NOTE: Categories must be an array of keyword IDs

      let body = JSON.stringify({url: url,
        owner_id: this.userID,
        title: title,
        keywords: categories,
        item_type: itemType,
        credits_to_apply: creditsToApply});

      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      this.http.post(API_ENDPOINT+'items/ ',
        body, {
          headers: headers
        })
        .map(res => res.json())
        .subscribe(
          data => {
            //alert('DATA returned from SEEN API call: ' + JSON.stringify(data));
            this.events.publish('submitted:success');
          },
          err => {
            alert('ERROR from submitImage() API call: ' + JSON.stringify(err));
          },
          () => {
          }
        );
    });
  }
}
