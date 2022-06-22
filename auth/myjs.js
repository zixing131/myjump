
var stationdata={}  
new Vue({
    data: function () {
        return {
            inputValue: '',
        showData: [],
        mouseKey: '',
        showitem:{},
        isShowSearch: false, //显示搜索详情区域
        isControlShow: true,
            isloading:true, 
            isShowResultSearch:false,
            recommendedData:[]
        }
    },methods: {  
        getSearch(text)
        {
            let keyWord = this.inputValue
            this.isShowResultSearch=false 
            this.getAccurateSearch(keyWord)
        },
        showSearch (text)
        {
            this.isShowResultSearch=false 
            if (this.inputValue == '') {
                this.isShowSearch = false
                //this.showData = this.recommendedData
              } else {
                // 输入字段没有匹配到信息,隐藏下拉框
                if (this.showData.length == 0) {
                  this.isShowSearch = false
                } else {
                  this.isShowSearch = true
                }
              }
      
        },
        hideSearch (text)
        {
            this.showData.length == 0 ? this.isShowSearch = false : ''
            this.isControlShow ? '' : this.isShowSearch = false
        },
          // 点击的时候隐藏搜索详情区域
      aHideSearch2() {
        this.isShowSearch = false
      },
      // 鼠标移入搜索详情区域的时候改变文字颜色
      getSearchList(e) {
        this.mouseKey = e
        this.isControlShow = true
      },
      // 鼠标移出搜索详情区域的时候清空文字颜色
      clearSearchList() {
        this.mouseKey = ''
        this.isControlShow = false
      }, 
      ShowSearchData(item)
      {
        this.showitem=item
        this.isShowResultSearch=true 
        this.isShowSearch = false
        this.showData=[]
      },
      filterCount( count, text) { 
       var elements=[];
         for(var m=0;m<stationdata.length;m++){  
             el=stationdata[m] 
          if (el.n.indexOf(text)>=0) {
            elements.push(el);
          }
          if (elements.length >= count) {
            break;
          }
        } 
        return elements;
      },
      getAccurateSearch(text) { 
        let keyWord = this.inputValue
        this.isShowResultSearch=false 
          that = this;
            return new Promise(function(resolve, reject) { 
                try{ 
                    if(keyWord)
                    {
                        var arr = that.filterCount( 50,keyWord); 
                          // showData:展示的数据 
                          that.showData = arr
                          // 聚焦输入框的时候，没有输入字段，先展示推荐内容
                          that.inputValue == '' ? that.showData = that.recommendedData : ''
                          // 输入字段有匹配到信息，显示下拉框，没有则隐藏下拉框
                          //console.log( that.showData.length )
                          that.showData.length == 0 ? that.isShowSearch = false : that.isShowSearch = true  
                    }  
                }
                catch(err)
                {
                    reject(err)
                }
            }); 
  },
  getRomoteZipFile(){
            return new Promise(function(resolve, reject) {
                            //  step1 请求文件
                            JSZipUtils.getBinaryContent("./data/data.zip", function(err, data) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(data);
                                }
                            });
                        })
                        .then(function(files) {
                            //  step2 解压
                            return JSZip.loadAsync(files);
                        })
                        .then((files) => {  
                            files.files['data.json'].async("string").then(data=>{ 
                                stationdata=JSON.parse(data); 
                            }); 
                        })
            }
    },
    el: '#app',
    mounted() {
        this.getRomoteZipFile();
    }
})
