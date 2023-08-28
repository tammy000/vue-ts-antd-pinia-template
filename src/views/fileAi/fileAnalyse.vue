<template>
  <div class="file-analyse">
    <div class="history-file" :class= '{"isExpend": !collapsed}'>
      <div class="history-file-title">
        <a-tooltip :title="collapsed? '折叠': '收起'" class="expend-btn">
          <a-button type="primary" shape="circle" :icon="h(DoubleLeftOutlined)" v-if="collapsed" @click="collapsed = !collapsed"/>
          <a-button type="primary" shape="circle" :icon="h(DoubleRightOutlined)" v-if="!collapsed" @click="collapsed = !collapsed"/>
        </a-tooltip>
        <FileTextTwoTone class="collapsed-text" :class= '{"isNone": !collapsed}' :two-tone-color="token.colorPrimary" style="font-size: 20px;"></FileTextTwoTone>
        <span class="collapsed-text" :class= '{"isNone": !collapsed}'>文件列表</span>
      </div>
     
      <div class="history-file-list">
        <a-list
          class="demo-loadmore-list"
          :loading="initLoading"
          item-layout="horizontal"
          :data-source="historyFiles"
          :bordered="false"
        >
          <template #renderItem="{ item }">
            <a-list-item :class="{'active': fileView?.fileId === item.fileId}">
              <template #actions>
                <a-popconfirm title="确认删除文件吗？" ok-text="确定" cancel-text="取消" @confirm="deleteFile(item)">
                  <span ><DeleteOutlined style="color: rgba(255, 255, 255, 0.7)"/></span>
                </a-popconfirm>
              </template>
              <a-skeleton avatar :title="false" :loading="!!item.loading" active>
                <a-list-item-meta description=""  @click="handleFile(item)">
                  <template #title>
                    <span class='gpt-ellipsis-row collapsed-text'  :title="item.fileName">{{ item.fileName }}</span>
                  </template>
                  <template #avatar>
                    <a-button class="file-icon" type="link" :icon="item.icon" />
                  </template>
                </a-list-item-meta>
              </a-skeleton>
            </a-list-item>
          </template>
        </a-list>
      </div>
      <div class="history-footer translation" :class= '{"isExpend": !collapsed}'>
        <span><span  class="collapsed-text" :class= '{"isNone": !collapsed}'>版本：</span>1.0.0</span>
      </div>
    </div>
    <div class="content"> 
      <div  v-if="!fileView.fileUrl" style="width: 400px; height: 200px; margin: calc(50vh - 100px) auto 0; border: 1px dashed #ccc;">
        <a-upload-dragger
          v-model:fileList="fileList"
          name="file"
          :before-upload="beforeUpload"
          :custom-request="handleUpload"
          @remove="handleRemove"
        >
          <p class="ant-upload-drag-icon">
            <inbox-outlined></inbox-outlined>
          </p>
          <p class="ant-upload-text">点击或拖拽文件到这个区域上传</p>
          <p class="ant-upload-hint">
            一次仅限上传一个文件，文件格式仅限：PDF,JPG,JPEG,PNG,GIF,BMP
          </p>
          <a-button type="primary">
            <upload-outlined></upload-outlined>
            选择文件
          </a-button>
        </a-upload-dragger>
      </div>
      <!-- <div class="upload-content" v-if="!fileView.fileUrl">
        <a-input-password v-model:value="password" placeholder="请输入文件密码" />
        <a-upload :file-list="fileList" :before-upload="beforeUpload" @remove="handleRemove" :progress="progress">
            <a-button type="primary" :disabled="fileList.length === 1">
              <upload-outlined></upload-outlined>
              选择文件
            </a-button>
          </a-upload>
          <a-button
            type="primary"
            :disabled="fileList.length === 0"
            :loading="uploading"
            @click="handleUpload"
          >
            {{ uploading ? '上传中' : '开始上传' }}
          </a-button>
      </div> -->
      <div class="file-view" v-else>
        <iframe :src="fileView.fileUrl" frameborder="0" width="100%" height="100%"></iframe>
      </div>
      <div class="close-view" v-if='fileView?.fileId'>
        <close-circle-outlined @click="handleFile" />
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
  import {
    FileGifOutlined,
    FileImageOutlined,
    FileJpgOutlined,
    FilePdfOutlined,
    UploadOutlined,
    DoubleRightOutlined,
    DoubleLeftOutlined,
    FileTextTwoTone,
    DeleteOutlined,
    CloseCircleOutlined
  } from '@ant-design/icons-vue'
  import { message, theme } from 'ant-design-vue'
  import { ref, h } from 'vue'
  import type { UploadProps } from 'ant-design-vue';
  // import { encryptByECB } from '@/utils/crypto'
  import {addChat, listChat, deleteChat } from '@/api/index'
  import { fileView } from '@/api/indexModel'


  interface FileItem {
    uid: string
    name?: string
    status?: string
    response?: string
    url?: string
  }

  const { useToken } = theme;
  const { token } = useToken();
  const emit = defineEmits(['fileView']);
  const historyFiles = ref<Array[fileView]>([])
  const collapsed = ref<Boolean>(true)
  const fileList = ref<UploadProps['fileList']>([]);
  const uploading = ref<boolean>(false);
  const password = ref<string>('');
  const fileView = ref<fileView>({});

  const fileTypeIcon = (fileName: String) => {
    const type = fileName.split('.')[fileName.split('.').length - 1].toLocaleLowerCase()
    let icon:any = null
    switch (type) {
      case 'pdf':
        icon = h(FilePdfOutlined);
        break;
      case 'jpeg':
        icon = h(FileJpgOutlined);
        break;
      case 'jpg':
        icon = h(FileJpgOutlined);
        break;
      case 'png':
        icon = h(FileImageOutlined);
        break;
      case 'gif':
        icon = h(FileGifOutlined);
        break;
      case 'bmp':
        icon = h(FilePdfOutlined);
        break;
    }
    return icon
  }

  const getFileList = () => {
    listChat().then(res => {
      historyFiles.value = res.map(v => {
        return {
          ...v,
          key: v.fileId,
          label: v.fileName,
          icon: fileTypeIcon(v.fileName)
        }
      })
      historyFiles.value.splice(10)
    })
  }
  getFileList()

  const beforeUpload: UploadProps['beforeUpload'] = file => {
    fileList.value?.push(file);
    if (['pdf','jpg','jpge','png','gif','bmp'].every(t => file.type.includes(t))) {
      message.error('上传成功！');
      return false
    }
  };

  const handleRemove: UploadProps['onRemove'] = file => {
    const index = fileList.value.indexOf(file);
    const newFileList = fileList.value.slice();
    newFileList.splice(index, 1);
    fileList.value = newFileList;
  };

  const handleUpload = (e) => {
    const formData = new FormData();
    formData.append('file', e.file as any);
    // formData.append('password', encryptByECB(password.value));
    uploading.value = true;
    addChat(formData).then((res) => {
      fileList.value = [];
      // uploading.value = false;
      getFileList()
      handleFile(res)
      message.successt('上传成功！');
    })
    .catch((err) => {
      fileList.value = [];
      // uploading.value = false;
    });
  };

  const handleFile = (fileItem?:{}) => {
    if(!fileItem || fileView.value.fileId === fileItem.fileId) {
      emit('file-view', {});
      fileView.value = {}
    } else {
      emit('file-view', fileItem);
      fileView.value = fileItem
    }
  }

  const deleteFile = (fileItem) => {
    deleteChat({fileId: fileItem.fileId}).then(() => {
      if (fileItem.fileId === fileView.value.fileId) {
        handleFile()
      }
      getFileList()
      message.success('删除成功！');
    })
    .catch((err) => {
      message.success(err || '删除失败！');
    });
  }

  const progress: UploadProps['progress'] = {
    strokeColor: {
      '0%': '#108ee9',
      '100%': '#87d068',
    },
    strokeWidth: 3,
    format: percent => `${parseFloat(percent.toFixed(2))}%`,
    class: 'test',
  };
