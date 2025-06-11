import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, computed, effect, signal} from '@angular/core';
import * as echarts from 'echarts';
import { ScreensizeService } from '../screensize.service';
import { DataService } from '../data.service';

@Component({
  selector: 'app-chart',
  imports: [],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.css'
})
export class ChartComponent implements OnInit, AfterViewInit {
  constructor(private screensize: ScreensizeService, public data: DataService) {
    
    effect(()=>{
      if (this.isDesktop()) {
        this.chartWidth.set(700)
        this.chartHeight.set(525)
      } else if (this.isTablet()) {
        this.chartWidth.set(550)
        this.chartHeight.set(368)
      } else {
        this.chartWidth.set(330)
        this.chartHeight.set(245)
      }
      
      // Resize chart if it exists
      if (this.chart) {
        this.chart.resize();
      }
    })
    
    effect(()=>{
      // Update chart data
      if (this.data.getPlacedItems().length !=0) {
        this.magicNumber1 = this.data.getPlacedItems().length * 100/ (this.data.getPlacedItems().length* this.data.getPlacedItems().length)
        this.magicNumber2 = this.magicNumber1 + Math.random() * 10
        this.choice = this.data.getPlacedItems().length * 50
        this.updateChart();
      }
    })
  }

  @ViewChild('chartContainer') chartContainer!: ElementRef;
  chartWidth = signal(700);
  chartHeight = signal(525);
  private item: any
  private chart: any;
  private dataInterval: any;
  private counter = 0; 
  isMobile = computed(() => this.screensize.screenSize().width < 768);
  isTablet = computed(() => this.screensize.screenSize().width >= 768 && this.screensize.screenSize().width < 1024);
  isDesktop = computed(() => this.screensize.screenSize().width >= 1024);
  choice: number = 50;
  magicNumber1: number = 27;
  magicNumber2: number = 37;

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.initChart();
  }

  ngOnDestroy(): void {
    if (this.dataInterval) {
      clearInterval(this.dataInterval);
    }
    if (this.chart) {
      this.chart.dispose();
    }
  }

  private initChart(): void {
    // Only create chart instance if it doesn't exist
    if (!this.chart) {
      this.chart = echarts.init(this.chartContainer.nativeElement);
    }
    
    this.updateChart();
  }

  private updateChart(): void {
    if (!this.chart) return;
    
    this.counter += 1;
    
    const dummyData = this.generateDummyMeasurementData();
    const { series, yAxis } = this.generateSeriesAndYAxis(dummyData, false);

    const option = {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: series.map(s => s.name)
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'Frequency [Hz]',
        nameLocation: 'middle',
        nameGap: -40,
        minorTick: {
          show: false,
        },
      },
      yAxis,
      series
    };

    // Update chart with new data
    this.chart.setOption(option, {
      notMerge: false,  // Merge with existing options (default behavior)
      lazyUpdate: false, // Update immediately
      silent: false     // Trigger events
    });
  }

  private generateSeriesAndYAxis(data: any[], clear: boolean) {
    const unitToYAxisIndex = new Map<string, number>();
    const yAxis: echarts.YAXisComponentOption[] = [];
    const series: echarts.SeriesOption[] = [];

    const getYAxisName = (unit: string) => {
      if (unit === '°' || unit.toLowerCase() === 'deg') return 'Phase [°]';
      if (unit.toLowerCase() === 'ohm') return 'Magnitude [Ω]';
      return `Magnitude (${unit})`;
    };

    for (const v of data) {
      let yAxisIndex: number;
      if (!unitToYAxisIndex.has(v.unit)) {
        yAxisIndex = yAxis.length;
        unitToYAxisIndex.set(v.unit, yAxisIndex);

        yAxis.push({
          type: 'value',
          name: getYAxisName(v.unit),
          nameLocation: 'middle',
          nameGap: 25,
          position: yAxisIndex === 0 ? 'left' : 'right',
          offset: yAxisIndex > 1 ? (yAxisIndex - 1) * 40 : 0,
          splitLine: {
            show: yAxisIndex === 1,
          },
        });
      } else {
        yAxisIndex = unitToYAxisIndex.get(v.unit)!;
      }

      const xyPairs = this.generateXYPairs(
        v.values,
        v.measurementInfo.config.min_frequency,
        v.measurementInfo.config.max_frequency,
        v.frequencyStep
      );

      series.push({
        name: !clear
          ? `${v.name},`
          : `${v.name}`,
        type: 'line',
        data: xyPairs,
        yAxisIndex,
        showSymbol: false,
        // Add animation configuration
        animation: true,
        animationDuration: 1000,
        animationEasing: 'cubicOut'
      });
    }

    return { yAxis, series };
  }

  private generateXYPairs(
    yValues: number[],
    minFreq: number,
    maxFreq: number,
    freqStep: number
  ): [number, number][] {
    minFreq = minFreq * 1000;
    maxFreq = maxFreq * 1000;

    return yValues
      .map((v, i) => [i * freqStep, v])
      .filter(v => v[0] >= minFreq && v[0] <= maxFreq) as [number, number][];
  }
  
  private generateDummyMeasurementData() {
    const count = 600;
    const freqStep = 1000; // Hz
    const minFreq = 1; // kHz
    const maxFreq = (minFreq + count * (freqStep / 1000))/5; // 101 kHz
  
    const targetBase = 200; // Nominal impedance
    const noise = () => Math.random() * this.choice - Math.random()*10; // ±4 Ω noise for smoothness
  
    // Frequency array for reference (in kHz)
    const frequencies = Array.from({ length: count }, (_, i) => minFreq + i * (freqStep / 1000));
  
    // Target values: Smooth, natural waves with multiple frequencies
    const targetValues = Array.from({ length: count }, (_, i) => {
      const slowWave = Math.sin(i / 25 + 0.5) * 10; // Slow wave, ±10 Ω
      const mediumWave = Math.sin(i / 10 + 1.2) * 6; // Medium wave, ±6 Ω
      const fastWave = Math.sin(i / 4 + 0.8) * 3; // Fast wave, ±3 Ω
      const longTrend = Math.cos(i / 50) * 8; // Long-term trend, ±8 Ω
  
      return Math.max(targetBase + slowWave + mediumWave + fastWave + longTrend + noise(), 10);
    });
  
    // Actual values: Deviate with waves, increasing trends, and chaos at high frequencies
    const actualValues = Array.from({ length: count }, (_, i) => {
      const freq = frequencies[i];
      const baseWave = Math.sin(i / 6 + 0.3) * 12; // Base wave, ±12 Ω
      const harmonic1 = Math.cos(i / 4 + 1.5) * 8; // Harmonic, ±8 Ω
      const harmonic2 = Math.sin(i / 8 + 2.0) * 5; // Smaller harmonic, ±5 Ω
      const microWave = Math.sin(i / 2.5 + 0.7) * 3; // High-freq wave, ±3 Ω

      let deviation = baseWave + harmonic1 + harmonic2 + microWave;
      let additionalNoise = Math.random() * 600; // Base noise ±6 Ω

      if (freq < this.magicNumber1) {
        // Before magicNumber1 kHz: Close to target with subdued waves
        deviation *= 0.5; // Reduce wave amplitude
        additionalNoise = Math.random() * 4; // Smaller noise
      } else if (freq < this.magicNumber2) {
        // magicNumber1-magicNumber2 kHz: Steadily increasing with amplified waves
        const progressFactor = (freq - this.magicNumber1) / (this.magicNumber2 - this.magicNumber1); // 0 to 1
        const trendIncrease = Math.sin(progressFactor * Math.PI / 2) * 50; // Non-linear trend, up to +50 Ω
        const waveAmplification = 1 + progressFactor * 1.2; // Amplify waves
        deviation = deviation * waveAmplification + trendIncrease;
        additionalNoise = Math.random() * (8 + progressFactor * 8); // Increasing noise
      } else {
        // From magicNumber2 kHz: High impedance with chaotic, strong waves
        const progressFactor = Math.min((freq - this.magicNumber2) / (maxFreq - this.magicNumber2), 1); // Normalize
        const majorTrend = 80 + Math.pow(progressFactor, 2) * 120; // Quadratic trend, up to +200 Ω
        const waveAmplification = 1.8 + progressFactor * 1.5; // Strong wave amplification
        const chaosWave = Math.sin(i / 3 + Math.PI / 2) * 15 * (1 + progressFactor); // Chaotic wave
        const highFreqWave = Math.cos(i / 2 + 1.0) * 10 * progressFactor; // High-freq chaos
        deviation = deviation * waveAmplification + majorTrend + chaosWave + highFreqWave;
        additionalNoise = Math.random() * (15 + progressFactor * 20); // Stronger noise
      }

      return Math.max(targetValues[i] + deviation + additionalNoise, 10); // Ensure positive
    });
  
    return [
      {
        id: 'target',
        name: 'Target Magnitude',
        measurementId: 'meas_target',
        timestamp: new Date().toISOString(),
        measurementInfo: {
          name: 'Nominal Impedance',
          config: {
            min_frequency: minFreq,
            max_frequency: maxFreq
          }
        },
        values: targetValues,
        frequencyStep: freqStep,
        unit: 'Ω',
        color: 'red'
      },
      {
        id: 'actual',
        name: 'Actual Magnitude',
        measurementId: 'meas_actual',
        timestamp: new Date().toISOString(),
        measurementInfo: {
          name: 'Measured Impedance',
          config: {
            min_frequency: minFreq,
            max_frequency: maxFreq
          }
        },
        values: actualValues,
        frequencyStep: freqStep,
        unit: 'Ω',
        color: 'blue'
      }
    ];
  }
}

interface Device {
  id: string;
  name: string;
  randomFactor: number;
}