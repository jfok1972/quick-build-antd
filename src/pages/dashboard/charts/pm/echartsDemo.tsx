/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

// import { useEffect } from 'react';
// import * as echarts from 'echarts';
// import { useMemo } from 'react';

// export const EchartsDemo = ({ id }: { id: string }) => {
//   let myChart: any;
//   const option = useMemo(
//     () => ({
//       width: '100%',
//       tooltip: {
//         trigger: 'item',
//         formatter: '{a} <br/>{b} : {c} ({d}%)',
//       },
//       legend: {
//         top: '0',
//         left: 'center',
//       },

//       series: [
//         {
//           name: '访问来源',
//           type: 'pie',
//           radius: ['40%', '70%'],
//           top: '15%',
//           avoidLabelOverlap: false,
//           itemStyle: {
//             borderRadius: 5,
//             borderColor: '#fff',
//             borderWidth: 2,
//           },
//           label: {
//             alignTo: 'edge',
//             formatter: '{name|{b}}\n{time|{c} 小时 {d}%}',
//             minMargin: 5,
//             edgeDistance: 10,
//             lineHeight: 15,
//             rich: {
//               time: {
//                 fontSize: 10,
//                 color: '#999',
//               },
//             },
//           },
//           labelLine: {
//             length: 15,
//             length2: 0,
//             maxSurfaceAngle: 80,
//           },
//           labelLayout: (params: any) => {
//             // console.log(params);
//             const isLeft = params.labelRect.x < myChart.getWidth() / 2;
//             const points = params.labelLinePoints;
//             // Update the end point.
//             points[2][0] = isLeft
//               ? params.labelRect.x
//               : params.labelRect.x + params.labelRect.width;
//             return {
//               labelLinePoints: points,
//             };
//           },
//           data: [
//             { value: 150, name: '搜索引擎' },
//             { value: 50, name: '直接访问' },
//             { value: 60, name: '邮件营销' },
//             { value: 70, name: '联盟广告' },
//             { value: 300, name: '视频广告' },
//             { value: 1048, name: '搜索引擎11' },
//             { value: 735, name: '直接访问22' },
//             { value: 580, name: '邮件营销33' },
//             { value: 484, name: '联盟广告44' },
//             { value: 300, name: '视频广告55' },
//           ],
//         },
//       ],
//     }),
//     [],
//   );

//   useEffect(() => {
//     window.addEventListener('resize', () => {
//       console.log('resize');
//       myChart.resize();
//     });
//     const chartDom: any = document.getElementById(id);
//     myChart = echarts.init(chartDom);
//     myChart.setOption(option);
//     return () => {
//       console.log('remove resize');
//       window.removeEventListener('resize', myChart.resize());
//     };
//   }, []);

//   return <div id={id} style={{ minHeight: '430px', height: '100%' }} />;
// };