</script>
<style lang="scss" scoped>
@import "@/styles/variables";
  .file-analyse {
    flex: 1;
    display: flex;
    height: 100%;
    position: relative;
    .history-file {
      width: 250px;
      height: 100%;
      background-color: #fff;
      margin-right: 20px;
      border-radius: 20px;
      padding: 20px 20px 40px;
      box-sizing: border-box;
      position: relative;
      transition: width 0.5s ease-in-out;
      overflow-x: hidden;
      box-shadow: 0 2px 4px #00000012;
      .history-file-title {
        font-size: 18px;
        font-weight: 600;
        height: 30px;
        color: #171616;
        line-height: 25px;
        margin-bottom: 18px;
        position: relative;
        &>span{
          margin-right: 10px;
          
        }
        .expend-btn{
          position: absolute;
          right: 0;
          z-index: 10;
        }
      }
      
      .history-file-list {
        max-height: calc(100% - 50px);
        overflow-y: auto;
        .file-icon {
          font-size: 18px;
          color: $sub-color;
          padding: 0;
          text-align: center;
        }
        :deep{
          .ant-list-item{
            padding: 5px 0;
            border: none;
            position: relative;
            cursor: pointer;
            margin-bottom: 15px;
            overflow-x: hidden;
            transition: all 0.3s ease-in-out;
            border-radius: 8px;
          }

          .ant-list-item.active, .ant-list-item:hover {
            border-radius: 12px;
            background: linear-gradient(100deg, #b0d4f2 0%, #21a2f3 100%);
            position: relative;
            .file-icon{
              color: #fff;
            }
          }
          .ant-list-item-action{
            margin-right: 8px;
            display: none;
            &>li{
              display: block;
              padding: 0;
            }
          }
          .ant-list-item-meta-avatar{
            margin-right: 0;
          }
          .ant-list-item-meta-title{
            color: #333333;
            font-size: 14px;
            font-family: PingFangSC-Regular, PingFang SC;
            font-weight: 400;
            margin: 0;
            line-height: 32px;
            width: 148px;
          }
          .ant-list-item:hover{
            .ant-list-item-action{
              display: block;
            }
          }
        }
      }

      .collapsed-text{
        opacity: 1;
        transition: opacity 0.5s ease-in-out;
      }
      .isNone{
        opacity: 0;
        transition: opacity 0.4s ease-in-out;
      }

    
      .isExpend.translation{
        left: -20px;
      }

      .history-footer {
        position: absolute;
        bottom: 10px;
        left: 20px;
        width: 100%;
        color: rgba(0, 0, 0, 0.25);
        font-size: 12px;
        transition: left 0.5s ease-in-out;
      }

      
    }
    .isExpend{
      :deep{
        .ant-list-item{
          padding: 0!important;
        }
        .ant-list-item:hover{
          .ant-list-item-meta-title{
            display: block;
            margin-left: 5px;
          }
        }
        .ant-list-item-meta-title{
          position: fixed;
          width: auto!important;
          display: none;
          background: linear-gradient(100deg, #b0d4f2 0%, #21a2f3 100%);
          border-radius: 12px;
          line-height: 32px!important;
          padding: 0 15px;
          z-index: 10;
          span{
            white-space: nowrap;
          }
        }
        .ant-list-empty-text{
          width: 34px;
          padding: 0;
          .ant-empty{
            margin-inline: 0;

          }
          .ant-empty-image{
            display: none;
          }
        }
      }
            
    }
    
    .history-file.isExpend{
      width: 72px;
      transition: width 0.5s ease-in-out;
    }
    .content {
      flex: 1;
      
      background: #fff url(../../assets/contentBg.png) no-repeat;
      background-position: center 200px;
      background-size: cover;
      margin-right: 20px;
      border-radius: 20px;
      box-shadow: 0 2px 4px #00000012;
      position: relative;
      .upload-content{
        text-align: center;
        margin: 40vh auto;
        width: 400px;
        display: flex;
        position: relative;
        :deep{
          .ant-input-affix-wrapper{
            width: 200px;
          }
          .ant-upload-wrapper{
            margin: 0 10px;
          }
          .ant-upload-list{
            position: absolute;
          }
        }
      }
      .file-view{
        width: 100%;
        height: 100%;
        border-radius: 20px;
        overflow: hidden;
      }
      .ant-upload-format {
        margin-bottom: 23px;
        font-size: 22px;
      }
      .ant-upload-tip {
        font-size: 14px;
        color: #000;
      }
      .close-view{
        position: absolute;
        top: -5px;
        right: -5px;
        color: $primary-color;
        font-size: 24px;
        width: 24px;
        height: 24px;
        overflow: hidden;
        border-radius: 50%;
        line-height: 24px;
        background: #fff;
        cursor: pointer;
      }
    }
  }
  ::v-deep {
    .ant-upload.ant-upload-drag {
      border: none;
      cursor: auto;
      background: #fff;
      border-radius: 8px;
    }
    .ant-upload.ant-upload-drag:not(.ant-upload-disabled):hover {
      border: none;
    }
  }
  .inner-upload {
    ::v-deep .ant-upload.ant-upload-select.ant-upload-select-text {
      padding: 0;
      margin-top: 30px;
    }
  }
</style>
