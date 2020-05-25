import React, { PureComponent } from 'react';
import { withRouter } from 'react-router-dom';

import classes from './Upload.module.scss';

import Modal from '../Modal/Modal';
import Input from '../InputComponents/Input';
import List from '../InputComponents/List';
import ListItem from '../InputComponents/ListItem';
import Button from '../Button/Button';
import Icon from '../InputComponents/Icon';
import Checkbox from '../InputComponents/Checkbox';
import Breadcrumb from '../InputComponents/Breadcrumb';

//firebase imports
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/storage';

class Upload extends PureComponent {
  constructor(props) {
    console.log('==============================================')
    console.log('CONSTRUCTOR Upload');
    super(props);
    this.firebaseConfig = {
      apiKey: 'AIzaSyBcmwi6R0CaeY9l1jfEUo0u71MZsVxldKo',
      authDomain: 'react-crud-1db4b.firebaseapp.com',
      databaseURL: 'https://react-crud-1db4b.firebaseio.com',
      projectId: 'react-crud-1db4b',
      storageBucket: 'react-crud-1db4b.appspot.com',
      messagingSenderId: '44556258250',
      appId: '1:44556258250:web:f756e981ee135db270dd33',
      measurementId: 'G-QJZQEZMV2J',
    };
    try {
      console.log('initializing firebase');
      firebase.initializeApp(this.firebaseConfig);
    } catch {
      console.log('already exists...');
    }
    this.uploadRef = React.createRef();
  }

  state = {
    createFolderModal: false,
    createFolderName: '',
    editBreadcrumbModal: false,
    uploadUrlOver: false,
    errorModalMessage: null,
    allFolderList: [],
    firebaseFolders: [], //should store refs of current folder
    firebaseFiles: [], //should store refs of current folder
    placeholderFolders: [], //placeholder folder not in firebase, stores an array of obj {pathRef:, folders:[]}
    checkedFolders: [],
    checkedFiles: [],
    checkedPlaceholderFolders:[],
    mainChecked: false,
    mainIndeterminate: false,
    currentFolderRef: null,
    tempFolderPath: null, //used for when editing in the modal state
    currentFolderDrilldownRefs: [], //for edit modal
    selectedFiles: [], //files added for upload
  };

  componentDidMount() {
    console.log('==============================================')
    console.log('FUNCTION componentDidMount');
    //get from storage folders
    // Get a reference to the storage service, which is used to create references in your storage bucket
    this.storage = firebase.storage();
    this.storageRef = this.storage.ref(); // Create a storage reference from our storage service
    //get id from querystring
    const query = new URLSearchParams(this.props.location.search);
    const id = query.get('id'); //get id in url query params

    let path = this.storageRef;

    if (id) {
      console.log('EXISTS - id: ', id);
      // //current id folder
      path = this.storageRef.child(id);
    } else {
      path = this.storageRef;
    }

    this.changeFolderPath(path);
    this.getAllFolders(path);
  }

  errorConfirmedHandler = () => {
    console.log('==============================================')
    console.log('FUNCTION errorConfirmedHandler');
    this.setState({ errorModal: null });
  };

  //resets state.allFolderList
  getAllFolders = (ref)=>{
    this.setState({allFolderList:[]});
    this.findFoldersForBuild(ref);
  }

  //RECURSIVE - gets all folders from ref onwards saving refs
  findFoldersForBuild = (ref) => {
    console.log('==============================================')
    console.log('FUNCTION findFoldersForBuild, props: ', ref);
    this.setState((prevState) => {
      return { allFolderList: [...prevState.allFolderList, ref] };
    });

    ref.listAll().then((res) => {
      //if the current folder does NOT have folders
      res.prefixes.forEach((folderRef) => {
        this.findFoldersForBuild(folderRef);
      });
    });
  };

