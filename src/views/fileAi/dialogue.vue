<template>
  <div class="dialogue-container">
    <div class="dialogue-header">
      <img
        :src="iconLogo"
        width="40"
        class="animate__animated animate__bounce animate__repeat-2 animate__slow"
      />
      <span class="message-tip" v-if="tipLoading">
        <atom-spinner
          :animation-duration="1000"
          :size="30"
          color="#ff1d5e"
        />
        <span>{{ tipMessage }}</span>
      </span>
    </div>
    <div class="dialogue-content">
      <a-List item-layout="horizontal" :data-source="dialogueList" :split="false">
        <template #renderItem="{ item }">
          <a-list-item v-if="item.role === 'assistant'" :id="item.aiRowNumber">
            <a-list-item-meta>
              <template #title>
                <span v-if="item.type === 'other'">
                  <div>您的文件没有匹配预设模版，将进入普通问答模式。若您认为解析有误，请选择正确的模版类型：</div><br />
                  <a-button v-for="k in Object.keys(item.content)" :key="k" @click="handleUpdateTag(k, item.content[k])">{{ item.content[k] }}</a-button>
                </span>
                <span v-else-if="item.type">
                  <div v-for="k in Object.keys(item.content)" :key="k">
                    <span v-if="typeof item.content[k] === 'string' ">
                      <span class="item-label">{{ k }}:</span>
                      <span class="item-value">{{ item.content[k] }}</span>
                    </span>
                    <span v-else-if="typeof item.content[k] === 'object'">
                      <br/>
                      <span class="item-label">{{ k }}:<br/></span>
                      <span v-for="i in item.content[k]" :key="i.industryName">
                        <span class="item-label">{{ i.key }}:</span>
                        <span class="item-value">{{ i.value }}</span>
                        <br/>
                      </span>
                      <br/>
                    </span>
                  </div>
                </span>
                <span v-else>{{ item.content }}</span>
              </template>
              <template #description>
                <span>{{ item.addTime }}</span>
              </template>
            </a-list-item-meta>
          </a-list-item>
          <a-list-item v-if="item.role === 'Loading'" :id="item.aiRowNumber">
            <a-list-item-meta>
              <template #title>
                <span>
                  {{ item.content }}
                  <hollow-dots-spinner
                    :animation-duration="1500"
                    :dot-size="6"
                    :dots-num="3"
                    color="#ff1d5e"
                    style="display: inline-block"
                  />
                </span>
              </template>
            </a-list-item-meta>
          </a-list-item>

          <a-list-item v-if="item.role === 'user'" class="dialogue-right">
            <a-list-item-meta>
              <template #title>
                <span><span class="arrow-right"></span>{{ item.content }}</span>
              </template>
              <template #description v-if="item.addTime">
                <span>{{ item.addTime }}</span>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-List>
      <div class="question-item">
        <a-space warp>
          <a-popover title="常见问题">
            <template #content>
              <p class="quesiton-list" v-for="q in questionList" @click="hanldeQuestion(q)">
                <search-outlined />{{ q }}
              </p>
            </template>
            <question-circle-outlined />
          </a-popover>
          <a-popover title="数据导出">
            <template #content>
              <p>请选择需要下载的文件页数</p>
              <div>
                <span class="page-con">
                  从第<a-input-number v-model:value="pageStart" size="small" :min="1" :max="100000" />页-第
                  <a-input-number v-model:value="pageEnd" size="small" :min="1" :max="100000" />页
                </span>
                <a-button type="primary" size="small" @click="downLoadTable" :loading="tipLoading">下载</a-button>
              </div>
            </template>
            <table-outlined />
          </a-popover>
          <a-tooltip title="清空记录">
            <delete-outlined @click="clearDialogue"/>
          </a-tooltip>
        </a-space>
        <div class="textarea-item">
          <a-textarea
            class="text-in"
            v-model:value="messageValue"
            placeholder="请输入问题"
            allow-clear
            :auto-size="{ minRows: 3, maxRows: 3 }"
            @pressEnter="submitMessage"
          />
          <a-button
            class="btn-send"
            type="primary"
            shape="circle"
            :icon="h(SendOutlined)"
            @click="submitMessage"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
  import { ref, h, watch, reactive } from 'vue'
  import {
    DeleteOutlined,
    QuestionCircleOutlined,
    SendOutlined,
    SearchOutlined,
    TableOutlined
  } from '@ant-design/icons-vue'
  import iconLogo from '@/assets/logo.png'
  import { message } from 'ant-design-vue'
  import { HollowDotsSpinner, AtomSpinner } from 'epic-spinners'
  import { completionChat, historyChat, questionsChat, historyClear, updateTag, tableExcel } from '@/api/index'

  interface fileView {
    fileId: string
    fileName: string
    fileType: string
    fileUrl: string
    ossKey: string
    fileSize: string
    fileMd5: string
    vectorId: string
    isDeleted: number
    addBy: string
    addTime: string
    updatedBy: string
    updatedTime: string
  }

  interface DialogueList {
    role: string
    aiRowNumber: string
    content: string
    addTime?: string | undefined
    fileId?: string
    type?: string
  }
  const props = defineProps({
    fileView: Object as PropType<fileView>
  })

  const messageValue = ref<string>('')
  const questionList = ref([])
  const pageStart = ref('')
  const pageEnd = ref('')
  const tipLoading = ref<Boolean>(false)
  const tipMessage = ref('')
  const initAssistant = [
    {
      role: 'assistant',
      aiRowNumber: 'AI0',
      content: '您好！我是您的小管家， 可以帮助您获取信息并给出一些建议。^_^',
    }
  ]
  let dialogueList = reactive<DialogueList[]>(initAssistant)


  watch(() => props.fileView, (val) => {
    dialogueList.splice(1, dialogueList.length);
    if(props.fileView?.fileTag) {
      const fileTagObj = JSON.parse(props.fileView?.fileTag)
      if (fileTagObj.type) {
        dialogueList.push({
          role: 'assistant',
          type: fileTagObj.type,
          aiRowNumber: `AI${dialogueList.length}`,
          content: fileTagObj.detail || fileTagObj.all_report_types
        })
        if (fileTagObj?.summary) {
          dialogueList.push({
            role: 'assistant',
            aiRowNumber: `AI${dialogueList.length}`,
            content: fileTagObj.summary
          })
        }
      }
    }
    if(props.fileView?.fileId) {
      getHostoryMes()
    }
  })

  // 系统触发对话
  const hanldeQuestion = (item: string) => {
    messageValue.value = item
    submitMessage()
  }

  // 获取历史对话记录
  const getHostoryMes = () => {
    if (!props?.fileView?.fileId) {
      message.warning('请先选择要解析的文件！')
      return
    }
    historyChat({fileId: props?.fileView?.fileId}).then(res => {
      dialogueList = reactive(initAssistant)
      res.forEach(v => {
        dialogueList.push(v)
      });
      scrollIntoAI()
    })
  }

  // 获取预设常见问题列表
  const getQuestionsChat = () => {
    questionsChat().then((res) => {
      questionList.value = res
    })
  }
  getQuestionsChat()

  // 更新标签，重新获取新的内容
  const handleUpdateTag = (key: string, value: string) => {
    dialogueList.push({
      role: 'user',
      aiRowNumber: `AI${dialogueList.length}`,
      content: value
    })
    dialogueList.push({
      role: 'Loading',
      aiRowNumber: `AI${dialogueList.length}`,
      content: `解析中`
    })
    scrollIntoAI()
    updateTag({
      fileId: props?.fileView?.fileId,
      type: key
    }).then((res) => {
      if(res?.fileTag) {
        const fileTagObj = JSON.parse(res?.fileTag)
        if (fileTagObj.type) {
          dialogueList.pop()
          dialogueList.push({
            role: 'assistant',
            type: fileTagObj.type,
            aiRowNumber: `AI${dialogueList.length}`,
            content: fileTagObj.detail || fileTagObj.all_report_types
          })
        }
      }
    }).catch((err) => {
      messageValue.value = ''
      dialogueList.pop()
      dialogueList.push({
        role: 'assistant',
        aiRowNumber: `AI${dialogueList.length}`,
        content: '不好意思，小管家未能及时获取您要的信息' + err.message
      })
    });
  }

  // 下载文件中的表格数据
  const downLoadTable = () => {
    if (!props?.fileView?.fileId) {
      message.warning('请先选择要下载的文件！')
      return
    }
    tipLoading.value = true
    tipMessage.value = '下载中...'
    tableExcel({
      fileId:props?.fileView?.fileId,
      pageNums: [pageStart.value, pageEnd.value]
    }).then((res) => {
      message.success('文件下载成功！');
      tipLoading.value = false
      pageStart.value = ''
      pageEnd.value = ''
    }).catch((err) => {
      tipLoading.value = false
    })
  }

  // 提交问话
  const submitMessage = () => {
    if (!props?.fileView?.fileId) {
      message.warning('请先选择要解析的文件！')
      return
    }
    if (!messageValue.value) {
      message.warning('请输入要问的问题！')
      return
    }
    dialogueList.push({
      role: 'user',
      aiRowNumber: `AI${dialogueList.length}`,
      content: messageValue.value
    })
    dialogueList.push({
      role: 'Loading',
      aiRowNumber: `AI${dialogueList.length}`,
      content: `解析中`
    })
    scrollIntoAI()
    completionChat({
      fileId: props?.fileView?.fileId,
      language: '',
      message: messageValue.value
    }).then((res) => {
      messageValue.value = ''
      dialogueList.pop()
      dialogueList.push({
        role: 'assistant',
        aiRowNumber: `AI${dialogueList.length}`,
        content: res
      })
      scrollIntoAI()
    }).catch((err) => {
      messageValue.value = ''
      dialogueList.pop()
      dialogueList.push({
        role: 'assistant',
        aiRowNumber: `AI${dialogueList.length}`,
        content: '不好意思，小管家未能及时获取您要的信息' + err.message
      })
    });
  }

  const clearDialogue = () => {
    dialogueList.splice(1, dialogueList.length);
    if (dialogueList.length > 1) {
      historyClear({
        fileId: props?.fileView?.fileId,
        language: '',
        message: messageValue.value
      }).then(res => {
        message.success('历史已清空！');
      })
    } else {
      message.info('暂无对话历史！');
    }
  }

  const scrollIntoAI = () => {
    const idNumber = dialogueList.length - 1
    setTimeout(() => {
      const targetElement = document.getElementById(`AI${idNumber}`)
      // 使用 scrollIntoView() 方法滚动到锚点目标
      targetElement?.scrollIntoView({ behavior: 'smooth' })
    })
  }
 
