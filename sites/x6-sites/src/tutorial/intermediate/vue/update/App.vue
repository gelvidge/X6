<template>
  <div class="app-content">
    <div id="container"></div>
    <TeleportContainer />
  </div>
</template>

<script lang="ts">
<<<<<<< HEAD
import { defineComponent } from 'vue'
import ProgressNode from './components/ProgressNode.vue'
=======
import { defineComponent } from 'vue';
import ProgressNode from './components/ProgressNode.vue';
>>>>>>> x6/master
import { Graph } from '@antv/x6'
import { register, getTeleport } from '@antv/x6-vue-shape'

register({
  shape: 'custom-vue-node',
  width: 100,
  height: 100,
  component: ProgressNode,
})
const TeleportContainer = getTeleport()

export default defineComponent({
  name: 'App',
  components: {
<<<<<<< HEAD
    TeleportContainer,
=======
    TeleportContainer
>>>>>>> x6/master
  },
  mounted() {
    const graph = new Graph({
      container: document.getElementById('container')!,
      background: {
        color: '#F2F7FA',
      },
<<<<<<< HEAD
      autoResize: true,
=======
      autoResize: true
>>>>>>> x6/master
    })

    const node = graph.addNode({
      shape: 'custom-vue-node',
      x: 100,
      y: 60,
      data: {
        progress: 80,
<<<<<<< HEAD
      },
=======
      }
>>>>>>> x6/master
    })

    setInterval(() => {
      const { progress } = node.getData()
      node.setData({
        progress: (progress + 10) % 100,
      })
    }, 2000)
<<<<<<< HEAD
  },
})
=======
  }
});
>>>>>>> x6/master
</script>

<style>
.app-content {
  width: 100%;
  height: 240px;
  margin-right: 8px;
  box-shadow: 0 0 10px 1px #e9e9e9;
}
</style>