  changeFolderPath = (ref) => {
    console.log('==============================================')
    console.log('FUNCTION changeFolderPath, props: ', ref);
    this.setCurrentFolderRef(ref);

    //go through exisiting references, look for current reference (===) the ref from props,
    let index = this.state.currentFolderDrilldownRefs.findIndex((item) => {
      return item === ref;
    });
    console.log('index:', index);

    //if it is found, then slice off from currentFolderDrilldownRefs onwards...(we navigated back)...
    if (index >= 0) {
      //slice() returns new array..
      this.updateFolderDrilldown(ref);
    }
    //else if not found, then add to currentFolderDrilldownRefs.
    else {
      this.addCurrentFolderToDrilldown(ref);
    }
    this.getFolderData(ref);
  };

  addCurrentFolderToDrilldown = (ref) => {
    console.log('==============================================')
    console.log('FUNCTION addCurrentFolderToDrilldown, props:', ref);
    this.setState((prevState) => {
      return {
        currentFolderDrilldownRefs: [
          ...prevState.currentFolderDrilldownRefs,
          ref,
        ],
      };
    });
  };

  editBreadcrumbModal = () => {
    console.log('==============================================')
    console.log('FUNCTION editBreadcrumbModal');
    this.setState((prevState) => {
      return {
        editBreadcrumbModal: true,
        tempFolderPath: prevState.currentFolderRef.location.path, //reset the value when modal is opened
        errorModalMessage: null,
      };
    });
  };

  updateFolderDrilldown = (ref) => {
    console.log('==============================================')
    console.log('FUNCTION updateFolderDrilldown, props:', ref);
    let index = this.state.currentFolderDrilldownRefs.findIndex((item) => {
      return item.location.path === ref.location.path; //comparing object paths
    });
    let updatedFolders = this.state.currentFolderDrilldownRefs.slice(
      0,
      index + 1
    );
    this.setState({ currentFolderDrilldownRefs: updatedFolders });
  };

  setCurrentFolderRef = (ref) => {
    console.log('==============================================')
    console.log('FUNCTION setCurrentFolderRef, props: ', ref)
    this.setState({ currentFolderRef: ref, tempFolderPath: ref.location.path });
  };

  getFolderData = async (ref) => {
    //reset folder first...
    console.log('==============================================')
    console.log('FUNCTION getFolderData, props: ', ref);
    this.setState((prevState) => {
      return {
        ...prevState,
        firebaseFolders: [],
        firebaseFiles: [],
      };
    });
    // //save to state folder ref from firebase storage
    await ref.listAll().then((res) => {
      let folders = [];
      if (res.prefixes.length) {
        res.prefixes.forEach((folderRef) => {
          console.log('folder: ', folderRef.name);
          folders.push(folderRef);
          console.log(
            'folders: ',
            folders.map((item) => {
              return item.name;
            })
          );
        });
      }

      let files = [];
      if (res.items.length) {
        res.items.forEach((itemRef) => {
          // All the items under listRef.
          console.log('file: ', itemRef.name);
          files.push(itemRef);
          console.log(
            'files: ',
            files.map((item) => {
              return item.name;
            })
          );
        });
      }      

      this.setState((prevState) => {
        return {
          ...prevState,
          firebaseFolders: folders,
          firebaseFiles: files,
        };
      });
    });
  };

  addFolderHandler = (event) => {
    console.log('==============================================')
    console.log('FUNCTION addFolderHandler');
    event.preventDefault();
    console.log('this.state.currentFolderRef.location.path:', this.state.currentFolderRef.location.path);
    this.setState({ createFolderModal: true, errorModalMessage: false, createFolderName: ''});
  };

