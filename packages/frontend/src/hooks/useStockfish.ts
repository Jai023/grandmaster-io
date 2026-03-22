import { useState, useRef, useCallback, useEffect } from 'react';
import { analyzePosition, terminateWorker } from '../workers/stockfishWorker';
import type { AnalysisResult } from '@grandmaster-io/shared';

export interface UseStockfishReturn {
  analyze: (fen: string, depth?: number) => Promise<AnalysisResult>;
  isAnalyzing: boolean;
  lastResult: AnalysisResult | null;
  hardwareConcurrency: number;
}

export function useStockfish(): UseStockfishReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<AnalysisResult | null>(null);
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const analyzeRef = useRef(analyzePosition);

  useEffect(() => {
    analyzeRef.current = analyzePosition;
    return () => {
      terminateWorker();
    };
  }, []);

  const analyze = useCallback(async (fen: string, depth = 15): Promise<AnalysisResult> => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeRef.current(fen, depth);
      setLastResult(result);
      return result;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return { analyze, isAnalyzing, lastResult, hardwareConcurrency };
}
