export interface Recipe {
  id: number
  name: string
  tags: string[]
  time: string
  ingredients: string[]
  steps: string[]
  nutrition: string
  icon: string
}

export const RECIPES: Recipe[] = [
  {
    id: 1,
    name: '韭菜饺子',
    tags: ['中式', 'Mia最爱', '冷冻'],
    time: '25分钟',
    ingredients: ['韭菜饺子皮 1包', '韭菜 1把', '猪肉馅 200g', '姜末', '酱油', '香油'],
    steps: ['韭菜切碎加肉馅调味', '包饺子', '水煮或煎至金黄'],
    nutrition: '蛋白质丰富，碳水适中',
    icon: '🥟',
  },
  {
    id: 2,
    name: '意大利肉酱面',
    tags: ['意式', 'Marcus最爱', '快手'],
    time: '20分钟',
    ingredients: ['意面 1包', '意面酱 1罐', '牛肉馅 150g', '洋葱', '大蒜'],
    steps: ['煮意面', '炒肉馅+洋葱+蒜', '加意面酱煮5分钟', '拌匀'],
    nutrition: '高碳水，蛋白质中等',
    icon: '🍝',
  },
  {
    id: 3,
    name: '照烧鸡腿饭',
    tags: ['日式', 'Marcus最爱', '快手'],
    time: '25分钟',
    ingredients: ['鸡腿 2个', '酱油 2勺', '味醂 1勺', '糖 1勺', '大米'],
    steps: ['鸡腿煎至两面金黄', '加酱油+味醂+糖收汁', '配米饭'],
    nutrition: '高蛋白，适合运动恢复',
    icon: '🍗',
  },
  {
    id: 4,
    name: '葱油拌面',
    tags: ['中式', 'Mia最爱', '快手'],
    time: '15分钟',
    ingredients: ['面条 200g', '小葱 5根', '酱油 2勺', '糖 半勺', '植物油'],
    steps: ['煮面', '小葱切段炸至焦香', '拌入酱油+糖', '浇在面上'],
    nutrition: '碳水为主，清淡',
    icon: '🍜',
  },
  {
    id: 5,
    name: '煎牛排',
    tags: ['西式', '高蛋白', '快手'],
    time: '15分钟',
    ingredients: ['牛排 1块', '盐', '黑胡椒', '黄油', '蒜'],
    steps: ['牛排室温回温', '热锅大火煎每面2分钟', '加黄油+蒜调味', '静置3分钟切片'],
    nutrition: '高蛋白低碳水，Michelle首选',
    icon: '🥩',
  },
  {
    id: 6,
    name: '日式饭团',
    tags: ['日式', 'Marcus最爱', '快手'],
    time: '15分钟',
    ingredients: ['大米 1碗', '海苔', '三文鱼/金枪鱼', '盐'],
    steps: ['米饭稍凉', '手沾盐水捏成三角形', '放入馅料', '包海苔'],
    nutrition: '碳水+蛋白质均衡',
    icon: '🍙',
  },
  {
    id: 7,
    name: '锅贴',
    tags: ['中式', 'Mia最爱'],
    time: '20分钟',
    ingredients: ['饺子皮', '猪肉馅 200g', '白菜', '姜', '酱油'],
    steps: ['拌馅', '包锅贴', '平底锅煎至底部金黄', '加水盖盖焖熟'],
    nutrition: '蛋白质+碳水均衡',
    icon: '🥟',
  },
  {
    id: 8,
    name: '烤羊排',
    tags: ['西式', '高蛋白'],
    time: '30分钟',
    ingredients: ['羊排 2块', '迷迭香', '大蒜', '橄榄油', '盐', '黑胡椒'],
    steps: ['羊排腌制15分钟', '烤箱200°C烤15分钟', '翻面再烤5分钟'],
    nutrition: '高蛋白，铁质丰富',
    icon: '🍖',
  },
]