  //new folder needs to be specific for the currentFolderRef
  addFolder = (folderRef) => {
    console.log('===================================');
    console.log('FUNCTION addFolder');
    console.log('this.state.currentFolderRef.location.path:', this.state.currentFolderRef.location.path);
    this.setState((prevState)=>{
      
      //can we find it in firebase?
      console.log('try find in firebaseFolders');
      let foundInFirebaseIndex = prevState.firebaseFolders.findIndex((item)=>{
        console.log('compare - item.name: ', item.name,' | folderRef: ', folderRef.name);
        return item === folderRef;
      });
      console.log('foundInFirebaseIndex: ', foundInFirebaseIndex);

      //if found in firebase...
      if(foundInFirebaseIndex > -1){
        console.log('FOLDER EXISTS');
        this.setState({errorModalMessage: 'Path already exists'});
        return prevState;
      } 

      //current folder match...
      //try find current folder in placeholderFolders...
      

      let placeholderFolderAllExceptMatch = prevState.placeholderFolders.filter(item=>{
        return item.pathRef !== this.state.currentFolderRef;
      });

      let placeholderFolderMatch = prevState.placeholderFolders.find(item=>{
        return item.pathRef === this.state.currentFolderRef;
      });

      let placeholderFolderMatchIndex = prevState.placeholderFolders.findIndex(item=>{  //note placeholderFolders stores object {path:, ref:, folders:[]}
        return item.pathRef === this.state.currentFolderRef;
      });
      
      console.log('placeholderFolderMatchIndex: ', placeholderFolderMatchIndex);
      
      //not found in placeholderFolders?...add!
      if(placeholderFolderMatchIndex === -1){
        console.log('NOT FOUND, adding to pathfolders');
        console.log('folderRef: ', folderRef);
        let obj={pathRef: this.state.currentFolderRef, pathfolders: [folderRef]};
        
        return { placeholderFolders: [...prevState.placeholderFolders, obj], 
        //firebaseAndPlaceholderFolders:firebaseAndPlaceholderFolders, 
        createFolderModal: false}
      }
      //FOUND current folder in placeholderFolders
      else{
        //index in pathfolders
        let foundIndex = prevState.placeholderFolders[placeholderFolderMatchIndex].pathfolders.findIndex((item)=>{
          return item === folderRef;
        });

        //folder found in pathfolders
        if(foundIndex > -1){
          console.log('FOLDER EXISTS');
          this.setState({errorModalMessage: 'Path already exists'});
          return prevState;
        }
        //not found in pathfolders
        else{
          console.log('FOLDER DOES NOT EXIST YET');         
          let isFound = placeholderFolderMatch.pathfolders.findIndex(item=>{
            return item === folderRef;
          });
          if(isFound === -1){
            let updatedFolders = [...placeholderFolderMatch.pathfolders, folderRef];
            placeholderFolderMatch.pathfolders = updatedFolders;
          }
          return { placeholderFolders: [...placeholderFolderAllExceptMatch, placeholderFolderMatch], createFolderModal: false}
        }
      }
    });
  };

  uploadUrlOverHandler = (event) => {
    // console.log('===================================');
    // console.log('FUNCTION uploadUrlOverHandler');
    this.setState({ uploadUrlOver: true });
  };

  uploadUrlOutHandler = (event) => {
    // console.log('===================================');
    // console.log('FUNCTION uploadUrlOutHandler');
    this.setState({ uploadUrlOver: false });
  };

  fileCheckHandler = (index, isChecked, event = null) => {
    console.log('===================================');
    console.log('FUNCTION fileCheckHandler, props: ', index, isChecked);
    console.log('onChangeHandler CLICKED: ', index, isChecked);
    this.setState((prevState) => {
      let files = [...prevState.checkedFiles];
      files[index] = isChecked;
      return { checkedFiles: files };
    }, this.checkIndeterminate);
  };

  folderCheckHandler = (index, isChecked, event = null) => {
    console.log('FUNCTION folderCheckHandler, props: ', index, isChecked);
    console.log('onChangeHandler CLICKED: ', index, isChecked);
    this.setState((prevState) => {
      let folders = [...prevState.checkedFolders];
      folders[index] = isChecked;
      return { checkedFolders: folders };
    }, this.checkIndeterminate);
  };

  placeholderFolderCheckHandler = (index, isChecked, event = null)=>{
    console.log('FUNCTION placeholderFolderCheckHandler, props: ', index, isChecked);
    console.log('onChangeHandler CLICKED: ', index, isChecked);
    this.setState((prevState) => {
      let placeholderFolders = [...prevState.checkedPlaceholderFolders];
      placeholderFolders[index] = isChecked;
      return { checkedPlaceholderFolders: placeholderFolders };
    }, this.checkIndeterminate);
  }