</script>
<style lang="scss" scoped>
  @import '@/styles/variables';
  .dialogue-container {
    width: 30%;
    height: calc(100% - 40px);
    background: #fff;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 2px 4px #00000012;
    .dialogue-header {
      margin-bottom: 20px;
      display: flex;
      img{
        width: 32px;
      }
      .message-tip{
        flex: 1;
        text-align: center;
        height: 32px;
        line-height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(0, 0, 0, 0.55);
        font-size: 13px;
        .atom-spinner{
          display: inline-block;
        }
        
      }
    }
    :deep(.ant-btn) {
      margin-right: 10px;
    }
    .dialogue-content {
      width: 100%;
      height: calc(100% - 52px);
      background: linear-gradient(0deg, #fff 0%, rgba(226, 244, 255, 0.5) 100%);
      border-radius: 4px;
      position: relative;
      overflow: auto;
      :deep {
        .ant-list {
          padding: 0 20px 120px;
        }
        .ant-list-item {
          padding-left: 0;
          padding-right: 0;
        }
        .ant-list-item-meta-content {
          max-width: 75%;

          border-radius: 8px;
          .ant-list-item-meta-title {
            padding: 10px;
            margin: 0;
            font-size: 14px;
            font-family:
              PingFangSC-Regular,
              PingFang SC;
            font-weight: 400;
            color: $content-color;
            line-height: 20px;
            word-wrap:break-word;
            position: relative;
            // box-shadow: 0 2px 8px #00000026;
            border-end-end-radius: 20px;
            border-end-start-radius: 20px;
            border-start-end-radius: 20px;
            border: 1px solid transparentize($sub-color-bg, 0.3);
            background: transparentize($sub-color-bg, 0.95);
          }
          .ant-list-item-meta-description {
            text-align: center;
            margin: 10px;
            color: rgba(0, 0, 0, 0.3);
          }
        }
        .dialogue-right {
          justify-content: flex-end;
          .ant-list-item-meta {
            justify-content: end;
          }
          .ant-list-item-meta-title {
            background: transparentize($primary-color, 0.8);
            border-start-start-radius: 20px;
            border-start-end-radius: 0;
            border: 1px solid $primary-color;
          }
        }
      }
      .question-item {
        position: fixed;
        bottom: 35px;
        // display: flex;
        width: calc(30% - 32px);
        height: 90px;
        background: #f8f9fb;
        padding: 10px;

        .textarea-item {
          display: flex;
        }
        .text-in {
          textarea {
            background: transparent;
          }
        }
        .btn-send {
          transform: rotate(-90deg);
          margin-right: 0;
        }
        :deep {
          .ant-space .anticon {
            color: rgba(0, 0, 0, 0.55);
            font-size: 16px;
            &:hover {
              color: $primary-color;
            }
          }

          .ant-input-affix-wrapper {
            flex: 1;
            background: transparent;
            textarea {
              background: transparent;
              border: none;
            }
          }
        }
        button {
          margin-left: 10px;
          box-shadow: 0 2px 4px #00000026;
        }
      }
    }
    .Ai-avatar {
      display: inline-block;
      width: 40px;
      height: 40px;
      background: #1a1478;
      border-radius: 4px;
      text-align: center;

      img {
        width: 70%;
        margin-top: 5px;
      }
    }
    .item-value{
      margin-inline-start: 10px;
      font-weight: 600;
    }
  }
  .quesiton-list {
    cursor: pointer;
    color: $content-color;
    .anticon {
      margin-right: 5px;
    }
    &:hover {
      color: $primary-color;
    }
  }

  :deep{
    .page-con{
      margin-right: 10px;
      .ant-input-number{
        width: 60px;
        margin: 0 5px;
        margin-bottom: 10px;
      }
    }
  }
</style>