  toggleCheckAllFolders = (isChecked) => {
    console.log('==============================================')
    console.log('FUNCTION toggleCheckAllFolders, props: ', isChecked);
    this.setState((prevState) => {
      let folders = [...prevState.firebaseFolders];
      let result = folders.map((item) => {
        return isChecked;
      });
      console.log('checkAllFolders: ', result);
      return { checkedFolders: result };
    });
  };

  toggleCheckAllFiles = (isChecked) => {
    console.log('==============================================')
    console.log('FUNCTION toggleCheckAllFiles, props: ', isChecked);
    this.setState((prevState) => {
      let files = [...prevState.firebaseFiles];
      let result = files.map((item) => {
        return isChecked;
      });
      console.log('checkedFiles: ', result);
      return { checkedFiles: result };
    });
  };

  toggleMainChecked = (val) => {
    console.log('==============================================')
    console.log('FUNCTION toggleMainChecked, props: ', val);

    this.setState((prevState) => {
      return {
        mainChecked: val ? val : !prevState.mainChecked,
        mainIndeterminate: false,
      };
    });
  };

  getCheckPlaceholderFoldersPathFoldersLength = () => {
    // console.log('==============================================')
    // console.log('FUNCTION getCheckFoldersLength');
    return this.state.checkedPlaceholderFolders.filter((item) => {
      return item === true;
    }).length;
  };

  getCheckFoldersLength = () => {
    // console.log('==============================================')
    // console.log('FUNCTION getCheckFoldersLength');
    return this.state.checkedFolders.filter((item) => {
      return item === true;
    }).length;
  };

  getCheckedFilesLength = () => {
    // console.log('==============================================')
    // console.log('FUNCTION getCheckedFilesLength');
    return this.state.checkedFiles.filter((item) => {
      return item === true;
    }).length;
  };



  checkIndeterminate = () => {
    console.log('==============================================')
    console.log('FUNCTION checkIndeterminate');

    let placeholderFolderMatch = this.state.placeholderFolders.find(item=>{
      return item.pathRef === this.state.currentFolderRef;
    });

    let placeholderFolderMatchIndex = this.state.placeholderFolders.findIndex(item=>{  //note placeholderFolders stores object {path:, ref:, folders:[]}
      return item.pathRef === this.state.currentFolderRef;
    });

    let placeholderFolders = [];
    if(placeholderFolderMatch !== undefined){
      placeholderFolders = this.state.placeholderFolders[placeholderFolderMatchIndex];
    }
    let checkedItems =
      this.getCheckFoldersLength() + this.getCheckedFilesLength() + this.getCheckPlaceholderFoldersPathFoldersLength();
    let allItems = this.state.firebaseFiles.length + this.state.firebaseFolders.length + placeholderFolders.pathfolders.length;

    if (checkedItems === allItems) {
      this.setState({ mainIndeterminate: false, mainChecked: true });
    } else if (checkedItems === 0) {
      this.setState({ mainIndeterminate: false, mainChecked: false });
    } else if (checkedItems < allItems) {
      console.log('INDETERMINATE STATE!!');
      this.setState({ mainIndeterminate: true, mainChecked: true });
    }
  };

  findDuplicateFile = (file) => {
    console.log('==============================================')
    console.log('FUNCTION findDuplicateFile');
    return this.state.selectedFiles.find((existingFile) => {
      const isDuplicate =
        existingFile.name === file.name &&
        existingFile.lastModified === file.lastModified &&
        existingFile.size === file.size &&
        existingFile.type === file.type;
      console.log('IS DUPLICATE? ', isDuplicate);
      return isDuplicate;
    });
  };

  fileChangedHandler = (event) => {
    console.log('==============================================')
    console.log('FUNCTION fileChangedHandler');
    event.preventDefault();
    event.persist();
    const files = event.target.files;

    let existingFiles = [];

    //finds duplicates from current selection
    Array.from(files).forEach((file) => {
      const existingFile = this.findDuplicateFile(file);
      if (existingFile) {
        console.error('Existing file:', existingFile);
        return;
      }
      existingFiles.push(file);
      console.warn('Added file:', file);
    });
    console.log('EXISTING: ', existingFiles);
    this.setState(
      (prevState) => {
        console.log('waypoint1!!!!');
        return {
          selectedFiles: [...prevState.selectedFiles, ...existingFiles],
        };
      },
      () => {
        console.log('waypoint2!!!!');
        console.log('this.state.selectedFiles: ', this.state.selectedFiles);
        this.state.selectedFiles.forEach((item, index) => {
          console.log('uploadHandler item: ', item.name);
          let file = this.state.selectedFiles[index];
          let fileName = this.state.selectedFiles[index].name;
          // console.log('FILE: ', file, '| filename: ', fileName);
          let fileRef = this.state.currentFolderRef.child(fileName);
    
          //using .fullPath
          //let path = fileRef.fullPath; //path is images/{filename}
          //put() takes files via javascript File and Blob api and uploads them to cloud storage
          let uploadTask = fileRef.put(file);
    
          uploadTask.on(
            'state_changed', //or firebase.storage.TaskEvent.STATE_CHANGED
            (snapshot) => {
              var progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log('UPLOAD PROGRESS: ', progress);
            },
            (error) => {
              console.log('error');
            },
            () => {
              //callback after completion
              console.log('uploaded file.');
              this.getFolderData(this.state.currentFolderRef);
            }
          );
        });
      }
    );

    //there is no items to add or remove as upload items go straight to cloud or are removed straight from cloud
    // this.state.selectedFiles.forEach((item, index) => {
    //   this.context.addinput(event, this.props.name, item);
    // });

    //FILEREADER...
    //use file reference by instantiating a FileReader object to read contents into memeory,
    //when load finishes, the reader's onload event is fired
    //and its 'result' attr can be used to access the file data

    //options:
    //FileReader.readAsBinaryString(Blob|File)
    //FileReader.readAsText(Blob|File, opt_encoding)
    //FileReader.readAsDataURL(Blob|File)
    //FileReader.readAsArrayBuffer(Blob|File)
    /*
        Once one of these read methods is called on your FileReader object can be used to track its progress. 
        - onloadstart 
        - onload 
        - onabort 
        - onerror 
        - onloadend 
        */

    // let reader = new FileReader();

    // reader.readAsDataURL(this.state.selectedFiles[i]);
  };

  deleteFolder = async (ref)=>{
    console.log('==============================================')
    console.log('FUNCTION deleteFolder');
    let res = await ref.listAll();
    
    //folders
    if (res.prefixes.length) {
      for(let folder of res.prefixes){
        await this.deleteFolder(folder);
      }
    }
    
    //delete the files
    if (res.items.length) {
      for(let file of res.items){
        await file.delete();
      }
    }

  }

  deleteSelected = (event) => {
    console.log('==============================================')
    console.log('FUNCTION deleteSelected');
    event.preventDefault();
    //go through file refs
    [...this.state.firebaseFiles].forEach((item, index) => {
      //remove checked
      if (this.state.checkedFiles[index] === true) {
        item.delete().then(async () => {
          await this.getFolderData(this.state.currentFolderRef);
          this.setState({
            mainIndeterminate: false,
            mainChecked: false,
            checkedFiles: [],
          });
        });
      }
    });

    //go through folder refs
    [...this.state.firebaseFolders].forEach(async (item, index) => {
      if (this.state.checkedFolders[index] === true) {
        //loop through folder
        await this.deleteFolder(item);//recursively go through folders and delete files
        this.getFolderData(this.state.currentFolderRef);
        
        this.setState({
          mainIndeterminate: false,
          mainChecked: false,
          checkedFolders: [],
        });
      }
    });
  };

  render() {
    console.log('==============================================')
    console.log('FUNCTION render');
    
    //console.log('this.state.currentFolderRef: ', this.state.currentFolderRef);
    //console.log('state.placeholderFolders: ', this.state.placeholderFolders);
    
    //sort out placeholder folders
    let placeholderMatchIndex=-1;
    let pathFolders = [];

    if(this.state.placeholderFolders.length){
      console.log('SOMETHING HERE...')
      placeholderMatchIndex = this.state.placeholderFolders.findIndex((item)=>{
        return (item.pathRef.location.path === this.state.currentFolderRef.location.path);
      });
    }
    console.log('placeholderMatchIndex: ', placeholderMatchIndex);
    
    if(placeholderMatchIndex > -1){
      pathFolders = this.state.placeholderFolders[placeholderMatchIndex].pathfolders;
      
    }
    
    let sortedDOM = [
      
      ...pathFolders.map((item, index)=>{
        console.log('pathfolder:', item);
        let key = this.state.currentFolderRef.location.path+'_placeholderfolder_'+index;
        //console.log('key: ', key);

        return (
          <React.Fragment key={key}>
            <Checkbox
              onChange={(index, checked) =>
                this.placeholderFolderCheckHandler(index, checked)
              }
              index={index}
              checked={this.state.checkedFolders[index]}
            ></Checkbox>
            <ListItem
              aligntype="FlexStart"
              hovereffect={true}
              onClick={() => {
                console.log('CHANGING FOLDER :)');
                this.changeFolderPath(item)
              }}
              title={item.name}
            >
              <Icon iconstyle="far" code="folder" size="lg" />
              <p>{item.name}/</p>
            </ListItem>
          </React.Fragment>
        );
      }),

      ...this.state.firebaseFolders.map((item, index)=>{
          
        let key = this.state.currentFolderRef.location.path+'_folder_'+index;
        //console.log('key: ', key);

        return (
          <React.Fragment key={key}>
            <Checkbox
              onChange={(index, checked) =>
                this.folderCheckHandler(index, checked)
              }
              index={index}
              checked={this.state.checkedFolders[index]}
            ></Checkbox>
            <ListItem
              aligntype="FlexStart"
              hovereffect={true}
              onClick={() => {
                console.log('CHANGING FOLDER :)');
                this.changeFolderPath(item)
              }}
              title={item.name}
            >
              <Icon iconstyle="far" code="folder" size="lg" />
              <p>{item.name}/</p>
            </ListItem>
          </React.Fragment>
        );
      })
    ].sort((a,b)=>{
      var nameA = a.props.children[1].props.title.toLowerCase();
      var nameB = b.props.children[1].props.title.toLowerCase();
      console.log('compare: ', nameA, '| ', nameB);
      if(nameA < nameB){
        return -1;
      }
      if(nameA > nameB){
        return 1;
      }
      return 0;
    })

    //console.log('this.state.firebaseAndPlaceholderFolders: ', this.state.firebaseAndPlaceholderFolders);
    console.log('sortedDOM: ', sortedDOM);

    let currentFolderData = [
      ...sortedDOM,
      //=====================================
      ...this.state.firebaseFiles.map((item, index) => {
        let key = this.state.currentFolderRef.location.path+'_firebaseFiles_'+index;
        //console.log('key: ', key);

        return (
          <React.Fragment key={key}>
            <Checkbox
              onChange={(index, checked) =>
                this.fileCheckHandler(index, checked)
              }
              index={index}
              checked={this.state.checkedFiles[index]}
            ></Checkbox>
            <ListItem
              aligntype="FlexStart"
              hovereffect={true}
              //onClick={() => this.changeFolderPath(item)}
            >
              <Icon iconstyle="far" code="file" size="lg" />
              <p>{item.name}</p>
            </ListItem>
          </React.Fragment>
        );
      }),
    ];
    
    let isIndeterminateClass =
      this.state.mainIndeterminate === true ||
      (this.getCheckFoldersLength() + this.getCheckedFilesLength() ===
        this.state.firebaseFiles.length + this.state.firebaseFolders.length &&
        this.state.firebaseFiles.length + this.state.firebaseFolders.length > 0)
        ? classes.StyleUploadIndeterminate
        : null;

    //console.log('IS INDETERMINATE: ', isIndeterminateClass);

    let isHoverUploadUrl =
      this.state.uploadUrlOver === true
        ? classes.UploadUrlOver
        : classes.UploadUrlOut;

    return (
      <div className={classes.Upload}>
        <div className={[classes.Border].join(' ')}>
          <div
            className={[classes.UploadHeader, isIndeterminateClass].join(' ')}
            onMouseOver={this.uploadUrlOverHandler}
            onMouseOut={this.uploadUrlOutHandler}
          >
            {this.state.mainIndeterminate === true ||
            (this.getCheckFoldersLength() + this.getCheckedFilesLength() ===
              this.state.firebaseFiles.length + this.state.firebaseFolders.length &&
              this.state.firebaseFiles.length + this.state.firebaseFolders.length > 0) ? (
              <React.Fragment>
                <div className={classes.UploadIndeterminate}>
                  <Button
                    type="CheckboxSize"
                    color="White"
                    onClick={(event) => {
                      event.preventDefault();
                      this.toggleMainChecked(false);
                      this.toggleCheckAllFolders(false);
                      this.toggleCheckAllFiles(false);
                    }}
                  >
                    <Icon iconstyle="fas" code="times" size="lg" />
                  </Button>
                  <span>
                    {this.getCheckFoldersLength() +
                      this.getCheckedFilesLength() +
                      ' selected'}
                  </span>
                </div>
                <Button type="Action" onClick={this.deleteSelected}>
                  Delete
                </Button>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <div className={classes.UploadUrl}>
                  <Breadcrumb
                    path={this.state.currentFolderDrilldownRefs}
                    onClick={(ref) => this.changeFolderPath(ref)}
                    onEdit={() => this.editBreadcrumbModal()}
                  ></Breadcrumb>

                  <div
                    className={[classes.Divider, isHoverUploadUrl].join(' ')}
                    title="edit"
                    onClick={() => this.editBreadcrumbModal()}
                  >
                    <Icon iconstyle="fas" code="edit" size="sm" />
                  </div>
                </div>
                <div className={[classes.UploadActionButtons].join(' ')}>
                  <input
                    ref={this.uploadRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={this.fileChangedHandler}
                  />
                  <Button
                    type="Action"
                    onClick={(event) => {
                      event.preventDefault();
                      this.uploadRef.current.click();
                    }}
                    title="upload"
                  >
                    <Icon iconstyle="fas" code="arrow-circle-up" size="lg" />
                    Upload file
                  </Button>
                  <Button
                    type="LastItemRight"
                    onClick={this.addFolderHandler}
                    title="new folder"
                  >
                    <Icon iconstyle="fas" code="folder-plus" size="lg" />
                  </Button>
                </div>
              </React.Fragment>
            )}
          </div>

          <React.Fragment>
            <div className={classes.UploadBodyHeader}>
              <div className={classes.HeaderRow}>
                <Checkbox
                  index={0}
                  checked={this.state.mainChecked}
                  indeterminate={this.state.mainIndeterminate}
                  onChange={() => {
                    this.toggleMainChecked();
                    this.toggleCheckAllFolders(!this.state.mainChecked);
                    this.toggleCheckAllFiles(!this.state.mainChecked);
                  }}
                ></Checkbox>
                <span className={classes.LabelName}>Name</span>
              </div>
            </div>

            <div className={classes.UploadBody}>
              {
                // > 1 because else it is the root node
                this.state.currentFolderDrilldownRefs.length > 1 ? (
                  <div
                    className={[
                      classes.FlexGroupRow,
                      classes.NavigateUpOneFolder,
                    ].join(' ')}
                  >
                    <ListItem
                      aligntype="FlexStart"
                      hovereffect={true}
                      onClick={() => {
                        //get current index on drilldown,
                        let index = this.state.currentFolderDrilldownRefs.findIndex(
                          (item) => {
                            return (
                              item.location.path ===
                              this.state.currentFolderRef.location.path
                            );
                          }
                        );
                        //navigate to index -1

                        this.changeFolderPath(
                          this.state.currentFolderDrilldownRefs[index - 1]
                        );
                      }}
                    >
                      <Icon
                        iconstyle="fas"
                        code="level-up-alt"
                        size="sm"
                        flip="horizontal"
                      />
                      ../
                    </ListItem>
                  </div>
                ) : null
              }

              {currentFolderData.length  ? (
                <List
                  value={{
                    data: currentFolderData,
                  }}
                ></List>
              ) : (
                'There are no files here yet'
              )}
            </div>
          </React.Fragment>
        </div>

        {/* create folder modal for all instances */
        // --------------------------------------------------------------------
        }
        <Modal
          label="Create folder"
          show={this.state.createFolderModal}
          isInteractive={true}
          modalClosed={() => {
            this.setState({ createFolderModal: false });
          }}
          continue={() => {
            console.log('continue');
            const newRef = this.state.currentFolderRef.child(this.state.createFolderName);
            this.addFolder(newRef);
            
          }}
        >
          <Input
            value={{ data: this.state.createFolderName }}
            placeholder="Folder name"
            onChange={(event) => {
              event.preventDefault();
              console.log('typed: ', event.target.value);
              let targetVal = event.target.value;

              this.setState((prevState) => {
                return {
                  errorModalMessage: null,
                  createFolderName: targetVal,
                };
              });
            }}
          />
          <div className={classes.Errors}>{this.state.errorModalMessage}</div>
        </Modal>
        {/* edit folder modal for all instances */
        // --------------------------------------------------------------------
        }
        <Modal
          label="Edit folder path"
          show={this.state.editBreadcrumbModal}
          isInteractive={true}
          modalClosed={() => {
            this.setState({
              editBreadcrumbModal: false,
              errorModalMessage: null,
            });
          }}
          continue={() => {
            console.log('continue');
            //go through directory list
            //navigate if folders exists..
            //ie. check all paths in directory list
            try {
              this.state.allFolderList.forEach((item, index) => {
                console.log(
                  `allFolderList item: index:[${index}]`,
                  item.location.path
                );
                if (item.location.path === this.state.tempFolderPath) {
                  //found in drilldown...so it exists, navigate to it
                  this.changeFolderPath(item);
                  //on continue, navigate to new ref
                  this.setState({
                    editBreadcrumbModal: false,
                    errorModalMessage: null,
                  });
                } else if (
                  this.state.tempFolderPath[
                    this.state.tempFolderPath.length - 1
                  ] === '/'
                ) {
                  console.error('path does not exist');
                  this.setState({
                    errorModalMessage:
                      'Remove trailing "/" character from path',
                  });
                } else {
                  console.error('path does not exist');
                  this.setState({
                    errorModalMessage: 'Path does not exist',
                  });
                }
              });
            } catch {
              //go thru drilldown,
              this.state.currentFolderDrilldownRefs.forEach((item) => {
                //compare to drilldown ref.location.path, if found, that is the new ref

                if (item.location.path === this.state.tempFolderPath) {
                  //found in drilldown...so it exists, navigate to it
                  this.changeFolderPath(item);
                  //on continue, navigate to new ref
                  this.setState({
                    editBreadcrumbModal: false,
                    errorModalMessage: null,
                  });
                } else if (
                  this.state.tempFolderPath[
                    this.state.tempFolderPath.length - 1
                  ] === '/'
                ) {
                  console.error('path does not exist');
                  this.setState({
                    errorModalMessage:
                      'Remove trailing "/" character from path',
                  });
                } else {
                  console.error('path does not exist');
                  this.setState({
                    errorModalMessage: 'Path does not exist',
                  });
                }
              });
            }
          }}
        >
          <Input
            value={{
              data: this.state.tempFolderPath
                ? this.state.tempFolderPath
                : null,
            }}
            placeholder="Folder"
            onChange={(event) => {
              event.preventDefault();
              console.log('typed: ', event.target.value);
              this.setState({ tempFolderPath: event.target.value });
            }}
          />
          <div className={classes.Errors}>{this.state.errorModalMessage}</div>
        </Modal>
      </div>
    );
  }
}
export default withRouter(Upload);
